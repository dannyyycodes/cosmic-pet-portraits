/**
 * GenerationCanvas — cinematic in-progress state for /pawtraits/studio.
 *
 * Design rules (locked 2026-05-10 after Danny feedback):
 *   1. NOTHING LOOPS visibly. Status text, brushstrokes, and progress are
 *      all driven by elapsed time and progress monotonically — they never
 *      go backwards or repeat the same line/animation cycle.
 *   2. BRUSHSTROKES ACCUMULATE — each new stroke stays on canvas. By 30s
 *      there are several visible strokes; by 60s it looks like a partial
 *      painting. Feels like genuine progress, not a spinner.
 *   3. STATUS COPY is time-bucketed — 9 stages spaced across 0–120s with
 *      a final "almost there" floor. After 120s elapsed, the last stage
 *      stays — never resets to "Sketching..." like the old version did.
 *   4. PROGRESS HAIRLINE is asymptotic — smoothly approaches 95% over 90s
 *      then crawls toward 99% but never hits 100% until the actual image
 *      arrives. No false-progress snap-backs.
 *   5. AMBIENT MOTION (gradient drift, soft glow) uses very long periods
 *      (>20s) so any loop is below the threshold of perception.
 *
 * Single image per generation now (locked rule), so there's only one canvas.
 */
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { PALETTE } from "../tokens";

interface Stage {
  /** Earliest elapsed seconds at which this stage's copy can appear. */
  fromSec: number;
  text: string;
}

// Stages progress one-way only. The last entry is the "floor" — it stays
// shown indefinitely if generation runs longer than expected so the customer
// never sees the early "Sketching..." message twice.
const STAGES: Stage[] = [
  { fromSec: 0,   text: "Studying your pet" },
  { fromSec: 4,   text: "Reading the light in their eyes" },
  { fromSec: 9,   text: "Sketching the composition" },
  { fromSec: 16,  text: "Blocking in the colour" },
  { fromSec: 24,  text: "Painting in their face" },
  { fromSec: 34,  text: "Building the world around them" },
  { fromSec: 46,  text: "Layering shadow and depth" },
  { fromSec: 60,  text: "Finishing the lighting" },
  { fromSec: 78,  text: "Adding the last brushstrokes" },
  { fromSec: 100, text: "Almost there" },
];

// Pre-defined brushstroke paths. We pick a different starting subset each
// mount via the seed, then add one new stroke every BRUSH_INTERVAL_MS.
// Each stroke draws in over ~2s and STAYS — they accumulate visually.
const BRUSHSTROKES: { d: string; stroke: 'rose' | 'gold'; width: number }[] = [
  { d: "M 60 380 C 120 320, 180 360, 220 280 S 320 180, 360 140", stroke: "rose", width: 3 },
  { d: "M 90 200 C 150 240, 200 200, 260 240 S 340 300, 360 320", stroke: "gold", width: 2 },
  { d: "M 40 100 C 100 130, 160 90, 220 130 S 320 90, 380 120",   stroke: "rose", width: 2 },
  { d: "M 70 460 Q 200 420, 360 450",                                stroke: "gold", width: 2 },
  { d: "M 120 250 C 180 200, 240 280, 300 230",                     stroke: "rose", width: 2 },
  { d: "M 50 320 C 130 280, 230 320, 350 270",                      stroke: "gold", width: 1.5 },
  { d: "M 80 80 C 160 40, 240 70, 350 30",                          stroke: "rose", width: 1.5 },
  { d: "M 200 100 C 220 200, 180 300, 200 400",                     stroke: "gold", width: 1.5 },
  { d: "M 30 240 C 80 220, 140 260, 200 240",                       stroke: "rose", width: 1 },
  { d: "M 240 380 C 290 360, 330 420, 370 400",                     stroke: "gold", width: 1 },
  { d: "M 140 60 C 180 90, 160 130, 200 150",                       stroke: "rose", width: 1 },
  { d: "M 280 200 C 310 240, 280 280, 320 320",                     stroke: "gold", width: 1 },
];

// One stroke added every 3.5s. After 42s all 12 strokes are on canvas.
const BRUSH_INTERVAL_MS = 3500;

export interface GenerationCanvasProps {
  /** Optional start timestamp. When passed and stable across remounts the
   *  stage timer continues from where it was (no "Studying your pet" loop
   *  if the component happens to unmount + remount mid-generation). */
  startedAt?: number;
}

