/**
 * /pawtraits/gallery — Sora-2-style explore page for the Pawtraits content library.
 *
 * 3-column responsive grid (1/2/3 columns at mobile/tablet/desktop), infinite
 * scroll, click-to-modal that reveals the prompt + creative attributes + a
 * "Make yours" CTA back into the studio.
 *
 * Data source: POST /api/portraits?action=library op:"gallery" offset+limit.
 * The endpoint strips full prompts; the modal calls op:"get" by id to fetch
 * the prompt only when the customer asks. That keeps the index page light
 * and the prompt protected from casual scrapers.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { PALETTE } from "@/components/portraits/tokens";

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

const PAGE_SIZE = 24;

function prettyArtStyle(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function PawtraitCard({ row, onOpen }: { row: GalleryRow; onOpen: (row: GalleryRow) => void }) {
  const aspect = row.width && row.height ? row.width / row.height : 1;
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="group relative block w-full overflow-hidden rounded-2xl text-left"
      style={{
        background: PALETTE.paper,
        border: `1px solid ${PALETTE.sand}`,
        aspectRatio: `${aspect}`,
      }}
    >
      <img
        src={row.thumbnail_url || row.image_url}
        alt={`${row.breed} — ${prettyArtStyle(row.art_style)}`}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      {/* Always-visible bottom badge with breed + art style */}
      <div
        className="absolute inset-x-0 bottom-0 px-3 py-2"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))',
          color: '#fff',
        }}
      >
        <div className="text-[12px] font-semibold leading-tight">{row.breed}</div>
        <div className="text-[11px] opacity-80 leading-tight">{prettyArtStyle(row.art_style)}</div>
      </div>
      {/* Pill: scene vs portrait */}
      <div
        className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{
          background: 'rgba(255,255,255,0.92)',
          color: PALETTE.ink,
          letterSpacing: '0.08em',
        }}
      >
        {row.image_style}
      </div>
    </button>
  );
}

