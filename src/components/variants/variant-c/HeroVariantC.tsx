import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, PartyPopper, Coffee, Heart } from "lucide-react";

interface HeroVariantCProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const HeroVariantC = ({ trackCTAClick }: HeroVariantCProps) => {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-16 sm:pt-24 pb-8 sm:pb-12 z-10">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* FUN BADGE */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-pink-400/30 text-pink-300 text-sm font-medium mb-6"
        >
          <PartyPopper className="w-4 h-4" />
          <span>12,847 pets roasted this week</span>
          <span className="animate-bounce">🔥</span>
        </motion.div>

        {/* MAIN HEADLINE - THE REQUESTED ONE */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-[1.75rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5"
        >
          <motion.span 
            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400"
            animate={{ 
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          >
            Congratulations,
          </motion.span>
          <br />
          <span className="text-white">You've Just Found One of the</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-400">
            Best Places on the Internet
          </span>{" "}
          <motion.span 
            className="inline-block"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            🐾✨
          </motion.span>
        </motion.h1>

        {/* FUN SUBHEADLINE */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed"
        >
          Your pet has <span className="text-white font-semibold">main character energy</span>. 
          We're about to prove it. 
          <span className="inline-block ml-1">💅</span>
        </motion.p>

        {/* CASUAL BENEFITS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-6"
        >
          <motion.span 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50"
            whileHover={{ scale: 1.05, rotate: -2 }}
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            Takes 60 secs (less than making coffee)
          </motion.span>
          <motion.span 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50"
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Heart className="w-4 h-4 text-pink-400" />
            Made to share
          </motion.span>
        </motion.div>

        {/* PRIMARY CTA - FUN BOUNCY */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3, type: "spring", bounce: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <Link 
            to="/intake?mode=discover" 
            onClick={() => trackCTAClick('get_tea', 'hero')} 
            className="w-full max-w-sm"
          >
            <motion.button 
              className="w-full text-lg sm:text-xl font-bold px-8 py-5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white shadow-[0_8px_32px_rgba(236,72,153,0.4)] hover:shadow-[0_12px_40px_rgba(236,72,153,0.5)] transition-all duration-300 group"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="flex items-center justify-center gap-2">
                Get the Tea on My Pet
                <span className="text-2xl">🍵</span>
              </span>
            </motion.button>
          </Link>
          
          {/* Fun trust line */}
          <p className="text-xs text-muted-foreground">
            Worst case: you get a hilarious read about your bestie 
            <span className="inline-block ml-1">🤷‍♀️</span>
          </p>
          
          {/* Social proof - casual */}
          <motion.div 
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex -space-x-2">
              {["🐕", "🐈", "🐰", "🦜"].map((emoji, i) => (
                <span 
                  key={i} 
                  className="w-8 h-8 rounded-full bg-card border-2 border-background flex items-center justify-center text-lg"
                >
                  {emoji}
                </span>
              ))}
            </div>
            <span className="text-muted-foreground">
              Join the <span className="text-white font-medium">50k+</span> pet parents in the know
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
