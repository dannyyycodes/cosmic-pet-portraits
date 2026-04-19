import { motion } from 'framer-motion';

// The breath-divider used 30+ times across the report. Asterism trio
// (✦ ✦ ✦) — a real printer's ornament, quieter than the prose around it.
export function SectionDivider() {
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
