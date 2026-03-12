import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '';

  const elementEmoji = element === 'Fire' ? '🔥' : element === 'Earth' ? '🌍' : element === 'Air' ? '💨' : '💧';

  useEffect(() => {
    const timings = [400, 2800, 5200, 7800];
    const timeouts = timings.map((delay, index) =>
      setTimeout(() => setStage(index + 1), delay)
    );
    const completeTimeout = setTimeout(() => onCompleteRef.current(), 10800);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, []);

  const isMemorial = occasionMode === 'memorial';

  const stages = [
    {
      overline: isMemorial ? 'The stars remember' : 'The stars have aligned',
    },
    {
      title: petName,
      sub: isMemorial ? 'Their cosmic soul lives on' : 'Your cosmic soul reading is ready',
    },
    {
      icon: signIcon,
      overline: 'Sun Sign',
      title: sunSign,
      badge: `${elementEmoji} ${element}`,
    },
    {
      overline: isMemorial ? `${petName}'s Eternal Archetype` : `${petName}'s Cosmic Archetype`,
      title: archetype,
      sub: isMemorial ? 'A soul who will never be forgotten' : 'A soul who feels everything twice',
    },
  ];

  return (
    <AnimatePresence>
      {stage < 5 && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#080510' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Starfield */}
          <div className="absolute inset-0">
            {[...Array(100)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 1 + Math.random() * 1.5,
                  height: 1 + Math.random() * 1.5,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: i % 5 === 0 ? 'rgba(196,162,101,0.6)' : 'rgba(255,255,255,0.7)',
                  animation: `cr-twinkle ${2 + Math.random() * 4}s ease-in-out infinite ${Math.random() * 4}s`,
                }}
              />
            ))}
          </div>

          {/* Central nebula glow */}
          <div
            className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(196,162,101,0.10) 0%, rgba(184,160,212,0.05) 40%, transparent 70%)',
              animation: 'cr-nebula 5s ease-in-out infinite',
            }}
          />

          {/* Secondary purple glow */}
          <div
            className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(184,160,212,0.08) 0%, transparent 70%)',
              animation: 'cr-nebula 5s ease-in-out infinite 1.5s',
              transform: 'translate(40px, -30px)',
            }}
          />

          {/* Stages */}
          <AnimatePresence mode="wait">
            {/* Stage 1: "The stars have aligned" */}
            {stage === 1 && (
              <motion.div
                key="s1"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Decorative line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                  className="w-12 h-[1px] mx-auto mb-5"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(196,162,101,0.5), transparent)', transformOrigin: 'center' }}
                />
                <motion.p
                  initial={{ opacity: 0, letterSpacing: '2px' }}
                  animate={{ opacity: 1, letterSpacing: '5px' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="text-white/50 text-[0.85rem] uppercase font-medium"
                >
                  {stages[0].overline}
                </motion.p>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                  className="w-12 h-[1px] mx-auto mt-5"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(196,162,101,0.5), transparent)', transformOrigin: 'center' }}
                />
              </motion.div>
            )}

            {/* Stage 2: Pet name reveal */}
            {stage === 2 && (
              <motion.div
                key="s2"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.h1
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="font-dm-serif text-[4rem] sm:text-[4.5rem] text-white leading-[1]"
                  style={{ textShadow: '0 0 80px rgba(196,162,101,0.4), 0 0 30px rgba(196,162,101,0.2)' }}
                >
                  {stages[1].title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  className="text-white/30 text-[0.88rem] tracking-[1.5px] mt-3"
                  style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic' }}
                >
                  {stages[1].sub}
                </motion.p>
              </motion.div>
            )}

            {/* Stage 3: Sun sign + zodiac icon */}
            {stage === 3 && (
              <motion.div
                key="s3"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Zodiac orb */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, type: 'spring', stiffness: 120 }}
                  className="w-[120px] h-[120px] rounded-full mx-auto mb-5 flex items-center justify-center text-[3.2rem] relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(196,162,101,0.2), rgba(196,162,101,0.05))',
                    border: '1.5px solid rgba(196,162,101,0.35)',
                    boxShadow: '0 0 60px rgba(196,162,101,0.25), inset 0 0 30px rgba(196,162,101,0.08)',
                  }}
                >
                  {/* Breathing ring */}
                  <div
                    className="absolute inset-[-12px] rounded-full pointer-events-none"
                    style={{
                      border: '1px solid rgba(196,162,101,0.15)',
                      animation: 'cr-ring 3s ease-in-out infinite',
                    }}
                  />
                  {stages[2].icon}
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[#c4a265]/50 text-[0.7rem] tracking-[3px] uppercase font-bold"
                >
                  {stages[2].overline}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="font-dm-serif text-[2.8rem] text-white mt-1.5"
                >
                  {stages[2].title}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mt-3 text-[0.75rem] text-white/50"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {stages[2].badge}
                </motion.div>
              </motion.div>
            )}

            {/* Stage 4: Archetype */}
            {stage === 4 && (
              <motion.div
                key="s4"
                className="absolute text-center px-8 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.p
                  initial={{ opacity: 0, letterSpacing: '1px' }}
                  animate={{ opacity: 1, letterSpacing: '3px' }}
                  transition={{ duration: 0.8 }}
                  className="text-white/35 text-[0.7rem] uppercase font-bold"
                >
                  {stages[3].overline}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="font-dm-serif text-[2rem] sm:text-[2.2rem] mt-3"
                  style={{ color: '#c4a265', textShadow: '0 0 40px rgba(196,162,101,0.3)' }}
                >
                  {stages[3].title}
                </motion.div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="w-10 h-[1px] mx-auto my-4"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(196,162,101,0.4), transparent)', transformOrigin: 'center' }}
                />
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.7 }}
                  className="text-white/30 text-[0.88rem] max-w-[300px] mx-auto leading-[1.6]"
                  style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic' }}
                >
                  {stages[3].sub}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="h-[3px] rounded-full transition-all duration-500"
                style={{
                  width: stage === s ? 24 : 6,
                  backgroundColor: stage >= s ? '#c4a265' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {/* Skip button */}
          <motion.button
            className="absolute bottom-12 right-6 bg-transparent border-none text-white/25 text-[0.75rem] cursor-pointer tracking-[1px] uppercase hover:text-white/40 transition-colors"
            style={{ fontFamily: 'inherit' }}
            onClick={() => onCompleteRef.current()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            Skip
          </motion.button>

          <style>{`
            @keyframes cr-twinkle {
              0%, 100% { opacity: 0.15; transform: scale(0.7); }
              50% { opacity: 1; transform: scale(1.3); }
            }
            @keyframes cr-nebula {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.2); opacity: 0.8; }
            }
            @keyframes cr-ring {
              0%, 100% { transform: scale(1); opacity: 0.4; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
