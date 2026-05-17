/**
 * FrameSizes — premium "Pick a size" gallery band shown below the studio.
 *
 * Left: a hero framed-canvas-on-wall photo so the visitor SEES the physical
 * product (Crown & Paw / West & Willow standard). Right: heading + lede +
 * true-proportion size tiles (each tile shows a scaled rectangle at the real
 * aspect ratio so Statement visibly dwarfs Small).
 *
 * Below: photoreal wood-frame swatches (Unframed / Natural / Black / Dark) as
 * real corner-crop photos — not flat colour dots. Selecting one is purely a
 * delight interaction (the real frame pick happens in the studio above).
 *
 * Prices = entry / unframed canvas. Frame is a separate +£X upgrade.
 * Pricing locked: src/components/portraits/gelatoFramedCanvas.ts (CANVAS_SIZES).
 */
import { useState } from "react";
import { Check } from "lucide-react";
import { CANVAS_SIZES, FRAME_COLORS, FRAME_UPGRADE_GBP } from "./gelatoFramedCanvas";
import { PALETTE, tabularPrice } from "./tokens";
import frameHero from "@/assets/frames/frame-hero.webp";
import frameUnframed from "@/assets/frames/frame-unframed.webp";
import frameBlack from "@/assets/frames/frame-black.webp";
import frameNatural from "@/assets/frames/frame-natural.webp";
import frameDark from "@/assets/frames/frame-dark.webp";

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

// Photoreal swatch art per frame uid. Unframed is prepended; the rest follow
// FRAME_COLORS' canonical order/labels.
const FRAME_IMG: Record<string, string> = {
  unframed: frameUnframed,
  "black": frameBlack,
  "natural-wood": frameNatural,
  "dark-wood": frameDark,
};

const FRAME_UPGRADE = FRAME_UPGRADE_GBP["8x10"] ?? 45;

const TRUST_BADGES = [
  "Canvas from £39 · digital from £19",
  "Real wood frame, optional (+£45)",
  "Approve it before you pay",
  "Arrives in 3–5 days",
  "Ships UK, Europe & USA",
  "Not right? We'll make it right.",
];

// Largest longest-side across ALL sizes — anchors the true-proportion scale so
// every silhouette is drawn relative to the biggest canvas we sell.
const MAX_LONG = Math.max(
  ...CANVAS_SIZES.map((s) => {
    const [w, h] = s.uid.split("x").map(Number);
    return Math.max(w || 0, h || 0);
  }),
);

/** Pixel dimensions for a size's proportion silhouette, scaled to `cap` px on
 *  its longest side relative to the biggest canvas. */
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

  const frameOpts = [
    { uid: "unframed", label: "Unframed", note: "Included" },
    ...FRAME_COLORS.map((c) => ({ uid: c.uid, label: c.label, note: `+${symbol}${FRAME_UPGRADE}` })),
  ];

  return (
    <section
      id="sizes"
      className="relative px-5 md:px-10"
      style={{
        background: PALETTE.cream,
        paddingTop: "clamp(72px, 9vh, 116px)",
        paddingBottom: "clamp(72px, 9vh, 116px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="frame-sizes-heading"
    >
      <div className="mx-auto" style={{ maxWidth: 1120 }}>
        {/* ── Hero band: framed canvas photo | sizing ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.04fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Framed-canvas-on-wall hero */}
          <figure className="relative m-0">
            <div
              aria-hidden
              className="absolute inset-x-6 -bottom-3 h-10 rounded-full"
              style={{ background: "rgba(20,18,16,0.10)", filter: "blur(22px)" }}
            />
            <img
              src={frameHero}
              width={1280}
              height={1600}
              alt="A hand-finished pet portrait canvas in a real wood frame, hung on a warm wall."
              loading="lazy"
              decoding="async"
              className="relative block w-full"
              style={{
                borderRadius: 16,
                boxShadow:
                  "0 1px 2px rgba(20,18,16,0.05), 0 24px 60px -18px rgba(20,18,16,0.30)",
                aspectRatio: "4 / 5",
                objectFit: "cover",
              }}
            />
            <figcaption
              className="text-center mt-5"
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontStyle: "italic",
                fontSize: 15,
                color: PALETTE.earthMuted,
              }}
            >
              Hand-finished canvas — made to live on a wall, not in a drawer.
            </figcaption>
          </figure>

          {/* Sizing column */}
          <div>
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
              The gallery
            </p>
            <h2
              id="frame-sizes-heading"
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(30px, 4vw, 44px)",
                fontWeight: 500,
                color: PALETTE.ink,
                letterSpacing: "-0.01em",
                margin: "10px 0 0",
              }}
            >
              Pick a size
            </h2>
            <p
              style={{
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: 15,
                lineHeight: 1.6,
                color: PALETTE.earth,
                margin: "12px 0 26px",
                maxWidth: 420,
              }}
            >
              Every size is the same hand-finished canvas. Shapes shown to scale.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {featured.map((s) => {
                const isPopular = s.uid === POPULAR_UID;
                const dim = silhouette(s.uid, 60);
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

                    {/* True-proportion silhouette */}
                    <div
                      className="flex items-end justify-center"
                      style={{ height: 64, marginBottom: 10 }}
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
                      className="text-center"
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
                      className="text-center"
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
                    <div
                      className="text-center"
                      style={{ ...tabularPrice("22px"), marginTop: 4, color: PALETTE.ink }}
                    >
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3">
                {rest.map((s) => {
                  const dim = silhouette(s.uid, 38);
                  return (
                    <div
                      key={s.uid}
                      className="rounded-lg px-3 py-3 flex flex-col items-center"
                      style={{
                        background: PALETTE.cream2,
                        border: `1px solid ${PALETTE.sand}`,
                      }}
                    >
                      <div
                        className="flex items-end justify-center"
                        style={{ height: 40, marginBottom: 6 }}
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
          </div>
        </div>

        {/* ── Frame swatches — photoreal corner crops ────────────────── */}
        <div className="mt-16 lg:mt-20">
          <p
            className="text-center"
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: PALETTE.earthMuted,
              marginBottom: 20,
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
                  style={{ width: 92 }}
                >
                  <span
                    className="block overflow-hidden"
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 14,
                      boxShadow: selected
                        ? `0 0 0 2px ${PALETTE.cream}, 0 0 0 4px ${PALETTE.gold}, 0 10px 22px -8px rgba(20,18,16,0.35)`
                        : "0 2px 8px rgba(20,18,16,0.12)",
                      transition: "box-shadow 200ms ease, transform 200ms ease",
                      transform: selected ? "translateY(-2px)" : undefined,
                    }}
                  >
                    <img
                      src={FRAME_IMG[f.uid]}
                      alt={`${f.label} frame`}
                      width={168}
                      height={168}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full"
                      style={{ objectFit: "cover", display: "block" }}
                    />
                  </span>
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

        {/* ── Trust badges — hairline-separated, refined ─────────────── */}
        <div className="flex flex-wrap items-center justify-center mt-16 text-center" style={{ gap: "10px 0" }}>
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
