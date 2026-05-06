/**
 * FrameSizes — editorial canvas catalog shown above the studio.
 *
 * Refined gallery register: proportion-accurate mini-frames so customers
 * SEE the scale ladder before picking. Hero size (16×20) carries gold
 * accent + "Most loved" pill. Frame-color swatches sit at the top because
 * the frame is the constant — choose once, then scan sizes.
 *
 * NOT interactive — actual selection happens in the studio below.
 *
 * Pricing locked: src/components/portraits/gelatoFramedCanvas.ts (CANVAS_SIZES).
 */
import { Check } from "lucide-react";
import { CANVAS_SIZES, FRAME_COLORS } from "./gelatoFramedCanvas";
import { PALETTE, display, cormorantItalic, eyebrow, tabularPrice } from "./tokens";

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

interface FrameSizesProps {
  currency: Currency;
  onPickSize?: (size: SizeKey) => void;
}

export function FrameSizes({ currency }: FrameSizesProps) {
  const symbol = currency === "GBP" ? "£" : "$";
  const usdMul = 1.3; // rough conversion for display only
  const formatPrice = (gbp: number) =>
    currency === "GBP" ? `${symbol}${gbp}` : `${symbol}${Math.round(gbp * usdMul)}`;

  // Proportion-accurate mini frame: same height across all tiles, width
  // scales with the actual canvas aspect ratio so the eye reads the ladder.
  const FRAME_HEIGHT = 86;

  return (
    <section
      id="sizes"
      className="relative overflow-hidden px-5 md:px-10"
      style={{
        background: PALETTE.cream,
        paddingTop: "clamp(96px, 12vh, 140px)",
        paddingBottom: "clamp(96px, 12vh, 140px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="frame-sizes-heading"
    >
      {/* Soft gold ambient orb — depth without noise */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2"
        style={{
          width: 720,
          height: 720,
          maxWidth: "120%",
          background:
            "radial-gradient(ellipse at center, rgba(196, 162, 101, 0.10) 0%, rgba(196, 162, 101, 0.00) 60%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div className="relative mx-auto" style={{ maxWidth: 1080, zIndex: 1 }}>
        {/* ── Editorial header ─────────────────────────────────────── */}
        <div className="text-center mx-auto" style={{ maxWidth: 640 }}>
          <p style={eyebrow(PALETTE.goldDeep)}>Sized for the wall</p>
          <h2
            id="frame-sizes-heading"
            style={{
              ...display("clamp(34px, 5vw, 54px)"),
              color: PALETTE.ink,
              marginTop: 18,
              lineHeight: 1.05,
            }}
          >
            Eleven sizes.{" "}
            <span
              style={{
                ...cormorantItalic("clamp(36px, 5.2vw, 56px)"),
                color: PALETTE.rose,
                fontWeight: 600,
              }}
            >
              One archival print.
            </span>
          </h2>
        </div>

        {/* ── Frame swatches ───────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mt-10 mb-10"
          aria-label="Available frame finishes"
        >
          <span
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: PALETTE.earthMuted,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Frames
          </span>
          {FRAME_COLORS.map((c) => (
            <div key={c.uid} className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="rounded-full inline-block"
                style={{
                  width: 22,
                  height: 22,
                  background: c.swatchHex,
                  border: `1px solid ${PALETTE.sandDeep}`,
                  boxShadow:
                    "0 2px 6px rgba(20, 18, 16, 0.10), inset 0 0 0 2px rgba(255, 255, 255, 0.06)",
                }}
              />
              <span
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: PALETTE.earth,
                  letterSpacing: "-0.005em",
                }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Size ladder: proportion-accurate gallery tiles ───────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 md:gap-3">
          {CANVAS_SIZES.map((s) => {
            const isHero = !!s.hero;
            const aspectRatio = s.inches.w / s.inches.h;
            const frameW = FRAME_HEIGHT * aspectRatio;

            return (
              <article
                key={s.uid}
                className="group relative rounded-md flex flex-col items-center text-center"
                style={{
                  background: isHero
                    ? `linear-gradient(180deg, ${PALETTE.cream} 0%, rgba(196, 162, 101, 0.04) 100%)`
                    : PALETTE.cream,
                  border: isHero
                    ? `1px solid ${PALETTE.gold}`
                    : `1px solid ${PALETTE.sand}`,
                  padding: "22px 14px 18px",
                  boxShadow: isHero
                    ? "0 14px 38px rgba(196, 162, 101, 0.20), 0 2px 6px rgba(20, 18, 16, 0.04)"
                    : "0 2px 8px rgba(20, 18, 16, 0.03)",
                  transition: "transform 320ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 320ms",
                }}
              >
                {/* "Most loved" pill on hero */}
                {isHero && (
                  <span
                    aria-hidden
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: PALETTE.gold,
                      color: PALETTE.cream,
                      fontFamily: "Asap, system-ui, sans-serif",
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      boxShadow: "0 4px 10px rgba(196, 162, 101, 0.32)",
                    }}
                  >
                    Most loved
                  </span>
                )}

                {/* Proportional canvas preview */}
                <div
                  aria-hidden
                  className="flex items-end justify-center mb-3.5"
                  style={{ height: FRAME_HEIGHT + 6 }}
                >
                  <div
                    style={{
                      width: frameW,
                      height: FRAME_HEIGHT,
                      maxWidth: "100%",
                      background: `linear-gradient(135deg, ${PALETTE.cream2} 0%, ${PALETTE.cream} 50%, ${PALETTE.cream2} 100%)`,
                      border: isHero
                        ? `2px solid ${PALETTE.goldDeep}`
                        : `1.5px solid ${PALETTE.sandDeep}`,
                      borderRadius: 1.5,
                      boxShadow: isHero
                        ? "0 6px 14px rgba(196, 162, 101, 0.28), inset 0 0 0 1px rgba(255, 253, 245, 0.6)"
                        : "0 3px 8px rgba(20, 18, 16, 0.10), inset 0 0 0 1px rgba(255, 253, 245, 0.5)",
                      position: "relative",
                    }}
                  >
                    {isHero && (
                      <span
                        aria-hidden
                        className="absolute"
                        style={{
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          color: PALETTE.gold,
                          fontSize: 16,
                          opacity: 0.55,
                          lineHeight: 1,
                        }}
                      >
                        ✦
                      </span>
                    )}
                  </div>
                </div>

                {/* Size label */}
                <div
                  style={{
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: PALETTE.ink,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {s.label}
                </div>

                {/* Caption (small sans, readable) */}
                <div
                  style={{
                    fontFamily: "Assistant, system-ui, sans-serif",
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: PALETTE.earthMuted,
                    marginTop: 4,
                    lineHeight: 1.4,
                    letterSpacing: "0.005em",
                    minHeight: "1.4em",
                  }}
                >
                  {s.caption}
                </div>

                {/* Hairline divider */}
                <span
                  aria-hidden
                  className="block"
                  style={{
                    height: 1,
                    width: 22,
                    background: isHero ? PALETTE.gold : PALETTE.sandDeep,
                    margin: "11px 0 8px",
                    opacity: isHero ? 0.85 : 0.5,
                  }}
                />

                {/* Price */}
                <div
                  style={{
                    ...tabularPrice("19px"),
                    color: isHero ? PALETTE.goldDeep : PALETTE.ink,
                    fontWeight: 700,
                  }}
                >
                  {formatPrice(s.priceGBP)}
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Delivery disclaimer (sans, quiet) ────────────────────── */}
        <p
          className="text-center mt-9"
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: PALETTE.earthMuted,
            letterSpacing: "0.01em",
            lineHeight: 1.5,
          }}
        >
          Canvas + frame only — delivery is calculated at checkout.
        </p>

        {/* ── Trust line ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-5 text-center">
          {[
            "Cotton-poly canvas",
            "FSC-certified solid frame",
            "Archival inks",
            "3–5 day delivery",
            "UK · EU · US",
          ].map((line, i) => (
            <span
              key={line}
              className="inline-flex items-center gap-1.5"
              style={{
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: 12.5,
                color: PALETTE.earthMuted,
                letterSpacing: "0.02em",
              }}
            >
              {i > 0 && <span style={{ color: PALETTE.sandDeep }}>·</span>}
              <Check className="w-3 h-3" style={{ color: PALETTE.rose, marginRight: 1 }} />
              {line}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
