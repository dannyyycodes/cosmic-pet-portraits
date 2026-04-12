import { useEffect, useRef, useState } from "react";
import { Star, Sparkle, Sparkles } from "lucide-react";

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

// Subtle scattered stars across the whole section. All small, all faint,
// all behind the text. A handful of short faint lines link triplets so it
// reads as a night sky with mini-constellations rather than random dots.
const CONSTELLATION_STARS: StarDef[] = [
  { x: 6,  y: 8,  kind: "dust",  delay: 0.1 },
  { x: 18, y: 14, kind: "small", delay: 0.6 },
  { x: 28, y: 6,  kind: "dust",  delay: 1.1 },
  { x: 42, y: 12, kind: "small", delay: 1.6 },
  { x: 55, y: 7,  kind: "dust",  delay: 2.1 },
  { x: 68, y: 14, kind: "small", delay: 2.6 },
  { x: 82, y: 6,  kind: "dust",  delay: 3.1 },
  { x: 94, y: 12, kind: "small", delay: 3.6 },

  { x: 4,  y: 34, kind: "small", delay: 0.3 },
  { x: 26, y: 38, kind: "dust",  delay: 0.8 },
  { x: 52, y: 34, kind: "dust",  delay: 1.3 },
  { x: 78, y: 38, kind: "small", delay: 1.8 },
  { x: 96, y: 32, kind: "dust",  delay: 2.3 },

  { x: 8,  y: 58, kind: "dust",  delay: 0.5 },
  { x: 36, y: 62, kind: "small", delay: 1.0 },
  { x: 62, y: 58, kind: "dust",  delay: 1.5 },
  { x: 88, y: 62, kind: "small", delay: 2.0 },

  { x: 5,  y: 82, kind: "small", delay: 0.7 },
  { x: 20, y: 88, kind: "dust",  delay: 1.2 },
  { x: 36, y: 84, kind: "dust",  delay: 1.7 },
  { x: 50, y: 90, kind: "small", delay: 2.2 },
  { x: 66, y: 86, kind: "dust",  delay: 2.7 },
  { x: 80, y: 92, kind: "dust",  delay: 3.2 },
  { x: 94, y: 86, kind: "small", delay: 3.7 },
];

// A handful of short faint lines linking nearby triplets — just enough to
// read as "connected sky", never as a strong graphic.
const CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2],       // top-left triplet
  [4, 5], [5, 6],       // top-mid-right triplet
  [13, 14], [14, 15],   // lower-mid triplet
  [17, 18], [18, 19],   // bottom-left triplet
  [20, 21], [21, 22],   // bottom-right triplet
];

// Only "small" and "dust" are used now — kept the full map for type safety.
const STAR_SIZES: Record<StarKind, number> = {
  bright: 12,
  mid: 9,
  small: 7,
  dust: 4,
};

