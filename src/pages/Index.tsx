import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Gift, Dog, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { PremiumTestimonials } from "@/components/PremiumTestimonials";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";

import { motion } from "framer-motion";
import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { TrackedSection } from "@/components/TrackedSection";
import { SampleCarousel } from "@/components/SampleCarousel";

// A/B Test imports
import { VariantRenderer } from "@/components/ab-test/VariantRenderer";
import { VariantOnly } from "@/components/ab-test/VariantRenderer";
import { useABTest } from "@/hooks/useABTest";
import { HeroVariantB } from "@/components/variants/variant-b/HeroVariantB";
import { TestimonialsVariantB } from "@/components/variants/variant-b/TestimonialsVariantB";
import { CTAVariantB } from "@/components/variants/variant-b/CTAVariantB";
import { HeroVariantC } from "@/components/variants/variant-c/HeroVariantC";
import { TestimonialsVariantC } from "@/components/variants/variant-c/TestimonialsVariantC";
import { CTAVariantC } from "@/components/variants/variant-c/CTAVariantC";

// Variant C exclusive sections
import { VariantBackground } from "@/components/variants/VariantBackground";
import { MicroFAQ } from "@/components/variants/variant-c/MicroFAQ";
import { ReportPreviewSection } from "@/components/variants/variant-c/ReportPreviewSection";
import { VideoTestimonials } from "@/components/variants/variant-c/VideoTestimonials";
import { PerfectForSection } from "@/components/variants/variant-c/PerfectForSection";
import { PricingPreview } from "@/components/variants/variant-c/PricingPreview";
import { HowItWorksVariantC } from "@/components/variants/variant-c/HowItWorksVariantC";
import { FAQVariantC } from "@/components/variants/variant-c/FAQVariantC";


