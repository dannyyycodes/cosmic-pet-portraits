// Fires the memorial touchpoint sender daily. The sender itself
// (supabase/functions/send-memorial-touchpoint) selects due rows from
// public.memorial_touchpoints where scheduled_for <= now() and sent_at is null,
// emails them via Resend, and rolls anniversary rows forward by a year.
//
// Auth: Vercel cron injects `Authorization: Bearer ${CRON_SECRET}`. We forward
// the same CRON_SECRET to the edge function (which has MEMORIAL_CRON_SECRET
// set to the same value) so the two halves share one gate.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const CRON_SECRET = process.env.CRON_SECRET || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!CRON_SECRET) {
    return res.status(500).json({ error: "CRON_SECRET not set" });
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-memorial-touchpoint`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
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
    console.error("[memorial-touchpoints] error:", err);
    return res.status(500).json({ error: "Memorial touchpoint cron failed" });
  }
}
