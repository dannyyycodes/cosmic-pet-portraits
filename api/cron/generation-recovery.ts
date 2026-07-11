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

// SECURITY FIX 2026-06-28: soul-reading generation is handed off to n8n by the
// generate-report-background edge function. If that handoff fails (downed host)
// a PAID reading can be left with report_content null or stuck on a "generating"
// status marker and never deliver. This cron now also finds those stuck paid
// reports, re-triggers generation via the SAME path (generate-report-background),
// and — only after repeated failure — emails the customer an honest apology.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const REPORT_STUCK_MINUTES = 15; // > the 10-min "already generating" guard in generate-report-background
const MAX_REPORT_ATTEMPTS = 3; // matches MAX_RETRIES in generate-report-background
const REPORT_BATCH_SIZE = 10;
const REPORT_PAID_STATUSES = ["paid", "completed"];
const APOLOGY_FROM = "Little Souls <hello@littlesouls.app>";
const APOLOGY_REPLY_TO = "hello@littlesouls.app";

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

  const sb = getSupabaseAdmin();

  // SECURITY FIX 2026-06-28: recover stuck PAID soul readings FIRST and
  // independently of FAL_KEY (the pawtrait/fal recovery below needs FAL_KEY, but
  // a missing fal key must never block paid-reading recovery). Never throws.
  const reportRecovery = await recoverStuckReports(sb).catch((err) => {
    console.error("[generation-recovery] report_recovery_threw", (err as Error).message);
    return { error: (err as Error).message };
  });

  if (!FAL_KEY) {
    // No fal key → pawtrait recovery can't run, but report recovery already did.
    return res.status(200).json({ ok: true, reportRecovery, note: "FAL_KEY not configured; pawtrait recovery skipped" });
  }

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
    reportRecovery,
  });
}

// SECURITY FIX 2026-06-28: stuck-finder + re-trigger for PAID soul readings.
//
// A paid pet_reports row is "stuck" when, after >REPORT_STUCK_MINUTES, its
// report_content is still null OR is a non-terminal status marker
// (generating/retrying/failed/error) rather than real reading content. For each
// we re-trigger generation via the same entry point the checkout uses
// (generate-report-background, which itself awaits n8n and falls back to the
// in-house generator). Attempts are tracked on the status marker; once attempts
// reach MAX_REPORT_ATTEMPTS we stop retrying, email the customer an honest
// apology once, and mark the row "failed_permanent" so it's excluded next tick.
interface StuckReportRow {
  id: string;
  email: string | null;
  pet_name: string | null;
  payment_status: string | null;
  report_content: { status?: string; attempt?: number; error?: string } | null;
  created_at: string;
  updated_at: string | null;
}

async function recoverStuckReports(
  sb: ReturnType<typeof getSupabaseAdmin>,
): Promise<Record<string, unknown>> {
  const cutoff = new Date(Date.now() - REPORT_STUCK_MINUTES * 60_000).toISOString();

  const { data, error } = await sb
    .from("pet_reports")
    .select("id, email, pet_name, payment_status, report_content, created_at, updated_at")
    .in("payment_status", REPORT_PAID_STATUSES)
    .lt("updated_at", cutoff)
    // null content OR a non-terminal status marker (real readings have no
    // `status` key, so they never match and are left alone).
    .or("report_content.is.null,report_content->>status.in.(generating,retrying,failed,error)")
    .order("updated_at", { ascending: true })
    .limit(REPORT_BATCH_SIZE);

  if (error) {
    console.error("[generation-recovery] report_query_failed", error.message);
    return { error: error.message, candidates: 0, retriggered: 0, apologised: 0, failedTrigger: 0 };
  }

  const rows = (data ?? []) as StuckReportRow[];
  let retriggered = 0;
  let apologised = 0;
  let failedTrigger = 0;

  for (const row of rows) {
    try {
      const marker = row.report_content && typeof row.report_content === "object" ? row.report_content : null;
      const attempt = typeof marker?.attempt === "number" ? marker.attempt : 0;

      if (attempt >= MAX_REPORT_ATTEMPTS) {
        // Repeated failure → apologise once, then mark terminal so we stop retrying.
        await sendReportApologyEmail(row);
        await sb
          .from("pet_reports")
          .update({
            report_content: {
              status: "failed_permanent",
              attempt,
              error: marker?.error ?? "max_attempts_exhausted",
              apology_sent_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        apologised++;
        continue;
      }

      const ok = await retriggerReportGeneration(row.id, attempt + 1);
      if (ok) retriggered++;
      else failedTrigger++;
    } catch (err) {
      console.error("[generation-recovery] report_recover_row_threw", { id: row.id, err: (err as Error).message });
      failedTrigger++;
    }
  }

  return { cutoff, candidates: rows.length, retriggered, apologised, failedTrigger };
}

// Re-trigger generation through the SAME entry point the checkout uses.
async function retriggerReportGeneration(reportId: string, attempt: number): Promise<boolean> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("[generation-recovery] cannot retrigger report: supabase env missing");
    return false;
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/generate-report-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ reportId, attempt }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) {
      console.error("[generation-recovery] report_retrigger_non_ok", { reportId, status: r.status });
      return false;
    }
    return true;
  } catch (err) {
    console.error("[generation-recovery] report_retrigger_threw", { reportId, err: (err as Error).message });
    return false;
  }
}

