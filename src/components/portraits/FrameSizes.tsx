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
import { Check } from "lucide-react";
import { CANVAS_SIZES, FRAME_UPGRADE_GBP } from "./gelatoFramedCanvas";
import { PALETTE, tabularPrice } from "./tokens";
import frameHero from "@/assets/frames/frame-hero.webp";

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

const FRAME_UPGRADE = FRAME_UPGRADE_GBP["8x10"] ?? 45;

const TRUST_BADGES = [
  "Canvas from £39 · digital from £19",
  "Real wood frame, optional (+£45)",
  "Approve it before you pay",
  "Arrives in 3–5 days",
  "Ships UK, Europe & USA",
  "Not right? We'll make it right.",
];

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
        paddingTop: "clamp(72px, 9vh, 116px)",
        paddingBottom: "clamp(72px, 9vh, 116px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="frame-sizes-heading"
    >
      <div className="mx-auto" style={{ maxWidth: 1120 }}>
        {/* ── Hero band: framed canvas photo | size list ─────────────── */}
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

          {/* Size list column */}
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
                margin: "12px 0 22px",
                maxWidth: 420,
              }}
            >
              Every size is the same hand-finished canvas. Tap one to set it up in the studio.
            </p>

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

            {/* Frame note — choice happens at checkout, not here. */}
            <p
              className="mt-6"
              style={{
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: PALETTE.earthMuted,
              }}
            >
              Want a real wood frame? Add one for +{symbol}{FRAME_UPGRADE} at checkout — black, natural, or dark wood.
            </p>
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
