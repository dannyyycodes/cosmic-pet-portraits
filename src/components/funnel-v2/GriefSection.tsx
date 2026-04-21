import { useEffect, useRef, useState } from "react";

/**
 * GriefSection — memorial prelude (2026-04-21 rewrite).
 *
 * A single constellation slowly draws itself into view behind the
 * copy — lines connecting star points over ~3s, landing around when
 * "that still remembers them." completes. One of the stars (the one
 * at the centre of the cluster) "awakens" into a brighter pinpoint
 * glow that keeps pulsing quietly for the rest of the section — it's
 * the star that still remembers them.
 *
 * Copy sells the transformation frame: they didn't leave, they just
 * changed places — the sky still holds the shape of who they were.
 * No Hallmark phrases, no "rainbow bridge", no "watching over". The
 * reading is framed as access, not a souvenir.
 *
 * Beats (timeline from is-in):
 *   Eyebrow "IN MEMORY"      : 0ms     → 900ms     (fade in)
 *   Constellation lines draw : 400ms   → 3400ms   (staggered)
 *   Beat 1 "They lived…"     : 700ms   → 1800ms
 *   Beat 2 "that still…"     : 1900ms  → 2900ms
 *   Memory star awakens      : 2800ms  → 3800ms   (one pinpoint brightens)
 *   Thread descends          : 3400ms  → 4400ms
 *   Beat 3 "Every star…"     : 4100ms  → 5100ms
 *   Beat 4 "waiting, patient…" : 5200ms → 6200ms
 *   Offer                    : 6500ms  → 7500ms
 */

/* ── Constellation — a single cluster, drawn gently as the section
 *    lands. Points are placed around the copy (none within the
 *    central text column) so letterforms always read clean. Lines
 *    connect in a deliberate path, drawn with a length-dash trick
 *    so each segment strokes in rather than popping. */
type StarPt = { x: number; y: number; size: number; bright?: boolean; memory?: boolean };
const STARS: StarPt[] = [
  // Upper arc
  { x: 14, y: 12, size: 3 },
  { x: 26, y: 8,  size: 2.5 },
  { x: 40, y: 10, size: 4, bright: true },
  { x: 58, y: 6,  size: 2.5 },
  { x: 72, y: 12, size: 3 },
  { x: 86, y: 9,  size: 2.5 },

  // Mid — the memory star sits centre, brightens on reveal
  { x: 50, y: 50, size: 5, bright: true, memory: true },

  // Left + right supports
  { x: 8,  y: 46, size: 2.5 },
  { x: 92, y: 44, size: 3 },

  // Lower arc
  { x: 18, y: 84, size: 3 },
  { x: 34, y: 90, size: 2.5 },
  { x: 50, y: 92, size: 4, bright: true },
  { x: 66, y: 90, size: 2.5 },
  { x: 82, y: 84, size: 3 },
];

// Line segments that draw the constellation. Each references STARS
// indices. Ordered so the eye reads a deliberate path.
const LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],           // upper arc
  [2, 6], [6, 11],                                    // top → memory → bottom
  [6, 7], [6, 8],                                     // memory → flanks
  [9, 10], [10, 11], [11, 12], [12, 13],              // lower arc
];

