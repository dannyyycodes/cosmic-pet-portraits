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
              You Know They're Weird. Now Find Out <em>How</em> Weird.
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              "I showed my dog his report. He looked guilty. That's how I knew it was accurate." — Join 50,000+ pet parents who finally get it.
            </p>
            {/* Value Stack */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Instant Delivery
              </span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Scarily Accurate
              </span>
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-4 h-4" /> Money-Back If Your Pet Disagrees
              </span>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-4">
              Your Pet Has Opinions. <span className="text-primary">We've Translated Them.</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              A personality report that explains all those "quirks" you've been wondering about.
            </p>
          </>
        )}

        <div className="flex flex-col items-center gap-4 mb-6">
          <Link to="/intake?mode=discover">
            <Button variant="cosmic" size="lg" className="text-lg px-8 py-6 group shadow-[0_0_25px_hsl(var(--primary)/0.3)]">
              <Sparkles className="w-5 h-5 mr-2" />
              {isFinal ? "Okay Fine, Expose My Pet →" : "Get My Pet's Report →"}
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