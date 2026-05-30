// Server-rendered Pawtraits HTML — served to bot crawlers only (routed via
// vercel.json `has` user-agent rewrites). Humans continue to get the React SPA,
// which uses Helmet to inject the same OG tags client-side.
//
// Why this exists: Pinterest's crawler does NOT execute JavaScript, so the
// Helmet-injected OG tags + Product JSON-LD on /pawtraits/breed/:slug etc.
// are invisible to it. Without SSR, Rich Pins can't work. This function
// renders a minimal, static HTML twin (head + body) with everything Pinterest
// (and other non-JS crawlers like older Bingbot, Facebot, Slackbot) need.
//
// IMPORTANT: don't import the React component — render raw HTML. The constants
// (BREEDS / STYLES / BASE_PRICE_GBP) are duplicated below and MUST be kept in
// sync with src/pages/PawtraitsSEOLanding.tsx.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE = "https://www.littlesouls.app";
// Base price — sourced from src/components/portraits/gelatoFramedCanvas.ts
// (8×10″ unframed tier). Must match BASE_PRICE_GBP in PawtraitsSEOLanding.tsx.
// 2026-05-12 product line:
//   • Digital £19 · Canvas from £39 · Frame upgrade +£45 to +£110
const DIGITAL_PRICE_GBP = 19;
const BASE_PRICE_GBP = 39;
const FRAME_UPGRADE_FROM_GBP = 45;
const PAGE_SIZE = 12;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://aduibsyrnenzobuyetmn.supabase.co";
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY
  || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MzAwMzgsImV4cCI6MjA4ODUwNjAzOH0.-axd-u-mY_73j2RPkySsLgG630WCUb05I8AbwYjIvkI";

// ── breed/style maps (KEEP IN SYNC with PawtraitsSEOLanding.tsx) ──────────
type BreedDef = { slug: string; name: string; species: "dog" | "cat"; aliases?: string[] };
const BREEDS: BreedDef[] = [
  // Dogs
  { slug: "golden-retriever", name: "Golden Retriever", species: "dog" },
  { slug: "french-bulldog", name: "French Bulldog", species: "dog", aliases: ["frenchie"] },
  { slug: "labrador", name: "Labrador", species: "dog", aliases: ["labrador retriever", "lab"] },
  { slug: "dachshund", name: "Dachshund", species: "dog", aliases: ["sausage dog", "weiner dog"] },
  { slug: "goldendoodle", name: "Goldendoodle", species: "dog" },
  { slug: "labradoodle", name: "Labradoodle", species: "dog" },
  { slug: "bernedoodle", name: "Bernedoodle", species: "dog" },
  { slug: "border-collie", name: "Border Collie", species: "dog" },
  { slug: "pug", name: "Pug", species: "dog" },
  { slug: "german-shepherd", name: "German Shepherd", species: "dog" },
  { slug: "beagle", name: "Beagle", species: "dog" },
  { slug: "husky", name: "Husky", species: "dog", aliases: ["siberian husky"] },
  { slug: "poodle", name: "Poodle", species: "dog" },
  { slug: "shih-tzu", name: "Shih Tzu", species: "dog" },
  { slug: "yorkie", name: "Yorkie", species: "dog", aliases: ["yorkshire terrier"] },
  { slug: "boxer", name: "Boxer", species: "dog" },
  { slug: "rottweiler", name: "Rottweiler", species: "dog" },
  { slug: "australian-shepherd", name: "Australian Shepherd", species: "dog" },
  { slug: "cavalier-king-charles", name: "Cavalier King Charles Spaniel", species: "dog", aliases: ["cavalier king charles", "king charles spaniel"] },
  { slug: "cocker-spaniel", name: "Cocker Spaniel", species: "dog" },
  // Cats
  { slug: "tabby-cat", name: "Tabby Cat", species: "cat", aliases: ["tabby"] },
  { slug: "tuxedo-cat", name: "Tuxedo Cat", species: "cat", aliases: ["tuxedo"] },
  { slug: "black-cat", name: "Black Cat", species: "cat" },
  { slug: "maine-coon", name: "Maine Coon", species: "cat" },
  { slug: "ragdoll", name: "Ragdoll", species: "cat" },
  { slug: "persian-cat", name: "Persian Cat", species: "cat", aliases: ["persian"] },
  { slug: "siamese-cat", name: "Siamese Cat", species: "cat", aliases: ["siamese"] },
  { slug: "british-shorthair", name: "British Shorthair", species: "cat" },
  { slug: "bengal-cat", name: "Bengal Cat", species: "cat", aliases: ["bengal"] },
  { slug: "scottish-fold", name: "Scottish Fold", species: "cat" },
];