const Constellation = () => (
  <svg
    aria-hidden="true"
    className="grief-constellation"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    <defs>
      <radialGradient id="memoryStar" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stopColor="#e8d49a" stopOpacity="1" />
        <stop offset="55%" stopColor="#c4a265" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#c4a265" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="regularStar" cx="50%" cy="50%" r="50%">
        <stop offset="0%"  stopColor="#c4a265" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#c4a265" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Lines first, behind the stars */}
    <g fill="none" stroke="#c4a265" strokeWidth="0.12" strokeOpacity="0.5" vectorEffect="non-scaling-stroke">
      {LINES.map(([a, b], i) => {
        const from = STARS[a];
        const to   = STARS[b];
        if (!from || !to) return null;
        return (
          <line
            key={i}
            className="grief-line"
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            style={{ animationDelay: `${400 + i * 180}ms` }}
          />
        );
      })}
    </g>

    {/* Stars on top */}
    {STARS.map((s, i) => (
      <g
        key={i}
        className={`grief-star${s.bright ? " is-bright" : ""}${s.memory ? " is-memory" : ""}`}
        style={{ animationDelay: s.memory ? "2800ms" : `${400 + i * 70}ms` }}
      >
        {/* Halo — larger, softer. Memory star gets the richer gradient. */}
        <circle
          cx={s.x}
          cy={s.y}
          r={(s.size + (s.memory ? 4 : 2.5))}
          fill={`url(#${s.memory ? "memoryStar" : "regularStar"})`}
        />
        {/* Core — crisp pinpoint */}
        <circle
          cx={s.x}
          cy={s.y}
          r={s.size * 0.32}
          fill="#e8d49a"
        />
      </g>
    ))}
  </svg>
);

/* ── Rising embers — fewer + slower than before, so the backdrop
 *    reads as candlelight rather than fireworks. */
type Ember = { x: number; size: number; delay: number; duration: number; opacity: number };
const EMBERS: Ember[] = [
  { x: 18, size: 2.5, delay: 0.0,  duration: 22, opacity: 0.5 },
  { x: 42, size: 3,   delay: 5.0,  duration: 20, opacity: 0.55 },
  { x: 64, size: 2,   delay: 2.5,  duration: 24, opacity: 0.45 },
  { x: 86, size: 3,   delay: 7.8,  duration: 21, opacity: 0.5 },
];

