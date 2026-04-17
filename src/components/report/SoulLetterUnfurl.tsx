import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { zodiacSigns } from '@/lib/zodiac';
import { SoulLetter } from './SoulLetter';

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
  const ref = useRef<HTMLDivElement | null>(null);

  // Respect motion preferences — skip the seal theater entirely.
  useEffect(() => {
    if (reducedMotion) setStage('letter');
  }, [reducedMotion]);

  // Auto-break after a beat once the seal is on-screen.
  useEffect(() => {
    if (stage !== 'sealed' || reducedMotion) return;
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
  }, [stage, reducedMotion]);

  // After the break animation plays, reveal the letter.
  useEffect(() => {
    if (stage !== 'breaking') return;
    const t = setTimeout(() => setStage('letter'), 1400);
    return () => clearTimeout(t);
  }, [stage]);

  const signGlyph = zodiacSigns[sunSign.toLowerCase()]?.icon || '✦';

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
        className="relative rounded-[20px] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at center, #2a1f1a 0%, #1a1210 70%, #0f0908 100%)',
          border: '1px solid rgba(196,162,101,0.2)',
          minHeight: 380,
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        }}
      >
        {/* Eyebrow */}
        <div className="absolute top-6 inset-x-0 text-center">
          <div className="text-[0.62rem] font-bold tracking-[2.8px] uppercase text-[#c4a265]/85">
            A Sealed Letter Awaits
          </div>
        </div>

        {/* Seal + aura */}
        <button
          onClick={breakNow}
          aria-label="Break the seal"
          className="absolute inset-0 flex items-center justify-center group"
          disabled={stage !== 'sealed'}
        >
          {/* Ambient halo */}
          <motion.div
            aria-hidden="true"
            className="absolute w-[260px] h-[260px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(196,162,101,0.25) 0%, rgba(191,82,74,0.15) 40%, transparent 70%)',
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
                'radial-gradient(circle at 35% 30%, #d96350 0%, #bf524a 35%, #8e2f2a 90%)',
              boxShadow:
                '0 6px 20px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -4px 8px rgba(0,0,0,0.35)',
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
                color: '#3a1210',
                textShadow:
                  '0 1px 0 rgba(255,200,180,0.25), 0 -1px 1px rgba(0,0,0,0.55)',
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
                border: '2px solid rgba(61,18,16,0.6)',
                boxShadow: 'inset 0 0 0 1px rgba(255,200,180,0.25)',
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
                  background: s.i % 2 === 0 ? '#c4a265' : '#d96350',
                  boxShadow:
                    s.i % 2 === 0
                      ? '0 0 6px #c4a265, 0 0 12px #c4a265'
                      : '0 0 6px #d96350',
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
              <div className="text-[#c4a265] text-sm font-serif italic mb-1">
                {petName}&rsquo;s soul has written you a letter.
              </div>
              <div className="text-[#faf6ef]/50 text-[0.68rem] tracking-[0.25em] uppercase font-sans">
                Tap the seal to open &middot; or wait a moment
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
