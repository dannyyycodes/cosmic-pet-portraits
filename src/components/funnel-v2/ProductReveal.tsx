import { useEffect, useRef, useState } from "react";
import { Star, Sparkle, Sparkles } from "lucide-react";
import { HeartsBackdrop } from "./HeartsBackdrop";
import type { FunnelPath } from "./PathPicker";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Constellation backdrop — Lucide star icons + SVG connectors ──
 * Professionally-drawn Lucide star shapes (Star, Sparkle, Sparkles)
 * placed as a constellation across the band. Thin gold connectors
 * drawn in an absolutely-positioned SVG behind the icons. Radial
 * gold glow behind the brightest stars for depth. Slow, staggered
 * twinkle — CSS only, GPU-friendly. */

type StarKind = "bright" | "mid" | "small" | "dust";
type StarDef = {
  // percentage coords so the constellation scales with any band height
  x: number; y: number;
  kind: StarKind;
  rot?: number;
  delay?: number;
};

// Stars scattered across the full combined section with small constellation
// clusters woven in. Text lives in opaque cards layered above, so stars are
// free to occupy the entire surface without risking letterform legibility.
const CONSTELLATION_STARS: StarDef[] = [
  // Top edge — Cassiopeia W across the top
  { x: 4,  y: 3,  kind: "dust",   delay: 0.0 },
  { x: 14, y: 6,  kind: "small",  delay: 0.4 },
  { x: 28, y: 8,  kind: "mid",    delay: 0.8 },   // W-1
  { x: 36, y: 3,  kind: "mid",    delay: 1.2 },   // W-2
  { x: 44, y: 8,  kind: "bright", delay: 1.6 },   // W-3
  { x: 52, y: 3,  kind: "mid",    delay: 2.0 },   // W-4
  { x: 60, y: 8,  kind: "mid",    delay: 2.4 },   // W-5
  { x: 72, y: 5,  kind: "small",  delay: 2.8 },
  { x: 84, y: 9,  kind: "dust",   delay: 3.2 },
  { x: 94, y: 4,  kind: "small",  delay: 3.6 },

  // Upper-mid — paw print upper-left + dust scatter
  { x: 6,  y: 22, kind: "small",  delay: 0.3 },   // toe
  { x: 12, y: 18, kind: "mid",    delay: 0.7 },   // toe
  { x: 18, y: 20, kind: "mid",    delay: 1.1 },   // toe
  { x: 13, y: 28, kind: "bright", delay: 1.5 },   // pad
  { x: 34, y: 24, kind: "dust",   delay: 0.5 },
  { x: 48, y: 20, kind: "small",  delay: 0.9 },
  { x: 62, y: 26, kind: "dust",   delay: 1.3 },
  { x: 78, y: 22, kind: "small",  delay: 1.7 },
  { x: 94, y: 26, kind: "dust",   delay: 2.1 },

  // Middle band — a gentle scatter
  { x: 4,  y: 44, kind: "small",  delay: 0.4 },
  { x: 18, y: 48, kind: "dust",   delay: 0.8 },
  { x: 34, y: 42, kind: "dust",   delay: 1.2 },
  { x: 50, y: 46, kind: "small",  delay: 1.6 },
  { x: 66, y: 42, kind: "dust",   delay: 2.0 },
  { x: 82, y: 48, kind: "small",  delay: 2.4 },
  { x: 96, y: 44, kind: "dust",   delay: 2.8 },

  // Lower-mid — triangle right + scatter
  { x: 84, y: 62, kind: "mid",    delay: 0.3 },
  { x: 94, y: 66, kind: "small",  delay: 0.7 },
  { x: 86, y: 70, kind: "bright", delay: 1.1 },
  { x: 6,  y: 64, kind: "dust",   delay: 0.5 },
  { x: 22, y: 68, kind: "small",  delay: 0.9 },
  { x: 40, y: 64, kind: "dust",   delay: 1.3 },
  { x: 58, y: 70, kind: "small",  delay: 1.7 },
  { x: 72, y: 66, kind: "dust",   delay: 2.1 },

  // Bottom edge — Big Dipper along the bottom
  { x: 4,  y: 94, kind: "dust",   delay: 0.2 },
  { x: 14, y: 90, kind: "mid",    delay: 0.6 },   // bowl
  { x: 22, y: 96, kind: "mid",    delay: 1.0 },   // bowl
  { x: 30, y: 91, kind: "bright", delay: 1.4 },   // bowl
  { x: 38, y: 96, kind: "mid",    delay: 1.8 },   // bowl
  { x: 48, y: 92, kind: "mid",    delay: 2.2 },   // handle
  { x: 58, y: 96, kind: "small",  delay: 2.6 },   // handle
  { x: 68, y: 91, kind: "bright", delay: 3.0 },   // handle tip
  { x: 80, y: 96, kind: "dust",   delay: 0.4 },
  { x: 92, y: 92, kind: "small",  delay: 0.8 },
];

