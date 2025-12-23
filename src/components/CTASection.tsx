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
              Your Best Friend Deserves to Be Understood
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              "Reading this made me fall in love with my cat all over again." — Join 50,000+ pet parents who truly <em>get</em> their companion.
            </p>
            {/* Value Stack */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Instant Delivery
              </span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Deeply Personal
              </span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> 7-Day Money-Back Guarantee
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-4">
              Learn What Makes <span className="text-primary">Your Companion Special</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              A heartfelt personality report that captures the soul of your beloved friend.
            </p>
          </>
        )}

        <div className="flex flex-col items-center gap-4 mb-6">
          <Link to="/intake?mode=discover">
            <Button variant="cosmic" size="lg" className="text-lg px-8 py-6 group shadow-[0_0_25px_hsl(var(--primary)/0.3)]">
              <Sparkles className="w-5 h-5 mr-2" />
              {isFinal ? "Get My Pet's Report →" : "Discover My Pet's Personality →"}
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