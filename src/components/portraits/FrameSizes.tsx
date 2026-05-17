/**
 * FrameSizes — clean "Pick a size" band shown below the studio.
 *
 * NO generated/AI pet imagery here (deliberate — Danny 2026-05-17). It does one
 * job: show the canvas SIZES (true-proportion silhouettes so Statement visibly
 * dwarfs Small) and the FRAME TYPES (clean wood-tone material chips, not a flat
 * dot, not an AI photo). The real per-pet preview lives in the studio above.
 *
 * Prices = entry / unframed canvas. Frame is a separate +£X upgrade.
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

const FRAME_UPGRADE = FRAME_UPGRADE_GBP["8x10"] ?? 45;

// A clean wood-tone chip: a soft moulding gradient built from the frame's
// swatch colour — reads as a real material sample, no photo, no AI.
function frameChipBg(hex: string) {
  return `linear-gradient(135deg, ${hex} 0%, ${hex} 38%, rgba(255,255,255,0.22) 50%, ${hex} 62%, ${hex} 100%)`;
}

const TRUST_BADGES = [
  "Canvas from £39 · digital from £19",
  "Real wood frame, optional (+£45)",
  "Approve it before you pay",
  "Arrives in 3–5 days",
  "Ships UK, Europe & USA",
  "Not right? We'll make it right.",
];

// Largest longest-side across ALL sizes — anchors the true-proportion scale.
const MAX_LONG = Math.max(
  ...CANVAS_SIZES.map((s) => {
    const [w, h] = s.uid.split("x").map(Number);
    return Math.max(w || 0, h || 0);
  }),
);

/** Pixel dims for a size's proportion silhouette, scaled to `cap` px on its
 *  longest side relative to the biggest canvas we sell. */
