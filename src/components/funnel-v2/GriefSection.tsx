import { useEffect, useRef, useState } from "react";

/**
 * GriefSection — memorial prelude (2026-04-21 redesign).
 *
 * Copy is unchanged. This pass rebuilds the visual atmosphere to be
 * simpler, more beautiful, more mystical. What changed:
 *
 * - Dove-silhouette wallpaper removed (sympathy-card energy).
 * - Rising embers removed (fireworks, not candlelight).
 * - New: a single large gold orrery (concentric rings + three slow-
 *   orbiting points) rotating imperceptibly behind the copy — the
 *   sky, turning. Reads as sacred geometry.
 * - New: distant gold starlight — eight quiet points placed around
 *   the text column (never behind letterforms), each breathing with
 *   its own slow pulse.
 * - New: the horizontal hairline between beats is replaced with a
 *   vesica-style gold sigil — a six-pointed star inside a ring. One
 *   ornament, drawn on reveal, then still.
 * - Background deepens to a soft vignette: warm gold glow at 30%
 *   top-centre fading into cream at the edges, so the copy sits in
 *   a pool of light rather than flat cream.
 * - Typography unchanged; the section now breathes more.
 *
 * Cadence kept from previous version — 200ms → 5500ms, grieving
 * readers should not be rushed.
 */

/* ── Distant starlight — tiny gold points around the text column.
 *    Placed so none sit inside the centered copy's reading path. */
type Star = { x: number; y: number; size: number; delay: number };
const STARS: Star[] = [
  { x: 10, y: 14, size: 2,   delay: 0.0 },
  { x: 88, y: 12, size: 2.5, delay: 1.4 },
  { x: 6,  y: 42, size: 1.8, delay: 0.8 },
  { x: 94, y: 38, size: 2,   delay: 2.2 },
  { x: 12, y: 72, size: 2.2, delay: 0.4 },
  { x: 90, y: 70, size: 1.8, delay: 1.8 },
  { x: 20, y: 90, size: 2,   delay: 3.0 },
  { x: 80, y: 92, size: 2.4, delay: 2.6 },
];

const Starlight = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none overflow-hidden"
    style={{ zIndex: 0 }}
  >
    {STARS.map((s, i) => (
      <span
        key={i}
        className="grief-starlight"
        style={{
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,212,154,1) 0%, rgba(196,162,101,0.55) 55%, rgba(196,162,101,0) 100%)",
          boxShadow: "0 0 6px rgba(212,178,107,0.5)",
          animationDelay: `${s.delay}s`,
          transform: "translate(-50%, -50%)",
        }}
      />
    ))}
  </div>
);

/* ── Orrery — a single large celestial disc. Concentric gold rings
 *    with three orbiting dots. Rotates over 240s (almost still, just
 *    enough to feel alive). Very low opacity — atmosphere, not decor. */
