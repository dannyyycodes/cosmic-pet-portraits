/**
 * /pawtraits/gallery — Sora-2-style explore page.
 *
 * Edge-to-edge image grid. No hero, no headline, no captions on tiles.
 * Just the back-arrow button (top-left) and the images. Click any tile
 * to open a fullscreen overlay with the prompt + creative attributes
 * + a "Make yours" CTA.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

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

type FullRow = GalleryRow & {
  prompt: string;
  home_setting?: string | null;
  pet_action?: string | null;
  canvas_format?: string | null;
};

const PAGE_SIZE = 30;

function prettyArtStyle(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Plain-English description of an art style for non-technical visitors.
 * Matches by keyword (most-specific first), falls back to a generic line.
 * Goal: someone unfamiliar with art terminology can pick a style by reading
 * one sentence in their own language.
 */
function friendlyStyleDescription(artStyle: string): string {
  const s = (artStyle || '').toLowerCase();
  if (s.includes('renaissance') || s.includes('royal-oil') || s.includes('baroque')) return 'Classical and elegant — like a painting in a grand old gallery.';
  if (s.includes('chalk') || s.includes('pastel')) return 'Soft and dreamy — like a chalk drawing on warm paper.';
  if (s.includes('watercolour') || s.includes('watercolor')) return 'Soft and painterly — gentle washes of colour, like a real watercolour painting.';
  if (s.includes('gouache')) return 'Warm and painterly with bold flat colours — feels hand-painted.';
  if (s.includes('charcoal') || s.includes('sketch')) return 'A hand-drawn pencil-and-charcoal sketch — quiet and timeless.';
  if (s.includes('linocut') || s.includes('woodcut')) return 'Bold black lines and warm colours — like a hand-carved folk-art print.';
  if (s.includes('screenprint') || s.includes('matchbox')) return 'Bright and graphic — like an old printed poster.';
  if (s.includes('risograph') || s.includes('risogr')) return 'Cheerful and colourful — like a vintage zine print, slightly rough on purpose.';
  if (s.includes('comic') || s.includes('pop-art')) return 'Bright and playful — like a comic-book panel.';
  if (s.includes('neon') || s.includes('sign')) return 'Glowing and electric — like a neon sign in a city window.';
  if (s.includes('claymation') || s.includes('clay') || s.includes('toy')) return 'Playful and rounded — like a stop-motion clay character or a toy on a shelf.';
  if (s.includes('felted') || s.includes('wool') || s.includes('plush') || s.includes('textile')) return 'Cosy and handmade — like a soft felt toy you could pick up.';
  if (s.includes('ceramic') || s.includes('tile')) return 'Warm and old-world — like a hand-painted ceramic tile.';
  if (s.includes('storybook') || s.includes('nursery') || s.includes('cartoon') || s.includes('pixar')) return "Sweet and friendly — like a children's book illustration.";
  if (s.includes('editorial') || s.includes('collage') || s.includes('magazine')) return 'Stylish and modern — like a fashion magazine cover.';
  if (s.includes('minimal') || s.includes('line-art') || s.includes('modern-graphic')) return 'Clean and simple — bold outlines, lots of white space.';
  if (s.includes('vintage') || s.includes('retro') || s.includes('mid-century')) return 'Warm vintage feel — like a poster from another era.';
  if (s.includes('cosmic') || s.includes('astrology') || s.includes('celestial') || s.includes('starry')) return 'Dreamy and otherworldly — soft stars and gentle glow.';
  if (s.includes('memorial') || s.includes('rainbow-bridge')) return 'Tender and quiet — a respectful keepsake.';
  if (s.includes('cowboy') || s.includes('western') || s.includes('wanted')) return 'Old western character — a bit of mischief and a lot of heart.';
  if (s.includes('art-deco') || s.includes('deco')) return 'Glamorous and geometric — black, gold and a 1920s feel.';
  if (s.includes('noir') || s.includes('villain')) return 'Moody and dramatic — heavy shadows, low light.';
  if (s.includes('mountain') || s.includes('explorer') || s.includes('travel')) return 'Adventurous outdoors feel — like a vintage travel poster.';
  if (s.includes('botanical') || s.includes('floral') || s.includes('wreath')) return 'Surrounded by leaves and flowers — soft, pretty, and warm.';
  if (s.includes('folk')) return 'Warm and old-world — hand-painted folk-art feel.';
  return 'A unique hand-crafted style — see the picture for what it looks like.';
}