// Within-cluster connections only — indexes verified against the expanded star array.
const CONNECTIONS: Array<[number, number]> = [
  // Cassiopeia W (indices 2-6)
  [2, 3], [3, 4], [4, 5], [5, 6],
  // Paw print — pad (13) → each toe (10, 11, 12)
  [13, 10], [13, 11], [13, 12],
  // Right triangle (indices 26, 27, 28)
  [26, 27], [27, 28], [28, 26],
  // Big Dipper bowl (35, 36, 37, 38)
  [35, 36], [36, 37], [37, 38], [38, 35],
  // Big Dipper handle (38 → 39 → 40 → 41)
  [38, 39], [39, 40], [40, 41],
];

// Visible sizes — text lives in opaque cards, so stars no longer risk
// landing behind letterforms. Free to be properly legible.
const STAR_SIZES: Record<StarKind, number> = {
  bright: 18,
  mid: 12,
  small: 9,
  dust: 5,
};

const STAR_OPACITIES: Record<StarKind, number> = {
  bright: 0.55,
  mid: 0.4,
  small: 0.32,
  dust: 0.2,
};

const ConstellationBackdrop = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none"
    style={{ zIndex: 0 }}
  >
    {/* Lines first, behind the stars */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="constLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c4a265" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#c4a265" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c4a265" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <g stroke="url(#constLine)" strokeWidth="0.09" fill="none" vectorEffect="non-scaling-stroke">
        {CONNECTIONS.map(([a, b], i) => {
          const from = CONSTELLATION_STARS[a];
          const to = CONSTELLATION_STARS[b];
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
      </g>
    </svg>

    {/* Stars on top */}
    {CONSTELLATION_STARS.map((s, i) => {
      const size = STAR_SIZES[s.kind];
      const baseOp = STAR_OPACITIES[s.kind];
      const Icon = s.kind === "bright" ? Sparkles : s.kind === "mid" ? Star : s.kind === "small" ? Sparkle : Star;
      return (
        <div
          key={i}
          className="constellation-star"
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: `translate(-50%, -50%) rotate(${s.rot ?? 0}deg)`,
            opacity: baseOp,
            animationDelay: `${s.delay ?? 0}s`,
          }}
        >
          <Icon
            size={size}
            strokeWidth={1.3}
            fill={s.kind === "dust" ? "#c4a265" : "none"}
            color="#c4a265"
          />
        </div>
      );
    })}

    <style>{`
      .constellation-star {
        animation: constellationTwinkle 5s ease-in-out infinite;
        will-change: opacity;
      }
      @keyframes constellationTwinkle {
        0%, 100% { filter: brightness(1); }
        50%      { filter: brightness(1.35); }
      }
      @media (prefers-reduced-motion: reduce) {
        .constellation-star { animation: none !important; }
      }
    `}</style>
  </div>
);

/* ── VSOP Credibility — warm authority ── */
const VsopCredibility = ({
  path = "discover" as FunnelPath,
  revealed = true,
}: {
  path?: FunnelPath;
  /** Whether the parent section has entered view — drives the staggered
   * entrance animation for the lead paragraph, cards and glyph row so
   * the whole block reads as choreographed rather than a single fade. */
  revealed?: boolean;
}) => {
  const isMemorial = path === "memorial";
  const isNew = path === "new";

  const authorityLead = isMemorial
    ? (
        <>
          Read with{" "}
          <span className="vsop-gold" style={{ color: "var(--gold, #c4a265)", fontWeight: 700, letterSpacing: "0.03em" }}>VSOP87</span>
          {" — the same planetary model "}
          <span className="vsop-ink" style={{ color: "var(--ink, #1f1c18)", fontWeight: 700 }}>NASA</span>
          {" uses — so the sky we hold for them is the exact one they knew."}
        </>
      )
    : isNew
    ? (
        <>
          Their map was written the moment they arrived. Using{" "}
          <span className="vsop-gold" style={{ color: "var(--gold, #c4a265)", fontWeight: 700, letterSpacing: "0.03em" }}>VSOP87</span>
          {" — the same planetary model "}
          <span className="vsop-ink" style={{ color: "var(--ink, #1f1c18)", fontWeight: 700 }}>NASA</span>
          {" uses — we read the exact sky they came into."}
        </>
      )
    : (
        <>
          Using{" "}
          <span className="vsop-gold" style={{ color: "var(--gold, #c4a265)", fontWeight: 700, letterSpacing: "0.03em" }}>VSOP87</span>
          {" — the same planetary model used by "}
          <span className="vsop-ink" style={{ color: "var(--ink, #1f1c18)", fontWeight: 700 }}>NASA</span>
          {" and professional observatories worldwide."}
        </>
      );

  const authorityCards = isMemorial
    ? [
        {
          h: "Read from real coordinates.",
          d: "13 celestial bodies, rising sign, elemental balance and house placements — the sky they lived under, captured exactly.",
        },
        {
          h: "Accurate to a fraction of a degree.",
          d: "Their chart is remembered precisely — real planetary math, not a generic horoscope about grief.",
        },
      ]
    : isNew
    ? [
        {
          h: "The sky they arrived under — captured exactly.",
          d: "13 celestial bodies, rising sign, elemental balance and house placements — all mapped to the exact minute they came into the world.",
        },
        {
          h: "Accurate to a fraction of a degree.",
          d: "Their very first reading comes from real planetary math, not a generic personality guess.",
        },
      ]
    : [
        {
          h: "Not a personality quiz. Real coordinates.",
          d: "13 celestial bodies, rising sign, elemental balance, and house placements — all calculated to the exact minute.",
        },
        {
          h: "Accurate to a fraction of a degree.",
          d: "Their reading comes from real planetary math, not generic horoscope predictions.",
        },
      ];

  const r = revealed ? " is-in" : "";

  return (
  <div className="relative text-center overflow-hidden vsop-section">
    {/* Decorative orbit backdrop — pure SVG, very low opacity, gently rotating */}
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none vsop-orbit"
      width="640" height="640" viewBox="0 0 640 640"
      aria-hidden="true"
      style={{ maxWidth: "110%", height: "auto", opacity: 0.35 }}
    >
      <defs>
        <radialGradient id="vsop-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c4a265" stopOpacity="0.12" />
          <stop offset="70%" stopColor="#c4a265" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="320" cy="320" r="280" fill="url(#vsop-glow)" />
      <circle cx="320" cy="320" r="140" stroke="#c4a265" strokeWidth="0.6" strokeDasharray="2 6" fill="none" opacity="0.5" />
      <circle cx="320" cy="320" r="200" stroke="#c4a265" strokeWidth="0.6" strokeDasharray="3 9" fill="none" opacity="0.4" />
      <circle cx="320" cy="320" r="260" stroke="#c4a265" strokeWidth="0.5" strokeDasharray="2 12" fill="none" opacity="0.3" />
      {/* Traveling planet dots */}
      <circle cx="460" cy="320" r="3" fill="#c4a265" opacity="0.8" />
      <circle cx="320" cy="120" r="2.5" fill="#bf524a" opacity="0.7" />
      <circle cx="180" cy="420" r="2.5" fill="#c4a265" opacity="0.6" />
    </svg>

    <div className="relative">
      {/* Authority lead — route-aware. The big section title now lives
          outside this card (hoisted in ProductReveal) so this paragraph
          acts as the supporting credibility statement. Gold-highlighted
          brand names (VSOP87 / NASA) get a one-pass shimmer on reveal. */}
      <p
        className={`vsop-lead${r}`}
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "clamp(0.92rem, 3.2vw, 1rem)",
          color: "var(--earth, #6e6259)",
          lineHeight: 1.55,
          maxWidth: 460,
          margin: "0 auto 28px",
        }}
      >
        {authorityLead}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {authorityCards.map((item, i) => (
          <div
            key={i}
            className={`vsop-auth-card${r}`}
            style={{
              position: "relative",
              borderRadius: 12,
              padding: "20px 20px",
              textAlign: "left",
              background: "linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)",
              border: "1px solid rgba(196,162,101,0.28)",
              boxShadow: "0 2px 16px rgba(196,162,101,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
              transitionDelay: `${250 + i * 110}ms`,
            }}
          >
            <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.95rem", color: "var(--ink, #1f1c18)", lineHeight: 1.3, marginBottom: 8 }}>
              {item.h}
            </p>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--earth, #6e6259)", lineHeight: 1.55 }}>
              {item.d}
            </p>
          </div>
        ))}
      </div>

      {/* Eyebrow above glyph row */}
      <p
        className="mb-3"
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--gold, #c4a265)",
          opacity: 0.85,
        }}
      >
        The thirteen bodies we read
      </p>

      {/* Planet row — gold gradient glyphs on rich pills */}
      <div className={`flex flex-wrap justify-center gap-1.5 mb-8 vsop-glyph-row${r}`}>
        {[
          ["Sun","\u2609\uFE0E"],["Moon","\u263D\uFE0E"],["Mercury","\u263F\uFE0E"],["Venus","\u2640\uFE0E"],
          ["Mars","\u2642\uFE0E"],["Jupiter","\u2643\uFE0E"],["Saturn","\u2644\uFE0E"],["Uranus","\u2645\uFE0E"],
          ["Neptune","\u2646\uFE0E"],["Pluto","\u2647\uFE0E"],["Chiron","\u26B7\uFE0E"],["Node","\u260A\uFE0E"],["Lilith","\u26B8\uFE0E"],
        ].map(([name, sym], i) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full vsop-glyph-pill"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--ink, #1f1c18)",
              background: "linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)",
              border: "1px solid rgba(196,162,101,0.32)",
              boxShadow: "0 1px 4px rgba(196,162,101,0.1)",
              animationDelay: `${i * 120}ms`,
              transitionDelay: `${560 + i * 40}ms`,
            }}
          >
            <span
              style={{
                fontFamily: '"DejaVu Sans", "Noto Sans Symbols", system-ui',
                fontSize: "0.95rem",
                fontVariantEmoji: "text" as never,
                background: "linear-gradient(135deg, #d4b26b, #c4a265 50%, #bf524a)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1,
              }}
            >
              {sym}
            </span>
            {name}
          </span>
        ))}
      </div>

      {/* Standards row with gold diamond separators */}
      <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 vsop-standards-row${r}`}>
        {["VSOP87", "JPL HORIZONS", "IAU STANDARDS", "ASTRONOMIA ENGINE"].map((label, i) => (
          <span key={label} className="inline-flex items-center gap-2">
            {i > 0 && (
              <svg width="4" height="4" viewBox="0 0 4 4" aria-hidden="true">
                <path d="M2 0l1 2-1 2-1-2z" fill="#c4a265" opacity="0.65" />
              </svg>
            )}
            <span
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.64rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--earth, #6e6259)",
              }}
            >
              {label}
            </span>
          </span>
        ))}
      </div>

    </div>

    <style>{`
      @keyframes vsopOrbitSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
      @keyframes vsopDiamondPulse {
        0%, 100% { opacity: 0.85; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.12); }
      }
      @keyframes vsopGlyphTwinkle {
        0%, 92%, 100% { transform: translateY(0); }
        95% { transform: translateY(-1.5px); }
      }
      .vsop-orbit { animation: vsopOrbitSpin 180s linear infinite; will-change: transform; }
      .vsop-diamond { animation: vsopDiamondPulse 3.5s ease-in-out infinite; transform-origin: center; }
      .vsop-glyph-pill {
        animation: vsopGlyphTwinkle 4.5s ease-in-out infinite;
        animation-delay: inherit;
        will-change: transform;
      }

      /* Staggered entrance — lead paragraph, each card, glyph row, standards
         row. Each element opts in via is-in + its own transitionDelay. */
      .vsop-lead,
      .vsop-auth-card,
      .vsop-glyph-row,
      .vsop-standards-row {
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 720ms cubic-bezier(0.22, 1, 0.36, 1),
                    transform 720ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .vsop-lead.is-in,
      .vsop-auth-card.is-in,
      .vsop-glyph-row.is-in,
      .vsop-standards-row.is-in {
        opacity: 1;
        transform: translateY(0);
      }
      .vsop-lead           { transition-delay: 60ms; }
      .vsop-glyph-row.is-in { transition-delay: 560ms; }
      .vsop-standards-row.is-in { transition-delay: 680ms; }

      /* Individual planet pill cascade — each pill fades up with its
         own delay, riding on top of the row-level fade. */
      .vsop-glyph-pill {
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 420ms ease, transform 420ms ease;
      }
      .vsop-glyph-row.is-in .vsop-glyph-pill {
        opacity: 1;
        transform: translateY(0);
      }

      /* One-pass gold shimmer on the VSOP87 / NASA highlight spans.
         Runs once when the section enters view — draws the eye to the
         credibility anchors without nagging. */
      .vsop-lead .vsop-gold,
      .vsop-lead .vsop-ink {
        position: relative;
        display: inline-block;
      }
      .vsop-lead.is-in .vsop-gold::after,
      .vsop-lead.is-in .vsop-ink::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(100deg, transparent 0%, transparent 40%, rgba(255, 253, 245, 0.9) 50%, transparent 60%, transparent 100%);
        background-size: 220% 100%;
        background-position: -120% 0;
        mix-blend-mode: overlay;
        animation: vsopShimmer 1500ms ease-out 900ms 1 forwards;
      }
      .vsop-lead.is-in .vsop-ink::after {
        animation-delay: 1400ms;
      }
      @keyframes vsopShimmer {
        0%   { background-position: -120% 0; opacity: 0; }
        20%  { opacity: 1; }
        100% { background-position: 220% 0;  opacity: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .vsop-orbit, .vsop-diamond, .vsop-glyph-pill { animation: none !important; }
        .vsop-lead, .vsop-auth-card, .vsop-glyph-row, .vsop-standards-row,
        .vsop-glyph-pill {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        .vsop-lead.is-in .vsop-gold::after,
        .vsop-lead.is-in .vsop-ink::after { animation: none !important; }
      }
    `}</style>
  </div>
  );
};

interface ProductRevealProps {
  onCtaClick: () => void;
  ctaLabel: string;
  /** Which intent the visitor selected. Drives the authority-title copy
   * so memorial visitors see reverent language instead of discovery. */
  path?: FunnelPath;
  /** Whether to render the "Once You Understand Them" benefits block.
   * True for discover; hidden for new/memorial/gift where the reader
   * is in a different emotional lane. */
  showBenefits?: boolean;
  /** How much of the authority band to render inline here.
   * - `"both"` (default) — typed IntroTitle + VSOP credibility card
   *   stacked above the checkout cards. Used by discover + new paths.
   * - `"title"` — only the typed IntroTitle. Memorial path uses this
   *   so the emotional opener still lands above the checkout cards,
   *   while the VSOP credibility card is rendered below the cards by
   *   the parent funnel via `<AuthoritySection variant="credibility" />`.
   * - `false` — skip the band entirely. */
  showAuthority?: AuthorityVariant | false;
}

/* ── AuthoritySection ──
 * Exportable authority band (cosmic backdrop + IntroTitle +
 * VsopCredibility). Accepts a variant prop so callers can render just
 * the typed title, just the credibility card, or both.
 *
 * Memorial path uses this to keep the typed IntroTitle above the
 * checkout cards (emotional opener after GriefSection) but push the
 * VSOP credibility card BELOW the cards, so credentials don't
 * interrupt the grief-to-offer cadence.
 */
export type AuthorityVariant = "title" | "credibility" | "both";

export const AuthoritySection = ({
  path = "discover" as FunnelPath,
  variant = "both",
}: {
  path?: FunnelPath;
  variant?: AuthorityVariant;
}) => {
  const { ref, visible } = useScrollReveal(0.08);
  const showTitle = variant === "title" || variant === "both";
  const showCredibility = variant === "credibility" || variant === "both";

  // When rendered as a single part we tighten the vertical padding so
  // the band doesn't leave an awkward gap above/below in splitting mode.
  const singlePart = variant !== "both";

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--cream, #FFFDF5)" }}
      >
        <ConstellationBackdrop />

        {/* Entrance spotlight — a single soft gold wash that sweeps
            through behind the card(s) on first view. Fires once, tied
            to the scroll-reveal. Adds life without overwhelming. */}
        <div
          aria-hidden="true"
          className={`authority-spotlight${visible ? " is-in" : ""}`}
        />

        {showTitle && (
          <div
            className={`relative px-5 ${singlePart ? "pt-12 sm:pt-14 pb-10 sm:pb-12" : "pt-14 sm:pt-16"} transition-all duration-[900ms] ease-out`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(14px)",
              transitionDelay: "0.05s",
              zIndex: 1,
            }}
          >
            <div
              className="max-w-[620px] mx-auto text-center authority-card"
              style={{
                background: "rgba(255, 253, 245, 0.94)",
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
                border: "1px solid rgba(196, 162, 101, 0.16)",
                borderRadius: 18,
                padding: "clamp(28px, 6vw, 44px) clamp(22px, 5vw, 40px)",
                boxShadow: "0 4px 32px rgba(0, 0, 0, 0.04)",
              }}
            >
              <IntroTitle path={path} />
            </div>
          </div>
        )}

        {showCredibility && (
          <div
            className={`relative px-5 ${singlePart ? "pt-12 sm:pt-14 pb-14 sm:pb-16" : "pt-8 pb-14 sm:pb-16"} transition-all duration-[900ms] ease-out`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(18px)",
              transitionDelay: "0.12s",
              zIndex: 1,
            }}
          >
            <div
              className="max-w-[560px] mx-auto authority-card"
              style={{
                background: "rgba(255, 253, 245, 0.92)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
                border: "1px solid rgba(196, 162, 101, 0.14)",
                borderRadius: 18,
                padding: "clamp(28px, 6vw, 48px) clamp(22px, 5vw, 40px)",
                boxShadow: "0 4px 36px rgba(0, 0, 0, 0.04)",
              }}
            >
              <VsopCredibility path={path} revealed={visible} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Soft gold spotlight behind the authority card(s) — fades in
           once when the section enters view, drifts quietly. Gives the
           backdrop a sense of depth without touching text legibility. */
        .authority-spotlight {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0;
          transition: opacity 1200ms ease-out;
          background:
            radial-gradient(circle at 30% 22%, rgba(196, 162, 101, 0.12) 0%, rgba(196, 162, 101, 0) 38%),
            radial-gradient(circle at 72% 78%, rgba(191, 82, 74, 0.06) 0%, rgba(191, 82, 74, 0) 40%);
        }
        .authority-spotlight.is-in {
          opacity: 1;
          animation: authorityDrift 22s ease-in-out 800ms infinite;
        }
        @keyframes authorityDrift {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50%      { transform: translate3d(-2%, 1%, 0); }
        }
        /* Gentle hover lift on the card — invites without being pushy */
        .authority-card {
          transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 480ms cubic-bezier(0.22, 1, 0.36, 1),
                      border-color 480ms ease;
        }
        @media (hover: hover) {
          .authority-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 42px rgba(20, 15, 8, 0.08);
            border-color: rgba(196, 162, 101, 0.32);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .authority-spotlight, .authority-spotlight.is-in {
            animation: none !important;
            transition: none !important;
          }
          .authority-card { transition: none !important; }
        }
      `}</style>
    </section>
  );
};

