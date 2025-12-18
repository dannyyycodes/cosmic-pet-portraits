import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { CinematicReveal } from '@/components/report/CinematicReveal';
import { toast } from 'sonner';

export default function ViewReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<{ petName: string; report: any; reportId?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCinematic, setShowCinematic] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);

  const reportId = searchParams.get('id');
  const code = searchParams.get('code'); // For gift redemption
  const skipIntro = searchParams.get('skip') === 'true';

  useEffect(() => {
    if (!reportId && !code) {
      setError('Invalid link');
      setIsLoading(false);
      return;
    }

    fetchReport();
  }, [reportId, code]);

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-report', {
        body: {
          reportId: reportId || undefined,
          giftCode: code || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch report');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setReportData({
        petName: data.petName,
        report: data.report,
        reportId: reportId || data.reportId,
      });

      // Show cinematic reveal for first-time views (not returning visits)
      const hasSeenReport = sessionStorage.getItem(`seen_report_${reportId || code}`);
      if (!hasSeenReport && !skipIntro) {
        setShowCinematic(true);
        sessionStorage.setItem(`seen_report_${reportId || code}`, 'true');
      } else {
        setRevealComplete(true);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
      toast.error('Could not load the report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealComplete = () => {
    setShowCinematic(false);
    setRevealComplete(true);
  };

  if (isLoading) {
    return <ReportGenerating petName="Loading" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
            <span className="text-3xl">🔮</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">
            Report Not Found
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Get Your Own Reading
          </button>
        </div>
      </div>
    );
  }

  if (reportData) {
    const sunSign = reportData.report?.chartPlacements?.sun?.sign || 'Aries';
    const archetype = reportData.report?.archetype?.name || 'Cosmic Soul';
    const element = reportData.report?.dominantElement || 'Fire';

    return (
      <>
        {showCinematic && (
          <CinematicReveal
            petName={reportData.petName}
            sunSign={sunSign}
            archetype={archetype}
            element={element}
            onComplete={handleRevealComplete}
          />
        )}
        {revealComplete && (
          <CosmicReportViewer
            petName={reportData.petName}
            report={reportData.report}
            reportId={reportData.reportId}
          />
        )}
      </>
    );
  }

  return null;
}
