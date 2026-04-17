import { useEffect, useRef, useState } from "react";

/* Subtle dove wallpaper — scattered realistic peace-dove silhouettes.
 * Positions chosen by hand so the pattern feels drifted, not tiled. Low
 * opacity so it reads as atmosphere rather than decoration. */
type Dove = { x: number; y: number; size: number; rot: number; opacity: number; delay: number };

const DOVES: Dove[] = [
  { x: 6,  y: 8,  size: 44, rot: -6, opacity: 0.22, delay: 0.0 },
  { x: 22, y: 14, size: 34, rot: 3,  opacity: 0.18, delay: 0.6 },
  { x: 42, y: 6,  size: 48, rot: -2, opacity: 0.24, delay: 1.2 },
  { x: 62, y: 12, size: 36, rot: 5,  opacity: 0.18, delay: 1.8 },
  { x: 82, y: 8,  size: 42, rot: -4, opacity: 0.22, delay: 2.4 },
  { x: 14, y: 32, size: 40, rot: 2,  opacity: 0.20, delay: 0.3 },
  { x: 36, y: 38, size: 50, rot: -5, opacity: 0.26, delay: 0.9 },
  { x: 58, y: 34, size: 34, rot: 4,  opacity: 0.18, delay: 1.5 },
  { x: 78, y: 40, size: 42, rot: -3, opacity: 0.22, delay: 2.1 },
  { x: 4,  y: 58, size: 36, rot: 3,  opacity: 0.20, delay: 0.4 },
  { x: 28, y: 62, size: 44, rot: -6, opacity: 0.22, delay: 1.0 },
  { x: 50, y: 58, size: 32, rot: 2,  opacity: 0.18, delay: 1.6 },
  { x: 72, y: 64, size: 46, rot: -2, opacity: 0.24, delay: 2.2 },
  { x: 90, y: 60, size: 30, rot: 5,  opacity: 0.16, delay: 2.8 },
  { x: 12, y: 82, size: 42, rot: -4, opacity: 0.22, delay: 0.5 },
  { x: 34, y: 88, size: 34, rot: 3,  opacity: 0.18, delay: 1.1 },
  { x: 56, y: 84, size: 44, rot: -5, opacity: 0.22, delay: 1.7 },
  { x: 78, y: 90, size: 36, rot: 2,  opacity: 0.20, delay: 2.3 },
  { x: 92, y: 82, size: 30, rot: -3, opacity: 0.16, delay: 2.9 },
];

/* Realistic flying dove silhouette — classic peace-dove shape viewed from
 * above, wings spread wide, small head & body, forked tail. Filled so it
 * reads as a recognizable dove at small sizes (not just an abstract arc). */
const DOVE_PATH =
  "M32 2 C30 2 28 4 27 6 C26 8 24 10 22 10 L8 6 C5 5 3 8 5 11 L20 16 L5 21 C3 24 5 27 8 26 L22 22 C24 22 26 24 27 26 C28 28 30 30 32 30 C34 30 36 28 37 26 C38 24 40 22 42 22 L56 26 C59 27 61 24 59 21 L44 16 L59 11 C61 8 59 5 56 6 L42 10 C40 10 38 8 37 6 C36 4 34 2 32 2 Z";

const DoveWallpaper = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none"
    style={{ zIndex: 0 }}
  >
    {DOVES.map((d, i) => (
      <svg
        key={i}
        className="grief-dove"
        viewBox="0 0 64 32"
        style={{
          position: "absolute",
          left: `${d.x}%`,
          top: `${d.y}%`,
          width: d.size,
          height: d.size * 0.5,
          transform: `translate(-50%, -50%) rotate(${d.rot}deg)`,
          opacity: d.opacity,
          animationDelay: `${d.delay}s`,
        }}
      >
        <path d={DOVE_PATH} fill="#8a847d" />
      </svg>
    ))}
  </div>
);

