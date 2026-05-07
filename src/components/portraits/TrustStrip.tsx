/**
 * TrustStrip — three trust signals in an editorial colophon strip.
 *
 * Design intent: refined European luxury (Aesop, Hermès, Le Labo trust bands),
 * not generic e-commerce icon-cards. The visual conceit is a printed-page
 * spread:
 *   - Three columns separated by hand-feel hairlines (no card containers).
 *   - Italic Cormorant 4.9 numeral as the typographic anchor of column 1.
 *   - Asap display for headlines, Cormorant italic for captions — the same
 *     editorial pairing the brand uses elsewhere for "emotional whispers".
 *   - Subtle paper-grain texture and gold-fade rules at the strip edges.
 *
 * Stacks gracefully on mobile (rules go horizontal), staggered entrance on
 * scroll-into-view, restrained hover on devices that support hover.
 *
 * Copy is held verbatim — every word as supplied.
 */
import { motion, useReducedMotion } from "framer-motion";
import { Globe, ShieldCheck } from "lucide-react";
import { PALETTE, display, cormorantItalic, EASE } from "./tokens";

// ── 1px noise texture, base64-inlined so we don't ship an asset.
// Subtle: 6% black opacity over the section, multiply blend.
const PAPER_GRAIN_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
      `<filter id="n">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.86" numOctaves="2" stitchTiles="stitch"/>` +
        `<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>` +
      `</filter>` +
      `<rect width="100%" height="100%" filter="url(#n)"/>` +
    `</svg>`
  );

// ── A proper SVG star (consistent kerning, sharp at any size, vs unicode ★)
function Star({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={PALETTE.gold}
      aria-hidden
      style={{ display: "block" }}
    >
      <path d="M12 1.7l3.18 7.05 7.62.85-5.7 5.21 1.6 7.49L12 18.6l-6.7 3.7 1.6-7.49-5.7-5.21 7.62-.85L12 1.7z" />
    </svg>
  );
}

function FiveStars({ size = 16 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="Five out of five stars"
      style={{ display: "inline-flex", gap: size * 0.32 }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} />
      ))}
    </div>
  );
}

// ── Hand-feel divider rule: thin gold with gradient fade at the ends so it
//    looks letterpress-printed, not CSS border.
function GoldRule({
  orientation = "horizontal",
  length,
  className,
}: {
  orientation?: "horizontal" | "vertical";
  length?: number | string;
  className?: string;
}) {
  const horizontalGradient = `linear-gradient(90deg, transparent 0%, ${PALETTE.gold}66 18%, ${PALETTE.gold}88 50%, ${PALETTE.gold}66 82%, transparent 100%)`;
  const verticalGradient = `linear-gradient(180deg, transparent 0%, ${PALETTE.gold}55 22%, ${PALETTE.gold}55 78%, transparent 100%)`;
  return (
    <div
      aria-hidden
      className={className}
      style={{
        background: orientation === "horizontal" ? horizontalGradient : verticalGradient,
        height: orientation === "horizontal" ? 1 : (length ?? "100%"),
        width: orientation === "horizontal" ? (length ?? "100%") : 1,
      }}
    />
  );
}

// ── Wrapper for staggered entrance + restrained hover.
interface ColumnProps {
  index: number;
  children: React.ReactNode;
}
function Column({ index, children }: ColumnProps) {
  const reduce = useReducedMotion();
  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.95,
        delay: 0.12 + index * 0.16,
        ease: EASE.out,
      }}
      className="trust-col flex flex-col items-center text-center"
      style={{
        // Equal vertical rhythm; horizontal padding lets the gold rules
        // breathe between columns at md+.
        padding: "8px 4px",
      }}
    >
      {children}
    </motion.article>
  );
}

// ── Shared type recipes ─────────────────────────────────────────────────
const titleAsap: React.CSSProperties = {
  ...display("clamp(20px, 2vw, 23px)"),
  color: PALETTE.ink,
  margin: 0,
  lineHeight: 1.18,
};

const captionItalic: React.CSSProperties = {
  ...cormorantItalic("clamp(15.5px, 1.55vw, 17.5px)"),
  color: PALETTE.earth,
  maxWidth: "30ch",
  margin: "0 auto",
};

// "Rated" / "from 47K+" — the small-cap voice surrounding the big numeral.
const ratingFlankText: React.CSSProperties = {
  fontFamily: "Asap, system-ui, sans-serif",
  fontSize: "13px",
  fontWeight: 600,
  color: PALETTE.earthMuted,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  display: "block",
  lineHeight: 1,
};