function PawtraitModal({ row, onClose }: { row: GalleryRow; onClose: () => void }) {
  const [full, setFull] = useState<FullRow | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingFull(true);
    fetch('/api/portraits?action=library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'get', id: row.id }),
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d?.row) setFull(d.row as FullRow);
      })
      .catch(() => { /* show what we have */ })
      .finally(() => { if (!cancelled) setLoadingFull(false); });

    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelled = true;
      document.body.style.overflow = prev;
    };
  }, [row.id]);

  // Esc to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(20,18,16,0.86)', backdropFilter: 'blur(6px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl md:grid-cols-2"
        style={{ background: '#fff', maxHeight: '90vh' }}
      >
        {/* Image side */}
        <div className="flex items-center justify-center" style={{ background: PALETTE.cosmos, minHeight: 360 }}>
          <img
            src={row.image_url}
            alt={`${row.breed} — ${prettyArtStyle(row.art_style)}`}
            className="max-h-[80vh] w-full object-contain"
          />
        </div>

        {/* Detail side */}
        <div className="flex flex-col overflow-y-auto p-6 sm:p-8" style={{ maxHeight: '90vh' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg"
            style={{ background: 'rgba(255,255,255,0.9)', color: PALETTE.ink }}
          >×</button>

          <p
            className="uppercase mb-2"
            style={{ color: PALETTE.earthMuted, letterSpacing: '0.16em', fontSize: 11, fontWeight: 600 }}
          >
            {row.image_style === 'portrait' ? 'Portrait' : 'Scene'} · {row.aspect_ratio}
          </p>
          <h2 className="font-serif" style={{ color: PALETTE.ink, fontSize: 28, lineHeight: 1.1 }}>
            {row.pet_name ? `${row.pet_name} the ` : ''}{row.breed}
          </h2>
          <p className="mt-1" style={{ color: PALETTE.earth, fontSize: 14 }}>
            {prettyArtStyle(row.art_style)}
          </p>

          {row.backstory && (
            <p className="mt-5 font-cormorant italic" style={{ color: PALETTE.earth, fontSize: 18, lineHeight: 1.45 }}>
              {row.backstory}
            </p>
          )}

          {/* Scene attributes */}
          {full && (full.home_setting || full.pet_action || full.canvas_format) && (
            <dl className="mt-5 grid grid-cols-1 gap-y-2 sm:grid-cols-2">
              {full.home_setting && (
                <>
                  <dt className="text-[11px] uppercase" style={{ color: PALETTE.earthMuted, letterSpacing: '0.1em' }}>Setting</dt>
                  <dd className="text-[13px]" style={{ color: PALETTE.earth }}>{prettyArtStyle(full.home_setting)}</dd>
                </>
              )}
              {full.pet_action && (
                <>
                  <dt className="text-[11px] uppercase" style={{ color: PALETTE.earthMuted, letterSpacing: '0.1em' }}>Action</dt>
                  <dd className="text-[13px]" style={{ color: PALETTE.earth }}>{prettyArtStyle(full.pet_action)}</dd>
                </>
              )}
              {full.canvas_format && (
                <>
                  <dt className="text-[11px] uppercase" style={{ color: PALETTE.earthMuted, letterSpacing: '0.1em' }}>Format</dt>
                  <dd className="text-[13px]" style={{ color: PALETTE.earth }}>{prettyArtStyle(full.canvas_format)}</dd>
                </>
              )}
            </dl>
          )}

          {/* Prompt */}
          <div className="mt-6 rounded-xl p-4" style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}>
            <div className="mb-2 flex items-center justify-between">
              <p
                className="uppercase"
                style={{ color: PALETTE.earthMuted, letterSpacing: '0.16em', fontSize: 11, fontWeight: 600 }}
              >
                Prompt
              </p>
              {full?.prompt && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(full.prompt)}
                  className="text-[11px] underline"
                  style={{ color: PALETTE.rose }}
                >Copy</button>
              )}
            </div>
            {loadingFull ? (
              <p className="text-[13px]" style={{ color: PALETTE.earthMuted }}>Loading prompt…</p>
            ) : full?.prompt ? (
              <p className="text-[13px] leading-relaxed" style={{ color: PALETTE.earth, whiteSpace: 'pre-wrap' }}>
                {full.prompt}
              </p>
            ) : (
              <p className="text-[13px]" style={{ color: PALETTE.earthMuted }}>Prompt unavailable.</p>
            )}
          </div>

          {/* CTA */}
          <Link
            to="/pawtraits/studio"
            className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold"
            style={{
              background: PALETTE.rose,
              color: '#fff',
              letterSpacing: '0.04em',
              boxShadow: '0 6px 18px rgba(191, 82, 74, 0.3)',
            }}
          >
            Make yours →
          </Link>
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(async (off: number) => {
    setLoading(true);
    try {
      const r = await fetch('/api/portraits?action=library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'gallery', limit: PAGE_SIZE, offset: off }),
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

  // Infinite scroll sentinel
  useEffect(() => {
    if (done) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && !loading && !done) {
        fetchPage(offset);
      }
    }, { rootMargin: '600px 0px' });
    io.observe(node);
    return () => io.disconnect();
  }, [offset, loading, done, fetchPage]);

  const empty = !loading && rows.length === 0;
  const skeleton = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  return (
    <div style={{ background: PALETTE.cream, minHeight: '100vh' }}>
      {/* Hero */}
      <section className="px-4 pt-12 pb-8 sm:pt-16">
        <div className="mx-auto max-w-6xl text-center">
          <p
            className="uppercase mb-3"
            style={{ color: PALETTE.earthMuted, letterSpacing: '0.16em', fontSize: 12, fontWeight: 600 }}
          >
            Pawtraits gallery · every pet, reimagined
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(34px, 5vw, 52px)',
              color: PALETTE.ink,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            Explore the <span style={{ color: PALETTE.rose }}>library</span>.
          </h1>
          <p
            className="mt-4 mx-auto"
            style={{ fontSize: 16, color: PALETTE.earth, maxWidth: 560 }}
          >
            Tap any pawtrait to see the breed, art style, and the exact prompt that
            made it. Then make one of your own.
          </p>
          <Link
            to="/pawtraits/studio"
            className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
            style={{
              background: PALETTE.rose,
              color: '#fff',
              letterSpacing: '0.04em',
              boxShadow: '0 6px 18px rgba(191, 82, 74, 0.3)',
            }}
          >
            Make your own →
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl">
          {empty ? (
            <div
              className="rounded-2xl px-6 py-16 text-center"
              style={{ background: PALETTE.paper, border: `1px solid ${PALETTE.sand}` }}
            >
              <p className="font-serif" style={{ fontSize: 22, color: PALETTE.ink }}>
                The library is filling.
              </p>
              <p className="mt-2 font-cormorant italic" style={{ fontSize: 16, color: PALETTE.earth }}>
                First pawtraits are being made. Check back soon — or be the first to make one.
              </p>
              <Link
                to="/pawtraits/studio"
                className="mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ background: PALETTE.rose, color: '#fff', letterSpacing: '0.04em' }}
              >
                Make the first →
              </Link>
            </div>
          ) : (
            <div
              className="grid gap-3 sm:gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              }}
            >
              {rows.map(r => (
                <PawtraitCard key={r.id} row={r} onOpen={setOpen} />
              ))}
              {loading && rows.length === 0 && skeleton.map(i => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl"
                  style={{ background: PALETTE.paper, aspectRatio: '4/5' }}
                />
              ))}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {!done && rows.length > 0 && (
            <div ref={sentinelRef} className="h-12 mt-6 flex items-center justify-center">
              {loading && (
                <div
                  className="h-6 w-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: PALETTE.rose, borderTopColor: 'transparent' }}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {open && <PawtraitModal row={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
