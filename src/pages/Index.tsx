import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Gift, Dog } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { PremiumTestimonials } from "@/components/PremiumTestimonials";
import { FAQ } from "@/components/FAQ";
import { MoneyBackBadge } from "@/components/MoneyBackBadge";
import { CTASection } from "@/components/CTASection";

import { motion } from "framer-motion";
import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { TrackedSection } from "@/components/TrackedSection";
import { SampleCarousel } from "@/components/SampleCarousel";
import { StickyMobileCTA } from "@/components/StickyMobileCTA";
import { LiveActivityNotification } from "@/components/LiveActivityNotification";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { UrgencyBanner } from "@/components/UrgencyBanner";


const Index = () => {
  const { t } = useLanguage();
  const { trackSectionView, trackCTAClick } = usePageAnalytics('/');
  
  // Check for referral code in URL on page load
  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <UrgencyBanner />
      <Navbar />
      <StickyMobileCTA />
      <LiveActivityNotification />
      <ExitIntentPopup couponCode="COSMIC15" discountPercent={15} />
      
      {/* Dynamic Cosmic Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,35%,8%)] via-[hsl(220,35%,6%)] to-[hsl(220,35%,4%)]" />
        
        {/* Animated nebula layers */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 20% 30%, hsl(280 50% 30% / 0.5), transparent 60%)',
            animation: 'cosmic-breathe 12s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 75% 70%, hsl(220 60% 35% / 0.4), transparent 50%)',
            animation: 'cosmic-breathe 15s ease-in-out infinite reverse',
          }}
        />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, hsl(25 80% 50% / 0.15), transparent 60%)',
            animation: 'cosmic-breathe 18s ease-in-out infinite',
          }}
        />

        {/* Floating Star Particles - reduced on mobile for performance */}
        {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-starlight"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite, star-float ${Math.random() * 20 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section - Optimized for Mobile Engagement */}
      <TrackedSection sectionName="hero" onView={trackSectionView} className="relative flex items-center justify-center px-4 pt-16 sm:pt-24 pb-8 sm:pb-12 z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Trustpilot Badge - Authentic Style */}
          <motion.a
            href="https://www.trustpilot.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-flex flex-col items-center gap-1.5 mb-5"
          >
            {/* Stars Row */}
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#00b67a] mr-[1px]">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                </div>
              ))}
            </div>
            {/* Trustpilot Text + Rating */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-semibold text-foreground">Trustpilot</span>
              <span className="text-xs sm:text-sm text-muted-foreground">|</span>
              <span className="text-xs sm:text-sm text-muted-foreground">Rated <span className="text-foreground font-medium">Excellent</span></span>
            </div>
          </motion.a>
          
          {/* PUNCHY HEADLINE - Mobile first, emotional */}
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-[1.75rem] leading-[1.2] sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-3 sm:mb-5"
          >
            <span className="text-gradient-gold-purple">
              Finally Understand
            </span>
            <br />
            <span className="text-gradient-gold-purple">
              Your Pet's Soul
            </span>
          </motion.h1>

          {/* SHORT VALUE PROP - Ultra scannable on mobile */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto mb-5 sm:mb-6 leading-relaxed px-2"
          >
            Get a <span className="text-foreground font-semibold">beautiful personality report</span> that reveals what makes your companion truly special.
          </motion.p>

          {/* BENEFITS STRIP - Quick scan */}
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

          {/* PRIMARY CTA - Big, bold, thumb-friendly */}
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
            
            {/* Trust signal */}
            <p className="text-xs text-muted-foreground">
              Instant delivery • 100% Money-back guarantee
            </p>
            
            {/* Gift Option - Secondary */}
            <Link to="/gift" onClick={() => trackCTAClick('gift', 'hero')}>
              <span className="text-xs text-primary/80 hover:text-primary transition-colors underline underline-offset-2">
                🎁 Give as a gift instead
              </span>
            </Link>
          </motion.div>

          {/* ROTATING SAMPLE PREVIEWS - Viral meme style */}
          <SampleCarousel />
        </div>
      </TrackedSection>

      {/* Testimonials Section */}
      <TrackedSection sectionName="testimonials" onView={trackSectionView}>
        <PremiumTestimonials />
      </TrackedSection>

      {/* Mid-page CTA */}
      <TrackedSection sectionName="mid_cta" onView={trackSectionView}>
        <CTASection variant="mid" />
      </TrackedSection>

      {/* How It Works Section */}
      <TrackedSection sectionName="how_it_works" onView={trackSectionView}>
        <HowItWorks />
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
              Choose Your Experience
            </h2>
            <p className="text-muted-foreground">
              Whether for yourself or as a gift they'll never forget — takes just 60 seconds
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
                <div className="relative p-8 rounded-2xl border border-primary/30 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-card/50 h-full">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {t('hero.mostPopular')}
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-nebula-purple flex items-center justify-center">
                      <Dog className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-display font-bold text-foreground">{t('hero.discoverMyPet')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('hero.discoverDesc')}
                      </p>
                    </div>
                    <Button variant="cosmic" size="lg" className="w-full mt-2">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Get Started →
                    </Button>
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
                <div className="relative p-8 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/50 h-full">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    Great Gift Idea
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-nebula-purple/80 flex items-center justify-center">
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-display font-bold text-foreground">{t('hero.giftToFriend')}</h3>
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

      {/* FAQ Section */}
      <TrackedSection sectionName="faq" onView={trackSectionView}>
        <FAQ />
      </TrackedSection>

      {/* Final CTA */}
      <TrackedSection sectionName="final_cta" onView={trackSectionView}>
        <CTASection variant="final" />
      </TrackedSection>

      {/* Footer */}
      <TrackedSection sectionName="footer" onView={trackSectionView} className="relative py-12 px-4 border-t border-border/30 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground/60 text-sm mb-4">
            {t('footer.copyright')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-gold transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-gold transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-gold transition-colors">
              {t('footer.contact')}
            </Link>
            <Link to="/become-affiliate" className="text-muted-foreground hover:text-gold transition-colors">
              {t('footer.becomeAffiliate')}
            </Link>
          </div>
        </div>
      </TrackedSection>
    </main>
  );
};

export default Index;
