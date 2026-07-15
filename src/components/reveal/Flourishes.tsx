import { motion, useReducedMotion } from 'framer-motion';
import { dividerSrc, motifSrc } from './assets';
import type { ChapterMotif } from './types';

/**
 * Divider — a delicate transparent constellation strand set between cards so
 * the reading breathes and never reads as a wall of stacked cards. Variant
 * rotates by index; fades/rises in on view.
 */
export function Divider({ index }: { index: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="rv-divider"
      aria-hidden="true"
      initial={reduced ? undefined : { opacity: 0, scale: 0.92 }}
      whileInView={reduced ? undefined : { opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <img src={dividerSrc(index)} alt="" loading="lazy" decoding="async" draggable={false} />
    </motion.div>
  );
}

/**
 * MotifInterlude — a large element image used as an imagery-led palette cleanser
 * mid-chapter. Image dominates; a single elemental word + line carry it. No
 * reading copy — just the element's nature, honoured plainly.
 */
export function MotifInterlude({ motif, accent }: { motif: ChapterMotif; accent: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.figure
      className="rv-motif"
      aria-hidden="true"
      style={{ ['--rv-accent' as string]: accent }}
      initial={reduced ? undefined : { opacity: 0, y: 30 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rv-motif-orb">
        <img src={motifSrc(motif.el)} alt="" loading="lazy" decoding="async" draggable={false} />
      </div>
      <figcaption className="rv-motif-cap">
        <span className="rv-motif-el">{motif.label}</span>
        <span className="rv-motif-line">{motif.line}</span>
      </figcaption>
    </motion.figure>
  );
}
