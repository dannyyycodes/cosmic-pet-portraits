/**
 * Programmatic SEO landing pages for Pawtraits.
 *
 *   /pawtraits/breed/:breed   — e.g. /pawtraits/breed/golden-retriever
 *   /pawtraits/style/:style   — e.g. /pawtraits/style/watercolor
 *
 * Pinterest deep-links from breed × style boards land here so visitors arrive
 * on a relevant, indexable, OG-tagged page (NOT the generic studio).
 *
 * Each page renders:
 *  • H1 + intro paragraph (keyword-natural, not stuffed)
 *  • Filtered gallery (~12 portraits) via /api/portraits ?op=gallery
 *  • Single primary CTA → /pawtraits/studio?breed=<slug> with UTM preserved
 *  • Internal link cluster (other breeds, other styles)
 *  • OG tags + JSON-LD Product schema for Pinterest Rich Pins
 *  • Canonical URL
 *
 * Unknown slugs do NOT 404 — they render an explanatory empty-state with the
 * full list of valid slugs, so Pinterest never sees a dead link.
 *
 * IMPORTANT: this is a SPA route — Helmet injects tags client-side. Pinterest's
 * crawler does not JS-render, so the OG tags are visible to JS-rendering
 * crawlers (Google, modern Bing) but NOT to Pinterest's primary scraper. To
 * surface Rich Pins to Pinterest specifically, a server-side rewrite analogous
 * to /api/blog-ssr will be needed (see report). The Helmet tags are still
 * useful for Twitter/Facebook/LinkedIn/Discord, all of which DO JS-render.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SITE = "https://www.littlesouls.app";
// Base price — sourced from src/components/portraits/gelatoFramedCanvas.ts (8×10″ unframed tier).
// 2026-05-12: product line restructured.
//   • Digital download — £19 (entry SKU, no shipping, ~97% margin)
//   • Unframed canvas  — From £39 (physical entry, ships worldwide)
//   • Frame upgrade    — +£45 to +£110 depending on size
// BASE_PRICE_GBP is canvas entry (the headline number Pinterest etc. care about).
const DIGITAL_PRICE_GBP = 19;
const BASE_PRICE_GBP = 39;
const FRAME_UPGRADE_FROM_GBP = 45;
const PAGE_SIZE = 12;

// ── breed slug → display name + DB filter value ────────────────────────────
// The pawtrait_library.breed column is free-text from the studio. To improve
// hit-rate we try the slug-with-spaces ("golden retriever") AND a couple of
// common spellings; if all return zero rows, the page still renders fine
// with a tasteful empty state and the explore-more cluster.
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

// ── style slug → display name + DB filter value ────────────────────────────
// The pawtrait_library.art_style values come from src/components/portraits/
// styles/styleTheme.ts (id field). The SEO slugs intentionally match Pinterest
// search-bar autocomplete (e.g. "watercolor" without the u), then map to the
// internal style id ("watercolour"). Slugs without a clean DB equivalent
// still render — they just show the unfiltered top gallery.
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

type GalleryRow = {
  id: string;
  pet_kind: 'dog' | 'cat' | 'small-pet' | 'other';
  breed: string;
  pet_name: string | null;
  image_style: 'portrait' | 'scene';
  art_style: string;
  aspect_ratio: string;
  backstory: string | null;
  image_url: string;
  thumbnail_url: string | null;
  width: number;
  height: number;
  created_at: string;
};

function preserveUtm(search: string, extra: Record<string, string>): string {
  const params = new URLSearchParams(search);
  // Keep only marketing params; drop everything else (avoid cache-busting noise).
  const KEEP = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  const out = new URLSearchParams();
  for (const k of KEEP) {
    const v = params.get(k);
    if (v) out.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) out.set(k, v);
  const s = out.toString();
  return s ? `?${s}` : '';
}

async function fetchGallery(filter: { breed?: string; art_style?: string }, limit = PAGE_SIZE): Promise<GalleryRow[]> {
  try {
    const r = await fetch('/api/portraits?action=library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'gallery', image_style: 'portrait', limit, offset: 0, ...filter }),
    });
    const d = await r.json() as { rows?: GalleryRow[] };
    return d.rows ?? [];
  } catch {
    return [];
  }
}

/** Try the canonical breed name + each alias until one returns rows. */
async function fetchBreedGallery(b: BreedDef): Promise<GalleryRow[]> {
  const candidates = [b.name, ...(b.aliases ?? [])];
  for (const c of candidates) {
    const rows = await fetchGallery({ breed: c });
    if (rows.length > 0) return rows;
  }
  // Final fallback: drop the breed filter, return the latest gallery so the
  // page is never empty (Pinterest hates dead pages).
  return fetchGallery({});
}

