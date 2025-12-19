import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { EmotionalReportReveal } from '@/components/report/EmotionalReportReveal';
import { GiftConfirmation } from '@/components/report/GiftConfirmation';
import { AllReportsComplete } from '@/components/report/AllReportsComplete';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, Gift, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

type Stage = 'verifying' | 'generating' | 'reveal' | 'complete' | 'gift-sent' | 'error' | 'ready-next' | 'celebration';

interface ReportData {
  petName: string;
  email: string;
  report: any;
  reportId: string;
  isGift: boolean;
  recipientName?: string;
  recipientEmail?: string;
}

interface GiftInfo {
  includeGift: boolean;
  giftCode: string | null;
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

  const sessionId = searchParams.get('session_id');
  const reportId = searchParams.get('report_id');

  const currentReport = allReports[currentReportIndex];
  const hasMultipleReports = allReports.length > 1;
  const isLastReport = currentReportIndex === allReports.length - 1;

  useEffect(() => {
    if (!sessionId || !reportId) {
      setError(t('paymentSuccess.errorMissing'));
      setStage('error');
      return;
    }

    verifyAndFetchReport();
  }, [sessionId, reportId]);

  const verifyAndFetchReport = async () => {
    setStage('generating');
    
    const maxAttempts = 20;
    let attempts = 0;

    const tryVerify = async (): Promise<boolean> => {
      try {
        console.log('[PaymentSuccess] Verifying payment, attempt:', attempts + 1);
        
        const { data, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId, reportId }
        });

        if (verifyError) {
          console.error('[PaymentSuccess] Verify error:', verifyError);
          return false;
        }

        console.log('[PaymentSuccess] Verify response:', data);

        if (!data?.success) {
          return false;
        }

        // Handle multiple reports
        const reports = data.allReports || [data.report];
        const processedReports: ReportData[] = [];

        for (const petReport of reports) {
          if (petReport?.payment_status === 'paid' && petReport?.report_content) {
            const isGift = petReport.occasion_mode === 'gift';
            
            processedReports.push({
              petName: petReport.pet_name,
              email: petReport.email,
              report: petReport.report_content,
              reportId: petReport.id,
              isGift,
            });
          }
        }

        if (processedReports.length > 0) {
          // Save email for verification
          if (processedReports[0].email) {
            try {
              sessionStorage.setItem('cosmic_report_email', processedReports[0].email);
            } catch {}
          }
          
          // Capture gift info if present
          if (data.includeGift && data.giftCode) {
            setGiftInfo({ includeGift: true, giftCode: data.giftCode });
          }
          
          setAllReports(processedReports);
          const firstReport = processedReports[0];
          setStage(firstReport.isGift ? 'gift-sent' : 'reveal');
          return true;
        }

        return false;
      } catch (err) {
        console.error('[PaymentSuccess] Error:', err);
        return false;
      }
    };

    if (await tryVerify()) {
      return;
    }

    const poll = async () => {
      attempts++;
      
      if (attempts >= maxAttempts) {
        setError(t('paymentSuccess.errorTimeout'));
        setStage('error');
        return;
      }

      if (await tryVerify()) {
        return;
      }

      const delay = Math.min(3000 + attempts * 500, 8000);
      setTimeout(poll, delay);
    };

    setTimeout(poll, 3000);
  };

  const handleRevealComplete = () => {
    if (hasMultipleReports && !isLastReport) {
      setStage('ready-next');
    } else {
      setStage('complete');
    }
  };

  const handleNextPet = () => {
    setCurrentReportIndex(prev => prev + 1);
    setStage('reveal');
  };

  const handleViewAllReports = () => {
    setStage('complete');
  };

  const handleAllComplete = () => {
    setStage('celebration');
  };

  const handleNextPetFromViewer = () => {
    if (currentReportIndex < allReports.length - 1) {
      setCurrentReportIndex(prev => prev + 1);
    }
  };

  // Error state
  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-3xl">😿</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">
            {t('common.oops')}
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            {t('common.goBackHome')}
          </button>
        </div>
      </div>
    );
  }

  // Verifying/Generating
  if (stage === 'verifying' || stage === 'generating') {
    return (
      <ReportGenerating 
        petName={currentReport?.petName || 'Your pet'}
        sunSign={currentReport?.report?.sunSign}
      />
    );
  }

  // Ready for next pet prompt
  if (stage === 'ready-next' && currentReport) {
    const nextPetName = allReports[currentReportIndex + 1]?.petName || 'your next pet';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-nebula-purple flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            {currentReport.petName}'s Report Complete! 🌟
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Ready to discover {nextPetName}'s cosmic secrets?
          </p>
          <div className="space-y-4">
            <Button
              onClick={handleNextPet}
              variant="cosmic"
              size="xl"
              className="w-full"
            >
              <span>View {nextPetName}'s Report</span>
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <button
              onClick={handleViewAllReports}
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline transition-colors"
            >
              Skip to all reports
            </button>
          </div>
          <p className="text-muted-foreground/60 text-sm mt-8">
            Pet {currentReportIndex + 1} of {allReports.length} completed
          </p>
        </motion.div>
      </div>
    );
  }

  // Emotional reveal
  if (stage === 'reveal' && currentReport) {
    return (
      <EmotionalReportReveal
        petName={currentReport.petName}
        report={currentReport.report}
        onComplete={handleRevealComplete}
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

  // Complete - show report viewer with all reports
  if (stage === 'complete' && allReports.length > 0) {
    return (
      <CosmicReportViewer
        petName={currentReport?.petName || allReports[0].petName}
        report={currentReport?.report || allReports[0].report}
        allReports={hasMultipleReports ? allReports : undefined}
        currentIndex={currentReportIndex}
        onSwitchReport={setCurrentReportIndex}
        onNextPet={handleNextPetFromViewer}
        onAllComplete={handleAllComplete}
      />
    );
  }

  // Celebration - all reports viewed
  if (stage === 'celebration') {
    return (
      <AllReportsComplete
        petNames={allReports.map(r => r.petName)}
        onViewReports={handleViewAllReports}
        giftInfo={giftInfo}
      />
    );
  }

  return null;
}
