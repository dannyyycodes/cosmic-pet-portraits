import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type FunnelPath = "new" | "discover" | "memorial";

interface PathPickerProps {
  /** Current path — controlled by FunnelV2 via useSearchParams. */
  path: FunnelPath;
  /** Optional listener for analytics / side-effects. We intentionally do
   * not scroll the page on selection — the path only swaps sections
   * below and we want the visitor to keep reading from where they are. */
  onPathChange?: (path: FunnelPath) => void;
}

type IntentDef = { value: FunnelPath; label: string };

// Gift has its own dedicated banner/menu entry, so it is intentionally
// NOT an on-funnel intent here. Three paths only.
const INTENTS: IntentDef[] = [
  { value: "new",      label: "I have a new pet" },
  { value: "discover", label: "I want to discover my pet" },
  { value: "memorial", label: "I\u2019ve lost my pet" },
];

/**
 * Intent picker rendered beneath the review rows. Four on-funnel paths;
 * each swaps the copy below (benefits, authority tone, checkout cards)
 * without scrolling the viewport — the visitor stays on the headline
 * and continues to read down. Design: elegant serif italic pills with
 * a soft gold hairline, rose-toned active state. No icons, no sub-copy
 * — the label does the whole job.
 */
export const PathPicker = ({ path, onPathChange }: PathPickerProps) => {
  const [, setSearchParams] = useSearchParams();

  const setPath = useCallback(
    (next: FunnelPath) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "discover") {
            // Default path — keep the URL clean.
            params.delete("path");
          } else {
            params.set("path", next);
          }
          return params;
        },
        { replace: true }
      );
      onPathChange?.(next);
    },
    [setSearchParams, onPathChange]
  );

  return (
    <section
      aria-label="Choose your path"
      className="path-picker-section"
      style={{
        background: "var(--cream, #FFFDF5)",
        padding: "22px 16px 26px",
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <p
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.02rem, 3vw, 1.16rem)",
            color: "var(--earth, #6e6259)",
            margin: 0,
            marginBottom: 14,
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
            const active = path === value;
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
          gap: 8px;
          max-width: 860px;
          margin: 0 auto;
        }
        @media (min-width: 760px) {
          .path-picker-row { gap: 10px; }
        }

        .path-picker-pill {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          background: rgba(255, 253, 245, 0.9);
          border: 1px solid rgba(196, 162, 101, 0.32);
          border-radius: 9999px;
          padding: 10px 18px;
          min-height: 42px;
          color: var(--ink, #1f1c18);
          font-family: "Cormorant", Georgia, serif;
          font-style: italic;
          font-size: 0.98rem;
          letter-spacing: 0.005em;
          line-height: 1.1;
          transition:
            background 220ms ease,
            border-color 220ms ease,
            color 220ms ease,
            box-shadow 220ms ease,
            transform 220ms ease;
          box-shadow: 0 1px 2px rgba(20, 15, 8, 0.03);
          -webkit-tap-highlight-color: transparent;
          outline: none;
          white-space: nowrap;
        }
        @media (min-width: 760px) {
          .path-picker-pill {
            padding: 11px 22px;
            min-height: 44px;
            font-size: 1.04rem;
          }
        }

        .path-picker-pill:focus-visible {
          outline: 2px solid var(--rose, #bf524a);
          outline-offset: 3px;
        }

        @media (hover: hover) {
          .path-picker-pill:hover {
            border-color: rgba(196, 162, 101, 0.55);
            background: rgba(255, 253, 245, 1);
            box-shadow: 0 4px 14px rgba(20, 15, 8, 0.06);
            transform: translateY(-1px);
          }
        }

        .path-picker-pill.is-active {
          color: var(--rose, #bf524a);
          background: rgba(191, 82, 74, 0.05);
          border-color: var(--rose, #bf524a);
          box-shadow:
            0 1px 3px rgba(191, 82, 74, 0.08),
            0 6px 18px rgba(191, 82, 74, 0.08),
            inset 0 0 0 1px rgba(191, 82, 74, 0.08);
        }

        @media (hover: hover) {
          .path-picker-pill.is-active:hover {
            background: rgba(191, 82, 74, 0.07);
            border-color: var(--rose, #bf524a);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .path-picker-pill,
          .path-picker-pill:hover {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
};
