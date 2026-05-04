/**
 * FrameSizes — four-tier price ladder shown before the Upload Studio.
 *
 * Pricing locked in vault: pricing-ladder-2026-05-02.md
 *   GBP £69/£99/£149/£199 + Soul Edition +£40 · USD $89/$129/$189/$249 + +$50
 *
 * Hero seal on the 12×16 (£99/$129) — CRO anchor per build plan.
 * Tabular numerals on every price.
 */
import { SplitWords } from "./SplitWords";
import { PALETTE, display, cormorantItalic, eyebrow, tabularPrice } from "./tokens";

export type Currency = "GBP" | "USD";
export type SizeKey = "8x10" | "12x16" | "16x20" | "20x30";

export interface SizePricing {
  size: string;
  retail: number;
  label: string;
  hero?: boolean;
  caption: string;
}

export const PRICING: Record<
  Currency,
  Record<SizeKey, SizePricing> & {
    soulEdition: { retail: number; label: string };
    digital: { retail: number; label: string };
  }
> = {
  GBP: {
    "8x10":  { size: "8×10″",  retail: 39, label: "£39", caption: "Desk · shelf · bedside" },
    "12x16": { size: "12×16″", retail: 49, label: "£49", caption: "Entry · gift-friendly" },
    "16x20": { size: "16×20″", retail: 65, label: "£65", hero: true, caption: "Hero · main wall feature" },
    "20x30": { size: "20×30″", retail: 99, label: "£99", caption: "Statement · large feature" },
    digital:     { retail: 19, label: "£19" },
    soulEdition: { retail: 40, label: "+£40" },
  },
  USD: {
    "8x10":  { size: "8×10″",  retail: 49,  label: "$49",  caption: "Desk · shelf · bedside" },
    "12x16": { size: "12×16″", retail: 65,  label: "$65",  caption: "Entry · gift-friendly" },
    "16x20": { size: "16×20″", retail: 85,  label: "$85",  hero: true, caption: "Hero · main wall feature" },
    "20x30": { size: "20×30″", retail: 129, label: "$129", caption: "Statement · large feature" },
    digital:     { retail: 25, label: "$25" },
    soulEdition: { retail: 50, label: "+$50" },
  },
};

export const SIZE_KEYS: SizeKey[] = ["8x10", "12x16", "16x20", "20x30"];

interface FrameSizesProps {
  currency: Currency;
  /** Optional — pre-select size in upload studio when a tile is clicked. */
  onPickSize?: (size: SizeKey) => void;
}

export function FrameSizes({ currency, onPickSize }: FrameSizesProps) {
  return (
    <section
      id="sizes"
      className="relative px-6 md:px-10"
      style={{
        background: "rgba(255, 255, 255, 0.84)",
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "clamp(96px, 12vh, 160px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="frame-sizes-heading"
    >
      <div className="mx-auto" style={{ maxWidth: "1240px" }}>
        <div className="max-w-[760px]">
          <p style={eyebrow(PALETTE.earthMuted)}>Pick the wall</p>
          <h2
            id="frame-sizes-heading"
            style={{ ...display("clamp(34px, 5vw, 58px)"), color: PALETTE.ink, marginTop: "18px" }}
          >
            <SplitWords text="Four sizes." />{" "}
            <SplitWords text="One frame" style={{ color: PALETTE.rose, fontStyle: "italic" }} delay={0.3} />{" "}
            <SplitWords text="you'll keep forever." delay={0.55} />
          </h2>
          <p style={{ ...cormorantItalic("21px"), color: PALETTE.earth, marginTop: "20px" }}>
            FSC-certified slim poplar/pine. Cotton-poly canvas. Archival inks. Printed and
            framed at our partner closest to your address.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {SIZE_KEYS.map((key) => {
            const tier = PRICING[currency][key];
            const isHero = !!tier.hero;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPickSize?.(key)}
                className="group text-left rounded-sm relative transition-all hover:-translate-y-0.5"
                style={{
                  background: PALETTE.cream2,
                  border: isHero
                    ? `1px solid ${PALETTE.gold}`
                    : `1px solid ${PALETTE.sand}`,
                  padding: "26px",
                  boxShadow: isHero ? "0 18px 36px rgba(196, 162, 101, 0.15)" : "none",
                }}
              >
                {isHero && (
                  <span
                    aria-label="Hero size — most popular"
                    className="absolute -top-3 right-5 px-3 py-1 rounded-full"
                    style={{
                      background: PALETTE.gold,
                      color: PALETTE.cream,
                      fontSize: "10.5px",
                      letterSpacing: "0.16em",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Hero
                  </span>
                )}
                <p
                  style={{
                    fontFamily: 'Asap, system-ui, sans-serif',
                    fontSize: "21px",
                    fontWeight: 500,
                    color: PALETTE.ink,
                  }}
                >
                  {tier.size}
                </p>
                <p style={{ ...tabularPrice("32px"), marginTop: "10px" }}>{tier.label}</p>
                <p style={{ marginTop: "8px", color: PALETTE.earth, fontSize: "14px", lineHeight: 1.5 }}>
                  {tier.caption}
                </p>
                <p
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    marginTop: "16px",
                    fontSize: "13px",
                    color: PALETTE.rose,
                    fontWeight: 500,
                  }}
                >
                  Use this size →
                </p>
              </button>
            );
          })}
        </div>

        <p
          className="mt-10 text-center"
          style={{ fontSize: "13.5px", color: PALETTE.earthMuted, letterSpacing: "0.04em" }}
        >
          Slim poplar/pine frame · cotton-poly canvas · framed and shipped in 3–5 days · UK · EU · US
        </p>
      </div>
    </section>
  );
}
