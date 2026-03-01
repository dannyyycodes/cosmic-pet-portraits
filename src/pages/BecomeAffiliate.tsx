import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  const [backLinkHovered, setBackLinkHovered] = useState(false);

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
    { icon: Percent, titleKey: 'affiliate.benefit1Title', descKey: 'affiliate.benefit1Desc' },
    { icon: LinkIcon, titleKey: 'affiliate.benefit2Title', descKey: 'affiliate.benefit2Desc' },
    { icon: TrendingUp, titleKey: 'affiliate.benefit3Title', descKey: 'affiliate.benefit3Desc' },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: '#faf6ef',
    border: '1px solid #e8ddd0',
    borderRadius: '10px',
    color: '#3d2f2a',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ background: '#FFFDF5', minHeight: '100vh' }} className="relative overflow-hidden">
      <div className="relative z-10 p-6 max-w-2xl mx-auto py-12">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 transition-colors mb-8"
          style={{ color: backLinkHovered ? '#3d2f2a' : '#9a8578', textDecoration: 'none' }}
          onMouseEnter={() => setBackLinkHovered(true)}
          onMouseLeave={() => setBackLinkHovered(false)}
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
            style={{ background: '#faf6ef', border: '1px solid #e8ddd0', color: '#c4a265' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#c4a265' }} />
            <span className="text-sm font-semibold">{t('affiliate.badge')}</span>
          </motion.div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: '#3d2f2a' }}
          >
            {t('affiliate.title')}
          </h1>
          <p className="text-lg max-w-md mx-auto" style={{ color: '#9a8578' }}>
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
                  className="p-6 text-center group"
                  style={{ background: 'white', border: '1px solid #e8ddd0', borderRadius: '16px' }}
                >
                  <div
                    className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
                  >
                    <benefit.icon className="w-7 h-7" style={{ color: '#c4a265' }} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: '#3d2f2a' }}>{t(benefit.titleKey)}</h3>
                  <p className="text-sm" style={{ color: '#5a4a42' }}>{t(benefit.descKey)}</p>
                </motion.div>
              ))}
            </div>

            {/* Stats Banner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-2 sm:gap-6 p-4 sm:p-6 rounded-2xl"
              style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}
            >
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#c4a265' }}>50%</p>
                <p className="text-xs sm:text-sm" style={{ color: '#9a8578' }}>Commission</p>
              </div>
              <div className="text-center" style={{ borderLeft: '1px solid #e8ddd0', borderRight: '1px solid #e8ddd0' }}>
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#3d2f2a' }}>Lifetime</p>
                <p className="text-xs sm:text-sm" style={{ color: '#9a8578' }}>Cookie</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#3d2f2a' }}>Weekly</p>
                <p className="text-xs sm:text-sm" style={{ color: '#9a8578' }}>Payouts</p>
              </div>
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl p-8"
              style={{ background: 'white', border: '1px solid #e8ddd0' }}
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#3d2f2a' }}>
                <Zap className="w-5 h-5" style={{ color: '#c4a265' }} />
                {t('affiliate.howItWorks')}
              </h2>
              <ol className="space-y-5">
                {[1, 2, 3].map((num) => (
                  <li key={num} className="flex gap-4">
                    <span
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ background: '#c4a265', color: 'white' }}
                    >
                      {num}
                    </span>
                    <div>
                      <p className="font-medium" style={{ color: '#3d2f2a' }}>{t(`affiliate.step${num}Title`)}</p>
                      <p className="text-sm" style={{ color: '#5a4a42' }}>{t(`affiliate.step${num}Desc`)}</p>
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
              <Button
                onClick={() => setStep('form')}
                size="lg"
                className="px-8 py-3 text-base font-semibold shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #c4a265, #b8973e)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px'
                }}
              >
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
            className="rounded-2xl p-8"
            style={{ background: 'white', border: '1px solid #e8ddd0' }}
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#3d2f2a' }}>
              <Users className="w-6 h-6" style={{ color: '#c4a265' }} />
              {t('affiliate.applicationTitle')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3d2f2a' }}>
                  {t('affiliate.fullName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  placeholder={t('affiliate.fullNamePlaceholder')}
                  required
                  onFocus={(e) => { e.target.style.borderColor = '#c4a265'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8ddd0'; }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3d2f2a' }}>
                  {t('affiliate.emailAddress')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="you@example.com"
                  required
                  onFocus={(e) => { e.target.style.borderColor = '#c4a265'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8ddd0'; }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3d2f2a' }}>
                  {t('affiliate.customCode')} <span style={{ color: '#9a8578', fontWeight: 'normal' }}>{t('affiliate.customCodeOptional')}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm whitespace-nowrap" style={{ color: '#9a8578' }}>littlesouls.co/ref/</span>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                    placeholder="petlover"
                    maxLength={20}
                    onFocus={(e) => { e.target.style.borderColor = '#c4a265'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e8ddd0'; }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: '#9a8578' }}>
                  {t('affiliate.customCodeHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3d2f2a' }}>
                  {t('affiliate.country')}
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={inputStyle}
                  required
                  onFocus={(e) => { e.target.style.borderColor = '#c4a265'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e8ddd0'; }}
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
                  style={{ border: '1px solid #e8ddd0', color: '#5a4a42', borderRadius: '10px', background: 'white' }}
                >
                  {t('common.back')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                  style={{
                    background: isLoading ? '#d4c4a0' : 'linear-gradient(135deg, #c4a265, #b8973e)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px'
                  }}
                >
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

            <p className="text-xs mt-6 text-center" style={{ color: '#9a8578' }}>
              {t('affiliate.termsNote')}
            </p>
          </motion.div>
        )}

        {/* Success Step */}
        {step === 'success' && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 text-center"
            style={{ background: 'white', border: '1px solid #e8ddd0' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: '#c4a265' }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#3d2f2a' }}>
              {t('affiliate.successTitle')}
            </h2>
            <p className="mb-8" style={{ color: '#9a8578' }}>
              {t('affiliate.successSubtitle')}
            </p>

            {/* Referral Link */}
            <div className="rounded-xl p-5 mb-6" style={{ background: '#faf6ef', border: '1px solid #e8ddd0' }}>
              <p className="text-sm mb-3" style={{ color: '#9a8578' }}>{t('affiliate.yourLink')}</p>
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'white', border: '1px solid #e8ddd0' }}
              >
                <code className="flex-1 text-sm break-all font-mono" style={{ color: '#c4a265' }}>
                  {window.location.origin}/ref/{result.referralCode}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="p-2.5 rounded-lg transition-colors"
                  style={{ border: '1px solid #e8ddd0' }}
                >
                  <Copy className="w-4 h-4" style={{ color: '#9a8578' }} />
                </button>
              </div>
            </div>

            {/* Important: Complete Stripe */}
            <div className="rounded-xl p-6 mb-6" style={{ background: '#faf6ef', border: '1px solid #c4a265' }}>
              <p className="text-sm font-semibold mb-2 flex items-center justify-center gap-2" style={{ color: '#3d2f2a' }}>
                <DollarSign className="w-4 h-4" style={{ color: '#c4a265' }} />
                {t('affiliate.stripeImportant')}
              </p>
              <p className="text-sm mb-4" style={{ color: '#5a4a42' }}>
                {t('affiliate.stripeNote')}
              </p>
              <a
                href={result.onboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="w-full shadow-lg font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #c4a265, #b8973e)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px'
                  }}
                >
                  {t('affiliate.completeStripe')}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>

            <button
              onClick={() => navigate('/')}
              className="text-sm transition-colors"
              style={{ color: '#9a8578', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#3d2f2a'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#9a8578'; }}
            >
              {t('common.returnHome')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
