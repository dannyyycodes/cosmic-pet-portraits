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

function PawtraitModal({ row, onClose }: { row: GalleryRow; onClose: () => void }) {
  const [full, setFull] = useState<FullRow | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
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

      {/* Slide-up detail sheet */}
      {showDetails && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-x-0 bottom-0 z-10 max-h-[72vh] overflow-y-auto p-6 sm:p-10"
          style={{
            background: 'rgba(0,0,0,0.82)',
            color: '#fff',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div className="mx-auto max-w-3xl">
            <p className="uppercase mb-3" style={{ letterSpacing: '0.18em', fontSize: 11, opacity: 0.55, color: '#c4a265' }}>
              Inspiration · {prettyArtStyle(row.art_style)}
            </p>
            <h2 className="font-serif" style={{ fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              {row.pet_name ? `${row.pet_name} the ` : ''}{row.breed}
            </h2>

            {row.backstory && (
              <p className="mt-5 font-cormorant italic" style={{ fontSize: 19, lineHeight: 1.5, opacity: 0.88 }}>
                {row.backstory}
              </p>
            )}

            <div
              className="mt-7 rounded-xl p-5"
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
                        // Fallback for older browsers / insecure context
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
                <p className="text-[14px] leading-relaxed" style={{ opacity: 0.88, fontFamily: 'Georgia, serif' }}>
                  {cleanPromptForCustomer(full.prompt)}
                </p>
              ) : (
                <p className="text-[14px]" style={{ opacity: 0.5 }}>Description unavailable.</p>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/pawtraits/studio"
                className="inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold"
                style={{
                  background: '#bf524a',
                  color: '#fff',
                  letterSpacing: '0.04em',
                  boxShadow: '0 6px 22px rgba(191, 82, 74, 0.4)',
                }}
              >
                Make your pet's portrait →
              </Link>
              <span className="text-[12px]" style={{ opacity: 0.55 }}>
                Upload a photo · pick a style · printed on canvas
              </span>
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

  const empty = !loading && rows.length === 0;
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

      {/* Empty state — only chrome we keep when there's nothing */}
      {empty && (
        <div className="flex min-h-screen items-center justify-center px-6">
          <Link
            to="/pawtraits/studio"
            className="rounded-full px-6 py-3 text-sm font-semibold uppercase"
            style={{ background: '#bf524a', color: '#fff', letterSpacing: '0.16em' }}
          >
            Make the first →
          </Link>
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
          {rows.map(r => (
            <PawtraitTile key={r.id} row={r} onOpen={setOpen} />
          ))}
          {loading && rows.length === 0 && skeleton.map(i => (
            <div key={i} className="animate-pulse bg-neutral-800" style={{ aspectRatio: '2/3' }} />
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {!done && rows.length > 0 && (
        <div ref={sentinelRef} className="flex h-16 items-center justify-center">
          {loading && (
            <div
              className="h-5 w-5 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(255,255,255,0.6)', borderTopColor: 'transparent' }}
            />
          )}
        </div>
      )}

      {open && <PawtraitModal row={open} onClose={() => setOpen(null)} />}
    </div>
    </>
  );
}
