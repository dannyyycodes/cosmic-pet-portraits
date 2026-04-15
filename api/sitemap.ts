import type { VercelRequest, VercelResponse } from "@vercel/node";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const SITE = "https://littlesouls.app";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { loc: `${SITE}/`, changefreq: "weekly", priority: 1.0 },
  { loc: `${SITE}/intake`, changefreq: "weekly", priority: 0.9 },
  { loc: `${SITE}/blog`, changefreq: "daily", priority: 0.8 },
  { loc: `${SITE}/gift`, changefreq: "weekly", priority: 0.8 },
  { loc: `${SITE}/become-affiliate`, changefreq: "monthly", priority: 0.6 },
  { loc: `${SITE}/contact`, changefreq: "monthly", priority: 0.5 },
  { loc: `${SITE}/privacy`, changefreq: "yearly", priority: 0.3 },
  { loc: `${SITE}/terms`, changefreq: "yearly", priority: 0.3 },
];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
}

function toXml(entries: SitemapEntry[]): string {
  const rows = entries
    .map((e) => {
      const parts = [`<loc>${escapeXml(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`<lastmod>${e.lastmod}</lastmod>`);
      if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`);
      if (typeof e.priority === "number") parts.push(`<priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n    ${parts.join("\n    ")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const entries: SitemapEntry[] = [...STATIC_ENTRIES];

    // Published blog posts
    const postsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,date_modified,published_at&is_published=eq.true&order=published_at.desc&limit=5000`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    );
    if (postsRes.ok) {
      const posts = (await postsRes.json()) as Array<{ slug: string; date_modified: string | null; published_at: string }>;
      for (const p of posts) {
        entries.push({
          loc: `${SITE}/blog/${p.slug}`,
          lastmod: (p.date_modified || p.published_at || "").slice(0, 10),
          changefreq: "monthly",
          priority: 0.7,
        });
      }
    }

    // Authors
    const authorsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/authors?select=slug,updated_at`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    );
    if (authorsRes.ok) {
      const authors = (await authorsRes.json()) as Array<{ slug: string; updated_at: string }>;
      for (const a of authors) {
        entries.push({
          loc: `${SITE}/author/${a.slug}`,
          lastmod: (a.updated_at || "").slice(0, 10),
          changefreq: "weekly",
          priority: 0.5,
        });
      }
    }

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(toXml(entries));
  } catch (err) {
    console.error("[sitemap] error:", err);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.status(200).send(toXml(STATIC_ENTRIES));
  }
}
