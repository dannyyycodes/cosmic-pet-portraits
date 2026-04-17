import { useEffect, useRef, useState } from "react";

const BEATS: string[] = [
  "For the ones just arrived.",
  "For the ones who are everything.",
  "For the ones you miss.",
];

const BRIDGE_TEXT = "Every little soul is mapped in the stars.";
const TYPE_INTERVAL_MS = 72;
const TYPE_LEAD_IN_MS = 900; // after 640ms pill reveal + a small breath

export const EmotionalVignettes = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [typedCount, setTypedCount] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

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

  useEffect(() => {
    if (!visible) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setTypedCount(BRIDGE_TEXT.length);
      setTypingDone(true);
      return;
    }

    const handles: { iv?: number; stopper?: number } = {};

    const leadIn = window.setTimeout(() => {
      const iv = window.setInterval(() => {
        setTypedCount((c) => {
          if (c >= BRIDGE_TEXT.length) {
            window.clearInterval(iv);
            return c;
          }
          return c + 1;
        });
      }, TYPE_INTERVAL_MS);

      // Safety: stop after full duration
      const stopper = window.setTimeout(() => {
        window.clearInterval(iv);
        setTypingDone(true);
      }, TYPE_INTERVAL_MS * (BRIDGE_TEXT.length + 2));

      handles.iv = iv;
      handles.stopper = stopper;
    }, TYPE_LEAD_IN_MS);

    return () => {
      window.clearTimeout(leadIn);
      if (handles.iv !== undefined) window.clearInterval(handles.iv);
      if (handles.stopper !== undefined) window.clearTimeout(handles.stopper);
    };
  }, [visible]);

  useEffect(() => {
    if (typedCount >= BRIDGE_TEXT.length && visible) {
      setTypingDone(true);
    }
  }, [typedCount, visible]);

  return (
    <div
      ref={sectionRef}
      className={`emotional-triad ${visible ? "is-in" : ""}`}
      style={{ padding: "clamp(16px, 3vw, 24px) 4px" }}
    >
      <div
        className="flex flex-wrap items-center justify-center"
        style={{
          gap: "clamp(12px, 2.2vw, 18px)",
          maxWidth: 920,
          margin: "0 auto",
        }}
      >
        {BEATS.map((beat, i) => (
          <span
            key={i}
            className="triad-pill"
            style={{
              animationDelay: `${i * 180}ms`,
              fontFamily: '"Caveat", cursive',
              fontSize: "clamp(1.8rem, 5.8vw, 2.35rem)",
              fontWeight: 500,
              color: "var(--black, #141210)",
              lineHeight: 1.1,
              letterSpacing: "0.005em",
              background: "rgba(255, 253, 245, 0.85)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(196, 162, 101, 0.32)",
              borderRadius: 9999,
              padding:
                "clamp(16px, 2.8vw, 24px) clamp(28px, 4.5vw, 40px)",
              boxShadow:
                "0 4px 22px rgba(20,15,8,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
              transition:
                "transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms ease, border-color 320ms ease",
              whiteSpace: "nowrap",
              display: "inline-block",
            }}
          >
            {beat}
          </span>
        ))}
      </div>

      {/* Bridge line — mini constellation + cosmic invitation */}
      <div
        className="triad-bridge"
        style={{
          textAlign: "center",
          marginTop: "clamp(28px, 5vw, 42px)",
        }}
      >
        <p
          aria-label={BRIDGE_TEXT}
          style={{
            fontFamily: '"Cormorant", Georgia, serif',
            fontSize: "clamp(1.4rem, 4.6vw, 1.7rem)",
            fontStyle: "italic",
            fontWeight: 500,
            color: "var(--ink, #1f1c18)",
            lineHeight: 1.45,
            letterSpacing: "0.005em",
            margin: 0,
            position: "relative",
            display: "inline-block",
          }}
        >
          {/* Invisible full-string spacer reserves the final layout to prevent jitter */}
          <span aria-hidden="true" style={{ visibility: "hidden" }}>
            {BRIDGE_TEXT}
          </span>
          {/* Overlaid typed substring + caret */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {BRIDGE_TEXT.slice(0, typedCount)}
            <span
              className={`triad-caret ${typingDone ? "triad-caret-fade" : ""}`}
              aria-hidden="true"
            >
              |
            </span>
          </span>
        </p>
      </div>

      <style>{`
        .triad-pill,
        .triad-bridge {
          opacity: 0;
          transform: translateY(10px);
          will-change: opacity, transform;
        }
        .emotional-triad.is-in .triad-pill {
          animation: triadPillIn 760ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .emotional-triad.is-in .triad-bridge {
          animation: triadPillIn 760ms cubic-bezier(0.22,1,0.36,1) forwards;
          animation-delay: 640ms;
        }
        @keyframes triadPillIn {
          to { opacity: 1; transform: translateY(0); }
        }
@media (hover: hover) {
          .triad-pill:hover {
            transform: translateY(-2px);
            box-shadow:
              0 10px 28px rgba(196,162,101,0.18),
              inset 0 1px 0 rgba(255,255,255,0.75);
            border-color: rgba(196,162,101,0.55);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .triad-pill,
          .triad-bridge {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .triad-caret {
            display: none !important;
          }
        }
        .triad-caret {
          display: inline-block;
          margin-left: 1px;
          font-weight: 300;
          color: var(--ink, #1f1c18);
          opacity: 0.7;
          animation: triadCaretBlink 900ms steps(2, end) infinite;
        }
        .triad-caret-fade {
          animation: triadCaretOut 600ms ease-out forwards;
        }
        @keyframes triadCaretBlink {
          50% { opacity: 0; }
        }
        @keyframes triadCaretOut {
          from { opacity: 0.7; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
