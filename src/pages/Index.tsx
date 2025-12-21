import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Gift, Heart, Dog, Zap, Clock, TreePine } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { PremiumTestimonials } from "@/components/PremiumTestimonials";
import { FAQ } from "@/components/FAQ";
import { SocialProofBar } from "@/components/SocialProofBar";
import { UrgencyBanner } from "@/components/UrgencyBanner";

import { MoneyBackBadge } from "@/components/MoneyBackBadge";
import { CTASection } from "@/components/CTASection";
import { Snowfall } from "@/components/Snowfall";
import { ChristmasDecorations } from "@/components/ChristmasDecorations";
import { FestivePets } from "@/components/FestivePets";
import { motion } from "framer-motion";
import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
  
  // Check for referral code in URL on page load
  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Christmas Effects */}
      <Snowfall />
      <ChristmasDecorations />
      <FestivePets />
      <UrgencyBanner />
      <Navbar />
      <SocialProofBar />
      
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

      {/* Hero Section - Optimized with power words + loss aversion */}
      <section className="relative flex items-center justify-center px-4 pt-24 pb-12 z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Christmas Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-green-500/20 border border-red-500/40 mb-6"
          >
            <TreePine className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              🎄 The #1 Christmas Gift for Pet Lovers
            </span>
            <Gift className="w-4 h-4 text-red-400" />
          </motion.div>
          
          {/* Main Headline - Emotion + Curiosity Gap */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold leading-tight mb-6"
          >
            <span className="text-gradient-gold-purple">
              {t('hero.title')}
            </span>
          </motion.h1>

          {/* Subhead - Specificity + Benefit */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            In just <span className="text-foreground font-medium">60 seconds</span>, discover the hidden personality, cosmic purpose, and secret desires your pet has been trying to share with you all along.
          </motion.p>

          {/* Primary CTA + Gift Option */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4 mb-8"
          >
            <Link to="/intake?mode=discover">
              <Button variant="cosmic" size="lg" className="text-lg px-10 py-7 group shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                <Sparkles className="w-5 h-5 mr-2" />
                Yes! Reveal My Pet's Soul
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </Link>
            
            {/* Gift Option - Christmas Enhanced */}
            <Link to="/gift">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-gradient-to-r from-red-500 to-green-600 hover:from-red-600 hover:to-green-700 text-white border-0 shadow-[0_0_25px_rgba(239,68,68,0.4)] group"
              >
                <Gift className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                🎁 Send as Christmas Gift
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </Link>

          </motion.div>

          {/* Money-Back Guarantee */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-6"
          >
            <MoneyBackBadge />
          </motion.div>

          {/* Trustpilot - Compact with specificity */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 flex items-center justify-center bg-[#00b67a]">
                    <Star className="w-3 h-3 fill-white text-white" />
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">Trustpilot</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">4.9/5</span> from 2,847 verified pet parents
            </p>
          </motion.div>
        </div>
      </section>

      {/* Removed floating LiveActivityIndicator - now inline in hero */}
      <PremiumTestimonials />

      {/* Mid-page CTA - Capture warm leads */}
      <CTASection variant="mid" />

      {/* How It Works Section - Reduces friction */}
      <HowItWorks />

      {/* Two Options Cards - For those who want to explore */}
      <section className="relative py-16 px-4 z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
              <span className="text-sm text-red-300">🎄 Holiday Special</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">
              Give the Gift of Understanding
            </h2>
            <p className="text-muted-foreground">
              A magical reading for your pet, or the perfect Christmas gift for any pet lover
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Discover My Pet */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link to="/intake?mode=discover" className="group block">
                <div className="relative p-8 rounded-2xl border-2 border-primary/30 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-card/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {t('hero.mostPopular')}
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-nebula-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Dog className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-display font-bold text-foreground">{t('hero.discoverMyPet')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('hero.discoverDesc')}
                      </p>
                    </div>
                    <Button variant="cosmic" size="lg" className="w-full mt-2 group-hover:scale-[1.02] transition-transform">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Now →
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
              <Link to="/gift" className="group block">
                <div className="relative p-8 rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-500/10 to-green-500/10 backdrop-blur-sm transition-all duration-300 hover:border-red-500/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] h-full">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-red-500 to-green-600 text-white text-xs font-medium flex items-center gap-1">
                    <TreePine className="w-3 h-3" />
                    🎄 Christmas Gift
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-xl font-display font-bold text-foreground">🎁 {t('hero.giftToFriend')}</h3>
                      <p className="text-sm text-muted-foreground">
                        The perfect Christmas surprise — arrives instantly!
                      </p>
                    </div>
                    <Button size="lg" className="w-full mt-2 bg-gradient-to-r from-red-500 to-green-600 hover:from-red-600 hover:to-green-700 text-white border-0 shadow-lg group-hover:scale-[1.02] transition-transform">
                      <Gift className="w-4 h-4 mr-2" />
                      Send Christmas Gift →
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Handle objections */}
      <FAQ />

      {/* Final CTA - Urgency + Last chance */}
      <CTASection variant="final" />

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-border/30 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground/60 text-sm mb-4">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
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
      </footer>
    </main>
  );
};

export default Index;