// Honest, brand-aligned apology — sent only after generation has truly failed
// MAX_REPORT_ATTEMPTS times. Best-effort; never throws.
async function sendReportApologyEmail(row: StuckReportRow): Promise<void> {
  const email = (row.email ?? "").trim();
  if (!email) {
    console.warn("[generation-recovery] no email for stuck report apology", row.id);
    return;
  }
  if (!RESEND_API_KEY) {
    console.error("[generation-recovery] RESEND_API_KEY not configured; cannot send apology", row.id);
    return;
  }

  const petName = (row.pet_name ?? "your little soul").trim() || "your little soul";
  const subject = `A small delay with ${petName}'s Soul Reading`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4a265;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Little Souls</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;border:1px solid #e8ddd0;padding:36px 28px;text-align:left;box-shadow:0 4px 20px rgba(35,40,30,0.06);">
      <h1 style="color:#141210;font-size:24px;font-weight:400;margin:0 0 18px 0;line-height:1.3;">A small delay, and a sincere sorry</h1>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 14px 0;">We hit a snag while preparing ${escapeHtml(petName)}'s Soul Reading, and it is taking longer than it should. We are sorry — you should not have to wait, and your purchase is completely safe.</p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 14px 0;">Our team has been alerted and is finishing ${escapeHtml(petName)}'s reading by hand. We will email it to you as soon as it is ready. If you would prefer a full refund instead, just reply to this email and we will sort it straight away.</p>
      <p style="color:#6e6259;font-size:13px;line-height:1.7;margin:22px 0 0 0;font-style:italic;">Thank you for your patience — ${escapeHtml(petName)} chose you, and we want this reading to be worthy of that.</p>
    </div>
    <div style="text-align:center;padding:24px 12px 0;">
      <p style="color:#958779;font-size:12px;line-height:1.6;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Reply to this email any time — we read every one. Little Souls · littlesouls.app</p>
    </div>
  </div>
</body></html>`;
  const text = [
    `A small delay with ${petName}'s Soul Reading.`,
    "",
    `We hit a snag while preparing ${petName}'s Soul Reading and it is taking longer than it should.`,
    "We are sorry. Your purchase is completely safe.",
    "",
    `Our team is finishing ${petName}'s reading by hand and will email it to you as soon as it is ready.`,
    "If you would prefer a full refund instead, just reply to this email and we will sort it straight away.",
    "",
    "Little Souls · littlesouls.app",
    "Reply to this email any time — we read every one.",
  ].join("\n");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: APOLOGY_FROM, to: email, reply_to: APOLOGY_REPLY_TO, subject, html, text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      console.error("[generation-recovery] apology_send_failed", { id: row.id, status: r.status });
    } else {
      console.log("[generation-recovery] apology_sent", { id: row.id });
    }
  } catch (err) {
    console.error("[generation-recovery] apology_send_threw", { id: row.id, err: (err as Error).message });
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
