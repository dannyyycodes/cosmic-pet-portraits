import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[CRON] Triggering auto-generate-blogs...");
    const response = await fetch(`${SUPABASE_URL}/functions/v1/auto-generate-blogs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ count: 1, trigger: "vercel-cron" }),
    });
    const body = await response.text();
    console.log("[CRON] auto-generate-blogs:", response.status, body.slice(0, 500));
    return res.status(200).json({ success: true, status: response.status, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("[CRON] error:", err);
    return res.status(500).json({ error: "Failed to trigger blog generation" });
  }
}
