import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGenerating } from '@/components/report/ReportGenerating';
import { CosmicReportViewer } from '@/components/report/CosmicReportViewer';
import { CinematicReveal } from '@/components/report/CinematicReveal';
import { TestimonialPrompt } from '@/components/report/TestimonialPrompt';
import { toast } from 'sonner';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';

const EMAIL_STORAGE_KEY = 'cosmic_report_email';

export default function ViewReport() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<{ petName: string; report: any; reportId?: string; shareToken?: string; petPhotoUrl?: string; portraitUrl?: string; occasionMode?: string; hasActiveHoroscope?: boolean; species?: string; email?: string; hasError?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCinematic, setShowCinematic] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showTestimonialPrompt, setShowTestimonialPrompt] = useState(false);

  const reportId = searchParams.get('id');
  const code = searchParams.get('code'); // For gift redemption
  const shareToken = searchParams.get('share'); // For public share links

  // Try to get saved email from session storage
  const getSavedEmail = () => {
    try {
      return sessionStorage.getItem(EMAIL_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!reportId && !code && !shareToken) {
      setError('Invalid link');
      setIsLoading(false);
      return;
    }

    // If accessing via gift code or share token, no email needed
    if (code || shareToken) {
      fetchReport();
    } else {
      // Check if we have saved email
      const savedEmail = getSavedEmail();
      if (savedEmail) {
        setEmail(savedEmail);
        fetchReport(savedEmail);
      } else {
        setNeedsEmailVerification(true);
        setIsLoading(false);
      }
    }
  }, [reportId, code, shareToken]);

  const fetchReport = async (verifyEmail?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-report', {
        body: {
          reportId: reportId || undefined,
          giftCode: code || undefined,
          shareToken: shareToken || undefined,
          email: verifyEmail || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch report');
      }

      if (data.error) {
        if (data.error === 'Email verification required') {
          setNeedsEmailVerification(true);
          setIsLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      // Check if report has an error state (generation failed)
      if (data.report?.error) {
        console.log('[ViewReport] Report has error state:', data.report.error);
        setError(data.report.error);
        setReportData({
          petName: data.petName,
          report: null,
          reportId: reportId || data.reportId,
          hasError: true,
        });
        setIsLoading(false);
        return;
      }

      // Save the verified email for future access
      if (verifyEmail) {
        try {
          sessionStorage.setItem(EMAIL_STORAGE_KEY, verifyEmail);
        } catch {}
      }

      setReportData({
        petName: data.petName,
        report: data.report,
        reportId: reportId || data.reportId,
        shareToken: data.shareToken,
        petPhotoUrl: data.petPhotoUrl,
        portraitUrl: data.portraitUrl,
        occasionMode: data.occasionMode || 'discover',
        hasActiveHoroscope: data.hasActiveHoroscope || false,
        species: data.species || 'pet',
        email: verifyEmail || data.email || '',
      });

      // Show cinematic reveal for first-time views (not returning visits)
      const skipIntro = searchParams.get('skip') === 'true';
      const hasSeenReport = sessionStorage.getItem(`seen_report_${reportId || code}`);
      if (!hasSeenReport && !skipIntro) {
        setShowCinematic(true);
        sessionStorage.setItem(`seen_report_${reportId || code}`, 'true');
      } else {
        setRevealComplete(true);
      }
      
      setNeedsEmailVerification(false);
    } catch (err) {
      console.error('Error fetching report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report';
      
      // Check if it's an auth error - prompt for email again
      if (errorMessage.includes('not available') || errorMessage.includes('403')) {
        setEmailError('The email address does not match this report.');
        setNeedsEmailVerification(true);
      } else {
        setError(errorMessage);
        toast.error('Could not load the report');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    
    const trimmedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    fetchReport(trimmedEmail);
  };

  const handleRevealComplete = () => {
    setShowCinematic(false);
    setRevealComplete(true);
    
    // Show testimonial prompt after 30 seconds of viewing
    const hasSubmittedTestimonial = localStorage.getItem(`testimonial_submitted_${reportId || code}`);
    if (!hasSubmittedTestimonial) {
      setTimeout(() => {
        setShowTestimonialPrompt(true);
      }, 30000); // 30 seconds delay
    }
  };

  // Email verification prompt
  if (needsEmailVerification && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
        <StarfieldBackground />
        <div className="max-w-md w-full text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-3xl">🔮</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground mb-6">
            Please enter the email address you used when purchasing this cosmic reading to view your report.
          </p>
          
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <CosmicInput
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              className={emailError ? 'border-destructive' : ''}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
            <CosmicButton 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'View My Report'}
            </CosmicButton>
          </form>
          
          <p className="text-xs text-muted-foreground mt-6">
            Can't remember your email? Check your inbox for the purchase confirmation.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ReportGenerating petName="Loading" />;
  }

  // Report generation failed - show retry option
  if (reportData?.hasError || error) {
    const isTimeout = error?.includes('timeout') || reportData?.report?.timeout;
    const errorMessage = error || reportData?.report?.error || 'Something went wrong';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
        <StarfieldBackground />
        <div className="max-w-md text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
            <span className="text-3xl">{isTimeout ? '⏳' : '😿'}</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">
            {isTimeout ? 'Report Still Generating' : 'Report Not Available'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isTimeout 
              ? `${reportData?.petName || 'Your pet'}'s cosmic reading is taking a bit longer than usual. Please try again in a moment.`
              : errorMessage
            }
          </p>
          <div className="space-y-3">
            <CosmicButton
              onClick={() => {
                setError(null);
                setReportData(null);
                fetchReport(email || getSavedEmail());
              }}
              className="w-full"
            >
              {isTimeout ? 'Check Again' : 'Try Again'}
            </CosmicButton>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              Go back home
            </button>
          </div>
          {isTimeout && (
            <p className="text-xs text-muted-foreground mt-6">
              If this persists, please contact support@astropets.cloud
            </p>
          )}
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
          <>
            <CosmicReportViewer
              petName={reportData.petName}
              report={reportData.report}
              reportId={reportData.reportId}
              shareToken={reportData.shareToken}
              portraitUrl={reportData.portraitUrl}
              occasionMode={reportData.occasionMode}
              hasActiveHoroscope={reportData.hasActiveHoroscope}
            />
            {showTestimonialPrompt && reportData.reportId && reportData.email && (
              <TestimonialPrompt
                reportId={reportData.reportId}
                petName={reportData.petName}
                species={reportData.species || 'pet'}
                email={reportData.email}
                onClose={() => setShowTestimonialPrompt(false)}
              />
            )}
          </>
        )}
      </>
    );
  }

  return null;
}