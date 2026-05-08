// Vercel cron: kicks process-email-nurture every 15 minutes.
//
// The function processes both the soul-reading journey-stage state machine
// AND the pawtrait_touchpoints scheduling table on each tick — so canvas
// shipping/delivered events ingested by handle-gelato-webhook flow out to
// customers within at most 15 minutes.
//
// A Postgres cron schedule (migration 20260313100000_email_nurture_cron.sql)
// also fires this same edge function every 30 minutes — both crons are
// safe to coexist because the function is idempotent on per-row state
// (journey_stage transitions + pawtrait_touchpoints status='sent'). Once
// the dual-write window closes we'll drop the Postgres schedule.
//
// Auth: Vercel cron sends `Authorization: Bearer ${CRON_SECRET}`. We
// forward the same secret to the edge function which accepts service-role
// or bridge-secret auth.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const CRON_SECRET = process.env.CRON_SECRET || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" });
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/process-email-nurture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const payload = await resp.json().catch(() => ({}));

    return res.status(resp.ok ? 200 : 500).json({
      success: resp.ok,
      edge_status: resp.status,
      edge_response: payload,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[email-nurture cron] error:", err);
    return res.status(500).json({ error: "Email nurture cron failed" });
  }
}
