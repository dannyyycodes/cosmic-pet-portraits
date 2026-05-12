/**
 * FrameSizes — informational pricing strip shown above the studio.
 *
 * Shows 4 featured tier cards (Small / Medium most-popular / Large / Statement)
 * by default. The remaining 7 sizes are tucked behind a "See all 11 sizes"
 * expander so first-time visitors aren't paralysed by 11 options at once.
 *
 * Prices shown = entry / unframed canvas. Frame is a separate +£X upgrade
 * picked in the studio (Crown & Paw style).
 *
 * NOT interactive — actual size + frame selection happens in the studio below.
 *
 * Pricing locked: src/components/portraits/gelatoFramedCanvas.ts (CANVAS_SIZES).
 */
import { useState } from "react";
import { Check } from "lucide-react";
import { CANVAS_SIZES, FRAME_COLORS, FRAME_UPGRADE_GBP } from "./gelatoFramedCanvas";
import { PALETTE, tabularPrice } from "./tokens";

// Re-exports for backward compat with any other imports.
export type Currency = "GBP" | "USD";
export type SizeKey = string;

interface SizePricing {
  size: string;
  retail: number;
  label: string;
  hero?: boolean;
  caption: string;
}

// Compatibility shim — old code paths read PRICING and SIZE_KEYS. The studio
// uses gelatoFramedCanvas.ts directly, so this is just for shared add-on prices.
export const PRICING = {
  GBP: {
    digital:     { retail: 19, label: "£19" },
    soulEdition: { retail: 40, label: "+£40" },
  } as Record<string, SizePricing | { retail: number; label: string }>,
  USD: {
    digital:     { retail: 25, label: "$25" },
    soulEdition: { retail: 50, label: "+$50" },
  } as Record<string, SizePricing | { retail: number; label: string }>,
};

export const SIZE_KEYS: SizeKey[] = CANVAS_SIZES.map((s) => s.uid);

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

const TRUST_BADGES = [
  "Digital download from £19 (instant)",
  "Premium canvas that lasts",
  "Real wood frame upgrade available",
  "Inks that won't fade for decades",
  "Arrives in 3–5 days",
  "Ships to UK, Europe, USA",
  "100% happiness guaranteed",
];

interface FrameSizesProps {
  currency: Currency;
  onPickSize?: (size: SizeKey) => void;
}

export function FrameSizes({ currency }: FrameSizesProps) {
  const symbol = currency === "GBP" ? "£" : "$";
  const usdMul = 1.3; // rough conversion for display only
  const formatPrice = (gbp: number) =>
    currency === "GBP" ? `${symbol}${gbp}` : `${symbol}${Math.round(gbp * usdMul)}`;

  const [showAll, setShowAll] = useState(false);

  const featured = FEATURED_UIDS.map((uid) => CANVAS_SIZES.find((s) => s.uid === uid)).filter(Boolean) as typeof CANVAS_SIZES;
  const rest = CANVAS_SIZES.filter((s) => !FEATURED_UIDS.includes(s.uid as typeof FEATURED_UIDS[number]));

  return (
    <section
      id="sizes"
      className="relative px-5 md:px-10"
      style={{
        background: PALETTE.cream,
        paddingTop: "clamp(72px, 9vh, 110px)",
        paddingBottom: "clamp(72px, 9vh, 110px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="frame-sizes-heading"
    >
      <div className="mx-auto" style={{ maxWidth: 980 }}>
        <h2
          id="frame-sizes-heading"
          className="text-center"
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 500,
            color: PALETTE.ink,
            marginBottom: 36,
            letterSpacing: '-0.01em',
          }}
        >
          Pick a size
        </h2>

        {/* 4 featured tiers — the default browsing experience */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {featured.map((s) => {
            const isPopular = s.uid === POPULAR_UID;
            return (
              <div
                key={s.uid}
                className="rounded-xl px-4 py-5 text-center relative"
                style={{
                  background: PALETTE.cream2,
                  border: `1px solid ${isPopular ? PALETTE.gold : PALETTE.sand}`,
                  boxShadow: isPopular
                    ? "0 4px 14px rgba(196, 162, 101, 0.18)"
                    : "0 1px 3px rgba(20,18,16,0.04)",
                  transform: isPopular ? "translateY(-2px)" : undefined,
                }}
              >
                {isPopular && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      top: -12,
                      background: PALETTE.gold,
                      color: PALETTE.ink,
                      fontFamily: 'Asap, system-ui, sans-serif',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 12px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ★ Most popular
                  </div>
                )}
                <div
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.earthMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {TIER_NAME[s.uid]}
                </div>
                <div
                  style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: 22,
                    fontWeight: 500,
                    color: PALETTE.ink,
                    marginTop: 8,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ ...tabularPrice("24px"), marginTop: 6, color: PALETTE.ink }}>
                  {formatPrice(s.priceGBP)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expander for the remaining 7 sizes — power users only */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            style={{
              fontFamily: 'Asap, system-ui, sans-serif',
              fontSize: 14,
              color: PALETTE.rose,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 12px',
              fontWeight: 600,
            }}
            aria-expanded={showAll}
          >
            {showAll ? "Hide other sizes ▴" : `See all ${CANVAS_SIZES.length} sizes ▾`}
          </button>
        </div>

        {showAll && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4">
            {rest.map((s) => (
              <div
                key={s.uid}
                className="rounded-lg px-3 py-3 text-center"
                style={{
                  background: PALETTE.cream2,
                  border: `1px solid ${PALETTE.sand}`,
                }}
              >
                <div
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: PALETTE.ink,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ ...tabularPrice("16px"), marginTop: 2, color: PALETTE.earth }}>
                  {formatPrice(s.priceGBP)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Frame swatches — Unframed default + 3 wood tones (upgrade) */}
        <div className="flex flex-col items-center mt-12">
          <p
            style={{
              fontFamily: 'Asap, system-ui, sans-serif',
              fontSize: 12,
              color: PALETTE.earthMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 16,
            }}
          >
            Frame · Unframed included, real wood frame +£{FRAME_UPGRADE_GBP["8x10"] ?? 45} upgrade
          </p>
          <div className="flex items-start justify-center gap-8 sm:gap-12 flex-wrap">
            <div key="unframed" className="flex flex-col items-center gap-2">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  background: "transparent",
                  border: `2px dashed ${PALETTE.sandDeep}`,
                  color: PALETTE.earthMuted,
                  fontSize: 18,
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >∅</div>
              <span
                style={{
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 14,
                  color: PALETTE.earth,
                  fontWeight: 500,
                }}
              >
                Unframed
              </span>
            </div>
            {FRAME_COLORS.map((c) => (
              <div key={c.uid} className="flex flex-col items-center gap-2">
                <div
                  className="rounded-full"
                  style={{
                    width: 44,
                    height: 44,
                    background: c.swatchHex,
                    border: `2px solid ${PALETTE.sandDeep}`,
                    boxShadow: "0 2px 6px rgba(20,18,16,0.12)",
                  }}
                />
                <span
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: 14,
                    color: PALETTE.earth,
                    fontWeight: 500,
                  }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges — plain English, larger type */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-12 text-center">
          {TRUST_BADGES.map((line) => (
            <span
              key={line}
              className="inline-flex items-center gap-2"
              style={{
                fontFamily: 'Assistant, system-ui, sans-serif',
                fontSize: 14,
                color: PALETTE.earth,
              }}
            >
              <Check className="w-4 h-4 shrink-0" style={{ color: PALETTE.rose }} />
              {line}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