type StyleDef = { slug: string; name: string; description: string; dbId?: string };
const STYLES: StyleDef[] = [
  { slug: "watercolor", name: "Watercolor", description: "Soft pastel washes and loose brushwork — calm, painterly, gallery-ready.", dbId: "watercolour" },
  { slug: "oil-painting", name: "Oil Painting", description: "Rich umber tones, chiaroscuro lighting, museum-grade depth.", dbId: "renaissance" },
  { slug: "renaissance", name: "Renaissance", description: "Old-master oil portrait — your pet as a noble subject of the 1600s.", dbId: "renaissance" },
  { slug: "royal", name: "Royal", description: "Velvet crown, ermine cloak, full regal bearing — your pet, royally rendered.", dbId: "renaissance" },
  { slug: "modern-minimalist", name: "Modern Minimalist", description: "Clean linework, restrained palette, contemporary gallery feel." },
  { slug: "cosmic-astrology", name: "Cosmic Astrology", description: "Star-charts, nebulae, and your pet's birth-sky — the Little Souls signature." },
  { slug: "vintage-victorian", name: "Vintage Victorian", description: "Sepia tones and 19th-century formality — heirloom pet portraiture." },
  { slug: "pop-art", name: "Pop Art", description: "1960s Lichtenstein punch — bold outlines, Ben-Day dots, flat primaries.", dbId: "pop-art" },
  { slug: "anime", name: "Anime", description: "Expressive lineart with hand-painted backgrounds — animated film still." },
  { slug: "cartoon", name: "Cartoon", description: "Hero-shot animated portrait — soft, plush, instantly lovable.", dbId: "pixar" },
  { slug: "pencil-sketch", name: "Pencil Sketch", description: "Confident graphite linework on toned paper — quiet, classical.", dbId: "pencil" },
  { slug: "charcoal", name: "Charcoal", description: "Smoky greys, deep blacks, dramatic contrast — fine-art portraiture." },
  { slug: "impressionist", name: "Impressionist", description: "Loose, light-washed brushwork in the spirit of Monet and Renoir." },
  { slug: "art-nouveau", name: "Art Nouveau", description: "Mucha-style ornament, floral motifs, golden-age decorative panels." },
  { slug: "geometric", name: "Geometric", description: "Crisp facets and angular forms — modern, graphic, statement-piece." },
  { slug: "line-art", name: "Line Art", description: "Single-stroke elegance — minimal, framed-on-cream, designer-feel." },
];

const BREED_BY_SLUG = new Map(BREEDS.map(b => [b.slug, b]));
const STYLE_BY_SLUG = new Map(STYLES.map(s => [s.slug, s]));

// ── HTML escape helpers ───────────────────────────────────────────────────
function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escAttr(s: string | null | undefined): string { return esc(s); }

// ── data layer ────────────────────────────────────────────────────────────
type GalleryRow = {
  id: string;
  pet_kind: string;
  breed: string;
  pet_name: string | null;
  image_style: string;
  art_style: string;
  aspect_ratio: string;
  backstory: string | null;
  image_url: string;
  thumbnail_url: string | null;
  width: number;
  height: number;
  created_at: string;
};

async function fetchGalleryDirect(filter: { breed?: string; art_style?: string }, limit = PAGE_SIZE): Promise<GalleryRow[]> {
  // Hit Supabase REST directly with the anon key — same RLS path as the SPA's
  // /api/portraits proxy, but no internal HTTP roundtrip. Anon role has SELECT
  // on pawtrait_library WHERE approved=true (see migration 20260506_000000).
  const params = new URLSearchParams();
  params.set("select", "id,pet_kind,breed,pet_name,image_style,art_style,aspect_ratio,backstory,image_url,thumbnail_url,width,height,created_at");
  params.set("approved", "eq.true");
  params.set("image_style", "eq.portrait");
  params.set("order", "created_at.desc");
  params.set("limit", String(limit));
  if (filter.breed) params.set("breed", `eq.${filter.breed}`);
  if (filter.art_style) params.set("art_style", `eq.${filter.art_style}`);
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/pawtrait_library?${params.toString()}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!r.ok) return [];
    return (await r.json()) as GalleryRow[];
  } catch {
    return [];
  }
}

