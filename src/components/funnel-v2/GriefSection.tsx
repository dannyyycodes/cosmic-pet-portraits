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

  return (
    <div
      ref={ref}
      className={`grief-section relative overflow-hidden ${visible ? "is-in" : ""}`}
      style={{
        background: "var(--cream, #FFFDF5)",
        padding: "clamp(56px, 9vw, 88px) 20px clamp(52px, 8vw, 76px)",
      }}
    >
      {/* Transition: handwritten prelude above the title. A single line in
          Caveat sits quietly between the preceding benefits section and the
          memorial tone — more of a whisper than a divider. */}
      <DoveWallpaper />

      <div
        className="relative max-w-[500px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Handwritten prelude — bridges the jump from generic benefits
            into the memorial register. Quiet, earth-toned, slight rotation
            so it reads like a note scribbled in the margin. */}
        <div
          className="grief-prelude"
          aria-hidden="true"
          style={{
            fontFamily: '"Caveat", "Bradley Hand", cursive',
            fontSize: "clamp(1.1rem, 3.6vw, 1.35rem)",
            color: "var(--muted, #958779)",
            lineHeight: 1,
            marginBottom: 18,
            transform: "rotate(-1.5deg)",
            display: "inline-block",
          }}
        >
          for the ones you miss
        </div>

        {/* Primary card — title and sub merged into a single glass panel so
            the cadence reads as one quiet statement rather than two stacked
            blocks. Tiny gold hairline separates the two lines. */}
        <div className="grief-card flex justify-center">
          <div
            style={{
              padding: "clamp(22px, 4vw, 30px) clamp(24px, 5vw, 36px)",
              background: "rgba(255, 253, 245, 0.94)",
              border: "1px solid rgba(196, 162, 101, 0.2)",
              borderRadius: 16,
              boxShadow: "0 4px 28px rgba(20,15,8,0.05)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              maxWidth: 460,
            }}
          >
            <h2
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.65rem, 5.4vw, 2.1rem)",
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--black, #141210)",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                margin: 0,
                textAlign: "center",
              }}
            >
              If they aren&rsquo;t here anymore.
            </h2>

            {/* Hairline gold divider — the single ornament. */}
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 1,
                background: "var(--gold, #c4a265)",
                opacity: 0.6,
                margin: "14px auto",
              }}
            />

            <p
              style={{
                fontFamily: '"Cormorant", Georgia, serif',
                fontSize: "clamp(1.02rem, 3vw, 1.12rem)",
                fontStyle: "italic",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.55,
                margin: 0,
                textAlign: "center",
              }}
            >
              A reading to keep close &mdash; so you can still hear
              who they always were.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .grief-prelude,
        .grief-card {
          opacity: 0;
          transform: translateY(10px);
          will-change: opacity, transform;
        }
        .grief-section.is-in .grief-prelude {
          animation: griefReveal 720ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .grief-section.is-in .grief-card {
          animation: griefReveal 820ms cubic-bezier(0.22,1,0.36,1) 180ms forwards;
        }
        @keyframes griefReveal {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .grief-prelude,
          .grief-card {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};
