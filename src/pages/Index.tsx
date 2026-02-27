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
    <main className="min-h-screen overflow-hidden" style={{ background: "#FFFDF5" }}>
      <VariantBackground />
      <FloatingDecorations />
      <EmotionalJourney trackCTAClick={trackCTAClick} />

      {/* Footer */}
      <footer style={{ background: "#FFFDF5", borderTop: "1px solid #d6c8b6", padding: "36px 16px", textAlign: "center", position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", fontSize: "0.82rem" }}>
          <Link to="/terms" style={{ color: "#958779", textDecoration: "none" }}>Terms</Link>
          <Link to="/privacy" style={{ color: "#958779", textDecoration: "none" }}>Privacy</Link>
          <Link to="/contact" style={{ color: "#958779", textDecoration: "none" }}>Contact</Link>
          <Link to="/blog" style={{ color: "#958779", textDecoration: "none" }}>Blog</Link>
          <Link to="/become-affiliate" style={{ color: "#958779", textDecoration: "none" }}>Affiliates</Link>
        </div>
      </footer>
    </main>
  );
};

export default Index;