async function fetchBreedGallery(b: BreedDef): Promise<GalleryRow[]> {
  const candidates = [b.name, ...(b.aliases ?? [])];
  for (const c of candidates) {
    const rows = await fetchGalleryDirect({ breed: c });
    if (rows.length > 0) return rows;
  }
  return fetchGalleryDirect({});
}
async function fetchStyleGallery(s: StyleDef): Promise<GalleryRow[]> {
  if (s.dbId) {
    const rows = await fetchGalleryDirect({ art_style: s.dbId });
    if (rows.length > 0) return rows;
  }
  return fetchGalleryDirect({});
}

// ── meta builders ─────────────────────────────────────────────────────────
interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType: "website" | "product";
  h1: string;
  intro: string;
  galleryHeading: string;
  // For breed/style only — Product schema is emitted; for plain pages we omit.
  product?: { name: string; description: string };
  itemListName?: string;
}

function homeMeta(): PageMeta {
  return {
    title: "Custom Painted Pet Portraits — Watercolor, Renaissance & More | Little Souls",
    description: `Turn your pet's photo into a custom painted portrait. 20+ art styles. Digital download £${DIGITAL_PRICE_GBP}, canvas from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}). Printed locally (UK · EU · USA). Created with Pawtraits at Little Souls.`,
    canonical: `${SITE}/pawtraits`,
    ogImage: "https://www.littlesouls.app/og/pawtraits-default.jpg",
    ogType: "website",
    h1: "Custom Painted Pet Portraits — Watercolor, Renaissance & More",
    intro: `Turn your pet's photo into a custom painted portrait. Choose from watercolor, oil, renaissance, royal, and 20+ art styles. Personalized for dogs, cats, and small pets. Printed locally (UK · EU · USA) on gallery-stretched canvas — real wood frame upgrade available at checkout.`,
    galleryHeading: "Latest pawtraits",
  };
}
function galleryMeta(): PageMeta {
  return {
    title: "Pet Portrait Gallery — Browse 100+ Custom Painted Pet Art Designs | Little Souls",
    description: "Explore custom painted pet portraits across every breed and style. Watercolor golden retrievers, royal cats, renaissance dachshunds, and more. Get inspired or create your own.",
    canonical: `${SITE}/pawtraits/gallery`,
    ogImage: "https://www.littlesouls.app/og/pawtraits-gallery.jpg",
    ogType: "website",
    h1: "Pet Portrait Gallery — Browse Custom Painted Pet Art",
    intro: "Explore custom painted pet portraits across every breed and style. Watercolor golden retrievers, royal cats, renaissance dachshunds, and more. Get inspired or create your own.",
    galleryHeading: "Browse the gallery",
    itemListName: "Pet portrait gallery",
  };
}
function studioMeta(): PageMeta {
  return {
    title: "Pawtraits Studio — Create Your Custom Pet Portrait in Minutes | Little Souls",
    description: "Upload your pet's photo and watch them come to life as a custom painted portrait. Pick a style, generate, refine, download. From watercolor to renaissance — your pet, immortalized.",
    canonical: `${SITE}/pawtraits/studio`,
    ogImage: "https://www.littlesouls.app/og/pawtraits-studio.jpg",
    ogType: "website",
    h1: "Pawtraits Studio — Create Your Custom Pet Portrait",
    intro: "Upload your pet's photo and watch them come to life as a custom painted portrait. Pick a style, generate, refine, download. From watercolor to renaissance — your pet, immortalized.",
    galleryHeading: "Latest pawtraits",
  };
}

