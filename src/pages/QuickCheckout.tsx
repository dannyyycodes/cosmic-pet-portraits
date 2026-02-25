import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, Zap, ArrowRight, Crown, Sparkles, Camera } from "lucide-react";
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
    features: [
      "15+ page personalized report",
      "Personality & trait breakdown",
      "Emotional blueprint",
      "Cosmic profile & zodiac",
      "Downloadable PDF keepsake",
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
    features: [
      "Everything in Personality Reading",
      "+ Custom AI pet portrait",
      "+ Owner compatibility insights",
      "+ Shareable social card",
      "+ Priority delivery",
    ],
  },
};

type TierKey = "basic" | "premium";

export default function QuickCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tierParam = (searchParams.get("tier") || "premium") as TierKey;
  const [selectedTier, setSelectedTier] = useState<TierKey>(
    tierParam === "basic" ? "basic" : "premium"
  );
  const [isLoading, setIsLoading] = useState(false);

  const tier = TIERS[selectedTier];

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // Create a minimal report record server-side via create-checkout with quickCheckout mode
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

      // Redirect to Stripe
      window.location.href = data.url;
    } catch (err: any) {
      console.error("[QuickCheckout] Error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            Choose Your Reading
          </h1>
          <p className="text-muted-foreground text-sm">
            You'll tell us about your pet after checkout — it takes 60 seconds
          </p>
        </div>

        {/* Tier Cards */}
        <div className="space-y-4 mb-8">
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
                    ? "border-primary bg-primary/5 shadow-[var(--shadow-card)]"
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
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-semibold text-foreground">{t.name}</h3>
                      <span className="text-xl font-bold text-foreground">
                        ${(t.priceCents / 100).toFixed(0)}
                      </span>
                    </div>
                    <ul className="space-y-1">
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
              Pay ${(tier.priceCents / 100).toFixed(0)} — Secure Checkout
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        {/* Trustpilot Badge */}
        <div className="flex items-center justify-center gap-2 mt-4">
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