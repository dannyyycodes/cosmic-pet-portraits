import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Shield, Clock } from "lucide-react";
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
              Don't Let Another Day Pass Without Knowing
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Your pet's cosmic story is waiting to be revealed. Join 50,000+ pet parents who've discovered their pet's true soul.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-4">
              Ready to Discover Your Pet's Secret Soul?
            </h2>
            <p className="text-muted-foreground mb-8">
              It only takes 60 seconds to unlock insights that will change your relationship forever.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link to="/intake?mode=discover">
            <Button variant="cosmic" size="lg" className="text-lg px-8 py-6 group">
              <Sparkles className="w-5 h-5 mr-2" />
              Start My Pet's Reading
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Takes 60 seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            <span>100% Money-Back Guarantee</span>
          </div>
        </div>

        {isFinal && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-sm text-primary font-medium"
          >
            ⚡ Limited time: Full report + bonus content included
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}