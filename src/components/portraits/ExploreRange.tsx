/**
 * ExploreRange — circular product-rail showing the same artwork applied
 * across the launch lineup.
 *
 * Pattern: horizontal scroll-snap row of 6 circles. Each circle holds a
 * product image (or silhouette placeholder until photo lands), label
 * underneath. Click → scrolls to upload studio.
 *
 * Image override pattern: pass `imageUrl` to swap the silhouette for a real
 * GPT/photoshoot product image. Same as MasterPortraitPlaceholder.
 *
 * Source-of-truth product lineup matches launch-sku-spec-2026-05-03 in vault.
 */
import { motion } from "framer-motion";
import { PALETTE, display, eyebrow, cormorantItalic, EASE } from "./tokens";
import type { ProductTypeKey } from "./productLineup";

/** Tile id is either a real product type OR "soul-edition" (which toggles the add-on). */
export type RangeTileId = ProductTypeKey | "soul-edition";

interface RangeItem {
  id: RangeTileId;
  label: string;
  /** Optional override — production product photo. */
  imageUrl?: string;
  /** SVG silhouette glyph to render inside the circle until image lands. */
  silhouette: "frame" | "mug" | "tote" | "tee" | "hoodie" | "soul";
  /** Tag at top of circle (e.g. "FROM £99"). Optional. */
  priceTag?: string;
}

// Soul Edition deliberately omitted — it's an add-on (inline checkbox in the
// studio when the customer is configuring a framed canvas), not a primary
// surface. Showing it as a product tile here was confusing.
const ITEMS: RangeItem[] = [
  {
    id: "framed-canvas",
    label: "Framed Canvas",
    silhouette: "frame",
    priceTag: "from £69",
    imageUrl: "/portraits/products/framed-canvas.webp",
  },
  {
    id: "mug",
    label: "Ceramic Mug",
    silhouette: "mug",
    priceTag: "£19",
    imageUrl: "/portraits/products/mug.webp",
  },
  {
    id: "tote",
    label: "Tote Bag",
    silhouette: "tote",
    priceTag: "£29",
    imageUrl: "/portraits/products/tote.webp",
  },
  {
    id: "tee",
    label: "Unisex Tee",
    silhouette: "tee",
    priceTag: "£29",
    imageUrl: "/portraits/products/tee.webp",
  },
  {
    id: "hoodie",
    label: "Unisex Hoodie",
    silhouette: "hoodie",
    priceTag: "£49",
    imageUrl: "/portraits/products/hoodie.webp",
  },
];

interface ExploreRangeProps {
  onTileClick?: (id: RangeTileId) => void;
  /** Currently-active product type (drives ring highlight). */
  activeId?: RangeTileId;
}

