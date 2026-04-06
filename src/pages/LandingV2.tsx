import { useEffect } from "react";
import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { FunnelV2 } from "@/components/funnel-v2/FunnelV2";

const LandingV2 = () => {
  usePageAnalytics("/v2");

  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--cream,#FFFDF5)]">
      <FunnelV2 />
    </main>
  );
};

export default LandingV2;
