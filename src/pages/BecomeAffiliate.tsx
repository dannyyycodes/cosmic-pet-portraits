import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Copy,
  ExternalLink,
  ArrowLeft,
  Users,
  Percent,
  Clock,
  Heart,
  Zap,
  ChevronDown,
} from 'lucide-react';

/**
 * /become-affiliate : Partner programme landing.
 * Palette + type locked to the /pawtraits commercial look:
 *   white surfaces, charcoal ink, Rose (#bf524a) CTA, Asap/Assistant fonts.
 * Copy is brand-locked: "soul readings" (never "report"/"AI"), the bond,
 * honest tiered earnings. Terms corrected: 60-day cookie, monthly payouts.
 */

const C = {
  bg: '#ffffff',
  panel: '#fafafa',
  card: '#ffffff',
  border: '#ededed',
  borderDeep: '#e2e2e2',
  ink: '#1c1c1c',
  body: '#3a3a3a',
  muted: '#7a7a7a',
  rose: '#bf524a',
  roseDeep: '#9c3d36',
  roseSoft: '#fbeae8',
  gold: '#c4a265',
};
const FONT_DISPLAY = 'Asap, system-ui, sans-serif';
const FONT_BODY = 'Assistant, system-ui, sans-serif';

// Astrological glyphs used as section accents.
const PLANETS = ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆']; // ☉☽☿♀♂♃♄♅♆
const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']; // ♈..♓

// Deterministic starfield — each row is [top%, left%, sizePx, delayS, durS, isGold].
const STARS = [
  [6, 8, 2, 0, 3.4, 1], [11, 78, 3, 0.6, 4.1, 0], [18, 24, 2, 1.2, 3.0, 1], [9, 54, 2, 0.3, 3.8, 0],
  [22, 92, 3, 1.7, 4.6, 1], [27, 13, 2, 0.9, 3.2, 0], [32, 67, 2, 2.1, 4.0, 1], [37, 40, 3, 0.4, 3.6, 0],
  [41, 88, 2, 1.4, 4.4, 1], [47, 6, 2, 2.4, 3.1, 0], [52, 72, 3, 0.7, 3.9, 1], [58, 30, 2, 1.9, 4.2, 0],
  [63, 95, 2, 0.2, 3.5, 1], [69, 18, 3, 1.1, 4.7, 0], [74, 60, 2, 2.6, 3.3, 1], [79, 84, 2, 0.5, 3.7, 0],
  [84, 38, 3, 1.6, 4.3, 1], [89, 9, 2, 2.2, 3.0, 0], [92, 70, 2, 0.8, 4.5, 1], [15, 45, 2, 2.9, 3.4, 0],
  [44, 52, 2, 1.3, 4.1, 1], [66, 47, 2, 0.1, 3.8, 0], [35, 78, 2, 2.0, 4.0, 1], [55, 14, 3, 1.5, 3.6, 0],
];

const COSMIC_CSS = `
@keyframes lsTwinkle { 0%,100% { opacity:.15; transform:scale(.8) } 50% { opacity:1; transform:scale(1.15) } }
@keyframes lsDriftA { 0%,100% { transform:translate(0,0) } 50% { transform:translate(22px,-26px) } }
@keyframes lsDriftB { 0%,100% { transform:translate(0,0) } 50% { transform:translate(-28px,20px) } }
@keyframes lsSpinSlow { to { transform:rotate(360deg) } }
@keyframes lsSpinRev { to { transform:rotate(-360deg) } }
@keyframes lsFloat { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-7px) } }
@keyframes lsPulseGlow { 0%,100% { opacity:.45 } 50% { opacity:.85 } }
.ls-cosmos { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }
.ls-star { position:absolute; border-radius:50%; animation:lsTwinkle ease-in-out infinite; }
.ls-orb { position:absolute; border-radius:50%; filter:blur(10px); will-change:transform; }
.ls-ring { position:absolute; left:50%; top:120px; width:520px; height:520px; margin-left:-260px; border-radius:50%;
  border:1px solid rgba(196,162,101,.18); animation:lsSpinSlow 90s linear infinite; }
.ls-ring2 { width:360px; height:360px; margin-left:-180px; top:200px; border-color:rgba(191,82,74,.14); animation:lsSpinRev 70s linear infinite; }
.ls-ring .ls-glyph { position:absolute; left:50%; top:-13px; font-size:18px; color:rgba(196,162,101,.5); transform-origin:0 273px; }
.ls-ring2 .ls-glyph { font-size:15px; color:rgba(191,82,74,.45); transform-origin:0 193px; top:-11px; }
.ls-sect-glyph { position:absolute; top:14px; right:16px; font-size:30px; line-height:1; color:rgba(196,162,101,.22); pointer-events:none; animation:lsFloat 6s ease-in-out infinite; }
.ls-num-glyph { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:13px; color:rgba(255,255,255,.85); }
@media (prefers-reduced-motion: reduce) { .ls-cosmos *, .ls-sect-glyph { animation:none !important } }
`;