const EmberDrift = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 pointer-events-none overflow-hidden"
    style={{ zIndex: 0 }}
  >
    {EMBERS.map((e, i) => (
      <span
        key={i}
        className="grief-ember"
        style={{
          position: "absolute",
          left: `${e.x}%`,
          bottom: "-6%",
          width: e.size,
          height: e.size,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,178,107,0.95) 0%, rgba(196,162,101,0.55) 45%, rgba(196,162,101,0) 75%)",
          opacity: 0,
          animationDelay: `${e.delay}s`,
          animationDuration: `${e.duration}s`,
          ["--ember-peak" as string]: e.opacity,
        }}
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
        background:
          "radial-gradient(ellipse at 50% 30%, rgba(212,178,107,0.08) 0%, rgba(255,253,245,0) 60%), var(--cream, #FFFDF5)",
        padding: "clamp(72px, 11vw, 124px) 20px clamp(72px, 11vw, 112px)",
      }}
    >
      <Constellation />
      <EmberDrift />

      <div
        className="relative max-w-[640px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Eyebrow — plaque-like, grounds the section */}
        <span
          className="grief-eyebrow"
          style={{
            display: "inline-block",
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "var(--gold, #c4a265)",
          }}
        >
          <span className="grief-eyebrow-rule" aria-hidden="true" />
          In Memory
          <span className="grief-eyebrow-rule" aria-hidden="true" />
        </span>

        {/* Beat 1 — acknowledgment. */}
        <h2
          className="grief-beat grief-beat-1"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.95rem, 6.4vw, 2.7rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            lineHeight: 1.16,
            letterSpacing: "-0.018em",
            margin: "clamp(22px, 3vw, 32px) 0 0",
          }}
        >
          They lived under a sky
        </h2>

        {/* Beat 2 — turn. The verb "remembers" catches rose, echoing the
            way IntroTitle catches its second line below. */}
        <h2
          className="grief-beat grief-beat-2"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.95rem, 6.4vw, 2.7rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            lineHeight: 1.16,
            letterSpacing: "-0.018em",
            margin: "6px 0 0",
          }}
        >
          that still{" "}
          <em
            className="grief-verb"
            style={{
              fontStyle: "italic",
              color: "var(--rose, #bf524a)",
              letterSpacing: "0.005em",
            }}
          >
            remembers
          </em>
          {" "}them.
        </h2>

        {/* Thread of light — replaces the horizontal hairline. Draws
            DOWN vertically, like something being lowered — more
            reverent, less diagrammatic. */}
        <span
          aria-hidden="true"
          className="grief-thread"
          style={{
            display: "block",
            width: 1,
            background: "linear-gradient(180deg, rgba(196,162,101,0) 0%, var(--gold, #c4a265) 50%, rgba(196,162,101,0) 100%)",
            margin: "clamp(28px, 4.5vw, 44px) auto",
          }}
        />

        {/* Beat 3 — validation of the frame. */}
        <p
          className="grief-beat grief-beat-3"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.1rem, 3.4vw, 1.28rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.58,
            margin: "0 auto",
            maxWidth: 460,
          }}
        >
          Every star that saw them is still there —
        </p>

        {/* Beat 4 — shape it. "waiting" gets gold underline later. */}
        <p
          className="grief-beat grief-beat-4"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.18rem, 3.6vw, 1.36rem)",
            fontStyle: "italic",
            color: "var(--ink, #1f1c18)",
            lineHeight: 1.55,
            margin: "6px auto 0",
            maxWidth: 460,
          }}
        >
          <em
            className="grief-emphasis"
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontStyle: "italic",
              color: "var(--rose, #bf524a)",
              letterSpacing: "0.005em",
            }}
          >
            waiting
          </em>
          , patient, holding their shape.
        </p>

        {/* Offer — frames the reading as access, not a product. */}
        <p
          className="grief-beat grief-beat-5"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.05rem, 3.2vw, 1.2rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.6,
            margin: "clamp(26px, 4vw, 36px) auto 0",
            maxWidth: 500,
          }}
        >
          A reading for the sky they knew &mdash;
          <br />
          a way to find them again, where they began.
        </p>
      </div>

      <style>{`
        /* ── Eyebrow ── */
        .grief-eyebrow {
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 900ms ease-out, transform 900ms ease-out;
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .grief-eyebrow-rule {
          display: inline-block;
          width: 28px;
          height: 1px;
          background: var(--gold, #c4a265);
          opacity: 0.55;
        }
        .grief-section.is-in .grief-eyebrow {
          opacity: 1;
          transform: translateY(0);
        }

        /* ── Beat reveal — blur-to-sharp fade-up, staggered ── */
        .grief-beat {
          opacity: 0;
          transform: translateY(14px);
          filter: blur(4px);
          will-change: opacity, transform, filter;
        }
        .grief-thread {
          height: 0;
          opacity: 0 !important;
          will-change: height, opacity;
        }
        .grief-section.is-in .grief-beat-1 {
          animation: griefBeatIn 1100ms cubic-bezier(0.22, 1, 0.36, 1) 700ms forwards;
        }
        .grief-section.is-in .grief-beat-2 {
          animation: griefBeatIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) 1900ms forwards;
        }
        .grief-section.is-in .grief-thread {
          animation: griefThreadDescend 1000ms cubic-bezier(0.22, 1, 0.36, 1) 3400ms forwards;
        }
        .grief-section.is-in .grief-beat-3 {
          animation: griefBeatIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) 4100ms forwards;
        }
        .grief-section.is-in .grief-beat-4 {
          animation: griefBeatIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) 5200ms forwards;
        }
        .grief-section.is-in .grief-beat-5 {
          animation: griefBeatIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) 6500ms forwards;
        }
        @keyframes griefBeatIn {
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes griefThreadDescend {
          to { height: 56px; opacity: 0.75 !important; }
        }

        /* Emphasis picks up a gold underline once beat 4 is fully shown */
        .grief-section .grief-emphasis {
          background-image: linear-gradient(var(--gold, #c4a265), var(--gold, #c4a265));
          background-repeat: no-repeat;
          background-size: 0% 1px;
          background-position: 0 100%;
          transition: background-size 800ms cubic-bezier(0.22, 1, 0.36, 1) 6300ms;
        }
        .grief-section.is-in .grief-emphasis {
          background-size: 100% 1px;
        }

        /* "remembers" on Beat 2 — soft gold glow that lands with the word */
        .grief-section .grief-verb {
          position: relative;
        }
        .grief-section .grief-verb::after {
          content: "";
          position: absolute;
          inset: -10% -14%;
          background: radial-gradient(circle, rgba(212,178,107,0.22) 0%, rgba(212,178,107,0) 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 700ms ease 2300ms;
          z-index: -1;
        }
        .grief-section.is-in .grief-verb::after {
          opacity: 1;
        }

        /* ── Constellation ── */
        .grief-line {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .grief-section.is-in .grief-line {
          animation: griefLineDraw 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: inherit;
        }
        @keyframes griefLineDraw {
          0%   { stroke-dashoffset: 120; opacity: 0; }
          15%  { opacity: 0.5; }
          100% { stroke-dashoffset: 0;   opacity: 0.5; }
        }

        .grief-star {
          opacity: 0;
          transform-origin: center;
        }
        .grief-section.is-in .grief-star {
          animation: griefStarIn 700ms ease-out forwards;
          animation-delay: inherit;
        }
        @keyframes griefStarIn {
          0%   { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Memory star — the centre point. Awakens later than the
           others, scales up, and then pulses quietly forever. */
        .grief-star.is-memory {
          opacity: 0;
        }
        .grief-section.is-in .grief-star.is-memory {
          animation:
            griefMemoryIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) forwards,
            griefMemoryPulse 4.5s ease-in-out 3800ms infinite;
        }
        @keyframes griefMemoryIn {
          0%   { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 1; transform: scale(1.12); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes griefMemoryPulse {
          0%, 100% { opacity: 1;    transform: scale(1); }
          50%      { opacity: 0.82; transform: scale(1.06); }
        }

        /* ── Rising embers — fewer now ── */
        .grief-ember {
          animation-name: griefEmberRise;
          animation-iteration-count: infinite;
          animation-timing-function: ease-out;
          filter: blur(0.3px);
        }
        @keyframes griefEmberRise {
          0%   { transform: translate(0, 0) scale(0.6);        opacity: 0; }
          8%   { opacity: var(--ember-peak, 0.5); }
          50%  { transform: translate(6px, -50vh) scale(1);     opacity: var(--ember-peak, 0.5); }
          90%  { opacity: var(--ember-peak, 0.5); }
          100% { transform: translate(-4px, -110vh) scale(1.1); opacity: 0; }
        }

        /* ── Motion preferences ── */
        @media (prefers-reduced-motion: reduce) {
          .grief-eyebrow,
          .grief-beat,
          .grief-section.is-in .grief-beat-1,
          .grief-section.is-in .grief-beat-2,
          .grief-section.is-in .grief-beat-3,
          .grief-section.is-in .grief-beat-4,
          .grief-section.is-in .grief-beat-5 {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            transition: none !important;
          }
          .grief-thread,
          .grief-section.is-in .grief-thread {
            animation: none !important;
            height: 56px !important;
            opacity: 0.7 !important;
          }
          .grief-ember,
          .grief-line,
          .grief-star,
          .grief-section.is-in .grief-line,
          .grief-section.is-in .grief-star,
          .grief-section.is-in .grief-star.is-memory {
            animation: none !important;
            opacity: 1 !important;
            stroke-dashoffset: 0 !important;
          }
          .grief-section .grief-emphasis,
          .grief-section.is-in .grief-emphasis,
          .grief-section .grief-verb::after,
          .grief-section.is-in .grief-verb::after {
            transition: none !important;
            background-size: 100% 1px !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};
