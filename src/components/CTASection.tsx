import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Shield, Clock, Gift, Heart, CheckCircle, TreePine } from "lucide-react";
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
            {/* Christmas Gift Headline */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40 mb-4">
              <TreePine className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-red-300">🎄 Perfect Last-Minute Gift</span>
              <Gift className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
              Give the Gift They'll Never Forget
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              This Christmas, give pet lovers something truly magical — a personalized cosmic reading of their beloved companion.
            </p>
            {/* Value Stack */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" /> Instant Digital Delivery
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" /> Beautiful Gift Card
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" /> Personal Message Included
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Christmas Curiosity + Urgency */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 mb-4">
              <span className="text-sm">🎁 Holiday Special</span>
            </div>
            <p className="text-red-400 text-sm font-medium mb-3">
              ✨ The #1 Gift for Pet Lovers This Christmas...
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-4">
              Unwrap Your Pet's <span className="text-primary">Cosmic Secret</span>
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
              {isFinal ? "Get Their Gift Now" : "Start My Pet's Reading"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Gift Option - Enhanced for Christmas */}
          <Link 
            to="/gift" 
            className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-red-500/20 to-green-500/20 px-4 py-2 rounded-full border border-red-500/30 text-foreground hover:from-red-500/30 hover:to-green-500/30 transition-colors"
          >
            <Gift className="w-4 h-4 text-red-400" />
            <span>🎄 Send as Christmas Gift</span>
            <Heart className="w-3 h-3 text-red-400" />
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

        {isFinal && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 rounded-lg bg-gradient-to-r from-red-500/20 via-green-500/10 to-red-500/20 border border-red-500/30"
          >
            <p className="text-sm font-medium flex items-center justify-center gap-2">
              <TreePine className="w-4 h-4 text-green-400" />
              <span className="text-red-300">Christmas Bonus:</span>
              <span className="text-foreground">Free gift wrapping + festive presentation</span>
              <Gift className="w-4 h-4 text-red-400" />
            </p>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}