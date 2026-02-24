import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Personality Reading",
    price: "$35",
    badge: null,
    features: [
      "15+ page personalized report",
      "Personality & trait breakdown",
      "Emotional blueprint",
      "Cosmic profile & zodiac",
      "Downloadable PDF keepsake",
    ],
    cta: "Get Started",
    variant: "outline" as const,
    elevated: false,
    link: "/intake?mode=discover",
  },
  {
    name: "Premium with Portrait",
    price: "$50",
    badge: "Most Popular",
    features: [
      "Everything in Personality Reading",
      "+ Custom AI pet portrait",
      "+ Owner compatibility insights",
      "+ Shareable social card",
      "+ Priority delivery",
    ],
    cta: "Get Premium",
    variant: "default" as const,
    elevated: true,
    link: "/intake?mode=discover",
  },
  {
    name: "Weekly Updates",
    price: "$4.99",
    priceSuffix: "/mo",
    badge: "Best Value",
    badgeColor: "gold",
    features: [
      "Daily personality insights",
      "Weekly horoscope updates",
      "Seasonal personality shifts",
      "Cancel anytime",
    ],
    cta: "Start Updates",
    variant: "outline" as const,
    elevated: false,
    link: "/intake?mode=discover",
    note: "Start with a one-time report. Upgrade anytime.",
  },
];

export const PricingPreview = () => {
  return (
    <section className="relative py-16 px-4 z-10">
      <div className="absolute inset-0 bg-[hsl(40_60%_87%/0.3)]" />
      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            Choose How You Want to Remember Them
          </h2>
          <p className="text-muted-foreground">
            Every option includes a beautiful, personalized report
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {tiers.map((tier, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={tier.elevated ? "md:-mt-2 md:mb-2" : ""}
            >
              <div className={`relative bg-card rounded-2xl p-6 border shadow-[var(--shadow-card)] h-full ${
                tier.elevated ? "border-primary ring-2 ring-primary/20 scale-[1.03]" : "border-border"
              }`}>
                {/* Badge */}
                {tier.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                    tier.badgeColor === "gold" 
                      ? "bg-[hsl(var(--warm-gold))] text-white" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    {tier.badge}
                  </div>
                )}

                {/* Price */}
                <div className="text-center mb-5 mt-2">
                  <h3 className="font-semibold text-foreground text-lg mb-1">{tier.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                    {tier.priceSuffix && (
                      <span className="text-sm text-muted-foreground">{tier.priceSuffix}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={tier.link} className="block">
                  <Button 
                    variant={tier.variant} 
                    className={`w-full ${tier.elevated ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>

                {/* Note */}
                {tier.note && (
                  <p className="text-xs text-muted-foreground text-center mt-3">{tier.note}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Reinforcement Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Secure checkout
          </span>
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Delivered instantly
          </span>
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            100% money-back guarantee
          </span>
        </motion.div>
      </div>
    </section>
  );
};
