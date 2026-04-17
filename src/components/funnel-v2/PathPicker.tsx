import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, Compass, Feather, Gift } from "lucide-react";

export type FunnelPath = "new" | "discover" | "memorial" | "gift";

interface PathPickerProps {
  /** Current path — controlled by FunnelV2 via useSearchParams. */
  path: FunnelPath;
  /** Called after the path param updates so FunnelV2 can scroll to
   * the ProductReveal section. Skipped when reduced motion is on. */
  onPathChange?: (path: FunnelPath) => void;
}

/** Detect user's motion preference once (client-only). */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

type IntentDef = {
  value: FunnelPath;
  label: string;
  sub: string;
  Icon: typeof Sparkles;
};

const INTENTS: IntentDef[] = [
  { value: "new",      label: "I have a new pet",          sub: "just arrived",         Icon: Sparkles },
  { value: "discover", label: "I want to discover my pet", sub: "understand them",      Icon: Compass },
  { value: "memorial", label: "I\u2019ve lost my pet",     sub: "in loving memory",     Icon: Feather },
  { value: "gift",     label: "I\u2019m gifting a loved one", sub: "for someone dear",  Icon: Gift },
];

/**
 * Intent picker rendered beneath the review rows. All four paths now
 * live as on-funnel states (gift no longer navigates away); FunnelV2
 * reads `?path=` and swaps the sections + authority copy accordingly.
 *
 * Visual: gold-hairline cards with a small lucide icon, title + small
 * subcue. Active card picks up a rose border, soft rose glow and a tiny
 * gold spark above the icon. On mobile we fall to a 2-col grid; on
 * desktop the cards sit in a single row.
 */
