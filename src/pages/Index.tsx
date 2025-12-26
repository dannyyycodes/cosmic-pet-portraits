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

const Index = () => {
  const { t } = useLanguage();
  const { trackSectionView, trackCTAClick } = usePageAnalytics('/');
  
  // Check for referral code in URL on page load
  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <StickyMobileCTA />
      <LiveActivityNotification />
      
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
      <TrackedSection sectionName="hero" onView={trackSectionView} className="relative flex items-center justify-center px-4 pt-20 sm:pt-24 pb-10 sm:pb-12 z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* MOBILE-FIRST: Social Proof Badge - Show trust immediately */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center bg-[#00b67a] rounded-sm">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white" />
                </div>
              ))}
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground">2,847+ Happy Pet Parents</span>
          </motion.div>
          
          {/* PUNCHY HEADLINE - Instant clarity */}
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight mb-3 sm:mb-6"
          >
            <span className="text-gradient-gold-purple block">
              Discover What Makes
            </span>
            <span className="text-gradient-gold-purple block">
              Your Best Friend Unique 🐾
            </span>
          </motion.h1>

          {/* SHORT VALUE PROP - Mobile optimized */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-5 sm:mb-8 leading-relaxed"
          >
            A <span className="text-foreground font-semibold">personalized personality report</span> that captures everything special about your beloved companion.
            <span className="hidden sm:inline"> Thousands of pet parents have been moved to tears.</span>
            <span className="text-foreground font-medium"> Ready in 60 seconds.</span>
          </motion.p>

          {/* PRIMARY CTA - Big and obvious */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex flex-col items-center gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            <Link to="/intake?mode=discover" onClick={() => trackCTAClick('get_reading', 'hero')} className="w-full sm:w-auto max-w-xs sm:max-w-none">
              <Button variant="cosmic" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 group shadow-[0_0_30px_hsl(var(--primary)/0.4)] animate-pulse-glow">
              <Sparkles className="w-5 h-5 mr-2 shrink-0" />
                <span className="whitespace-nowrap">Get My Pet's Report</span>
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </Link>
            
            {/* Trust Signals */}
            <p className="text-xs sm:text-sm text-muted-foreground">
              Instant delivery • 100% Money-back guarantee
            </p>
            
            {/* Gift Option - Secondary */}
            <Link to="/gift" onClick={() => trackCTAClick('gift', 'hero')}>
              <Button 
                variant="ghost"
                size="sm" 
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                <Gift className="w-4 h-4 mr-1.5" />
                Or give as a gift 🎁
              </Button>
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