/* ── IntroTitle ──
 * The first big moment after the visitor picks a path. Two-line title
 * card, second line caught in rose, typed out character by character
 * once it enters the viewport so it lands like an opening shot rather
 * than appearing all at once. Width is reserved via an invisible full-
 * string placeholder so nothing jumps as characters arrive. A blinking
 * caret trails the typing cursor and fades 600ms after both lines
 * finish. Respects prefers-reduced-motion. */

const INTRO_COPY: Record<FunnelPath, { a: string; b: string }> = {
  new:      { a: "A new little soul",            b: "just walked into your orbit." },
  discover: { a: "Behind every little soul,",    b: "a cosmos." },
  memorial: { a: "No little soul",               b: "is ever forgotten by the stars." },
};

const TYPE_MS_PER_CHAR = 26;     // speed of keystrokes — snappy but still reads
const TYPE_PAUSE_MS    = 240;    // breath between line a and line b
// The IntroTitle sits inside AuthoritySection's card which fades in
// over 900ms from its own scroll observer. If we start typing inside
// that window the first characters are invisible behind the card's
// opacity transition. Lead-in must cover the card fade + a small
// breath so the first keystroke always lands on a fully-visible
// card. Memorial gets a touch longer to feel like a deliberate
// continuation of GriefSection's cadence.
const TYPE_LEAD_IN_MS  = 1100;
const TYPE_LEAD_IN_MEMORIAL_MS = 1400;
const TYPE_CARET_FADE  = 700;    // caret fade-out after final char

