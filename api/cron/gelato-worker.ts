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
import {
  recordHighSeverityFailure,
  type PrintOrderRow,
} from "../_lib/printOrdersRepo.js";

const CRON_SECRET = process.env.CRON_SECRET || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Bounded — one row tried at most this many times before flipping to
// manual_review. Each attempt is one full pipeline run (AuraSR + Gelato).
const MAX_ATTEMPTS = 3;

// How many rows we try to drain per tick. Keep small so a single function
// invocation finishes inside Vercel's per-function timeout. The cron fires
// every minute so 5 rows / minute = 300 rows / hour throughput.
const BATCH_SIZE = 5;

// A row that's been touched (attempts > 0) but its updated_at hasn't moved
// in this many minutes is presumed stuck — most likely the Vercel function
// got SIGKILLed mid-pipeline (timeout, OOM, redeploy) so the JS catch path
// never ran and last_error is still null. Sweeper at the start of each
// tick flips these to manual_review with an explanation + Telegram alert.
const STUCK_ROW_MINUTES = 5;

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

  // ── Stuck-row sweeper ────────────────────────────────────────────────
  // A row that's been touched (attempts > 0) but updated_at hasn't moved
  // for STUCK_ROW_MINUTES is presumed dead (Vercel function killed
  // mid-pipeline, no JS catch, no last_error). Flip to manual_review.
  let sweptStuck = 0;
  try {
    const stuckCutoff = new Date(Date.now() - STUCK_ROW_MINUTES * 60_000).toISOString();
    const { data: stuckRows } = await sb
      .from("print_orders")
      .select("id, shopify_order_id, shopify_line_item_id, sku, attempts")
      .eq("status", "pending")
      .gt("attempts", 0)
      .lt("updated_at", stuckCutoff)
      .limit(20);

    // Telegram alert burst cap: if the queue has 20 stuck rows after a
    // long outage, we still flip ALL of them to manual_review (correctness)
    // but only fire Telegram on the first 3 (UX). Ops gets a clear
    // indication "lots of rows stuck" without 20 messages spamming.
    const ALERT_BURST_CAP = 3;
    let alertsSent = 0;
    for (const stuck of (stuckRows ?? []) as Array<Pick<PrintOrderRow, "id" | "shopify_order_id" | "shopify_line_item_id" | "sku" | "attempts">>) {
      await sb
        .from("print_orders")
        .update({
          status: "manual_review",
          last_error: `gelato-worker: stuck pending after ${STUCK_ROW_MINUTES}m with attempts=${stuck.attempts} — likely killed mid-pipeline`,
        })
        .eq("id", stuck.id)
        .eq("status", "pending");
      sweptStuck++;
      if (alertsSent < ALERT_BURST_CAP) {
        await recordHighSeverityFailure({
          printOrderId: stuck.id,
          shopifyOrderId: stuck.shopify_order_id,
          shopifyLineItemId: stuck.shopify_line_item_id,
          sku: stuck.sku,
          stage: "stuck_sweep",
          message: `Row stuck pending for ${STUCK_ROW_MINUTES}+ min with no updated_at change — Vercel function probably killed mid-pipeline. Flipped to manual_review.`,
        });
        alertsSent++;
      }
    }
    if (sweptStuck > ALERT_BURST_CAP) {
      console.warn(`[gelato-worker] swept ${sweptStuck} stuck rows; only first ${ALERT_BURST_CAP} sent to Telegram`);
    }
  } catch (err) {
    console.error(
      "[gelato-worker] sweep_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
  }

  // ── Pick a small batch of pending rows that haven't exceeded the cap ──
  // ORDER BY created_at = oldest-first (don't punish customers who waited).
  // Skip TikTok-Shop "needs customisation" rows — those have no source
  // image yet (Phase 7 captures it later via email) and would burn 3
  // attempts hitting upscale-with-no-source then silently flip to
  // manual_review with no useful error. Phase 7 should re-submit them
  // when the customer responds.
  const { data: candidates, error: pickErr } = await sb
    .from("print_orders")
    .select("*")
    .eq("status", "pending")
    .lt("attempts", MAX_ATTEMPTS)
    .not("metadata->>needsCustomisation", "eq", "true")
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
      // Per-row deadline. AuraSR has its own 3-min timeout per attempt and
      // can retry twice → worst case ~6 min for one row, which would
      // monopolise the cron function (Vercel Pro: 300s default; this cron
      // could run longer if scheduled, but the BATCH_SIZE=5 batch starves).
      // 60s ceiling per row means even worst-case 5 rows fits in 5min.
      // Slow row gets aborted and stays pending — the next cron tick or
      // the stuck-row sweeper picks it up.
      const ROW_DEADLINE_MS = 60_000;
      await Promise.race([
        runCanvasFulfillmentForRow(claimedRow),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`row_deadline_exceeded_${ROW_DEADLINE_MS}ms`)),
            ROW_DEADLINE_MS,
          ),
        ),
      ]);
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
    sweptStuck,
    errors: errors.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}
