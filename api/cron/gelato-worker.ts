// Vercel function: drain pending print_orders → AuraSR → Gelato submit.
//
// Triggered by pg_cron every minute (migration 20260509000002). The orders/paid
// webhook persists print_orders.status='pending' with enough metadata for us
// to reconstruct the fulfillment args, then returns 200 to Shopify within
// the 4.5s deadline. This worker does the slow stuff (AuraSR ~5-30s + Gelato
// submit ~5-30s) without racing against any HTTP timeout.
//
// Why not Vercel cron: Hobby plan only allows daily schedules. We use pg_cron
// in Supabase (already in place for email-nurture) which can fire every
// minute. The pg_cron job POSTs here with `Authorization: Bearer ${CRON_SECRET}`.
//
// Concurrency: pg_cron is single-threaded per schedule, so no two of these
// fire simultaneously. We additionally optimistic-lock per row by bumping
// `attempts` in an UPDATE … WHERE status='pending' — only one caller wins.
//
// Bounded retries: each row gets at most MAX_ATTEMPTS tries before being
// flipped to manual_review (Telegram alert via runCanvasFulfillment's
// recordHighSeverityFailure). Stops infinite-retry loops on permanently
// broken rows (bad SKU, dead source URL, address Gelato refuses).
//
// Batch size: small (5) so a single tick finishes well within the Vercel
// function timeout (60s on Pro, less on Hobby — but each row's pipeline
// has its own internal timeouts capped at ~3 min for AuraSR queue).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runCanvasFulfillmentForRow } from "../_lib/canvasFulfillment.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import type { PrintOrderRow } from "../_lib/printOrdersRepo.js";

const CRON_SECRET = process.env.CRON_SECRET || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Bounded — one row tried at most this many times before flipping to
// manual_review. Each attempt is one full pipeline run (AuraSR + Gelato).
const MAX_ATTEMPTS = 3;

// How many rows we try to drain per tick. Keep small so a single function
// invocation finishes inside Vercel's per-function timeout. The cron fires
// every minute so 5 rows / minute = 300 rows / hour throughput.
const BATCH_SIZE = 5;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth: pg_cron sends Bearer CRON_SECRET. Support service-role bearer too
  // so manual triggers from a Supabase function or ops console still work.
  const auth = req.headers.authorization ?? "";
  const ok =
    (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) ||
    (SERVICE_ROLE_KEY && auth === `Bearer ${SERVICE_ROLE_KEY}`);
  if (!ok) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const sb = getSupabaseAdmin();

  // Pick a small batch of pending rows that haven't exceeded the retry cap.
  // ORDER BY created_at = oldest-first (don't punish customers who waited).
  const { data: candidates, error: pickErr } = await sb
    .from("print_orders")
    .select("*")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (pickErr) {
    console.error("[gelato-worker] pick_failed", pickErr.message);
    return res.status(500).json({ error: "pick_failed", detail: pickErr.message });
  }

  const candidateRows = (candidates ?? []) as PrintOrderRow[];
  if (candidateRows.length === 0) {
    return res.status(200).json({ ok: true, processed: 0, claimed: 0 });
  }

  let claimed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ printOrderId: string; reason: string }> = [];

  for (const row of candidateRows) {
    // Optimistic lock: bump attempts. The .eq('status','pending') means a
    // concurrent caller (or a row already in progress) won't double-pick.
    // RETURNING returns the updated row only if the WHERE matched.
    const { data: claimedRows, error: claimErr } = await sb
      .from("print_orders")
      .update({ attempts: (row.attempts ?? 0) + 1 })
      .eq("id", row.id)
      .eq("status", "pending")
      .lt("attempts", MAX_ATTEMPTS)
      .select("*");

    if (claimErr) {
      errors.push({ printOrderId: row.id, reason: `claim_failed: ${claimErr.message}` });
      continue;
    }
    const claimedRow = (claimedRows ?? [])[0] as PrintOrderRow | undefined;
    if (!claimedRow) {
      // Another caller claimed it (or status changed). Move on.
      continue;
    }
    claimed++;

    try {
      await runCanvasFulfillmentForRow(claimedRow);
      // Status update happened inside runCanvasFulfillmentForRow → either
      // 'submitted' (success), 'failed', or 'manual_review'. We just count.
      succeeded++;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(
        "[gelato-worker] fulfill_threw",
        JSON.stringify({ printOrderId: claimedRow.id, error: reason }),
      );
      errors.push({ printOrderId: claimedRow.id, reason });
      failed++;
      // Don't update status — runCanvasFulfillmentForRow's own catch should
      // have done that. If somehow it threw before reaching the catch, the
      // row stays pending and the next cron tick picks it up (until attempts
      // hits the cap, at which point we'll flip to manual_review explicitly).
      if ((claimedRow.attempts ?? 0) + 1 >= MAX_ATTEMPTS) {
        try {
          await sb
            .from("print_orders")
            .update({
              status: "manual_review",
              last_error: `gelato-worker: max attempts reached after throw: ${reason.slice(0, 200)}`,
            })
            .eq("id", claimedRow.id);
        } catch {
          /* swallow — row will be revisited */
        }
      }
    }
  }

  return res.status(200).json({
    ok: true,
    candidates: candidateRows.length,
    claimed,
    succeeded,
    failed,
    errors: errors.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}
