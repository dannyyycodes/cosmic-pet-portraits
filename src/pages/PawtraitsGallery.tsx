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
  // Lazy-fetch the full row (gallery list omits `prompt` to keep the payload small).
  const [full, setFull] = useState<FullRow | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/portraits?action=library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'get', id: row.id }),
    })
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.row) setFull(d.row as FullRow); })
      .catch(() => { /* keep going with what we have */ });

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { cancelled = true; document.body.style.overflow = prev; };
  }, [row.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = async () => {
    const text = full?.prompt ? cleanPromptForCustomer(full.prompt) : '';
    if (!text) return;
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
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#000' }}
    >
      {/* Image — sized to leave room for the always-visible bottom strip */}
      <img
        src={row.image_url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="object-contain"
        style={{ maxHeight: 'calc(100vh - 220px)', maxWidth: '100vw' }}
      />

      {/* Close (top-right) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="fixed right-4 top-4 z-20 flex items-center justify-center rounded-full font-light"
        style={{
          background: 'rgba(255,255,255,0.14)',
          color: '#fff',
          backdropFilter: 'blur(8px)',
          height: 44,
          width: 44,
          fontSize: 22,
        }}
      >×</button>

      {/* Bottom strip — ALWAYS visible. Just the essentials: pet name, style,
          prompt to copy, and the studio CTA. No Info button, no expander. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-0 z-10 px-5 sm:px-8 py-5 sm:py-6"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.78) 80%, rgba(0,0,0,0) 100%)',
          color: '#fff',
          backdropFilter: 'blur(12px)',
          maxHeight: '50vh',
          overflowY: 'auto',
        }}
      >
        <div className="mx-auto max-w-3xl">
          <p className="uppercase mb-1" style={{ letterSpacing: '0.18em', fontSize: 12, color: '#c4a265' }}>
            {prettyArtStyle(row.art_style)}
          </p>
          <h2 className="font-serif" style={{ fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            {row.pet_name ? `${row.pet_name} the ` : ''}{row.breed}
          </h2>

          {full?.prompt && (
            <p className="mt-3" style={{ fontSize: 14, lineHeight: 1.55, opacity: 0.78, fontFamily: 'Georgia, serif' }}>
              {cleanPromptForCustomer(full.prompt)}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to={`/pawtraits/art/${row.id}`}
              className="inline-flex items-center justify-center rounded-full font-semibold transition active:scale-95"
              style={{
                background: '#bf524a',
                color: '#fff',
                fontSize: 15,
                padding: '12px 22px',
                minHeight: 48,
                letterSpacing: '0.02em',
                boxShadow: '0 6px 22px rgba(191, 82, 74, 0.45)',
              }}
            >
              Buy this print →
            </Link>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!full?.prompt}
              className="inline-flex items-center justify-center rounded-full font-semibold transition active:scale-95"
              style={{
                background: copied ? '#c4a265' : 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
                fontSize: 15,
                padding: '12px 22px',
                minHeight: 48,
                opacity: full?.prompt ? 1 : 0.5,
              }}
            >
              {copied ? '✓ Copied' : 'Copy this style'}
            </button>
            <Link
              to={`/pawtraits?style=${encodeURIComponent(row.art_style)}#studio`}
              className="inline-flex items-center justify-center rounded-full font-semibold transition active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.18)',
                fontSize: 15,
                padding: '12px 22px',
                minHeight: 48,
                letterSpacing: '0.02em',
              }}
            >
              Make my pet in this style →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PawtraitsGallery() {
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState<GalleryRow | null>(null);
  // Filter state — `activeStyle` locks the grid to a single art_style slug.
  // null = show all. Chips below are built dynamically from the loaded rows so
  // they always reflect what's actually in the library — no inferred buckets.
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
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

  // Build the chip list from unique art_styles in the loaded rows. Sorted by
  // frequency descending so the most-represented styles appear first. Pure
  // data — no keyword inference, no risk of mis-categorisation.
  const styleChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.art_style, (counts.get(r.art_style) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [rows]);

  // Client-side filter on activeStyle. Server returns all approved portraits;
  // chip switches are instant.
  const visibleRows = useMemo(() => {
    return activeStyle ? rows.filter(r => r.art_style === activeStyle) : rows;
  }, [rows, activeStyle]);

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

      {/* Filter chip bar — one chip per actual art_style in the library. Pure data,
          no keyword inference. Sticky at top, horizontal scroll on overflow. */}
      <div
        className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto px-4 sm:px-16 py-3"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.85) 100%)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveStyle(null)}
          className="shrink-0 rounded-full font-medium transition"
          style={{
            background: !activeStyle ? '#bf524a' : 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: !activeStyle ? 'none' : '1px solid rgba(255,255,255,0.14)',
            padding: '10px 18px',
            fontSize: 14,
            minHeight: 40,
            whiteSpace: 'nowrap',
          }}
        >
          All
        </button>
        {styleChips.map(([slug, count]) => {
          const active = activeStyle === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveStyle(slug)}
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
              {prettyArtStyle(slug)}
              <span style={{ opacity: 0.5, marginLeft: 8 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Empty state — only chrome we keep when there's nothing */}
      {empty && (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-5" style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)' }}>
              {activeStyle
                ? "No portraits in this style yet. Try another above."
                : "No portraits yet."}
            </p>
            <Link
              to="/pawtraits/studio"
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

      {/* Sentinel for infinite scroll — only when no filter is active (filter is
          client-side; can't infinite-scroll a slice). */}
      {!done && rows.length > 0 && !activeStyle && (
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
        <PawtraitModal row={open} onClose={() => setOpen(null)} />
      )}
    </div>
    </>
  );
}
