import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export type FunnelPath = "discover" | "memorial";

interface PathPickerProps {
  /** Current path — controlled by FunnelV2 via useSearchParams */
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

/**
 * Intent picker rendered beneath the review rows. Filters the on-page
 * funnel into Discover (default) or Memorial, or navigates away to the
 * existing /gift route. The first two chips live in a radiogroup; Gift
 * is a separate navigating button for clarity.
 */
export const PathPicker = ({ path, onPathChange }: PathPickerProps) => {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  const handleGift = useCallback(() => {
    navigate("/gift");
  }, [navigate]);

  const reduced = prefersReducedMotion();

  // Chip style factory — active chips pick up the rose tint, inactives
  // stay cream with a sand border. Kept as inline styles to match the
  // rest of the funnel-v2 design language.
  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "Cormorant, Georgia, serif",
    fontSize: "0.95rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    padding: "10px 20px",
    minHeight: 44,
    borderRadius: 9999,
    cursor: "pointer",
    background: active
      ? "rgba(191,82,74,0.08)"
      : "rgba(255,253,245,0.85)",
    border: active
      ? "1px solid var(--rose, #bf524a)"
      : "1px solid var(--sand, #d6c8b6)",
    color: active ? "var(--rose, #bf524a)" : "var(--ink, #1f1c18)",
    boxShadow: active
      ? "0 2px 12px rgba(191,82,74,0.08)"
      : "0 1px 6px rgba(20,15,8,0.04)",
    transition: reduced
      ? "none"
      : "transform 220ms cubic-bezier(0.22,1,0.36,1), background 220ms ease, border-color 220ms ease, color 220ms ease, box-shadow 220ms ease",
    WebkitBackdropFilter: "blur(6px)",
    backdropFilter: "blur(6px)",
    outline: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
  });

  return (
    <section
      aria-label="Choose your path"
      className="path-picker-section"
      style={{
        background: "var(--cream, #FFFDF5)",
        padding: "18px 16px 22px",
      }}
    >
      <div className="max-w-xl mx-auto text-center">
        <p
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.05rem, 3.2vw, 1.2rem)",
            color: "var(--earth, #6e6259)",
            margin: 0,
            marginBottom: 12,
          }}
        >
          What brings you here today?
        </p>

        <div
          role="radiogroup"
          aria-label="Funnel path"
          className="flex flex-wrap items-center justify-center"
          style={{ gap: 10 }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={path === "discover"}
            onClick={() => setPath("discover")}
            style={chipStyle(path === "discover")}
            className="path-picker-chip"
          >
            Discover my pet
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={path === "memorial"}
            onClick={() => setPath("memorial")}
            style={chipStyle(path === "memorial")}
            className="path-picker-chip"
          >
            I&rsquo;ve lost a pet
          </button>

          <button
            type="button"
            onClick={handleGift}
            style={chipStyle(false)}
            className="path-picker-chip"
            aria-label="Gift for someone — opens gift page"
          >
            Gift for someone
          </button>
        </div>
      </div>

      <style>{`
        .path-picker-chip:focus-visible {
          outline: 2px solid var(--rose, #bf524a);
          outline-offset: 2px;
        }
        @media (hover: hover) {
          .path-picker-chip:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 18px rgba(20,15,8,0.08);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .path-picker-chip,
          .path-picker-chip:hover {
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};
