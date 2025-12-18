import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { EmotionalReportReveal } from '@/components/report/EmotionalReportReveal';
import { GiftConfirmation } from '@/components/report/GiftConfirmation';
import { toast } from 'sonner';

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
  const [stage, setStage] = useState<Stage>('verifying');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const reportId = searchParams.get('report_id');

  useEffect(() => {
    if (!sessionId || !reportId) {
      setError('Missing payment information. Please try again.');
      setStage('error');
      return;
    }

    pollForReport();
  }, [sessionId, reportId]);

  const pollForReport = async () => {
    const maxAttempts = 30; // 30 attempts over ~60 seconds
    let attempts = 0;
    
    setStage('generating');

    const checkReport = async (): Promise<boolean> => {
      try {
        // Fetch the pet report using the get-report edge function (secure)
        const { data, error: fetchError } = await supabase.functions.invoke('get-report', {
          body: { reportId }
        });

        if (fetchError) {
          console.error('Error fetching report:', fetchError);
          return false;
        }

        if (!data?.report) {
          return false;
        }

        const petReport = data.report;

        // Check if payment is confirmed and report has content
        if (petReport.payment_status === 'paid' && petReport.report_content) {
          const isGift = petReport.occasion_mode === 'gift';
          
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
        console.error('Poll error:', err);
        return false;
      }
    };

    // Initial check
    if (await checkReport()) {
      return;
    }

    // Poll with increasing intervals
    const poll = async () => {
      attempts++;
      
      if (attempts >= maxAttempts) {
        setError('Your payment was received but report generation is taking longer than expected. Please check your email or try refreshing the page in a few minutes.');
        setStage('error');
        return;
      }

      if (await checkReport()) {
        return;
      }

      // Exponential backoff: 2s, 2s, 2s, 3s, 3s, 4s, etc.
      const delay = Math.min(2000 + Math.floor(attempts / 3) * 1000, 5000);
      setTimeout(poll, delay);
    };

    // Start polling after initial delay
    setTimeout(poll, 2000);
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
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Go Back Home
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
