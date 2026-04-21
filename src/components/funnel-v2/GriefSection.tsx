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

/* Rising embers — tiny gold specks drifting upward, like candle light
 * caught in motion. Seven particles, staggered delays, varied sizes,
 * absolutely-positioned so they scatter across the section. Pure CSS
 * animation — no JS loop. Respects prefers-reduced-motion. */
type Ember = { x: number; size: number; delay: number; duration: number; opacity: number };
const EMBERS: Ember[] = [
  { x: 12, size: 3,   delay: 0.0, duration: 14, opacity: 0.55 },
  { x: 28, size: 2,   delay: 2.4, duration: 16, opacity: 0.45 },
  { x: 42, size: 4,   delay: 4.8, duration: 13, opacity: 0.6  },
  { x: 56, size: 2.5, delay: 1.2, duration: 18, opacity: 0.5  },
  { x: 68, size: 3,   delay: 6.0, duration: 15, opacity: 0.55 },
  { x: 82, size: 2,   delay: 3.6, duration: 17, opacity: 0.42 },
  { x: 92, size: 3.5, delay: 5.2, duration: 14, opacity: 0.58 },
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
          background: "radial-gradient(circle, rgba(212,178,107,0.95) 0%, rgba(196,162,101,0.55) 45%, rgba(196,162,101,0) 75%)",
          opacity: 0,
          animationDelay: `${e.delay}s`,
          animationDuration: `${e.duration}s`,
          // Custom property pipes peak opacity into the keyframes
          ["--ember-peak" as string]: e.opacity,
        }}
      />
    ))}
  </div>
);

interface GriefSectionProps {
  onCtaClick?: () => void;
}

/**
 * Memorial prelude — a slow, cinematic three-beat reveal shown only on
 * the memorial path, BEFORE any authority or checkout content. Each
 * beat fades up with breath between them; a gold hairline expands from
 * a point to mark the turn from acknowledgment to offer; embers drift
 * upward in the background. Intentionally takes its time — grieving
 * readers should not be rushed through this.
 */
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
        padding: "clamp(76px, 12vw, 128px) 20px clamp(68px, 10vw, 104px)",
      }}
    >
      <DoveWallpaper />
      <EmberDrift />

      {/* Soft aura behind the copy — a radial gold halo that pulses
          gently to echo the embers. Very low opacity; atmospheric. */}
      <div
        aria-hidden="true"
        className="grief-aura"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "min(600px, 90%)",
          aspectRatio: "1 / 1",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(212,178,107,0.12) 0%, rgba(196,162,101,0.05) 40%, rgba(196,162,101,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div
        className="relative max-w-[620px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Beat 1 — acknowledgment. Large italic serif, slow fade-up. */}
        <h2
          className="grief-beat grief-beat-1"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.85rem, 6.2vw, 2.6rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--black, #141210)",
            lineHeight: 1.18,
            letterSpacing: "-0.018em",
            margin: 0,
          }}
        >
          For the ones you still carry
          <br />
          in your heart.
        </h2>

        {/* Beat 2 — validation. Smaller, tender, slightly delayed. */}
        <p
          className="grief-beat grief-beat-2"
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.1rem, 3.4vw, 1.32rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            margin: "clamp(20px, 3vw, 28px) auto 0",
            maxWidth: 460,
          }}
        >
          Even if they&rsquo;re no longer by your side.
        </p>

        {/* Hairline — expands from a point after the first two beats
            land, marking the turn from feeling-seen to the offer. */}
        <span
          aria-hidden="true"
          className="grief-rule"
          style={{
            display: "block",
            height: 1,
            background: "var(--gold, #c4a265)",
            opacity: 0.7,
            margin: "clamp(32px, 5vw, 44px) auto",
          }}
        />

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
        .grief-rule {
          width: 0;
          opacity: 0 !important;
          will-change: width, opacity;
        }
        /* Sequential cadence — each beat lands fully before the next
           starts, with a deliberate breath between them. Grieving
           readers should feel the pause, not be rushed. Timeline:
             Beat 1  : 200ms  → 1300ms   (1100ms fade)
             breath  : 500ms
             Beat 2  : 1800ms → 2800ms   (1000ms fade)
             breath  : 500ms
             Rule    : 3300ms → 4000ms   (700ms expand)
             breath  : 400ms
             Beat 3  : 4400ms → 5500ms   (1100ms fade)
             Emphasis underline : 5700ms → 6500ms */
        .grief-section.is-in .grief-beat-1 {
          animation: griefBeatIn 1100ms cubic-bezier(0.22, 1, 0.36, 1) 200ms forwards;
        }
        .grief-section.is-in .grief-beat-2 {
          animation: griefBeatIn 1000ms cubic-bezier(0.22, 1, 0.36, 1) 1800ms forwards;
        }
        .grief-section.is-in .grief-rule {
          animation: griefRuleExpand 700ms cubic-bezier(0.22, 1, 0.36, 1) 3300ms forwards;
        }
        .grief-section.is-in .grief-beat-3 {
          animation: griefBeatIn 1100ms cubic-bezier(0.22, 1, 0.36, 1) 4400ms forwards;
        }
        @keyframes griefBeatIn {
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes griefRuleExpand {
          to { width: 56px; opacity: 0.7 !important; }
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

        /* ── Rising embers ── */
        .grief-ember {
          animation-name: griefEmberRise;
          animation-iteration-count: infinite;
          animation-timing-function: ease-out;
          filter: blur(0.3px);
        }
        @keyframes griefEmberRise {
          0%   { transform: translate(0, 0) scale(0.6);        opacity: 0; }
          8%   { opacity: var(--ember-peak, 0.55); }
          50%  { transform: translate(6px, -50vh) scale(1);     opacity: var(--ember-peak, 0.55); }
          90%  { opacity: var(--ember-peak, 0.55); }
          100% { transform: translate(-4px, -110vh) scale(1.1); opacity: 0; }
        }

        /* ── Aura pulse ── */
        .grief-aura {
          animation: griefAuraPulse 7s ease-in-out infinite;
        }
        @keyframes griefAuraPulse {
          0%, 100% { opacity: 0.9; }
          50%      { opacity: 1;   }
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
          .grief-rule,
          .grief-section.is-in .grief-rule {
            animation: none !important;
            width: 56px !important;
            opacity: 0.7 !important;
          }
          .grief-ember,
          .grief-aura {
            animation: none !important;
          }
          .grief-section .grief-emphasis,
          .grief-section.is-in .grief-emphasis {
            transition: none !important;
            background-size: 100% 1px !important;
          }
        }
      `}</style>
    </div>
  );
};
