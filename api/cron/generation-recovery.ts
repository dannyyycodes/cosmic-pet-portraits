// Vercel cron: recover stranded generation_log rows.
//
// The frontend polling effect in StudioFlow.tsx gives up after MAX_POLLS
// (5 minutes) and tells the customer "we'll keep your credit safe." This
// cron is what makes that promise true.
//
// Two failure modes this addresses:
//   1. Customer abandons the tab during generation. fal completes server-
//      side, generation_log moves to 'success', but the customer never
//      returns to claim it. Without this cron, their credit is consumed
//      forever and the portrait is invisible to them.
//   2. fal queue takes >5 min for some pathological case. Frontend stops
//      polling. Customer credit consumed, no fulfilment, no refund.
//
// Recovery logic per stranded row (status='pending', age >15 min):
//   - Poll fal one last time using stored fal_status_url + fal_response_url
//   - If COMPLETED → rehost the result + flip log to 'success'. The
//     customer will see it the next time they hit the studio (their
//     localStorage pendingJobId resumes polling and gets the cached
//     completed state from generation_status handler).
//   - If still IN_QUEUE/IN_PROGRESS at >15 min → treat as dead. Refund
//     the credit, flip log to 'failed' with a "stranded by polling
//     timeout" explanation.
//   - If fal returns an error → refund + flip to failed.
//
// Triggered by Vercel cron every 10 min (vercel.json). Auth: Bearer
// CRON_SECRET (matches gelato-worker pattern).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const CRON_SECRET = process.env.CRON_SECRET || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const FAL_KEY = process.env.FAL_KEY || "";

const STRANDED_AGE_MINUTES = 15;
const BATCH_SIZE = 20;

interface StrandedRow {
  id: string;
  user_id: string;
  fal_request_id: string | null;
  fal_model: string | null;
  pet_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization ?? "";
  const ok =
    (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) ||
    (SERVICE_ROLE_KEY && auth === `Bearer ${SERVICE_ROLE_KEY}`);
  if (!ok) return res.status(401).json({ error: "Unauthorized" });

  if (!FAL_KEY) return res.status(500).json({ error: "FAL_KEY not configured" });