const BENEFITS = [
  { icon: Percent, title: 'Up to 50% Commission', desc: 'Earn on every soul reading, membership and pawtrait you refer.' },
  { icon: Clock, title: '60-Day Cookie', desc: "They've got two months to come back, and you still get paid." },
  { icon: TrendingUp, title: 'Monthly Payouts', desc: 'Straight to your bank via Stripe, every single month.' },
];

const STEPS = [
  { title: 'Apply in 60 seconds', desc: 'Tell us about you and connect Stripe for payouts. Approved instantly.' },
  { title: 'Share your link', desc: 'Drop it in your videos, posts, bio or stories. Your audience gets a discount.' },
  { title: 'Earn on every sale', desc: "Your 60-day cookie means you're paid even when they come back later." },
];

// What partners earn, with a plain explainer that expands on tap.
const TIERS = [
  {
    label: 'Soul readings',
    rate: '50%',
    info: "The secret inner world of your pet, revealed: their true nature, their instincts, the why behind who they are. Reads like it knows them better than they do.",
  },
  {
    label: 'Horoscope memberships',
    rate: '20% for life',
    info: "A weekly reading of what's stirring for your pet. Quietly addictive. People check their pet's before their own.",
  },
  {
    label: 'Custom pawtraits',
    rate: '15%',
    info: "Your pet turned into a piece of art worth framing, in whatever style they choose. The 'I have to have this' gift, printed and ready to hang.",
  },
];

// Honest earnings math. Premium soul reading ~£50, partner keeps 50% = £25.
const PER_READING = 25;

const SITE = 'https://littlesouls.app';

// Audience-specific hero copy, selected by ?for=. Falls back to the generic hero.
type Variant = { badge: string; h1: string; sub: string };
const VARIANTS: Record<string, Variant> = {
  customer: {
    badge: 'Partner Programme',
    h1: 'You Loved It. Now Earn From It.',
    sub: 'You already felt what a soul reading does. Share yours and earn up to 50% every time a friend gets theirs, plus 20% for life on horoscopes and 15% on pawtraits.',
  },
  pet: {
    badge: 'For Pet Creators',
    h1: 'Turn Your Pet Content Into Income',
    sub: 'Your audience already loves your pet. Share the soul readings, horoscopes and custom pawtraits they want and earn up to 50% on every sale.',
  },
  spiritual: {
    badge: 'For Spiritual Creators',
    h1: 'Share Cosmic Readings Your Audience Already Wants',
    sub: 'Real astrology for pets, calculated from their exact birth chart. Earn up to 50% sharing readings, horoscope memberships and custom pawtraits.',
  },
  podcast: {
    badge: 'For Podcast Hosts',
    h1: 'Your Listeners Will Love This',
    sub: 'A gift-first partnership: a free soul reading for your own pet, then up to 50% every time your listeners get theirs.',
  },
};
// Alias related sources onto the right variant.
VARIANTS.youtube = VARIANTS.pet;
VARIANTS.instagram = VARIANTS.pet;
VARIANTS.tiktok = VARIANTS.pet;
VARIANTS.astrology = VARIANTS.spiritual;
VARIANTS.tarot = VARIANTS.spiritual;
const DEFAULT_VARIANT: Variant = {
  badge: 'Partner Programme',
  h1: 'Earn While You Share the Bond',
  sub: 'Partner with Little Souls and earn up to 50% sharing the soul readings, horoscopes and custom pawtraits your audience already loves.',
};

