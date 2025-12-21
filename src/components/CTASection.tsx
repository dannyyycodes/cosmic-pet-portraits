import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Shield, Clock, Gift, CheckCircle } from "lucide-react";
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
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
              Ready to Understand Your Pet Better?
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of pet parents who've discovered what makes their companions unique.
            </p>
            {/* Value Stack */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Instant Digital Delivery
              </span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Personalized Insights
              </span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Money-Back Guarantee
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-4">
              Discover Your Pet's <span className="text-primary">Unique Personality</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Over 50,000 pet parents have unlocked insights about their companions. Takes just 60 seconds.
            </p>
          </>
        )}

        <div className="flex flex-col items-center gap-4 mb-6">
          <Link to="/intake?mode=discover">
            <Button variant="cosmic" size="lg" className="text-lg px-8 py-6 group shadow-[0_0_25px_hsl(var(--primary)/0.3)]">
              <Sparkles className="w-5 h-5 mr-2" />
              {isFinal ? "Get Their Gift Now" : "Start My Pet's Reading"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Gift Option */}
          <Link 
            to="/gift" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Gift className="w-4 h-4" />
            <span>Or send as a gift →</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Instant Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>100% Money-Back Guarantee</span>
          </div>
        </div>

      </motion.div>
    </section>
  );
}