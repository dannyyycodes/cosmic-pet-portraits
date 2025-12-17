import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { toast } from 'sonner';

export default function ViewReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<{ petName: string; report: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportId = searchParams.get('id');
  const code = searchParams.get('code'); // For gift redemption

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
      });
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
      toast.error('Could not load the report');
    } finally {
      setIsLoading(false);
    }
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
    return (
      <CosmicReportViewer
        petName={reportData.petName}
        report={reportData.report}
      />
    );
  }

  return null;
}
