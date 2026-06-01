/**
 * FrameSizes — "Pick a size" gallery band shown below the studio.
 *
 * Minimal-list redesign (2026-06-01, Danny): NO size silhouettes/visuals at
 * rest — just a clean list of size label + entry price. The real "what it
 * looks like" preview happens in the studio when a size is actually selected.
 * Frame choice is NOT made here any more — it moved into the checkout flow —
 * so this section only teaches that frames exist and points to checkout.
 *
 * Left: a hero framed-canvas-on-wall photo so the visitor SEES the physical
 * product. Right: heading + lede + a minimal size+price list.
 *
 * Prices = entry / unframed canvas. Frame is a separate +£X upgrade chosen at
 * checkout. Pricing source: gelatoFramedCanvas.ts (CANVAS_SIZES).
 */
import { useState } from "react";
import { CANVAS_SIZES } from "./gelatoFramedCanvas";
import { PALETTE, tabularPrice } from "./tokens";

// Re-exports for backward compat with any other imports.
export type Currency = "GBP" | "USD";
export type SizeKey = string;

export const SIZE_KEYS: SizeKey[] = CANVAS_SIZES.map((s) => s.uid);

// Shared add-on prices — consumed by SoulEditionUpsell + Portraits. Kept here
// for back-compat after the size-list redesign removed the old PRICING table.
export const PRICING = {
  GBP: {
    digital:     { retail: 19, label: "£19" },
    soulEdition: { retail: 40, label: "+£40" },
  },
  USD: {
    digital:     { retail: 25, label: "$25" },
    soulEdition: { retail: 50, label: "+$50" },
  },
};

// Featured tiers — chosen for clear price gaps. Old buyers facing 11 sizes
// freeze; 4 lets them decide in seconds.
const FEATURED_UIDS = ["8x10", "12x16", "16x20", "20x30"] as const;
const POPULAR_UID = "12x16";
const TIER_NAME: Record<string, string> = {
  "8x10":  "Small",
  "12x16": "Medium",
  "16x20": "Large",
  "20x30": "Statement",
};

interface FrameSizesProps {
  currency: Currency;
  onPickSize?: (size: SizeKey) => void;
}

export function FrameSizes({ currency, onPickSize }: FrameSizesProps) {
  const symbol = currency === "GBP" ? "£" : "$";
  const usdMul = 1.3; // rough conversion for display only
  const formatPrice = (gbp: number) =>
    currency === "GBP" ? `${symbol}${gbp}` : `${symbol}${Math.round(gbp * usdMul)}`;

  const [showAll, setShowAll] = useState(false);

  const featured = FEATURED_UIDS
    .map((uid) => CANVAS_SIZES.find((s) => s.uid === uid))
    .filter(Boolean) as typeof CANVAS_SIZES;
  const rest = CANVAS_SIZES.filter(
    (s) => !FEATURED_UIDS.includes(s.uid as typeof FEATURED_UIDS[number]),
  );

  return (
    <section
      id="sizes"
      className="relative px-5 md:px-10"
      style={{
        background: PALETTE.cream,
        paddingTop: "clamp(40px, 5vh, 64px)",
        paddingBottom: "clamp(40px, 5vh, 64px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="frame-sizes-heading"
    >
      <div className="mx-auto" style={{ maxWidth: 1120 }}>
        {/* ── Size list (centered, single column) ───────────────────── */}
        <div className="mx-auto" style={{ maxWidth: 560 }}>
          {/* Size list column */}
          <div>
            <h2
              id="frame-sizes-heading"
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(26px, 4vw, 38px)",
                fontWeight: 500,
                color: PALETTE.ink,
                letterSpacing: "-0.01em",
                margin: "0 0 18px",
              }}
            >
              Sizes &amp; pricing
            </h2>

            {/* Minimal featured list — label + price only, no silhouettes. */}
            <ul className="m-0 p-0" style={{ listStyle: "none" }}>
              {featured.map((s) => {
                const isPopular = s.uid === POPULAR_UID;
                return (
                  <li key={s.uid} style={{ marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => onPickSize?.(s.uid)}
                      className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 transition-all hover:translate-x-[2px]"
                      style={{
                        background: PALETTE.cream2,
                        border: `1px solid ${isPopular ? PALETTE.gold : PALETTE.sand}`,
                        boxShadow: isPopular
                          ? "0 6px 18px -8px rgba(196,162,101,0.32)"
                          : "0 1px 3px rgba(20,18,16,0.04)",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span className="flex items-baseline gap-3 min-w-0">
                        <span
                          style={{
                            fontFamily: "Cormorant Garamond, Georgia, serif",
                            fontSize: 21,
                            fontWeight: 500,
                            color: PALETTE.ink,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "Asap, system-ui, sans-serif",
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: PALETTE.earthMuted,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {TIER_NAME[s.uid]}
                          {isPopular ? " · ★ Most loved" : ""}
                        </span>
                      </span>
                      <span
                        style={{ ...tabularPrice("20px"), color: PALETTE.ink, whiteSpace: "nowrap" }}
                      >
                        {formatPrice(s.priceGBP)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {showAll && (
              <ul className="m-0 p-0 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ listStyle: "none" }}>
                {rest.map((s) => (
                  <li key={s.uid}>
                    <button
                      type="button"
                      onClick={() => onPickSize?.(s.uid)}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-all"
                      style={{
                        background: PALETTE.cream2,
                        border: `1px solid ${PALETTE.sand}`,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "Asap, system-ui, sans-serif",
                          fontSize: 13,
                          fontWeight: 600,
                          color: PALETTE.ink,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.label}
                      </span>
                      <span style={{ ...tabularPrice("13px"), color: PALETTE.earth, whiteSpace: "nowrap" }}>
                        {formatPrice(s.priceGBP)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 14,
                  color: PALETTE.rose,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 0",
                  fontWeight: 600,
                }}
                aria-expanded={showAll}
              >
                {showAll ? "Hide other sizes ▴" : `See all ${CANVAS_SIZES.length} sizes ▾`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
