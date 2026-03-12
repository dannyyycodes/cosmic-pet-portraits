import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface StaticPassageProps {
  lines: string[];
  variant?: 'full' | 'micro';
  species?: string;
}

function getSpeciesWord(species?: string): string {
  if (!species) return 'fur';
  const s = species.toLowerCase();
  if (s.includes('bird') || s.includes('parrot') || s.includes('cockatiel') || s.includes('budgie') || s.includes('canary') || s.includes('parakeet')) return 'feathers';
  if (s.includes('reptile') || s.includes('snake') || s.includes('lizard') || s.includes('gecko') || s.includes('iguana') || s.includes('turtle') || s.includes('tortoise') || s.includes('chameleon')) return 'scales';
  if (s.includes('fish') || s.includes('goldfish') || s.includes('betta') || s.includes('guppy') || s.includes('koi')) return 'fins';
  return 'fur';
}

function processLine(line: string, species?: string): string {
  return line.replace(/\[fur\/feathers\/scales\]/g, getSpeciesWord(species));
}

export function StaticPassage({ lines, variant = 'full', species }: StaticPassageProps) {
  const s = useScrollReveal();
  const isMicro = variant === 'micro';

  // Group lines into stanzas (split by empty lines)
  const stanzas: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    const processed = processLine(line, species);
    if (processed === '') {
      if (current.length > 0) {
        stanzas.push(current);
        current = [];
      }
    } else {
      current.push(processed);
    }
  }
  if (current.length > 0) stanzas.push(current);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.15 } },
      }}
      className="max-w-[480px] mx-auto"
      style={{
        padding: isMicro ? 'clamp(20px, 4vw, 28px) clamp(24px, 6vw, 40px)' : 'clamp(32px, 6vw, 48px) clamp(24px, 6vw, 40px)',
      }}
    >
      {/* Top accent line */}
      <motion.div
        variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1 } }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-12 h-[1px] mx-auto mb-5"
        style={{ background: 'linear-gradient(90deg, transparent, #c4a265, transparent)', transformOrigin: 'center' }}
      />

      {stanzas.map((stanza, si) => (
        <motion.div
          key={si}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
          }}
          className={si < stanzas.length - 1 ? 'mb-4' : ''}
        >
          {stanza.map((line, li) => {
            if (line === '\u2726' || line === '\u2726') {
              return (
                <div key={li} className="text-[#c4a265]/50 text-[0.8rem] my-2 text-center">
                  \u2726
                </div>
              );
            }

            const isKeyLine = !isMicro && (
              (si === 0 && li === 0) ||
              line.startsWith('Astrology') ||
              line.startsWith('They chose') ||
              line.startsWith('You already') ||
              line.startsWith('We just gave')
            );

            return (
              <p
                key={li}
                className={`leading-[1.7] mx-auto max-w-[400px] text-center ${
                  isMicro
                    ? 'text-[#9a8578] italic'
                    : isKeyLine
                      ? 'text-[#3d2f2a]'
                      : 'text-[#9a8578] italic'
                }`}
                style={{
                  fontFamily: isKeyLine && !isMicro ? 'DM Serif Display, serif' : 'Cormorant, serif',
                  fontSize: isMicro
                    ? 'clamp(0.88rem, 2.5vw, 0.95rem)'
                    : isKeyLine
                      ? 'clamp(1rem, 3vw, 1.08rem)'
                      : 'clamp(0.9rem, 2.6vw, 0.98rem)',
                }}
              >
                {line}
              </p>
            );
          })}
        </motion.div>
      ))}

      {/* Bottom accent line */}
      <motion.div
        variants={{ hidden: { scaleX: 0 }, visible: { scaleX: 1 } }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        className="w-12 h-[1px] mx-auto mt-5"
        style={{ background: 'linear-gradient(90deg, transparent, #c4a265, transparent)', transformOrigin: 'center' }}
      />
    </motion.div>
  );
}
