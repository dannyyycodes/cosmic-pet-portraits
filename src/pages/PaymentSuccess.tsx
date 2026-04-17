import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { clearIntakeProgress, clearOwnerData } from '@/lib/intakeStorage';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { EmotionalReportReveal } from '@/components/report/EmotionalReportReveal';
import { GiftConfirmation } from '@/components/report/GiftConfirmation';
import { AllReportsComplete } from '@/components/report/AllReportsComplete';
import { PostPurchaseIntake } from '@/components/intake/PostPurchaseIntake';
import { MultiPetIntakeFlow } from '@/components/intake/MultiPetIntakeFlow';
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
  // Lightweight metadata for the pet currently generating — lets us show the
  // uploaded photo + name on the loading screen before the full report exists.
  const [generatingMeta, setGeneratingMeta] = useState<{ petName?: string; petPhotoUrl?: string; gender?: string }>({});
  // Pets that still need intake (pet_name === 'Pending') — populated when user
  // closes the checkout tab before completing the per-pet questions.
  const [pendingIntakePets, setPendingIntakePets] = useState<Array<{ reportId: string; petName?: string; petPhotoUrl?: string }>>([]);

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

  // Purge intake draft the moment we land on payment-success. Stops the
  // browser-back leak where users could rehydrate the form and resubmit.
  useEffect(() => {
    clearIntakeProgress();
    clearOwnerData();
  }, []);

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

    const maxAttempts = 80;
    let attempts = 0;
    console.log('[PaymentSuccess] Starting verification');
    
    let petPhotosFromStorage: Record<string, { url: string; processingMode?: string }> = {};
    let petTiersFromStorage: Record<string, 'basic' | 'premium'> = {};
    
    if (sessionId?.startsWith('dev_test_')) {
      try {
        const storedPhotos = sessionStorage.getItem('dev_checkout_petPhotos');
        const storedTiers = sessionStorage.getItem('dev_checkout_petTiers');
        if (storedPhotos) { petPhotosFromStorage = JSON.parse(storedPhotos); sessionStorage.removeItem('dev_checkout_petPhotos'); }
        if (storedTiers) { petTiersFromStorage = JSON.parse(storedTiers); sessionStorage.removeItem('dev_checkout_petTiers'); }
      } catch (e) { /* dev mode storage retrieval failed */ }
    }

    const tryVerify = async (): Promise<boolean | 'generating'> => {
      try {
        const { data, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId, reportId, report_ids: reportIdsParam, includeGift: includeGiftParam, includeHoroscope: includeHoroscopeParam, selectedTier: selectedTierParam, includesPortrait: includesPortraitParam, petPhotos: petPhotosFromStorage, petTiers: petTiersFromStorage }
        });

        if (verifyError) { console.error('[PaymentSuccess] verify-payment invoke error'); return false; }
        if (!data?.success) { console.warn('[PaymentSuccess] verify-payment not successful'); return false; }

        const reports = data.allReports || [data.report];
        const processedReports: ReportData[] = [];
        let stillGenerating = false;

        for (const petReport of reports) {
          if (petReport?.payment_status === 'paid') {
            const reportContent = petReport.report_content;
            const isGen = !reportContent || reportContent?.status === 'generating' || reportContent?.status === 'retrying';
            if (isGen) {
              stillGenerating = true;
              // Capture the pet's photo + name so the loading screen can show it.
              if (petReport.pet_name && !generatingMeta.petName) {
                setGeneratingMeta({
                  petName: petReport.pet_name,
                  petPhotoUrl: petReport.pet_photo_url,
                  gender: petReport.gender,
                });
              }
              continue;
            }
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

        // Check which reports still have placeholder pet name (user closed tab
        // before completing intake). In a multi-pet order, this can be *some*
        // of the reports — we must route every one of them through intake
        // before we ever reach the reveal, or the worker will never generate
        // the missing ones.
        const pending = reports
          .filter((r: any) => r.pet_name === 'Pending' || !r.pet_name)
          .map((r: any) => ({
            reportId: r.id,
            petName: r.pet_name && r.pet_name !== 'Pending' ? r.pet_name : undefined,
            petPhotoUrl: r.pet_photo_url,
          }));
        if (pending.length > 0) {
          setPendingIntakePets(pending);
          setStage('post-purchase-intake');
          return true;
        }

        if (processedReports.length > 0) {
          if (processedReports[0].email) { try { sessionStorage.setItem('cosmic_report_email', processedReports[0].email); } catch {} }
          if (data.includeGift && data.giftCode) setGiftInfo({ includeGift: true, giftCode: data.giftCode });
          if (data.horoscopeEnabled) setHoroscopeInfo({ enabled: true, petNames: processedReports.map(r => r.petName) });
          setAllReports(processedReports);
          // Per-pet routing — first pet's occasion decides the first screen.
          // Later pets pick their own stage via handleNextPet/handleRevealComplete.
          setStage(stageForReport(processedReports[0]));
          return true;
        }
        return 'generating';
      } catch (err) { console.error('[PaymentSuccess] tryVerify exception'); return false; }
    };

    const result = await tryVerify();
    if (result === true) return;

    // ─── Supabase realtime subscription — fires the instant the worker writes
    // report_content to the row. Replaces the previous poll-only mechanism
    // that could miss completions on brief network blips.
    //
    // Multi-pet correctness: use an "all-done" latch, not a "first-done" flag.
    // The previous implementation latched after the first report completed so
    // completions 2-4 (and the polling fallback) were silently ignored, which
    // would freeze the UI until the 15-minute timeout when reports finished
    // out of order. We now run tryVerify on every completion and only tear
    // the channel down once tryVerify actually returns the full set.
    let allDone = false;
    let verifyInFlight = false;
    const rtIds = (reportIdsParam ? reportIdsParam.split(',') : [reportId]).filter(Boolean);
    const channel = supabase.channel(`report-${rtIds.join('-')}`);
    const runVerifyOnce = async (source: 'realtime' | 'poll') => {
      if (allDone || verifyInFlight) return;
      verifyInFlight = true;
      try {
        const result = await tryVerify();
        if (result === true) {
          allDone = true;
          try { supabase.removeChannel(channel); } catch { /* channel already gone */ }
        }
        console.log(`[PaymentSuccess] ${source} verify result:`, result === true ? 'done' : result);
      } finally {
        verifyInFlight = false;
      }
    };
    for (const rid of rtIds) {
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pet_reports', filter: `id=eq.${rid}` },
        async (payload) => {
          const newRow: any = payload.new;
          const rc = newRow?.report_content;
          const done = rc && rc.status !== 'generating' && rc.status !== 'retrying' && !rc.error;
          if (!done) return;
          console.log('[PaymentSuccess] Realtime completion detected for', rid);
          await runVerifyOnce('realtime');
        },
      );
    }
    channel.subscribe((status) => {
      console.log('[PaymentSuccess] Realtime subscription status:', status);
    });

    // Fallback polling — same semantics but extended window (15 min, not 6-7 min).
    // If the realtime subscription somehow misses the update, poll still closes it out.
    const poll = async () => {
      if (allDone) return;
      attempts++;
      // 15-min cap at 10s cadence = 90 attempts
      if (attempts >= 90) {
        console.warn('[PaymentSuccess] Poll timeout — showing calm reassurance (no error screen).');
        try { supabase.removeChannel(channel); } catch {}
        // Intentionally NOT setting stage='error'. The ReportGenerating screen
        // already shows a calm "we'll email you" fallback after 4 minutes.
        return;
      }
      await runVerifyOnce('poll');
      if (allDone) return;
      setTimeout(poll, 10000);   // Fixed 10s cadence — realtime is primary
    };
    setTimeout(poll, result === 'generating' ? 3000 : 5000);
  };

  // Every pet in a multi-pet order can have its own occasion_mode. The
  // sequence walks through them one by one — whichever pet is active picks
  // the correct stage (gift → GiftConfirmation, everything else → reveal).
  const stageForReport = (r?: ReportData): Stage => (r?.isGift ? 'gift-sent' : 'reveal');

  const handleRevealComplete = () => {
    if (hasMultipleReports && !isLastReport) setStage('ready-next');
    else setStage('complete');
  };

  const handleNextPet = () => {
    const nextIndex = currentReportIndex + 1;
    const nextReport = allReports[nextIndex];
    setCurrentReportIndex(nextIndex);
    setStage(stageForReport(nextReport));
  };
  const handleViewAllReports = () => setStage('complete');
  const handleAllComplete = () => setStage('celebration');
  const handleNextPetFromViewer = () => { if (currentReportIndex < allReports.length - 1) setCurrentReportIndex(prev => prev + 1); };

  // Post-purchase intake — orchestrates N pets when checkout collected multiple
  // reports, or shows the single-pet flow for quick checkout and legacy orders.
  if (stage === 'post-purchase-intake') {
    if (pendingIntakePets.length > 0) {
      return (
        <MultiPetIntakeFlow
          pets={pendingIntakePets}
          onAllComplete={() => {
            setPendingIntakePets([]);
            verifyAndFetchReport();
          }}
        />
      );
    }
    if (reportId) {
      return <PostPurchaseIntake reportId={reportId} onComplete={() => verifyAndFetchReport()} />;
    }
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
          <p className="text-xs text-[#9B8E84] mt-6">If this persists, please contact hello@littlesouls.app</p>
        </div>
      </div>
    );
  }

  // Generating — show the uploaded pet photo from generatingMeta while the
  // worker is still composing the report.
  if (stage === 'verifying' || stage === 'generating') {
    const loaderPetName = currentReport?.petName || generatingMeta.petName || 'Your pet';
    const loaderGender = currentReport?.gender || generatingMeta.gender;
    const loaderPhoto = currentReport?.petPhotoUrl || generatingMeta.petPhotoUrl;
    return (
      <ReportGenerating
        petName={loaderPetName}
        gender={loaderGender}
        sunSign={currentReport?.report?.sunSign}
        reportId={reportId || undefined}
        petPhotoUrl={loaderPhoto}
      />
    );
  }

  // Ready next — celebratory bridge between one pet's reveal and the next.
  if (stage === 'ready-next' && currentReport) {
    const nextPetName = allReports[currentReportIndex + 1]?.petName || 'your next soul';
    const progress = currentReportIndex + 1;
    const total = allReports.length;
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
        style={{ backgroundColor: '#FFFDF5' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          className="max-w-[440px] w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.1 }}
            className="relative w-24 h-24 mx-auto mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(196,162,101,0.35), rgba(191,82,74,0.3))',
                filter: 'blur(16px)',
              }}
            />
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #c4a265, #bf524a)',
                boxShadow: '0 12px 40px -8px rgba(191,82,74,0.45)',
              }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-[0.7rem] uppercase tracking-[0.2em] mb-3"
            style={{ color: '#a07c3a', fontFamily: 'Cormorant, serif', fontVariant: 'small-caps' }}
          >
            Reading {progress} of {total} revealed ✦
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
            className="text-[#2D2926] mb-3"
            style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(1.8rem, 6vw, 2.4rem)' }}
          >
            {currentReport.petName}'s stars are yours.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="text-[1.05rem] text-[#6B5E54] italic mb-8"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            Ready to meet {nextPetName}?
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex items-center gap-1.5 justify-center mb-8"
          >
            {allReports.map((r, i) => (
              <div
                key={r.reportId}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i < progress ? 28 : 14,
                  background: i < progress ? '#bf524a' : '#E8DFD6',
                }}
              />
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
            onClick={handleNextPet}
            className="w-full py-4 rounded-xl text-white text-[1.02rem] relative overflow-hidden"
            style={{ fontFamily: 'DM Serif Display, serif', backgroundColor: '#bf524a' }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="relative z-10 inline-flex items-center justify-center gap-1">
              Reveal {nextPetName}'s chart <ChevronRight className="w-5 h-5" />
            </span>
          </motion.button>

          <button
            onClick={handleViewAllReports}
            className="text-[#9B8E84] hover:text-[#2D2926] text-[0.82rem] underline-offset-4 hover:underline mt-4 block w-full"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            Or skip to all readings
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
        readingIndex={hasMultipleReports ? currentReportIndex : undefined}
        totalReadings={hasMultipleReports ? allReports.length : undefined}
      />
    );
  }

  // Gift confirmation — in a multi-pet cart the buyer continues to the next
  // pet's screen (reveal or another gift-sent) rather than bouncing home.
  if (stage === 'gift-sent' && currentReport) {
    const isLastInSequence = !hasMultipleReports || isLastReport;
    const nextPet = hasMultipleReports && !isLastReport ? allReports[currentReportIndex + 1] : undefined;
    const continueLabel = isLastInSequence
      ? undefined
      : `Continue to ${nextPet?.petName || 'the next reading'} →`;
    return (
      <GiftConfirmation
        petName={currentReport.petName}
        recipientName={currentReport.recipientName || 'your friend'}
        recipientEmail={currentReport.recipientEmail || 'them'}
        sunSign={currentReport.report?.sunSign || 'cosmic'}
        onContinue={isLastInSequence ? undefined : handleNextPet}
        continueLabel={continueLabel}
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
          occasionMode={currentReport?.occasionMode}
        />
        {activeReportId && (
          <div className="flex justify-center my-8">
            <a
              href={`/soul-chat.html?id=${activeReportId}${currentReport?.report?.shareToken ? '&token=' + currentReport.report.shareToken : ''}`}
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