// Original Hero content extracted as a component for Variant A
const HeroVariantA = ({ trackCTAClick, t }: { trackCTAClick: (cta: string, location: string) => void; t: (key: string) => string }) => (
  <div className="max-w-4xl mx-auto text-center">
    {/* Trustpilot Badge - Authentic Style */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="inline-flex flex-col items-center gap-1.5 mb-5"
    >
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#00b67a] mr-[1px]">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm sm:text-base font-semibold text-foreground">Trustpilot</span>
        <span className="text-xs sm:text-sm text-muted-foreground">|</span>
        <span className="text-xs sm:text-sm text-muted-foreground">Rated <span className="text-foreground font-medium">Excellent</span></span>
      </div>
    </motion.div>
    
    <motion.h1 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="text-[1.75rem] leading-[1.2] sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-3 sm:mb-5"
    >
      <span className="text-gradient-gold-purple">Finally Understand</span>
      <br />
      <span className="text-gradient-gold-purple">Your Pet's Soul</span>
    </motion.h1>

    <motion.p 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-5 sm:mb-6 leading-relaxed px-2"
    >
      Get a <span className="text-foreground font-semibold">beautiful personality report</span> that reveals what makes your companion truly special.
    </motion.p>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground mb-5"
    >
      <span className="flex items-center gap-1">
        <span className="text-emerald-400">✓</span> Ready in 60 seconds
      </span>
      <span className="flex items-center gap-1">
        <span className="text-emerald-400">✓</span> Money-back guarantee
      </span>
      <span className="flex items-center gap-1 hidden sm:flex">
        <span className="text-emerald-400">✓</span> Shareable keepsake
      </span>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="flex flex-col items-center gap-3 mb-6"
    >
      <Link to="/intake?mode=discover" onClick={() => trackCTAClick('get_reading', 'hero')} className="w-full max-w-sm">
        <Button variant="cosmic" size="lg" className="w-full text-base sm:text-lg px-6 py-7 group shadow-[0_0_40px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] transition-shadow">
          <Sparkles className="w-5 h-5 mr-2 shrink-0" />
          <span>Discover My Pet's Personality</span>
          <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
        </Button>
      </Link>
      
      <p className="text-xs text-muted-foreground">
        Instant delivery • 100% Money-back guarantee
      </p>
      
      <Link to="/gift" onClick={() => trackCTAClick('gift', 'hero')}>
        <span className="text-xs text-primary/80 hover:text-primary transition-colors underline underline-offset-2">
          🎁 Give as a gift instead
        </span>
      </Link>
    </motion.div>

    <SampleCarousel />
  </div>
);

const Index = () => {
  const { t } = useLanguage();
  const { trackSectionView, trackCTAClick } = usePageAnalytics('/');
  const { variant, isVariantC } = useABTest();
  
  // Check for referral code in URL on page load
  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* Dynamic Background -- Variant-aware */}
      <VariantBackground />

      {/* Hero Section - A/B Tested */}
      <TrackedSection sectionName="hero" onView={trackSectionView} className="relative z-10">
        <VariantRenderer
          variants={{
            A: <section className="flex items-center justify-center px-4 pt-16 sm:pt-24 pb-8 sm:pb-12"><HeroVariantA trackCTAClick={trackCTAClick} t={t} /></section>,
            B: <HeroVariantB trackCTAClick={trackCTAClick} />,
            C: <HeroVariantC trackCTAClick={trackCTAClick} />,
          }}
        />
      </TrackedSection>

      {/* Micro FAQ -- Variant C only */}
      <VariantOnly variants="C">
        <MicroFAQ />
      </VariantOnly>

      {/* Report Preview -- Variant C only */}
      <VariantOnly variants="C">
        <TrackedSection sectionName="report_preview" onView={trackSectionView}>
          <ReportPreviewSection />
        </TrackedSection>
      </VariantOnly>

      {/* UGC Videos -- Variant C only */}
      <VariantOnly variants="C">
        <TrackedSection sectionName="video_testimonials" onView={trackSectionView}>
          <VideoTestimonials />
        </TrackedSection>
      </VariantOnly>

      {/* Testimonials Section - A/B Tested */}
      <TrackedSection sectionName="testimonials" onView={trackSectionView}>
        <VariantRenderer
          variants={{
            A: <PremiumTestimonials />,
            B: <TestimonialsVariantB />,
            C: <TestimonialsVariantC />,
          }}
        />
      </TrackedSection>

      {/* Perfect For -- Variant C only */}
      <VariantOnly variants="C">
        <PerfectForSection />
      </VariantOnly>

      {/* Pricing Preview -- Variant C only */}
      <VariantOnly variants="C">
        <TrackedSection sectionName="pricing" onView={trackSectionView}>
          <PricingPreview />
        </TrackedSection>
      </VariantOnly>

      {/* How It Works Section -- A/B/C */}
      <TrackedSection sectionName="how_it_works" onView={trackSectionView}>
        <VariantRenderer
          variants={{
            A: <HowItWorks />,
            B: <HowItWorks />,
            C: <HowItWorksVariantC />,
          }}
        />
      </TrackedSection>

      {/* Two Options Cards */}
      <TrackedSection sectionName="options_cards" onView={trackSectionView} className="relative py-16 px-4 z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">
              {isVariantC ? "Two Ways to Start" : "Choose Your Experience"}
            </h2>
            <p className="text-muted-foreground">
              {isVariantC
                ? "Whether for yourself or as a gift they'll never forget"
                : "Whether for yourself or as a gift they'll never forget — takes just 60 seconds"
              }
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Discover My Pet */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link to="/intake?mode=discover" className="group block" onClick={() => trackCTAClick('get_reading', 'options_cards')}>
                <div className={`relative p-8 rounded-2xl border transition-all duration-300 h-full ${
                  isVariantC 
                    ? "border-primary/30 hover:border-primary bg-card shadow-[var(--shadow-card)]" 
                    : "border-primary/30 hover:border-primary bg-card/30 backdrop-blur-sm hover:bg-card/50"
                }`}>
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                    isVariantC ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground"
                  }`}>
                    {t('hero.mostPopular')}
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      isVariantC ? "bg-primary/10" : "bg-gradient-to-br from-primary to-nebula-purple"
                    }`}>
                      <Dog className={`w-7 h-7 ${isVariantC ? "text-primary" : "text-white"}`} />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-display font-bold text-foreground">
                        For My Pet
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isVariantC ? "Get a beautiful personalized personality report" : t('hero.discoverDesc')}
                      </p>
                    </div>
                    {isVariantC ? (
                      <Button size="lg" className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button variant="cosmic" size="lg" className="w-full mt-2">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Get Started →
                      </Button>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Gift to a Friend */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link to="/gift" className="group block" onClick={() => trackCTAClick('gift', 'options_cards')}>
                <div className={`relative p-8 rounded-2xl border transition-all duration-300 h-full ${
                  isVariantC 
                    ? "border-border hover:border-primary/50 bg-card shadow-[var(--shadow-card)]" 
                    : "border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/50 hover:bg-card/50"
                }`}>
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                    isVariantC ? "bg-secondary text-muted-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    Great Gift Idea
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      isVariantC ? "bg-primary/10" : "bg-gradient-to-br from-primary/80 to-nebula-purple/80"
                    }`}>
                      <Gift className={`w-7 h-7 ${isVariantC ? "text-primary" : "text-white"}`} />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-display font-bold text-foreground">
                        For a Friend
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        A unique, personalized gift — delivered instantly
                      </p>
                    </div>
                    <Button variant="outline" size="lg" className="w-full mt-2 border-primary/40 hover:bg-primary/10">
                      <Gift className="w-4 h-4 mr-2" />
                      Send as Gift →
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </TrackedSection>

      {/* Mid-page CTA - A/B Tested */}
      <TrackedSection sectionName="mid_cta" onView={trackSectionView}>
        <VariantRenderer
          variants={{
            A: <CTASection variant="mid" />,
            B: <CTAVariantB variant="mid" trackCTAClick={trackCTAClick} />,
            C: <CTAVariantC variant="mid" trackCTAClick={trackCTAClick} />,
          }}
        />
      </TrackedSection>

      {/* FAQ Section -- A/B/C */}
      <TrackedSection sectionName="faq" onView={trackSectionView}>
        <VariantRenderer
          variants={{
            A: <FAQ />,
            B: <FAQ />,
            C: <FAQVariantC />,
          }}
        />
      </TrackedSection>

      {/* Final CTA - A/B Tested */}
      <TrackedSection sectionName="final_cta" onView={trackSectionView}>
        <VariantRenderer
          variants={{
            A: <CTASection variant="final" />,
            B: <CTAVariantB variant="final" trackCTAClick={trackCTAClick} />,
            C: <CTAVariantC variant="final" trackCTAClick={trackCTAClick} />,
          }}
        />
      </TrackedSection>

      {/* Footer */}
      <TrackedSection sectionName="footer" onView={trackSectionView} className="relative py-12 px-4 border-t border-border/30 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground/60 text-sm mb-4">
            {t('footer.copyright')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link to="/terms" className={`text-muted-foreground ${isVariantC ? "hover:text-primary" : "hover:text-gold"} transition-colors`}>
              {t('footer.terms')}
            </Link>
            <Link to="/privacy" className={`text-muted-foreground ${isVariantC ? "hover:text-primary" : "hover:text-gold"} transition-colors`}>
              {t('footer.privacy')}
            </Link>
            <Link to="/contact" className={`text-muted-foreground ${isVariantC ? "hover:text-primary" : "hover:text-gold"} transition-colors`}>
              {t('footer.contact')}
            </Link>
            <Link to="/become-affiliate" className={`text-muted-foreground ${isVariantC ? "hover:text-primary" : "hover:text-gold"} transition-colors`}>
              {t('footer.becomeAffiliate')}
            </Link>
          </div>
        </div>
      </TrackedSection>
    </main>
  );
};

export default Index;
