import { useEffect, useRef, useState } from "react";
import { useLocalizedPrice } from "@/hooks/useLocalizedPrice";

/* Memorial reading = Soul Bond tier at $49 (was $79) — a dedicated product
 * with its own viewer + prompt. This section pre-sells it directly rather
 * than scattering emotional beats across multiple small cards. */
const MEMORIAL_PRICE = 49;
const MEMORIAL_WAS_PRICE = 79;

const MEMORIAL_FEATURES = [
  "Their full soul portrait, written in past tense",
  "A letter in their voice — from beyond",
  "Who they were, and the gifts they brought",
  "Grief compass + rituals for remembering",
  "Three permission slips for your own healing",
  "Yours forever — something to return to, every time you need them",
];

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

export const GriefSection = ({ onCtaClick }: GriefSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { fmtUsd } = useLocalizedPrice();

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

  const savePct = Math.round((1 - MEMORIAL_PRICE / MEMORIAL_WAS_PRICE) * 100);

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
        className="relative mx-auto"
        style={{ zIndex: 1, maxWidth: 560 }}
      >
        {/* Single polished memorial sale card — replaces the previous
            sequence of title / sub / two beats / badge. Dedicated product
            tile pre-selling the memorial reading. */}
        <div
          className="grief-card"
          style={{
            position: "relative",
            padding: "clamp(28px, 4.5vw, 40px) clamp(22px, 4vw, 36px) clamp(24px, 4vw, 34px)",
            background:
              "linear-gradient(180deg, rgba(255,253,245,0.96) 0%, rgba(250,244,232,0.94) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(196, 162, 101, 0.42)",
            borderRadius: 22,
            boxShadow: [
              "0 18px 48px rgba(20,15,8,0.08)",
              "0 2px 10px rgba(196,162,101,0.10)",
              "inset 0 1px 0 rgba(255,255,255,0.8)",
            ].join(", "),
            textAlign: "center",
          }}
        >
          {/* Rose eyebrow — product label */}
          <div
            style={{
              fontFamily: '"Cormorant", Georgia, serif',
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--rose, #bf524a)",
              marginBottom: 10,
            }}
          >
            Memorial Reading
          </div>

          {/* Title */}
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.6rem, 5.2vw, 2.1rem)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--black, #141210)",
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              margin: "0 0 10px",
            }}
          >
            If you've already had to say goodbye.
          </h2>

          {/* Sub */}
          <p
            style={{
              fontFamily: '"Cormorant", Georgia, serif',
              fontSize: "clamp(1rem, 3.2vw, 1.15rem)",
              fontStyle: "italic",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.55,
              margin: "0 auto",
              maxWidth: 420,
            }}
          >
            A reading written for the ones you miss — something to keep close.
          </p>

          {/* Gold hairline divider */}
          <svg
            aria-hidden="true"
            width="64"
            height="6"
            viewBox="0 0 54 6"
            style={{ display: "block", margin: "clamp(20px, 3vw, 28px) auto", opacity: 0.6 }}
          >
            <path
              d="M 1 3 Q 9 0.5 17 2.5 T 35 2.5 T 53 2.5"
              stroke="var(--gold, #c4a265)"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Price row */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: "clamp(18px, 3vw, 24px)",
            }}
          >
            <span
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(2.1rem, 6.2vw, 2.75rem)",
                color: "var(--black, #141210)",
                lineHeight: 1,
              }}
            >
              {fmtUsd(MEMORIAL_PRICE)}
            </span>
            <span
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1rem, 2.8vw, 1.2rem)",
                color: "var(--muted, #958779)",
                textDecoration: "line-through",
                textDecorationColor: "rgba(191,82,74,0.55)",
                textDecorationThickness: "1.6px",
                lineHeight: 1,
              }}
            >
              {fmtUsd(MEMORIAL_WAS_PRICE)}
            </span>
            <span
              style={{
                fontFamily: '"Cormorant", Georgia, serif',
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#fff",
                background: "var(--rose, #bf524a)",
                padding: "4px 10px",
                borderRadius: 9999,
                whiteSpace: "nowrap",
              }}
            >
              Save {savePct}%
            </span>
          </div>

          {/* Features list */}
          <ul
            style={{
              listStyle: "none",
              margin: "0 0 clamp(22px, 3.5vw, 30px)",
              padding: 0,
              textAlign: "left",
              display: "grid",
              gap: 10,
            }}
          >
            {MEMORIAL_FEATURES.map((feature, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  fontFamily: '"Cormorant", Georgia, serif',
                  fontSize: "clamp(0.98rem, 3vw, 1.08rem)",
                  color: "var(--ink, #1f1c18)",
                  lineHeight: 1.45,
                }}
              >
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  style={{ flexShrink: 0, marginTop: 4 }}
                >
                  <path
                    d="M 4 10.5 L 8.5 15 L 16.5 6"
                    stroke="var(--gold, #c4a265)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            type="button"
            onClick={onCtaClick}
            className="grief-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: 420,
              padding: "16px 28px",
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.05rem, 3.4vw, 1.2rem)",
              fontWeight: 400,
              color: "#fff",
              background: "var(--rose, #bf524a)",
              border: "none",
              borderRadius: 14,
              cursor: "pointer",
              boxShadow: [
                "0 10px 24px rgba(191,82,74,0.28)",
                "inset 0 1px 0 rgba(255,255,255,0.25)",
              ].join(", "),
              letterSpacing: "-0.005em",
              transition: "transform 280ms cubic-bezier(0.22,1,0.36,1), box-shadow 280ms ease",
            }}
          >
            Begin their memorial · {fmtUsd(MEMORIAL_PRICE)}
          </button>

          {/* Reassurance pill */}
          <div style={{ marginTop: "clamp(16px, 2.5vw, 22px)" }}>
            <span
              className="grief-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 18px",
                borderRadius: 9999,
                background: "rgba(255, 253, 245, 0.88)",
                border: "1px solid rgba(191,82,74,0.22)",
                fontFamily: '"Cormorant", Georgia, serif',
                fontSize: "0.74rem",
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
      </div>

      <style>{`
        .grief-card {
          opacity: 0;
          transform: translateY(12px);
          will-change: opacity, transform;
        }
        .grief-section.is-in .grief-card {
          animation: griefReveal 820ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes griefReveal {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (hover: hover) {
          .grief-cta:hover {
            transform: translateY(-2px);
            box-shadow:
              0 14px 32px rgba(191,82,74,0.36),
              inset 0 1px 0 rgba(255,255,255,0.3);
          }
          .grief-cta:active {
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
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
