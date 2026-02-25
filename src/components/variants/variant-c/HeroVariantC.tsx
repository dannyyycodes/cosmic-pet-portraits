import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SampleCarousel } from "@/components/SampleCarousel";

interface HeroVariantCProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const HeroVariantC = ({ trackCTAClick }: HeroVariantCProps) => {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-14 sm:pt-20 pb-12 sm:pb-16 z-10">
      <div className="max-w-3xl mx-auto text-center">

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-[1.75rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-bold text-foreground mb-5"
        >
          You'll Never Look at Them{" "}
          <span className="text-foreground">The Same Way Again</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed"
        >
          A beautifully crafted report that reveals the soul of your beloved companion — their quirks, their love language, and why they chose you.
        </motion.p>

        {/* Pattern Interrupt Bullet Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground mb-8"
        >
          {[
            "Finally understand what's behind those eyes",
            "Discover how deeply they love you",
            "A keepsake you'll treasure forever",
          ].map((text, i) => (
            <span key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary shrink-0" />
              {text}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col items-center gap-3 mb-10"
        >
          <Link to="/checkout?tier=premium" onClick={() => trackCTAClick('get_reading', 'hero')} className="w-full max-w-sm">
            <Button size="lg" className="w-full text-base sm:text-lg px-6 py-7 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold group transition-all">
              Discover Who They Really Are
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Trustpilot Badge — compact, below CTA */}
          <div className="inline-flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-[#00B67A] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">Excellent</span> on <span className="font-bold text-[#00B67A]">★ Trustpilot</span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Instant delivery · 100% money-back guarantee
          </p>
        </motion.div>

        {/* Sample Carousel with real pet photos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <SampleCarousel />
        </motion.div>
      </div>
    </section>
  );
};