export function GenerationCanvas({ startedAt }: GenerationCanvasProps = {}) {
  const reduce = useReducedMotion();
  // Initial elapsed reflects the parent's start time so a remount picks up
  // where the previous mount left off — no resetting back to 0s.
  const [elapsedSec, setElapsedSec] = useState(() =>
    startedAt ? (Date.now() - startedAt) / 1000 : 0,
  );
  const [strokeCount, setStrokeCount] = useState(reduce ? BRUSHSTROKES.length : 1);

  // Single 250ms ticker drives everything. Cheap (≤4Hz) and gives us
  // smooth-enough progress + status without the cost of requestAnimationFrame.
  // When `startedAt` is supplied we anchor to that timestamp; otherwise the
  // local mount time. The startedAt anchor makes remounts seamless.
  useEffect(() => {
    const t0 = startedAt ?? Date.now();
    const id = setInterval(() => {
      setElapsedSec((Date.now() - t0) / 1000);
    }, 250);
    return () => clearInterval(id);
  }, [startedAt]);

  // Add a new brushstroke every BRUSH_INTERVAL_MS, capped at the array length.
  // No loop — once all strokes are drawn they just stay.
  useEffect(() => {
    if (reduce) return;
    if (strokeCount >= BRUSHSTROKES.length) return;
    const id = setTimeout(() => {
      setStrokeCount((n) => Math.min(n + 1, BRUSHSTROKES.length));
    }, BRUSH_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [strokeCount, reduce]);

  // Pick the latest stage whose fromSec is ≤ elapsed. Linear scan over a
  // small array — the last stage is the floor.
  const stageIdx = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) {
      if (STAGES[i].fromSec <= elapsedSec) idx = i;
      else break;
    }
    return idx;
  }, [elapsedSec]);
  const stageText = STAGES[stageIdx].text;

  // Asymptotic progress — approaches 95% at 90s, 99% at 180s, never 100%.
  // 1 - exp(-t/τ) with τ = 30 means: 0.63 at 30s, 0.86 at 60s, 0.95 at 90s.
  const progressPct = useMemo(() => {
    const tau = 30;
    const eased = 1 - Math.exp(-elapsedSec / tau);
    return Math.min(0.99, eased * 0.99);
  }, [elapsedSec]);

  const elapsedLabel = useMemo(() => {
    const s = Math.floor(elapsedSec);
    if (s < 60) return `${s}s elapsed`;
    return `${Math.floor(s / 60)}m ${s % 60}s elapsed`;
  }, [elapsedSec]);

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
        {/* Slow drifting gradient — moves the warm spot around the frame
            on a ~24s period. Long enough that any loop is barely perceived;
            because there's also accumulating content, the eye never locks
            onto the cycle. */}
        <motion.div
          aria-hidden
          animate={
            reduce
              ? undefined
              : {
                  background: [
                    `radial-gradient(120% 80% at 30% 70%, ${PALETTE.roseSoft} 0%, #fff7ee 45%, #ffffff 90%)`,
                    `radial-gradient(120% 80% at 70% 50%, ${PALETTE.roseSoft} 0%, #fff7ee 45%, #ffffff 90%)`,
                    `radial-gradient(120% 80% at 50% 30%, ${PALETTE.roseSoft} 0%, #fff7ee 45%, #ffffff 90%)`,
                    `radial-gradient(120% 80% at 30% 70%, ${PALETTE.roseSoft} 0%, #fff7ee 45%, #ffffff 90%)`,
                  ],
                }
          }
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(120% 80% at 30% 70%, ${PALETTE.roseSoft} 0%, #fff7ee 45%, #ffffff 90%)`,
          }}
        />

        {/* Accumulating brushstrokes — each one draws in over 2s on its
            first appearance and then stays. By 42s the canvas has all
            12 strokes layered. No re-fade, no re-loop. */}
        <svg
          aria-hidden
          viewBox="0 0 400 500"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          {BRUSHSTROKES.slice(0, strokeCount).map((b, i) => (
            <motion.path
              key={i}
              d={b.d}
              fill="none"
              stroke={b.stroke === "rose" ? PALETTE.rose : PALETTE.gold}
              strokeWidth={b.width}
              strokeLinecap="round"
              strokeOpacity={0.5}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 2, ease: "easeInOut" }}
            />
          ))}
        </svg>

        {/* Centred badge — pulsing dot + stage text. Stage text changes
            via an AnimatePresence-style key swap so the previous line
            fades out as the next fades in. */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 2 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur"
            style={{
              background: "rgba(255,255,255,0.82)",
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
              key={stageIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-cormorant italic"
              style={{ color: PALETTE.ink, fontSize: 16 }}
            >
              {stageText}…
            </motion.span>
          </div>
        </div>

        {/* Asymptotic progress hairline — never resets, never snaps. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            background: "rgba(0,0,0,0.04)",
          }}
        >
          <motion.div
            animate={{ width: `${progressPct * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${PALETTE.rose}, ${PALETTE.gold})`,
            }}
          />
        </div>
      </div>

      {/* Footer caption — left side stays evergreen, right side counts
          elapsed time so the customer can see it's still working. */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#fff" }}>
        <p className="text-[12px]" style={{ color: PALETTE.earthMuted, letterSpacing: "0.06em" }}>
          Painting your full-size pawtrait
        </p>
        <p className="text-[11px] tabular-nums" style={{ color: PALETTE.earthSubtle }}>
          {elapsedLabel}
        </p>
      </div>
    </motion.div>
  );
}
