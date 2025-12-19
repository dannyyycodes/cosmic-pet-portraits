import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Sparkles, 
  DollarSign, 
  Link as LinkIcon, 
  TrendingUp,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function BecomeAffiliate() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCodeInput] = useState('');
  const [country, setCountry] = useState('US');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    referralCode: string;
    onboardingUrl: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-affiliate', {
        body: { name, email, country, referralCode: referralCode.trim() || undefined },
      });

      if (error || data?.error) {
        toast.error(data?.error || t('affiliate.errorCreate'));
        return;
      }

      setResult({
        referralCode: data.referralCode,
        onboardingUrl: data.onboardingUrl,
      });
      setStep('success');
      toast.success(t('affiliate.successToast'));
    } catch (err) {
      toast.error(t('affiliate.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!result) return;
    const link = `${window.location.origin}/ref/${result.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success(t('affiliate.linkCopied'));
  };

  const benefits = [
    { icon: DollarSign, titleKey: 'affiliate.benefit1Title', descKey: 'affiliate.benefit1Desc' },
    { icon: LinkIcon, titleKey: 'affiliate.benefit2Title', descKey: 'affiliate.benefit2Desc' },
    { icon: TrendingUp, titleKey: 'affiliate.benefit3Title', descKey: 'affiliate.benefit3Desc' },
  ];

  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      
      <div className="relative z-10 p-6 max-w-2xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cosmic-gold/20 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-cosmic-gold" />
            <span className="text-cosmic-gold text-sm font-medium">{t('affiliate.badge')}</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            {t('affiliate.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('affiliate.subtitle')}
          </p>
        </div>

        {/* Info Step */}
        {step === 'info' && (
          <div className="space-y-8">
            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.titleKey}
                  className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cosmic-purple/20 flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-cosmic-purple" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t(benefit.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(benefit.descKey)}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('affiliate.howItWorks')}</h2>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cosmic-gold/20 text-cosmic-gold flex items-center justify-center font-bold">1</span>
                  <div>
                    <p className="font-medium text-foreground">{t('affiliate.step1Title')}</p>
                    <p className="text-sm text-muted-foreground">{t('affiliate.step1Desc')}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cosmic-gold/20 text-cosmic-gold flex items-center justify-center font-bold">2</span>
                  <div>
                    <p className="font-medium text-foreground">{t('affiliate.step2Title')}</p>
                    <p className="text-sm text-muted-foreground">{t('affiliate.step2Desc')}</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cosmic-gold/20 text-cosmic-gold flex items-center justify-center font-bold">3</span>
                  <div>
                    <p className="font-medium text-foreground">{t('affiliate.step3Title')}</p>
                    <p className="text-sm text-muted-foreground">{t('affiliate.step3Desc')}</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="text-center">
              <CosmicButton onClick={() => setStep('form')} size="lg">
                <Sparkles className="w-4 h-4 mr-2" />
                {t('affiliate.applyNow')}
              </CosmicButton>
            </div>
          </div>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">{t('affiliate.applicationTitle')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('affiliate.fullName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder={t('affiliate.fullNamePlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('affiliate.emailAddress')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('affiliate.customCode')} <span className="text-muted-foreground font-normal">{t('affiliate.customCodeOptional')}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">astropaws.site/ref/</span>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                    placeholder="petlover"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('affiliate.customCodeHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('affiliate.country')}
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-cosmic-gold/50"
                  required
                >
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="NL">Netherlands</option>
                  <option value="ES">Spain</option>
                  <option value="IT">Italy</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep('info')}
                  className="px-6 py-3 border border-border rounded-xl text-foreground hover:bg-muted/50 transition-colors"
                >
                  {t('common.back')}
                </button>
                <CosmicButton type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? t('affiliate.creating') : t('affiliate.createAccount')}
                </CosmicButton>
              </div>
            </form>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              {t('affiliate.termsNote')}
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && result && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {t('affiliate.successTitle')}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t('affiliate.successSubtitle')}
            </p>

            {/* Referral Link */}
            <div className="bg-background border border-border rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-2">{t('affiliate.yourLink')}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-cosmic-gold break-all">
                  {window.location.origin}/ref/{result.referralCode}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Important: Complete Stripe */}
            <div className="bg-cosmic-gold/10 border border-cosmic-gold/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-foreground font-medium mb-2">
                ⚠️ {t('affiliate.stripeImportant')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('affiliate.stripeNote')}
              </p>
              <a
                href={result.onboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cosmic-gold text-cosmic-deep font-semibold rounded-xl hover:bg-cosmic-gold/90 transition-colors"
              >
                {t('affiliate.completeStripe')}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('common.returnHome')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