function silhouette(uid: string, cap: number) {
  const [w, h] = uid.split("x").map(Number);
  if (!w || !h) return { width: cap, height: cap };
  const long = Math.max(w, h);
  const scale = (long / MAX_LONG) * cap;
  return {
    width: Math.round((w / long) * scale),
    height: Math.round((h / long) * scale),
  };
}

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
  const [activeFrame, setActiveFrame] = useState<string>("natural-wood");

  const featured = FEATURED_UIDS.map((uid) => CANVAS_SIZES.find((s) => s.uid === uid)).filter(Boolean) as typeof CANVAS_SIZES;
  const rest = CANVAS_SIZES.filter((s) => !FEATURED_UIDS.includes(s.uid as typeof FEATURED_UIDS[number]));

  const frameOpts: { uid: string; label: string; note: string; bg: string; outline?: boolean }[] = [
    {
      uid: "unframed",
      label: "Unframed",
      note: "Included",
      bg: "linear-gradient(135deg, #fbfaf7 0%, #f0ece4 100%)",
      outline: true,
    },
    ...FRAME_COLORS.map((c) => ({
      uid: c.uid,
      label: c.label,
      note: `+${symbol}${FRAME_UPGRADE}`,
      bg: frameChipBg(c.swatchHex),
    })),
  ];

  return (
    <section
      id="sizes"
      className="relative px-5 md:px-10"
      style={{
        background: PALETTE.cream,
        paddingTop: "clamp(64px, 8vh, 100px)",
        paddingBottom: "clamp(64px, 8vh, 100px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="frame-sizes-heading"
    >
      <div className="mx-auto text-center" style={{ maxWidth: 880 }}>
        <p
          style={{
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: PALETTE.goldDeep,
            margin: 0,
          }}
        >
          Sizes &amp; frames
        </p>
        <h2
          id="frame-sizes-heading"
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(26px, 3.2vw, 38px)",
            fontWeight: 500,
            color: PALETTE.ink,
            letterSpacing: "-0.01em",
            margin: "8px 0 0",
          }}
        >
          Pick a size
        </h2>
        <p
          className="mx-auto"
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 15,
            lineHeight: 1.6,
            color: PALETTE.earth,
            margin: "10px auto 30px",
            maxWidth: 440,
          }}
        >
          Every size is the same hand-finished canvas. Shapes shown to scale.
        </p>

        {/* Size tiles — true proportion */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {featured.map((s) => {
            const isPopular = s.uid === POPULAR_UID;
            const dim = silhouette(s.uid, 58);
            return (
              <div
                key={s.uid}
                className="rounded-xl px-4 py-5 relative"
                style={{
                  background: PALETTE.cream2,
                  border: `1px solid ${isPopular ? PALETTE.gold : PALETTE.sand}`,
                  boxShadow: isPopular
                    ? "0 6px 20px -6px rgba(196,162,101,0.30)"
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
                      color: "#fff",
                      fontFamily: "Asap, system-ui, sans-serif",
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      padding: "4px 12px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ★ Most loved
                  </div>
                )}

                <div
                  className="flex items-end justify-center"
                  style={{ height: 62, marginBottom: 10 }}
                  aria-hidden
                >
                  <div
                    style={{
                      width: dim.width,
                      height: dim.height,
                      background: "#fff",
                      border: `1px solid ${PALETTE.sandDeep}`,
                      boxShadow: "0 2px 5px rgba(20,18,16,0.10)",
                      borderRadius: 2,
                    }}
                  />
                </div>

                <div
                  style={{
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    color: PALETTE.earthMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {TIER_NAME[s.uid]}
                </div>
                <div
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: 21,
                    fontWeight: 500,
                    color: PALETTE.ink,
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ ...tabularPrice("22px"), marginTop: 4, color: PALETTE.ink }}>
                  {formatPrice(s.priceGBP)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
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

        {showAll && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mt-3">
            {rest.map((s) => {
              const dim = silhouette(s.uid, 36);
              return (
                <div
                  key={s.uid}
                  className="rounded-lg px-3 py-3 flex flex-col items-center"
                  style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}
                >
                  <div
                    className="flex items-end justify-center"
                    style={{ height: 38, marginBottom: 6 }}
                    aria-hidden
                  >
                    <div
                      style={{
                        width: dim.width,
                        height: dim.height,
                        background: "#fff",
                        border: `1px solid ${PALETTE.sandDeep}`,
                        borderRadius: 1.5,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "Asap, system-ui, sans-serif",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: PALETTE.ink,
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ ...tabularPrice("14px"), marginTop: 2, color: PALETTE.earth }}>
                    {formatPrice(s.priceGBP)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Frame types — clean wood-tone material chips, no photo/AI */}
        <div className="mt-14">
          <p
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: PALETTE.earthMuted,
              marginBottom: 18,
            }}
          >
            Choose a frame — unframed included, real wood from +{symbol}{FRAME_UPGRADE}
          </p>
          <div className="flex items-start justify-center gap-5 sm:gap-8 flex-wrap">
            {frameOpts.map((f) => {
              const selected = activeFrame === f.uid;
              return (
                <button
                  key={f.uid}
                  type="button"
                  onClick={() => setActiveFrame(f.uid)}
                  className="flex flex-col items-center gap-2.5 bg-transparent border-0 cursor-pointer p-0"
                  aria-pressed={selected}
                  style={{ width: 88 }}
                >
                  <span
                    className="block"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 14,
                      background: f.bg,
                      border: f.outline ? `1.5px dashed ${PALETTE.sandDeep}` : "none",
                      boxShadow: selected
                        ? `0 0 0 2px ${PALETTE.cream}, 0 0 0 4px ${PALETTE.gold}, 0 10px 22px -8px rgba(20,18,16,0.30)`
                        : "0 2px 8px rgba(20,18,16,0.14)",
                      transition: "box-shadow 200ms ease, transform 200ms ease",
                      transform: selected ? "translateY(-2px)" : undefined,
                    }}
                  />
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{
                      fontFamily: "Asap, system-ui, sans-serif",
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: selected ? PALETTE.rose : PALETTE.earth,
                    }}
                  >
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    {f.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "Assistant, system-ui, sans-serif",
                      fontSize: 12,
                      color: PALETTE.earthMuted,
                      marginTop: -4,
                    }}
                  >
                    {f.note}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center mt-14" style={{ gap: "10px 0" }}>
          {TRUST_BADGES.map((line, i) => (
            <span key={line} className="inline-flex items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className="hidden sm:inline-block"
                  style={{ width: 1, height: 13, background: PALETTE.sandDeep, margin: "0 18px" }}
                />
              )}
              <span
                className="inline-flex items-center gap-2 px-3 sm:px-0"
                style={{
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 14,
                  color: PALETTE.earth,
                }}
              >
                <Check className="w-4 h-4 shrink-0" style={{ color: PALETTE.rose }} />
                {line}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
