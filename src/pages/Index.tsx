import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LanguageSelector } from "@/components/LanguageSelector";

import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { TrackedSection } from "@/components/TrackedSection";

// Variant C sections
import { VariantBackground } from "@/components/variants/VariantBackground";
import { VideoTestimonials } from "@/components/variants/variant-c/VideoTestimonials";
import { PerfectForSection } from "@/components/variants/variant-c/PerfectForSection";
import { PricingPreview } from "@/components/variants/variant-c/PricingPreview";
import { FAQVariantC } from "@/components/variants/variant-c/FAQVariantC";
import { FloatingDecorations } from "@/components/variants/variant-c/FloatingDecorations";
import { EmotionalJourney } from "@/components/variants/variant-c/EmotionalJourney";
import { CTAVariantC } from "@/components/variants/variant-c/CTAVariantC";

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
      <VariantBackground />
      <FloatingDecorations />
      <EmotionalJourney trackCTAClick={trackCTAClick} />
      <CTAVariantC trackCTAClick={trackCTAClick} />

      {/* Footer */}
      <TrackedSection sectionName="footer" onView={trackSectionView} className="relative py-12 px-4 border-t border-border/30 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
              {t('footer.contact')}
            </Link>
            <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
              Blog
            </Link>
            <Link to="/become-affiliate" className="text-muted-foreground hover:text-primary transition-colors">
              {t('footer.becomeAffiliate')}
            </Link>
          </div>
          <div className="mt-4 flex justify-center">
            <LanguageSelector variant="minimal" />
          </div>
        </div>
      </TrackedSection>
    </main>
  );
};

export default Index;
