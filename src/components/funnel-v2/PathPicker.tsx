import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { PetWallpaper } from "./CompactReviews";

export type FunnelPath = "new" | "discover" | "memorial";

interface PathPickerProps {
  /** Current selection, or `null` when nothing has been picked yet.
   * When null, no pill carries the active styling and the funnel
   * sections downstream stay hidden — the visitor has to pick. */
  selected: FunnelPath | null;
  /** Fires after the URL updates. Intentionally does not trigger a
   * scroll — FunnelV2 handles the reveal of the sections below. */
  onSelect?: (p: FunnelPath) => void;
}

type IntentDef = { value: FunnelPath; label: string };

// Gift has its own banner/menu entry, so it is intentionally NOT an
// on-funnel intent here. Three paths only.
const INTENTS: IntentDef[] = [
  { value: "new",      label: "I have a new pet" },
  { value: "discover", label: "I want to discover my pet" },
  { value: "memorial", label: "I\u2019ve lost my pet" },
];

/** Tiny 4-pointed gold star — used as the flanking ornament on the
 * active pill. Reads as a spark of light more than a decoration. */
const Spark = ({ side }: { side: "left" | "right" }) => (
  <svg
    className={`pp-spark pp-spark-${side}`}
    width="10"
    height="10"
    viewBox="0 0 10 10"
    aria-hidden="true"
  >
    <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="currentColor" />
  </svg>
);

/**
 * Intent picker. Three vertical-stacked intents; no preselection; the
 * sections below only mount once the visitor picks. Design language:
 * serif italic labels in cream-on-gold chrome, an ink-stroke gold
 * underline tracking the label itself, and twin gold sparks that fade
 * in to flank the active pill.
 */
