import { motion, useReducedMotion } from 'framer-motion';
import { COSMIC } from './tokens';

interface MilestoneBeatProps {
  /** Facets revealed so far (1-based chapter just completed). */
  index: number;
  /** Total facets / chapters. */
  total: number;
  petName?: string;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// A small ceremonial "collection" beat between chapters. Each chapter = a facet
// of the soul; the dots light up gold as you go, the newest one pulses. Turns
// the long scroll into an earned journey that culminates in the Final Soul Seal.
export function MilestoneBeat({ index, total, petName }: MilestoneBeatProps) {
  const reduce = useReducedMotion();
  const dots = Array.from({ length: total }, (_, i) => i < index);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20% 0px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto my-10 sm:my-12 flex w-full max-w-[520px] flex-col items-center px-5 sm:px-6 text-center"
    >
      {/* constellation of facets */}
      <div className="flex items-center gap-2.5">
        {dots.map((lit, i) => {
          const newest = i === index - 1;
          return (
            <span key={i} className="relative flex items-center">
              {i > 0 && (
                <span style={{ width: 16, height: 1, background: lit ? `${COSMIC.gold}66` : COSMIC.borderSolid }} />
              )}
              <motion.span
                initial={reduce ? false : { scale: lit ? 0.4 : 1, opacity: lit ? 0 : 1 }}
                whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: lit ? 0.2 + i * 0.06 : 0, type: 'spring', stiffness: 300, damping: 18 }}
                className="rounded-full"
                style={{
                  width: newest ? 9 : 6, height: newest ? 9 : 6, marginLeft: i > 0 ? 4 : 0,
                  background: lit ? COSMIC.gold : 'transparent',
                  border: lit ? 'none' : `1px solid ${COSMIC.borderSolid}`,
                  boxShadow: newest ? `0 0 10px ${COSMIC.gold}` : lit ? `0 0 5px ${COSMIC.gold}88` : 'none',
                }}
              />
              {newest && !reduce && (
                <motion.span
                  className="absolute rounded-full"
                  style={{ left: i > 0 ? 4 : 0, width: 9, height: 9, border: `1px solid ${COSMIC.gold}` }}
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-4" style={{
        fontFamily: 'Cormorant, Georgia, serif', fontStyle: 'italic',
        color: COSMIC.bodyColor, fontSize: '1.06rem', lineHeight: 1.5,
      }}>
        <span style={{ color: COSMIC.gold, fontWeight: 600, letterSpacing: '0.05em' }}>{ROMAN[index] || index}</span>
        {' of '}{ROMAN[total] || total}
        {'  ·  facets of '}{petName ? `${petName}'s` : 'the'} soul revealed
      </div>
    </motion.div>
  );
}
