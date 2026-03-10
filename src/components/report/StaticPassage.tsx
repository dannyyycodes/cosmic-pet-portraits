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

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: 'easeOut' } },
      }}
      className="max-w-[480px] mx-auto text-center"
      style={{
        padding: isMicro ? 'clamp(28px, 5vw, 40px) clamp(24px, 6vw, 40px)' : 'clamp(48px, 8vw, 64px) clamp(24px, 6vw, 40px)',
      }}
    >
      {lines.map((line, i) => {
        const processed = processLine(line, species);

        if (processed === '\u2726' || processed === '✦') {
          return (
            <div key={i} className="text-[#c4a265]/50 text-[0.9rem] my-4">
              ✦
            </div>
          );
        }

        if (processed === '') {
          return <div key={i} className="h-4" />;
        }

        const isKeyLine = !isMicro && (i === 0 || processed.startsWith('Astrology') || processed.startsWith('They chose') || processed.startsWith('You already'));

        return (
          <p
            key={i}
            className={`leading-[1.9] mx-auto max-w-[420px] ${
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
                  ? 'clamp(1rem, 3vw, 1.1rem)'
                  : 'clamp(0.92rem, 2.8vw, 1.02rem)',
            }}
          >
            {processed}
          </p>
        );
      })}
    </motion.div>
  );
}
