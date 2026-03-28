import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, ArrowLeft, Send, LinkIcon, CheckCircle, Plus, Trash2,
  ChevronRight, Users, User, Sparkles, Star, Quote, Shield, Clock, Package, BookOpen,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DeliveryMethod = 'email' | 'link';
type GiftTier = 'essential' | 'portrait' | 'hardcover';

interface GiftRecipient {
  id: string;
  name: string;
  email: string;
}

const C = {
  cream: '#FFFDF5', cream2: '#faf4e8', cream3: '#f3eadb',
  ink: '#1f1c18', deep: '#2e2a24', warm: '#4d443b', earth: '#6e6259', muted: '#958779',
  rose: '#bf524a', roseGlow: 'rgba(191,82,74,0.10)',
  gold: '#c4a265', goldSoft: 'rgba(196,162,101,0.15)',
  green: '#4a8c5c',
};

const TIERS = {
  essential: {
    cents: 2700,
    label: 'The Soul Reading',
    tagline: 'Magical. Personal. Under $30.',
    icon: '✨',
    badge: null as string | null,
    badgeColor: C.rose,
    features: [
      'Deep personality reading & emotional blueprint',
      'Birth chart, zodiac profile & aura colours',
      'A soul message that makes people cry (happy tears)',
      'Past life glimpse & cosmic name meaning',
      '5 free SoulSpeak chat messages',
    ],
    isPhysical: false,
    waitNote: null as string | null,
  },
  portrait: {
    cents: 3500,
    label: 'The Soul Bond Edition',
    tagline: 'The one that makes them cry — in the best way',
    icon: '💫',
    badge: 'MOST GIFTED' as string | null,
    badgeColor: C.rose,
    popular: true,
    features: [
      'Everything in The Soul Reading',
      'Pet–Parent cosmic compatibility reading',
      'Deep bond & emotional connection map',
      'Shareable social cosmic card',
    ],
    isPhysical: false,
    waitNote: null as string | null,
  },
  hardcover: {
    cents: 9900,
    label: 'The Hardcover Book',
    tagline: 'A keepsake they\'ll display with pride — forever',
    icon: '📖',
    badge: 'PREMIUM' as string | null,
    badgeColor: C.gold,
    features: [
      'Everything in The Soul Bond Edition',
      'Premium printed hardcover book',
      'Gift-ready packaging & ribbon',
      'Ships worldwide',
    ],
    isPhysical: true,
    waitNote: 'Due to high demand, please allow 4–6 weeks for delivery',
  },
} as const;

type TierKey = keyof typeof TIERS;

const TESTIMONIALS = [
  { quote: "My sister literally cried reading her cat's report. Best gift I've ever given anyone.", author: 'Sarah M.' },
  { quote: "Got this for my mom's birthday — she reads it to her dog every single night now.", author: 'David K.' },
  { quote: "Gifted to 4 friends last Christmas. They still talk about it!", author: 'Jessica L.' },
  { quote: "My dad was so skeptical but ended up LOVING his cat's reading. He got emotional.", author: 'Michael R.' },
];

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.30;
  if (count >= 4) return 0.25;
  if (count >= 3) return 0.20;
  if (count >= 2) return 0.15;
  return 0;
};

function StarRow({ n = 5 }: { n?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[...Array(n)].map((_, i) => <Star key={i} style={{ width: 13, height: 13, fill: C.gold, color: C.gold }} />)}
    </div>
  );
}