  const sb = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - STRANDED_AGE_MINUTES * 60_000).toISOString();

  const { data: rows, error: queryErr } = await sb
    .from("pawtrait_generation_log")
    .select("id, user_id, fal_request_id, fal_model, pet_count, metadata, created_at")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (queryErr) {
    console.error("[generation-recovery] query_failed", queryErr.message);
    return res.status(500).json({ error: "query_failed", detail: queryErr.message });
  }

  const stranded = (rows ?? []) as StrandedRow[];
  let recovered = 0;
  let refunded = 0;
  let stillPending = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of stranded) {
    try {
      // H3 fix: if a previous cron invocation is still running when the next
      // 10-min tick fires, both SELECT the same stranded rows and both call
      // grant_credits → the customer is double-refunded. Claim the row with a
      // single ATOMIC status transition out of 'pending' before doing any
      // refund/recovery work. Postgres makes `UPDATE ... WHERE status =
      // 'pending' RETURNING` exclusive: only ONE concurrent tick gets the
      // row back; the loser sees 0 rows and skips. We move it to 'failed' as
      // the claim marker (an existing, allowed status — no schema/enum
      // change, no fragile JSON filter); the COMPLETED-late branch below
      // overwrites it to 'success', and the refund branches set their own
      // terminal state. Stranded rows are >15 min old so a transient wrong
      // 'failed' is invisible to the customer. Residual: a crash strictly
      // between claim and refund loses one refund — strictly better than
      // the prior double-refund, and surfaced via credit_refund_failures.
      const claimNowIso = new Date().toISOString();
      const { data: claimRows, error: claimErr } = await sb
        .from("pawtrait_generation_log")
        .update({ status: "failed", error_text: "recovery_claimed", updated_at: claimNowIso })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id");
      if (claimErr) {
        errors.push(`row ${row.id}: claim_${claimErr.message}`);
        continue;
      }
      if (!claimRows || claimRows.length === 0) {
        // Another concurrent tick already claimed this row.
        skipped++;
        continue;
      }

      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const statusUrl = typeof meta.fal_status_url === "string" ? meta.fal_status_url : null;
      const responseUrl = typeof meta.fal_response_url === "string" ? meta.fal_response_url : null;

      // No way to poll → row is unrecoverable. Refund the credit defensively.
      if (!row.fal_request_id || !statusUrl || !responseUrl) {
        await refundAndMarkFailed(sb, row, "missing_fal_urls_at_recovery");
        refunded++;
        continue;
      }

      // Poll fal one final time
      const sr = await fetch(statusUrl, {
        headers: { Authorization: `Key ${FAL_KEY}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (!sr.ok) {
        // 404 = fal evicted the request_id (>24h old usually). Mark failed.
        if (sr.status === 404) {
          await refundAndMarkFailed(sb, row, "fal_request_evicted_404");
          refunded++;
        } else {
          // Other error — leave the row pending, try again next tick (don't refund yet)
          errors.push(`row ${row.id}: status_${sr.status}`);
        }
        continue;
      }

      const sd = (await sr.json()) as { status?: string };

      if (sd.status === "COMPLETED") {
        // Late completion — fetch result + rehost + mark success
        const rr = await fetch(responseUrl, {
          headers: { Authorization: `Key ${FAL_KEY}` },
          signal: AbortSignal.timeout(15_000),
        });
        if (!rr.ok) {
          await refundAndMarkFailed(sb, row, `result_fetch_${rr.status}`);
          refunded++;
          continue;
        }
        const rd = (await rr.json()) as { images?: Array<{ url?: string }> };
        const falUrl = rd.images?.[0]?.url;
        if (!falUrl) {
          await refundAndMarkFailed(sb, row, "completed_but_no_url");
          refunded++;
          continue;
        }
        const durableUrl = await rehostToSupabase(sb, falUrl);
        await sb
          .from("pawtrait_generation_log")
          .update({
            status: "success",
            output_image_url: durableUrl,
            updated_at: new Date().toISOString(),
            metadata: { ...meta, recovered_by: "generation-recovery", recovered_at: new Date().toISOString() },
          })
          .eq("id", row.id);
        recovered++;
        continue;
      }

      // IN_QUEUE / IN_PROGRESS at age >15 min = dead. Refund.
      await refundAndMarkFailed(sb, row, `still_pending_after_${STRANDED_AGE_MINUTES}min`);
      refunded++;
      stillPending++;
    } catch (err) {
      errors.push(`row ${row.id}: threw ${(err as Error).message}`);
    }
  }

  return res.status(200).json({
    ok: true,
    cutoff,
    candidates: stranded.length,
    recovered,
    refunded,
    stillPending,
    skipped,
    errors: errors.slice(0, 10),
  });
}

async function refundAndMarkFailed(
  sb: ReturnType<typeof getSupabaseAdmin>,
  row: StrandedRow,
  reason: string,
): Promise<void> {
  // Refund 1 token via grant_credits RPC. If the RPC fails, log to
  // credit_refund_failures so the existing sweeper picks it up.
  try {
    const { error: refundErr } = await sb.rpc("grant_credits", {
      p_account_id: row.user_id,
      p_tokens: 1,
      p_reason: "refund",
      p_metadata: {
        detail: reason,
        source: "generation-recovery-cron",
        generation_log_id: row.id,
        original_age_minutes: Math.floor((Date.now() - new Date(row.created_at).getTime()) / 60000),
      },
    });
    if (refundErr) {
      console.error("[generation-recovery] refund_failed", { rowId: row.id, err: refundErr.message });
      await sb.from("credit_refund_failures").insert({
        account_id: row.user_id,
        tokens: 1,
        reason: `recovery_refund_failed:${reason}`,
        error_detail: refundErr.message,
      });
    }
  } catch (err) {
    console.error("[generation-recovery] refund_threw", { rowId: row.id, err: (err as Error).message });
  }
  // Mark the log row as failed (best-effort — don't throw if it errors)
  await sb
    .from("pawtrait_generation_log")
    .update({
      status: "failed",
      error_text: `stranded_recovery: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .then(undefined, (err: Error) => {
      console.error("[generation-recovery] mark_failed_threw", { rowId: row.id, err: err.message });
    });
}

async function rehostToSupabase(
  sb: ReturnType<typeof getSupabaseAdmin>,
  falUrl: string,
): Promise<string> {
  try {
    const dl = await fetch(falUrl, { signal: AbortSignal.timeout(30_000) });
    if (!dl.ok) return falUrl;
    const buffer = Buffer.from(await dl.arrayBuffer());
    const path = `generations/${crypto.randomUUID()}.png`;
    const { error: upErr } = await sb.storage
      .from("pet-photos")
      .upload(path, buffer, { contentType: "image/png", cacheControl: "31536000", upsert: false });
    if (upErr) return falUrl;
    const { data } = sb.storage.from("pet-photos").getPublicUrl(path);
    return data?.publicUrl ?? falUrl;
  } catch {
    return falUrl;
  }
}
