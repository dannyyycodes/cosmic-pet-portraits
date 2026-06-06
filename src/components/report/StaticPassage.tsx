import { motion, useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { deDash } from './cosmic/text';
import { CosmicLineIcon } from './cosmic/CosmicLineIcon';

interface StaticPassageProps {
  lines: string[];
  variant?: 'full' | 'micro';
  species?: string;
  /** Tiny gold caption under the lines, e.g. "The chart, listening". No dash. */
  attribution?: string;
  /** CosmicLineIcon name shown beside the attribution. Default 'sparkle'. */
  icon?: string;
}

function getSpeciesWord(species?: string): string {
  if (!species) return 'fur';
  const s = species.toLowerCase();
  if (/(bird|parrot|cockatiel|budgie|canary|parakeet)/.test(s)) return 'feathers';
  if (/(reptile|snake|lizard|gecko|iguana|turtle|tortoise|chameleon)/.test(s)) return 'scales';
  if (/(fish|goldfish|betta|guppy|koi)/.test(s)) return 'fins';
  return 'fur';
}

function processLine(line: string, species?: string): string {
  return deDash(line.replace(/\[fur\/feathers\/scales\]/g, getSpeciesWord(species)));
}

// StaticPassage — a poetic interlude rendered as a sacred, designed beat:
// a soft vertical light-beam backdrop on dark, a thin gold rule top + bottom,
// generous editorial serif lines that reveal one-by-one on scroll, and an
// elegant gold caption (with a tiny CosmicLineIcon) for the attribution.
// No bare centered text dump. Mobile-first, GPU-only motion, reduced-motion safe.
export function StaticPassage({
  lines,
  variant = 'full',
  species,
  attribution,
  icon = 'sparkle',
}: StaticPassageProps) {
  const s = useScrollReveal();
  const reduce = useReducedMotion();
  const isMicro = variant === 'micro';

  // Flatten to displayed lines; blank strings become stanza breaks (extra gap).
  const display = lines.map((l) => processLine(l, species));

  return (
    <motion.section
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduce ? 0 : 0.16, delayChildren: 0.1 } },
      }}
      className="relative mx-auto"
      style={{
        maxWidth: isMicro ? 460 : 540,
        padding: isMicro
          ? 'clamp(28px,7vw,40px) clamp(22px,6vw,32px)'
          : 'clamp(44px,9vw,72px) clamp(24px,6vw,40px)',
      }}
    >
      {/* Soft vertical light-beam backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 60% at 50% 0%, rgba(154,126,230,0.12), transparent 62%), linear-gradient(180deg, rgba(230,193,121,0.07), transparent 30%, transparent 70%, rgba(230,193,121,0.05))',
          maskImage:
            'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
        }}
      />
      {/* Faint starlight specks */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 18% 22%, rgba(243,236,255,0.55), transparent), radial-gradient(1px 1px at 82% 30%, rgba(230,193,121,0.5), transparent), radial-gradient(1px 1px at 30% 78%, rgba(154,126,230,0.5), transparent), radial-gradient(1px 1px at 70% 84%, rgba(243,236,255,0.4), transparent)',
        }}
      />

      <div className="relative">
        {/* Top gold rule */}
        <motion.div
          variants={{ hidden: { scaleX: 0, opacity: 0 }, visible: { scaleX: 1, opacity: 1 } }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-7 h-px w-24"
          style={{
            background: 'linear-gradient(90deg, transparent, #e6c179, transparent)',
            transformOrigin: 'center',
          }}
        />

        {/* The lines — editorial serif, balanced measure, line-by-line reveal */}
        <div className="text-center">
          {display.map((line, i) => {
            const isBreak = line.trim().length === 0;
            if (isBreak) {
              return <div key={i} aria-hidden="true" style={{ height: 'clamp(14px,3vw,22px)' }} />;
            }
            return (
              <motion.p
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 12, filter: 'blur(5px)' },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="mx-auto"
                style={{
                  fontFamily: 'Cormorant, serif',
                  fontStyle: 'italic',
                  color: '#f3ecff',
                  fontSize: isMicro
                    ? 'clamp(1.08rem,2.8vw,1.28rem)'
                    : 'clamp(1.25rem,3.5vw,1.7rem)',
                  lineHeight: 1.6,
                  maxWidth: '30ch',
                  textWrap: 'balance' as React.CSSProperties['textWrap'],
                  letterSpacing: '0.005em',
                }}
              >
                {line}
              </motion.p>
            );
          })}
        </div>

        {/* Gold attribution caption with tiny cosmic icon */}
        {attribution && (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
            }}
            className="mt-7 flex items-center justify-center gap-2.5"
          >
            <span className="block h-px w-7" style={{ background: 'rgba(230,193,121,0.45)' }} />
            <CosmicLineIcon name={icon} size={15} className="text-[#e6c179]" />
            <span
              style={{
                fontFamily: 'Caveat, cursive',
                fontSize: 'clamp(1.05rem,2.4vw,1.2rem)',
                color: '#e6c179',
                letterSpacing: '0.01em',
              }}
            >
              {deDash(attribution)}
            </span>
            <span className="block h-px w-7" style={{ background: 'rgba(230,193,121,0.45)' }} />
          </motion.div>
        )}

        {/* Bottom gold rule */}
        <motion.div
          variants={{ hidden: { scaleX: 0, opacity: 0 }, visible: { scaleX: 1, opacity: 1 } }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mx-auto mt-7 h-px w-24"
          style={{
            background: 'linear-gradient(90deg, transparent, #e6c179, transparent)',
            transformOrigin: 'center',
          }}
        />
      </div>
    </motion.section>
  );
}