function RotatingTestimonial() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[i];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: `1px solid ${C.cream3}` }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
          <Quote style={{ width: 16, height: 16, color: C.gold, flexShrink: 0, marginTop: 2, opacity: 0.5 }} />
          <div>
            <p style={{ fontSize: '0.9rem', color: C.warm, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 }}>"{t.quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StarRow />
              <span style={{ fontSize: '0.72rem', color: C.muted }}>— {t.author}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TierCard({
  tierKey, selected, onClick,
}: { tierKey: TierKey; selected: boolean; onClick: () => void }) {
  const tier = TIERS[tierKey];
  const isHC = tierKey === 'hardcover';
  const accent = isHC ? C.gold : C.rose;
  const accentGlow = isHC ? C.goldSoft : C.roseGlow;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: `0 8px 28px ${accentGlow}` }}
      transition={{ duration: 0.15 }}
      style={{
        width: '100%', textAlign: 'left', padding: '24px 22px', borderRadius: 20, cursor: 'pointer',
        border: `2px solid ${selected ? accent : C.cream3}`,
        background: selected ? (isHC ? 'rgba(196,162,101,0.07)' : 'rgba(191,82,74,0.05)') : 'white',
        boxShadow: selected ? `0 6px 24px ${accentGlow}` : '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'border-color 0.2s, background 0.2s',
        position: 'relative',
      }}
    >
      {/* Badge */}
      {tier.badge && (
        <span style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          background: tier.badgeColor, color: '#fff',
          fontSize: '0.58rem', fontWeight: 800, padding: '3px 14px', borderRadius: 20, letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
        }}>
          {tier.badge}
        </span>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: 6, lineHeight: 1 }}>{tier.icon}</span>
          <p style={{ fontWeight: 700, fontSize: '1.05rem', color: C.ink, marginBottom: 2 }}>{tier.label}</p>
          <p style={{ fontSize: '0.8rem', color: C.muted, lineHeight: 1.35 }}>{tier.tagline}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
          <p style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '2rem', lineHeight: 1,
            color: selected ? accent : C.ink,
            transition: 'color 0.2s',
          }}>
            ${tier.cents / 100}
          </p>
          <p style={{ fontSize: '0.65rem', color: C.muted, marginTop: 2 }}>one-time</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tier.features.map((f, idx) => (
          <p key={idx} style={{ fontSize: '0.82rem', color: C.warm, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.3 }}>
            <CheckCircle style={{ width: 13, height: 13, color: isHC ? C.gold : C.green, flexShrink: 0, marginTop: 1 }} />
            {f}
          </p>
        ))}
      </div>

      {/* Wait note for hardcover */}
      {tier.waitNote && (
        <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 10, background: 'rgba(196,162,101,0.1)', border: '1px solid rgba(196,162,101,0.2)' }}>
          <p style={{ fontSize: '0.74rem', color: C.gold, fontWeight: 600 }}>⏳ {tier.waitNote}</p>
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${isHC ? 'rgba(196,162,101,0.2)' : C.cream3}`, textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: accent }}>✓ Selected — continue below ↓</p>
        </div>
      )}
    </motion.button>
  );
}

export default function GiftPurchase() {
  const [searchParams] = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('link');
  const [giftType, setGiftType] = useState<'single' | 'multiple' | null>(null);
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_value: number } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [singleRecipient, setSingleRecipient] = useState<GiftRecipient>({ id: crypto.randomUUID(), name: '', email: '' });
  const [recipients, setRecipients] = useState<GiftRecipient[]>([{ id: crypto.randomUUID(), name: '', email: '' }]);
  const [hardcoverRecipientName, setHardcoverRecipientName] = useState('');

  // Auto-apply promo from URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !appliedCoupon) {
      setPromoCode(urlCode.toUpperCase());
      (async () => {
        try {
          const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', urlCode.toUpperCase()).eq('is_active', true).single();
          if (data && (!data.expires_at || new Date(data.expires_at) >= new Date()) && (!data.max_uses || data.current_uses < data.max_uses)) {
            setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
            setPromoCode('');
          }
        } catch { /* ignore */ }
      })();
    }
  }, [searchParams]);

  const handleTierSelect = (tier: TierKey) => {
    setSelectedTier(tier);
    setStep(1);
    setGiftType(null);
    // Small delay then scroll to flow section
    setTimeout(() => {
      document.getElementById('gift-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const isHardcover = selectedTier === 'hardcover';

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = isHardcover ? 1 : activeRecipients.length;
  const discount = isHardcover ? 0 : getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    if (!selectedTier) return { baseTotal: 0, discountAmount: 0, promoAmount: 0, finalTotal: 0 };
    const tierCents = TIERS[selectedTier].cents;
    const baseTotal = isHardcover ? tierCents : activeRecipients.reduce((sum) => sum + tierCents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const afterVolume = baseTotal - discountAmount;
    const promoAmount = (appliedCoupon && !isHardcover) ? Math.round(afterVolume * (appliedCoupon.discount_value / 100)) : 0;
    return { baseTotal, discountAmount, promoAmount, finalTotal: afterVolume - promoAmount };
  }, [selectedTier, activeRecipients, discount, appliedCoupon, isHardcover]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', promoCode.trim().toUpperCase()).eq('is_active', true).single();
      if (!data) { setPromoError('Invalid promo code'); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError('This code has expired'); return; }
      if (data.max_uses && data.current_uses >= data.max_uses) { setPromoError('This code has reached its limit'); return; }
      setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
      setPromoCode('');
    } catch { setPromoError('Something went wrong'); }
    finally { setIsValidatingPromo(false); }
  };

  const updateSingleRecipient = (field: keyof GiftRecipient, value: string) => {
    setSingleRecipient(r => ({ ...r, [field]: value }));
  };
  const updateRecipient = (id: string, field: keyof GiftRecipient, value: string) => {
    setRecipients(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const canProceedStep2 = () => {
    if (isHardcover) return purchaserEmail.includes('@');
    if (deliveryMethod === 'link') return true;
    if (giftType === 'single') return singleRecipient.email.includes('@');
    return recipients.every(r => r.email.includes('@'));
  };

  const handlePurchase = async () => {
    if (!purchaserEmail.includes('@')) { toast.error('Please enter your email address'); return; }
    if (!selectedTier) return;
    setIsLoading(true);
    try {
      const body = isHardcover ? {
        purchaserEmail,
        recipientName: hardcoverRecipientName || '',
        giftMessage: giftMessage || '',
        giftPets: [{ id: crypto.randomUUID(), tier: 'hardcover', recipientName: hardcoverRecipientName || '', horoscopeAddon: 'none' }],
        deliveryMethod: 'link',
        multiRecipient: false,
        couponId: null,
      } : {
        purchaserEmail,
        recipientEmail: giftType === 'single' && deliveryMethod === 'email' ? singleRecipient.email : '',
        recipientName: giftType === 'single' ? (singleRecipient.name || '') : '',
        giftMessage: giftMessage || '',
        giftPets: activeRecipients.map(r => ({
          id: r.id, tier: selectedTier,
          recipientName: r.name || '',
          recipientEmail: deliveryMethod === 'email' ? r.email : null,
          horoscopeAddon: 'none',
        })),
        deliveryMethod,
        multiRecipient: giftType === 'multiple',
        couponId: appliedCoupon?.id || null,
      };

      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', { body });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Gift purchase error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: `1px solid ${C.cream3}`, background: C.cream2,
    fontSize: '0.95rem', color: C.ink, fontFamily: 'Cormorant, Georgia, serif', outline: 'none',
    boxSizing: 'border-box',
  };

  const stepCount = isHardcover ? 2 : 3;

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 80px', fontFamily: 'Cormorant, Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.muted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: 28 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </Link>

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 16px', borderRadius: 50, background: C.roseGlow, border: `1px solid rgba(191,82,74,0.15)`, marginBottom: 16 }}>
            <Gift style={{ width: 13, height: 13, color: C.rose }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.rose, letterSpacing: '0.08em' }}>GIFT A COSMIC READING</span>
          </div>

          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 'clamp(1.9rem, 7vw, 2.5rem)', color: C.ink, lineHeight: 1.1, marginBottom: 12 }}>
            The Gift Every Pet Lover<br />
            <em style={{ color: C.rose }}>Secretly Wants</em>
          </h1>

          <p style={{ color: C.earth, fontSize: '1.02rem', lineHeight: 1.65, maxWidth: 400, margin: '0 auto 18px' }}>
            A personalised cosmic portrait of their beloved companion — so accurate it gives them chills. Choose your gift below.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <StarRow n={5} />
            <span style={{ fontSize: '0.82rem', color: C.muted }}>Loved by thousands of pet parents</span>
          </div>
        </motion.div>

        {/* ── 3 TIER CARDS ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: C.muted, textAlign: 'center', letterSpacing: '0.1em', marginBottom: 18 }}>
            CHOOSE YOUR GIFT
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(Object.keys(TIERS) as TierKey[]).map(key => (
              <TierCard key={key} tierKey={key} selected={selectedTier === key} onClick={() => handleTierSelect(key)} />
            ))}
          </div>
        </motion.div>

        {/* ── FLOW (appears after tier selection) ── */}
        <div id="gift-flow">
          <AnimatePresence>
            {selectedTier && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{ marginTop: 36, paddingTop: 32, borderTop: `2px solid ${C.cream3}` }}
              >
                {/* Selected tier reminder */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                  <span style={{ fontSize: '1.2rem' }}>{TIERS[selectedTier].icon}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: C.ink }}>{TIERS[selectedTier].label}</span>
                  <span style={{ fontSize: '0.9rem', color: isHardcover ? C.gold : C.rose, fontWeight: 700 }}>${TIERS[selectedTier].cents / 100}</span>
                  <button
                    onClick={() => { setSelectedTier(null); setStep(1); }}
                    style={{ marginLeft: 4, fontSize: '0.72rem', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    change
                  </button>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                  {[...Array(stepCount)].map((_, idx) => {
                    const s = idx + 1;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 700,
                          background: step >= s ? (isHardcover ? C.gold : C.rose) : C.cream3,
                          color: step >= s ? '#fff' : C.muted,
                          transition: 'all 0.3s',
                        }}>
                          {step > s ? <CheckCircle style={{ width: 14, height: 14 }} /> : s}
                        </div>
                        {s < stepCount && (
                          <div style={{ width: 28, height: 2, background: step > s ? (isHardcover ? C.gold : C.rose) : C.cream3, borderRadius: 2, transition: 'background 0.3s' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">

                  {/* ── DIGITAL STEP 1: Who? ── */}
                  {!isHardcover && step === 1 && (
                    <motion.div key="ds1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      <p style={{ textAlign: 'center', fontWeight: 600, fontSize: '1.1rem', color: C.ink }}>Who are you gifting?</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                          { key: 'single' as const, icon: User, title: 'One Lucky Person', sub: 'For their pet(s)' },
                          { key: 'multiple' as const, icon: Users, title: 'Multiple People', sub: 'Birthdays, holidays!' },
                        ].map(opt => (
                          <button key={opt.key} onClick={() => setGiftType(opt.key)} style={{
                            padding: '22px 16px', borderRadius: 18,
                            border: `2px solid ${giftType === opt.key ? C.rose : C.cream3}`,
                            background: giftType === opt.key ? C.roseGlow : 'white',
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', position: 'relative',
                          }}>
                            {opt.key === 'multiple' && (
                              <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', fontWeight: 700, background: C.green, color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                                SAVE UP TO 30%
                              </span>
                            )}
                            <opt.icon style={{ width: 34, height: 34, margin: '0 auto 10px', color: giftType === opt.key ? C.rose : C.muted }} />
                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: C.ink }}>{opt.title}</p>
                            <p style={{ fontSize: '0.8rem', color: C.muted, marginTop: 4 }}>{opt.sub}</p>
                          </button>
                        ))}
                      </div>

                      {giftType && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => setStep(2)}
                          style={{
                            width: '100%', padding: '16px 0', borderRadius: 50, background: C.rose, color: '#fff',
                            fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: `0 4px 16px ${C.roseGlow}`,
                          }}
                        >
                          Continue <ChevronRight style={{ width: 18, height: 18 }} />
                        </motion.button>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.75rem', color: C.muted }}>
                        {[{ i: Shield, t: 'Secure checkout' }, { i: Clock, t: 'Instant delivery' }, { i: Gift, t: 'Valid 1 year' }].map((b, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <b.i style={{ width: 13, height: 13 }} />{b.t}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── DIGITAL STEP 2: Delivery + recipient details ── */}
                  {!isHardcover && step === 2 && (
                    <motion.div key="ds2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                        </button>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>
                          {giftType === 'single' ? 'Their Details' : 'Add Recipients'}
                        </p>
                        <div style={{ width: 48 }} />
                      </div>

                      {/* Delivery method */}
                      <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>How should we deliver it?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {[
                            { key: 'link' as const, icon: LinkIcon, title: 'Magic link', sub: 'Share via text, card, or in person', badge: 'Most flexible', color: C.gold },
                            { key: 'email' as const, icon: Send, title: 'Email directly', sub: 'We send a beautiful gift email', badge: null, color: C.rose },
                          ].map(opt => (
                            <button key={opt.key} onClick={() => setDeliveryMethod(opt.key)} style={{
                              padding: 16, borderRadius: 14,
                              border: `2px solid ${deliveryMethod === opt.key ? opt.color : C.cream3}`,
                              background: deliveryMethod === opt.key ? (opt.key === 'link' ? C.goldSoft : C.roseGlow) : 'transparent',
                              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', position: 'relative',
                            }}>
                              {opt.badge && (
                                <span style={{ position: 'absolute', top: -8, left: 12, fontSize: '0.58rem', fontWeight: 700, background: C.gold, color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                                  {opt.badge}
                                </span>
                              )}
                              <opt.icon style={{ width: 20, height: 20, color: deliveryMethod === opt.key ? opt.color : C.muted, marginBottom: 8 }} />
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: C.ink }}>{opt.title}</p>
                              <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{opt.sub}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Single recipient */}
                      {giftType === 'single' && (
                        <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                          <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>Who's the lucky pet parent?</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input type="text" value={singleRecipient.name} onChange={e => updateSingleRecipient('name', e.target.value)} placeholder="Their name (optional)" style={inputStyle} />
                            {deliveryMethod === 'email' && (
                              <input type="email" value={singleRecipient.email} onChange={e => updateSingleRecipient('email', e.target.value)} placeholder="Their email address" style={inputStyle} />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Multiple recipients */}
                      {giftType === 'multiple' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {recipients.map((r, idx) => (
                            <div key={r.id} style={{ padding: 16, background: 'white', borderRadius: 16, border: `1px solid ${C.cream3}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.rose, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{idx + 1}</span>
                                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: C.ink }}>{r.name || `Recipient ${idx + 1}`}</span>
                                </div>
                                {recipients.length > 1 && (
                                  <button onClick={() => setRecipients(rs => rs.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
                                    <Trash2 style={{ width: 16, height: 16 }} />
                                  </button>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: deliveryMethod === 'email' ? '1fr 1fr' : '1fr', gap: 8 }}>
                                <input type="text" value={r.name} onChange={e => updateRecipient(r.id, 'name', e.target.value)} placeholder="Name" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />
                                {deliveryMethod === 'email' && (
                                  <input type="email" value={r.email} onChange={e => updateRecipient(r.id, 'email', e.target.value)} placeholder="Email" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />
                                )}
                              </div>
                            </div>
                          ))}
                          {recipients.length < 10 && (
                            <button
                              onClick={() => setRecipients(rs => [...rs, { id: crypto.randomUUID(), name: '', email: '' }])}
                              style={{
                                padding: 14, borderRadius: 14, border: `2px dashed ${C.rose}40`, background: C.roseGlow, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.rose, fontWeight: 600, fontSize: '0.88rem', fontFamily: 'Cormorant, Georgia, serif',
                              }}
                            >
                              <Plus style={{ width: 18, height: 18 }} /> Add another person
                              {discount < 0.30 && (
                                <span style={{ fontSize: '0.72rem', color: C.green, marginLeft: 4 }}>
                                  +{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% off
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      <button onClick={() => setStep(3)} disabled={!canProceedStep2()} style={{
                        width: '100%', padding: '16px 0', borderRadius: 50,
                        background: canProceedStep2() ? C.rose : C.cream3,
                        color: canProceedStep2() ? '#fff' : C.muted,
                        fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem',
                        border: 'none', cursor: canProceedStep2() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: canProceedStep2() ? `0 4px 16px ${C.roseGlow}` : 'none',
                      }}>
                        Continue to Checkout <ChevronRight style={{ width: 18, height: 18 }} />
                      </button>
                    </motion.div>
                  )}

                  {/* ── DIGITAL STEP 3: Checkout ── */}
                  {!isHardcover && step === 3 && (
                    <motion.div key="ds3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                        </button>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>Almost Done</p>
                        <div style={{ width: 48 }} />
                      </div>

                      {/* Gift message first — emotional anchor */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>
                          Write them a message
                        </label>
                        <p style={{ fontSize: '0.78rem', color: C.muted, marginBottom: 8 }}>They'll see this the moment they open their gift.</p>
                        <textarea
                          value={giftMessage}
                          onChange={e => setGiftMessage(e.target.value)}
                          placeholder={`From the moment I saw you with your pet, I knew you two were meant to be...`}
                          rows={3}
                          maxLength={500}
                          style={{ ...inputStyle, resize: 'none' as const }}
                        />
                      </div>

                      {/* Purchaser email */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>
                          Your email
                          <span style={{ fontWeight: 400, color: C.muted }}> (for your receipt & gift link)</span>
                        </label>
                        <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
                      </div>

                      {/* Order summary */}
                      <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: `1px solid ${C.cream3}`, marginBottom: 12 }}>
                          <Gift style={{ width: 16, height: 16, color: C.rose }} />
                          <p style={{ fontWeight: 700, color: C.ink, fontSize: '0.88rem' }}>Order Summary</p>
                        </div>
                        {activeRecipients.map((r, idx) => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: idx < activeRecipients.length - 1 ? `1px solid ${C.cream3}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '1rem' }}>{TIERS[selectedTier!].icon}</span>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: C.ink }}>{TIERS[selectedTier!].label}</p>
                                {r.name && <p style={{ fontSize: '0.72rem', color: C.rose }}>for {r.name}</p>}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.88rem', color: C.muted }}>${(TIERS[selectedTier!].cents / 100).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cream3}` }}>
                          {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                              <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Sparkles style={{ width: 12, height: 12 }} />{Math.round(discount * 100)}% volume discount
                              </span>
                              <span style={{ color: C.green }}>−${(pricing.discountAmount / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {pricing.promoAmount > 0 && appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                              <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Sparkles style={{ width: 12, height: 12 }} />{appliedCoupon.code} ({appliedCoupon.discount_value}% off)
                              </span>
                              <span style={{ color: C.green }}>−${(pricing.promoAmount / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                            <span style={{ color: C.ink }}>Total</span>
                            <span style={{ color: C.rose, fontFamily: '"DM Serif Display", Georgia, serif' }}>
                              ${(pricing.finalTotal / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Promo code */}
                      {appliedCoupon ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(74,140,92,0.1)', border: '1px solid rgba(74,140,92,0.3)' }}>
                          <span style={{ fontSize: '0.85rem', color: C.green, fontWeight: 600 }}>{appliedCoupon.code} — {appliedCoupon.discount_value}% off applied!</span>
                          <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: C.green, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>&times;</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={promoCode}
                              onChange={e => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="PROMO CODE"
                              onKeyDown={e => e.key === 'Enter' && applyPromo()}
                              style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' as const }}
                            />
                            <button
                              onClick={applyPromo}
                              disabled={!promoCode.trim() || isValidatingPromo}
                              style={{ padding: '14px 20px', borderRadius: 14, background: C.rose, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', opacity: (!promoCode.trim() || isValidatingPromo) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                            >
                              {isValidatingPromo ? '...' : 'Apply'}
                            </button>
                          </div>
                          {promoError && <p style={{ color: C.rose, fontSize: '0.75rem', marginTop: 4 }}>{promoError}</p>}
                        </div>
                      )}

                      {/* Guarantee */}
                      <div style={{ padding: 16, borderRadius: 16, background: 'rgba(74,140,92,0.06)', border: '1px solid rgba(74,140,92,0.15)', display: 'flex', alignItems: 'start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,140,92,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Shield style={{ width: 18, height: 18, color: C.green }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: C.green, marginBottom: 2 }}>100% happiness guarantee</p>
                          <p style={{ fontSize: '0.78rem', color: C.warm, lineHeight: 1.4 }}>If they don't absolutely love it, full refund — no questions asked.</p>
                        </div>
                      </div>

                      {/* Pay button */}
                      <button
                        onClick={handlePurchase}
                        disabled={isLoading || !purchaserEmail.includes('@')}
                        style={{
                          width: '100%', padding: '18px 0', borderRadius: 50,
                          background: (isLoading || !purchaserEmail.includes('@')) ? C.cream3 : C.rose,
                          color: (isLoading || !purchaserEmail.includes('@')) ? C.muted : '#fff',
                          fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1.1rem', border: 'none',
                          cursor: (isLoading || !purchaserEmail.includes('@')) ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: `0 6px 20px ${C.roseGlow}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {isLoading
                          ? <><SpinnerInline />Processing...</>
                          : <><Gift style={{ width: 20, height: 20 }} />Send This Gift — ${(pricing.finalTotal / 100).toFixed(2)}</>
                        }
                      </button>

                      <TrustRow items={['Secure checkout', 'Instant delivery', 'Valid 1 year']} icons={[Shield, Clock, Gift]} />
                    </motion.div>
                  )}

                  {/* ── HARDCOVER STEP 1: Gift details ── */}
                  {isHardcover && step === 1 && (
                    <motion.div key="hs1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <p style={{ textAlign: 'center', fontWeight: 600, fontSize: '1.1rem', color: C.ink }}>Gift Details</p>

                      {/* Wait time banner */}
                      <div style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(196,162,101,0.08)', border: '1px solid rgba(196,162,101,0.2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <Package style={{ width: 20, height: 20, color: C.gold, flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: C.gold, marginBottom: 3 }}>Premium physical gift</p>
                          <p style={{ fontSize: '0.8rem', color: C.warm, lineHeight: 1.5 }}>
                            Every book is hand-fulfilled with care. After payment we'll email you to confirm the shipping address. <strong>Please allow 4–6 weeks for delivery.</strong>
                          </p>
                        </div>
                      </div>

                      <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>Who is this gift for?</p>
                        <input
                          type="text"
                          value={hardcoverRecipientName}
                          onChange={e => setHardcoverRecipientName(e.target.value)}
                          placeholder="Recipient's name (optional)"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>
                          Your email <span style={{ fontWeight: 400, color: C.muted }}>(for order confirmation)</span>
                        </label>
                        <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>
                          Add a personal message
                        </label>
                        <p style={{ fontSize: '0.78rem', color: C.muted, marginBottom: 8 }}>We'll include it inside the book.</p>
                        <textarea
                          value={giftMessage}
                          onChange={e => setGiftMessage(e.target.value)}
                          placeholder="Write something from the heart..."
                          rows={3}
                          maxLength={500}
                          style={{ ...inputStyle, resize: 'none' as const }}
                        />
                      </div>

                      <button
                        onClick={() => setStep(2)}
                        disabled={!purchaserEmail.includes('@')}
                        style={{
                          width: '100%', padding: '16px 0', borderRadius: 50,
                          background: purchaserEmail.includes('@') ? C.gold : C.cream3,
                          color: purchaserEmail.includes('@') ? '#fff' : C.muted,
                          fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem',
                          border: 'none', cursor: purchaserEmail.includes('@') ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: purchaserEmail.includes('@') ? '0 4px 16px rgba(196,162,101,0.25)' : 'none',
                        }}
                      >
                        Review Order <ChevronRight style={{ width: 18, height: 18 }} />
                      </button>
                    </motion.div>
                  )}

                  {/* ── HARDCOVER STEP 2: Review + Pay ── */}
                  {isHardcover && step === 2 && (
                    <motion.div key="hs2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                        </button>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>Order Summary</p>
                        <div style={{ width: 48 }} />
                      </div>

                      <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: `1px solid ${C.cream3}` }}>
                          <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>📖</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, color: C.ink, fontSize: '1rem' }}>The Hardcover Book</p>
                            {hardcoverRecipientName && <p style={{ fontSize: '0.82rem', color: C.gold, marginTop: 1 }}>for {hardcoverRecipientName}</p>}
                            <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 3 }}>Premium keepsake · Ships in 4–6 weeks</p>
                          </div>
                          <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1.6rem', color: C.gold }}>${TIERS.hardcover.cents / 100}</p>
                        </div>
                        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                          <span style={{ color: C.ink }}>Total</span>
                          <span style={{ color: C.gold, fontFamily: '"DM Serif Display", Georgia, serif' }}>$99.00</span>
                        </div>
                      </div>

                      <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(196,162,101,0.07)', border: '1px solid rgba(196,162,101,0.18)', fontSize: '0.8rem', color: C.warm, lineHeight: 1.6 }}>
                        🚚 After payment, we'll email <strong>{purchaserEmail}</strong> to collect the delivery address before we print and ship.
                      </div>

                      {/* Guarantee */}
                      <div style={{ padding: 16, borderRadius: 16, background: 'rgba(74,140,92,0.06)', border: '1px solid rgba(74,140,92,0.15)', display: 'flex', alignItems: 'start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,140,92,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Shield style={{ width: 18, height: 18, color: C.green }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: C.green, marginBottom: 2 }}>100% happiness guarantee</p>
                          <p style={{ fontSize: '0.78rem', color: C.warm, lineHeight: 1.4 }}>If they don't absolutely love it, we'll make it right — no questions asked.</p>
                        </div>
                      </div>

                      <button
                        onClick={handlePurchase}
                        disabled={isLoading}
                        style={{
                          width: '100%', padding: '18px 0', borderRadius: 50,
                          background: isLoading ? C.cream3 : C.gold,
                          color: isLoading ? C.muted : '#fff',
                          fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1.1rem', border: 'none',
                          cursor: isLoading ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: isLoading ? 'none' : '0 6px 20px rgba(196,162,101,0.3)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isLoading
                          ? <><SpinnerInline />Processing...</>
                          : <><BookOpen style={{ width: 20, height: 20 }} />Order Their Hardcover — $99</>
                        }
                      </button>

                      <TrustRow items={['Secure checkout', 'Hand-fulfilled', '4–6 week delivery']} icons={[Shield, Package, Clock]} />
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER (always visible when no tier selected) ── */}
        {!selectedTier && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>

            <details style={{ cursor: 'pointer' }}>
              <summary style={{ textAlign: 'center', fontSize: '0.85rem', color: C.rose, fontWeight: 500, userSelect: 'none' }}>
                How does gifting work?
              </summary>
              <div style={{ marginTop: 14, padding: 18, background: 'white', borderRadius: 16, border: `1px solid ${C.cream3}` }}>
                {[
                  { n: '1', t: 'Choose your gift above', d: 'Pick a package, complete checkout' },
                  { n: '2', t: 'Share the magic', d: 'Email, text, or slip it in a card' },
                  { n: '3', t: 'They fill in pet details', d: 'Name, birthday & a photo' },
                  { n: '4', t: 'Their reading appears', d: 'Personalised, instant, magical' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 3 ? `1px solid ${C.cream3}` : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.roseGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: C.rose, flexShrink: 0 }}>{s.n}</div>
                    <div>
                      <span style={{ fontWeight: 600, color: C.ink, fontSize: '0.88rem' }}>{s.t}</span>
                      <span style={{ color: C.muted, fontSize: '0.78rem', marginLeft: 8 }}>{s.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            <RotatingTestimonial />

            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.75rem', color: C.muted }}>
              {[{ i: Shield, t: 'Secure checkout' }, { i: Clock, t: 'Instant (digital)' }, { i: Gift, t: 'Valid 1 year' }].map((b, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <b.i style={{ width: 13, height: 13 }} />{b.t}
                </span>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SpinnerInline() {
  return (
    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
  );
}

function TrustRow({ items, icons }: { items: string[]; icons: React.ElementType[] }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.72rem', color: '#958779' }}>
      {items.map((t, i) => {
        const Icon = icons[i];
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon style={{ width: 12, height: 12 }} />{t}
          </span>
        );
      })}
    </div>
  );
}
