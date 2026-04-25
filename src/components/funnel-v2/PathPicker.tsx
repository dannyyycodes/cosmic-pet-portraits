import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { HeartsBackdrop } from "./HeartsBackdrop";

export type FunnelPath = "new" | "discover" | "memorial";

interface PathPickerProps {
  /** Current selection, or `null` when nothing has been picked yet.
   * When null, no row carries the active styling and the funnel
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
  { value: "memorial", label: "I’ve lost my pet" },
];

/**
 * Intent picker — magazine table-of-contents pattern. Three text rows
 * separated by sand hairlines, no pill chrome, no shimmer, no halo.
 * The eyebrow prompt sits above a single gold rule. Heart wallpaper
 * (matched to the benefits/checkout band) drifts behind the cream.
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
      style={{ background: "var(--cream, #FFFDF5)" }}
    >
      <HeartsBackdrop />

      <div className="path-picker-inner max-w-[560px] mx-auto">
        <div className="path-picker-card text-center">
          <p className="path-picker-eyebrow">What brings you here today?</p>

          <span aria-hidden="true" className="path-picker-rule" />

          <div role="radiogroup" aria-label="Funnel path" className="path-picker-list">
          {INTENTS.map(({ value, label }, i) => {
            const active = selected === value;
            const isLast = i === INTENTS.length - 1;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPath(value)}
                className={`path-picker-row ${active ? "is-active" : ""} ${isLast ? "is-last" : ""}`}
              >
                <span className="path-picker-label">{label}</span>
                <span aria-hidden="true" className="path-picker-arrow">&rarr;</span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <style>{`
        .path-picker-section {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .path-picker-section.is-landing {
          min-height: calc(100vh - 240px);
          min-height: calc(100svh - 240px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 24px 80px;
        }
        .path-picker-section.is-compact {
          padding: 40px 24px 48px;
        }

        .path-picker-inner {
          width: 100%;
          position: relative;
          z-index: 1;
        }

        /* ── Translucent cream card so the heart wallpaper doesn't
              interfere with the text. Soft gold hairline + light blur,
              no hover lift. ────────────────────────────────────── */
        .path-picker-card {
          background: rgba(255, 253, 245, 0.92);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          border: 1px solid rgba(196, 162, 101, 0.16);
          border-radius: 18px;
          box-shadow: 0 4px 28px rgba(0, 0, 0, 0.04);
        }
        .is-landing .path-picker-card {
          padding: clamp(40px, 6vw, 56px) clamp(24px, 4vw, 40px);
        }
        .is-compact .path-picker-card {
          padding: clamp(24px, 3.6vw, 32px) clamp(20px, 3vw, 32px);
        }

        /* ── Eyebrow prompt ─────────────────────────────────── */
        .path-picker-eyebrow {
          font-family: "Cormorant", Georgia, serif;
          font-style: italic;
          color: var(--earth, #6e6259);
          margin: 0;
          letter-spacing: 0.005em;
          text-wrap: balance;
        }
        .is-landing .path-picker-eyebrow {
          font-size: clamp(1.32rem, 4.4vw, 1.7rem);
        }
        .is-compact .path-picker-eyebrow {
          font-size: clamp(1.12rem, 3.4vw, 1.28rem);
        }

        /* ── Single gold hairline rule ─────────────────────── */
        .path-picker-rule {
          display: block;
          width: 32px;
          height: 1px;
          background: var(--gold, #c4a265);
          opacity: 0.55;
          margin: clamp(20px, 3vw, 28px) auto clamp(48px, 7vw, 64px);
        }
        .is-compact .path-picker-rule {
          margin: clamp(16px, 2.4vw, 22px) auto clamp(28px, 4vw, 36px);
        }

        /* ── Row stack ─────────────────────────────────────── */
        .path-picker-list {
          display: flex;
          flex-direction: column;
          max-width: 460px;
          margin: 0 auto;
          border-top: 1px solid var(--sand, #e8ddd0);
        }

        .path-picker-row {
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          border: 0;
          border-bottom: 1px solid var(--sand, #e8ddd0);
          border-left: 4px solid transparent;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(20px, 3.4vw, 26px) clamp(16px, 3vw, 22px);
          color: var(--ink, #3d2f2a);
          font-family: "Cormorant", Georgia, serif;
          font-style: italic;
          line-height: 1.2;
          text-align: left;
          transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;
          -webkit-tap-highlight-color: transparent;
          outline: none;
        }
        .is-landing .path-picker-row {
          font-size: clamp(1.18rem, 4vw, 1.42rem);
        }
        .is-compact .path-picker-row {
          font-size: 1.08rem;
        }

        .path-picker-label {
          flex: 1;
        }

        .path-picker-arrow {
          font-family: "Cormorant", Georgia, serif;
          font-style: normal;
          font-size: 1.2em;
          color: var(--report-muted, #9a8578);
          margin-left: 16px;
          transition: transform 220ms ease, color 200ms ease;
          line-height: 1;
        }

        /* ── Interaction ───────────────────────────────────── */
        .path-picker-row:focus-visible {
          outline: 2px solid var(--rose, #bf524a);
          outline-offset: -2px;
        }
        @media (hover: hover) {
          .path-picker-row:hover {
            background-color: var(--cream-2, #faf6ef);
          }
          .path-picker-row:hover .path-picker-arrow {
            transform: translateX(4px);
            color: var(--rose, #bf524a);
          }
        }

        .path-picker-row.is-active {
          color: var(--rose, #bf524a);
          border-left-color: var(--rose, #bf524a);
          background-color: var(--cream-2, #faf6ef);
        }
        .path-picker-row.is-active .path-picker-arrow {
          color: var(--rose, #bf524a);
          transform: translateX(4px);
        }

        @media (prefers-reduced-motion: reduce) {
          .path-picker-row,
          .path-picker-arrow {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
};
