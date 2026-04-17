import { useEffect, useRef, useState } from "react";
import { Flame } from "@phosphor-icons/react";

/* Subtle dove wallpaper — scattered flying-bird silhouettes drawn as a
 * minimal "M" arc, the iconic shorthand for a dove in flight. Positions
 * chosen by hand so the pattern feels drifted, not tiled. Very low
 * opacity so it reads as atmosphere rather than decoration. */
type Dove = { x: number; y: number; size: number; rot: number; opacity: number; delay: number };

const DOVES: Dove[] = [
  { x: 6,  y: 8,  size: 28, rot: -6, opacity: 0.10, delay: 0.0 },
  { x: 22, y: 14, size: 22, rot: 3,  opacity: 0.08, delay: 0.6 },
  { x: 42, y: 6,  size: 32, rot: -2, opacity: 0.09, delay: 1.2 },
  { x: 62, y: 12, size: 24, rot: 5,  opacity: 0.07, delay: 1.8 },
  { x: 82, y: 8,  size: 30, rot: -4, opacity: 0.09, delay: 2.4 },
  { x: 14, y: 32, size: 26, rot: 2,  opacity: 0.08, delay: 0.3 },
  { x: 36, y: 38, size: 34, rot: -5, opacity: 0.10, delay: 0.9 },
  { x: 58, y: 34, size: 22, rot: 4,  opacity: 0.07, delay: 1.5 },
  { x: 78, y: 40, size: 28, rot: -3, opacity: 0.09, delay: 2.1 },
  { x: 4,  y: 58, size: 24, rot: 3,  opacity: 0.08, delay: 0.4 },
  { x: 28, y: 62, size: 30, rot: -6, opacity: 0.09, delay: 1.0 },
  { x: 50, y: 58, size: 22, rot: 2,  opacity: 0.07, delay: 1.6 },
  { x: 72, y: 64, size: 32, rot: -2, opacity: 0.10, delay: 2.2 },
  { x: 90, y: 60, size: 20, rot: 5,  opacity: 0.06, delay: 2.8 },
  { x: 12, y: 82, size: 28, rot: -4, opacity: 0.09, delay: 0.5 },
  { x: 34, y: 88, size: 22, rot: 3,  opacity: 0.07, delay: 1.1 },
  { x: 56, y: 84, size: 30, rot: -5, opacity: 0.09, delay: 1.7 },
  { x: 78, y: 90, size: 24, rot: 2,  opacity: 0.08, delay: 2.3 },
  { x: 92, y: 82, size: 20, rot: -3, opacity: 0.06, delay: 2.9 },
];

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
        viewBox="0 0 40 20"
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
        <path
          d="M 2 16 Q 10 4, 20 16 Q 30 4, 38 16"
          stroke="var(--gold, #c4a265)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ))}
  </div>
);

/* Small gold ornamental 4-point star — used as a pendant at the top of
 * each elevated benefit card to signal reverence. */
const Fleuron = ({ size = 14 }: { size?: number }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    width={size}
    height={size}
    style={{ display: "block", margin: "0 auto" }}
  >
    <path
      d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
      fill="var(--gold, #c4a265)"
      opacity="0.72"
    />
  </svg>
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
        {/* Title */}
        <h2
          className="grief-title"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.65rem, 5.4vw, 2.2rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          If you've already had to say goodbye.
        </h2>

        {/* Sub */}
        <p
          className="grief-sub"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1rem, 3.2vw, 1.15rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            marginBottom: "clamp(32px, 5.5vw, 44px)",
            maxWidth: 440,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Their reading becomes something to keep close. Something to return
          to, every time you need them.
        </p>

        {/* Elevated benefit cards — gold fleuron pendant, double-border, roomy */}
        <div
          className="grief-beats"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(18px, 3vw, 26px)",
            marginBottom: "clamp(32px, 5vw, 44px)",
          }}
        >
          {BEATS.map((line, i) => (
            <div
              key={i}
              className="grief-beat"
              style={{
                position: "relative",
                padding: "clamp(32px, 5vw, 44px) clamp(24px, 4.5vw, 36px) clamp(28px, 4.5vw, 38px)",
                background:
                  "linear-gradient(180deg, rgba(255,253,245,0.92) 0%, rgba(250,244,232,0.9) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(196, 162, 101, 0.38)",
                borderRadius: 18,
                boxShadow: [
                  "0 10px 38px rgba(20,15,8,0.06)",
                  "0 2px 8px rgba(196,162,101,0.08)",
                  "inset 0 1px 0 rgba(255,255,255,0.75)",
                  "inset 0 0 0 1px rgba(255,253,245,0.65)",
                ].join(", "),
              }}
            >
              {/* Gold pendant fleuron at top-center */}
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "4px 8px",
                  background: "var(--cream, #FFFDF5)",
                  borderRadius: 9999,
                }}
              >
                <Fleuron size={14} />
              </div>

              <p
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.15rem, 3.8vw, 1.4rem)",
                  fontStyle: "italic",
                  color: "var(--ink, #1f1c18)",
                  lineHeight: 1.38,
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {line}
              </p>

              {/* Soft gold hairline below text */}
              <svg
                aria-hidden="true"
                width="54"
                height="6"
                viewBox="0 0 54 6"
                style={{ display: "block", margin: "18px auto 0", opacity: 0.55 }}
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

        {/* Memorial mode reassurance badge */}
        <div
          className="grief-badge"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 9999,
            background: "rgba(255, 253, 245, 0.85)",
            border: "1px solid rgba(191,82,74,0.22)",
          }}
        >
          <Flame
            size={13}
            weight="fill"
            color="var(--rose, #bf524a)"
            style={{ opacity: 0.85 }}
          />
          <span
            style={{
              fontFamily: '"Cormorant", Georgia, serif',
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--rose, #bf524a)",
            }}
          >
            Memorial mode — in every reading
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
