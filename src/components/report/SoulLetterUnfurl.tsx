import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { zodiacSigns } from '@/lib/zodiac';
import { SoulLetter } from './SoulLetter';
import { deDash } from './cosmic/text';

interface SoulLetterUnfurlProps {
  petName: string;
  epilogue: string;
  sunSign: string;
  occasionMode?: string;
}

// Signature moment 3 — the letter from the pet's soul arrives as a sealed
// scroll. When it scrolls into view a wax seal pulses in, the reader can
// tap to break it (or it auto-breaks after a beat). Particles burst out,
// the parchment unfurls, and the existing <SoulLetter /> content reveals
// underneath. Falls back to a plain <SoulLetter /> for reduced-motion.
export function SoulLetterUnfurl(props: SoulLetterUnfurlProps) {
  const { petName, sunSign } = props;
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<'sealed' | 'breaking' | 'letter'>('sealed');
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Respect motion preferences — skip the seal theater entirely.
  useEffect(() => {
    if (reducedMotion) setStage('letter');
  }, [reducedMotion]);

  // Auto-break after a beat once the seal is on-screen. Paused while the
  // break button holds keyboard focus so users who Tab to it have time
  // to read the prompt before the seal fires.
  useEffect(() => {
    if (stage !== 'sealed' || reducedMotion || paused) return;
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !timer) {
          timer = setTimeout(() => setStage('breaking'), 2400);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [stage, reducedMotion, paused]);

  // After the break animation plays, reveal the letter.
  useEffect(() => {
    if (stage !== 'breaking') return;
    const t = setTimeout(() => setStage('letter'), 1400);
    return () => clearTimeout(t);
  }, [stage]);

  const signGlyph = zodiacSigns[(sunSign || '').toLowerCase()]?.icon || '✦';

  const breakNow = () => {
    if (stage === 'sealed') setStage('breaking');
  };

  if (stage === 'letter') {
    // Final state — existing letter renders with its own paragraph stagger.
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <SoulLetter {...props} />
      </motion.div>
    );
  }

  // Sealed / breaking states.
  const sparkCount = 36;
  const sparks = Array.from({ length: sparkCount }, (_, i) => {
    const angle = (i / sparkCount) * Math.PI * 2;
    const distance = 120 + (i % 3) * 40;
    return {
      i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: (i % 6) * 0.02,
    };
  });

  return (
    <div ref={ref} className="my-8 mx-4 sm:mx-auto max-w-[520px]">
      <div
        className="relative rounded-[22px] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(34,26,68,0.9) 0%, rgba(22,16,42,0.96) 62%, #06050c 100%)',
          border: '1px solid #2a1f47',
          minHeight: 380,
          boxShadow: '0 18px 60px rgba(10,8,16,0.6), 0 0 0 1px rgba(154,126,230,0.14)',
        }}
      >
        {/* Faint starlight backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 20% 24%, rgba(243,236,255,0.55), transparent), radial-gradient(1px 1px at 78% 32%, rgba(230,193,121,0.5), transparent), radial-gradient(1.5px 1.5px at 34% 74%, rgba(154,126,230,0.5), transparent), radial-gradient(1px 1px at 66% 82%, rgba(243,236,255,0.4), transparent)',
          }}
        />

        {/* Eyebrow */}
        <div className="absolute top-6 inset-x-0 text-center">
          <div
            className="font-bold uppercase"
            style={{ fontSize: '0.64rem', letterSpacing: '0.22em', color: '#e6c179' }}
          >
            A Sealed Letter Awaits
          </div>
        </div>

        {/* Seal + aura */}
        <button
          onClick={breakNow}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          aria-label="Break the seal to open the letter. It opens on its own in a moment if you do not."
          className="absolute inset-0 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c179] focus-visible:ring-offset-2 rounded-[22px]"
          disabled={stage !== 'sealed'}
        >
          {/* Ambient halo */}
          <motion.div
            aria-hidden="true"
            className="absolute w-[260px] h-[260px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(230,193,121,0.3) 0%, rgba(154,126,230,0.18) 42%, transparent 72%)',
              filter: 'blur(6px)',
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={
              stage === 'sealed'
                ? { opacity: [0.6, 1, 0.6], scale: [1, 1.04, 1] }
                : { opacity: 0, scale: 1.5 }
            }
            transition={
              stage === 'sealed'
                ? { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.6 }
            }
          />

          {/* Wax seal disc */}
          <motion.div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: 116,
              height: 116,
              background:
                'radial-gradient(circle at 35% 28%, #ffd86b 0%, #e6c179 32%, #9a7ee6 88%, #5a3fa6 100%)',
              boxShadow:
                '0 8px 26px rgba(154,126,230,0.45), inset 0 2px 5px rgba(255,255,255,0.35), inset 0 -5px 10px rgba(10,8,16,0.45)',
            }}
            initial={{ scale: 0.3, opacity: 0, rotate: -25 }}
            animate={
              stage === 'sealed'
                ? { scale: 1, opacity: 1, rotate: 0 }
                : { scale: [1, 1.22, 0], opacity: [1, 1, 0], rotate: [0, 10, 45] }
            }
            transition={
              stage === 'sealed'
                ? { duration: 1, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.9, times: [0, 0.35, 1], ease: 'easeOut' }
            }
          >
            {/* Embossed glyph */}
            <span
              className="font-serif text-4xl select-none"
              style={{
                color: '#2a1f47',
                textShadow:
                  '0 1px 0 rgba(255,236,190,0.45), 0 -1px 1px rgba(10,8,16,0.5)',
                letterSpacing: 0,
              }}
              aria-hidden="true"
            >
              {signGlyph}
            </span>

            {/* Rim highlight */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: '2px solid rgba(90,63,166,0.5)',
                boxShadow: 'inset 0 0 0 1px rgba(255,236,190,0.4)',
              }}
            />
          </motion.div>

          {/* Sparks — only during break */}
          {stage === 'breaking' &&
            sparks.map((s) => (
              <motion.span
                key={s.i}
                aria-hidden="true"
                className="absolute w-1 h-1 rounded-full pointer-events-none"
                style={{
                  background: s.i % 2 === 0 ? '#e6c179' : '#9a7ee6',
                  boxShadow:
                    s.i % 2 === 0
                      ? '0 0 6px #e6c179, 0 0 12px #e6c179'
                      : '0 0 6px #9a7ee6, 0 0 12px #9a7ee6',
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: s.x,
                  y: s.y,
                  scale: [0, 1.4, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.1,
                  delay: s.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
        </button>

        {/* Prompt */}
        <AnimatePresence>
          {stage === 'sealed' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="absolute bottom-7 inset-x-0 text-center px-6"
            >
              <div
                className="font-serif italic mb-1.5"
                style={{ color: '#ece5ff', fontSize: '0.98rem', lineHeight: 1.5 }}
              >
                {deDash(`${petName}’s soul has written you a letter.`)}
              </div>
              <div
                className="uppercase font-sans"
                style={{ color: '#b9a8e0', fontSize: '0.7rem', letterSpacing: '0.25em' }}
              >
                Tap the seal to open &middot; or wait a moment
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
