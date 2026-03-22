import { useEffect } from "react";
import { Link } from "react-router-dom";

import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { VariantBackground } from "@/components/variants/VariantBackground";
import { FloatingDecorations } from "@/components/variants/variant-c/FloatingDecorations";
import { EmotionalJourney } from "@/components/variants/variant-c/EmotionalJourney";

const Index = () => {
  const { t } = useLanguage();
  const { trackSectionView, trackCTAClick } = usePageAnalytics('/');

  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <VariantBackground />
      <FloatingDecorations />
      <EmotionalJourney trackCTAClick={trackCTAClick} />

      {/* Footer */}
      <footer className="bg-background" style={{ borderTop: "1px solid hsl(var(--border))", padding: "36px 16px 80px", textAlign: "center", position: "relative", zIndex: 10 }}>
        <div className="flex flex-wrap justify-center gap-4 text-[0.82rem]">
          <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors no-underline">Terms</Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors no-underline">Privacy</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors no-underline">Contact</Link>
          <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors no-underline">Blog</Link>
          <Link to="/become-affiliate" className="text-muted-foreground hover:text-foreground transition-colors no-underline">Affiliates</Link>
          <Link to="/find-report" className="text-muted-foreground hover:text-foreground transition-colors no-underline">Find My Report</Link>
        </div>
      </footer>
    </main>
  );
};

export default Index;