// Affiliate-program FAQ — also emitted as FAQPage JSON-LD for rich results / AI answers.
const FAQS: { q: string; a: string }[] = [
  { q: 'How much do Little Souls affiliates earn?', a: 'Partners earn up to 50% on every soul reading, 20% for life on horoscope memberships, and 15% on custom pawtraits, plus a £15 bonus on the first sale. Rates climb to 45% as you grow.' },
  { q: 'Is the Little Souls affiliate program free to join?', a: 'Yes. It is free to join, you are approved instantly, and there is no audience minimum. You connect Stripe once and get paid monthly.' },
  { q: 'How long is the affiliate cookie?', a: 'Sixty days. If someone clicks your link and buys within two months, you still earn the commission.' },
  { q: 'When and how do affiliates get paid?', a: 'Payouts are sent monthly straight to your bank via Stripe Connect.' },
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
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const programSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Little Souls Pet Affiliate & Partner Programme',
    description: 'Pet and pet-astrology affiliate program. Earn up to 50% on cosmic soul readings, 20% lifetime on horoscope memberships and 15% on custom pawtraits.',
    url: canonical,
    provider: {
      '@type': 'Organization',
      name: 'Little Souls',
      url: SITE,
    },
  };
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [name, setName] = useState(() => (searchParams.get('name') || '').slice(0, 100));
  const [email, setEmail] = useState(() => (searchParams.get('email') || '').slice(0, 254));

  // Strip prefilled email/name from the URL so they don't linger in browser history
  // / referrer headers (the form keeps the values in state). Runs once.
  useEffect(() => {
    if (searchParams.get('email') || searchParams.get('name')) {
      try { window.history.replaceState({}, '', window.location.pathname); } catch { /* noop */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [referralCode, setReferralCodeInput] = useState('');
  const [country, setCountry] = useState('US');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    referralCode: string;
    onboardingUrl: string;
  } | null>(null);
  const [backLinkHovered, setBackLinkHovered] = useState(false);
  const [referralsPerMonth, setReferralsPerMonth] = useState(10);
  const [openTier, setOpenTier] = useState<string | null>(null);

  const monthly = referralsPerMonth * PER_READING;
  const yearly = monthly * 12;
  const fmt = (n: number) => '£' + n.toLocaleString('en-GB');
  // Force text (monochrome line) presentation of astro glyphs, not the chunky emoji form.
  const txt = (g: string) => g + '︎';

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

  // Hero freebie capture — grab the email immediately (best-effort persist so a lead is
  // never lost), then open the signup form prefilled. Destination of the lead is
  // confirmable later; the email already enters the signup funnel here.
  const handleClaimEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast.error('Enter a valid email to claim your free reading'); return; }
    try {
      await supabase.from('email_subscribers').insert({ email: v, is_subscribed: true, source: 'become-affiliate-freebie' });
    } catch { /* non-blocking lead capture */ }
    setStep('form');
    toast.success('Your free soul reading is reserved — finish below to get your link.');
    setTimeout(() => { try { document.getElementById('aff-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch { /* noop */ } }, 60);
  };

  const copyReferralLink = () => {
    if (!result) return;
    const link = `${window.location.origin}/ref/${result.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success(t('affiliate.linkCopied'));
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: '12px',
    color: C.ink,
    fontSize: '14px',
    fontFamily: FONT_BODY,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }} className="relative overflow-hidden">
      <Helmet>
        <title>Pet Affiliate Program — Earn up to 50% | Little Souls</title>
        <meta name="description" content="Join the Little Souls pet & astrology affiliate program. Earn up to 50% on cosmic soul readings, 20% lifetime on horoscope memberships and 15% on custom pawtraits. Free to join, 60-day cookie, monthly Stripe payouts." />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pet Affiliate Program — Earn up to 50% | Little Souls" />
        <meta property="og:description" content="Earn up to 50% sharing cosmic pet soul readings, horoscopes and custom pawtraits. Free to join, instant approval, monthly payouts." />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="Little Souls" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pet Affiliate Program — Earn up to 50% | Little Souls" />
        <meta name="twitter:description" content="Earn up to 50% sharing cosmic pet soul readings, horoscopes and custom pawtraits. Free to join, instant approval, monthly payouts." />
        <script type="application/ld+json">{JSON.stringify(programSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Cosmic backdrop — drifting planets, twin rotating glyph rings, starfield. */}
      <style>{COSMIC_CSS}</style>
      <div className="ls-cosmos" aria-hidden="true">
        <div className="ls-orb" style={{ width: 220, height: 220, left: '-60px', top: '70px', background: 'radial-gradient(circle at 35% 30%, rgba(196,162,101,.30), rgba(196,162,101,0) 70%)', animation: 'lsDriftA 26s ease-in-out infinite' }} />
        <div className="ls-orb" style={{ width: 300, height: 300, right: '-90px', top: '300px', background: 'radial-gradient(circle at 40% 35%, rgba(191,82,74,.20), rgba(191,82,74,0) 70%)', animation: 'lsDriftB 32s ease-in-out infinite' }} />
        <div className="ls-orb" style={{ width: 170, height: 170, left: '8%', bottom: '120px', background: 'radial-gradient(circle at 40% 35%, rgba(28,28,28,.08), rgba(28,28,28,0) 70%)', animation: 'lsDriftA 40s ease-in-out infinite' }} />
        <div className="ls-orb" style={{ width: 40, height: 40, right: '7%', top: '56px', filter: 'blur(0.4px)', background: 'radial-gradient(circle at 32% 28%, #d8b878, #b07f3e 72%)', boxShadow: '0 0 18px rgba(196,162,101,.45)', animation: 'lsFloat 7s ease-in-out infinite' }} />
        <div className="ls-ring">
          {ZODIAC.map((g, i) => (<span key={i} className="ls-glyph" style={{ transform: `rotate(${i * 30}deg)` }}>{txt(g)}</span>))}
        </div>
        <div className="ls-ring ls-ring2">
          {PLANETS.slice(0, 8).map((g, i) => (<span key={i} className="ls-glyph" style={{ transform: `rotate(${i * 45}deg)` }}>{txt(g)}</span>))}
        </div>
        {STARS.map((s, i) => (
          <span key={i} className="ls-star" style={{ top: `${s[0]}%`, left: `${s[1]}%`, width: s[2], height: s[2], background: s[5] ? '#c4a265' : '#bf524a', animationDuration: `${s[4]}s`, animationDelay: `${s[3]}s` }} />
        ))}
      </div>

      <div className="relative z-10 p-6 max-w-2xl mx-auto py-12">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 transition-colors mb-8"
          style={{ color: backLinkHovered ? C.ink : C.muted, textDecoration: 'none', fontFamily: FONT_BODY, fontWeight: 600 }}
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
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
            style={{ background: C.roseSoft, color: C.rose }}
          >
            <Heart className="w-4 h-4" style={{ color: C.rose }} fill={C.rose} />
            <span className="text-sm font-bold" style={{ fontFamily: FONT_BODY, letterSpacing: '0.02em' }}>{variant.badge}</span>
          </motion.div>
          <h1
            className="text-4xl md:text-5xl mb-4"
            style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            {variant.h1}
          </h1>
          <p className="text-lg max-w-lg mx-auto" style={{ color: C.muted, fontFamily: FONT_BODY }}>
            {variant.sub}
          </p>

          {/* Freebie email capture — gift-first hook, captures the lead before the form. */}
          <motion.form
            onSubmit={handleClaimEmail}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-md mx-auto"
          >
            <p style={{ color: C.rose, fontFamily: FONT_BODY, fontWeight: 800, fontSize: 13, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>
              <span style={{ color: C.gold }}>✦</span> Start with a free soul reading for your own pet
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                aria-label="Your email"
                style={{ ...inputStyle, background: '#fff', boxShadow: '0 2px 10px rgba(196,162,101,0.10)', textAlign: 'center' }}
                onFocus={(e) => { e.target.style.borderColor = C.gold; }}
                onBlur={(e) => { e.target.style.borderColor = C.border; }}
              />
              <Button
                type="submit"
                className="font-bold whitespace-nowrap active:scale-[0.98] transition-transform"
                style={{ background: C.rose, color: '#fff', border: 'none', borderRadius: '12px', fontFamily: FONT_BODY, padding: '0 22px', boxShadow: '0 8px 20px rgba(191,82,74,0.26)' }}
              >
                <Sparkles className="w-4 h-4 mr-1.5" /> Claim free reading
              </Button>
            </div>
            <p style={{ color: C.muted, fontFamily: FONT_BODY, fontSize: 12, marginTop: 9 }}>
              Free to start · then earn up to 50% sharing it · no card needed
            </p>
          </motion.form>
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
              {BENEFITS.map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-6 text-center group"
                  style={{ position: 'relative', overflow: 'hidden', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', boxShadow: '0 1px 3px rgba(20,18,16,0.04)' }}
                >
                  <span className="ls-sect-glyph" style={{ animationDelay: `${i * 0.8}s` }}>{txt(PLANETS[i])}</span>
                  <div
                    className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: C.roseSoft }}
                  >
                    <benefit.icon className="w-7 h-7" style={{ color: C.rose }} />
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: C.ink, fontFamily: FONT_DISPLAY, fontSize: '17px' }}>{benefit.title}</h3>
                  <p className="text-sm" style={{ color: C.body, fontFamily: FONT_BODY }}>{benefit.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Stats Banner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-2 sm:gap-6 p-5 sm:p-6 rounded-2xl"
              style={{ background: C.panel, border: `1px solid ${C.border}` }}
            >
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: C.rose, fontFamily: FONT_DISPLAY }}>Up to 50%</p>
                <p className="text-xs sm:text-sm" style={{ color: C.muted, fontFamily: FONT_BODY }}>Commission</p>
              </div>
              <div className="text-center" style={{ borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: C.ink, fontFamily: FONT_DISPLAY }}>60 days</p>
                <p className="text-xs sm:text-sm" style={{ color: C.muted, fontFamily: FONT_BODY }}>Cookie</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: C.ink, fontFamily: FONT_DISPLAY }}>Monthly</p>
                <p className="text-xs sm:text-sm" style={{ color: C.muted, fontFamily: FONT_BODY }}>Payouts</p>
              </div>
            </motion.div>

            {/* What you earn, tiered commission with expandable explainers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(20,18,16,0.04)' }}
            >
              <h2 className="text-xl mb-1 flex items-center gap-2" style={{ color: C.ink, fontFamily: FONT_DISPLAY, fontWeight: 800 }}>
                <Percent className="w-5 h-5" style={{ color: C.rose }} />
                What you earn
              </h2>
              <p className="text-xs mb-4" style={{ color: C.muted, fontFamily: FONT_BODY }}>Tap any product to see what it is.</p>
              <div className="space-y-0">
                {TIERS.map((tier, i) => {
                  const open = openTier === tier.label;
                  return (
                    <div key={tier.label} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <button
                        type="button"
                        onClick={() => setOpenTier(open ? null : tier.label)}
                        className="w-full flex items-center justify-between py-3 text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        aria-expanded={open}
                      >
                        <span className="flex items-center gap-1.5 text-sm sm:text-base" style={{ color: C.body, fontFamily: FONT_BODY }}>
                          <span style={{ color: C.gold, fontSize: '15px', opacity: 0.8 }}>{txt([ZODIAC[4], ZODIAC[7], ZODIAC[9]][i] || ZODIAC[i])}</span>
                          {tier.label}
                          <ChevronDown
                            className="w-4 h-4 transition-transform"
                            style={{ color: C.muted, transform: open ? 'rotate(180deg)' : 'none' }}
                          />
                        </span>
                        <span className="font-extrabold text-base sm:text-lg whitespace-nowrap" style={{ color: C.rose, fontFamily: FONT_DISPLAY }}>{tier.rate}</span>
                      </button>
                      {open && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm pb-4 pr-6 overflow-hidden"
                          style={{ color: C.muted, fontFamily: FONT_BODY, lineHeight: 1.55 }}
                        >
                          {tier.info}
                        </motion.p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-xl p-4" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                <p className="text-sm" style={{ color: C.body, fontFamily: FONT_BODY }}>
                  <strong style={{ color: C.ink }}>+£15 on your first sale.</strong> Share more and your rate climbs to{' '}
                  <strong style={{ color: C.ink }}>35%, then 40%, then 45%</strong> as you reach 5, 10 and 25 sales.
                </p>
              </div>
            </motion.div>

            {/* Earnings potential calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 }}
              className="rounded-2xl p-6 sm:p-8"
              style={{ background: C.roseSoft, border: `1px solid ${C.rose}33` }}
            >
              <h2 className="text-xl mb-1 flex items-center gap-2" style={{ color: C.ink, fontFamily: FONT_DISPLAY, fontWeight: 800 }}>
                <TrendingUp className="w-5 h-5" style={{ color: C.rose }} />
                See what you could earn
              </h2>
              <p className="text-sm mb-6" style={{ color: C.body, fontFamily: FONT_BODY }}>
                Drag to set how many soul readings you refer each month.
              </p>

              <div className="flex items-baseline justify-between mb-2 gap-3">
                <span className="text-sm" style={{ color: C.body, fontFamily: FONT_BODY }}>You refer</span>
                <span className="flex items-baseline gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={referralsPerMonth}
                    onChange={(e) => setReferralsPerMonth(Math.max(0, Math.floor(Number(e.target.value)) || 0))}
                    className="text-right font-extrabold text-lg"
                    style={{
                      width: '4.5ch',
                      minWidth: '4.5ch',
                      color: C.rose,
                      fontFamily: FONT_DISPLAY,
                      background: '#fff',
                      border: `1px solid ${C.rose}33`,
                      borderRadius: '8px',
                      padding: '2px 6px',
                      outline: 'none',
                    }}
                    aria-label="Soul readings referred per month"
                  />
                  <span className="font-extrabold text-lg" style={{ color: C.rose, fontFamily: FONT_DISPLAY }}>a month</span>
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={Math.min(referralsPerMonth, 100)}
                onChange={(e) => setReferralsPerMonth(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: C.rose, height: '6px' }}
                aria-label="Drag to set soul readings referred per month"
              />
              <p className="text-xs mt-1.5" style={{ color: C.muted, fontFamily: FONT_BODY }}>
                Drag the bar, or type any number above.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="rounded-xl p-4 text-center" style={{ background: '#fff', border: `1px solid ${C.rose}22` }}>
                  <p className="text-3xl font-extrabold" style={{ color: C.rose, fontFamily: FONT_DISPLAY }}>{fmt(monthly)}</p>
                  <p className="text-xs mt-1" style={{ color: C.muted, fontFamily: FONT_BODY }}>per month</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: '#fff', border: `1px solid ${C.rose}22` }}>
                  <p className="text-3xl font-extrabold" style={{ color: C.ink, fontFamily: FONT_DISPLAY }}>{fmt(yearly)}</p>
                  <p className="text-xs mt-1" style={{ color: C.muted, fontFamily: FONT_BODY }}>per year</p>
                </div>
              </div>

              <p className="text-xs mt-5" style={{ color: C.muted, fontFamily: FONT_BODY, lineHeight: 1.5 }}>
                Based on £25 per soul reading, your 50% of a £50 reading. Custom pawtraits (15%) and horoscope
                memberships (20% every month, for life) stack on top, so your real total is usually higher.
              </p>
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl p-8"
              style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(20,18,16,0.04)' }}
            >
              <h2 className="text-xl mb-6 flex items-center gap-2" style={{ color: C.ink, fontFamily: FONT_DISPLAY, fontWeight: 800 }}>
                <Zap className="w-5 h-5" style={{ color: C.rose }} />
                How it works
              </h2>
              <ol className="space-y-5">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ background: C.rose, color: 'white', fontFamily: FONT_DISPLAY }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-bold" style={{ color: C.ink, fontFamily: FONT_DISPLAY }}>
                        {s.title}
                        <span style={{ color: C.gold, opacity: 0.6, marginLeft: 7, fontSize: '15px' }}>{txt(PLANETS[i + 2])}</span>
                      </p>
                      <p className="text-sm" style={{ color: C.body, fontFamily: FONT_BODY }}>{s.desc}</p>
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
                className="px-8 py-3 text-base font-bold shadow-lg active:scale-[0.98] transition-transform"
                style={{
                  background: C.rose,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontFamily: FONT_BODY,
                  boxShadow: '0 8px 20px rgba(191,82,74,0.28)',
                }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Become a partner
              </Button>
              <p className="text-xs mt-3" style={{ color: C.muted, fontFamily: FONT_BODY }}>
                Free to join · Approved instantly · No audience minimum
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <motion.div
            id="aff-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(20,18,16,0.04)' }}
          >
            <h2 className="text-2xl mb-6 flex items-center gap-2" style={{ color: C.ink, fontFamily: FONT_DISPLAY, fontWeight: 800 }}>
              <Users className="w-6 h-6" style={{ color: C.rose }} />
              {t('affiliate.applicationTitle')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: FONT_BODY }}>
                  {t('affiliate.fullName')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  placeholder={t('affiliate.fullNamePlaceholder')}
                  maxLength={100}
                  required
                  onFocus={(e) => { e.target.style.borderColor = C.rose; }}
                  onBlur={(e) => { e.target.style.borderColor = C.border; }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: FONT_BODY }}>
                  {t('affiliate.emailAddress')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                  onFocus={(e) => { e.target.style.borderColor = C.rose; }}
                  onBlur={(e) => { e.target.style.borderColor = C.border; }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: FONT_BODY }}>
                  {t('affiliate.customCode')} <span style={{ color: C.muted, fontWeight: 'normal' }}>{t('affiliate.customCodeOptional')}</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm whitespace-nowrap" style={{ color: C.muted, fontFamily: FONT_BODY }}>littlesouls.app/ref/</span>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                    placeholder="petlover"
                    maxLength={20}
                    onFocus={(e) => { e.target.style.borderColor = C.rose; }}
                    onBlur={(e) => { e.target.style.borderColor = C.border; }}
                  />
                </div>
                <p className="text-xs mt-2" style={{ color: C.muted, fontFamily: FONT_BODY }}>
                  {t('affiliate.customCodeHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: C.ink, fontFamily: FONT_BODY }}>
                  {t('affiliate.country')}
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={inputStyle}
                  required
                  onFocus={(e) => { e.target.style.borderColor = C.rose; }}
                  onBlur={(e) => { e.target.style.borderColor = C.border; }}
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
                  style={{ border: `1px solid ${C.borderDeep}`, color: C.body, borderRadius: '12px', background: 'white', fontFamily: FONT_BODY }}
                >
                  {t('common.back')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 font-bold"
                  disabled={isLoading}
                  style={{
                    background: isLoading ? '#d8a39d' : C.rose,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: FONT_BODY,
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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

            <p className="text-xs mt-6 text-center" style={{ color: C.muted, fontFamily: FONT_BODY }}>
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
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(20,18,16,0.04)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: C.rose }}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl mb-2" style={{ color: C.ink, fontFamily: FONT_DISPLAY, fontWeight: 800 }}>
              You're in! 🎉
            </h2>
            <p className="mb-8" style={{ color: C.muted, fontFamily: FONT_BODY }}>
              Your partner account is live. Finish payout setup below and your link's ready to share.
            </p>

            {/* Referral Link */}
            <div className="rounded-xl p-5 mb-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <p className="text-sm mb-3" style={{ color: C.muted, fontFamily: FONT_BODY }}>{t('affiliate.yourLink')}</p>
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'white', border: `1px solid ${C.border}` }}
              >
                <code className="flex-1 text-sm break-all font-mono" style={{ color: C.rose }}>
                  {window.location.origin}/ref/{result.referralCode}
                </code>
                <button
                  onClick={copyReferralLink}
                  className="p-2.5 rounded-lg transition-colors"
                  style={{ border: `1px solid ${C.border}` }}
                >
                  <Copy className="w-4 h-4" style={{ color: C.muted }} />
                </button>
              </div>
            </div>

            {/* Important: Complete Stripe */}
            <div className="rounded-xl p-6 mb-6" style={{ background: C.panel, border: `1px solid ${C.rose}` }}>
              <p className="text-sm font-semibold mb-2 flex items-center justify-center gap-2" style={{ color: C.ink, fontFamily: FONT_BODY }}>
                <DollarSign className="w-4 h-4" style={{ color: C.rose }} />
                {t('affiliate.stripeImportant')}
              </p>
              <p className="text-sm mb-4" style={{ color: C.body, fontFamily: FONT_BODY }}>
                {t('affiliate.stripeNote')}
              </p>
              <a
                href={result.onboardingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="w-full shadow-lg font-bold"
                  style={{
                    background: C.rose,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontFamily: FONT_BODY,
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
              style={{ color: C.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = C.ink; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = C.muted; }}
            >
              {t('common.returnHome')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
