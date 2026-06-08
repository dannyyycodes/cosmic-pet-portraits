import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
  Moon,
  Palette,
  Repeat,
  Sparkles,
  Users,
  ArrowLeft,
  Copy,
  ExternalLink,
  CheckCircle,
  Wallet,
} from 'lucide-react';

const C = {
  ink: '#f5efe6',
  gold: '#d4b67a',
};
const FONT_DISPLAY = '"Playfair Display", Georgia, serif';
const FONT_BODY = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const COSMIC_CSS = `
.ls-aff-field::placeholder { color: rgba(157, 141, 127, 0.7); }
.ls-aff-number::-webkit-outer-spin-button,
.ls-aff-number::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ls-aff-number { -moz-appearance: textfield; }
.ls-aff-range { accent-color: #d4b67a; }
.ls-aff-select { background-color: #171320; }
.ls-aff-select option { background-color: #171320; color: #f5efe6; }
`;

const PRODUCTS = [
  { icon: Moon, title: 'Soul readings', desc: 'Real pet astrology from their birth chart.' },
  { icon: Palette, title: 'Custom pawtraits', desc: 'A made to order portrait of their pet.' },
  { icon: Repeat, title: 'Horoscope memberships', desc: 'Recurring horoscopes for their pet.' },
];

const RATES = [
  { rate: '50%', label: 'Soul readings' },
  { rate: '20%', label: 'Memberships, for life' },
  { rate: '15%', label: 'Custom pawtraits' },
];

const PERKS = ['+ £15 first sale', 'Up to 45%', '60-day cookie', 'Instant approval', 'Monthly payouts', 'Free to join'];

const PER_READING = 25;
const SITE = 'https://littlesouls.app';

type Variant = { badge: string; h1: string; sub: string };
const VARIANTS: Record<string, Variant> = {
  customer: { badge: 'Partner Programme', h1: 'Share Little Souls, Earn From Every Sale', sub: 'Real pet soul readings, custom pawtraits, and horoscope memberships.' },
  pet: { badge: 'For Pet Creators', h1: 'Turn Pet Content Into Income', sub: 'Share soul readings, pawtraits, and horoscope memberships your audience already wants.' },
  spiritual: { badge: 'For Spiritual Creators', h1: 'Share Pet Astrology, Earn Real Commission', sub: 'Real pet soul readings, custom pawtraits, and horoscope memberships.' },
  podcast: { badge: 'For Podcast Hosts', h1: 'Give Listeners A Pet Astrology Offer', sub: 'Share soul readings, pawtraits, and horoscope memberships.' },
};
VARIANTS.youtube = VARIANTS.pet;
VARIANTS.instagram = VARIANTS.pet;
VARIANTS.tiktok = VARIANTS.pet;
VARIANTS.astrology = VARIANTS.spiritual;
VARIANTS.tarot = VARIANTS.spiritual;
const DEFAULT_VARIANT: Variant = { badge: 'Partner Programme', h1: 'Earn From Pet Soul Readings', sub: 'Real pet astrology, custom pawtraits, and horoscope memberships.' };

const FAQS: { q: string; a: string }[] = [
  { q: 'How much do Little Souls affiliates earn?', a: 'Partners earn 50% on soul readings, 20% recurring for life on horoscope memberships, and 15% on custom pawtraits, plus a £15 first sale bonus. Rates climb to 45% as partners grow.' },
  { q: 'Is the Little Souls affiliate program free to join?', a: 'Yes. It is free to join, approval is instant, and payouts are sent monthly through Stripe.' },
  { q: 'How long is the affiliate cookie?', a: 'The affiliate cookie lasts 60 days.' },
  { q: 'When and how do affiliates get paid?', a: 'Payouts are sent monthly through Stripe Connect.' },
];