function breedMeta(b: BreedDef, heroImage: string): PageMeta {
  const ogTitle = `Custom ${b.name} Portraits — Painted Pet Art in Every Style`;
  const ogDescription = `Custom ${b.name} portraits made from your photo. Watercolour, renaissance, cosmic, modern — £${DIGITAL_PRICE_GBP} digital · canvas from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}) · printed locally (UK · EU · USA).`;
  return {
    title: ogTitle + " | Little Souls",
    description: ogDescription,
    canonical: `${SITE}/pawtraits/breed/${b.slug}`,
    ogImage: heroImage,
    ogType: "product",
    h1: ogTitle,
    intro: `Turn your ${b.name} into framed wall art — watercolour, renaissance, royal, cosmic. Each portrait is generated from your photo, printed locally on cotton canvas, and ready to hang.`,
    galleryHeading: `${b.name} portraits`,
    product: { name: ogTitle, description: ogDescription },
    itemListName: `${b.name} pet portraits`,
  };
}
function styleMeta(s: StyleDef, heroImage: string): PageMeta {
  const ogTitle = `${s.name} Pet Portraits — Custom Painted Art in ${s.name} Style`;
  const ogDescription = `Custom ${s.name.toLowerCase()} pet portraits made from your photo. Printed locally (UK · EU · USA) from £${BASE_PRICE_GBP}.`;
  return {
    title: ogTitle + " | Little Souls",
    description: ogDescription,
    canonical: `${SITE}/pawtraits/style/${s.slug}`,
    ogImage: heroImage,
    ogType: "product",
    h1: ogTitle,
    intro: `${s.description} Upload your dog or cat's photo and we'll render them in the ${s.name.toLowerCase()} tradition — printed locally on cotton canvas and shipped to your door.`,
    galleryHeading: `${s.name} portraits`,
    product: { name: ogTitle, description: ogDescription },
    itemListName: `${s.name} pet portraits`,
  };
}
function unknownLandingMeta(kind: "breed" | "style", slug: string): PageMeta {
  const title = kind === "breed" ? "Custom Pet Portraits" : "Pet Portrait Styles";
  const ogTitle = `${title} — Pawtraits by Little Souls`;
  const ogDescription = `Custom painted pet portraits made from your photo. Watercolour, renaissance, cosmic, modern — £${DIGITAL_PRICE_GBP} digital · canvas from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}) · printed locally (UK · EU · USA).`;
  return {
    title: ogTitle,
    description: ogDescription,
    canonical: `${SITE}/pawtraits/${kind}/${slug}`,
    ogImage: `${SITE}/og-image.jpg`,
    ogType: "website",
    h1: `${title} — Browse All Pawtraits`,
    intro: `That ${kind} isn't in our gallery yet, but every breed and style is available in the studio. Pick one of the ${kind === "breed" ? "breeds" : "styles"} below, or jump straight to the gallery.`,
    galleryHeading: "Latest pawtraits",
  };
}

// ── render ────────────────────────────────────────────────────────────────
function buildHead(meta: PageMeta, extraSchemas: unknown[]): string {
  const schemaScripts = extraSchemas
    .filter(Boolean)
    .map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n");
  const productMeta = meta.ogType === "product"
    ? `<meta property="product:price:amount" content="${BASE_PRICE_GBP.toFixed(2)}"/>
<meta property="product:price:currency" content="GBP"/>
<meta property="product:availability" content="in stock"/>
<meta property="og:price:amount" content="${BASE_PRICE_GBP.toFixed(2)}"/>
<meta property="og:price:currency" content="GBP"/>` : "";
  return `<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(meta.title)}</title>
<meta name="description" content="${escAttr(meta.description)}"/>
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/>
<link rel="canonical" href="${escAttr(meta.canonical)}"/>
<meta property="og:type" content="${meta.ogType}"/>
<meta property="og:title" content="${escAttr(meta.title)}"/>
<meta property="og:description" content="${escAttr(meta.description)}"/>
<meta property="og:image" content="${escAttr(meta.ogImage)}"/>
<meta property="og:url" content="${escAttr(meta.canonical)}"/>
<meta property="og:site_name" content="Little Souls"/>
${productMeta}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escAttr(meta.title)}"/>
<meta name="twitter:description" content="${escAttr(meta.description)}"/>
<meta name="twitter:image" content="${escAttr(meta.ogImage)}"/>
${schemaScripts}`;
}

function renderGalleryGrid(rows: GalleryRow[], emptyMessage: string): string {
  if (!rows.length) return `<p class="ls-empty">${esc(emptyMessage)}</p>`;
  const items = rows.map(r => {
    const alt = `${r.breed} portrait${r.art_style ? ` — ${r.art_style.replace(/-/g, " ")}` : ""}`;
    const src = r.thumbnail_url || r.image_url;
    return `<li class="ls-grid-item"><a href="/pawtraits/gallery"><img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy" width="${r.width || 800}" height="${r.height || 1000}"/></a></li>`;
  }).join("");
  return `<ul class="ls-grid">${items}</ul>`;
}

