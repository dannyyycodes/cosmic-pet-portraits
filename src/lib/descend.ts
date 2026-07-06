import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

/* SEAM 4 — the descent (funnel-redesign plan, section 4).
 *
 * CTAs that used to hard-jump to the checkout now ride one animated
 * descent (~1.1s) so the dawn grade and the moon's grey-to-gold
 * crossfade are SEEN, not skipped: the descent is the breath between
 * the emotional reveal and the price.
 *
 * Cancellable by the reader at any moment: any touch, wheel, key or
 * pointer input kills the tween instantly (plus GSAP's own autoKill
 * as a second net). Reduced motion gets an honest instant jump.
 * Bundled GSAP only — first-party CSP safe.
 */

let teardown: (() => void) | null = null;

function cancelDescent() {
  if (teardown) {
    const t = teardown;
    teardown = null;
    t();
  }
}

export function descendTo(target: Element | string, duration = 1.1): void {
  if (typeof window === "undefined") return;
  const el =
    typeof target === "string"
      ? document.querySelector<HTMLElement>(target)
      : (target as HTMLElement);
  if (!el) return;

  cancelDescent();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }

  const onUserInput = () => cancelDescent();
  const tween = gsap.to(window, {
    scrollTo: { y: el, autoKill: true },
    duration,
    ease: "power2.inOut",
    overwrite: "auto",
    onComplete: cancelDescent,
    onInterrupt: cancelDescent,
  });

  window.addEventListener("wheel", onUserInput, { passive: true });
  window.addEventListener("touchstart", onUserInput, { passive: true });
  window.addEventListener("pointerdown", onUserInput, { passive: true });
  window.addEventListener("keydown", onUserInput);

  teardown = () => {
    window.removeEventListener("wheel", onUserInput);
    window.removeEventListener("touchstart", onUserInput);
    window.removeEventListener("pointerdown", onUserInput);
    window.removeEventListener("keydown", onUserInput);
    if (tween.isActive()) tween.kill();
  };
}