export default function BecomeAffiliate() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const forKey = (searchParams.get('for') || '').toLowerCase();
  const variant = VARIANTS[forKey] || DEFAULT_VARIANT;
  const canonical = `${SITE}/become-affiliate`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const programSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Little Souls Pet Affiliate Programme',
    description: 'Pet astrology affiliate program. Earn 50% on soul readings, 20% recurring for life on horoscope memberships and 15% on custom pawtraits.',
    url: canonical,
    provider: { '@type': 'Organization', name: 'Little Souls', url: SITE },
  };

  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [name, setName] = useState(() => (searchParams.get('name') || '').slice(0, 100));
  const [email, setEmail] = useState(() => (searchParams.get('email') || '').slice(0, 254));

  useEffect(() => {
    if (searchParams.get('email') || searchParams.get('name')) {
      try { window.history.replaceState({}, '', window.location.pathname); } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [referralCode, setReferralCodeInput] = useState('');
  const [country, setCountry] = useState('US');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ referralCode: string; onboardingUrl: string } | null>(null);
  const [referralsPerMonth, setReferralsPerMonth] = useState(10);

  const monthly = referralsPerMonth * PER_READING;
  const yearly = monthly * 12;
  const fmt = (n: number) => '£' + n.toLocaleString('en-GB');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-affiliate', {
        body: { name, email, country, referralCode: referralCode.trim() || undefined },
      });
      if (error || data?.error) { toast.error(data?.error || t('affiliate.errorCreate')); return; }
      setResult({ referralCode: data.referralCode, onboardingUrl: data.onboardingUrl });
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
    navigator.clipboard.writeText(`${window.location.origin}/ref/${result.referralCode}`);
    toast.success(t('affiliate.linkCopied'));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 15px', background: 'rgba(245,239,230,0.06)',
    border: '1px solid rgba(212,182,122,0.22)', borderRadius: '14px', color: C.ink,
    fontSize: '15px', fontFamily: FONT_BODY, outline: 'none', transition: 'border-color .2s, box-shadow .2s',
  };
  const fieldFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = C.gold; e.target.style.boxShadow = '0 0 0 3px rgba(212,182,122,0.14)'; };
  const fieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'rgba(212,182,122,0.22)'; e.target.style.boxShadow = 'none'; };

  const card = 'rounded-3xl border border-[#d4b67a]/18 bg-[#f5efe6]/[0.035] backdrop-blur shadow-2xl shadow-black/30';

  return (
    <main
      className="min-h-screen lg:h-screen lg:overflow-hidden text-[#f5efe6]"
      style={{ background: 'radial-gradient(circle at 16% 14%, rgba(191,82,74,0.22), transparent 30%), radial-gradient(circle at 82% 10%, rgba(212,182,122,0.16), transparent 26%), #0d0a14' }}
    >
      <Helmet>
        <title>Pet Affiliate Program: Earn 50% | Little Souls</title>
        <meta name="description" content="Join the Little Souls pet astrology affiliate program. Earn 50% on soul readings, 20% recurring for life on horoscope memberships and 15% on custom pawtraits. Free to join, 60-day cookie, monthly Stripe payouts." />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pet Affiliate Program: Earn 50% | Little Souls" />
        <meta property="og:description" content="Earn 50% on pet soul readings, 20% recurring for life on horoscope memberships and 15% on custom pawtraits." />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="Little Souls" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pet Affiliate Program: Earn 50% | Little Souls" />
        <meta name="twitter:description" content="Earn 50% on pet soul readings, 20% recurring for life on horoscope memberships and 15% on custom pawtraits." />
        <script type="application/ld+json">{JSON.stringify(programSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <style>{COSMIC_CSS}</style>

      <div className="mx-auto flex h-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:py-6">
        <Link to="/" className="mb-4 inline-flex items-center gap-2 self-start text-sm font-semibold text-[#bcae9b] transition-colors hover:text-[#f5efe6]" style={{ fontFamily: FONT_BODY }}>
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>

        <section className="grid flex-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-6 lg:min-h-0">
          {/* LEFT: pitch + claim */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${card} p-6 sm:p-8`}>
            <div className="mb-6 flex items-center gap-3">
              <img src="/apple-touch-icon.png" alt="Little Souls" className="h-11 w-11 rounded-2xl" />
              <span className="text-lg font-semibold text-[#f5efe6]" style={{ fontFamily: FONT_DISPLAY }}>Little Souls</span>
            </div>
            <span className="mb-5 inline-flex w-fit items-center rounded-full border border-[#d4b67a]/25 bg-[#d4b67a]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e6dccb]">
              {variant.badge}
            </span>
            <h1 className="text-4xl leading-[0.98] text-[#f5efe6] sm:text-5xl" style={{ fontFamily: FONT_DISPLAY }}>{variant.h1}</h1>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-[#bcae9b]">{variant.sub}</p>

            <div className="mt-6 space-y-2.5">
              {PRODUCTS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3.5 rounded-2xl border border-[#d4b67a]/12 bg-[#0d0a14]/40 px-4 py-3">
                  <Icon className="h-5 w-5 shrink-0 text-[#d4b67a]" strokeWidth={1.6} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f5efe6]">{title}</p>
                    <p className="text-[13px] leading-5 text-[#bcae9b]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>

          {/* RIGHT: value + calc + signup (info) / form / success */}
          <div className="flex min-h-0 flex-col">
            {step === 'info' && (
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-1 flex-col ${card} p-6 sm:p-8`}>
                <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#bcae9b]">What you earn</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {RATES.map((r) => (
                    <div key={r.label} className="rounded-2xl border border-[#d4b67a]/14 bg-[#0d0a14]/45 px-3 py-4 text-center">
                      <p className="text-3xl sm:text-4xl text-[#f5efe6]" style={{ fontFamily: FONT_DISPLAY }}>{r.rate}</p>
                      <p className="mt-1 text-[12px] leading-4 text-[#bcae9b]">{r.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PERKS.map((p) => (
                    <span key={p} className="rounded-full border border-[#d4b67a]/18 bg-[#d4b67a]/[0.08] px-3 py-1 text-[12.5px] text-[#e6dccb]">{p}</span>
                  ))}
                </div>

                <div className="my-6 h-px bg-[#d4b67a]/12" />

                <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#bcae9b]">If you refer</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <span className="text-sm text-[#cdc2b2]">soul readings a month</span>
                  <input id="ref-month" type="number" min={0} value={referralsPerMonth} onChange={(e) => setReferralsPerMonth(Math.max(0, Math.floor(Number(e.target.value)) || 0))} className="ls-aff-number h-12 w-20 rounded-xl border border-[#d4b67a]/25 bg-[#f5efe6]/[0.06] text-center text-xl font-semibold tabular-nums text-[#f5efe6] outline-none focus:border-[#d4b67a]" style={{ fontFamily: FONT_DISPLAY }} aria-label="Soul readings referred per month" />
                </div>
                <input type="range" min={1} max={100} value={Math.min(referralsPerMonth, 100)} onChange={(e) => setReferralsPerMonth(Number(e.target.value))} className="ls-aff-range mt-4 w-full" aria-label="Drag to set soul readings per month" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#d4b67a]/16 bg-[#d4b67a]/10 px-3 py-4 text-center">
                    <p className="text-3xl text-[#f5efe6]" style={{ fontFamily: FONT_DISPLAY }}>{fmt(monthly)}</p>
                    <p className="mt-0.5 text-[12px] text-[#bcae9b]">per month</p>
                  </div>
                  <div className="rounded-2xl border border-[#d4b67a]/14 bg-[#0d0a14]/55 px-3 py-4 text-center">
                    <p className="text-3xl text-[#f5efe6]" style={{ fontFamily: FONT_DISPLAY }}>{fmt(yearly)}</p>
                    <p className="mt-0.5 text-[12px] text-[#bcae9b]">per year</p>
                  </div>
                </div>

                <Button onClick={() => setStep('form')} className="mt-auto h-14 w-full rounded-2xl text-base font-bold text-[#0d0a14] shadow-[0_16px_44px_rgba(212,182,122,0.24)] transition hover:bg-[#e0c58d]" style={{ background: C.gold, border: 'none', fontFamily: FONT_BODY }}>
                  <Users className="mr-2 h-5 w-5" /> Sign up free
                </Button>
              </motion.div>
            )}

            {step === 'form' && (
              <motion.div id="aff-form" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-1 flex-col ${card} p-6 sm:p-8`}>
                <h2 className="text-3xl text-[#f5efe6]" style={{ fontFamily: FONT_DISPLAY }}>Create your link</h2>
                <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#f5efe6]" htmlFor="aff-name">Name</label>
                    <input id="aff-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} className="ls-aff-field" placeholder="Your name" maxLength={100} required onFocus={fieldFocus} onBlur={fieldBlur} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#f5efe6]" htmlFor="aff-email">Email</label>
                    <input id="aff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} className="ls-aff-field" placeholder="you@example.com" maxLength={254} required onFocus={fieldFocus} onBlur={fieldBlur} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#f5efe6]" htmlFor="aff-code">Referral code <span className="font-normal text-[#bcae9b]">optional</span></label>
                    <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                      <span className="text-sm text-[#bcae9b]">littlesouls.app/ref/</span>
                      <input id="aff-code" type="text" value={referralCode} onChange={(e) => setReferralCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))} style={{ ...inputStyle, fontFamily: 'monospace' }} className="ls-aff-field" placeholder="petlover" maxLength={20} onFocus={fieldFocus} onBlur={fieldBlur} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#f5efe6]" htmlFor="aff-country">Country</label>
                    <select id="aff-country" value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle} className="ls-aff-select" required onFocus={fieldFocus} onBlur={fieldBlur}>
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
                  <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => setStep('info')} className="h-12 rounded-2xl border-[#d4b67a]/25 bg-transparent px-6 text-[#f5efe6] hover:bg-[#f5efe6]/10" style={{ fontFamily: FONT_BODY }}>Back</Button>
                    <Button type="submit" disabled={isLoading} className="h-12flex-1 rounded-2xl font-bold text-[#0d0a14] hover:bg-[#e0c58d]" style={{ background: isLoading ? 'rgba(212,182,122,0.65)' : C.gold, border: 'none', fontFamily: FONT_BODY }}>
                      {isLoading ? 'Creating...' : 'Create partner account'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'success' && result && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`flex flex-1 flex-col justify-center ${card} p-6 text-center sm:p-8`}>
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-[#d4b67a]/35 bg-[#d4b67a]/10 shadow-[0_0_70px_rgba(212,182,122,0.22)]">
                  <CheckCircle className="h-8 w-8 text-[#d4b67a]" />
                </div>
                <h2 className="text-3xl text-[#f5efe6]" style={{ fontFamily: FONT_DISPLAY }}>You are in</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#bcae9b]">Finish Stripe payouts, then share your link.</p>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#d4b67a]/16 bg-[#0d0a14]/60 p-3 text-left">
                  <code className="flex-1 break-all font-mono text-sm text-[#f5efe6]">{window.location.origin}/ref/{result.referralCode}</code>
                  <button onClick={copyReferralLink} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d4b67a]/20 bg-[#d4b67a]/10 transition hover:bg-[#d4b67a]/15" aria-label="Copy referral link">
                    <Copy className="h-4 w-4 text-[#d4b67a]" />
                  </button>
                </div>

                <a href={result.onboardingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                  <Button className="h-14 w-full rounded-2xl font-bold text-[#0d0a14] hover:bg-[#e0c58d]" style={{ background: C.gold, border: 'none', fontFamily: FONT_BODY }}>
                    <Wallet className="mr-2 h-4 w-4" /> Complete Stripe setup <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <button onClick={() => navigate('/')} className="mt-5 text-sm text-[#bcae9b] transition-colors hover:text-[#f5efe6]" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY }}>Return home</button>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