export const PathPicker = ({ selected, onSelect }: PathPickerProps) => {
  const [, setSearchParams] = useSearchParams();

  const setPath = useCallback(
    (next: FunnelPath) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("path", next);
          return params;
        },
        { replace: true }
      );
      onSelect?.(next);
    },
    [setSearchParams, onSelect]
  );

  const isLanding = selected === null;

  return (
    <section
      aria-label="Choose your path"
      className={`path-picker-section ${isLanding ? "is-landing" : "is-compact"}`}
      style={{
        background: "var(--cream, #FFFDF5)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Pet-icon wallpaper — same Lucide scatter as the review bands
          above, extended down so the landing reads as one continuous
          cream-and-gold canvas rather than three stacked sections. Both
          row datasets are layered for denser coverage on this taller
          container. Only shown on the landing (pre-selection) view — a
          compact post-selection strip doesn't need decoration. */}
      {isLanding && (
        <>
          <PetWallpaper row={1} />
          <PetWallpaper row={2} />
        </>
      )}

      <div className="path-picker-inner max-w-4xl mx-auto text-center" style={{ position: "relative", zIndex: 1 }}>
        <p
          className="path-picker-eyebrow"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            margin: 0,
            letterSpacing: "0.01em",
          }}
        >
          What brings you here today?
        </p>

        {/* Decorative gold hairline beneath the eyebrow — gives the
            prompt its own moment and carries the gold brand line into
            the pill stack. Only shown in landing mode. */}
        {isLanding && (
          <span aria-hidden="true" className="path-picker-eyebrow-rule" />
        )}

        <div
          role="radiogroup"
          aria-label="Funnel path"
          className="path-picker-row"
        >
          {INTENTS.map(({ value, label }) => {
            const active = selected === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPath(value)}
                className={`path-picker-pill ${active ? "is-active" : ""}`}
              >
                {/* Gold sheen at the top edge — faint, ambient depth */}
                <span aria-hidden="true" className="pp-sheen" />

                <span className="path-picker-label-wrap">
                  <Spark side="left" />
                  <span className="path-picker-label">{label}</span>
                  <Spark side="right" />
                  <span aria-hidden="true" className="path-picker-underline" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        /* ══════════════════════════════════════════════════════
           SECTION CHROME
           On landing (no selection yet) the section fills the
           viewport so the visitor sees reviews + pills and
           nothing else. After a pick it collapses to a strip.
           ══════════════════════════════════════════════════════ */
        .path-picker-section.is-landing {
          min-height: calc(100vh - 240px);
          min-height: calc(100svh - 240px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px 20px 52px;
        }
        .path-picker-section.is-compact {
          padding: 26px 16px 32px;
        }

        .path-picker-inner { width: 100%; }

        /* ── Eyebrow prompt ─────────────────────────────────── */
        .is-landing .path-picker-eyebrow {
          font-size: clamp(1.22rem, 4vw, 1.6rem);
          margin-bottom: clamp(18px, 3vw, 24px);
        }
        .is-compact .path-picker-eyebrow {
          font-size: clamp(1.08rem, 3.2vw, 1.24rem);
          margin-bottom: clamp(14px, 2vw, 18px);
        }

        /* Gold hairline under the prompt — lets the eyebrow breathe
           on its own and gives the stack below real distance. Only
           rendered in landing mode. */
        .path-picker-eyebrow-rule {
          display: block;
          width: 44px;
          height: 1px;
          background: var(--gold, #c4a265);
          opacity: 0.55;
          margin: 0 auto clamp(40px, 7vw, 64px);
        }

        /* ══════════════════════════════════════════════════════
           PILL STACK
           Vertical stack so each intent reads as its own moment.
           ══════════════════════════════════════════════════════ */
        .path-picker-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 460px;
          margin: 0 auto;
        }
        .is-landing .path-picker-row {
          gap: clamp(14px, 2.6vw, 18px);
          max-width: 500px;
        }

        /* ══════════════════════════════════════════════════════
           PILL CHROME
           Layered: outer ambient shadow, gold hairline border,
           soft cream → ivory gradient fill, inner top highlight.
           ══════════════════════════════════════════════════════ */
        .path-picker-pill {
          position: relative;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            180deg,
            rgba(255, 253, 245, 0.98) 0%,
            rgba(251, 244, 232, 0.92) 100%
          );
          border: 1px solid rgba(196, 162, 101, 0.32);
          border-radius: 9999px;
          color: var(--ink, #1f1c18);
          font-family: "Cormorant", Georgia, serif;
          font-style: italic;
          letter-spacing: 0.005em;
          line-height: 1.1;
          transition:
            background 320ms ease,
            border-color 320ms ease,
            color 320ms ease,
            box-shadow 320ms ease,
            transform 320ms ease;
          box-shadow:
            0 1px 2px rgba(20, 15, 8, 0.03),
            0 8px 22px rgba(20, 15, 8, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          -webkit-tap-highlight-color: transparent;
          outline: none;
          white-space: nowrap;
          overflow: hidden;
        }

        /* Top-edge gold sheen — very subtle highlight, adds depth */
        .pp-sheen {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 42%;
          background: linear-gradient(
            180deg,
            rgba(212, 178, 107, 0.10) 0%,
            rgba(212, 178, 107, 0) 100%
          );
          pointer-events: none;
        }

        .is-landing .path-picker-pill {
          padding: clamp(18px, 3.2vw, 24px) clamp(24px, 4.5vw, 36px);
          min-height: clamp(62px, 9vw, 76px);
          font-size: clamp(1.1rem, 3.6vw, 1.28rem);
        }
        .is-compact .path-picker-pill {
          padding: 12px 22px;
          min-height: 46px;
          font-size: 1rem;
        }
        @media (min-width: 760px) {
          .is-compact .path-picker-pill {
            padding: 13px 26px;
            min-height: 50px;
            font-size: 1.08rem;
          }
        }

        /* ══════════════════════════════════════════════════════
           LABEL + ORNAMENTS
           Flanking gold sparks fade in on active; the underline
           tracks the label text (not the pill) so it sits neatly
           under the letterforms at any pill size.
           ══════════════════════════════════════════════════════ */
        .path-picker-label-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: clamp(10px, 1.8vw, 14px);
        }

        .path-picker-label {
          position: relative;
          display: inline-block;
          z-index: 1;
        }

        /* Sparks — gold 4-pointed stars flanking the label. Hidden
           by default; fade + gently scale in on active. */
        .pp-spark {
          color: var(--gold, #c4a265);
          opacity: 0;
          transform: scale(0.4) rotate(-6deg);
          transition:
            opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          flex-shrink: 0;
          filter: drop-shadow(0 0 3px rgba(212, 178, 107, 0.45));
        }
        .path-picker-pill.is-active .pp-spark {
          opacity: 0.95;
          transform: scale(1) rotate(0deg);
        }
        .path-picker-pill.is-active .pp-spark-right {
          transition-delay: 60ms;
        }

        /* Ink-stroke gold underline — tracks the label itself. */
        .path-picker-underline {
          position: absolute;
          left: 50%;
          bottom: -7px;
          height: 1px;
          width: 0;
          background: linear-gradient(
            90deg,
            rgba(196,162,101,0) 0%,
            rgba(196,162,101,1) 20%,
            rgba(196,162,101,1) 80%,
            rgba(196,162,101,0) 100%
          );
          transform: translateX(-50%);
          transition: width 380ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          opacity: 0.85;
        }

        /* ══════════════════════════════════════════════════════
           INTERACTION STATES
           ══════════════════════════════════════════════════════ */
        .path-picker-pill:focus-visible {
          outline: 2px solid var(--rose, #bf524a);
          outline-offset: 3px;
        }

        @media (hover: hover) {
          .path-picker-pill:hover {
            border-color: rgba(196, 162, 101, 0.62);
            background: linear-gradient(
              180deg,
              rgba(255, 253, 245, 1) 0%,
              rgba(252, 244, 232, 1) 100%
            );
            transform: translateY(-2px);
            box-shadow:
              0 2px 4px rgba(20, 15, 8, 0.04),
              0 16px 34px rgba(20, 15, 8, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
          }
          .path-picker-pill:hover .path-picker-underline {
            width: calc(100% - 4px);
            background: linear-gradient(
              90deg,
              rgba(196,162,101,0) 0%,
              rgba(212,178,107,1) 20%,
              rgba(212,178,107,1) 80%,
              rgba(196,162,101,0) 100%
            );
          }
        }

        .path-picker-pill.is-active {
          color: var(--rose, #bf524a);
          background: linear-gradient(
            180deg,
            #FFFDF5 0%,
            #fbf2e4 100%
          );
          border-color: var(--rose, #bf524a);
          box-shadow:
            0 0 0 4px rgba(191, 82, 74, 0.05),
            0 3px 6px rgba(191, 82, 74, 0.10),
            0 16px 36px rgba(191, 82, 74, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.85);
        }
        .path-picker-pill.is-active .path-picker-underline {
          width: calc(100% - 4px);
          background: linear-gradient(
            90deg,
            rgba(191,82,74,0) 0%,
            rgba(212,178,107,1) 20%,
            rgba(212,178,107,1) 80%,
            rgba(191,82,74,0) 100%
          );
          opacity: 1;
        }

        @media (hover: hover) {
          .path-picker-pill.is-active:hover {
            border-color: var(--rose, #bf524a);
            transform: translateY(-2px);
          }
        }

        /* ══════════════════════════════════════════════════════
           MOTION PREFERENCES
           ══════════════════════════════════════════════════════ */
        @media (prefers-reduced-motion: reduce) {
          .path-picker-pill,
          .path-picker-pill:hover,
          .path-picker-underline,
          .pp-spark {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
};
