import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, Zap, ArrowRight, Crown, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIERS = {
  basic: {
    id: "basic",
    name: "Personality Reading",
    priceCents: 2700,
    icon: Sparkles,
    highlight: false,
    includesPortrait: false,
    badge: null as string | null,
    subtitle: "Discover who they truly are inside",
    features: [
      "Their hidden personality traits revealed",
      "What their adorable quirks really mean",
      "Their emotional blueprint & love language",
      "Cosmic profile & zodiac insights",
      "A beautiful PDF keepsake to treasure",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium with Portrait",
    priceCents: 3500,
    badge: "Most Popular",
    icon: Crown,
    highlight: true,
    includesPortrait: true,
    subtitle: "The complete window into their soul",
    features: [
      "Everything in Personality Reading, plus…",
      "A stunning custom portrait of them",
      "Deep insights into your unique bond",
      "Shareable card to show friends & family",
      "Priority delivery — ready in minutes",
    ],
  },
};

type TierKey = "basic" | "premium";

// Static decorative paw SVG
const PawAccent = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="65" rx="20" ry="18" />
    <ellipse cx="30" cy="40" rx="10" ry="12" />
    <ellipse cx="50" cy="30" rx="10" ry="12" />
    <ellipse cx="70" cy="40" rx="10" ry="12" />
  </svg>
);

export default function QuickCheckout() {
  const [searchParams] = useSearchParams();
  const tierParam = (searchParams.get("tier") || "premium") as TierKey;
  const [selectedTier, setSelectedTier] = useState<TierKey>(
    tierParam === "basic" ? "basic" : "premium"
  );
  const [isLoading, setIsLoading] = useState(false);

  const tier = TIERS[selectedTier];

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          quickCheckout: true,
          selectedTier,
          abVariant: "C",
          includesPortrait: tier.includesPortrait,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");

      window.location.href = data.url;
    } catch (err: any) {
      console.error("[QuickCheckout] Error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="variant-c min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative paw/heart accents — subtle, non-interfering */}
      <PawAccent className="absolute top-12 left-6 w-20 h-20 text-primary/[0.06] rotate-[-20deg] pointer-events-none" />
      <PawAccent className="absolute bottom-16 right-8 w-24 h-24 text-primary/[0.05] rotate-[15deg] pointer-events-none" />
      <Heart className="absolute top-32 right-12 w-10 h-10 text-primary/[0.07] rotate-12 pointer-events-none" />
      <Heart className="absolute bottom-40 left-10 w-8 h-8 text-primary/[0.06] -rotate-12 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"
          >
            <Heart className="w-3.5 h-3.5 fill-primary" />
            Loved by 12,000+ pet parents
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">
            Discover the Soul Behind Those Eyes
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
            A beautifully crafted keepsake that captures everything you love about them.
            You'll tell us about your pet after checkout — it only takes 60 seconds.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="space-y-4 mb-6">
          {(["basic", "premium"] as const).map((tierKey) => {
            const t = TIERS[tierKey];
            const isSelected = selectedTier === tierKey;
            const Icon = t.icon;

            return (
              <button
                key={tierKey}
                onClick={() => setSelectedTier(tierKey)}
                className={cn(
                  "relative w-full text-left p-5 rounded-2xl border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {t.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    {t.badge}
                  </span>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1",
                      isSelected ? "bg-primary/15" : "bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <h3 className="font-semibold text-foreground">{t.name}</h3>
                      <span className="text-xl font-bold text-foreground">
                        ${(t.priceCents / 100).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 italic">{t.subtitle}</p>
                    <ul className="space-y-1.5">
                      {t.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="tier-check"
                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* Checkout Button */}
        <Button
          size="lg"
          className="w-full py-7 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl group"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            "Redirecting to checkout..."
          ) : (
            <>
              Discover Who They Really Are — ${(tier.priceCents / 100).toFixed(0)}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* Testimonial Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-center"
        >
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            "I cried reading it — it captured him perfectly. Like someone finally saw what I see every day."
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">— Sarah M., golden retriever mom</p>
        </motion.div>

        {/* Trustpilot Badge */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-[#00B67A] flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Excellent</span> on{" "}
            <span className="font-bold text-[#00B67A]">★ Trustpilot</span>
          </span>
        </div>

        {/* Trust Strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            Secure checkout
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Instant delivery
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-primary" />
            100% money-back guarantee
          </span>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
