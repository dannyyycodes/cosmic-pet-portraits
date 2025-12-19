import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Gift, Heart, Dog } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { HomeTestimonials } from "@/components/HomeTestimonials";
import { FAQ } from "@/components/FAQ";
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
      <Navbar />
      
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

      {/* Hero Section */}
      <section className="relative flex items-center justify-center px-4 pt-28 pb-8 z-10">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-semibold leading-tight mb-6"
          >
            <span className="text-gradient-gold-purple">
              {t('hero.title')}
            </span>
          </motion.h1>

          {/* Subhead */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Two CTA Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12"
          >
            {/* Discover My Pet */}
            <Link to="/intake?mode=discover" className="group">
              <div className="relative p-8 rounded-2xl border-2 border-primary/30 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-card/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {t('hero.mostPopular')}
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-nebula-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dog className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold text-foreground">{t('hero.discoverMyPet')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('hero.discoverDesc')}
                    </p>
                  </div>
                  <Button variant="cosmic" size="lg" className="w-full mt-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('hero.startDiscovery')}
                  </Button>
                </div>
              </div>
            </Link>

            {/* Gift to a Friend */}
            <Link to="/gift" className="group">
              <div className="relative p-8 rounded-2xl border-2 border-nebula-pink/30 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-nebula-pink hover:bg-card/50 hover:shadow-[0_0_30px_hsl(330_70%_50%/0.3)] h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-nebula-pink to-nebula-purple text-white text-xs font-medium flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {t('hero.perfectGift')}
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-bold text-foreground">{t('hero.giftToFriend')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('hero.giftDesc')}
                    </p>
                  </div>
                  <Button size="lg" className="w-full mt-2 bg-gradient-to-r from-nebula-pink to-nebula-purple hover:from-nebula-pink/90 hover:to-nebula-purple/90 text-white border-0 shadow-lg group-hover:shadow-[0_0_20px_hsl(330_70%_50%/0.4)]">
                    <Heart className="w-4 h-4 mr-2" />
                    {t('hero.sendGift')}
                  </Button>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Authority Seal */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-8"
          >
            <div className="authority-seal inline-flex items-center gap-3 px-6 py-3 rounded-xl">
              <div className="relative">
                <Star className="w-5 h-5 text-gold fill-gold" />
                <Sparkles className="w-3 h-3 text-gold absolute -top-1 -right-1" />
              </div>
              <span className="text-sm text-foreground/80">
                {t('hero.poweredBy')} <span className="text-gold font-medium">{t('hero.swissEphemeris')}</span>{t('hero.craftedBy')}
              </span>
            </div>
          </motion.div>

          {/* Trust Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/40 backdrop-blur-sm border border-border/50">
              <span className="text-sm text-foreground/80">
                {t('hero.ratedBy')} <strong className="text-gold">4.9/5</strong> {t('hero.byPetParents')}
              </span>
            </div>
            {/* Trustpilot Logo */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 fill-[#00b67a] text-[#00b67a]" />
                <span className="text-xl font-semibold text-foreground tracking-tight">Trustpilot</span>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-7 h-7 flex items-center justify-center bg-[#00b67a]">
                    <Star className="w-4 h-4 fill-white text-white" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Testimonials Section */}
      <section id="testimonials" className="relative pt-6 pb-20 px-4 z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-serif text-center text-foreground mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            {t('testimonials.subtitle')}
          </p>

          <HomeTestimonials />
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />

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