async function fetchStyleGallery(s: StyleDef): Promise<GalleryRow[]> {
  if (s.dbId) {
    const rows = await fetchGallery({ art_style: s.dbId });
    if (rows.length > 0) return rows;
  }
  return fetchGallery({});
}

function GalleryGrid({ rows }: { rows: GalleryRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
        <p className="text-sm text-neutral-500">Fresh portraits arriving daily — check back soon, or start your own below.</p>
      </div>
    );
  }
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}
    >
      {rows.map(r => {
        const aspect = r.width && r.height ? r.width / r.height : 0.8;
        return (
          <Link
            key={r.id}
            to="/pawtraits/gallery"
            className="group relative block w-full overflow-hidden rounded-lg bg-neutral-100"
            style={{ aspectRatio: `${aspect}` }}
            aria-label={`${r.breed} pawtrait`}
          >
            <img
              src={r.thumbnail_url || r.image_url}
              alt={`${r.breed} portrait${r.art_style ? ` — ${r.art_style.replace(/-/g, ' ')}` : ''}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          </Link>
        );
      })}
    </div>
  );
}

function InternalLinkCluster({ kind, currentSlug }: { kind: 'breed' | 'style'; currentSlug: string }) {
  return (
    <section className="mt-16 border-t border-neutral-200 pt-12">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-neutral-900">Explore other breeds</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {BREEDS.map(b => {
              const active = kind === 'breed' && b.slug === currentSlug;
              return (
                <li key={b.slug}>
                  <Link
                    to={`/pawtraits/breed/${b.slug}`}
                    className={`inline-block rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'border-[#bf524a] bg-[#bf524a] text-white'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    {b.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-neutral-900">Explore other styles</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {STYLES.map(s => {
              const active = kind === 'style' && s.slug === currentSlug;
              return (
                <li key={s.slug}>
                  <Link
                    to={`/pawtraits/style/${s.slug}`}
                    className={`inline-block rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? 'border-[#bf524a] bg-[#bf524a] text-white'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    {s.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

interface PageMeta {
  h1: string;
  intro: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ctaHref: (search: string) => string;
  itemListName: string;
}

function buildBreedMeta(b: BreedDef): PageMeta {
  return {
    h1: `Custom ${b.name} Portraits — Painted Pet Art in Every Style`,
    intro: `Turn your ${b.name} into gallery-ready wall art — watercolour, renaissance, royal, cosmic. Each portrait is generated from your photo, printed locally on cotton canvas, and ready to hang. Real wood frame upgrade available at checkout.`,
    canonical: `${SITE}/pawtraits/breed/${b.slug}`,
    ogTitle: `Custom ${b.name} Portraits — Painted Pet Art in Every Style`,
    ogDescription: `Custom ${b.name} portraits made from your photo. Watercolour, renaissance, cosmic, modern — £${DIGITAL_PRICE_GBP} digital · canvas from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}) · printed locally (UK · EU · USA).`,
    ctaHref: (search) => `/pawtraits/studio${preserveUtm(search, { breed: b.slug })}`,
    itemListName: `${b.name} pet portraits`,
  };
}

function buildStyleMeta(s: StyleDef): PageMeta {
  return {
    h1: `${s.name} Pet Portraits — Custom Painted Art in ${s.name} Style`,
    intro: `${s.description} Upload your dog or cat's photo and we'll render them in the ${s.name.toLowerCase()} tradition — printed locally on cotton canvas, ready to hang. Real wood frame upgrade optional at checkout.`,
    canonical: `${SITE}/pawtraits/style/${s.slug}`,
    ogTitle: `${s.name} Pet Portraits — Custom Painted Art in ${s.name} Style`,
    ogDescription: `Custom ${s.name.toLowerCase()} pet portraits made from your photo. Printed in the UK from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}).`,
    ctaHref: (search) => `/pawtraits/studio${preserveUtm(search, { style: s.slug })}`,
    itemListName: `${s.name} pet portraits`,
  };
}

function buildUnknownMeta(kind: 'breed' | 'style', slug: string): PageMeta {
  const title = kind === 'breed' ? 'Custom Pet Portraits' : 'Pet Portrait Styles';
  return {
    h1: `${title} — Browse All Pawtraits`,
    intro: `That ${kind} isn't in our gallery yet, but every breed and style is available in the studio. Pick one of the ${kind === 'breed' ? 'breeds' : 'styles'} below, or jump straight to the gallery to see what's been made.`,
    canonical: `${SITE}/pawtraits/${kind}/${slug}`,
    ogTitle: `${title} — Pawtraits by Little Souls`,
    ogDescription: `Custom painted pet portraits made from your photo. Watercolour, renaissance, cosmic, modern — £${DIGITAL_PRICE_GBP} digital · canvas from £${BASE_PRICE_GBP} (frame +£${FRAME_UPGRADE_FROM_GBP}) · printed locally (UK · EU · USA).`,
    ctaHref: (search) => `/pawtraits/studio${preserveUtm(search, {})}`,
    itemListName: 'Pet portraits',
  };
}

interface SEOPageProps { kind: 'breed' | 'style' }

export default function PawtraitsSEOLanding({ kind }: SEOPageProps) {
  const params = useParams<{ breed?: string; style?: string }>();
  const location = useLocation();
  const slug = (kind === 'breed' ? params.breed : params.style) ?? '';

  const breed = kind === 'breed' ? BREED_BY_SLUG.get(slug) : undefined;
  const style = kind === 'style' ? STYLE_BY_SLUG.get(slug) : undefined;
  const known = Boolean(breed || style);

  const meta = useMemo<PageMeta>(() => {
    if (breed) return buildBreedMeta(breed);
    if (style) return buildStyleMeta(style);
    return buildUnknownMeta(kind, slug);
  }, [kind, slug, breed, style]);

  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRows([]);
    (async () => {
      const r = breed
        ? await fetchBreedGallery(breed)
        : style
          ? await fetchStyleGallery(style)
          : await fetchGallery({});
      if (!cancelled) {
        setRows(r);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [breed, style]);

  const heroImage = rows[0]?.image_url || `${SITE}/og-image.jpg`;
  const ctaHref = meta.ctaHref(location.search);

  // Product JSON-LD — Pinterest Rich Pin compatible. ItemList of gallery rows
  // gives Google secondary context for the page-as-collection.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: meta.h1,
    description: meta.ogDescription,
    image: heroImage,
    brand: { "@type": "Brand", name: "Little Souls" },
    offers: {
      "@type": "Offer",
      url: meta.canonical,
      priceCurrency: "GBP",
      price: BASE_PRICE_GBP.toFixed(2),
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  };
  const itemListSchema = rows.length > 0 ? {
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
        caption: `${r.breed} portrait — ${r.art_style.replace(/-/g, ' ')}`,
      },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-neutral-900">
      <Helmet>
        <title>{meta.ogTitle}</title>
        <meta name="description" content={meta.ogDescription} />
        <link rel="canonical" href={meta.canonical} />
        {/* Open Graph — product type for Pinterest Rich Pins */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={meta.ogTitle} />
        <meta property="og:description" content={meta.ogDescription} />
        <meta property="og:image" content={heroImage} />
        <meta property="og:url" content={meta.canonical} />
        <meta property="og:site_name" content="Little Souls" />
        {/* Pinterest / Facebook product price tags */}
        <meta property="product:price:amount" content={BASE_PRICE_GBP.toFixed(2)} />
        <meta property="product:price:currency" content="GBP" />
        <meta property="product:availability" content="in stock" />
        <meta property="og:price:amount" content={BASE_PRICE_GBP.toFixed(2)} />
        <meta property="og:price:currency" content="GBP" />
        {/* Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.ogTitle} />
        <meta name="twitter:description" content={meta.ogDescription} />
        <meta name="twitter:image" content={heroImage} />
        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        {itemListSchema && (
          <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        )}
      </Helmet>

      {/* Top nav strip — minimal, gives users a way back */}
      <header className="border-b border-neutral-200 bg-[#FFFDF5]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/pawtraits" className="font-serif text-lg text-neutral-900">Little Souls · Pawtraits</Link>
          <Link
            to={ctaHref}
            className="rounded-full bg-[#bf524a] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:opacity-95"
          >
            Make yours
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        {/* Hero */}
        <section className="max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {kind === 'breed' ? 'Breed Collection' : 'Style Collection'}
            {!known && ' · Browse all'}
          </p>
          <h1 className="font-serif text-4xl leading-tight text-neutral-900 sm:text-5xl">
            {meta.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            {meta.intro}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-[#bf524a] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(191,82,74,0.25)] transition hover:opacity-95"
            >
              Create your own →
            </Link>
            <Link
              to="/pawtraits/gallery"
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-neutral-400"
            >
              Browse the gallery
            </Link>
          </div>
          <p className="mt-4 text-xs text-neutral-500">
            £{DIGITAL_PRICE_GBP} digital · canvas from £{BASE_PRICE_GBP} (frame +£{FRAME_UPGRADE_FROM_GBP}) · Printed locally (UK · EU · USA)
          </p>
        </section>

        {/* Gallery */}
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-2xl text-neutral-900">
              {known
                ? (breed ? `${breed.name} portraits` : `${style!.name} portraits`)
                : 'Latest pawtraits'}
            </h2>
            <Link to="/pawtraits/gallery" className="text-sm text-neutral-600 underline-offset-4 hover:underline">
              See all →
            </Link>
          </div>
          {loading ? (
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}
            >
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-neutral-200" style={{ aspectRatio: '2/3' }} />
              ))}
            </div>
          ) : (
            <GalleryGrid rows={rows} />
          )}
        </section>

        {/* Secondary CTA band */}
        <section className="mt-16 rounded-2xl bg-neutral-900 px-8 py-12 text-center text-white">
          <h2 className="font-serif text-2xl sm:text-3xl">
            {breed ? `Make a ${breed.name} portrait` : style ? `Render yours in ${style.name}` : 'Make your own pawtrait'}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-300">
            Upload one clear photo. Pick a style. Order a framed print delivered in 5–7 working days.
          </p>
          <Link
            to={ctaHref}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#bf524a] px-7 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Start your portrait →
          </Link>
        </section>

        {/* Internal link cluster */}
        <InternalLinkCluster kind={kind} currentSlug={slug} />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neutral-200 bg-[#faf4e8]">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-neutral-500">
          <p>© Little Souls · Custom painted pet portraits, printed locally across UK, EU, USA</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            <Link to="/pawtraits" className="hover:text-neutral-700">Studio</Link>
            <Link to="/pawtraits/gallery" className="hover:text-neutral-700">Gallery</Link>
            <Link to="/contact" className="hover:text-neutral-700">Contact</Link>
            <Link to="/terms" className="hover:text-neutral-700">Terms</Link>
            <Link to="/privacy" className="hover:text-neutral-700">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Re-export for use elsewhere if needed (e.g. SSR / sitemap generation)
export { BREEDS, STYLES };
