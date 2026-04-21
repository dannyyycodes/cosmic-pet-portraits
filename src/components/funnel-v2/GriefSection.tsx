import React, { useEffect, useRef, useState } from "react";

/**
 * GriefSection — memorial prelude.
 *
 * Copy is unchanged. Reveals redone as a word-by-word cascade so
 * each beat is unmistakably sequential: you see the sentence land
 * one word at a time, then a clear breath, then the next beat. No
 * more blur-fade overlap between beats.
 *
 * Atmosphere kept (background vignette, orrery, distant starlight).
 * No new decorative elements. Sigil removed per direction.
 */

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
    <circle cx="200" cy="200" r="200" fill="url(#orreryCore)" />
    <circle cx="200" cy="200" r="84"  fill="none" stroke="#c4a265" strokeWidth="0.7" strokeDasharray="1 5" opacity="0.6" />
    <circle cx="200" cy="200" r="128" fill="none" stroke="#c4a265" strokeWidth="0.6" strokeDasharray="2 7" opacity="0.5" />
    <circle cx="200" cy="200" r="176" fill="none" stroke="#c4a265" strokeWidth="0.5" strokeDasharray="1 9" opacity="0.4" />
    <g>
      <circle cx="284" cy="200" r="2.2" fill="#c4a265" opacity="0.8" />
      <circle cx="200" cy="72"  r="2"   fill="#bf524a" opacity="0.7" />
      <circle cx="136" cy="310" r="1.8" fill="#c4a265" opacity="0.65" />
    </g>
  </svg>
);

/* Word cascade — splits a string into per-word spans so each word
 * animates in with its own delay. Preserves explicit <br/>s via a
 * `|` separator passed by the caller. `base` is the delay (ms) at
 * which the first word of the beat begins; `step` is the per-word
 * stagger. `children` allows embedding a React node (the rose-
 * emphasised "a keepsake") inline; it is treated as a single
 * animated unit. */
type Node = string | { emphasis: React.ReactNode; key?: string };
const WordCascade = ({
  nodes,
  base,
  step = 80,
}: {
  nodes: Node[];
  base: number;
  step?: number;
}) => {
  let wordIndex = 0;
  return (
    <>
      {nodes.map((n, i) => {
        if (typeof n === "string") {
          // Break string on newlines + spaces. Newlines become <br/>s.
          const lines = n.split("\n");
          return (
            <React.Fragment key={i}>
              {lines.map((line, li) => {
                const words = line.split(" ").filter(Boolean);
                return (
                  <React.Fragment key={li}>
                    {li > 0 && <br />}
                    {words.map((w, wi) => {
                      const delay = base + wordIndex * step;
                      wordIndex += 1;
                      return (
                        <span
                          key={`${i}-${li}-${wi}`}
                          className="grief-word"
                          style={{ animationDelay: `${delay}ms` }}
                        >
                          {w}
                          {/* Keep the trailing space outside the animated
                              span so wrapping is natural, but make sure
                              we always render one after each word. */}
                          {wi < words.length - 1 ? " " : ""}
                        </span>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        }
        // Emphasis node — treat as a single cascade step.
        const delay = base + wordIndex * step;
        wordIndex += 1;
        return (
          <span
            key={n.key ?? `emph-${i}`}
            className="grief-word"
            style={{ animationDelay: `${delay}ms` }}
          >
            {n.emphasis}
          </span>
        );
      })}
    </>
  );
};

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

  /* Cadence — each beat's last word lands with ~600ms of breath
   * before the next beat's first word begins.
   *
   *   Beat 1 first word : 300ms
   *   (8 words × 80ms = 640ms stagger + 700ms fade) → last word fully in at 1640ms
   *   breath 660ms
   *   Beat 2 first word : 2300ms
   *   (8 words × 80ms = 640ms stagger + 700ms fade) → last word in at 3640ms
   *   breath 660ms
   *   Beat 3 first word : 4300ms
   *   (16 units × 80ms = 1280ms + 700ms fade) → last word in at 6280ms
   *   Emphasis underline : 6500ms → 7300ms */
  const T1 = 300;
  const T2 = 2300;
  const T3 = 4300;
  const TU = 6500;

  return (
    <div
      ref={ref}
      className={`grief-section relative overflow-hidden ${visible ? "is-in" : ""}`}
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 22%, rgba(212,178,107,0.13) 0%, rgba(212,178,107,0.04) 45%, rgba(255,253,245,0) 75%), var(--cream, #FFFDF5)",
        padding: "clamp(88px, 13vw, 140px) 20px clamp(80px, 11vw, 120px)",
        ["--grief-underline-delay" as string]: `${TU}ms`,
      }}
    >
      <Orrery />
      <Starlight />

      <div
        className="relative max-w-[640px] mx-auto text-center"
        style={{ zIndex: 1 }}
      >
        {/* Beat 1 — acknowledgment */}
        <h2
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
          <WordCascade
            base={T1}
            nodes={["For the ones you still carry\nin your heart."]}
          />
        </h2>

        {/* Beat 2 — validation */}
        <p
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.1rem, 3.4vw, 1.32rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            margin: "clamp(26px, 3.5vw, 36px) auto 0",
            maxWidth: 460,
          }}
        >
          <WordCascade
            base={T2}
            nodes={["Even if they’re no longer by your side."]}
          />
        </p>

        {/* Beat 3 — offer */}
        <p
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.18rem, 3.6vw, 1.4rem)",
            fontStyle: "italic",
            color: "var(--ink, #1f1c18)",
            lineHeight: 1.55,
            margin: "clamp(34px, 5.2vw, 50px) auto 0",
            maxWidth: 520,
          }}
        >
          <WordCascade
            base={T3}
            nodes={[
              "A reading for the space they left —\n",
              {
                key: "emph",
                emphasis: (
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
                  </em>
                ),
              },
              " for the days you need them.",
            ]}
          />
        </p>
      </div>

      <style>{`
        /* ── Per-word reveal — the sequential cascade ── */
        .grief-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(12px);
          will-change: opacity, transform;
        }
        .grief-section.is-in .grief-word {
          animation: griefWordIn 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: inherit;
        }
        @keyframes griefWordIn {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Emphasis — gold underline draws after all three beats have
           fully landed. Delay is piped in via --grief-underline-delay
           so timing lives next to the cadence constants in TS. */
        .grief-section .grief-emphasis {
          background-image: linear-gradient(var(--gold, #c4a265), var(--gold, #c4a265));
          background-repeat: no-repeat;
          background-size: 0% 1px;
          background-position: 0 100%;
          transition: background-size 800ms cubic-bezier(0.22, 1, 0.36, 1) var(--grief-underline-delay, 6500ms);
        }
        .grief-section.is-in .grief-emphasis {
          background-size: 100% 1px;
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
          .grief-word,
          .grief-section.is-in .grief-word {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .grief-section .grief-emphasis,
          .grief-section.is-in .grief-emphasis {
            transition: none !important;
            background-size: 100% 1px !important;
          }
          .grief-orrery,
          .grief-section.is-in .grief-orrery { animation: none !important; opacity: 0.32 !important; }
          .grief-starlight { animation: none !important; opacity: 0.55 !important; }
        }
      `}</style>
    </div>
  );
};
