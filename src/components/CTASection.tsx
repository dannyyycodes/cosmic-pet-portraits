import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Shield, Clock, Gift, Heart, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface CTASectionProps {
  variant?: "mid" | "final";
}

export function CTASection({ variant = "mid" }: CTASectionProps) {
  const isFinal = variant === "final";

  return (
    <section className="relative py-16 px-4 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center"
      >
        {isFinal ? (
          <>
            {/* Loss Aversion Headline */}
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
              Every Day You Wait, You're Missing Their Message
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Your pet won't be here forever. Discover what they've been trying to tell you — before it's too late.
            </p>
            {/* Value Stack */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" /> Full Cosmic Reading
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" /> Personality Breakdown
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" /> Shareable Story Card
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Curiosity + Urgency */}
            <p className="text-primary text-sm font-medium mb-3">
              ✨ You've seen what others discovered...
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-4">
              What Secret Is <span className="text-primary">Your</span> Pet Keeping?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join 52,847 pet parents who finally understand their furry companion. Takes just 60 seconds.
            </p>
          </>
        )}

        <div className="flex flex-col items-center gap-4 mb-6">
          <Link to="/intake?mode=discover">
            <Button variant="cosmic" size="lg" className="text-lg px-8 py-6 group shadow-[0_0_25px_hsl(var(--primary)/0.3)]">
              <Sparkles className="w-5 h-5 mr-2" />
              {isFinal ? "Yes! Reveal Their Soul Now" : "Start My Pet's Reading"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Gift Option */}
          <Link 
            to="/gift" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-nebula-pink transition-colors"
          >
            <Gift className="w-4 h-4" />
            <span>Gift to a friend</span>
            <Heart className="w-3 h-3 text-nebula-pink" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>60 seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>100% Money-Back Guarantee</span>
          </div>
        </div>

        {isFinal && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 rounded-lg bg-primary/10 border border-primary/30"
          >
            <p className="text-sm text-primary font-medium">
              ⚡ Today only: Complete reading + bonus compatibility insights included free
            </p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}