import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowLeft, Ticket, Sparkles, CheckCircle } from 'lucide-react';

type OccasionMode = 'discover' | 'new' | 'birthday' | 'memorial' | 'gift';

// Order: the three primary landing paths first (discover / new / memorial),
// then birthday + gift. Matches the landing-page PathPicker so redeem flows
// can carry intent through to the same report voice.
const OCCASION_OPTIONS: Array<{ value: OccasionMode; emoji: string; label: string; desc: string }> = [
  { value: 'discover', emoji: '🔮', label: 'Discover', desc: 'Explore who they are' },
  { value: 'new', emoji: '🌱', label: 'New Pet', desc: 'A soul just arrived in your life' },
  { value: 'memorial', emoji: '🕊️', label: 'Memorial', desc: 'For a soul no longer at your side' },
  { value: 'birthday', emoji: '🎂', label: 'Birthday', desc: 'Celebrate another year' },
  { value: 'gift', emoji: '🎁', label: 'Gift', desc: 'A cosmic gift for someone' },
];

export default function RedeemCode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Accept ?occasion=memorial|birthday|discover|gift so landing pages can deep-link
  // straight into the right context. The post-purchase intake reads pet_reports.occasion_mode
  // and skips the occasion picker when this is set to anything other than 'discover'.
  const urlOccasion = searchParams.get('occasion') as OccasionMode | null;
  const initialOccasion: OccasionMode =
    urlOccasion && ['discover', 'new', 'birthday', 'memorial', 'gift'].includes(urlOccasion)
      ? urlOccasion
      : 'discover';
  const [code, setCode] = useState('');
  const [occasion, setOccasion] = useState<OccasionMode>(initialOccasion);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    reportId: string;
    tier: string;
  } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-free-code', {
        body: { code: code.trim(), occasionMode: occasion },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to redeem code');
        return;
      }

      setResult({ reportId: data.reportId, tier: data.tier });
      toast.success('Code redeemed! Redirecting to your reading...');

      // Redirect to payment-success with quick checkout — PostPurchaseIntake handles pet data + email
      setTimeout(() => {
        navigate(`/payment-success?session_id=redeem_${data.reportId}&report_id=${data.reportId}&quick=true`);
      }, 1500);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: '#0d0a14', minHeight: '100vh' }}>
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-colors"
          style={{ color: '#9d8d7f' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(245,239,230,0.05)', border: '1px solid rgba(212,182,122,0.22)' }}
          >
            <Ticket className="w-4 h-4" style={{ color: '#d4b67a' }} />
            <span className="text-sm font-semibold" style={{ color: '#d4b67a' }}>
              Free Reading
            </span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#f5efe6' }}
          >
            Redeem Your Free Reading
          </h1>
          <p style={{ color: '#9d8d7f' }}>
            Enter your code below to unlock a complimentary Little Souls reading
          </p>
        </motion.div>

        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-2xl"
            style={{ background: 'rgba(245,239,230,0.05)', border: '1px solid rgba(212,182,122,0.22)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          >
            <form onSubmit={handleRedeem} className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#f5efe6' }}
                >
                  What's this reading for?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OCCASION_OPTIONS.map((opt) => {
                    // Memorial gets a muted dove/sage palette — a grieving
                    // buyer shouldn't see the same warm gold as birthday
                    // and discover options. The colour shift is subtle but
                    // signals product respect.
                    const isMemorialOpt = opt.value === 'memorial';
                    const selectedBg = isMemorialOpt
                      ? 'rgba(120,130,125,0.18)'
                      : 'rgba(212,182,122,0.18)';
                    const selectedBorder = isMemorialOpt ? '#788280' : '#d4b67a';
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setOccasion(opt.value)}
                        className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all text-center"
                        style={{
                          background: occasion === opt.value ? selectedBg : 'rgba(245,239,230,0.05)',
                          border: occasion === opt.value
                            ? `1.5px solid ${selectedBorder}`
                            : '1.5px solid rgba(212,182,122,0.22)',
                        }}
                      >
                        <span className="text-xl">{opt.emoji}</span>
                        <span className="text-[0.85rem] font-semibold" style={{ color: '#f5efe6' }}>{opt.label}</span>
                        <span className="text-[0.68rem]" style={{ color: '#9d8d7f' }}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#f5efe6' }}
                >
                  Redeem Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3.5 rounded-xl text-center text-lg font-mono tracking-widest transition-all outline-none"
                  style={{
                    background: 'rgba(245,239,230,0.05)',
                    border: '1px solid rgba(212,182,122,0.22)',
                    color: '#f5efe6',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#d4b67a')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(212,182,122,0.22)')}
                  placeholder="ENTER CODE"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="w-full py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50"
                style={{
                  background: '#d4b67a',
                  color: '#141210',
                  border: 'none',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-[#141210] border-t-transparent rounded-full"
                    />
                    Redeeming...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Redeem Code
                  </span>
                )}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: '#9d8d7f' }}>
              Codes are case-insensitive and single-use unless specified otherwise
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl text-center"
            style={{ background: 'rgba(245,239,230,0.05)', border: '1px solid rgba(212,182,122,0.22)' }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: '#d4b67a' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: '#141210' }} />
            </div>
            <h2
              className="text-xl font-bold mb-2"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', color: '#f5efe6' }}
            >
              Code Redeemed!
            </h2>
            <p style={{ color: '#cfc1b1' }}>
              Taking you to your free {result.tier} reading...
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