const IntroTitle = ({ path }: { path: FunnelPath }) => {
  const { a, b } = INTRO_COPY[path];
  const hostRef = useRef<HTMLHeadingElement>(null);
  const [inView, setInView] = useState(false);
  const [countA, setCountA] = useState(0);
  const [countB, setCountB] = useState(0);
  const [doneA, setDoneA] = useState(false);
  const [doneB, setDoneB] = useState(false);

  // Start typing when the title crosses into view — not at mount, so
  // readers who pick a pill without scrolling still see the reveal
  // when they get there.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setCountA(a.length); setDoneA(true);
      setCountB(b.length); setDoneB(true);
      return;
    }

    const handles: { leadIn?: number; ivA?: number; pause?: number; ivB?: number } = {};

    const leadIn = path === "memorial" ? TYPE_LEAD_IN_MEMORIAL_MS : TYPE_LEAD_IN_MS;
    handles.leadIn = window.setTimeout(() => {
      handles.ivA = window.setInterval(() => {
        setCountA((c) => {
          if (c >= a.length) {
            if (handles.ivA !== undefined) window.clearInterval(handles.ivA);
            setDoneA(true);
            handles.pause = window.setTimeout(() => {
              handles.ivB = window.setInterval(() => {
                setCountB((c2) => {
                  if (c2 >= b.length) {
                    if (handles.ivB !== undefined) window.clearInterval(handles.ivB);
                    setDoneB(true);
                    return c2;
                  }
                  return c2 + 1;
                });
              }, TYPE_MS_PER_CHAR);
            }, TYPE_PAUSE_MS);
            return c;
          }
          return c + 1;
        });
      }, TYPE_MS_PER_CHAR);
    }, leadIn);

    return () => {
      if (handles.leadIn !== undefined) window.clearTimeout(handles.leadIn);
      if (handles.pause !== undefined) window.clearTimeout(handles.pause);
      if (handles.ivA !== undefined) window.clearInterval(handles.ivA);
      if (handles.ivB !== undefined) window.clearInterval(handles.ivB);
    };
  }, [inView, a, b]);

  // Caret stays on the line currently being typed.
  const caretOn: "a" | "b" | "done" = !doneA ? "a" : !doneB ? "b" : "done";

  const lineStyle: React.CSSProperties = {
    position: "relative",
    display: "inline-block",
    whiteSpace: "nowrap",
  };
  const placeholderStyle: React.CSSProperties = {
    visibility: "hidden",
  };
  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
  };

  return (
    <h2
      ref={hostRef}
      className="product-reveal-intro"
      style={{
        fontFamily: '"DM Serif Display", Georgia, serif',
        fontSize: "clamp(1.75rem, 6.2vw, 2.5rem)",
        fontWeight: 400,
        fontStyle: "italic",
        color: "var(--black, #141210)",
        lineHeight: 1.22,
        letterSpacing: "-0.018em",
        margin: 0,
        maxWidth: 720,
        marginInline: "auto",
        textAlign: "center",
      }}
      aria-label={`${a} ${b}`}
    >
      {/* Line A — ink black */}
      <span style={lineStyle} aria-hidden="true">
        <span style={placeholderStyle}>{a}</span>
        <span style={overlayStyle}>
          {a.slice(0, countA)}
          {caretOn === "a" && (
            <span className={`intro-caret ${inView ? "is-typing" : ""}`}>|</span>
          )}
        </span>
      </span>
      <br />
      {/* Line B — rose, only revealed once Line A completes */}
      <span style={{ ...lineStyle, color: "var(--rose, #bf524a)" }} aria-hidden="true">
        <span style={placeholderStyle}>{b}</span>
        <span style={overlayStyle}>
          {b.slice(0, countB)}
          {caretOn === "b" && (
            <span className={`intro-caret is-typing is-rose`}>|</span>
          )}
          {caretOn === "done" && (
            <span className="intro-caret is-rose is-fading">|</span>
          )}
        </span>
      </span>

      {/* Gold hairline — strokes in once both lines are typed */}
      <span
        aria-hidden="true"
        className={`intro-rule ${doneB ? "is-in" : ""}`}
      />

      <style>{`
        .intro-caret {
          display: inline-block;
          margin-left: 2px;
          font-weight: 300;
          opacity: 0.7;
          color: inherit;
        }
        .intro-caret.is-typing {
          animation: introCaretBlink 850ms steps(2, end) infinite;
        }
        .intro-caret.is-fading {
          animation: introCaretOut ${TYPE_CARET_FADE}ms ease-out forwards;
        }
        @keyframes introCaretBlink {
          50% { opacity: 0; }
        }
        @keyframes introCaretOut {
          from { opacity: 0.7; }
          to   { opacity: 0; }
        }

        .intro-rule {
          display: block;
          height: 1px;
          width: 0;
          margin: 22px auto 0;
          background: var(--gold, #c4a265);
          opacity: 0;
          transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 600ms ease;
        }
        .intro-rule.is-in {
          width: 56px;
          opacity: 0.65;
        }

        @media (prefers-reduced-motion: reduce) {
          .intro-caret,
          .intro-caret.is-typing,
          .intro-caret.is-fading {
            animation: none !important;
            display: none !important;
          }
          .intro-rule {
            transition: none !important;
            width: 56px !important;
            opacity: 0.65 !important;
          }
        }
      `}</style>
    </h2>
  );
};

