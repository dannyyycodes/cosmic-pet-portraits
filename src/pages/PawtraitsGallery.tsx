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
    </button>
  );
}

function PawtraitModal({ row, onClose }: { row: GalleryRow; onClose: () => void }) {
  const [full, setFull] = useState<FullRow | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
          className="fixed inset-x-0 bottom-0 z-10 max-h-[60vh] overflow-y-auto p-6 sm:p-8"
          style={{
            background: 'rgba(0,0,0,0.78)',
            color: '#fff',
            backdropFilter: 'blur(14px)',
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <div className="mx-auto max-w-3xl">
            <p className="uppercase mb-2" style={{ letterSpacing: '0.16em', fontSize: 11, opacity: 0.6 }}>
              {row.image_style} · {row.aspect_ratio}
            </p>
            <h2 className="font-serif" style={{ fontSize: 28, lineHeight: 1.1 }}>
              {row.pet_name ? `${row.pet_name} the ` : ''}{row.breed}
            </h2>
            <p className="mt-1 text-sm" style={{ opacity: 0.7 }}>{prettyArtStyle(row.art_style)}</p>

            {row.backstory && (
              <p className="mt-4 font-cormorant italic" style={{ fontSize: 17, lineHeight: 1.45, opacity: 0.86 }}>
                {row.backstory}
              </p>
            )}

            <div
              className="mt-5 rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="uppercase" style={{ letterSpacing: '0.16em', fontSize: 11, opacity: 0.5 }}>Prompt</p>
                {full?.prompt && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(full.prompt)}
                    className="text-[11px] underline"
                    style={{ color: '#bf524a' }}
                  >Copy</button>
                )}
              </div>
              {loadingFull ? (
                <p className="text-[13px]" style={{ opacity: 0.5 }}>Loading…</p>
              ) : full?.prompt ? (
                <p className="text-[13px] leading-relaxed" style={{ whiteSpace: 'pre-wrap', opacity: 0.85 }}>
                  {full.prompt}
                </p>
              ) : (
                <p className="text-[13px]" style={{ opacity: 0.5 }}>Prompt unavailable.</p>
              )}
            </div>

            <Link
              to="/pawtraits/studio"
              className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{
                background: '#bf524a',
                color: '#fff',
                letterSpacing: '0.04em',
                boxShadow: '0 6px 18px rgba(191, 82, 74, 0.3)',
              }}
            >
              Make yours →
            </Link>
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
            <div key={i} className="animate-pulse bg-neutral-800" style={{ aspectRatio: '4/5' }} />
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
  );
}
