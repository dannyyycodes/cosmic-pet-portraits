/**
 * GenerationCanvas — cinematic in-progress state for /pawtraits/studio.
 *
 * Replaces the plain spinner with a 2:3 placeholder canvas that:
 *   • shows a soft animated rose→gold gradient breathing inside the frame
 *   • runs a diagonal shimmer scan across (Krea / Suno style)
 *   • cycles short status copy through 4 stages in sync with ~10s gen time
 *   • renders a slow brushstroke SVG path drawing in then fading
 *
 * Single image per generation now (locked rule), so there's only one canvas.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { PALETTE } from "../tokens";

const STAGES = [
  "Sketching the composition",
  "Painting in their face",
  "Building the world around them",
  "Finishing the lighting",
];

export function GenerationCanvas() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2400);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <motion.div
      key="loading-canvas"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-xl overflow-hidden"
      style={{
        background: "#fff",
        border: `1px solid ${PALETTE.sand}`,
        boxShadow: "0 24px 60px -28px rgba(191, 82, 74, 0.25)",
      }}
    >
      {/* 2:3 placeholder frame */}
      <div
        className="relative w-full"
        style={{ aspectRatio: "2 / 3", background: PALETTE.cream2 }}
      >
        {/* Breathing gradient base */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0.4 }}
          animate={
            reduce
              ? undefined
              : { opacity: [0.35, 0.6, 0.35] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 80% at 50% 60%, ${PALETTE.roseSoft} 0%, #fff7ee 45%, #ffffff 90%)`,
          }}
        />

        {/* Diagonal shimmer scan — the "AI is working" feel */}
        <motion.div
          aria-hidden
          initial={{ x: "-120%" }}
          animate={reduce ? undefined : { x: ["-120%", "120%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(115deg, transparent 35%, ${PALETTE.gold}26 48%, ${PALETTE.rose}33 52%, transparent 65%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Brushstroke SVG that draws + fades, cycling */}
        <svg
          aria-hidden
          viewBox="0 0 400 500"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <motion.path
            d="M 60 380 C 120 320, 180 360, 220 280 S 320 180, 360 140"
            fill="none"
            stroke={PALETTE.rose}
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.55"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              reduce
                ? { pathLength: 1, opacity: 0.4 }
                : { pathLength: [0, 1, 1], opacity: [0, 0.55, 0] }
            }
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M 90 200 C 150 240, 200 200, 260 240 S 340 300, 360 320"
            fill="none"
            stroke={PALETTE.gold}
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.45"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              reduce
                ? { pathLength: 1, opacity: 0.3 }
                : { pathLength: [0, 1, 1], opacity: [0, 0.45, 0] }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.1,
            }}
          />
        </svg>

        {/* Centred badge — pulsing dot + stage text */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 2 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur"
            style={{
              background: "rgba(255,255,255,0.78)",
              border: `1px solid ${PALETTE.sand}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            <motion.span
              aria-hidden
              animate={
                reduce
                  ? undefined
                  : { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }
              }
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: PALETTE.rose,
                display: "inline-block",
              }}
            />
            <motion.span
              key={stage}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.35 }}
              className="font-cormorant italic"
              style={{ color: PALETTE.ink, fontSize: 16 }}
            >
              {STAGES[stage]}…
            </motion.span>
          </div>
        </div>

        {/* Bottom progress hairline */}
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={reduce ? undefined : { scaleX: [0, 1] }}
          transition={{ duration: 10, ease: "easeInOut", repeat: Infinity }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            background: `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.gold})`,
            transformOrigin: "left",
          }}
        />
      </div>

      {/* Footer caption */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#fff" }}>
        <p className="text-[12px]" style={{ color: PALETTE.earthMuted, letterSpacing: "0.06em" }}>
          Painting your full-size pawtrait
        </p>
        <p className="text-[11px]" style={{ color: PALETTE.earthSubtle }}>
          ~10 seconds
        </p>
      </div>
    </motion.div>
  );
}
