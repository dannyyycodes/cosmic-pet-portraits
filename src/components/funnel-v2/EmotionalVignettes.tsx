import { useEffect, useRef, useState } from "react";

const BEATS: string[] = [
  "For the ones just arrived.",
  "For the ones who are everything.",
  "For the ones you miss.",
];

const Fleuron = () => (
  <svg
    aria-hidden="true"
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    style={{ display: "block", margin: "0 auto" }}
  >
    <path
      d="M7 0.5L8.6 5.4L13.5 7L8.6 8.6L7 13.5L5.4 8.6L0.5 7L5.4 5.4z"
      fill="var(--gold, #c4a265)"
      opacity="0.55"
    />
  </svg>
);

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
      style={{ padding: "clamp(14px, 3vw, 22px) 4px" }}
    >
      <div
        className="triad-card"
        style={{
          maxWidth: 620,
          margin: "0 auto",
          background: "rgba(255, 253, 245, 0.82)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(196, 162, 101, 0.26)",
          borderRadius: 22,
          padding: "clamp(30px, 6vw, 52px) clamp(24px, 5vw, 46px)",
          boxShadow:
            "0 8px 32px rgba(20,15,8,0.05), inset 0 1px 0 rgba(255,255,255,0.75)",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Subtle top-edge gold sheen */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(196,162,101,0.55) 50%, transparent 100%)",
            opacity: 0.7,
          }}
        />

        {BEATS.map((beat, i) => (
          <div key={i}>
            <p
              className="triad-beat"
              style={{
                animationDelay: `${i * 220}ms`,
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: "clamp(1.18rem, 4.4vw, 1.65rem)",
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--black, #141210)",
                lineHeight: 1.3,
                letterSpacing: "-0.012em",
                margin: 0,
              }}
            >
              {beat}
            </p>
            {i < BEATS.length - 1 && (
              <div
                className="triad-fleuron"
                style={{
                  animationDelay: `${i * 220 + 110}ms`,
                  padding: "clamp(14px, 2.4vw, 20px) 0",
                }}
              >
                <Fleuron />
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .triad-beat,
        .triad-fleuron {
          opacity: 0;
          transform: translateY(8px);
          will-change: opacity, transform;
        }
        .emotional-triad.is-in .triad-beat,
        .emotional-triad.is-in .triad-fleuron {
          animation: triadBeatIn 780ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes triadBeatIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .triad-beat,
          .triad-fleuron {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
