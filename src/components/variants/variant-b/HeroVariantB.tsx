import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, ShoppingCart, Zap, CheckCircle, ArrowRight } from "lucide-react";

interface HeroVariantBProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const HeroVariantB = ({ trackCTAClick }: HeroVariantBProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 47, seconds: 32 });
  const [spotsLeft, setSpotsLeft] = useState(7);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 2;
          minutes = 47;
          seconds = 32;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-16 sm:pt-24 pb-8 sm:pb-12 z-10">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* URGENCY BANNER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-bold mb-6 animate-pulse"
        >
          <Clock className="w-4 h-4" />
          <span>67% OFF ENDS IN</span>
          <span className="font-mono bg-white/20 px-2 py-0.5 rounded">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </motion.div>

        {/* WARNING HEADLINE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-4"
        >
          <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-wide mb-2">
            <AlertTriangle className="w-4 h-4" />
            Important Discovery
          </span>
          <h1 className="text-[1.75rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-6xl font-bold">
            <span className="text-white">You're Missing</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">90%</span>{" "}
            <span className="text-white">of What Your Pet Is Trying to Tell You</span>
          </h1>
        </motion.div>

        {/* PAIN POINTS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-2 mb-6 text-left max-w-lg mx-auto"
        >
          <p className="text-muted-foreground text-base sm:text-lg">
            Is your pet <span className="text-white font-semibold">acting out</span>? 
            Seeming <span className="text-white font-semibold">anxious</span>? 
            Becoming <span className="text-white font-semibold">distant</span>?
          </p>
          <p className="text-muted-foreground text-base sm:text-lg">
            There's a reason — and in <span className="text-amber-400 font-bold">60 seconds</span>, 
            you'll finally understand what they've been trying to say.
          </p>
        </motion.div>

        {/* SOCIAL PROOF STAT */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-900/30 border border-emerald-500/30 mb-6"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300 font-medium">
            97% of pet parents say this <span className="font-bold">changed everything</span>
          </span>
        </motion.div>

        {/* SCARCITY COUNTER */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold">
            <ShoppingCart className="w-4 h-4" />
            <span>Only <span className="text-xl font-bold text-white">{spotsLeft}</span> spots left at this price</span>
          </div>
        </motion.div>

        {/* PRIMARY CTA - RED PULSING */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="flex flex-col items-center gap-3"
        >
          <Link 
            to="/intake?mode=discover" 
            onClick={() => trackCTAClick('claim_report_urgent', 'hero')} 
            className="w-full max-w-sm"
          >
            <button className="w-full relative overflow-hidden text-lg sm:text-xl font-bold px-8 py-5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] hover:shadow-[0_0_60px_rgba(239,68,68,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group">
              {/* Pulse animation overlay */}
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="relative flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                CLAIM MY REPORT NOW
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
          
          {/* Risk reversal */}
          <p className="text-xs text-muted-foreground">
            ✓ Risk-Free: <span className="text-white font-medium">Love it or 100% refund</span> — No questions asked
          </p>
          
          {/* Price anchor */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground line-through">$59.99</span>
            <span className="text-2xl font-bold text-white">$19.99</span>
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">SAVE 67%</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