/**
 * Browse-by-vibe buckets for the filter chip bar. Each bucket matches multiple
 * art_style slugs by keyword. "All" is special — no filter. Bucket names are
 * non-technical so a first-time visitor knows what to click.
 */
const STYLE_BUCKETS: { name: string; match: (s: string) => boolean }[] = [
  { name: 'All', match: () => true },
  { name: 'Soft & Painterly', match: (s) => /(watercolou?r|gouache|chalk|pastel|charcoal|sketch)/i.test(s) },
  { name: 'Classical & Royal', match: (s) => /(renaissance|royal|baroque|oil)/i.test(s) },
  { name: 'Bold & Graphic', match: (s) => /(linocut|woodcut|screenprint|comic|pop-art|neon|matchbox|risograph)/i.test(s) },
  { name: 'Cosy & Handmade', match: (s) => /(felted|wool|plush|textile|ceramic|tile|claymation|clay|toy|storybook|nursery|folk)/i.test(s) },
  { name: 'Vintage', match: (s) => /(vintage|retro|mid-century|matchbox|wanted|cowboy|deco)/i.test(s) },
  { name: 'Modern', match: (s) => /(modern|minimal|line-art|editorial|collage|magazine)/i.test(s) },
  { name: 'Dreamy & Cosmic', match: (s) => /(cosmic|astrology|celestial|starry|dream)/i.test(s) },
];

/**
 * Clean the internal generation prompt into a customer-facing creative description.
 * The raw prompt contains "Type A Pawtraits", "Pet-only", "print-safe margins, sRGB",
 * and a long negative-prompt suffix — all internal noise that shouldn't appear in the
 * gallery. We strip those and leave the pet description + art-style description, which
 * reads like a curator's placard.
 */
function cleanPromptForCustomer(raw: string): string {
  if (!raw) return '';
  return raw
    // "Vertical 2:3 Type A Pawtraits portrait of" → "Portrait of"
    .replace(/^Vertical \d+:\d+\s*Type [AB]\s*Pawtraits\s*(portrait|customer-style room scene)\b/i, 'Portrait')
    // "Pet-only" is internal phrasing
    .replace(/\bPet-only\s+/gi, '')
    // Drop technical print specs
    .replace(/,?\s*print-safe margins,?\s*sRGB\.?/gi, '.')
    // Drop the negative-prompt suffix (always at the end)
    .replace(/\s*No room,?\s*no wall,?\s*no canvas,?\s*no human,?\s*no second animal,?\s*no text,?\s*no logo,?\s*no watermark\.?\s*$/i, '')
    // Tidy
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function PawtraitTile({ row, onOpen }: { row: GalleryRow; onOpen: (row: GalleryRow) => void }) {
  const aspect = row.width && row.height ? row.width / row.height : 1;
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      aria-label={`Open ${row.breed} pawtrait`}
      className="group relative block w-full overflow-hidden bg-neutral-900 cursor-zoom-in"
      style={{ aspectRatio: `${aspect}` }}
    >
      <img
        src={row.thumbnail_url || row.image_url}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
      />
      {/* Caption overlay: hidden by default on hover-capable devices (mouse), revealed on
          hover. On touch devices (no hover), caption is always visible so the user can
          read it before tapping into the modal. */}
      <figcaption
        className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4 text-left text-white transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0) 100%)',
        }}
      >
        <p className="font-serif leading-tight" style={{ fontSize: 16 }}>
          {row.pet_name ? `${row.pet_name} the ` : ''}{row.breed}
        </p>
        <p className="mt-1 uppercase" style={{ fontSize: 10, letterSpacing: '0.14em', color: '#c4a265' }}>
          {prettyArtStyle(row.art_style)}
        </p>
      </figcaption>
    </button>
  );
}

