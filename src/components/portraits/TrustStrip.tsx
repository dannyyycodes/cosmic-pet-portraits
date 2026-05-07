/**
 * TrustStrip — single continuous marquee.
 *
 * One flowing horizontal line of trust signals, separated by gold ornaments.
 * Slow auto-scroll on desktop (60s loop, linear easing). Pauses on hover.
 * Honours prefers-reduced-motion. Edge fade-mask so the text dissolves at
 * the section margins rather than abruptly clipping.
 *
 * Modern luxury vocabulary (Bottega Veneta / Skims announcement bar) —
 * no boxes, no rules, no halos. Mobile sees the same line, it just doesn't
 * animate (still readable as a tall, wrapped paragraph if scroll is paused).
 *
 * Copy held verbatim.
 */
import { Globe, ShieldCheck } from "lucide-react";
import { PALETTE, display, cormorantItalic } from "./tokens";

// ── 5 sharp SVG stars (consistent kerning, vs unicode ★) ────────────────
function Star({ size = 14 }: { size?: number }) {
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

function FiveStars({ size = 14 }: { size?: number }) {
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

// ── Decorative gold ornament between trust signals ──────────────────────
function Ornament() {
  return (
    <span
      aria-hidden
      style={{
        color: PALETTE.gold,
        fontSize: 14,
        opacity: 0.7,
        margin: "0 4px",
      }}
    >
      ✦
    </span>
  );
}

// ── A single run of all three signals — duplicated for seamless loop ────
function MarqueeRun() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 28,
        whiteSpace: "nowrap",
        paddingRight: 60,
      }}
    >
      <FiveStars size={14} />
      <span
        style={{
          ...display("clamp(18px, 1.7vw, 20px)"),
          color: PALETTE.ink,
        }}
      >
        Rated 4.9 from 47K+
      </span>
      <span
        style={{
          ...cormorantItalic("clamp(15.5px, 1.5vw, 17.5px)"),
          color: PALETTE.earthMuted,
        }}
      >
        happy pet parent reviews
      </span>

      <Ornament />

      <Globe size={20} strokeWidth={1.4} color={PALETTE.ink} aria-hidden />
      <span
        style={{
          ...display("clamp(18px, 1.7vw, 20px)"),
          color: PALETTE.ink,
        }}
      >
        Worldwide Shipping
      </span>
      <span
        style={{
          ...cormorantItalic("clamp(15.5px, 1.5vw, 17.5px)"),
          color: PALETTE.earthMuted,
        }}
      >
        printed with care · framed beautifully · delivered to your door
      </span>

      <Ornament />

      <ShieldCheck size={20} strokeWidth={1.4} color={PALETTE.rose} aria-hidden />
      <span
        style={{
          ...display("clamp(18px, 1.7vw, 20px)"),
          color: PALETTE.ink,
        }}
      >
        100% Love-It Guarantee
      </span>
      <span
        style={{
          ...cormorantItalic("clamp(15.5px, 1.5vw, 17.5px)"),
          color: PALETTE.earthMuted,
        }}
      >
        we'll make it right · re-do or refund · no stress
      </span>

      <Ornament />
    </div>
  );
}

export function TrustStrip() {
  return (
    <section
      aria-label="Trust signals"
      style={{
        // Warm parchment surface that bleeds into ReviewWall above (#ffffff)
        // and HowItWorks below (#f5f5f5) so neither seam reads as a line.
        background:
          "linear-gradient(180deg, #ffffff 0%, #faf6ed 18%, #faf6ed 82%, #f5f5f5 100%)",
        paddingTop: "clamp(40px, 5vw, 64px)",
        paddingBottom: "clamp(40px, 5vw, 64px)",
        overflow: "hidden",
      }}
    >
      <div
        className="trust-marquee"
        style={{
          // Edge mask so the line dissolves at the section margins rather
          // than abruptly clipping.
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          overflow: "hidden",
        }}
      >
        <div
          className="trust-marquee-track"
          style={{
            display: "inline-flex",
            width: "max-content",
            willChange: "transform",
          }}
        >
          {/* Two identical runs, side by side, give a seamless loop. */}
          <MarqueeRun />
          <MarqueeRun />
        </div>
      </div>

      <style>{`
        .trust-marquee-track {
          animation: trust-scroll 60s linear infinite;
        }
        .trust-marquee:hover .trust-marquee-track {
          animation-play-state: paused;
        }
        @keyframes trust-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .trust-marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}