// Very low — stars should feel like atmosphere, not ornament.
const STAR_OPACITIES: Record<StarKind, number> = {
  bright: 0.22,
  mid: 0.2,
  small: 0.2,
  dust: 0.14,
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
          <stop offset="0%" stopColor="#c4a265" stopOpacity="0.04" />
          <stop offset="50%" stopColor="#c4a265" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#c4a265" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <g stroke="url(#constLine)" strokeWidth="0.05" fill="none" vectorEffect="non-scaling-stroke">
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
const VsopCredibility = () => (
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
      {/* Section title — bold black */}
      <p
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.25rem, 5vw, 1.6rem)",
          fontWeight: 400,
          color: "var(--black, #141210)",
          letterSpacing: "-0.01em",
          marginBottom: 16,
        }}
      >
        Real Astronomy. Not Guesswork.
      </p>
      <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "clamp(0.92rem, 3.2vw, 1rem)", color: "var(--earth, #6e6259)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 28px" }}>
        Using{" "}
        <span style={{ color: "var(--gold, #c4a265)", fontWeight: 700, letterSpacing: "0.03em" }}>VSOP87</span>
        {" — the same planetary model used by "}
        <span style={{ color: "var(--ink, #1f1c18)", fontWeight: 700 }}>NASA</span>
        {" and professional observatories worldwide."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {[
          {
            h: "Not a personality quiz. Real coordinates.",
            d: "13 celestial bodies, rising sign, elemental balance, and house placements — all calculated to the exact minute.",
          },
          {
            h: "Accurate to a fraction of a degree.",
            d: "Their reading comes from real planetary math, not generic horoscope predictions.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="relative rounded-xl py-5 px-5 text-left"
            style={{
              background: "linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)",
              border: "1px solid rgba(196,162,101,0.28)",
              boxShadow: "0 2px 16px rgba(196,162,101,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
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
      <div className="flex flex-wrap justify-center gap-1.5 mb-8">
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
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
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
      @media (prefers-reduced-motion: reduce) {
        .vsop-orbit, .vsop-diamond, .vsop-glyph-pill { animation: none !important; }
      }
    `}</style>
  </div>
);

interface ProductRevealProps {
  onCtaClick: () => void;
  ctaLabel: string;
}

export const ProductReveal = ({ onCtaClick, ctaLabel }: ProductRevealProps) => {
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

      {/* ── Cosmic band: quote + authority share the constellation backdrop ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--cream, #FFFDF5)" }}
      >
        <ConstellationBackdrop />

        {/* Quote half */}
        <div
          className="relative px-5 py-16 sm:py-20 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.1s",
            zIndex: 1,
          }}
        >
          <div className="max-w-[620px] mx-auto">
            <h2
              className="text-center"
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.55rem, 6.2vw, 2.2rem)",
                fontWeight: 400,
                color: "var(--black, #141210)",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              They Give Us Everything.
              <br />
              <em style={{ fontWeight: 400 }}>
                It&apos;s Time We Understood Them in Return.
              </em>
            </h2>
          </div>
        </div>

        {/* Authority half */}
        <div
          className="relative px-5 py-14 sm:py-20 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.15s",
            zIndex: 1,
          }}
        >
          <div className="max-w-[560px] mx-auto">
            <VsopCredibility />
          </div>
        </div>
      </div>

      {/* ── Block 2: The Benefits ── grey band, alternates with cream neighbours ── */}
      <div
        className="relative px-5 py-12 sm:py-16 md:py-20"
        style={{
          background: "#faf6ec",
        }}
      >
        <div className="relative max-w-[560px] mx-auto">
          {/* Title only — no eyebrow, no subline, no flourish */}
          <div className={`text-center mb-10 sm:mb-12 benefit-eyebrow ${visible ? "is-in" : ""}`}>
            <h2
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 5.6vw, 2rem)",
                fontWeight: 400,
                color: "var(--black, #141210)",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              After <em style={{ color: "var(--rose, #bf524a)", fontWeight: 400 }}>Their</em> Reading
            </h2>
          </div>

          {/* Four benefit rows — left-aligned list, gold hairlines between */}
          <ol
            className="flex flex-col"
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              borderTop: "1px solid rgba(196,162,101,0.25)",
            }}
          >
            {[
              { roman: "I", text: "You'll understand why they chose you." },
              { roman: "II", text: "Speak their love language — fluently." },
              { roman: "III", text: "Finally put into words the bond you've always felt." },
              { roman: "IV", text: "Read their needs before they show them." },
            ].map((item, i) => (
              <li
                key={i}
                className={`benefit-row ${visible ? "is-in" : ""}`}
                style={{
                  animationDelay: `${0.15 + i * 0.1}s`,
                  display: "flex",
                  alignItems: "baseline",
                  gap: "14px",
                  padding: "18px 0",
                  borderBottom: "1px solid rgba(196,162,101,0.25)",
                }}
              >
                {/* Roman numeral — gold italic, fixed width for alignment */}
                <span
                  aria-hidden="true"
                  style={{
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

                {/* Statement */}
                <p
                  style={{
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
              </li>
            ))}
          </ol>
        </div>

        {/* CSS-only reveals */}
        <style>{`
          .benefit-eyebrow, .benefit-row {
            opacity: 0;
            transform: translateY(10px);
            will-change: opacity, transform;
          }
          .benefit-eyebrow.is-in {
            animation: benefitReveal 800ms cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
          }
          .benefit-row.is-in {
            animation: benefitReveal 800ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes benefitReveal {
            to { opacity: 1; transform: translateY(0); }
          }

          @media (prefers-reduced-motion: reduce) {
            .benefit-eyebrow, .benefit-row {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
        `}</style>
      </div>

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
