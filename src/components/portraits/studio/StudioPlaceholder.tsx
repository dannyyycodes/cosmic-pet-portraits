/**
 * StudioPlaceholder — pre-generation empty state for the right column of
 * /pawtraits/studio. Replaces a flat dashed box with a soft framed canvas,
 * a "studio active" pulsing dot, and gentle hairlines that hint the live
 * generation surface coming next.
 */
import { motion, useReducedMotion } from "framer-motion";
import { PALETTE } from "../tokens";

interface StudioPlaceholderProps {
  hasStyle: boolean;
  hasTheme: boolean;
}

export function StudioPlaceholder({ hasStyle, hasTheme }: StudioPlaceholderProps) {
  const reduce = useReducedMotion();
  const ready = hasStyle && hasTheme;
  const hint = ready
    ? "Ready when you are — hit Generate."
    : !hasStyle && !hasTheme
      ? "Pick a Style + Theme to load the canvas."
      : !hasStyle
        ? "One more — pick a Style."
        : "One more — pick a Theme.";

  return (
    <motion.div
      key="placeholder"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${PALETTE.sand}`,
        boxShadow: "0 18px 48px -32px rgba(28, 28, 28, 0.12)",
      }}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: "2 / 3", background: PALETTE.cream2 }}
      >
        {/* Soft tint base */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 80% at 50% 70%, ${PALETTE.roseSoft} 0%, #ffffff 80%)`,
            opacity: 0.7,
          }}
        />

        {/* Hairline corner crops — frame implication */}
        {[
          { top: 12, left: 12, borderTop: 2, borderLeft: 2 },
          { top: 12, right: 12, borderTop: 2, borderRight: 2 },
          { bottom: 12, left: 12, borderBottom: 2, borderLeft: 2 },
          { bottom: 12, right: 12, borderBottom: 2, borderRight: 2 },
        ].map((pos, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              width: 18,
              height: 18,
              borderColor: PALETTE.rose,
              borderStyle: "solid",
              borderWidth: 0,
              ...pos,
              borderTopWidth: pos.borderTop ?? 0,
              borderLeftWidth: pos.borderLeft ?? 0,
              borderRightWidth: pos.borderRight ?? 0,
              borderBottomWidth: pos.borderBottom ?? 0,
              opacity: 0.6,
            }}
          />
        ))}

        {/* Centred badge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="flex items-center gap-2 mb-3">
            <motion.span
              aria-hidden
              animate={
                reduce
                  ? undefined
                  : { scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }
              }
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: ready ? PALETTE.rose : PALETTE.gold,
                display: "inline-block",
              }}
            />
            <span
              className="uppercase"
              style={{
                color: PALETTE.earthMuted,
                fontSize: 11,
                letterSpacing: "0.18em",
                fontWeight: 700,
              }}
            >
              Studio · {ready ? "ready" : "warming up"}
            </span>
          </div>
          <p
            className="font-cormorant italic"
            style={{ color: PALETTE.ink, fontSize: 18, maxWidth: 280 }}
          >
            {hint}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
