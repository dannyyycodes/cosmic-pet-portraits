/**
 * StudioAtmosphere — ambient generative-feel backdrop for /pawtraits/studio.
 *
 * Three soft, drifting radial-gradient orbs (rose / gold / peach) over a
 * white page, plus a low-opacity SVG film-grain overlay and a vignette.
 * Inspired by Krea, Sora and Midjourney loading screens, tuned to the
 * locked Little Souls white/rose/gold palette so it reads as polished,
 * not techy. Boosts intensity while a generation is running.
 */
import { motion, useReducedMotion } from "framer-motion";
import { PALETTE } from "../tokens";

interface StudioAtmosphereProps {
  /** When true, orbs glow brighter and drift faster — "studio is working". */
  active?: boolean;
}

export function StudioAtmosphere({ active = false }: StudioAtmosphereProps) {
  const reduce = useReducedMotion();
  const baseDuration = reduce ? 0 : 32;
  const intensity = active ? 1 : 0.55;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Orb 1 — rose, top-left drift */}
      <motion.div
        initial={{ x: "-15%", y: "-10%" }}
        animate={
          reduce
            ? undefined
            : {
                x: ["-15%", "10%", "-5%", "-15%"],
                y: ["-10%", "5%", "15%", "-10%"],
              }
        }
        transition={{ duration: baseDuration, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-20%",
          left: "-15%",
          width: "70vmax",
          height: "70vmax",
          background: `radial-gradient(circle at 50% 50%, ${PALETTE.rose}38 0%, ${PALETTE.rose}00 60%)`,
          filter: `blur(60px)`,
          opacity: 0.55 * intensity,
        }}
      />

      {/* Orb 2 — gold, bottom-right drift */}
      <motion.div
        initial={{ x: "5%", y: "5%" }}
        animate={
          reduce
            ? undefined
            : {
                x: ["5%", "-12%", "8%", "5%"],
                y: ["5%", "-8%", "10%", "5%"],
              }
        }
        transition={{ duration: baseDuration * 1.3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "-25%",
          right: "-15%",
          width: "65vmax",
          height: "65vmax",
          background: `radial-gradient(circle at 50% 50%, ${PALETTE.gold}40 0%, ${PALETTE.gold}00 60%)`,
          filter: `blur(70px)`,
          opacity: 0.45 * intensity,
        }}
      />

      {/* Orb 3 — soft peach, central slow breath */}
      <motion.div
        initial={{ scale: 1, opacity: 0.25 * intensity }}
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.15, 1],
                opacity: [0.2 * intensity, 0.4 * intensity, 0.2 * intensity],
              }
        }
        transition={{ duration: baseDuration * 0.6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "30%",
          left: "30%",
          width: "45vmax",
          height: "45vmax",
          background: `radial-gradient(circle at 50% 50%, #fbeae855 0%, #fbeae800 65%)`,
          filter: `blur(50px)`,
        }}
      />

      {/* Vignette — pull focus toward centre */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, #ffffff 100%)`,
          opacity: 0.55,
        }}
      />

      {/* Film grain (SVG noise data URI, tiled) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          opacity: active ? 0.045 : 0.025,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}
