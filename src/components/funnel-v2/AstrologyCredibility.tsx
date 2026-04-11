import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/**
 * Astrological glyphs as unicode + VS15 text-variation selector
 * (forces text rendering so iOS doesn't turn them into color emoji).
 */
const PLANETS: { name: string; symbol: string }[] = [
  { name: "Sun", symbol: "\u2609\uFE0E" },
  { name: "Moon", symbol: "\u263D\uFE0E" },
  { name: "Mercury", symbol: "\u263F\uFE0E" },
  { name: "Venus", symbol: "\u2640\uFE0E" },
  { name: "Mars", symbol: "\u2642\uFE0E" },
  { name: "Jupiter", symbol: "\u2643\uFE0E" },
  { name: "Saturn", symbol: "\u2644\uFE0E" },
  { name: "Uranus", symbol: "\u2645\uFE0E" },
  { name: "Neptune", symbol: "\u2646\uFE0E" },
  { name: "Pluto", symbol: "\u2647\uFE0E" },
  { name: "Chiron", symbol: "\u26B7\uFE0E" },
  { name: "North Node", symbol: "\u260A\uFE0E" },
  { name: "Lilith", symbol: "\u26B8\uFE0E" },
];

/* Subtle star field — scattered dots */
const StarField = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    viewBox="0 0 800 600"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    {/* Constellation lines */}
    <g stroke="rgba(196,162,101,0.12)" strokeWidth="0.7" fill="none">
      <line x1="100" y1="80" x2="170" y2="120" />
      <line x1="170" y1="120" x2="220" y2="90" />
      <line x1="220" y1="90" x2="280" y2="130" />
      <line x1="600" y1="70" x2="660" y2="110" />
      <line x1="660" y1="110" x2="720" y2="80" />
      <line x1="660" y1="110" x2="680" y2="170" />
      <line x1="150" y1="450" x2="220" y2="490" />
      <line x1="220" y1="490" x2="290" y2="460" />
      <line x1="550" y1="480" x2="620" y2="510" />
      <line x1="620" y1="510" x2="670" y2="480" />
    </g>
    {/* Star dots */}
    {[
      [100, 80, 1.8], [170, 120, 2.2], [220, 90, 1.5], [280, 130, 1.8],
      [600, 70, 2], [660, 110, 2.5], [720, 80, 1.5], [680, 170, 2],
      [150, 450, 1.8], [220, 490, 2], [290, 460, 1.5],
      [550, 480, 1.8], [620, 510, 2.2], [670, 480, 1.5],
      [50, 250, 1.2], [400, 50, 1.4], [750, 300, 1.3], [380, 350, 1.1],
      [80, 400, 1.2], [500, 200, 1.3], [700, 400, 1.2], [250, 300, 1.1],
      [450, 520, 1.3], [350, 150, 1.2], [100, 550, 1.4], [650, 350, 1.1],
    ].map(([cx, cy, r], i) => (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="rgba(196,162,101,0.5)"
        style={{
          animation: `astroTwinkle ${3 + (i % 4)}s ease-in-out ${i * 0.2}s infinite`,
        }}
      />
    ))}
  </svg>
);

export const AstrologyCredibility = () => {
  const { ref, visible } = useScrollReveal(0.15);

  return (
    <section
      ref={ref}
      className="relative py-14 sm:py-20 md:py-28 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(175deg, #1a1a2e 0%, #16213e 40%, #0f1829 100%)",
      }}
    >
      <StarField />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Institutional badge */}
        <div
          className="text-center mb-6 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
          }}
        >
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full"
            style={{
              background: "rgba(196,162,101,0.08)",
              border: "1px solid rgba(196,162,101,0.2)",
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="rgba(196,162,101,0.9)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(196,162,101,0.9)",
              }}
            >
              Powered by VSOP87 — the model used by professional astronomers
            </span>
          </div>
        </div>

        {/* Header */}
        <p
          className="text-center mb-3 transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontWeight: 600,
            fontSize: "0.82rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(196,162,101,0.7)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.05s",
          }}
        >
          Real Astronomy. Not Guesswork.
        </p>
        <h2
          className="text-center mb-5 transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.6rem, 6vw, 2.4rem)",
            fontWeight: 400,
            color: "#fff",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.1s",
          }}
        >
          The Same Sky That Shaped You
          <br />
          <em style={{ color: "rgba(196,162,101,0.9)" }}>Shaped Them Too.</em>
        </h2>
        <p
          className="text-center mb-12 transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 3.5vw, 1.15rem)",
            color: "rgba(255,255,255,0.55)",
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.6,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.15s",
          }}
        >
          Every reading is calculated from the exact planetary positions at
          the moment they were born, using VSOP87, the same mathematical model
          professional astronomers use to map the real night sky.
        </p>

        {/* Credibility cards — gold-bordered on dark */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              label: "Real Planetary Positions",
              desc: "Calculated to the minute they were born. The same math that tracks the actual night sky.",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ),
            },
            {
              label: "13 Celestial Bodies",
              desc: "Sun through Pluto, plus Chiron, the North Node, and Lilith. Their full cosmic fingerprint.",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="3" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="21" />
                  <line x1="3" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="21" y2="12" />
                </svg>
              ),
            },
            {
              label: "Birth Location Matters",
              desc: "Where they came into this world sets their rising sign and shapes who they became.",
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              ),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="text-center rounded-xl p-5 transition-all duration-[1000ms] ease-out"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(196,162,101,0.2)",
                boxShadow: "0 2px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(196,162,101,0.08)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(15px)",
                transitionDelay: `${0.25 + i * 0.1}s`,
              }}
            >
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(196,162,101,0.1)",
                  border: "1px solid rgba(196,162,101,0.2)",
                  color: "rgba(196,162,101,0.9)",
                }}
              >
                {item.icon}
              </div>
              <h3
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "0.92rem",
                  color: "#fff",
                  marginBottom: 6,
                }}
              >
                {item.label}
              </h3>
              <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.84rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Planet pills with glyphs — glowing on dark */}
        <div
          className="flex flex-wrap justify-center gap-2 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transitionDelay: "0.55s",
          }}
        >
          {PLANETS.map((p) => (
            <span
              key={p.name}
              className="astro-pill inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.65)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(196,162,101,0.15)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily:
                    '"DejaVu Sans", "Noto Sans Symbols", "Noto Sans Symbols 2", "Apple Symbols", "Segoe UI Symbol", system-ui, sans-serif',
                  fontSize: "0.95rem",
                  lineHeight: 1,
                  color: "rgba(196,162,101,0.85)",
                  fontVariantEmoji: "text" as never,
                }}
              >
                {p.symbol}
              </span>
              {p.name}
            </span>
          ))}
        </div>

        {/* Closing line — more visual weight */}
        <div
          className="text-center mt-10 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: "0.65s",
          }}
        >
          {/* Gold rule */}
          <div
            className="mx-auto mb-6"
            style={{
              width: visible ? 80 : 0,
              height: 1,
              background: "rgba(196,162,101,0.4)",
              transition: "width 1s ease 0.7s",
            }}
          />
          <p
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.1rem, 3.8vw, 1.3rem)",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
            }}
          >
            No two souls. No two skies.
            <br />
            <span style={{ color: "rgba(196,162,101,0.9)" }}>No two readings ever the same.</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes astroTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.7; }
        }
        .astro-pill {
          transition: all 0.25s ease;
        }
        .astro-pill:hover {
          background: rgba(196,162,101,0.1);
          border-color: rgba(196,162,101,0.35);
          color: rgba(255,255,255,0.9);
        }
      `}</style>
    </section>
  );
};
