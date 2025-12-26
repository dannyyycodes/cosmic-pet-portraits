import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

// Import pet images
import lunaImg from "@/assets/samples/luna-persian.jpg";
import maxImg from "@/assets/samples/max-golden.jpg";
import peanutImg from "@/assets/samples/peanut-hamster.jpg";
import cinnamonImg from "@/assets/samples/cinnamon-rabbit.jpg";

const samples = [
  {
    quote: "Your cat's Venus in Pisces explains the 3am zoomies. She's not crazy — she's cosmically activated when you're trying to sleep.",
    highlight: "Also, she judges your life choices. A lot.",
    image: lunaImg,
    pet: "Luna",
    breed: "Persian Cat",
    owner: "Emily K.",
    zodiac: "♓ Pisces Venus"
  },
  {
    quote: "Your dog's Mars in Aries means he's not 'badly trained' — he's just operating on main character energy 24/7.",
    highlight: "The shoe he destroyed? That was personal growth.",
    image: maxImg,
    pet: "Max",
    breed: "Golden Retriever",
    owner: "Sarah M.",
    zodiac: "♈ Aries Mars"
  },
  {
    quote: "Your hamster's Saturn return explains why she runs on that wheel at 2am. She's processing generational trauma.",
    highlight: "Respect the grind.",
    image: peanutImg,
    pet: "Peanut",
    breed: "Syrian Hamster",
    owner: "Jake T.",
    zodiac: "♄ Saturn Return"
  },
  {
    quote: "Your rabbit's Moon in Scorpio means those side-eyes aren't random. She knows what you did.",
    highlight: "She's keeping receipts.",
    image: cinnamonImg,
    pet: "Cinnamon",
    breed: "Holland Lop",
    owner: "Mia R.",
    zodiac: "♏ Scorpio Moon"
  }
];

export function SampleCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % samples.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goPrev = () => goTo((currentIndex - 1 + samples.length) % samples.length);
  const goNext = () => goTo((currentIndex + 1) % samples.length);

  const current = samples[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="relative max-w-md mx-auto"
    >
      {/* Label */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/50" />
        <span className="text-xs font-medium text-primary uppercase tracking-wider">From Real Reports</span>
        <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/50" />
      </div>

      <div className="relative group">
        {/* Navigation arrows - visible on hover/touch */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all opacity-0 group-hover:opacity-100 sm:flex hidden"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all opacity-0 group-hover:opacity-100 sm:flex hidden"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Main card */}
        <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md border border-primary/20 rounded-2xl overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.1)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Pet header with image */}
              <div className="flex items-center gap-3 p-4 pb-3 border-b border-border/20">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                    <img 
                      src={current.image} 
                      alt={current.pet}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-3 h-3 fill-primary-foreground text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground truncate">{current.pet}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {current.zodiac}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{current.breed} • {current.owner}</p>
                </div>
              </div>

              {/* Quote content */}
              <div className="p-4 pt-3">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  "{current.quote}"
                </p>
                <p className="text-sm text-primary font-semibold mt-2 flex items-center gap-1">
                  <span>✨</span> {current.highlight}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-4">
          {samples.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex 
                  ? "w-6 h-2 bg-primary" 
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`View ${sample.pet}'s report`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
