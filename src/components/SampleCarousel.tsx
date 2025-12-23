import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const samples = [
  {
    quote: "Your cat's Venus in Pisces explains the 3am zoomies. She's not crazy — she's cosmically activated when you're trying to sleep.",
    highlight: "Also, she judges your life choices. A lot.",
    emoji: "🐱",
    pet: "Luna, Persian Cat",
    owner: "Emily K."
  },
  {
    quote: "Your dog's Mars in Aries means he's not 'badly trained' — he's just operating on main character energy 24/7.",
    highlight: "The shoe he destroyed? That was personal growth.",
    emoji: "🐕",
    pet: "Max, Golden Retriever",
    owner: "Sarah M."
  },
  {
    quote: "Your hamster's Saturn return explains why she runs on that wheel at 2am. She's processing generational trauma.",
    highlight: "Respect the grind.",
    emoji: "🐹",
    pet: "Peanut, Syrian Hamster",
    owner: "Jake T."
  },
  {
    quote: "Your rabbit's Moon in Scorpio means those side-eyes aren't random. She knows what you did.",
    highlight: "She's keeping receipts.",
    emoji: "🐰",
    pet: "Cinnamon, Holland Lop",
    owner: "Mia R."
  }
];

export function SampleCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % samples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const current = samples[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="relative max-w-sm mx-auto"
    >
      <div className="bg-card/40 backdrop-blur-sm border border-primary/20 rounded-2xl p-4 sm:p-5 min-h-[180px]">
        <p className="text-xs text-muted-foreground mb-2">From a real report:</p>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm sm:text-base text-foreground italic leading-relaxed">
              "{current.quote}"
            </p>
            <p className="text-sm sm:text-base text-primary font-semibold mt-2">
              {current.highlight}
            </p>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-nebula-purple flex items-center justify-center text-sm">
                {current.emoji}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">{current.pet}</p>
                <p className="text-xs text-muted-foreground">{current.owner} • Verified</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {samples.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex 
                  ? "bg-primary w-4" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
