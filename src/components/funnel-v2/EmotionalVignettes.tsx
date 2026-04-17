import { useEffect, useRef, useState } from "react";

const BEATS: string[] = [
  "For the ones just arrived.",
  "For the ones who are everything.",
  "For the ones you miss.",
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
      { threshold: 0.35, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`emotional-triad ${visible ? "is-in" : ""}`}
      style={{ padding: "clamp(16px, 3vw, 24px) 4px" }}
    >
      <div
        className="flex flex-wrap items-center justify-center"
        style={{
          gap: "clamp(10px, 2vw, 16px)",
          maxWidth: 820,
          margin: "0 auto",
        }}
      >
        {BEATS.map((beat, i) => (
          <span
            key={i}
            className="triad-pill"
            style={{
              animationDelay: `${i * 180}ms`,
              fontFamily: '"Caveat", cursive',
              fontSize: "clamp(1.25rem, 4vw, 1.6rem)",
              fontWeight: 500,
              color: "var(--black, #141210)",
              lineHeight: 1.1,
              letterSpacing: "0.005em",
              background: "rgba(255, 253, 245, 0.85)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(196, 162, 101, 0.32)",
              borderRadius: 9999,
              padding:
                "clamp(10px, 1.8vw, 14px) clamp(18px, 3.2vw, 26px)",
              boxShadow:
                "0 4px 18px rgba(20,15,8,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
              transition:
                "transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms ease, border-color 320ms ease",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {beat}
          </span>
        ))}
      </div>

      <style>{`
        .triad-pill {
          opacity: 0;
          transform: translateY(10px);
          will-change: opacity, transform;
        }
        .emotional-triad.is-in .triad-pill {
          animation: triadPillIn 760ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes triadPillIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (hover: hover) {
          .triad-pill:hover {
            transform: translateY(-2px);
            box-shadow:
              0 10px 28px rgba(196,162,101,0.18),
              inset 0 1px 0 rgba(255,255,255,0.75);
            border-color: rgba(196,162,101,0.55);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .triad-pill {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
