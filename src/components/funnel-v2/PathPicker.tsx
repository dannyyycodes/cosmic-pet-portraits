import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

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

/**
 * Intent picker rendered beneath the review rows. No preselection: the
 * visitor lands and picks one — the funnel sections below only mount
 * after that pick. Visual language: serif-italic labels, a gold hair
 * underline that strokes in on hover and stays full-width when active,
 * a rose-tinted fill + soft rose halo for the active pill.
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

  return (
    <section
      aria-label="Choose your path"
      className="path-picker-section"
      style={{
        background: "var(--cream, #FFFDF5)",
        padding: "28px 16px 34px",
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <p
          className="path-picker-eyebrow"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.08rem, 3.2vw, 1.24rem)",
            color: "var(--earth, #6e6259)",
            margin: 0,
            marginBottom: 18,
            letterSpacing: "0.01em",
          }}
        >
          What brings you here today?
        </p>

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
                <span className="path-picker-label">{label}</span>
                <span aria-hidden="true" className="path-picker-underline" />
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .path-picker-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          max-width: 860px;
          margin: 0 auto;
        }
        @media (min-width: 760px) {
          .path-picker-row { gap: 14px; }
        }

        .path-picker-pill {
          position: relative;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          background: rgba(255, 253, 245, 0.92);
          border: 1px solid rgba(196, 162, 101, 0.28);
          border-radius: 9999px;
          padding: 12px 22px;
          min-height: 46px;
          color: var(--ink, #1f1c18);
          font-family: "Cormorant", Georgia, serif;
          font-style: italic;
          font-size: 1rem;
          letter-spacing: 0.005em;
          line-height: 1.1;
          transition:
            background 260ms ease,
            border-color 260ms ease,
            color 260ms ease,
            box-shadow 260ms ease,
            transform 260ms ease;
          box-shadow:
            0 1px 2px rgba(20, 15, 8, 0.03),
            0 4px 14px rgba(20, 15, 8, 0.03);
          -webkit-tap-highlight-color: transparent;
          outline: none;
          white-space: nowrap;
        }
        @media (min-width: 760px) {
          .path-picker-pill {
            padding: 13px 26px;
            min-height: 50px;
            font-size: 1.08rem;
          }
        }

        .path-picker-label {
          position: relative;
          display: inline-block;
          z-index: 1;
        }

        /* Ink-stroke gold underline beneath the label. Strokes from
           centre outward on hover, sits full-width on active. */
        .path-picker-underline {
          position: absolute;
          left: 50%;
          bottom: 8px;
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
          transition: width 360ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
          opacity: 0.85;
        }

        .path-picker-pill:focus-visible {
          outline: 2px solid var(--rose, #bf524a);
          outline-offset: 3px;
        }

        @media (hover: hover) {
          .path-picker-pill:hover {
            border-color: rgba(196, 162, 101, 0.55);
            background: #FFFDF5;
            transform: translateY(-1px);
            box-shadow:
              0 4px 14px rgba(20, 15, 8, 0.05),
              0 10px 28px rgba(20, 15, 8, 0.06);
          }
          .path-picker-pill:hover .path-picker-underline {
            width: calc(100% - 52px);
          }
        }

        .path-picker-pill.is-active {
          color: var(--rose, #bf524a);
          background:
            linear-gradient(180deg, rgba(255,253,245,1) 0%, rgba(252,244,236,0.98) 100%);
          border-color: var(--rose, #bf524a);
          box-shadow:
            0 2px 4px rgba(191, 82, 74, 0.08),
            0 10px 28px rgba(191, 82, 74, 0.12),
            inset 0 0 0 1px rgba(191, 82, 74, 0.08);
        }
        .path-picker-pill.is-active .path-picker-underline {
          width: calc(100% - 52px);
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
            background:
              linear-gradient(180deg, rgba(255,253,245,1) 0%, rgba(252,244,236,1) 100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .path-picker-pill,
          .path-picker-pill:hover,
          .path-picker-underline {
            transition: none !important;
            transform: none !important;
          }
          .path-picker-pill:hover { transform: none !important; }
        }
      `}</style>
    </section>
  );
};
