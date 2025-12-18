import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles, Star } from 'lucide-react';

interface CinematicRevealProps {
  petName: string;
  sunSign: string;
  archetype: string;
  element: string;
  onComplete: () => void;
}

export function CinematicReveal({ petName, sunSign, archetype, element, onComplete }: CinematicRevealProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timings = [0, 2000, 4000, 6000, 8000];
    
    timings.forEach((delay, index) => {
      setTimeout(() => {
        setStage(index + 1);
      }, delay);
    });

    // Complete after final stage
    setTimeout(() => {
      onComplete();
    }, 10000);
  }, [onComplete]);

  const elementColors: Record<string, string> = {
    Fire: '#ef4444',
    Earth: '#22c55e',
    Air: '#3b82f6',
    Water: '#8b5cf6',
  };

  const color = elementColors[element] || '#8b5cf6';

  return (
    <AnimatePresence>
      {stage < 5 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#0a0612' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Animated stars background */}
          <div className="absolute inset-0">
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: Math.random() * 3 + 1,
                  height: Math.random() * 3 + 1,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>

          {/* Nebula glow */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ backgroundColor: `${color}20` }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Stage 1: "The stars have aligned..." */}
          <AnimatePresence mode="wait">
            {stage === 1 && (
              <motion.div
                key="stage1"
                className="text-center z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="flex items-center justify-center gap-2 mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-6 h-6 text-yellow-400" />
                  <Sparkles className="w-8 h-8 text-purple-400" />
                  <Star className="w-6 h-6 text-yellow-400" />
                </motion.div>
                <p className="text-white/60 text-lg tracking-widest uppercase">
                  The stars have aligned...
                </p>
              </motion.div>
            )}

            {/* Stage 2: Pet name reveal */}
            {stage === 2 && (
              <motion.div
                key="stage2"
                className="text-center z-10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8 }}
              >
                <motion.h1
                  className="text-6xl md:text-8xl font-bold text-white mb-4"
                  style={{ textShadow: `0 0 60px ${color}` }}
                  animate={{
                    textShadow: [
                      `0 0 60px ${color}`,
                      `0 0 100px ${color}`,
                      `0 0 60px ${color}`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {petName}
                </motion.h1>
              </motion.div>
            )}

            {/* Stage 3: Sun sign reveal */}
            {stage === 3 && (
              <motion.div
                key="stage3"
                className="text-center z-10"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${color}40, ${color}80)`,
                    boxShadow: `0 0 60px ${color}60`,
                  }}
                  animate={{
                    boxShadow: [
                      `0 0 60px ${color}60`,
                      `0 0 100px ${color}80`,
                      `0 0 60px ${color}60`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-6xl">☉</span>
                </motion.div>
                <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Sun Sign</p>
                <h2 className="text-4xl font-bold text-white">{sunSign}</h2>
              </motion.div>
            )}

            {/* Stage 4: Archetype reveal */}
            {stage === 4 && (
              <motion.div
                key="stage4"
                className="text-center z-10 max-w-md px-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="text-6xl mb-6"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  👑
                </motion.div>
                <p className="text-white/60 text-sm uppercase tracking-widest mb-2">
                  {petName}'s Cosmic Archetype
                </p>
                <h2
                  className="text-3xl md:text-4xl font-bold mb-4"
                  style={{ color }}
                >
                  {archetype}
                </h2>
                <p className="text-white/40 text-sm">
                  Your cosmic journey awaits...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress dots */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
            {[1, 2, 3, 4].map((s) => (
              <motion.div
                key={s}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: stage >= s ? color : 'rgba(255,255,255,0.2)',
                }}
                animate={stage === s ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.5, repeat: stage === s ? Infinity : 0 }}
              />
            ))}
          </div>

          {/* Skip button */}
          <motion.button
            className="absolute bottom-12 right-8 text-white/40 text-sm hover:text-white/60 transition-colors"
            onClick={onComplete}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            Skip →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
