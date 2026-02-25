import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, Zap, ArrowRight, Heart, Sparkles, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PremiumTestimonials } from "@/components/PremiumTestimonials";

export default function QuickCheckout() {
  const [includePortrait, setIncludePortrait] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const basePriceCents = 2700;
  const portraitPriceCents = 800;
  const totalCents = includePortrait ? basePriceCents + portraitPriceCents : basePriceCents;
  const totalDisplay = (totalCents / 100).toFixed(0);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          quickCheckout: true,
          selectedTier: includePortrait ? "premium" : "basic",
          abVariant: "C",
          includesPortrait: includePortrait,
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

  const features = [
    "Their hidden personality traits revealed",
    "What their adorable quirks really mean",
    "Their emotional blueprint & love language",
    "Cosmic profile & zodiac insights",
    "A beautiful PDF keepsake to treasure",
  ];

  return (
    <main className="variant-c min-h-screen bg-background">
      <div className="flex flex-col items-center px-4 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
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
            <h1 className="text-2xl sm:text-3xl font-caveat font-bold text-foreground mb-2">
              Discover the Soul Behind Those Eyes
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              A beautifully crafted keepsake that captures everything you love about them.
            </p>
          </div>

          {/* Product Card */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Personality Reading</h3>
                <p className="text-xs text-muted-foreground italic">Discover who they truly are inside</p>
              </div>
              <span className="text-2xl font-bold text-foreground">$27</span>
            </div>

            <ul className="space-y-2 mb-5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Portrait Upsell Toggle */}
            <div
              className={`rounded-xl border p-4 transition-all ${
                includePortrait
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    includePortrait ? "bg-primary/15" : "bg-muted"
                  }`}>
                    <Palette className={`w-4 h-4 ${includePortrait ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Add Custom Portrait</p>
                    <p className="text-xs text-muted-foreground">A stunning artistic portrait of your pet</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-foreground">+$8</span>
                  <Switch
                    checked={includePortrait}
                    onCheckedChange={setIncludePortrait}
                  />
                </div>
              </div>
            </div>
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
                Discover Who They Really Are — ${totalDisplay}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-2">
            You'll tell us about your pet after checkout — takes 60 seconds
          </p>

          {/* Trustpilot */}
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
        </motion.div>
      </div>

      {/* Full testimonials with pet images */}
      <PremiumTestimonials />

      {/* Back link */}
      <div className="text-center pb-10">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
