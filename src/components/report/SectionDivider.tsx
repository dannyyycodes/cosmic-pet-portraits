import { motion } from 'framer-motion';

type DividerVariant = 'asterism' | 'fleuron' | 'diamond';

interface SectionDividerProps {
  variant?: DividerVariant;
}

// The breath-divider used 30+ times across the report. Default is the
// asterism trio (⁂) — a real printer's ornament, quieter than the prose
// around it. Three variants rotate by passing a different `variant` at
// call sites that want a touch of variety.
export function SectionDivider({ variant = 'asterism' }: SectionDividerProps = {}) {
  if (variant === 'fleuron') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center gap-3 py-7"
      >
        <span className="block h-px w-16 bg-gradient-to-r from-transparent to-[#c4a265]/55" />
        <span className="text-[#c4a265]/75 text-lg font-serif select-none" aria-hidden="true">
          ❦
        </span>
        <span className="block h-px w-16 bg-gradient-to-l from-transparent to-[#c4a265]/55" />
      </motion.div>
    );
  }

  if (variant === 'diamond') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.7 }}
        className="flex items-center justify-center gap-2 py-7"
      >
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="block h-px w-20 bg-[#c4a265]/55 origin-right"
        />
        <span
          className="block w-2 h-2 rotate-45 bg-[#c4a265]"
          aria-hidden="true"
          style={{ boxShadow: '0 0 6px rgba(196,162,101,0.5)' }}
        />
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="block h-px w-20 bg-[#c4a265]/55 origin-left"
        />
      </motion.div>
    );
  }

  // Default — asterism trio. Tighter than the old · · · and uses a real
  // printer's ornament so it reads as composed, not placeholder.
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.7 }}
      className="text-center py-6 select-none"
      aria-hidden="true"
    >
      <span
        className="text-[#c4a265]/55 font-serif"
        style={{ fontSize: '1.25rem', letterSpacing: '0.5em', display: 'inline-block' }}
      >
        ✦ ✦ ✦
      </span>
    </motion.div>
  );
}