export const PathPicker = ({ path, onPathChange }: PathPickerProps) => {
  const [, setSearchParams] = useSearchParams();

  const setPath = useCallback(
    (next: FunnelPath) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "discover") {
            // Keep the URL clean for the default path.
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

  const reduced = prefersReducedMotion();

  return (
    <section
      aria-label="Choose your path"
      className="path-picker-section"
      style={{
        background: "var(--cream, #FFFDF5)",
        padding: "22px 16px 26px",
      }}
    >
      <div className="max-w-3xl mx-auto text-center">
        <p
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.05rem, 3.2vw, 1.2rem)",
            color: "var(--earth, #6e6259)",
            margin: 0,
            marginBottom: 16,
          }}
        >
          What brings you here today?
        </p>

        <div
          role="radiogroup"
          aria-label="Funnel path"
          className="path-picker-grid"
        >
          {INTENTS.map(({ value, label, sub, Icon }) => {
            const active = path === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPath(value)}
                className={`path-picker-card ${active ? "is-active" : ""} ${reduced ? "is-reduced" : ""}`}
              >
                {/* Small gold spark above the icon — visible only when active */}
                <span aria-hidden="true" className="path-picker-spark">
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="currentColor" />
                  </svg>
                </span>

                <span className="path-picker-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.5} />
                </span>

                <span className="path-picker-label">{label}</span>
                <span className="path-picker-sub">{sub}</span>

                {/* Gold hairline beneath the label on active */}
                <span aria-hidden="true" className="path-picker-rule" />
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .path-picker-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          max-width: 640px;
          margin: 0 auto;
        }
        @media (min-width: 760px) {
          .path-picker-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            max-width: 920px;
            gap: 12px;
          }
        }

        .path-picker-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 4px;
          padding: 16px 14px 18px;
          min-height: 108px;
          border-radius: 18px;
          cursor: pointer;
          text-align: center;
          background:
            linear-gradient(180deg, rgba(255,253,245,0.96) 0%, rgba(250,244,232,0.9) 100%);
          border: 1px solid rgba(196, 162, 101, 0.24);
          color: var(--ink, #1f1c18);
          box-shadow:
            0 1px 2px rgba(20,15,8,0.04),
            0 6px 18px rgba(20,15,8,0.04),
            inset 0 1px 0 rgba(255,255,255,0.7);
          transition:
            transform 260ms cubic-bezier(0.22,1,0.36,1),
            background 260ms ease,
            border-color 260ms ease,
            color 260ms ease,
            box-shadow 260ms ease;
          outline: none;
          overflow: hidden;
          -webkit-tap-highlight-color: transparent;
        }
        .path-picker-card.is-reduced { transition: none; }

        .path-picker-card::before {
          /* Subtle gold sheen at the top edge */
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 38%;
          background: linear-gradient(180deg, rgba(212,178,107,0.12) 0%, transparent 100%);
          pointer-events: none;
        }

        .path-picker-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #faf4e8 0%, #f3eadb 100%);
          border: 1px solid rgba(196,162,101,0.32);
          color: var(--earth, #6e6259);
          margin-bottom: 6px;
          transition: background 260ms ease, color 260ms ease, border-color 260ms ease,
                      box-shadow 260ms ease, transform 260ms ease;
          position: relative;
          z-index: 1;
        }

        .path-picker-label {
          font-family: "DM Serif Display", Georgia, serif;
          font-size: 0.92rem;
          line-height: 1.15;
          letter-spacing: -0.005em;
          color: var(--ink, #1f1c18);
          position: relative;
          z-index: 1;
        }
        @media (min-width: 760px) {
          .path-picker-label { font-size: 0.98rem; }
        }

        .path-picker-sub {
          font-family: Cormorant, Georgia, serif;
          font-style: italic;
          font-size: 0.78rem;
          color: var(--muted, #958779);
          margin-top: 2px;
          position: relative;
          z-index: 1;
        }

        .path-picker-rule {
          display: block;
          width: 0;
          height: 1px;
          margin-top: 10px;
          background: var(--gold, #c4a265);
          opacity: 0;
          transition: width 320ms ease, opacity 320ms ease;
        }

        .path-picker-spark {
          position: absolute;
          top: 10px;
          right: 12px;
          color: var(--gold, #c4a265);
          opacity: 0;
          transform: scale(0.6) rotate(-8deg);
          transition: opacity 300ms ease, transform 300ms ease;
        }

        .path-picker-card.is-active {
          border-color: var(--rose, #bf524a);
          color: var(--rose, #bf524a);
          background:
            linear-gradient(180deg, rgba(255,253,245,1) 0%, rgba(252,244,236,0.98) 100%);
          box-shadow:
            0 2px 4px rgba(191,82,74,0.05),
            0 10px 28px rgba(191,82,74,0.10),
            inset 0 1px 0 rgba(255,255,255,0.8),
            inset 0 0 0 1px rgba(191,82,74,0.06);
        }
        .path-picker-card.is-active .path-picker-icon {
          color: var(--rose, #bf524a);
          background: linear-gradient(135deg, rgba(191,82,74,0.06) 0%, rgba(212,178,107,0.12) 100%);
          border-color: rgba(191,82,74,0.42);
          box-shadow: 0 0 0 3px rgba(191,82,74,0.06), 0 2px 8px rgba(191,82,74,0.10);
        }
        .path-picker-card.is-active .path-picker-label {
          color: var(--rose, #bf524a);
        }
        .path-picker-card.is-active .path-picker-rule {
          width: 28px;
          opacity: 0.65;
        }
        .path-picker-card.is-active .path-picker-spark {
          opacity: 1;
          transform: scale(1) rotate(0deg);
        }

        .path-picker-card:focus-visible {
          outline: 2px solid var(--rose, #bf524a);
          outline-offset: 3px;
        }

        @media (hover: hover) {
          .path-picker-card:hover {
            transform: translateY(-2px);
            border-color: rgba(196,162,101,0.45);
            box-shadow:
              0 4px 10px rgba(20,15,8,0.05),
              0 14px 30px rgba(20,15,8,0.08),
              inset 0 1px 0 rgba(255,255,255,0.75);
          }
          .path-picker-card:hover .path-picker-icon {
            color: var(--ink, #1f1c18);
            border-color: rgba(196,162,101,0.55);
          }
          .path-picker-card.is-active:hover {
            transform: translateY(-2px);
            border-color: var(--rose, #bf524a);
          }
          .path-picker-card.is-active:hover .path-picker-icon {
            color: var(--rose, #bf524a);
            border-color: rgba(191,82,74,0.55);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .path-picker-card,
          .path-picker-card:hover,
          .path-picker-icon,
          .path-picker-rule,
          .path-picker-spark {
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};
