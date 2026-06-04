// Google Merchant Center product feed (Google Shopping RSS 2.0) for every
// approved pawtrait_library piece — each lands on its own /pawtraits/art/<id>
// buy page. This gets all ~260 (growing) artworks into Google's FREE product
// listings (Search / Images / Shopping / Lens / Gemini) at £0 acquisition cost,
// WITHOUT creating 260 Shopify products.
//
// Wire-up: Merchant Center → Products → Feeds → add a "scheduled fetch" feed
// pointing at https://www.littlesouls.app/feeds/google-pawtraits.xml
// (vercel rewrite /feeds/google-pawtraits.xml -> /api/google-feed). Verify +
// claim the site in Merchant Center first.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE = "https://www.littlesouls.app";
// Entry physical price (8×10 unframed canvas) — what "pet portrait canvas"
// searchers land on. Must sit within the page's offer range. Mirrors
// gelatoFramedCanvas.ts UNFRAMED_CANVAS_VARIANTS["8x10"].
const FEED_PRICE_GBP = "39.00";
// Google product category: Home & Garden > Decor > Artwork > Posters, Prints, & Visual Artwork
const GOOGLE_CATEGORY = "500045";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzAwMzgsImV4cCI6MjA4ODUwNjAzOH0.-axd-u-mY_73j2RPkySsLgG630WCUb05I8AbwYjIvkI";

type Row = {
  id: string;
  breed: string;
  pet_name: string | null;
  art_style: string;
  backstory: string | null;
  image_url: string;
  pet_kind: string | null;
};

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function pretty(s: string): string {
  return (s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=7200, stale-while-revalidate=86400");

  let rows: Row[] = [];
  try {
    const params = new URLSearchParams();
    params.set("select", "id,breed,pet_name,art_style,backstory,image_url,pet_kind");
    params.set("approved", "eq.true");
    params.set("image_style", "eq.portrait");
    params.set("order", "created_at.desc");
    params.set("limit", "5000");
    const r = await fetch(`${SUPABASE_URL}/rest/v1/pawtrait_library?${params.toString()}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (r.ok) rows = (await r.json()) as Row[];
  } catch {
    rows = [];
  }

  const items = rows.filter((r) => r.id && r.image_url).map((r) => {
    const style = pretty(r.art_style);
    const title = `${r.breed} ${style} Pet Portrait — Canvas Wall Art Print`.slice(0, 140);
    const desc = (r.backstory?.trim()
      || `A ${style.toLowerCase()} ${r.breed} pet portrait, printed locally on gallery canvas. Ready-made wall art, or create your own pet's portrait at littlesouls.app/pawtraits.`).slice(0, 4900);
    const link = `${SITE}/pawtraits/art/${r.id}?utm_source=google&utm_medium=organic&utm_campaign=shopping`;
    return `<item>
<g:id>art-${esc(r.id)}</g:id>
<g:title>${esc(title)}</g:title>
<g:description>${esc(desc)}</g:description>
<g:link>${esc(link)}</g:link>
<g:image_link>${esc(r.image_url)}</g:image_link>
<g:availability>in_stock</g:availability>
<g:price>${FEED_PRICE_GBP} GBP</g:price>
<g:brand>Little Souls</g:brand>
<g:condition>new</g:condition>
<g:google_product_category>${GOOGLE_CATEGORY}</g:google_product_category>
<g:product_type>Pet Portraits &gt; ${esc(pretty(r.pet_kind || "Pet"))} &gt; ${esc(style)}</g:product_type>
<g:identifier_exists>no</g:identifier_exists>
<g:custom_label_0>${esc(r.breed)}</g:custom_label_0>
<g:custom_label_1>${esc(style)}</g:custom_label_1>
</item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Little Souls — Pawtraits</title>
<link>${SITE}/pawtraits</link>
<description>Custom &amp; ready-made pet portraits, printed on gallery canvas.</description>
${items}
</channel>
</rss>`;

  res.status(200).send(xml);
}