function PawtraitModal({ row, onClose, onFilterStyle }: { row: GalleryRow; onClose: () => void; onFilterStyle?: (artStyle: string) => void }) {
  const [full, setFull] = useState<FullRow | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingFull(true);
    fetch('/api/portraits?action=library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'get', id: row.id }),
    })
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.row) setFull(d.row as FullRow); })
      .catch(() => { /* show what we have */ })
      .finally(() => { if (!cancelled) setLoadingFull(false); });

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { cancelled = true; document.body.style.overflow = prev; };
  }, [row.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'i' || e.key === 'I') setShowDetails(v => !v);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#000' }}
    >
      {/* Image */}
      <img
        src={row.image_url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-screen max-w-screen object-contain"
        style={{ maxHeight: '100vh', maxWidth: '100vw' }}
      />

      {/* Close (top-right) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl font-light"
        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', backdropFilter: 'blur(8px)' }}
      >×</button>

      {/* Info toggle (top-left of image) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowDetails(v => !v); }}
        aria-label="Toggle details"
        className="fixed left-4 top-4 z-10 flex h-10 items-center justify-center rounded-full px-4 text-xs uppercase tracking-widest"
        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', backdropFilter: 'blur(8px)', letterSpacing: '0.16em' }}
      >
        {showDetails ? 'Hide' : 'Info'}
      </button>

      {/* Slide-up detail sheet — old-people-friendly: plain-English description first,
          big primary CTA, technical prompt collapsed behind an expander. */}
      {showDetails && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-x-0 bottom-0 z-10 max-h-[78vh] overflow-y-auto p-6 sm:p-10"
          style={{
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div className="mx-auto max-w-3xl">
            <p className="uppercase mb-3" style={{ letterSpacing: '0.18em', fontSize: 12, opacity: 0.6, color: '#c4a265' }}>
              {prettyArtStyle(row.art_style)}
            </p>
            <h2 className="font-serif" style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {row.pet_name ? `${row.pet_name} the ` : ''}{row.breed}
            </h2>

            {/* Plain-English style description — main piece of guidance for non-technical visitors. */}
            <p className="mt-5" style={{ fontSize: 19, lineHeight: 1.5, opacity: 0.92, fontFamily: 'Georgia, serif' }}>
              {friendlyStyleDescription(row.art_style)}
            </p>

            {row.backstory && (
              <p className="mt-3 italic" style={{ fontSize: 16, lineHeight: 1.5, opacity: 0.7, fontFamily: 'Georgia, serif' }}>
                "{row.backstory}"
              </p>
            )}

            {/* Primary action — what 95% of visitors should click. */}
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <Link
                to={`/pawtraits?style=${encodeURIComponent(row.art_style)}#studio`}
                className="inline-flex items-center justify-center rounded-full font-semibold transition active:scale-95"
                style={{
                  background: '#bf524a',
                  color: '#fff',
                  fontSize: 17,
                  padding: '16px 28px',
                  minHeight: 56,
                  letterSpacing: '0.02em',
                  boxShadow: '0 8px 28px rgba(191, 82, 74, 0.45)',
                }}
              >
                Make my pet in this style →
              </Link>
              {onFilterStyle && (
                <button
                  type="button"
                  onClick={() => { onFilterStyle(row.art_style); onClose(); }}
                  className="inline-flex items-center justify-center rounded-full font-medium transition active:scale-95"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.18)',
                    fontSize: 15,
                    padding: '14px 22px',
                    minHeight: 52,
                  }}
                >
                  See more like this
                </button>
              )}
            </div>
            <p className="mt-3 text-[13px]" style={{ opacity: 0.55 }}>
              Upload a photo · we paint the portrait · framed canvas to your door.
            </p>

            {/* Technical details — collapsed by default. Power users can pop it open. */}
            <div className="mt-8 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                onClick={() => setShowTechnical(v => !v)}
                className="text-[12px] uppercase"
                style={{ letterSpacing: '0.18em', opacity: 0.55, color: '#fff' }}
              >
                {showTechnical ? '▴ Hide technical details' : '▾ Show technical details'}
              </button>
              {showTechnical && (
                <div
                  className="mt-4 rounded-xl p-5"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="uppercase" style={{ letterSpacing: '0.18em', fontSize: 11, opacity: 0.55 }}>
                      Creative direction
                    </p>
                    {full?.prompt && (
                      <button
                        type="button"
                        onClick={async () => {
                          const text = cleanPromptForCustomer(full.prompt);
                          try {
                            await navigator.clipboard.writeText(text);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          } catch {
                            const ta = document.createElement('textarea');
                            ta.value = text;
                            document.body.appendChild(ta);
                            ta.select();
                            try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
                            document.body.removeChild(ta);
                          }
                        }}
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase transition"
                        style={{
                          letterSpacing: '0.12em',
                          background: copied ? '#c4a265' : 'rgba(191, 82, 74, 0.85)',
                          color: '#fff',
                        }}
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  {loadingFull ? (
                    <p className="text-[14px]" style={{ opacity: 0.5 }}>Loading…</p>
                  ) : full?.prompt ? (
                    <p className="text-[14px] leading-relaxed" style={{ opacity: 0.85, fontFamily: 'Georgia, serif' }}>
                      {cleanPromptForCustomer(full.prompt)}
                    </p>
                  ) : (
                    <p className="text-[14px]" style={{ opacity: 0.5 }}>Description unavailable.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PawtraitsGallery() {
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState<GalleryRow | null>(null);
  // Filter state — `bucket` is the selected vibe bucket (or "All"). `pinnedStyle`
  // is set when the user clicks "See more like this" inside the modal — it locks
  // the grid to a specific art_style slug regardless of bucket.
  const [bucket, setBucket] = useState<string>('All');
  const [pinnedStyle, setPinnedStyle] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (off: number) => {
    setLoading(true);
    try {
      const r = await fetch('/api/portraits?action=library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Library = portraits only (full-frame artistic). Scenes are reserved
        // for Facebook / IG / TikTok where the customer-style framing makes
        // sense, not the explore gallery.
        body: JSON.stringify({ op: 'gallery', image_style: 'portrait', limit: PAGE_SIZE, offset: off }),
      });
      const d = await r.json() as { rows?: GalleryRow[] };
      const next = d.rows ?? [];
      setRows(prev => off === 0 ? next : [...prev, ...next]);
      if (next.length < PAGE_SIZE) setDone(true);
      setOffset(off + next.length);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(0); }, [fetchPage]);

  useEffect(() => {
    if (done) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && !loading && !done) fetchPage(offset);
    }, { rootMargin: '900px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [offset, loading, done, fetchPage]);

  // Apply client-side filter. Server returns all approved portraits; we filter
  // locally so chip-switching is instant and infinite-scroll keeps working.
  const visibleRows = useMemo(() => {
    if (pinnedStyle) return rows.filter(r => r.art_style === pinnedStyle);
    if (bucket === 'All') return rows;
    const matcher = STYLE_BUCKETS.find(b => b.name === bucket)?.match;
    return matcher ? rows.filter(r => matcher(r.art_style)) : rows;
  }, [rows, bucket, pinnedStyle]);

  const empty = !loading && visibleRows.length === 0;
  const skeleton = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <>
    <Helmet>
      <title>Pet Portrait Gallery — Browse 100+ Custom Painted Pet Art Designs | Little Souls</title>
      <meta name="description" content="Explore custom painted pet portraits across every breed and style. Watercolor golden retrievers, royal cats, renaissance dachshunds, and more. Get inspired or create your own." />
      <meta property="og:type" content="article" />
      <meta property="og:title" content="Pet Portrait Gallery — Browse 100+ Custom Painted Pet Art Designs | Little Souls" />
      <meta property="og:description" content="Explore custom painted pet portraits across every breed and style. Watercolor golden retrievers, royal cats, renaissance dachshunds, and more. Get inspired or create your own." />
      <meta property="og:image" content="https://www.littlesouls.app/og/pawtraits-gallery.jpg" />
      <meta property="og:url" content="https://littlesouls.app/pawtraits/gallery" />
      <meta property="og:site_name" content="Little Souls" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Pet Portrait Gallery — Browse 100+ Custom Painted Pet Art Designs | Little Souls" />
      <meta name="twitter:description" content="Explore custom painted pet portraits across every breed and style. Watercolor golden retrievers, royal cats, renaissance dachshunds, and more. Get inspired or create your own." />
      <meta name="twitter:image" content="https://www.littlesouls.app/og/pawtraits-gallery.jpg" />
      <meta property="article:author" content="Little Souls" />
      <meta property="article:section" content="Custom Pet Portraits" />
      <link rel="canonical" href="https://littlesouls.app/pawtraits/gallery" />
    </Helmet>
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      {/* Back button — fixed, minimal, top-left */}
      <Link
        to="/pawtraits"
        aria-label="Back to Pawtraits"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full text-lg"
        style={{
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        ←
      </Link>

      {/* Filter chip bar — browse by vibe, plain English. Sticky at top so visitors
          can switch buckets while scrolling. Single-tap, big touch targets. */}
      <div
        className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto px-4 sm:px-16 py-3"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {pinnedStyle ? (
          <button
            type="button"
            onClick={() => setPinnedStyle(null)}
            className="flex shrink-0 items-center gap-2 rounded-full font-medium transition"
            style={{
              background: '#c4a265',
              color: '#141210',
              padding: '10px 18px',
              fontSize: 14,
              minHeight: 40,
            }}
          >
            ✕ {prettyArtStyle(pinnedStyle)}
          </button>
        ) : (
          STYLE_BUCKETS.map(b => {
            const active = bucket === b.name;
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => setBucket(b.name)}
                className="shrink-0 rounded-full font-medium transition"
                style={{
                  background: active ? '#bf524a' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.14)',
                  padding: '10px 18px',
                  fontSize: 14,
                  minHeight: 40,
                  whiteSpace: 'nowrap',
                }}
              >
                {b.name}
              </button>
            );
          })
        )}
      </div>

      {/* Empty state — only chrome we keep when there's nothing */}
      {empty && (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-5" style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)' }}>
              {pinnedStyle || bucket !== 'All'
                ? "No portraits in this style yet. Try another vibe above."
                : "No portraits yet."}
            </p>
            <Link
              to="/pawtraits#studio"
              className="inline-flex items-center justify-center rounded-full font-semibold"
              style={{
                background: '#bf524a',
                color: '#fff',
                fontSize: 16,
                padding: '14px 24px',
                minHeight: 52,
                letterSpacing: '0.02em',
              }}
            >
              Make my pet's portrait →
            </Link>
          </div>
        </div>
      )}

      {/* Edge-to-edge grid */}
      {!empty && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '2px',
          }}
        >
          {visibleRows.map(r => (
            <PawtraitTile key={r.id} row={r} onOpen={setOpen} />
          ))}
          {loading && rows.length === 0 && skeleton.map(i => (
            <div key={i} className="animate-pulse bg-neutral-800" style={{ aspectRatio: '2/3' }} />
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll — only when no filter is pinned (filter is
          client-side; can't infinite-scroll a slice). */}
      {!done && rows.length > 0 && !pinnedStyle && bucket === 'All' && (
        <div ref={sentinelRef} className="flex h-16 items-center justify-center">
          {loading && (
            <div
              className="h-5 w-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(255,255,255,0.6)', borderTopColor: 'transparent' }}
            />
          )}
        </div>
      )}

      {open && (
        <PawtraitModal
          row={open}
          onClose={() => setOpen(null)}
          onFilterStyle={(s) => { setPinnedStyle(s); setBucket('All'); }}
        />
      )}
    </div>
    </>
  );
}