function renderInternalLinks(activeKind: "breed" | "style" | "none", activeSlug: string): string {
  const breedLis = BREEDS.map(b => {
    const active = activeKind === "breed" && b.slug === activeSlug ? ' aria-current="page"' : "";
    return `<li><a href="/pawtraits/breed/${escAttr(b.slug)}"${active}>${esc(b.name)}</a></li>`;
  }).join("");
  const styleLis = STYLES.map(s => {
    const active = activeKind === "style" && s.slug === activeSlug ? ' aria-current="page"' : "";
    return `<li><a href="/pawtraits/style/${escAttr(s.slug)}"${active}>${esc(s.name)}</a></li>`;
  }).join("");
  return `<section class="ls-explore">
  <div>
    <h2>Explore other breeds</h2>
    <ul class="ls-pills">${breedLis}</ul>
  </div>
  <div>
    <h2>Explore other styles</h2>
    <ul class="ls-pills">${styleLis}</ul>
  </div>
</section>`;
}

const STYLES_CSS = `:root{--cream:#FFFDF5;--ink:#3d2f2a;--body:#5a4a42;--muted:#9a8578;--border:#e8ddd0;--gold:#c4a265;--rose:#bf524a}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--body);font:17px/1.65 Georgia,"Times New Roman",serif;-webkit-font-smoothing:antialiased}
a{color:var(--gold);text-decoration:none}a:hover{text-decoration:underline}
.ls-wrap{max-width:1080px;margin:0 auto;padding:32px 20px 80px}
.ls-nav{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid var(--border);margin-bottom:32px}
.ls-nav .ls-brand{font-family:"DM Serif Display",Georgia,serif;font-size:18px;color:var(--ink)}
.ls-nav a.ls-cta{background:var(--rose);color:#fff;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase}
.ls-eyebrow{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;color:var(--muted);margin-bottom:10px}
h1{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(30px,5vw,46px);color:var(--ink);line-height:1.15;margin:0 0 16px}
h2{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(20px,3.6vw,28px);color:var(--ink);margin:36px 0 14px}
.ls-intro{max-width:62ch;font-size:18px;color:var(--body);margin:0 0 22px}
.ls-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:18px}
.ls-cta-row a.primary{background:var(--rose);color:#fff;padding:13px 22px;border-radius:999px;font-weight:600;font-size:14px}
.ls-cta-row a.secondary{background:#fff;border:1px solid var(--border);color:var(--ink);padding:13px 22px;border-radius:999px;font-weight:600;font-size:14px}
.ls-meta{font-size:13px;color:var(--muted);margin-bottom:36px}
.ls-grid{list-style:none;padding:0;margin:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))}
.ls-grid img{width:100%;height:auto;display:block;border-radius:8px;background:#f5efe6}
.ls-empty{padding:24px;border:1px solid var(--border);border-radius:14px;background:#fff;text-align:center;color:var(--muted)}
.ls-explore{margin-top:48px;padding-top:28px;border-top:1px solid var(--border);display:grid;gap:32px;grid-template-columns:1fr}
@media(min-width:720px){.ls-explore{grid-template-columns:1fr 1fr}}
.ls-pills{list-style:none;padding:0;margin:12px 0 0;display:flex;flex-wrap:wrap;gap:8px}
.ls-pills a{display:inline-block;border:1px solid var(--border);background:#fff;color:var(--ink);padding:6px 12px;border-radius:999px;font-size:13px}
.ls-pills a[aria-current="page"]{background:var(--rose);color:#fff;border-color:var(--rose)}
.ls-footer{margin-top:60px;padding-top:24px;border-top:1px solid var(--border);text-align:center;color:var(--muted);font-size:13px}
.ls-footer a{color:var(--muted);margin:0 8px}
.ls-trust{font-size:14px;color:var(--ink);margin:0 0 30px}
.ls-depth{margin-top:48px}.ls-depth .ls-why{max-width:62ch;color:var(--body)}
.ls-steps{max-width:62ch;color:var(--body);padding-left:20px}.ls-steps li{margin-bottom:6px}
.ls-faq{margin-top:36px}
.ls-faq-q{background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px 18px;margin-bottom:12px}
.ls-faq-q h3{font-family:"DM Serif Display",Georgia,serif;color:var(--ink);margin:0 0 6px;font-size:17px}
.ls-faq-q p{font-size:15px;color:var(--body);margin:0}`;