export function TrustStrip() {
  return (
    <section
      className="relative px-6 md:px-10"
      style={{
        // Warm parchment-to-ivory wash gives the strip its own surface
        // without competing with the page's white sections above and below.
        background: "linear-gradient(180deg, #faf6ed 0%, #fdfaf3 55%, #ffffff 100%)",
        paddingTop: "clamp(72px, 9vw, 108px)",
        paddingBottom: "clamp(72px, 9vw, 108px)",
        overflow: "hidden",
      }}
      aria-label="Trust signals"
    >
      {/* Paper grain — tasteful, ~6% black noise, multiply-blended. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `url("${PAPER_GRAIN_DATA_URI}")`,
          backgroundSize: "240px 240px",
          opacity: 0.55,
          mixBlendMode: "multiply",
        }}
      />

      {/* Top + bottom horizontal gold hairlines, with gradient fade at edges. */}
      <div
        aria-hidden
        className="absolute left-0 right-0"
        style={{ top: 0, height: 1 }}
      >
        <GoldRule orientation="horizontal" />
      </div>
      <div
        aria-hidden
        className="absolute left-0 right-0"
        style={{ bottom: 0, height: 1 }}
      >
        <GoldRule orientation="horizontal" />
      </div>

      <div
        className="relative mx-auto"
        style={{ maxWidth: 1120 }}
      >
        <div
          // CSS Grid with explicit 1px gutter columns so the gold rules sit
          // between, not as borders. Stacks to single column on mobile and
          // we render horizontal rules in the gutters instead.
          className="grid"
          style={{
            gridTemplateColumns: "1fr",
            rowGap: 0,
          }}
        >
          {/* ── Desktop: 3 cols + 2 vertical rules. Mobile: 3 stacked rows.  */}
          <div
            className="grid gap-y-12 md:gap-y-0"
            style={{
              gridTemplateColumns: "1fr",
            }}
          >
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "1fr",
                gap: "44px 0",
              }}
            >
              <div className="md:hidden">
                <RatingColumn />
              </div>
              <div className="hidden md:block">
                <DesktopRow />
              </div>

              {/* Mobile dividers between stacked columns (md:hidden). */}
              <MobileDivider className="md:hidden" />
              <div className="md:hidden">
                <ShippingColumn />
              </div>
              <MobileDivider className="md:hidden" />
              <div className="md:hidden">
                <GuaranteeColumn />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restrained hover: subtle gold rule grows under each column's heading.
          Only on devices that actually have hover (not touch). */}
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          .trust-col [data-hover-rule] {
            transform: scaleX(0.4);
            transition: transform 600ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms;
            opacity: 0.55;
          }
          .trust-col:hover [data-hover-rule] {
            transform: scaleX(1);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}

// ── Desktop row: three columns with vertical gold rules in between ──────
function DesktopRow() {
  return (
    <div
      className="grid items-stretch"
      style={{
        // 1fr  1px  1fr  1px  1fr — gold rules occupy the gutter columns.
        gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
        gap: 0,
      }}
    >
      <div className="px-6 lg:px-12">
        <RatingColumn />
      </div>
      <GoldRule orientation="vertical" />
      <div className="px-6 lg:px-12">
        <ShippingColumn />
      </div>
      <GoldRule orientation="vertical" />
      <div className="px-6 lg:px-12">
        <GuaranteeColumn />
      </div>
    </div>
  );
}

function MobileDivider({ className }: { className?: string }) {
  return (
    <div className={className} style={{ display: "flex", justifyContent: "center" }}>
      <GoldRule orientation="horizontal" length={120} />
    </div>
  );
}

// ── Column I — Rating. The 4.9 is the typographic anchor. ──────────────
function RatingColumn() {
  return (
    <Column index={0}>
      <FiveStars size={15} />

      {/* Title held verbatim — typeset across three lines so the 4.9
          dominates as a printed-page numeral. */}
      <h3
        style={{ margin: "26px 0 0", display: "block", lineHeight: 1 }}
        aria-label="Rated 4.9 from 47K+"
      >
        <span style={ratingFlankText}>Rated</span>
        <span
          aria-hidden
          style={{
            ...cormorantItalic("clamp(76px, 9.4vw, 108px)"),
            color: PALETTE.ink,
            fontWeight: 500,
            display: "block",
            lineHeight: 0.92,
            margin: "10px 0 12px",
            // Crisp letterpress contrast — italic Cormorant 500 holds
            // the high stroke contrast that gives didone numerals their
            // editorial feel.
            fontFeatureSettings: "'lnum' 1",
          }}
        >
          4.9
        </span>
        <span style={ratingFlankText}>from 47K+</span>
      </h3>

      {/* Hover rule + ornament + caption */}
      <div
        data-hover-rule
        aria-hidden
        style={{
          width: 36,
          height: 1,
          background: PALETTE.gold,
          opacity: 0.55,
          margin: "22px auto 0",
          transformOrigin: "center",
        }}
      />
      <p style={{ ...captionItalic, marginTop: 14 }}>happy pet parent reviews</p>
    </Column>
  );
}

// ── Column II — Shipping ────────────────────────────────────────────────
function ShippingColumn() {
  return (
    <Column index={1}>
      <Globe
        size={42}
        strokeWidth={1.15}
        color={PALETTE.ink}
        aria-hidden
        style={{ display: "block" }}
      />
      <h3 style={{ ...titleAsap, marginTop: 26 }}>Worldwide Shipping</h3>
      <div
        data-hover-rule
        aria-hidden
        style={{
          width: 36,
          height: 1,
          background: PALETTE.gold,
          opacity: 0.55,
          margin: "12px auto 0",
          transformOrigin: "center",
        }}
      />
      <p style={{ ...captionItalic, marginTop: 12 }}>
        printed with care · framed beautifully · delivered to your door
      </p>
    </Column>
  );
}

// ── Column III — Guarantee. Rose accent on the icon for emotional weight. ─
function GuaranteeColumn() {
  return (
    <Column index={2}>
      <ShieldCheck
        size={42}
        strokeWidth={1.25}
        color={PALETTE.rose}
        aria-hidden
        style={{ display: "block" }}
      />
      <h3 style={{ ...titleAsap, marginTop: 26 }}>100% Love-It Guarantee</h3>
      <div
        data-hover-rule
        aria-hidden
        style={{
          width: 36,
          height: 1,
          background: PALETTE.gold,
          opacity: 0.55,
          margin: "12px auto 0",
          transformOrigin: "center",
        }}
      />
      <p style={{ ...captionItalic, marginTop: 12 }}>
        we'll make it right · re-do or refund · no stress
      </p>
    </Column>
  );
}
