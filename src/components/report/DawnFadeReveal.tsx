import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface DawnFadeRevealProps {
  /** A short, evocative line — used once per report before a climactic moment. */
  whisper: string;
  /** Optional sub-line in italic Cormorant. */
  subWhisper?: string;
}

// Used EXACTLY ONCE per report — the bridge into the Soul Letter.
// Background cross-fades from indigo night sky to cream dawn over ~1.4s
// as a single 2px gold dot blooms into a 60px sunrise. Text starts white
// on indigo and ends ink on cream. This is the only time in the entire
// report that the background colour changes — that scarcity is what
// makes it feel like a sunrise, not a screensaver.
export function DawnFadeReveal({ whisper, subWhisper }: DawnFadeRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-25% 0px' });

  return (
    <div ref={ref} className="relative w-full overflow-hidden my-10">
      <motion.div
        initial={{ background: 'linear-gradient(180deg, #0f0a14 0%, #1a1224 100%)' }}
        animate={
          inView
            ? { background: 'linear-gradient(180deg, #FFFDF5 0%, #faf6ef 100%)' }
            : { background: 'linear-gradient(180deg, #0f0a14 0%, #1a1224 100%)' }
        }
        transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1], delay: 0.4 }}
        className="relative min-h-[55vh] flex flex-col items-center justify-center px-8 text-center"
      >
        {/* Sunrise dot */}
        <motion.div
          aria-hidden="true"
          className="absolute top-12 left-1/2 -translate-x-1/2 rounded-full"
          style={{ background: '#c4a265' }}
          initial={{ width: 2, height: 2, opacity: 0, boxShadow: '0 0 0 0 rgba(196,162,101,0)' }}
          animate={
            inView
              ? {
                  width: 64,
                  height: 64,
                  opacity: 1,
                  boxShadow: '0 0 80px 40px rgba(196,162,101,0.45)',
                }
              : { width: 2, height: 2, opacity: 0 }
          }
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />

        {/* Whisper line — colour shifts from cream to ink as dawn breaks */}
        <motion.h3
          initial={{ opacity: 0, y: 18, color: '#faf6ef' }}
          animate={
            inView
              ? { opacity: 1, y: 0, color: '#3d2f2a' }
              : { opacity: 0, y: 18, color: '#faf6ef' }
          }
          transition={{
            opacity: { duration: 0.9, delay: 0.8 },
            y: { duration: 0.9, delay: 0.8 },
            color: { duration: 1.6, delay: 0.6, ease: 'easeInOut' },
          }}
          className="relative font-serif text-[1.6rem] sm:text-[2rem] leading-tight max-w-[460px] mt-20"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {whisper}
        </motion.h3>

        {subWhisper && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 0.85, color: '#9a8578' } : { opacity: 0 }}
            transition={{ duration: 0.9, delay: 1.4 }}
            className="relative mt-4 italic max-w-[380px]"
            style={{ fontFamily: 'Cormorant, serif', fontSize: '1rem' }}
          >
            {subWhisper}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
