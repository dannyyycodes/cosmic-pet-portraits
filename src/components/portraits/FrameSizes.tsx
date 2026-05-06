/**
 * FrameSizes — informational pricing strip shown above the studio.
 *
 * Displays all 11 launch sizes + 3 frame colors so customers know what they'll
 * pay BEFORE they generate. NOT interactive — the actual size + frame
 * selection happens in the studio below. No per-card CTAs (those caused
 * confusion about whether clicking selected the size).
 *
 * Pricing locked: src/components/portraits/gelatoFramedCanvas.ts (CANVAS_SIZES).
 */
import { Check } from "lucide-react";
import { CANVAS_SIZES, FRAME_COLORS } from "./gelatoFramedCanvas";
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

interface FrameSizesProps {
  currency: Currency;
  onPickSize?: (size: SizeKey) => void;
}

export function FrameSizes({ currency }: FrameSizesProps) {
  const symbol = currency === "GBP" ? "£" : "$";
  const usdMul = 1.3; // rough conversion for display only
  const formatPrice = (gbp: number) =>
    currency === "GBP" ? `${symbol}${gbp}` : `${symbol}${Math.round(gbp * usdMul)}`;

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
        <h2 id="frame-sizes-heading" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
          Canvas sizes and prices
        </h2>

        {/* Size pricing grid — informational, not interactive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {CANVAS_SIZES.map((s) => (
            <div
              key={s.uid}
              className="rounded-xl px-3 py-3.5 text-center relative"
              style={{
                background: PALETTE.cream2,
                border: `1px solid ${PALETTE.sand}`,
                boxShadow: "0 1px 3px rgba(20,18,16,0.03)",
              }}
            >
              <div
                style={{
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: PALETTE.ink,
                }}
              >
                {s.label}
              </div>
              <div style={{ ...tabularPrice("18px"), marginTop: 2 }}>
                {formatPrice(s.priceGBP)}
              </div>
            </div>
          ))}
        </div>

        {/* Frame swatches strip */}
        <div className="flex items-center justify-center gap-5 mt-9">
          <span
            style={{
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: 12.5,
              color: PALETTE.earthMuted,
              letterSpacing: "0.04em",
            }}
          >
            Frame:
          </span>
          {FRAME_COLORS.map((c) => (
            <div key={c.uid} className="flex items-center gap-2">
              <div
                className="rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  background: c.swatchHex,
                  border: `1px solid ${PALETTE.sandDeep}`,
                  boxShadow: "0 1px 3px rgba(20,18,16,0.08)",
                }}
              />
              <span
                style={{
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: 12.5,
                  color: PALETTE.earth,
                }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-9 text-center">
          {[
            "Cotton-poly canvas",
            "FSC-certified slim frame",
            "Archival inks",
            "3–5 day delivery",
            "UK · EU · US",
          ].map((line, i) => (
            <span
              key={line}
              className="inline-flex items-center gap-1.5"
              style={{
                fontFamily: 'Assistant, system-ui, sans-serif',
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
