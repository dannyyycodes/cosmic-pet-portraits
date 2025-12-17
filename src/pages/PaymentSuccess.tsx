import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { GiftConfirmation } from '@/components/report/GiftConfirmation';
import { toast } from 'sonner';

type Stage = 'verifying' | 'generating' | 'complete' | 'gift-sent' | 'error';

interface ReportData {
  petName: string;
  report: any;
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

    verifyAndGenerate();
  }, [sessionId, reportId]);

  const verifyAndGenerate = async () => {
    try {
      // Fetch the pet report to get the data
      const { data: petReport, error: fetchError } = await supabase
        .from('pet_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (fetchError || !petReport) {
        throw new Error('Report not found');
      }

      // Check if report already has content (already generated)
      if (petReport.report_content) {
        // Check if this was a gift
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('report_id', reportId)
          .limit(1);

        const isGift = petReport.occasion_mode === 'gift';
        
        setReportData({
          petName: petReport.pet_name,
          report: petReport.report_content,
          isGift,
        });
        setStage(isGift ? 'gift-sent' : 'complete');
        return;
      }

      // Build petData from the report
      const petData = {
        name: petReport.pet_name,
        species: petReport.species,
        breed: petReport.breed,
        gender: petReport.gender,
        dateOfBirth: petReport.birth_date,
        location: petReport.birth_location,
        soulType: petReport.soul_type,
        superpower: petReport.superpower,
        strangerReaction: petReport.stranger_reaction,
      };

      setStage('generating');

      // Generate the report
      const { data: genData, error: genError } = await supabase.functions.invoke(
        'generate-cosmic-report',
        {
          body: { petData, reportId },
        }
      );

      if (genError) {
        console.error('Report generation error:', genError);
        throw new Error('Failed to generate report');
      }

      // Update payment status
      await supabase
        .from('pet_reports')
        .update({ payment_status: 'paid', stripe_session_id: sessionId })
        .eq('id', reportId);

      // Check if this was a gift purchase
      const isGift = petReport.occasion_mode === 'gift';

      setReportData({
        petName: petReport.pet_name,
        report: genData.report,
        isGift,
        // These would come from order metadata in a real implementation
      });

      // Small delay for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStage(isGift ? 'gift-sent' : 'complete');

    } catch (err) {
      console.error('Payment success error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('error');
      toast.error('Something went wrong. Please contact support.');
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

  // Verifying payment
  if (stage === 'verifying') {
    return (
      <ReportGenerating 
        petName="Your pet" 
      />
    );
  }

  // Generating report
  if (stage === 'generating') {
    return (
      <ReportGenerating 
        petName={reportData?.petName || 'Your pet'}
        sunSign={reportData?.report?.sunSign}
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

  // Complete - show the report
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
