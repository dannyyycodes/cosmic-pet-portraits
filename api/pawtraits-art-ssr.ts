// Server-rendered single-artwork product page — served to bot crawlers only
// (routed via vercel.json `has` user-agent rewrite on /pawtraits/art/:id).
// Humans get the React SPA (src/pages/PawtraitArt.tsx) which injects the same
// OG + Product tags via Helmet.
//
// Why: Pinterest's crawler does NOT run JavaScript, so the Helmet-injected
// Product/Offer/ImageObject JSON-LD is invisible to it. This static HTML twin
// gives Pinterest Rich Pins + Google a real per-artwork Product to index.
//
// One row → one Product. Mirrors pricing in gelatoFramedCanvas.ts.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE = "https://www.littlesouls.app";
const DIGITAL_PRICE_GBP = 19;
const CANVAS_FROM_GBP = 39;
const FRAMED_FROM_GBP = 84;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzAwMzgsImV4cCI6MjA4ODUwNjAzOH0.-axd-u-mY_73j2RPkySsLgG630WCUb05I8AbwYjIvkI";

type ArtRow = {
  id: string;
  breed: string;
  pet_name: string | null;
  art_style: string;
  backstory: string | null;
  prompt: string | null;
  image_url: string;
  thumbnail_url: string | null;
  width: number;
  height: number;
  approved: boolean;
};

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function prettyArtStyle(s: string): string {
  return (s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function cleanPrompt(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/^Vertical \d+:\d+\s*Type [AB]\s*Pawtraits\s*(portrait|customer-style room scene)\b/i, "Portrait")
    .replace(/\bPet-only\s+/gi, "")
    .replace(/,?\s*print-safe margins,?\s*sRGB\.?/gi, ".")
    .replace(/\s*No room,?\s*no wall,?\s*no canvas,?\s*no human,?\s*no second animal,?\s*no text,?\s*no logo,?\s*no watermark\.?\s*$/i, "")
    .replace(/\.\s*\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRow(id: string): Promise<ArtRow | null> {
  const params = new URLSearchParams();
  params.set("select", "id,breed,pet_name,art_style,backstory,prompt,image_url,thumbnail_url,width,height,approved");
  params.set("id", `eq.${id}`);
  params.set("limit", "1");
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/pawtrait_library?${params.toString()}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as ArtRow[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Vary", "User-Agent");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400");

  const id = String(req.query.id ?? "").trim();
  const row = id ? await fetchRow(id) : null;

  if (!row || !row.approved) {
    // Soft-redirect bots to the gallery rather than 404 — keeps the crawl alive.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(404).send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Pawtrait not found | Little Souls</title><meta name="robots" content="noindex"/><link rel="canonical" href="${SITE}/pawtraits/gallery"/><meta http-equiv="refresh" content="0; url=/pawtraits/gallery"/></head><body><p>This pawtrait isn't available. <a href="/pawtraits/gallery">Browse the gallery</a>.</p></body></html>`);
    return;
  }

  const title = `${row.pet_name ? `${row.pet_name} the ` : ""}${row.breed}`;
  const styleLabel = prettyArtStyle(row.art_style);
  const metaTitle = `${title} — ${styleLabel} Pet Portrait Print | Little Souls`;
  const desc = (row.backstory?.trim() || cleanPrompt(row.prompt)
    || `A ${styleLabel.toLowerCase()} ${row.breed} portrait, printed locally on gallery canvas. Digital £${DIGITAL_PRICE_GBP} · canvas from £${CANVAS_FROM_GBP} (framed from £${FRAMED_FROM_GBP}).`).slice(0, 320);
  const canonical = `${SITE}/pawtraits/art/${row.id}`;
  const studioHref = `/pawtraits?style=${encodeURIComponent(row.art_style)}#studio`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${title} — ${styleLabel} Pet Portrait`,
    description: desc,
    image: row.image_url,
    brand: { "@type": "Brand", name: "Little Souls" },
    category: "Pet Portraits",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "GBP",
      lowPrice: DIGITAL_PRICE_GBP.toFixed(2),
      highPrice: "229.00",
      offerCount: 4,
      url: canonical,
      availability: "https://schema.org/InStock",
    },
  };
  const imageSchema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url || row.image_url,
    caption: `${title} — ${styleLabel} pet portrait`,
    width: row.width || 1024,
    height: row.height || 1536,
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(metaTitle)}</title>
<meta name="description" content="${esc(desc)}"/>
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/>
<link rel="canonical" href="${esc(canonical)}"/>
<meta property="og:type" content="product"/>
<meta property="og:title" content="${esc(metaTitle)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:image" content="${esc(row.image_url)}"/>
<meta property="og:url" content="${esc(canonical)}"/>
<meta property="og:site_name" content="Little Souls"/>
<meta property="product:price:amount" content="${CANVAS_FROM_GBP}.00"/>
<meta property="product:price:currency" content="GBP"/>
<meta property="product:availability" content="in stock"/>
<meta property="og:price:amount" content="${CANVAS_FROM_GBP}.00"/>
<meta property="og:price:currency" content="GBP"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(metaTitle)}"/>
<meta name="twitter:description" content="${esc(desc)}"/>
<meta name="twitter:image" content="${esc(row.image_url)}"/>
<script type="application/ld+json">${JSON.stringify(productSchema)}</script>
<script type="application/ld+json">${JSON.stringify(imageSchema)}</script>
<style>:root{--cream:#FFFDF5;--ink:#3d2f2a;--body:#5a4a42;--muted:#9a8578;--border:#e8ddd0;--violet:#6a4ba0;--rose:#bf524a}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--body);font:17px/1.65 Georgia,serif}
a{color:var(--violet);text-decoration:none}a:hover{text-decoration:underline}
.w{max-width:1000px;margin:0 auto;padding:28px 20px 80px}
.nav{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:18px;margin-bottom:28px}
.nav .cta{background:var(--rose);color:#fff;padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600}
.grid{display:grid;gap:32px;grid-template-columns:1fr}@media(min-width:760px){.grid{grid-template-columns:1fr 1fr}}
img.art{width:100%;border-radius:12px;display:block}
.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:var(--muted);margin:0 0 8px}
h1{font-size:clamp(26px,4vw,38px);color:var(--ink);line-height:1.14;margin:0 0 14px}
.price{font-size:24px;color:var(--ink);margin:18px 0}
.cta-row a.primary{display:inline-block;background:var(--rose);color:#fff;padding:13px 22px;border-radius:999px;font-weight:600;font-size:15px}
.cta-row a.secondary{display:inline-block;border:1px solid var(--border);background:#fff;color:var(--ink);padding:13px 22px;border-radius:999px;font-weight:600;font-size:15px;margin-left:10px}
.foot{margin-top:60px;padding-top:24px;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:13px}</style>
</head>
<body>
<div class="w">
  <nav class="nav"><a href="/pawtraits">Little Souls · Pawtraits</a><a href="${esc(studioHref)}" class="cta">Make yours</a></nav>
  <main class="grid">
    <div><img class="art" src="${esc(row.image_url)}" alt="${esc(title)} — ${esc(styleLabel)} pet portrait" width="${row.width || 1024}" height="${row.height || 1536}"/></div>
    <div>
      <p class="eyebrow">${esc(styleLabel)} · ready-made print</p>
      <h1>${esc(title)}</h1>
      <p>${esc(desc)}</p>
      <p class="price">Digital £${DIGITAL_PRICE_GBP} · Canvas from £${CANVAS_FROM_GBP} · Framed from £${FRAMED_FROM_GBP}</p>
      <div class="cta-row">
        <a href="${esc(canonical)}" class="primary">Buy this print →</a>
        <a href="${esc(studioHref)}" class="secondary">Create your own</a>
      </div>
      <p style="margin-top:18px;font-size:13px;color:var(--muted)">Printed locally (UK · EU · USA) · Ships worldwide</p>
    </div>
  </main>
  <footer class="foot">
    <div>© Little Souls — custom painted pet portraits, printed and framed in the UK</div>
    <div style="margin-top:8px"><a href="/pawtraits">Studio</a> · <a href="/pawtraits/gallery">Gallery</a> · <a href="/contact">Contact</a></div>
  </footer>
</div>
</body>
</html>`;

  res.status(200).send(html);
}
