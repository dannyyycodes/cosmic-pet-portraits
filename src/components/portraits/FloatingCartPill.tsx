/**
 * FloatingCartPill — bottom-right cart affordance for /portraits.
 *
 * Phase 3 of the Cosmic Pet Portraits launch plan.
 * Spec source: vault/01-projects/little-souls/pet-portraits/research-2026-05-04-cart-upsell-ux.md §1
 *
 * Behaviour:
 *   • Hidden when cart is empty.
 *   • First add (0 → 1): expanded mini-card "1 item · £49 · View basket →"
 *     with 600ms scale-bounce + icon ring pulse, then collapses to 56×56
 *     circular FAB after 2.5s.
 *   • Subsequent adds: count badge pops, subtotal counts up over 400ms,
 *     brief 400ms re-expansion to mini-card then back to FAB.
 *   • Auto-hide on scroll-down ≥80px, reveal on scroll-up.
 *   • Tap opens the existing CartDrawer via `onOpen` callback.
 *   • aria-live region announces every add for screen readers.
 *   • Respects prefers-reduced-motion.
 *
 * Cart subscription:
 *   The cart state lives as `useState<CartItem[]>` inside the page
 *   components (Portraits.tsx, PortraitsTemplates.tsx). Rather than
 *   refactor that into a context, this component reads from the
 *   `loadCart()` localStorage helper and listens for a cross-component
 *   custom event `ls:cart-changed` that the page dispatches whenever
 *   it mutates cart state. Storage events also work for cross-tab sync.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { PALETTE, EASE } from "./tokens";
import { loadCart, cartCount as countCart, cartSubtotalMajor } from "./cart";

const EXPANDED_HOLD_MS = 2500;     // first-add expanded duration
const RE_EXPAND_HOLD_MS = 400;     // subsequent-add brief re-expand
const SCROLL_HIDE_DELTA = 80;      // px scroll-down before hiding
const SUBTOTAL_TWEEN_MS = 400;     // count-up duration for subtotal

/** Tiny number tween hook — eases displayed value toward target over `ms`. */
function useNumberTween(target: number, ms: number, reduce: boolean): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduce || ms <= 0) {
      setDisplay(target);
      return;
    }
    fromRef.current = display;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / ms);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = fromRef.current + (target - fromRef.current) * eased;
      setDisplay(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ms, reduce]);

  return display;
}

/** Visually-hidden styles for the aria-live announcer. */
const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

interface FloatingCartPillProps {
  /** Open the existing CartDrawer. */
  onOpen: () => void;
  /** Whether the drawer is currently open — drives `aria-expanded`. */
  drawerOpen?: boolean;
}

