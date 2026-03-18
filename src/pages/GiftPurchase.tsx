import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowLeft, Send, LinkIcon, CheckCircle, Plus, Trash2, ChevronRight, Users, User, Sparkles, Heart, Star, Quote, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DeliveryMethod = 'email' | 'link';
type GiftTier = 'essential' | 'portrait';

interface GiftRecipient {
  id: string;
  name: string;
  email: string;
  tier: GiftTier;
}

const TIERS = {
  essential: {
    cents: 2700,
    label: 'The Soul Reading',
    tagline: 'A gift that speaks to the heart',
    icon: '✨',
    features: [
      "Deep personality reading & emotional blueprint",
      "Birth chart, zodiac profile & aura colours",
      "A soul message that makes people cry (happy tears)",
      "Past life glimpse & cosmic name meaning",
      "5 free SoulSpeak chat messages",
    ],
  },
  portrait: {
    cents: 3500,
    label: 'The Soul Bond Edition',
    tagline: 'Discover why you were meant to find each other',
    icon: '💫',
    popular: true,
    features: [
      "Everything in The Soul Reading",
      "Pet-Parent compatibility analysis",
      "Deep cosmic bond & emotional connection map",
      "Shareable social cosmic card",
    ],
  },
} as const;

const TESTIMONIALS = [
  { quote: "My sister literally cried reading her cat's report. Best gift I've ever given anyone.", author: "Sarah M." },
  { quote: "Got this for my mom's birthday — she reads it to her dog every single night now.", author: "David K." },
  { quote: "Gifted to 4 friends last Christmas. They still talk about it!", author: "Jessica L." },
  { quote: "My dad was so skeptical but ended up LOVING his cat's reading. He got emotional.", author: "Michael R." },
];

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.30;
  if (count >= 4) return 0.25;
  if (count >= 3) return 0.20;
  if (count >= 2) return 0.15;
  return 0;
};

const C = {
  cream: '#FFFDF5', cream2: '#faf4e8', cream3: '#f3eadb',
  ink: '#1f1c18', deep: '#2e2a24', warm: '#4d443b', earth: '#6e6259', muted: '#958779',
  rose: '#bf524a', roseSoft: '#c9665f', roseGlow: 'rgba(191,82,74,0.10)',
  gold: '#c4a265', goldSoft: 'rgba(196,162,101,0.15)',
  green: '#4a8c5c',
};

