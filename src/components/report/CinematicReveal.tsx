import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { zodiacSigns } from '@/lib/zodiac';

interface CinematicRevealProps {
  petName: string;
  sunSign: string;
  archetype: string;
  element: string;
  onComplete: () => void;
  occasionMode?: string;
}

export function CinematicReveal({ petName, sunSign, archetype, element, onComplete, occasionMode }: CinematicRevealProps) {
  const [stage, setStage] = useState(0);

  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  useEffect(() => {
    const timings = [300, 2500, 5000, 7500];
    const timeouts = timings.map((delay, index) =>
      setTimeout(() => setStage(index + 1), delay)
    );
    const completeTimeout = setTimeout(() => onComplete(), 10500);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  // Memorial mode text adjustments
  const stageText = {
    s0: occasionMode === 'memorial'
      ? 'The stars remember'
      : 'The stars have aligned',
    s1sub: occasionMode === 'memorial'
      ? 'Their cosmic soul lives on'
      : 'Your cosmic soul reading is ready',
    s3sub: occasionMode === 'memorial'
      ? 'A soul who will never be forgotten'
      : `A soul who feels everything twice`,
    s3overline: occasionMode === 'memorial'
      ? `${petName}'s Eternal Archetype`
      : `${petName}'s Cosmic Archetype`,
  };

  return (
    <AnimatePresence>
      {stage < 5 && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#0a0612' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Stars */}
          <div className="absolute inset-0">
            {[...Array(80)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: 1 + Math.random() * 2,
                  height: 1 + Math.random() * 2,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          {/* Nebula - gold glow */}
          <div
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(196,162,101,0.15), transparent 70%)',
              animation: 'nebula-pulse 4s ease-in-out infinite',
            }}
          />

          {/* Stages */}
          <AnimatePresence mode="wait">
            {stage === 1 && (
              <motion.div
                key="s0"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-white/40 text-[0.9rem] tracking-[3px] uppercase">
                  {stageText.s0}
                </p>
              </motion.div>
            )}

            {stage === 2 && (
              <motion.div
                key="s1"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1
                  className="font-dm-serif text-[3.5rem] text-white"
                  style={{ textShadow: '0 0 50px rgba(196,162,101,0.5)' }}
                >
                  {petName}
                </h1>
                <p className="text-white/30 text-[0.9rem] tracking-[1px] mt-1">
                  {stageText.s1sub}
                </p>
              </motion.div>
            )}

            {stage === 3 && (
              <motion.div
                key="s2"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="w-[110px] h-[110px] rounded-full mx-auto mb-4 flex items-center justify-center text-[3rem]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(196,162,101,0.3), rgba(196,162,101,0.1))',
                    border: '1px solid rgba(196,162,101,0.4)',
                    boxShadow: '0 0 60px rgba(196,162,101,0.3)',
                  }}
                >
                  {signIcon}
                </div>
                <p className="text-white/40 text-[0.75rem] tracking-[2px] uppercase">Sun Sign</p>
                <h1 className="font-dm-serif text-[2.5rem] text-white mt-1">{sunSign}</h1>
              </motion.div>
            )}

            {stage === 4 && (
              <motion.div
                key="s3"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="text-white/40 text-[0.75rem] tracking-[2px] uppercase">
                  {stageText.s3overline}
                </p>
                <div className="font-dm-serif text-[1.8rem] text-[#c4a265] mt-2">
                  {archetype}
                </div>
                <p className="text-white/35 text-[0.82rem] mt-3 max-w-[300px] mx-auto">
                  {stageText.s3sub}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gold progress dots */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="w-1.5 h-1.5 rounded-full transition-all duration-400"
                style={{
                  backgroundColor: stage >= s ? '#c4a265' : 'rgba(255,255,255,0.2)',
                  transform: stage === s ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Skip button */}
          <motion.button
            className="absolute bottom-10 right-6 bg-transparent border-none text-white/30 text-[0.8rem] cursor-pointer font-[DM_Sans,sans-serif]"
            onClick={onComplete}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Skip →
          </motion.button>

          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.2; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            @keyframes nebula-pulse {
              0%, 100% { transform: scale(1); opacity: 0.4; }
              50% { transform: scale(1.15); opacity: 0.7; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