export function FloatingCartPill({ onOpen, drawerOpen = false }: FloatingCartPillProps) {
  const reduce = !!useReducedMotion();

  // ── Cart subscription ─────────────────────────────────────────────
  const [count, setCount] = useState<number>(() => countCart(loadCart()));
  const [subtotal, setSubtotal] = useState<number>(() => cartSubtotalMajor(loadCart()));
  const [lastAddLabel, setLastAddLabel] = useState<string>("");

  useEffect(() => {
    const sync = () => {
      const items = loadCart();
      setCount(countCart(items));
      setSubtotal(cartSubtotalMajor(items));
    };
    const onCartChanged = (e: Event) => {
      sync();
      const detail = (e as CustomEvent<{ label?: string }>).detail;
      if (detail?.label) setLastAddLabel(detail.label);
    };
    window.addEventListener("ls:cart-changed", onCartChanged as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ls:cart-changed", onCartChanged as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // ── Expanded ↔ FAB state ──────────────────────────────────────────
  const [expanded, setExpanded] = useState<boolean>(false);
  const [badgePulse, setBadgePulse] = useState<number>(0); // bumps to retrigger keyframe
  const prevCountRef = useRef<number>(count);
  const collapseTimer = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevCountRef.current;
    if (count > prev) {
      // First add (0 → 1): full hold; subsequent adds: brief re-expand.
      const hold = prev === 0 ? EXPANDED_HOLD_MS : RE_EXPAND_HOLD_MS;
      setExpanded(true);
      setBadgePulse((n) => n + 1);
      if (collapseTimer.current != null) window.clearTimeout(collapseTimer.current);
      collapseTimer.current = window.setTimeout(() => setExpanded(false), hold);
    } else if (count === 0) {
      setExpanded(false);
    }
    prevCountRef.current = count;
    return () => {
      if (collapseTimer.current != null) window.clearTimeout(collapseTimer.current);
    };
  }, [count]);

  // ── Scroll-direction hide/reveal ──────────────────────────────────
  const [hidden, setHidden] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    let accDown = 0;
    let accUp = 0;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;
        if (y < 40) {
          // Always visible near top of page.
          setHidden(false);
          accDown = 0;
          accUp = 0;
        } else if (dy > 0) {
          accDown += dy;
          accUp = 0;
          if (accDown >= SCROLL_HIDE_DELTA) setHidden(true);
        } else if (dy < 0) {
          accUp += -dy;
          accDown = 0;
          if (accUp >= SCROLL_HIDE_DELTA) setHidden(false);
        }
        lastY = y;
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // ── Tweened subtotal ──────────────────────────────────────────────
  const tweened = useNumberTween(subtotal, SUBTOTAL_TWEEN_MS, reduce);
  const tweenedRounded = Math.round(tweened);

  // Always render — even with 0 items the pill stays visible as a "Basket"
  // entry-point so the customer can click into it from any scroll position.
  // Empty state shows the FAB with no count badge and no subtotal.
  const ariaLabel =
    count === 0
      ? "Open basket, empty"
      : `Open basket, ${count} ${count === 1 ? "item" : "items"}, total £${subtotal}`;
  const itemWord = count === 1 ? "item" : "items";

  return (
    <>
      {/* Visually-hidden polite live region — announces every add. */}
      <div role="status" aria-live="polite" aria-atomic="true" style={SR_ONLY}>
        {lastAddLabel
          ? `${lastAddLabel}. Basket now £${subtotal}.`
          : ""}
      </div>

      <motion.div
        initial={false}
        animate={{
          y: hidden ? 96 : 0,
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? "none" : "auto",
        }}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 260, damping: 28 }
        }
        style={{
          position: "fixed",
          right: 16,
          // env() with max() fallback — 16px floor on browsers without safe-area
          bottom: "max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))",
          zIndex: 50,
        }}
      >
        {/* The activator. Switches between expanded mini-card and FAB. */}
        <motion.button
          type="button"
          onClick={onOpen}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-label={ariaLabel}
          // Bounce on first add: scale 0.85 → 1.05 → 1.0 over 600ms.
          // We retrigger on every count change via `key={badgePulse}`.
          initial={false}
          animate={
            reduce
              ? { scale: 1 }
              : {
                  scale: [0.85, 1.05, 1],
                }
          }
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: 0.6,
                  ease: EASE.out,
                  times: [0, 0.55, 1],
                }
          }
          // Layout transitions handle the pill ↔ FAB width change smoothly.
          layout
          style={{
            display: "flex",
            alignItems: "center",
            gap: expanded ? 12 : 0,
            background: PALETTE.rose,
            color: PALETTE.cream,
            border: "none",
            cursor: "pointer",
            // Multi-layer rose-tinted shadow.
            boxShadow:
              "0 8px 24px rgba(191, 82, 74, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12)",
            height: 56,
            paddingLeft: expanded ? 20 : 0,
            paddingRight: expanded ? 20 : 0,
            width: expanded ? "auto" : 56,
            minWidth: 56,
            borderRadius: 9999,
            fontFamily: "Asap, system-ui, sans-serif",
            // Cream offset focus ring for keyboard activation.
            outline: "none",
            position: "relative",
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 0 3px rgba(255, 253, 245, 0.95), 0 0 0 6px rgba(191, 82, 74, 0.55), 0 8px 24px rgba(191, 82, 74, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow =
              "0 8px 24px rgba(191, 82, 74, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12)";
          }}
          key={badgePulse /* retrigger scale-bounce on every add */}
        >
          {/* Icon (in FAB mode, this is centered; in expanded mode, it has
              a pulsing ring around it on first add). */}
          <span
            aria-hidden
            style={{
              position: "relative",
              width: expanded ? 22 : "100%",
              height: expanded ? 22 : "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShoppingBag
              style={{
                width: 22,
                height: 22,
                color: PALETTE.cream,
                strokeWidth: 2,
              }}
            />
            {/* Single ring pulse on add — fades + expands once. */}
            {!reduce && (
              <motion.span
                key={`ring-${badgePulse}`}
                initial={{ scale: 0.6, opacity: 0.55 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE.out }}
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: 9999,
                  border: `2px solid ${PALETTE.cream}`,
                  pointerEvents: "none",
                }}
              />
            )}
          </span>

          {/* Expanded mini-card content */}
          <AnimatePresence initial={false} mode="wait">
            {expanded && (
              <motion.span
                key="pill-text"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: reduce ? 0 : 0.18, ease: EASE.out }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.005em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span>
                  {count} {itemWord}
                </span>
                <span style={{ opacity: 0.55 }}>·</span>
                <span>£{tweenedRounded}</span>
                <span style={{ opacity: 0.55 }}>·</span>
                <span style={{ fontWeight: 700 }}>View basket →</span>
              </motion.span>
            )}
          </AnimatePresence>

          {/* Count badge — only in FAB (collapsed) state, and only when cart has items. */}
          {!expanded && count > 0 && (
            <motion.span
              key={`badge-${badgePulse}`}
              aria-hidden
              initial={false}
              animate={
                reduce
                  ? { scale: 1 }
                  : { scale: [1, 1.3, 1] }
              }
              transition={
                reduce ? { duration: 0 } : { duration: 0.2, ease: EASE.out }
              }
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 22,
                height: 22,
                borderRadius: 9999,
                background: PALETTE.cream,
                color: PALETTE.rose,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Asap, system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                fontVariantNumeric: "tabular-nums",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.18)",
                lineHeight: 1,
              }}
            >
              {count > 99 ? "99+" : count}
            </motion.span>
          )}
        </motion.button>
      </motion.div>
    </>
  );
}

export default FloatingCartPill;

/**
 * Helper for pages that own cart state — emit this after every cart mutation
 * so the FloatingCartPill (and any future surface) can react to the change.
 *
 * `label` becomes the text spoken by the polite aria-live region, e.g.
 * "Added 16×20 Black framed canvas portrait".
 */
export function emitCartChanged(label?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("ls:cart-changed", { detail: label ? { label } : undefined }),
  );
}
