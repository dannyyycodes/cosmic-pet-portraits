import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CosmicLoadingProps {
  petName?: string;
}

const getLoadingMessages = (name: string) => [
  `Learning about ${name}...`,
  `Reading ${name}'s soul...`,
  `Discovering what makes ${name} special...`,
  `Understanding ${name}'s heart...`,
  `Capturing ${name}'s unique spirit...`,
  `Almost there...`,
];

export function CosmicLoading({ petName = 'your friend' }: CosmicLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = getLoadingMessages(petName);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-lg">
        {/* Cosmic animation - stars aligning */}
        <div className="relative w-40 h-40 mx-auto">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <motion.div
                key={deg}
                className="absolute w-2 h-2 rounded-full bg-gold"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateX(70px) translateY(-50%)`,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: deg / 360 }}
              />
            ))}
          </motion.div>
          
          {/* Middle ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-gold/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            {[0, 90, 180, 270].map((deg) => (
              <motion.div
                key={deg}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${deg}deg) translateX(50px) translateY(-50%)`,
                }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: deg / 360 }}
              />
            ))}
          </motion.div>
          
          {/* Inner ring */}
          <motion.div
            className="absolute inset-8 rounded-full border-2 border-primary/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center orb */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-gold shadow-lg shadow-primary/50" />
          </motion.div>
        </div>

        {/* Animated messages */}
        <div className="h-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg text-foreground/80 font-medium"
            >
              {messages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Decorative stars */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gold"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pt-8 border-t border-border/30"
        >
          <p className="text-muted-foreground italic text-sm leading-relaxed">
            "The world would be a nicer place if everyone had the ability to love as unconditionally as a dog."
          </p>
          <p className="text-primary/60 text-xs mt-2">— M.K. Clinton</p>
        </motion.div>
      </div>
    </div>
  );
}
