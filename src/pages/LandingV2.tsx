import { useEffect } from "react";
import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { ReadingsNav } from "@/components/ReadingsNav";
import ReadingsLanding from "@/components/funnel-v2/ReadingsLanding";

const LandingV2 = () => {
  usePageAnalytics("/v2");

  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--cream,#FFFDF5)]">
      <ReadingsNav />
      <ReadingsLanding />
    </main>
  );
};

export default LandingV2;
