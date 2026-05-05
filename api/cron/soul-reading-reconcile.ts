/**
 * Reconciliation cron — every 10 min via vercel.json.
 *
 * Picks up soul_reading_jobs rows still in 'pending' after >10 min, re-fires
 * the n8n trigger. Caps at 5 attempts per row before flipping to 'failed'.
 *
 * Auth: Vercel cron injects `Authorization: Bearer ${CRON_SECRET}` — same
 * pattern as the other crons (memorial-touchpoints, indexnow-ping, etc).
 *
 * Spec: research-2026-05-04-soul-reading-fulfilment §4.3 (failure modes),
 *       launch-plan-2026-05-05 Phase 4 (reconciliation cadence).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listPendingForReconcile, markPendingFailure } from "../shopify/_lib/jobsRepo.js";
import { triggerN8nForJob } from "../shopify/_lib/triggerN8n.js";

const MAX_ATTEMPTS = 5;
const PENDING_OLDER_THAN_MIN = 10;
const BATCH_LIMIT = 50;

const CRON_SECRET = process.env.CRON_SECRET || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const rows = await listPendingForReconcile({
      olderThanMinutes: PENDING_OLDER_THAN_MIN,
      maxAttempts: MAX_ATTEMPTS,
      limit: BATCH_LIMIT,
    });

    console.log(
      "[soul-reading-reconcile] picked",
      JSON.stringify({ count: rows.length, cutoffMin: PENDING_OLDER_THAN_MIN }),
    );

    if (rows.length === 0) {
      return res.status(200).json({ ok: true, retried: 0, terminal: 0, picked: 0 });
    }

    let retried = 0;
    let succeeded = 0;
    let terminal = 0;

    // Sequential — keeps n8n load gentle and stays well within Vercel's
    // function timeout. 50 rows at ~2s each = 100s; if backlog is bigger
    // we'll catch up across multiple cron firings.
    for (const row of rows) {
      // Check if this run will tip the row over the attempts ceiling.
      // listPendingForReconcile already filtered attempts < MAX_ATTEMPTS, so
      // this row gets ONE more shot. If it fails again, we mark it terminal.
      const result = await triggerN8nForJob(row);
      retried++;
      if (result.ok) {
        succeeded++;
        continue;
      }

      // The triggerN8nForJob helper already wrote status='pending', attempts++.
      // If after that bump we'd be at the cap, mark terminal so the cron
      // stops picking it up.
      const willBeAtCap = (row.attempts ?? 0) + 1 >= MAX_ATTEMPTS;
      if (willBeAtCap) {
        try {
          await markPendingFailure({
            jobId: row.id,
            errorText: result.error ?? `n8n status=${result.status ?? "?"}`,
            terminal: true,
          });
          terminal++;
        } catch (err) {
          console.error(
            "[soul-reading-reconcile] terminal_mark_failed",
            JSON.stringify({ jobId: row.id, error: err instanceof Error ? err.message : String(err) }),
          );
        }
      }
    }

    console.log(
      "[soul-reading-reconcile] done",
      JSON.stringify({ retried, succeeded, terminal }),
    );

    return res.status(200).json({
      ok: true,
      picked: rows.length,
      retried,
      succeeded,
      terminal,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      "[soul-reading-reconcile] error",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    return res.status(500).json({ error: "reconcile_failed", detail: err instanceof Error ? err.message : String(err) });
  }
}
