import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Check, ArrowRight, Zap, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroVariantCProps {
  trackCTAClick: (cta: string, location: string) => void;
}

export const HeroVariantC = ({ trackCTAClick }: HeroVariantCProps) => {
  return (
    <section className="relative flex flex-col items-center justify-center px-4 pt-20 sm:pt-28 pb-12 sm:pb-16 z-10">
      <div className="max-w-3xl mx-auto text-center">
        
        {/* Social Proof Above Fold */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-[hsl(var(--warm-gold))] text-[hsl(var(--warm-gold))]" />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">4.9 from 2,347 reviews</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-[1.75rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-bold text-foreground mb-5"
        >
          You'll Never Look at Your Pet{" "}
          <span className="text-primary">the Same Way Again</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed"
        >
          A 15+ page personalized report that captures who your companion really is — their quirks, their love language, and why they do the things they do. Delivered instantly.
        </motion.p>

        {/* Pattern Interrupt Bullet Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground mb-8"
        >
          {[
            "Understand why they do what they do",
            "Discover their emotional blueprint",
            "Keep a beautifully designed memory forever",
          ].map((text, i) => (
            <span key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[hsl(var(--warm-sage))] shrink-0" />
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
          <Link to="/intake?mode=discover" onClick={() => trackCTAClick('get_reading', 'hero')} className="w-full max-w-sm">
            <Button size="lg" className="w-full text-base sm:text-lg px-6 py-7 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold group transition-all">
              Meet My Pet's True Self
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Instant delivery · 100% money-back guarantee
          </p>
        </motion.div>

        {/* Micro Pet Excerpt Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-card rounded-2xl p-6 border border-border shadow-[var(--shadow-card)]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">From a real report</p>
            <p className="text-sm font-semibold text-foreground mb-1">Bella — Golden Retriever, Age 4</p>
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              "Bella loves intensely. She doesn't just greet you at the door — she celebrates you. Her emotional world is vast, and her loyalty runs deeper than most humans will ever understand."
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