export const ProductReveal = ({ onCtaClick, ctaLabel, path = "discover", showBenefits = true, showAuthority = "both" }: ProductRevealProps) => {
  const { ref, visible } = useScrollReveal(0.08);
  const [chatStep, setChatStep] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          obs.disconnect();
          setChatStep(1);
          setTimeout(() => setChatStep(2), 600);
          setTimeout(() => setChatStep(3), 1400);
          setTimeout(() => setChatStep(4), 2100);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden">

      {/* ── Authority band (IntroTitle + VSOP credibility) ──
           `"both"` is the default (discover/new). Memorial passes
           `"title"` so the typed opener still lands above the cards
           but the VSOP credibility card is hoisted below the cards
           by FunnelV2 — keeping the emotional cadence intact. */}
      {showAuthority && <AuthoritySection path={path} variant={showAuthority} />}

      {/* ── Block 2: The Benefits ── cream band + hearts backdrop + cards ──
           Rendered only on the Discover route. New-pet / memorial / gift
           readers skip this and go straight to the sales cards below. */}
      {showBenefits && (
      <div
        className="relative overflow-hidden px-5 py-12 sm:py-16 md:py-20"
        style={{ background: "var(--cream, #FFFDF5)" }}
      >
        <HeartsBackdrop />

        <div className="relative max-w-[560px] mx-auto" style={{ zIndex: 1 }}>
          {/* Title — wrapped in its own cream card so the hearts don't cross it */}
          <div className={`flex justify-center mb-6 sm:mb-8 benefit-eyebrow ${visible ? "is-in" : ""}`}>
            <div
              style={{
                padding: "14px 28px",
                background: "rgba(255, 253, 245, 0.92)",
                border: "1px solid rgba(196, 162, 101, 0.16)",
                borderRadius: 14,
                boxShadow: "0 2px 18px rgba(0, 0, 0, 0.03)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
            >
              <h2
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.6rem, 5.6vw, 2rem)",
                  fontWeight: 400,
                  color: "var(--black, #141210)",
                  lineHeight: 1.18,
                  letterSpacing: "-0.02em",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {path === "new" ? (
                  <>Know Who You&rsquo;ve <em style={{ color: "var(--black, #141210)", fontWeight: 400 }}>Brought</em> Home</>
                ) : (
                  <>Once You <em style={{ color: "var(--black, #141210)", fontWeight: 400 }}>Understand</em> Them</>
                )}
              </h2>
            </div>
          </div>

          {/* Four benefit cards — 2x2 grid on desktop, stacked on mobile.
              Copy shifts per intent: new-pet readers see arrival-framed
              benefits ("from day one", "just brought home") while the
              discover path speaks to an established bond. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {(path === "new"
              ? [
                  { roman: "I",   text: "Know why they came to you." },
                  { roman: "II",  text: "Speak their love language from day one." },
                  { roman: "III", text: "Start with the bond already mapped." },
                  { roman: "IV",  text: "Hear what they already want you to know." },
                ]
              : [
                  { roman: "I",   text: "You'll understand why they chose you." },
                  { roman: "II",  text: "Speak their love language — fluently." },
                  { roman: "III", text: "Finally put into words the bond you've always felt." },
                  { roman: "IV",  text: "Hear what they can't say." },
                ]
            ).map((item, i) => (
              <div
                key={i}
                className={`benefit-row ${visible ? "is-in" : ""}`}
                style={{
                  animationDelay: `${0.15 + i * 0.1}s`,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "20px 24px",
                  // Glass fill — translucent cream with strong blur
                  background: "rgba(255, 253, 245, 0.78)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(196, 162, 101, 0.22)",
                  borderRadius: 14,
                  // Layered shadow — soft drop + tiny inner highlight at top
                  boxShadow: [
                    "0 4px 24px rgba(0, 0, 0, 0.04)",
                    "0 1px 2px rgba(196, 162, 101, 0.08)",
                    "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                  ].join(", "),
                  overflow: "hidden",
                }}
              >
                {/* Gold inner-glow sheen at the top edge */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "40%",
                    background: "linear-gradient(180deg, rgba(212, 178, 107, 0.14) 0%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />

                <span
                  aria-hidden="true"
                  style={{
                    position: "relative",
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontStyle: "italic",
                    fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
                    letterSpacing: "0.08em",
                    width: 28,
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #d4b26b, #c4a265)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textAlign: "left",
                  }}
                >
                  {item.roman}.
                </span>

                <p
                  style={{
                    position: "relative",
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "clamp(1.02rem, 3.8vw, 1.2rem)",
                    color: "var(--ink, #1f1c18)",
                    lineHeight: 1.35,
                    letterSpacing: "-0.01em",
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CSS-only reveals — opacity only on benefit-row so the inline tilt transform isn't overwritten */}
        <style>{`
          .benefit-eyebrow {
            opacity: 0;
            transform: translateY(10px);
            will-change: opacity, transform;
          }
          .benefit-eyebrow.is-in {
            animation: benefitEyebrowReveal 800ms cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
          }

          .benefit-row {
            opacity: 0;
            will-change: opacity;
          }
          .benefit-row.is-in {
            animation: benefitRowReveal 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes benefitEyebrowReveal {
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes benefitRowReveal {
            to { opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            .benefit-eyebrow, .benefit-row {
              animation: none !important;
              opacity: 1 !important;
            }
          }
        `}</style>
      </div>
      )}

      {/* ── SoulSpeak section removed — moved into pricing card tap-to-expand preview ── */}
      {false && (
      <div
        className="px-5 py-14 sm:py-18 transition-all duration-[1200ms] ease-out"
        style={{
          background: "linear-gradient(180deg, #f0e8da 0%, #ede4d4 50%, #f0e8da 100%)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "0.25s",
        }}
      >
        <div className="max-w-[520px] mx-auto">
          <div className="text-center mb-6">
            {/* SoulSpeak badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(191,82,74,0.06)",
                border: "1px solid rgba(191,82,74,0.12)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H13l-3.8 3.4V16H6.5A2.5 2.5 0 014 13.5v-7z" />
              </svg>
              <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rose, #bf524a)" }}>
                SoulSpeak — Included
              </span>
            </div>

            <h3
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.3rem, 5.5vw, 1.7rem)",
                color: "var(--ink, #1f1c18)",
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              Have the conversation you've
              <br />
              <em style={{ color: "var(--rose, #bf524a)" }}>always wished you could have</em>
            </h3>
            <p
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.6,
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              Ask them anything — why they do
              the weird things they do, how they feel about you, what they
              need.
            </p>
          </div>

          {/* Chat demo */}
          <div
            ref={chatRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div className="px-5 py-5 sm:px-6 space-y-3">
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 1 ? 1 : 0, transform: chatStep >= 1 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem" }}>
                    Why do you always steal my socks?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 2 ? 1 : 0, transform: chatStep >= 2 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    Because they smell like you. And when you leave,
                    that's the closest thing I have to you being here.
                  </p>
                </div>
              </div>
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 3 ? 1 : 0, transform: chatStep >= 3 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem" }}>
                    Do you know how much I love you?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 4 ? 1 : 0, transform: chatStep >= 4 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    I knew before you did.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ProductReveal CTA removed — the main checkout CTA lives in InlineCheckout below. */}
    </section>
  );
};