const Orrery = () => (
  <svg
    aria-hidden="true"
    className="grief-orrery"
    viewBox="0 0 400 400"
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "min(640px, 96%)",
      height: "auto",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none",
      zIndex: 0,
      opacity: 0.32,
    }}
  >
    <defs>
      <radialGradient id="orreryCore" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stopColor="#d4b26b" stopOpacity="0.18" />
        <stop offset="60%" stopColor="#c4a265" stopOpacity="0.04" />
        <stop offset="100%" stopColor="#c4a265" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Soft gold core so the rings sit in light, not void */}
    <circle cx="200" cy="200" r="200" fill="url(#orreryCore)" />

    {/* Three concentric rings — dashed, different densities */}
    <circle
      cx="200" cy="200" r="84"
      fill="none" stroke="#c4a265" strokeWidth="0.7"
      strokeDasharray="1 5" opacity="0.6"
    />
    <circle
      cx="200" cy="200" r="128"
      fill="none" stroke="#c4a265" strokeWidth="0.6"
      strokeDasharray="2 7" opacity="0.5"
    />
    <circle
      cx="200" cy="200" r="176"
      fill="none" stroke="#c4a265" strokeWidth="0.5"
      strokeDasharray="1 9" opacity="0.4"
    />

    {/* Three orbiting points — placed at different angles so the
        eye reads a triangle of tiny lights */}
    <g>
      <circle cx="284" cy="200" r="2.2" fill="#c4a265" opacity="0.8" />
      <circle cx="200" cy="72"  r="2"   fill="#bf524a" opacity="0.7" />
      <circle cx="136" cy="310" r="1.8" fill="#c4a265" opacity="0.65" />
    </g>
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

  return (
    <div
      ref={ref}
      className={`grief-section relative overflow-hidden ${visible ? "is-in" : ""}`}
      style={{
        /* Pool of warm light at top-centre, fading to cream at edges.
           Depth — the copy sits inside atmosphere, not on flat cream. */
        background:
          "radial-gradient(ellipse 70% 55% at 50% 22%, rgba(212,178,107,0.13) 0%, rgba(212,178,107,0.04) 45%, rgba(255,253,245,0) 75%), var(--cream, #FFFDF5)",
        padding: "clamp(88px, 13vw, 140px) 20px clamp(80px, 11vw, 120px)",
      }}
    >
      <Orrery />
      <Starlight />

      <div
        className="relative max-w-[640px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Beat 1 — acknowledgment. Large italic serif, slow fade-up. */}
        <h2
          className="grief-beat grief-beat-1"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.9rem, 6.4vw, 2.7rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            lineHeight: 1.16,
            letterSpacing: "-0.018em",
            margin: 0,
          }}
        >
          For the ones you still carry
          <br />
          in your heart.
        </h2>

        {/* Beat 2 — validation. */}
        <p
          className="grief-beat grief-beat-2"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.1rem, 3.4vw, 1.32rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            margin: "clamp(22px, 3vw, 30px) auto 0",
            maxWidth: 460,
          }}
        >
          Even if they&rsquo;re no longer by your side.
        </p>

        {/* Sigil — six-pointed star inside a thin ring. Draws on
            reveal, then sits quietly. Replaces the old hairline —
            one sacred ornament instead of a diagrammatic rule. */}
        <svg
          aria-hidden="true"
          className="grief-sigil"
          viewBox="0 0 40 40"
          style={{
            display: "block",
            width: 34,
            height: 34,
            margin: "clamp(32px, 5vw, 46px) auto",
          }}
        >
          {/* Outer ring */}
          <circle
            cx="20" cy="20" r="17"
            fill="none" stroke="#c4a265"
            strokeWidth="0.9"
            className="grief-sigil-ring"
          />
          {/* Six-pointed star (two overlapping triangles) */}
          <path
            d="M20 6 L30.4 24 L9.6 24 Z"
            fill="none" stroke="#c4a265"
            strokeWidth="0.9"
            className="grief-sigil-triA"
          />
          <path
            d="M20 34 L9.6 16 L30.4 16 Z"
            fill="none" stroke="#c4a265"
            strokeWidth="0.9"
            className="grief-sigil-triB"
          />
          {/* Centre dot — a single gold point at the heart */}
          <circle
            cx="20" cy="20" r="1"
            fill="#c4a265"
            className="grief-sigil-core"
          />
        </svg>

        {/* Beat 3 — offer. Italic serif with an emphasised noun. */}
        <p
          className="grief-beat grief-beat-3"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.18rem, 3.6vw, 1.4rem)",
            fontStyle: "italic",
            color: "var(--ink, #1f1c18)",
            lineHeight: 1.55,
            margin: "0 auto",
            maxWidth: 520,
          }}
        >
          A reading for the space they left &mdash;
          <br />
          <em
            className="grief-emphasis"
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: "italic",
              color: "var(--rose, #bf524a)",
              letterSpacing: "0.005em",
            }}
          >
            a keepsake
          </em>{" "}
          for the days you need them.
        </p>
      </div>

      <style>{`
        /* ── Beat reveal — blur-to-sharp fade-up, staggered ── */
        .grief-beat {
          opacity: 0;
          transform: translateY(14px);
          filter: blur(4px);
          will-change: opacity, transform, filter;
        }
        .grief-section.is-in .grief-beat-1 {
          animation: griefBeatIn 1100ms cubic-bezier(0.22, 1, 0.36, 1) 200ms forwards;
        }
        .grief-section.is-in .grief-beat-2 {
          animation: griefBeatIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) 1800ms forwards;
        }
        .grief-section.is-in .grief-beat-3 {
          animation: griefBeatIn 1100ms cubic-bezier(0.22, 1, 0.36, 1) 4400ms forwards;
        }
        @keyframes griefBeatIn {
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        /* Emphasis picks up a gold underline once beat 3 is fully shown */
        .grief-section .grief-emphasis {
          background-image: linear-gradient(var(--gold, #c4a265), var(--gold, #c4a265));
          background-repeat: no-repeat;
          background-size: 0% 1px;
          background-position: 0 100%;
          transition: background-size 800ms cubic-bezier(0.22, 1, 0.36, 1) 5700ms;
        }
        .grief-section.is-in .grief-emphasis {
          background-size: 100% 1px;
        }

        /* ── Sigil — rings + triangles stroke in, centre dot fades ── */
        .grief-sigil {
          opacity: 0;
          transition: opacity 900ms ease 3300ms;
        }
        .grief-section.is-in .grief-sigil { opacity: 1; }
        .grief-sigil-ring,
        .grief-sigil-triA,
        .grief-sigil-triB {
          stroke-dasharray: 140;
          stroke-dashoffset: 140;
        }
        .grief-section.is-in .grief-sigil-ring {
          animation: griefSigilDraw 1100ms cubic-bezier(0.22, 1, 0.36, 1) 3400ms forwards;
        }
        .grief-section.is-in .grief-sigil-triA {
          animation: griefSigilDraw 1000ms cubic-bezier(0.22, 1, 0.36, 1) 3900ms forwards;
        }
        .grief-section.is-in .grief-sigil-triB {
          animation: griefSigilDraw 1000ms cubic-bezier(0.22, 1, 0.36, 1) 4000ms forwards;
        }
        @keyframes griefSigilDraw {
          to { stroke-dashoffset: 0; }
        }
        .grief-sigil-core {
          opacity: 0;
        }
        .grief-section.is-in .grief-sigil-core {
          animation: griefSigilCoreIn 900ms ease 4700ms forwards,
                     griefSigilCorePulse 4s ease-in-out 5600ms infinite;
          transform-origin: center;
        }
        @keyframes griefSigilCoreIn {
          from { opacity: 0; transform: scale(0.3); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes griefSigilCorePulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(1.3); }
        }

        /* ── Orrery — almost-still rotation ── */
        .grief-orrery {
          opacity: 0;
          transition: opacity 1600ms ease 300ms;
        }
        .grief-section.is-in .grief-orrery {
          opacity: 0.32;
          animation: griefOrrerySpin 240s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes griefOrrerySpin {
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* ── Distant starlight — each breathes independently ── */
        .grief-starlight {
          opacity: 0;
          animation: griefStarBreath 5.5s ease-in-out infinite;
          will-change: opacity, transform;
        }
        @keyframes griefStarBreath {
          0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(0.9); }
          50%      { opacity: 0.9;  transform: translate(-50%, -50%) scale(1.15); }
        }

        /* ── Motion preferences ── */
        @media (prefers-reduced-motion: reduce) {
          .grief-beat,
          .grief-section.is-in .grief-beat-1,
          .grief-section.is-in .grief-beat-2,
          .grief-section.is-in .grief-beat-3 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
          .grief-section .grief-emphasis,
          .grief-section.is-in .grief-emphasis {
            transition: none !important;
            background-size: 100% 1px !important;
          }
          .grief-sigil,
          .grief-section.is-in .grief-sigil { opacity: 1 !important; transition: none !important; }
          .grief-sigil-ring,
          .grief-sigil-triA,
          .grief-sigil-triB,
          .grief-section.is-in .grief-sigil-ring,
          .grief-section.is-in .grief-sigil-triA,
          .grief-section.is-in .grief-sigil-triB {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
          .grief-sigil-core,
          .grief-section.is-in .grief-sigil-core { animation: none !important; opacity: 1 !important; }
          .grief-orrery,
          .grief-section.is-in .grief-orrery { animation: none !important; opacity: 0.32 !important; }
          .grief-starlight { animation: none !important; opacity: 0.55 !important; }
        }
      `}</style>
    </div>
  );
};
