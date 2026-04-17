import { useEffect, useRef, useState } from "react";

/* Memorial backdrop — scattered soul silhouettes (two hand-picked SVGs
 * served from /memorial/). Density, sizes and opacity mirror the hearts
 * backdrop used elsewhere in the funnel so the memorial section lives
 * in the same visual family. Very low opacity — reads as atmosphere. */
type Soul = { x: number; y: number; size: number; rot: number; op: number; src: string };

const S1 = "/memorial/soul-1.svg";
const S2 = "/memorial/soul-2.svg";

const SOULS: Soul[] = [
  // Top edge
  { x: 4,  y: 4,  size: 26, rot: -12, op: 0.10, src: S1 },
  { x: 18, y: 8,  size: 30, rot: 10,  op: 0.11, src: S2 },
  { x: 32, y: 5,  size: 24, rot: 14,  op: 0.09, src: S1 },
  { x: 46, y: 9,  size: 34, rot: -6,  op: 0.11, src: S2 },
  { x: 62, y: 4,  size: 26, rot: 12,  op: 0.10, src: S1 },
  { x: 76, y: 8,  size: 28, rot: -14, op: 0.11, src: S2 },
  { x: 92, y: 5,  size: 22, rot: 6,   op: 0.09, src: S1 },

  // Upper-mid
  { x: 8,  y: 24, size: 28, rot: 14,  op: 0.10, src: S2 },
  { x: 28, y: 28, size: 24, rot: -10, op: 0.09, src: S1 },
  { x: 52, y: 26, size: 32, rot: 4,   op: 0.11, src: S2 },
  { x: 76, y: 30, size: 26, rot: -16, op: 0.10, src: S1 },
  { x: 94, y: 24, size: 26, rot: 8,   op: 0.10, src: S2 },

  // Middle
  { x: 4,  y: 48, size: 24, rot: -8,  op: 0.09, src: S1 },
  { x: 22, y: 52, size: 30, rot: 16,  op: 0.11, src: S2 },
  { x: 44, y: 48, size: 22, rot: -12, op: 0.09, src: S1 },
  { x: 64, y: 52, size: 32, rot: 6,   op: 0.11, src: S2 },
  { x: 86, y: 50, size: 24, rot: -14, op: 0.10, src: S1 },

  // Lower-mid
  { x: 10, y: 72, size: 28, rot: 12,  op: 0.10, src: S2 },
  { x: 32, y: 76, size: 22, rot: -10, op: 0.09, src: S1 },
  { x: 54, y: 72, size: 30, rot: 14,  op: 0.11, src: S2 },
  { x: 74, y: 78, size: 24, rot: -6,  op: 0.09, src: S1 },
  { x: 94, y: 72, size: 32, rot: 8,   op: 0.11, src: S2 },

  // Bottom edge
  { x: 4,  y: 94, size: 22, rot: -12, op: 0.09, src: S1 },
  { x: 20, y: 92, size: 28, rot: 8,   op: 0.10, src: S2 },
  { x: 36, y: 96, size: 24, rot: 14,  op: 0.09, src: S1 },
  { x: 52, y: 92, size: 32, rot: -8,  op: 0.11, src: S2 },
  { x: 68, y: 96, size: 22, rot: 10,  op: 0.09, src: S1 },
  { x: 82, y: 92, size: 28, rot: -14, op: 0.10, src: S2 },
  { x: 96, y: 96, size: 24, rot: 6,   op: 0.09, src: S1 },
];

const DoveWallpaper = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none overflow-hidden"
    style={{ zIndex: 0 }}
  >
    {SOULS.map((s, i) => (
      <img
        key={i}
        src={s.src}
        alt=""
        style={{
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: "auto",
          transform: `translate(-50%, -50%) rotate(${s.rot}deg)`,
          opacity: s.op,
          userSelect: "none",
        }}
        draggable={false}
      />
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
        {/* Title — wrapped in a cream-glass card so the memorial backdrop
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
        @media (prefers-reduced-motion: reduce) {
          .grief-title,
          .grief-sub,
          .grief-beat,
          .grief-badge {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