interface GriefSectionProps {
  onCtaClick?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GriefSection = ({ onCtaClick: _onCtaClick }: GriefSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const BEATS = [
    "For when you need to feel them close again.",
    "Always there, for when you need them.",
  ];

  return (
    <div
      ref={ref}
      className={`grief-section relative overflow-hidden ${visible ? "is-in" : ""}`}
      style={{
        background: "var(--cream, #FFFDF5)",
        padding: "clamp(56px, 10vw, 96px) 20px",
      }}
    >
      <DoveWallpaper />

      <div
        className="relative max-w-[540px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Title — wrapped in a cream-glass card so the dove wallpaper
            doesn't cross behind the letterforms (matches the pattern
            used by "Once You Understand Them" above). */}
        <div className="grief-title flex justify-center" style={{ marginBottom: 18 }}>
          <div
            style={{
              padding: "16px 30px",
              background: "rgba(255, 253, 245, 0.94)",
              border: "1px solid rgba(196, 162, 101, 0.18)",
              borderRadius: 14,
              boxShadow: "0 2px 20px rgba(20,15,8,0.04)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          >
            <h2
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.55rem, 5.2vw, 2.1rem)",
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--black, #141210)",
                lineHeight: 1.18,
                letterSpacing: "-0.02em",
                margin: 0,
                textAlign: "center",
              }}
            >
              If you've already had to say goodbye.
            </h2>
          </div>
        </div>

        {/* Sub — wrapped in its own small cream-glass card so the dove
            wallpaper doesn't cross behind the letterforms. */}
        <div
          className="grief-sub flex justify-center"
          style={{ marginBottom: "clamp(32px, 5.5vw, 44px)" }}
        >
          <div
            style={{
              padding: "12px 22px",
              background: "rgba(255, 253, 245, 0.9)",
              border: "1px solid rgba(196, 162, 101, 0.14)",
              borderRadius: 12,
              boxShadow: "0 1px 14px rgba(20,15,8,0.03)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              maxWidth: 440,
            }}
          >
            <p
              style={{
                fontFamily: '"Cormorant", Georgia, serif',
                fontSize: "clamp(1rem, 3.2vw, 1.15rem)",
                fontStyle: "italic",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.55,
                margin: 0,
                textAlign: "center",
              }}
            >
              Their reading becomes something to keep close. Something to
              return to, every time you need them.
            </p>
          </div>
        </div>

        {/* Compact benefit cards — roomier than the sub card but tighter
            than the previous hero-sized version. Fleuron pendant removed. */}
        <div
          className="grief-beats"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(12px, 2.2vw, 18px)",
            marginBottom: "clamp(32px, 5vw, 44px)",
          }}
        >
          {BEATS.map((line, i) => (
            <div
              key={i}
              className="grief-beat"
              style={{
                position: "relative",
                padding: "clamp(18px, 3vw, 24px) clamp(18px, 3.5vw, 26px)",
                background:
                  "linear-gradient(180deg, rgba(255,253,245,0.92) 0%, rgba(250,244,232,0.9) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(196, 162, 101, 0.32)",
                borderRadius: 14,
                boxShadow: [
                  "0 6px 22px rgba(20,15,8,0.05)",
                  "0 1px 4px rgba(196,162,101,0.06)",
                  "inset 0 1px 0 rgba(255,255,255,0.7)",
                ].join(", "),
              }}
            >
              <p
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.02rem, 3.2vw, 1.2rem)",
                  fontStyle: "italic",
                  color: "var(--ink, #1f1c18)",
                  lineHeight: 1.35,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {line}
              </p>

              {/* Soft gold hairline below text */}
              <svg
                aria-hidden="true"
                width="42"
                height="5"
                viewBox="0 0 54 6"
                style={{ display: "block", margin: "12px auto 0", opacity: 0.5 }}
              >
                <path
                  d="M 1 3 Q 9 0.5 17 2.5 T 35 2.5 T 53 2.5"
                  stroke="var(--gold, #c4a265)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Memorial reassurance — tender label, no icon */}
        <div
          className="grief-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 9999,
            background: "rgba(255, 253, 245, 0.88)",
            border: "1px solid rgba(191,82,74,0.22)",
          }}
        >
          <span
            style={{
              fontFamily: '"Cormorant", Georgia, serif',
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--rose, #bf524a)",
            }}
          >
            Held gently in their memory
          </span>
        </div>
      </div>

      <style>{`
        .grief-title,
        .grief-sub,
        .grief-beat,
        .grief-badge {
          opacity: 0;
          transform: translateY(10px);
          will-change: opacity, transform;
        }
        .grief-section.is-in .grief-title {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .grief-section.is-in .grief-sub {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 120ms forwards;
        }
        .grief-section.is-in .grief-beat:nth-child(1) {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 240ms forwards;
        }
        .grief-section.is-in .grief-beat:nth-child(2) {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 380ms forwards;
        }
        .grief-section.is-in .grief-badge {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) 540ms forwards;
        }
        @keyframes griefReveal {
          to { opacity: 1; transform: translateY(0); }
        }
        .grief-dove {
          animation: doveDrift 6s ease-in-out infinite;
          will-change: opacity, transform;
        }
        @keyframes doveDrift {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.25); }
        }
        @media (prefers-reduced-motion: reduce) {
          .grief-title,
          .grief-sub,
          .grief-beat,
          .grief-badge {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .grief-dove { animation: none !important; }
        }
      `}</style>
    </div>
  );
};
