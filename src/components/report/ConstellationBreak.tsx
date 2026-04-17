import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ConstellationBreakProps {
  /** Optional small caption shown beneath the constellation, e.g. "Canis Minor". */
  label?: string;
  /** Stable seed so the constellation renders identically each visit. */
  seed?: string | number;
}

// The signature divider — used 3-4× per report at chapter breaks.
// Five gold dots fall into a constellation-like arrangement, then thin
// lines draw between them. A tiny Caveat label fades in below.
// Each instance gets a stable random shape via the seed prop so the
// report feels hand-drawn not procedural.
export function ConstellationBreak({ label, seed = 'cosmic' }: ConstellationBreakProps) {
  // Pseudo-random but deterministic per seed.
  const points = useMemo(() => {
    let h = 2166136261;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const rand = () => {
      h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
      return ((h >>> 0) % 1000) / 1000;
    };
    // Five points scattered in a 280×80 viewBox, biased to look like an arc.
    return Array.from({ length: 5 }, (_, i) => {
      const x = 30 + i * 55 + (rand() - 0.5) * 18;
      const y = 24 + Math.sin((i / 4) * Math.PI) * 26 + (rand() - 0.5) * 10;
      return { x, y };
    });
  }, [seed]);

  // Pre-compute the line segments connecting consecutive points.
  const lines = useMemo(() => {
    return points.slice(0, -1).map((p, i) => ({
      x1: p.x,
      y1: p.y,
      x2: points[i + 1].x,
      y2: points[i + 1].y,
    }));
  }, [points]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-20% 0px' }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center py-14 select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 280 80" className="w-[280px] h-[80px]">
        {/* Connecting lines — drawn after dots */}
        {lines.map((l, i) => (
          <motion.line
            key={'l-' + i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#c4a265"
            strokeOpacity="0.55"
            strokeWidth="0.6"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ duration: 0.9, delay: 1.0 + i * 0.18, ease: 'easeInOut' }}
          />
        ))}

        {/* Dots — fall in one by one */}
        {points.map((p, i) => (
          <motion.g
            key={'p-' + i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <circle cx={p.x} cy={p.y} r="6" fill="#c4a265" opacity="0.18" />
            <circle cx={p.x} cy={p.y} r="2.2" fill="#c4a265" />
          </motion.g>
        ))}
      </svg>

      {label && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ duration: 0.7, delay: 1.9 }}
          className="mt-3 text-[0.72rem] tracking-[0.32em] uppercase text-[#9a8578]"
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}
