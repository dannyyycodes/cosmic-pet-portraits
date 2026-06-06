import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ConstellationBreakProps {
  /** Optional small caption shown beneath the constellation, e.g. "Canis Minor". */
  label?: string;
  /** Stable seed so the constellation renders identically each visit. */
  seed?: string | number;
}

// The chapter break — used 3-4× per report. Refined to a single quiet
// constellation line: one thin gold hairline that draws across, anchored by
// two small dots, with a tiny Caveat label below. No glyph rows, no clusters.
// The seed only nudges the line's gentle arc so each chapter feels distinct
// without adding visual noise.
export function ConstellationBreak({ label, seed = 'cosmic' }: ConstellationBreakProps) {
  // Deterministic per seed — a single small dip value for the arc.
  const dip = useMemo(() => {
    let h = 2166136261;
    const s = String(seed);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    // Gentle vertical offset for the arc midpoint: 16-32 in an 80×40 viewBox.
    return 16 + ((h >>> 0) % 17);
  }, [seed]);

  // A single quadratic arc from left dot to right dot.
  const path = `M 18 20 Q 90 ${dip} 162 20`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-20% 0px' }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center py-12 select-none"
      aria-hidden="true"
    >
      <svg viewBox="0 0 180 40" className="w-[180px] h-[40px]">
        {/* Single thin hairline arc — draws across */}
        <motion.path
          d={path}
          fill="none"
          stroke="#e6c179"
          strokeOpacity="0.4"
          strokeWidth="0.6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ duration: 1.1, delay: 0.2, ease: 'easeInOut' }}
        />

        {/* Two small anchor dots */}
        {[
          { cx: 18, cy: 20 },
          { cx: 162, cy: 20 },
        ].map((d, i) => (
          <motion.g
            key={'d-' + i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <circle cx={d.cx} cy={d.cy} r="5" fill="#e6c179" opacity="0.12" />
            <circle cx={d.cx} cy={d.cy} r="1.8" fill="#e6c179" opacity="0.85" />
          </motion.g>
        ))}
      </svg>

      {label && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20% 0px' }}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="mt-2 text-[0.72rem] tracking-[0.32em] uppercase"
          style={{ color: '#b9a8e0' }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
}
