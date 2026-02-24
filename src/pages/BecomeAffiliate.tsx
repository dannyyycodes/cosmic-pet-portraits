import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VariantBackground } from '@/components/variants/VariantBackground';
import { CosmicButton } from '@/components/cosmic/CosmicButton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  DollarSign, 
  Link as LinkIcon, 
  TrendingUp,
  CheckCircle,
  Copy,
  ExternalLink,
  ArrowLeft,
  Users,
  Percent,
  Zap
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
    { icon: Percent, titleKey: 'affiliate.benefit1Title', descKey: 'affiliate.benefit1Desc', color: 'from-green-400 to-emerald-600' },
    { icon: LinkIcon, titleKey: 'affiliate.benefit2Title', descKey: 'affiliate.benefit2Desc', color: 'from-nebula-purple to-primary' },
    { icon: TrendingUp, titleKey: 'affiliate.benefit3Title', descKey: 'affiliate.benefit3Desc', color: 'from-gold to-amber-500' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <VariantBackground intensity="calm" />
      
      <div className="relative z-10 p-6 max-w-2xl mx-auto py-12">
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.backHome')}
        </Link>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-gold/20 to-amber-500/20 border border-gold/30 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-semibold">{t('affiliate.badge')}</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-foreground via-gold to-foreground bg-clip-text text-transparent mb-4">
            {t('affiliate.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {t('affiliate.subtitle')}
          </p>
        </motion.div>

        {/* Info Step */}
        {step === 'info' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit.titleKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 text-center hover:border-gold/30 transition-colors group"
                >
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{t(benefit.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(benefit.descKey)}</p>
                </motion.div>
              ))}
            </div>

            {/* Stats Banner */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-2 sm:gap-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-gold/10 via-amber-500/5 to-gold/10 border border-gold/20"
            >
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-gold">50%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Commission</p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">Lifetime</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Cookie</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">Weekly</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Payouts</p>
              </div>
            </motion.div>

            {/* How it works */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8"
            >
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-gold" />
                {t('affiliate.howItWorks')}
              </h2>
              <ol className="space-y-5">
                {[1, 2, 3].map((num) => (
                  <li key={num} className="flex gap-4">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-amber-500/30 border border-gold/40 text-gold flex items-center justify-center font-bold text-lg">
                      {num}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{t(`affiliate.step${num}Title`)}</p>
                      <p className="text-sm text-muted-foreground">{t(`affiliate.step${num}Desc`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <Button onClick={() => setStep('form')} variant="gold" size="xl" className="shadow-xl shadow-gold/20">
                <Sparkles className="w-5 h-5 mr-2" />
                {t('affiliate.applyNow')}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              {t('affiliate.applicationTitle')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('affiliate.fullName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-background/80 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
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
                  className="w-full px-4 py-3.5 bg-background/80 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('affiliate.customCode')} <span className="text-muted-foreground font-normal">{t('affiliate.customCodeOptional')}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm whitespace-nowrap">astropets.cloud/ref/</span>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="flex-1 px-4 py-3.5 bg-background/80 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all font-mono"
                    placeholder="petlover"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
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
                  className="w-full px-4 py-3.5 bg-background/80 border border-border/50 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
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

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('info')}
                  className="px-6"
                >
                  {t('common.back')}
                </Button>
                <Button type="submit" variant="gold" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      />
                      {t('affiliate.creating')}
                    </span>
                  ) : (
                    t('affiliate.createAccount')
                  )}
                </Button>
              </div>
            </form>

            <p className="text-xs text-muted-foreground mt-6 text-center">
              {t('affiliate.termsNote')}
            </p>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {t('affiliate.successTitle')}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t('affiliate.successSubtitle')}
            </p>

            {/* Referral Link */}
            <div className="bg-background/80 border border-border/50 rounded-xl p-5 mb-6">
              <p className="text-sm text-muted-foreground mb-3">{t('affiliate.yourLink')}</p>
              <div className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-border/30">
                <code className="flex-1 text-sm text-gold break-all font-mono">
                  {window.location.origin}/ref/{result.referralCode}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="p-2.5 hover:bg-muted rounded-lg transition-colors border border-border/50"
                >
                  <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>

            {/* Important: Complete Stripe */}
            <div className="bg-gradient-to-r from-gold/15 to-amber-500/15 border border-gold/30 rounded-xl p-6 mb-6">
              <p className="text-sm text-foreground font-semibold mb-2 flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4 text-gold" />
                {t('affiliate.stripeImportant')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('affiliate.stripeNote')}
              </p>
              <a
                href={result.onboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="gold" size="lg" className="w-full shadow-lg shadow-gold/20">
                  {t('affiliate.completeStripe')}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>

            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('common.returnHome')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
