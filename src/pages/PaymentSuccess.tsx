import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { EmotionalReportReveal } from '@/components/report/EmotionalReportReveal';
import { GiftConfirmation } from '@/components/report/GiftConfirmation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type Stage = 'verifying' | 'generating' | 'reveal' | 'complete' | 'gift-sent' | 'error';

interface ReportData {
  petName: string;
  email: string;
  report: any;
  reportId: string;
  isGift: boolean;
  recipientName?: string;
  recipientEmail?: string;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stage, setStage] = useState<Stage>('verifying');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const reportId = searchParams.get('report_id');

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
        
        // Call verify-payment function which handles everything
        const { data, error: verifyError } = await supabase.functions.invoke('verify-payment', {
          body: { sessionId, reportId }
        });

        if (verifyError) {
          console.error('[PaymentSuccess] Verify error:', verifyError);
          return false;
        }

        console.log('[PaymentSuccess] Verify response:', data);

        if (!data?.success) {
          // Payment not completed yet
          return false;
        }

        const petReport = data.report;
        
        if (petReport?.payment_status === 'paid' && petReport?.report_content) {
          const isGift = petReport.occasion_mode === 'gift';
          
          // SECURITY: Save email for later verification when viewing report
          if (petReport.email) {
            try {
              sessionStorage.setItem('cosmic_report_email', petReport.email);
            } catch {}
          }
          
          setReportData({
            petName: petReport.pet_name,
            email: petReport.email,
            report: petReport.report_content,
            reportId: reportId!,
            isGift,
          });
          
          setStage(isGift ? 'gift-sent' : 'reveal');
          return true;
        }

        return false;
      } catch (err) {
        console.error('[PaymentSuccess] Error:', err);
        return false;
      }
    };

    // First attempt
    if (await tryVerify()) {
      return;
    }

    // Poll with retries
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

      // Retry with delay
      const delay = Math.min(3000 + attempts * 500, 8000);
      setTimeout(poll, delay);
    };

    // Start polling after initial delay
    setTimeout(poll, 3000);
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

  // Verifying/Generating - show loading state
  if (stage === 'verifying' || stage === 'generating') {
    return (
      <ReportGenerating 
        petName={reportData?.petName || 'Your pet'}
        sunSign={reportData?.report?.sunSign}
      />
    );
  }

  // Emotional reveal experience
  if (stage === 'reveal' && reportData) {
    return (
      <EmotionalReportReveal
        petName={reportData.petName}
        report={reportData.report}
        onComplete={() => setStage('complete')}
      />
    );
  }

  // Gift confirmation
  if (stage === 'gift-sent' && reportData) {
    return (
      <GiftConfirmation
        petName={reportData.petName}
        recipientName={reportData.recipientName || 'your friend'}
        recipientEmail={reportData.recipientEmail || 'them'}
        sunSign={reportData.report?.sunSign || 'cosmic'}
      />
    );
  }

  // Complete - show the full report
  if (stage === 'complete' && reportData) {
    return (
      <CosmicReportViewer
        petName={reportData.petName}
        report={reportData.report}
      />
    );
  }

  return null;
}
