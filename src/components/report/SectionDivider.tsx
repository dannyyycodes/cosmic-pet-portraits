import { motion } from 'framer-motion';
import { CosmicLineIcon } from './cosmic/CosmicLineIcon';

// The breath-divider used 30+ times across the report. Refined to a quiet
// thin gold hairline with a single tiny centred mark — no glyph clusters.
export function SectionDivider() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.7 }}
      className="flex items-center justify-center gap-3 py-6 select-none"
      aria-hidden="true"
    >
      <span
        className="h-px w-16"
        style={{
          background:
            'linear-gradient(to right, rgba(230,193,121,0) 0%, rgba(230,193,121,0.32) 100%)',
        }}
      />
      <span style={{ color: 'rgba(230,193,121,0.5)' }}>
        <CosmicLineIcon name="sparkle" size={13} />
      </span>
      <span
        className="h-px w-16"
        style={{
          background:
            'linear-gradient(to left, rgba(230,193,121,0) 0%, rgba(230,193,121,0.32) 100%)',
        }}
      />
    </motion.div>
  );
}
