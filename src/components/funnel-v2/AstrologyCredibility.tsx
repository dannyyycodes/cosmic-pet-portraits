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

export const AstrologyCredibility = () => {
  const { ref, visible } = useScrollReveal(0.15);

  return (
    <section
      ref={ref}
      className="relative py-10 sm:py-14 md:py-20 px-5 overflow-hidden"
      style={{ background: "var(--cream, #FFFDF5)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <p
          className="text-center mb-2 transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontWeight: 600,
            fontSize: "0.78rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--earth, #6e6259)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
          }}
        >
          Real Astronomy. Not Guesswork.
        </p>
        <h2
          className="text-center mb-5 transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.4rem, 5.5vw, 2rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.08s",
          }}
        >
          The Same Sky That Shaped You
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>Shaped Them Too.</em>
        </h2>
        <p
          className="text-center mb-10 transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(0.95rem, 3.3vw, 1.08rem)",
            color: "var(--earth, #6e6259)",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.6,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.12s",
          }}
        >
          Every reading is calculated from the exact planetary positions at the
          moment they were born — using VSOP87, the same mathematical model
          professional astronomers use to map the real night sky.
        </p>

        {/* Credibility points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {[
            {
              label: "Real Planetary Positions",
              desc: "Calculated to the minute they were born. The same math that tracks the actual night sky.",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ),
            },
            {
              label: "13 Celestial Bodies",
              desc: "Every planet from Sun to Pluto, plus Chiron, the North Node, and Lilith — their full cosmic fingerprint.",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
                </svg>
              ),
            },
            {
              label: "Where They Arrived",
              desc: "Their birth location sets their rising sign. Where they came into this world shaped who they became.",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(15px)",
                transitionDelay: `${0.2 + i * 0.08}s`,
              }}
            >
              <div
                className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ background: "var(--gold-soft, rgba(196,162,101,0.15))", color: "var(--gold, #c4a265)" }}
              >
                {item.icon}
              </div>
              <h3
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "0.88rem",
                  color: "var(--ink, #1f1c18)",
                  marginBottom: 4,
                }}
              >
                {item.label}
              </h3>
              <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--muted, #958779)", lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Planet pills with glyphs */}
        <div
          className="flex flex-wrap justify-center gap-2 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transitionDelay: "0.5s",
          }}
        >
          {PLANETS.map((p) => (
            <span
              key={p.name}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--earth, #6e6259)",
                background: "var(--cream2, #faf4e8)",
                border: "1px solid var(--cream3, #f3eadb)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontFamily:
                    '"DejaVu Sans", "Noto Sans Symbols", "Noto Sans Symbols 2", "Apple Symbols", "Segoe UI Symbol", system-ui, sans-serif',
                  fontSize: "0.95rem",
                  lineHeight: 1,
                  color: "var(--rose, #bf524a)",
                  fontVariantEmoji: "text" as never,
                }}
              >
                {p.symbol}
              </span>
              {p.name}
            </span>
          ))}
        </div>

        <p
          className="text-center mt-7 transition-all duration-1000"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontStyle: "italic",
            fontSize: "clamp(0.95rem, 3.2vw, 1.05rem)",
            color: "var(--deep, #2e2a24)",
            opacity: visible ? 1 : 0,
            transitionDelay: "0.6s",
            lineHeight: 1.5,
          }}
        >
          No two souls. No two skies.
          <br />
          <span style={{ color: "var(--rose, #bf524a)" }}>No two readings ever the same.</span>
        </p>
      </div>
    </section>
  );
};