function RotatingTestimonial() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => (n + 1) % TESTIMONIALS.length), 5000); return () => clearInterval(t); }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ padding: '16px 20px', background: 'white', borderRadius: 16, border: `1px solid ${C.cream3}` }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
          <Quote style={{ width: 16, height: 16, color: C.gold, flexShrink: 0, marginTop: 2, opacity: 0.5 }} />
          <div>
            <p style={{ fontSize: '0.88rem', color: C.warm, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 }}>"{TESTIMONIALS[i].quote}"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex' }}>{[...Array(5)].map((_, j) => <Star key={j} style={{ width: 11, height: 11, fill: C.gold, color: C.gold }} />)}</div>
              <span style={{ fontSize: '0.72rem', color: C.muted }}>— {TESTIMONIALS[i].author}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function GiftPurchase() {
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
  const [singleRecipient, setSingleRecipient] = useState<GiftRecipient>({ id: crypto.randomUUID(), name: '', email: '', tier: 'portrait' });
  const [recipients, setRecipients] = useState<GiftRecipient[]>([{ id: crypto.randomUUID(), name: '', email: '', tier: 'portrait' }]);

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    const baseTotal = activeRecipients.reduce((sum, r) => sum + TIERS[r.tier].cents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const afterVolume = baseTotal - discountAmount;
    const promoAmount = appliedCoupon ? Math.round(afterVolume * (appliedCoupon.discount_value / 100)) : 0;
    return { baseTotal, discountAmount, promoAmount, finalTotal: afterVolume - promoAmount };
  }, [activeRecipients, discount, appliedCoupon]);

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

  const updateRecipient = (id: string, field: keyof GiftRecipient, value: string) => {
    if (giftType === 'single') setSingleRecipient({ ...singleRecipient, [field]: value });
    else setRecipients(recipients.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const canProceedToStep3 = () => {
    if (deliveryMethod === 'link') return true;
    if (giftType === 'single') return singleRecipient.email.includes('@');
    return recipients.every(r => r.email.includes('@'));
  };

  const handlePurchase = async () => {
    if (!purchaserEmail.includes('@')) { toast.error('Please enter your email address'); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', {
        body: {
          purchaserEmail,
          recipientEmail: giftType === 'single' && deliveryMethod === 'email' ? singleRecipient.email : '',
          recipientName: giftType === 'single' ? (singleRecipient.name || '') : '',
          giftMessage: giftMessage || '',
          giftPets: activeRecipients.map(r => ({ id: r.id, tier: r.tier, recipientName: r.name || '', recipientEmail: deliveryMethod === 'email' ? r.email : null, horoscopeAddon: 'none' })),
          deliveryMethod,
          multiRecipient: giftType === 'multiple',
          couponId: appliedCoupon?.id || null,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error('Gift purchase error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: 14, border: `1px solid ${C.cream3}`, background: C.cream2, fontSize: '0.95rem', color: C.ink, fontFamily: 'Cormorant, Georgia, serif', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 60px', fontFamily: 'Cormorant, Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.muted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: 24 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </Link>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: `linear-gradient(135deg, ${C.roseGlow}, ${C.goldSoft})`, border: `2px solid ${C.cream3}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Gift style={{ width: 32, height: 32, color: C.rose }} />
          </div>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 'clamp(1.6rem, 7vw, 2.2rem)', color: C.ink, lineHeight: 1.1, marginBottom: 8 }}>
            The Gift That<br /><em style={{ color: C.rose }}>Speaks to the Soul</em>
          </h1>
          <p style={{ color: C.earth, fontSize: '1rem', lineHeight: 1.5, maxWidth: 380, margin: '0 auto' }}>
            Give someone the most personal, heartfelt gift they've ever received — a cosmic reading of their beloved pet.
          </p>
        </motion.div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, background: step >= s ? C.rose : C.cream3, color: step >= s ? '#fff' : C.muted, transition: 'all 0.3s' }}>
                {step > s ? <CheckCircle style={{ width: 14, height: 14 }} /> : s}
              </div>
              {s < 3 && <div style={{ width: 28, height: 2, background: step > s ? C.rose : C.cream3, borderRadius: 2, transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1 ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <p style={{ textAlign: 'center', fontWeight: 600, fontSize: '1.1rem', color: C.ink }}>Who are you gifting?</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { key: 'single' as const, icon: User, title: 'One Lucky Person', sub: 'For their pet(s)' },
                  { key: 'multiple' as const, icon: Users, title: 'Multiple People', sub: 'Birthdays, holidays!' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setGiftType(opt.key)} style={{
                    padding: 24, borderRadius: 18, border: `2px solid ${giftType === opt.key ? C.rose : C.cream3}`,
                    background: giftType === opt.key ? C.roseGlow : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', position: 'relative',
                  }}>
                    {opt.key === 'multiple' && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', fontWeight: 700, background: C.green, color: '#fff', padding: '2px 8px', borderRadius: 20 }}>SAVE UP TO 30%</span>}
                    <opt.icon style={{ width: 36, height: 36, margin: '0 auto 10px', color: giftType === opt.key ? C.rose : C.muted }} />
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>{opt.title}</p>
                    <p style={{ fontSize: '0.82rem', color: C.muted, marginTop: 4 }}>{opt.sub}</p>
                  </button>
                ))}
              </div>

              {giftType && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <button onClick={() => setStep(2)} style={{
                    width: '100%', padding: '16px 0', borderRadius: 50, background: C.rose, color: '#fff',
                    fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    Continue <ChevronRight style={{ width: 18, height: 18 }} />
                  </button>
                </motion.div>
              )}

              {/* Trust */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.75rem', color: C.muted }}>
                {[{ i: Shield, t: 'Secure' }, { i: Clock, t: 'Instant delivery' }, { i: Gift, t: 'Valid 1 year' }].map((b, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><b.i style={{ width: 13, height: 13 }} />{b.t}</span>
                ))}
              </div>

              <RotatingTestimonial />

              {/* How it works */}
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ textAlign: 'center', fontSize: '0.85rem', color: C.rose, fontWeight: 500 }}>How does gifting work?</summary>
                <div style={{ marginTop: 14, padding: 16, background: 'white', borderRadius: 16, border: `1px solid ${C.cream3}` }}>
                  {[
                    { n: '1', t: 'You choose & pay', d: 'Pick a package, checkout' },
                    { n: '2', t: 'Share the magic link', d: 'Email, text, or in a card' },
                    { n: '3', t: 'They enter pet details', d: 'Name, birthday & a photo' },
                    { n: '4', t: 'Their reading appears', d: 'Personalised and instant' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.roseGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: C.rose, flexShrink: 0 }}>{s.n}</div>
                      <div><span style={{ fontWeight: 600, color: C.ink, fontSize: '0.88rem' }}>{s.t}</span><span style={{ color: C.muted, fontSize: '0.78rem', marginLeft: 8 }}>{s.d}</span></div>
                    </div>
                  ))}
                </div>
              </details>
            </motion.div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 14, height: 14 }} /> Back</button>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>{giftType === 'single' ? 'Choose Their Gift' : 'Add Recipients'}</p>
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
                      padding: 16, borderRadius: 14, border: `2px solid ${deliveryMethod === opt.key ? opt.color : C.cream3}`,
                      background: deliveryMethod === opt.key ? (opt.key === 'link' ? C.goldSoft : C.roseGlow) : 'transparent',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', position: 'relative',
                    }}>
                      {opt.badge && <span style={{ position: 'absolute', top: -8, left: 12, fontSize: '0.58rem', fontWeight: 700, background: C.gold, color: '#fff', padding: '2px 8px', borderRadius: 20 }}>{opt.badge}</span>}
                      <opt.icon style={{ width: 20, height: 20, color: deliveryMethod === opt.key ? opt.color : C.muted, marginBottom: 8 }} />
                      <p style={{ fontWeight: 700, fontSize: '0.88rem', color: C.ink }}>{opt.title}</p>
                      <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Single recipient */}
              {giftType === 'single' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Recipient name/email */}
                  <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                    <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>Who's the lucky pet parent?</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input type="text" value={singleRecipient.name} onChange={e => updateRecipient(singleRecipient.id, 'name', e.target.value)} placeholder="Their name (optional)" style={inputStyle} />
                      {deliveryMethod === 'email' && (
                        <input type="email" value={singleRecipient.email} onChange={e => updateRecipient(singleRecipient.id, 'email', e.target.value)} placeholder="Their email address" style={inputStyle} />
                      )}
                    </div>
                  </div>

                  {/* Tier selection */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(Object.entries(TIERS) as [GiftTier, typeof TIERS.portrait][]).map(([key, tier]) => {
                      const selected = singleRecipient.tier === key;
                      return (
                        <button key={key} onClick={() => updateRecipient(singleRecipient.id, 'tier', key)} style={{
                          padding: 24, borderRadius: 18, border: `2px solid ${selected ? C.rose : C.cream3}`,
                          background: selected ? 'white' : C.cream2, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', position: 'relative',
                          boxShadow: selected ? `0 4px 20px ${C.roseGlow}` : 'none',
                        }}>
                          {'popular' in tier && tier.popular && (
                            <span style={{ position: 'absolute', top: -10, right: 16, background: C.rose, color: '#fff', fontSize: '0.62rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.05em' }}>MOST GIFTED</span>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: '1.6rem' }}>{tier.icon}</span>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: C.ink }}>{tier.label}</p>
                                <p style={{ fontSize: '0.82rem', color: C.muted }}>{tier.tagline}</p>
                              </div>
                            </div>
                            <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1.5rem', color: selected ? C.rose : C.ink }}>${tier.cents / 100}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {tier.features.map((f, i) => (
                              <p key={i} style={{ fontSize: '0.82rem', color: C.warm, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle style={{ width: 13, height: 13, color: C.green, flexShrink: 0 }} />{f}
                              </p>
                            ))}
                          </div>
                        </button>
                      );
                    })}
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
                        {recipients.length > 1 && <button onClick={() => setRecipients(recipients.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><Trash2 style={{ width: 16, height: 16 }} /></button>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: deliveryMethod === 'email' ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 10 }}>
                        <input type="text" value={r.name} onChange={e => updateRecipient(r.id, 'name', e.target.value)} placeholder="Name" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />
                        {deliveryMethod === 'email' && <input type="email" value={r.email} onChange={e => updateRecipient(r.id, 'email', e.target.value)} placeholder="Email" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {(Object.entries(TIERS) as [GiftTier, typeof TIERS.portrait][]).map(([key, tier]) => (
                          <button key={key} onClick={() => updateRecipient(r.id, 'tier', key)} style={{
                            padding: '10px 8px', borderRadius: 12, border: `2px solid ${r.tier === key ? C.rose : C.cream3}`,
                            background: r.tier === key ? C.roseGlow : 'transparent', cursor: 'pointer', textAlign: 'center',
                          }}>
                            <span style={{ fontSize: '1.1rem' }}>{tier.icon}</span>
                            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: r.tier === key ? C.rose : C.ink }}>{tier.label}</p>
                            <p style={{ fontSize: '0.78rem', color: C.muted }}>${tier.cents / 100}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {recipients.length < 10 && (
                    <button onClick={() => setRecipients([...recipients, { id: crypto.randomUUID(), name: '', email: '', tier: 'portrait' }])} style={{
                      padding: 14, borderRadius: 14, border: `2px dashed ${C.rose}40`, background: C.roseGlow, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.rose, fontWeight: 600, fontSize: '0.88rem', fontFamily: 'Cormorant, Georgia, serif',
                    }}>
                      <Plus style={{ width: 18, height: 18 }} /> Add another person
                      {discount < 0.30 && recipients.length >= 1 && <span style={{ fontSize: '0.72rem', color: C.green, marginLeft: 4 }}>+{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% off</span>}
                    </button>
                  )}
                </div>
              )}

              <button onClick={() => setStep(3)} disabled={!canProceedToStep3()} style={{
                width: '100%', padding: '16px 0', borderRadius: 50, background: canProceedToStep3() ? C.rose : C.cream3,
                color: canProceedToStep3() ? '#fff' : C.muted, fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem',
                border: 'none', cursor: canProceedToStep3() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                Continue to Checkout <ChevronRight style={{ width: 18, height: 18 }} />
              </button>
            </motion.div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}><ArrowLeft style={{ width: 14, height: 14 }} /> Back</button>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>Complete Your Gift</p>
                <div style={{ width: 48 }} />
              </div>

              {/* Order summary */}
              <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: `1px solid ${C.cream3}`, marginBottom: 12 }}>
                  <Gift style={{ width: 18, height: 18, color: C.rose }} />
                  <p style={{ fontWeight: 700, color: C.ink, fontSize: '0.92rem' }}>Gift Summary</p>
                </div>
                {activeRecipients.map((r, idx) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < activeRecipients.length - 1 ? `1px solid ${C.cream3}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.roseGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: C.rose }}>{idx + 1}</span>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.88rem', color: C.ink }}>{TIERS[r.tier].label}</p>
                        {r.name && <p style={{ fontSize: '0.75rem', color: C.rose }}>for {r.name}</p>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.88rem', color: C.muted }}>${(TIERS[r.tier].cents / 100).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cream3}` }}>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                      <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles style={{ width: 12, height: 12 }} />{Math.round(discount * 100)}% volume discount</span>
                      <span style={{ color: C.green }}>-${(pricing.discountAmount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {pricing.promoAmount > 0 && appliedCoupon && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                      <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles style={{ width: 12, height: 12 }} />{appliedCoupon.code} ({appliedCoupon.discount_value}% off)</span>
                      <span style={{ color: C.green }}>-${(pricing.promoAmount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
                    <span style={{ color: C.ink }}>Total</span>
                    <span style={{ color: C.rose, fontFamily: '"DM Serif Display", Georgia, serif' }}>${(pricing.finalTotal / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Promo code */}
              <div>
                {appliedCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(74,140,92,0.1)', border: '1px solid rgba(74,140,92,0.3)' }}>
                    <span style={{ fontSize: '0.85rem', color: C.green, fontWeight: 600 }}>{appliedCoupon.code} — {appliedCoupon.discount_value}% off applied!</span>
                    <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: C.green, cursor: 'pointer', fontSize: '1rem' }}>&times;</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="PROMO CODE" onKeyDown={e => e.key === 'Enter' && applyPromo()} style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' as const }} />
                      <button onClick={applyPromo} disabled={!promoCode.trim() || isValidatingPromo} style={{ padding: '14px 20px', borderRadius: 14, background: C.rose, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', opacity: (!promoCode.trim() || isValidatingPromo) ? 0.5 : 1 }}>
                        {isValidatingPromo ? '...' : 'Apply'}
                      </button>
                    </div>
                    {promoError && <p style={{ color: C.rose, fontSize: '0.75rem', marginTop: 4 }}>{promoError}</p>}
                  </div>
                )}
              </div>

              {/* Your email */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>Your email (for receipt)</label>
                <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
              </div>

              {/* Personal message */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>Add a personal message <span style={{ fontWeight: 400, color: C.muted }}>(they'll see this when they open their gift)</span></label>
                <textarea value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder="Write something from the heart..." rows={3} maxLength={500}
                  style={{ ...inputStyle, resize: 'none' as const }} />
              </div>

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

              {/* Purchase button */}
              <button onClick={handlePurchase} disabled={isLoading || !purchaserEmail.includes('@')} style={{
                width: '100%', padding: '18px 0', borderRadius: 50,
                background: (isLoading || !purchaserEmail.includes('@')) ? C.cream3 : C.rose,
                color: (isLoading || !purchaserEmail.includes('@')) ? C.muted : '#fff',
                fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1.05rem', border: 'none',
                cursor: (isLoading || !purchaserEmail.includes('@')) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 4px 16px ${C.roseGlow}`,
              }}>
                {isLoading ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Processing...</>
                ) : (
                  <><Gift style={{ width: 20, height: 20 }} /> Send This Gift — ${(pricing.finalTotal / 100).toFixed(2)}</>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: '0.72rem', color: C.muted }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Shield style={{ width: 12, height: 12 }} />Secure</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 12, height: 12 }} />Instant</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Gift style={{ width: 12, height: 12 }} />Valid 1 year</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