function renderHtml(meta: PageMeta, rows: GalleryRow[], opts: {
  activeKind: "breed" | "style" | "none";
  activeSlug: string;
  ctaHref: string;
  showInternalLinks: boolean;
  schemas: unknown[];
  extraBodyHtml?: string;
}): string {
  const head = buildHead(meta, opts.schemas);
  const grid = renderGalleryGrid(rows, "Fresh portraits arriving daily — check back soon, or start your own below.");
  const internalLinks = opts.showInternalLinks ? renderInternalLinks(opts.activeKind, opts.activeSlug) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
<style>${STYLES_CSS}</style>
</head>
<body>
<div class="ls-wrap">
  <nav class="ls-nav" aria-label="Primary">
    <a href="/pawtraits" class="ls-brand">Little Souls · Pawtraits</a>
    <a href="${escAttr(opts.ctaHref)}" class="ls-cta">Make yours</a>
  </nav>
  <noscript><p class="ls-meta">JavaScript is disabled — you're seeing a simplified view. <a href="/pawtraits">Open the full studio →</a></p></noscript>
  <main>
    <p class="ls-eyebrow">${opts.activeKind === "breed" ? "Breed Collection" : opts.activeKind === "style" ? "Style Collection" : "Pawtraits by Little Souls"}</p>
    <h1>${esc(meta.h1)}</h1>
    <p class="ls-intro">${esc(meta.intro)}</p>
    <div class="ls-cta-row">
      <a href="${escAttr(opts.ctaHref)}" class="primary">Create your own →</a>
      <a href="/pawtraits/gallery" class="secondary">Browse the gallery</a>
    </div>
    <p class="ls-meta">£${DIGITAL_PRICE_GBP} digital · canvas from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}) · Printed locally (UK · EU · USA) · Ships worldwide</p>
    <p class="ls-trust"><span style="color:#c4a265">★★★★★</span> <strong>4.9/5</strong> · loved by pet owners across the UK, EU &amp; USA</p>
    <h2>${esc(meta.galleryHeading)}</h2>
    ${grid}
    ${opts.extraBodyHtml ?? ""}
    ${internalLinks}
  </main>
  <footer class="ls-footer">
    <div>© Little Souls — custom painted pet portraits, printed and framed in the UK</div>
    <div style="margin-top:8px">
      <a href="/pawtraits">Studio</a>
      <a href="/pawtraits/gallery">Gallery</a>
      <a href="/contact">Contact</a>
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
    </div>
  </footer>
