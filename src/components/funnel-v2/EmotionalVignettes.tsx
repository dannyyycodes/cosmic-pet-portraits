import { useEffect, useRef, useState } from "react";

/**
 * Three-beat identity line that replaces the old 7-card deck.
 * Rule-of-three rhythm covers beginning / middle / end of a life together
 * without taking up card real estate. Each beat fades in 180ms after the
 * last so the triadic structure lands as a rhythmic reveal, not a block.
 */
const BEATS: Array<{ lead: string; accent: string }> = [
  { lead: "For the ones", accent: "just arrived." },
  { lead: "For the ones who are", accent: "everything." },
  { lead: "For the ones", accent: "you miss." },
];

export const EmotionalVignettes = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.4, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`emotional-triad ${visible ? "is-in" : ""} text-center`}
      style={{ padding: "clamp(18px, 4vw, 28px) 8px" }}
    >
      <p
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.2rem, 4.6vw, 1.75rem)",
          fontWeight: 400,
          fontStyle: "italic",
          color: "var(--black, #141210)",
          lineHeight: 1.35,
          letterSpacing: "-0.015em",
          maxWidth: 780,
          margin: "0 auto",
        }}
      >
        {BEATS.map((b, i) => (
          <span
            key={i}
            className="triad-beat"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            {b.lead}{" "}
            <em style={{ color: "var(--rose, #bf524a)", fontStyle: "italic" }}>
              {b.accent}
            </em>
            {i < BEATS.length - 1 && (
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  margin: "0 0.5em",
                  color: "var(--gold, #c4a265)",
                  opacity: 0.55,
                }}
              >
                ·
              </span>
            )}{" "}
          </span>
        ))}
      </p>

      <style>{`
        .triad-beat {
          opacity: 0;
          transform: translateY(8px);
          display: inline;
          will-change: opacity, transform;
        }
        .emotional-triad.is-in .triad-beat {
          animation: triadBeatIn 720ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes triadBeatIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .triad-beat {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
