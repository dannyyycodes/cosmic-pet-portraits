// Ping IndexNow (Bing, Yandex, Seznam, Naver) with the latest blog URLs.
// Runs on the same cron as blog generation — hits the engines within seconds
// of publish, which matters for ChatGPT search (uses Bing) and Perplexity.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzAwMzgsImV4cCI6MjA4ODUwNjAzOH0.-axd-u-mY_73j2RPkySsLgG630WCUb05I8AbwYjIvkI";
const CRON_SECRET = process.env.CRON_SECRET || "";
const INDEXNOW_KEY = "cafaa0c1a857d082b02b0015353028fc";
const HOST = "littlesouls.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Pull every published post (or last 100 — IndexNow max is 10k/req)
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,date_modified,published_at&is_published=eq.true&order=published_at.desc&limit=100`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
    );
    const posts = (await r.json()) as Array<{ slug: string }>;

    const urls = [
      `https://${HOST}/`,
      `https://${HOST}/blog`,
      `https://${HOST}/sitemap.xml`,
      ...posts.map((p) => `https://${HOST}/blog/${p.slug}`),
      ...["elena-whitaker", "callum-hayes", "maggie-oshea", "river-callahan", "rowan-sterling"].map(
        (s) => `https://${HOST}/author/${s}`,
      ),
    ];

    const body = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    };

    const resp = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    return res.status(200).json({
      success: true,
      indexnow_status: resp.status,
      urls_submitted: urls.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[indexnow] error:", err);
    return res.status(500).json({ error: "IndexNow ping failed" });
  }
}