export function ExploreRange({ onTileClick, activeId }: ExploreRangeProps) {
  return (
    <section
      id="range"
      className="relative px-6 md:px-10"
      style={{
        background: "rgba(255, 255, 255, 0.84)",
        paddingTop: "clamp(80px, 10vh, 130px)",
        paddingBottom: "clamp(80px, 10vh, 130px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="range-heading"
    >
      <div className="mx-auto" style={{ maxWidth: "1240px" }}>
        <h2
          id="range-heading"
          style={{ ...display("clamp(28px, 3.6vw, 44px)"), color: PALETTE.ink }}
        >
          Explore gifts
        </h2>

        {/* Horizontal scroll-snap rail */}
        <div
          className="ls-snap-x mt-12 overflow-x-auto -mx-6 md:-mx-10"
          style={{ paddingLeft: "max(24px, calc((100vw - 1240px) / 2))", paddingRight: "24px" }}
        >
          <div className="flex gap-6 md:gap-9" style={{ width: "max-content", paddingBottom: "8px" }}>
            {ITEMS.map((item, idx) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onTileClick?.(item.id)}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.06, ease: EASE.out }}
                aria-pressed={activeId === item.id}
                className="ls-snap-item flex flex-col items-center group focus:outline-none"
                style={{ scrollSnapAlign: "start" }}
                aria-label={`${item.label} — ${item.priceTag ?? ""}`}
              >
                {/* Circle */}
                <div
                  className="relative transition-transform group-hover:-translate-y-1"
                  style={{
                    width: "clamp(140px, 14vw, 176px)",
                    height: "clamp(140px, 14vw, 176px)",
                    borderRadius: "50%",
                    background: PALETTE.cream,
                    border: activeId === item.id
                      ? `2px solid ${PALETTE.rose}`
                      : `1px solid ${PALETTE.sand}`,
                    boxShadow: activeId === item.id
                      ? "0 18px 36px rgba(191, 82, 74, 0.18)"
                      : "0 12px 28px rgba(20,18,16,0.07)",
                    overflow: "hidden",
                  }}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Silhouette kind={item.silhouette} />
                  )}

                  {/* Gold inner ring on hover */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 0 1.5px ${PALETTE.gold}` }}
                  />
                </div>

                {/* Label */}
                <p
                  className="mt-4 transition-colors group-hover:text-[var(--ls-rose)]"
                  style={{
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: "14.5px",
                    fontWeight: 700,
                    color: PALETTE.ink,
                    letterSpacing: "-0.005em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </p>
                {item.priceTag && (
                  <p
                    style={{
                      marginTop: "2px",
                      fontFamily: "Assistant, system-ui, sans-serif",
                      fontSize: "12.5px",
                      color: PALETTE.earthMuted,
                      letterSpacing: "0.04em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.priceTag}
                  </p>
                )}
              </motion.button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

/* ── Silhouette glyphs (used until real product imagery ships) ─────── */
function Silhouette({ kind }: { kind: RangeItem["silhouette"] }) {
  const stroke = { stroke: PALETTE.ink, strokeWidth: 1.4, fill: "none" };
  const fillSoft = { fill: PALETTE.cream2, stroke: PALETTE.ink, strokeWidth: 1.2 };
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" width="58%" height="58%" aria-hidden>
        {kind === "frame" && (
          <>
            <rect x="22" y="14" width="56" height="72" rx="1" {...stroke} />
            <rect x="29" y="22" width="42" height="56" rx="0.5" {...fillSoft} />
            <line x1="50" y1="32" x2="50" y2="48" {...stroke} />
            <circle cx="50" cy="56" r="3" {...stroke} />
          </>
        )}
        {kind === "mug" && (
          <>
            <rect x="22" y="30" width="48" height="50" rx="3" {...stroke} />
            <path d="M70 42 q12 0 12 12 q0 12 -12 12" {...stroke} />
            <line x1="32" y1="44" x2="60" y2="44" {...stroke} opacity="0.4" />
            <line x1="32" y1="56" x2="60" y2="56" {...stroke} opacity="0.4" />
          </>
        )}
        {kind === "tote" && (
          <>
            <path d="M22 38 L78 38 L74 86 L26 86 z" {...stroke} />
            <path d="M36 38 L36 26 a14 14 0 0 1 28 0 L64 38" {...stroke} />
            <rect x="38" y="50" width="24" height="22" {...fillSoft} />
          </>
        )}
        {kind === "tee" && (
          <>
            <path d="M16 28 L34 18 L40 24 a10 10 0 0 0 20 0 L66 18 L84 28 L74 40 L66 36 L66 86 L34 86 L34 36 L26 40 z" {...stroke} />
            <rect x="42" y="48" width="16" height="20" {...fillSoft} />
          </>
        )}
        {kind === "hoodie" && (
          <>
            <path d="M16 32 L34 22 a14 14 0 0 1 32 0 L84 32 L74 44 L66 40 L66 88 L34 88 L34 40 L26 44 z" {...stroke} />
            <path d="M40 24 a10 10 0 0 1 20 0 L58 36 L42 36 z" {...stroke} />
            <rect x="42" y="52" width="16" height="20" {...fillSoft} />
            <line x1="50" y1="40" x2="50" y2="80" {...stroke} opacity="0.3" />
          </>
        )}
        {kind === "soul" && (
          <>
            {/* Small bound book + chart wheel motif */}
            <rect x="20" y="22" width="38" height="56" rx="1" {...stroke} />
            <line x1="20" y1="32" x2="58" y2="32" {...stroke} opacity="0.5" />
            <line x1="20" y1="68" x2="58" y2="68" {...stroke} opacity="0.5" />
            <circle cx="68" cy="50" r="14" {...stroke} />
            <line x1="54" y1="50" x2="82" y2="50" {...stroke} opacity="0.5" />
            <line x1="68" y1="36" x2="68" y2="64" {...stroke} opacity="0.5" />
            <circle cx="68" cy="50" r="2" fill={PALETTE.gold} stroke="none" />
          </>
        )}
      </svg>
    </div>
  );
}
