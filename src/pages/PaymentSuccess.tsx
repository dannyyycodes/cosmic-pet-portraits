import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { EmotionalReportReveal } from '@/components/report/EmotionalReportReveal';
import { GiftConfirmation } from '@/components/report/GiftConfirmation';
import { AllReportsComplete } from '@/components/report/AllReportsComplete';
import { PostPurchaseIntake } from '@/components/intake/PostPurchaseIntake';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

type Stage = 'verifying' | 'generating' | 'reveal' | 'complete' | 'gift-sent' | 'error' | 'ready-next' | 'celebration' | 'post-purchase-intake';

interface ReportData {
  petName: string;
  email: string;
  report: any;
  reportId: string;
  isGift: boolean;
  recipientName?: string;
  recipientEmail?: string;
  portraitUrl?: string;
  petPhotoUrl?: string;
  gender?: string;
  occasionMode?: string;
}

interface GiftInfo {
  includeGift: boolean;
  giftCode: string | null;
}

interface GiftedInfo {
  isGifted: boolean;
  giftedTier: 'basic' | 'premium' | null;
}

interface HoroscopeInfo {
  enabled: boolean;
  petNames: string[];
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stage, setStage] = useState<Stage>('verifying');
  const [allReports, setAllReports] = useState<ReportData[]>([]);
  const [currentReportIndex, setCurrentReportIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [giftInfo, setGiftInfo] = useState<GiftInfo>({ includeGift: false, giftCode: null });
  const [giftedInfo, setGiftedInfo] = useState<GiftedInfo>({ isGifted: false, giftedTier: null });
  const [horoscopeInfo, setHoroscopeInfo] = useState<HoroscopeInfo>({ enabled: false, petNames: [] });

  const sessionId = searchParams.get('session_id');
  const reportId = searchParams.get('report_id');
  const reportIdsParam = searchParams.get('report_ids');
  const isQuickCheckout = searchParams.get('quick') === 'true';
  const isGiftedParam = searchParams.get('gifted') === 'true';
  const giftedTierParam = searchParams.get('gifted_tier') as 'basic' | 'premium' | null;
  const isGiftRedemption = sessionId?.startsWith('gift_') || isGiftedParam;
  
  const includeGiftParam = searchParams.get('include_gift') === 'true';
  const includeHoroscopeParam = searchParams.get('include_horoscope') === 'true';
  const selectedTierParam = searchParams.get('selected_tier');
  const includesPortraitParam = searchParams.get('includes_portrait') === 'true';

  const currentReport = allReports[currentReportIndex];
  const hasMultipleReports = allReports.length > 1;
  const isLastReport = currentReportIndex === allReports.length - 1;

  useEffect(() => {
    if (isGiftedParam) {
      setGiftedInfo({ isGifted: true, giftedTier: giftedTierParam });
    }
  }, [isGiftedParam, giftedTierParam]);

  useEffect(() => {
    if (!sessionId || !reportId) {
      setError(t('paymentSuccess.errorMissing'));
      setStage('error');
      return;
    }

    // Quick checkout: show post-purchase intake first
    if (isQuickCheckout) {
      setStage('post-purchase-intake');
      return;
    }

    verifyAndFetchReport();
  }, [sessionId, reportId]);

  const verifyAndFetchReport = async () => {
    setStage('generating');
    
    const maxAttempts = 20;
    let attempts = 0;
    
    let petPhotosFromStorage: Record<string, { url: string; processingMode?: string }> = {};
    let petTiersFromStorage: Record<string, 'basic' | 'premium'> = {};
    
    if (sessionId?.startsWith('dev_test_')) {
      try {
        const storedPhotos = sessionStorage.getItem('dev_checkout_petPhotos');
        const storedTiers = sessionStorage.getItem('dev_checkout_petTiers');
        if (storedPhotos) { petPhotosFromStorage = JSON.parse(storedPhotos); sessionStorage.removeItem('dev_checkout_petPhotos'); }
        if (storedTiers) { petTiersFromStorage = JSON.parse(storedTiers); sessionStorage.removeItem('dev_checkout_petTiers'); }
      } catch (e) { console.warn('Could not retrieve dev mode data:', e); }
    }

    const tryVerify = async (): Promise<boolean | 'generating'> => {
      try {
        const { data, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId, reportId, report_ids: reportIdsParam, includeGift: includeGiftParam, includeHoroscope: includeHoroscopeParam, selectedTier: selectedTierParam, includesPortrait: includesPortraitParam, petPhotos: petPhotosFromStorage, petTiers: petTiersFromStorage }
        });

        if (verifyError) return false;
        if (!data?.success) return false;

        const reports = data.allReports || [data.report];
        const processedReports: ReportData[] = [];
        let stillGenerating = false;

        for (const petReport of reports) {
          if (petReport?.payment_status === 'paid') {
            const reportContent = petReport.report_content;
            const isGen = !reportContent || reportContent?.status === 'generating' || reportContent?.status === 'retrying';
            if (isGen) { stillGenerating = true; continue; }
            if (reportContent?.status === 'failed' || reportContent?.error) {
              if (reportContent?.timeout || reportContent?.status === 'retrying') { stillGenerating = true; continue; }
            }
            
            const isGiftBeingSent = petReport.occasion_mode === 'gift' && !isGiftRedemption;
            processedReports.push({
              petName: petReport.pet_name, email: petReport.email, report: petReport.report_content,
              reportId: petReport.id, isGift: isGiftBeingSent, portraitUrl: petReport.portrait_url,
              petPhotoUrl: petReport.pet_photo_url, gender: petReport.gender, occasionMode: petReport.occasion_mode,
            });
          }
        }

        if (stillGenerating && processedReports.length < reports.length) return 'generating';

        if (processedReports.length > 0) {
          if (processedReports[0].email) { try { sessionStorage.setItem('cosmic_report_email', processedReports[0].email); } catch {} }
          if (data.includeGift && data.giftCode) setGiftInfo({ includeGift: true, giftCode: data.giftCode });
          if (data.horoscopeEnabled) setHoroscopeInfo({ enabled: true, petNames: processedReports.map(r => r.petName) });
          setAllReports(processedReports);
          setStage(processedReports[0].isGift ? 'gift-sent' : 'reveal');
          return true;
        }
        return 'generating';
      } catch { return false; }
    };

    const result = await tryVerify();
    if (result === true) return;

    const poll = async () => {
      attempts++;
      if (attempts >= 40) { setError(t('paymentSuccess.errorTimeout')); setStage('error'); return; }
      const result = await tryVerify();
      if (result === true) return;
      setTimeout(poll, Math.min(3000 + attempts * 300, 6000));
    };
    setTimeout(poll, result === 'generating' ? 2000 : 3000);
  };

  const handleRevealComplete = () => {
    if (hasMultipleReports && !isLastReport) setStage('ready-next');
    else setStage('complete');
  };

  const handleNextPet = () => { setCurrentReportIndex(prev => prev + 1); setStage('reveal'); };
  const handleViewAllReports = () => setStage('complete');
  const handleAllComplete = () => setStage('celebration');
  const handleNextPetFromViewer = () => { if (currentReportIndex < allReports.length - 1) setCurrentReportIndex(prev => prev + 1); };

  // Post-purchase intake
  if (stage === 'post-purchase-intake' && reportId) {
    return <PostPurchaseIntake reportId={reportId} onComplete={() => verifyAndFetchReport()} />;
  }

  // Error
  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[rgba(191,82,74,0.1)] flex items-center justify-center">
            <span className="text-3xl">😿</span>
          </div>
          <h1 className="text-2xl font-bold text-[#2D2926] mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>Oops</h1>
          <p className="text-[#6B5E54] mb-6">{error}</p>
          <Button onClick={() => { setStage('generating'); setError(null); verifyAndFetchReport(); }} className="w-full bg-[#bf524a] hover:bg-[#c9665f] text-white">
            Try Again
          </Button>
          <button onClick={() => navigate('/')} className="text-sm text-[#9B8E84] hover:text-[#2D2926] underline-offset-4 hover:underline transition-colors block w-full mt-3">
            Go back home
          </button>
          <p className="text-xs text-[#9B8E84] mt-6">If this persists, please contact hello@littlesouls.co</p>
        </div>
      </div>
    );
  }

  // Generating
  if (stage === 'verifying' || stage === 'generating') {
    return <ReportGenerating petName={currentReport?.petName || 'Your pet'} gender={currentReport?.gender} sunSign={currentReport?.report?.sunSign} />;
  }

  // Ready next
  if (stage === 'ready-next' && currentReport) {
    const nextPetName = allReports[currentReportIndex + 1]?.petName || 'your next pet';
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#FFFDF5' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[rgba(191,82,74,0.1)] flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-[#bf524a]" />
          </div>
          <h1 className="text-3xl font-bold text-[#2D2926] mb-4" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {currentReport.petName}'s Report Complete! 🌟
          </h1>
          <p className="text-[#6B5E54] mb-8 text-lg">Ready to discover {nextPetName}'s cosmic secrets?</p>
          <Button onClick={handleNextPet} className="w-full bg-[#bf524a] hover:bg-[#c9665f] text-white py-3">
            View {nextPetName}'s Report <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          <button onClick={handleViewAllReports} className="text-[#9B8E84] hover:text-[#2D2926] text-sm underline-offset-4 hover:underline mt-4 block w-full">
            Skip to all reports
          </button>
        </motion.div>
      </div>
    );
  }

  // Reveal
  if (stage === 'reveal' && currentReport) {
    return (
      <EmotionalReportReveal
        petName={currentReport.petName}
        report={currentReport.report}
        onComplete={handleRevealComplete}
        occasionMode={currentReport.occasionMode}
      />
    );
  }

  // Gift confirmation
  if (stage === 'gift-sent' && currentReport) {
    return (
      <GiftConfirmation
        petName={currentReport.petName}
        recipientName={currentReport.recipientName || 'your friend'}
        recipientEmail={currentReport.recipientEmail || 'them'}
        sunSign={currentReport.report?.sunSign || 'cosmic'}
      />
    );
  }

  // Complete
  if (stage === 'complete' && allReports.length > 0) {
    const activePetName = currentReport?.petName || allReports[0].petName;
    const activeReportId = currentReport?.reportId || allReports[0].reportId;
    return (
      <>
        <CosmicReportViewer
          petName={activePetName}
          report={currentReport?.report || allReports[0].report}
          portraitUrl={currentReport?.portraitUrl || currentReport?.petPhotoUrl}
          allReports={hasMultipleReports ? allReports : undefined}
          currentIndex={currentReportIndex}
          onSwitchReport={setCurrentReportIndex}
          onNextPet={handleNextPetFromViewer}
          onAllComplete={handleAllComplete}
          hasActiveHoroscope={horoscopeInfo.enabled}
        />
        {activeReportId && (
          <div className="flex justify-center my-8">
            <a
              href={`/soul-chat.html?id=${activeReportId}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-base no-underline transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg"
              style={{ background: '#bf524a', fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              <span style={{ fontSize: '1.2em' }}>&#129782;</span>
              SoulSpeak — Talk to {activePetName}'s Soul Free
            </a>
          </div>
        )}
      </>
    );
  }

  // Celebration
  if (stage === 'celebration') {
    return (
      <AllReportsComplete
        petNames={allReports.map(r => r.petName)}
        onViewReports={handleViewAllReports}
        giftInfo={giftInfo}
        giftedInfo={giftedInfo}
        horoscopeInfo={horoscopeInfo}
        purchaseEmail={allReports[0]?.email}
      />
    );
  }

  return null;
}