</div>
</body>
</html>`;
}

// ── schema builders ───────────────────────────────────────────────────────
const AGGREGATE_RATING = {
  "@type": "AggregateRating",
  ratingValue: "4.9",
  reviewCount: "71",
  bestRating: "5",
  worstRating: "1",
};

function productSchema(meta: PageMeta, heroImage: string, sku: string): unknown {
  if (!meta.product) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: meta.product.name,
    description: meta.product.description,
    image: heroImage,
    sku,
    brand: { "@type": "Brand", name: "Little Souls" },
    aggregateRating: AGGREGATE_RATING,
    offers: {
      "@type": "Offer",
      url: meta.canonical,
      priceCurrency: "GBP",
      price: BASE_PRICE_GBP.toFixed(2),
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "GBP" },
        shippingDestination: [
          { "@type": "DefinedRegion", addressCountry: "GB" },
          { "@type": "DefinedRegion", addressCountry: "US" },
          { "@type": "DefinedRegion", addressCountry: "DE" },
        ],
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: ["GB", "US"],
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };
}

// Organization + WebSite — gives Google a stable entity for every Pawtraits page.
function orgWebsiteSchemas(): unknown[] {
  return [
    {
      "@context": "https://schema.org", "@type": "Organization", "@id": `${SITE}/#organization`,
      name: "Little Souls", url: SITE, logo: `${SITE}/og-image.jpg`, aggregateRating: AGGREGATE_RATING,
      foundingDate: "2024", areaServed: "Worldwide",
      knowsAbout: ["pet astrology", "cosmic pet portraits", "custom pet portraits", "memorial pet portraits", "pet birth chart readings", "animal soul readings", "watercolour pet portraits", "renaissance pet portraits"],
      sameAs: ["https://twitter.com/LittleSoulsCo", "https://www.pinterest.com/littlesoulsapp"],
    },
    {
      "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE}/#website`,
      url: SITE, name: "Little Souls", publisher: { "@id": `${SITE}/#organization` },
    },
  ];
}
function breadcrumbSchema(items: Array<{ name: string; url?: string }>): unknown {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem", position: i + 1, name: it.name, ...(it.url ? { item: it.url } : {}),
    })),
  };
}
function faqSchema(faqs: Array<{ q: string; a: string }>): unknown {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map(f => ({
      "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

// Brand-locked FAQ + depth content for thin breed/style pages (visible HTML must
// match the FAQPage schema for rich-result eligibility).
function breedFaqs(b: BreedDef): Array<{ q: string; a: string }> {
  return [
    { q: `How do I turn my ${b.name} into a portrait?`, a: `Upload a clear photo of your ${b.name}, choose a style, and we paint them from it — delivered as a digital painting or printed locally on gallery canvas.` },
    { q: `Which styles suit a ${b.name}?`, a: `${b.name}s look striking in renaissance, watercolour, royal, and our signature cosmic style. You can preview every style before you order.` },
    { q: `How much is a ${b.name} portrait?`, a: `£${DIGITAL_PRICE_GBP} for a digital painting, canvas from £${BASE_PRICE_GBP}, with a real-wood frame upgrade. Printed locally (UK · EU · USA).` },
    { q: `Can I get a portrait of a ${b.name} who has passed?`, a: `Yes. Many ${b.name} portraits are memorial keepsakes — a way to keep them on the wall, and in the room.` },
  ];
}
function styleFaqs(s: StyleDef): Array<{ q: string; a: string }> {
  return [
    { q: `What is a ${s.name.toLowerCase()} pet portrait?`, a: s.description },
    { q: `Which pets suit the ${s.name.toLowerCase()} style?`, a: `Any dog or cat. Upload a clear photo and we render them in the ${s.name.toLowerCase()} tradition.` },
    { q: `How much is a ${s.name.toLowerCase()} portrait?`, a: `£${DIGITAL_PRICE_GBP} digital, canvas from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}). Printed locally (UK · EU · USA).` },
    { q: `How long does it take?`, a: `You preview your portrait within minutes. Canvas prints are made and shipped by local partners in the UK, EU, and USA.` },
  ];
}
function renderDepth(faqs: Array<{ q: string; a: string }>, what: string): string {
  const steps = `<ol class="ls-steps"><li>Upload a clear photo</li><li>Pick a style and preview it</li><li>Order the digital painting or a printed canvas</li></ol>`;
  const faqHtml = faqs.map(f => `<div class="ls-faq-q"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("");
  return `<section class="ls-depth"><h2>How it works</h2>${steps}<p class="ls-why">${esc(what)}</p></section>
<section class="ls-faq"><h2>Frequently asked questions</h2>${faqHtml}</section>`;
}
function itemListSchema(meta: PageMeta, rows: GalleryRow[]): unknown {
  if (!rows.length || !meta.itemListName) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: meta.itemListName,
    itemListElement: rows.slice(0, 12).map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "ImageObject",
        contentUrl: r.image_url,
        thumbnailUrl: r.thumbnail_url || r.image_url,
        caption: `${r.breed} portrait — ${r.art_style.replace(/-/g, " ")}`,
      },
    })),
  };
}

// ── handler ───────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set vary so caches don't poison bot vs. human responses (we're rewritten
  // here only when the UA matches — but if a human ever hits /api/pawtraits-ssr
  // directly they get the same SSR doc, which is fine).
  res.setHeader("Vary", "User-Agent");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400");

  const path = String(req.query.path ?? "home").trim();
  const slug = String(req.query.slug ?? "").trim();

  try {
    if (path === "home") {
      const rows = await fetchGalleryDirect({});
      const meta = homeMeta();
      const html = renderHtml(meta, rows, {
        activeKind: "none", activeSlug: "",
        ctaHref: "/pawtraits/studio",
        showInternalLinks: true,
        schemas: [...orgWebsiteSchemas(), breadcrumbSchema([{ name: "Home", url: `${SITE}/` }, { name: "Pawtraits" }])],
      });
      res.status(200).send(html);
      return;
    }

    if (path === "gallery") {
      const rows = await fetchGalleryDirect({}, 24);
      const meta = galleryMeta();
      const html = renderHtml(meta, rows, {
        activeKind: "none", activeSlug: "",
        ctaHref: "/pawtraits/studio",
        showInternalLinks: true,
        schemas: [...orgWebsiteSchemas(), itemListSchema(meta, rows),
          breadcrumbSchema([{ name: "Home", url: `${SITE}/` }, { name: "Pawtraits", url: `${SITE}/pawtraits` }, { name: "Gallery" }])],
      });
      res.status(200).send(html);
      return;
    }

    if (path === "studio") {
      const rows = await fetchGalleryDirect({}, 6);
      const meta = studioMeta();
      const html = renderHtml(meta, rows, {
        activeKind: "none", activeSlug: "",
        ctaHref: "/pawtraits/studio",
        showInternalLinks: true,
        schemas: [...orgWebsiteSchemas()],
      });
      res.status(200).send(html);
      return;
    }

    if (path === "breed") {
      const breed = BREED_BY_SLUG.get(slug);
      let rows: GalleryRow[] = [];
      let meta: PageMeta;
      if (breed) {
        rows = await fetchBreedGallery(breed);
        const heroImage = rows[0]?.image_url || `${SITE}/og-image.jpg`;
        meta = breedMeta(breed, heroImage);
      } else {
        rows = await fetchGalleryDirect({});
        meta = unknownLandingMeta("breed", slug);
      }
      const ctaHref = breed
        ? `/pawtraits/studio?breed=${encodeURIComponent(breed.slug)}`
        : "/pawtraits/studio";
      const faqs = breed ? breedFaqs(breed) : [];
      const depth = breed ? renderDepth(faqs, meta.intro) : "";
      const schemas = breed
        ? [productSchema(meta, meta.ogImage, breed.slug), itemListSchema(meta, rows), faqSchema(faqs),
           breadcrumbSchema([{ name: "Home", url: `${SITE}/` }, { name: "Pawtraits", url: `${SITE}/pawtraits` }, { name: breed.name }]),
           ...orgWebsiteSchemas()]
        : [...orgWebsiteSchemas()];
      const html = renderHtml(meta, rows, {
        activeKind: "breed", activeSlug: slug,
        ctaHref, showInternalLinks: true, schemas, extraBodyHtml: depth,
      });
      res.status(200).send(html);
      return;
    }

    if (path === "style") {
      const style = STYLE_BY_SLUG.get(slug);
      let rows: GalleryRow[] = [];
      let meta: PageMeta;
      if (style) {
        rows = await fetchStyleGallery(style);
        const heroImage = rows[0]?.image_url || `${SITE}/og-image.jpg`;
        meta = styleMeta(style, heroImage);
      } else {
        rows = await fetchGalleryDirect({});
        meta = unknownLandingMeta("style", slug);
      }
      const ctaHref = style
        ? `/pawtraits/studio?style=${encodeURIComponent(style.slug)}`
        : "/pawtraits/studio";
      const faqs = style ? styleFaqs(style) : [];
      const depth = style ? renderDepth(faqs, meta.intro) : "";
      const schemas = style
        ? [productSchema(meta, meta.ogImage, style.slug), itemListSchema(meta, rows), faqSchema(faqs),
           breadcrumbSchema([{ name: "Home", url: `${SITE}/` }, { name: "Pawtraits", url: `${SITE}/pawtraits` }, { name: style.name }]),
           ...orgWebsiteSchemas()]
        : [...orgWebsiteSchemas()];
      const html = renderHtml(meta, rows, {
        activeKind: "style", activeSlug: slug,
        ctaHref, showInternalLinks: true, schemas, extraBodyHtml: depth,
      });
      res.status(200).send(html);
      return;
    }

    // Unknown path — fall through to a minimal home doc rather than 404 so the
    // bot still indexes something useful.
    const rows = await fetchGalleryDirect({});
    const meta = homeMeta();
    const html = renderHtml(meta, rows, {
      activeKind: "none", activeSlug: "",
      ctaHref: "/pawtraits/studio",
      showInternalLinks: true,
      schemas: [],
    });
    res.status(200).send(html);
  } catch (err) {
    console.error("[pawtraits-ssr] error", err);
    res.status(500).setHeader("Content-Type", "text/plain").send("internal error");
  }
}
