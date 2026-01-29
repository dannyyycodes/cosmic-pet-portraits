import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface CTAVariantBProps {
  variant: "mid" | "final";
  trackCTAClick?: (cta: string, location: string) => void;
}

export const CTAVariantB = ({ variant, trackCTAClick }: CTAVariantBProps) => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 47, seconds: 32 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 47;
          seconds = 32;
        }
        return { minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-16 px-4 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Urgency Box */}
        <div className="relative p-8 rounded-2xl bg-gradient-to-b from-red-950/40 to-card/40 border border-red-500/30 backdrop-blur-sm">
          {/* Timer Badge */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-bold">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>OFFER EXPIRES IN {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 mt-4">
            {variant === "mid" ? (
              <>Don't Let Another Day Pass in Confusion</>
            ) : (
              <>Your Pet Is Waiting to Be Understood</>
            )}
          </h2>

          <p className="text-muted-foreground mb-6">
            {variant === "mid" ? (
              <>Every moment of misunderstanding chips away at your bond. Get clarity <span className="text-white font-semibold">in 60 seconds</span>.</>
            ) : (
              <>This is your last chance at today's special price. Tomorrow it goes back to full price.</>
            )}
          </p>

          {/* Price */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-2xl text-muted-foreground line-through">$59.99</span>
            <span className="text-4xl font-bold text-white">$19.99</span>
            <span className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg">67% OFF</span>
          </div>

          {/* CTA Button */}
          <Link 
            to="/intake?mode=discover" 
            onClick={() => trackCTAClick?.('claim_report_urgent', `cta_${variant}`)}
            className="block"
          >
            <button className="w-full max-w-md mx-auto relative overflow-hidden text-lg font-bold px-8 py-5 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)] hover:shadow-[0_0_60px_rgba(239,68,68,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group">
              <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
              <span className="relative flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                CLAIM MY REPORT NOW
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>

          {/* Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Money-Back Guarantee
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-400" />
              Instant Delivery
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
