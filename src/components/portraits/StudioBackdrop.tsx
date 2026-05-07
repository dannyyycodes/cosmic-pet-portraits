/**
 * StudioBackdrop — atmospheric layer behind the StudioFlow form column.
 *
 * Three GPU-only parallax layers (rose bloom, gold bloom, drifting starfield)
 * + one cursor-tracked accent. Driven by CSS scroll-driven animations where
 * supported (parallax-webdesign skill rules):
 *   - transform/opacity only
 *   - mobile travel halved via media query in portraits.css
 *   - prefers-reduced-motion disables every transform
 *
 * Pointer events are off so it never intercepts form clicks.
 */
import { useEffect, useRef } from "react";

interface StudioBackdropProps {
  /** When true, blooms brighten + scale + a sweeping rose ring kicks in. */
  active?: boolean;
}

export function StudioBackdrop({ active = false }: StudioBackdropProps = {}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return; // skip on touch

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    function onMove(e: PointerEvent) {
      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalise to roughly -1..1 with soft falloff
      targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
      targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
      if (!raf) raf = requestAnimationFrame(apply);
    }
    function apply() {
      raf = 0;
      el!.style.setProperty("--mx", targetX.toFixed(3));
      el!.style.setProperty("--my", targetY.toFixed(3));
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`ls-studio-backdrop${active ? " ls-studio-backdrop--active" : ""}`}
      aria-hidden
    >
      <div className="ls-studio-bloom ls-studio-bloom--rose" />
      <div className="ls-studio-bloom ls-studio-bloom--gold" />
      <div className="ls-studio-stars" />
      <div className="ls-studio-accent" />
      <div className="ls-studio-pulse" />
    </div>
  );
}
