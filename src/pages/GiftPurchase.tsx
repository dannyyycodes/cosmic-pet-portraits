import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, ArrowLeft, Send, LinkIcon, CheckCircle, Plus, Trash2,
  ChevronRight, Users, User, Sparkles, Star, Quote, Shield, Clock,
  Cat, Dog, Fish, Rabbit, Bird, Turtle, PawPrint, Bone, Feather,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DeliveryMethod = 'email' | 'link';
type GiftTier = 'essential' | 'portrait';

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
    label: 'Soul Reading',
    tagline: 'The reading they\'ll read aloud to their pet — and probably cry doing it.',
    badge: null as string | null,
    badgeColor: C.rose,
    features: [
      'Full astrological breakdown — 30+ sections',
      'How their pet loves, learns, heals, what they hope for, what they fear — and what makes them feel most themselves',
      'Their pet\'s photo becomes part of the reveal',
      'SoulSpeak — they can ask their pet anything',
      'Plus bonus sections — little surprises written just for them',
      'Theirs forever — they can revisit anytime, from any device',
      '1 month of weekly horoscopes — included free',
    ],
  },
  portrait: {
    cents: 3500,
    label: 'Soul Bond',
    tagline: 'For the bond worth understanding — them and their pet, read side by side.',
    badge: 'MOST CHOSEN' as string | null,
    badgeColor: C.rose,
    popular: true,
    features: [
      'Everything in Soul Reading, plus:',
      'Their chart against their pet\'s — where they align, where they challenge each other, and why the universe paired them',
      'Where their energies meet, mirror, and balance',
      'The soul-reasons they found each other',
    ],
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

/* ── Wallpaper — scattered Lucide pet icons matching the landing page ── */
type PetItem = { x: number; y: number; size: number; rot: number; op: number; Icon: typeof Cat };
const WALLPAPER_PETS: PetItem[] = [
  { x: 4,  y: 6,  size: 30, rot: -12, op: 0.16, Icon: Cat },
  { x: 18, y: 4,  size: 22, rot: 10,  op: 0.13, Icon: PawPrint },
  { x: 32, y: 9,  size: 28, rot: 6,   op: 0.15, Icon: Rabbit },
  { x: 46, y: 3,  size: 26, rot: -8,  op: 0.14, Icon: Bird },
  { x: 60, y: 8,  size: 32, rot: 14,  op: 0.17, Icon: Dog },
  { x: 74, y: 4,  size: 24, rot: -14, op: 0.13, Icon: Feather },
  { x: 88, y: 9,  size: 28, rot: 8,   op: 0.15, Icon: Fish },
  { x: 10, y: 22, size: 34, rot: 6,   op: 0.17, Icon: Turtle },
  { x: 26, y: 28, size: 22, rot: -10, op: 0.13, Icon: Bone },
  { x: 42, y: 22, size: 30, rot: 16,  op: 0.16, Icon: Cat },
  { x: 58, y: 26, size: 26, rot: -6,  op: 0.14, Icon: Bird },
  { x: 74, y: 22, size: 28, rot: 12,  op: 0.15, Icon: PawPrint },
  { x: 92, y: 28, size: 24, rot: -16, op: 0.13, Icon: Rabbit },
  { x: 6,  y: 44, size: 26, rot: -10, op: 0.14, Icon: Dog },
  { x: 22, y: 48, size: 32, rot: 14,  op: 0.17, Icon: PawPrint },
  { x: 38, y: 42, size: 24, rot: -8,  op: 0.13, Icon: Fish },
  { x: 54, y: 48, size: 30, rot: 10,  op: 0.16, Icon: Cat },
  { x: 70, y: 44, size: 28, rot: -14, op: 0.15, Icon: Feather },
  { x: 86, y: 48, size: 26, rot: 6,   op: 0.14, Icon: Rabbit },
  { x: 4,  y: 64, size: 22, rot: 12,  op: 0.13, Icon: Bone },
  { x: 18, y: 68, size: 28, rot: -8,  op: 0.15, Icon: Bird },
  { x: 32, y: 64, size: 24, rot: 14,  op: 0.13, Icon: Turtle },
  { x: 48, y: 70, size: 30, rot: -12, op: 0.16, Icon: Dog },
  { x: 64, y: 64, size: 26, rot: 8,   op: 0.14, Icon: PawPrint },
  { x: 78, y: 68, size: 28, rot: -6,  op: 0.15, Icon: Cat },
  { x: 94, y: 64, size: 22, rot: 10,  op: 0.12, Icon: Fish },
  { x: 8,  y: 86, size: 28, rot: 10,  op: 0.15, Icon: Rabbit },
  { x: 24, y: 90, size: 22, rot: -12, op: 0.13, Icon: PawPrint },
  { x: 42, y: 86, size: 30, rot: 6,   op: 0.16, Icon: Bird },
  { x: 60, y: 92, size: 26, rot: -8,  op: 0.14, Icon: Dog },
  { x: 78, y: 88, size: 32, rot: 14,  op: 0.17, Icon: Cat },
  { x: 92, y: 92, size: 24, rot: -6,  op: 0.13, Icon: Bone },
];

function WallpaperBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 90% 80% at 50% 0%, ${C.cream2} 0%, ${C.cream} 60%)`,
      }}
    >
      {WALLPAPER_PETS.map((p, i) => (
        <p.Icon
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            color: C.muted,
            opacity: p.op,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function TierCard({
  tierKey, selected, onClick,
}: { tierKey: TierKey; selected: boolean; onClick: () => void }) {
  const tier = TIERS[tierKey];
  const accent = C.rose;
  const accentGlow = C.roseGlow;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: `0 8px 28px ${accentGlow}` }}
      transition={{ duration: 0.15 }}
      style={{
        width: '100%', textAlign: 'left', padding: '24px 22px', borderRadius: 20, cursor: 'pointer',
        border: `2px solid ${selected ? accent : C.cream3}`,
        background: selected ? 'rgba(255,253,245,0.96)' : 'rgba(255,253,245,0.92)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        boxShadow: selected ? `0 6px 24px ${accentGlow}` : '0 2px 12px rgba(0,0,0,0.04)',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
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

      {/* Header row — landing-page style: name + price baseline-aligned */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontWeight: 400, fontSize: '1.3rem', color: C.ink, marginBottom: 4, lineHeight: 1.15,
          }}>
            {tier.label}
          </p>
          <p style={{
            fontFamily: 'Cormorant, Georgia, serif', fontStyle: 'italic',
            fontSize: '0.86rem', color: C.earth, lineHeight: 1.4,
          }}>
            {tier.tagline}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {tier.features.map((f, idx) => {
          const isDivider = f.endsWith(':');
          return (
            <p key={idx} style={{
              fontSize: '0.85rem',
              color: isDivider ? C.gold : C.warm,
              fontStyle: isDivider ? 'italic' : 'normal',
              fontWeight: isDivider ? 600 : 400,
              display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4,
            }}>
              {!isDivider && (
                <CheckCircle style={{ width: 13, height: 13, color: C.green, flexShrink: 0, marginTop: 2 }} />
              )}
              <span style={{ flex: 1 }}>{f}</span>
            </p>
          );
        })}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.cream3}`, textAlign: 'center' }}>
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

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    if (!selectedTier) return { baseTotal: 0, discountAmount: 0, promoAmount: 0, finalTotal: 0 };
    const tierCents = TIERS[selectedTier].cents;
    const baseTotal = activeRecipients.reduce((sum) => sum + tierCents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const afterVolume = baseTotal - discountAmount;
    const promoAmount = appliedCoupon ? Math.round(afterVolume * (appliedCoupon.discount_value / 100)) : 0;
    return { baseTotal, discountAmount, promoAmount, finalTotal: afterVolume - promoAmount };
  }, [selectedTier, activeRecipients, discount, appliedCoupon]);

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
    if (deliveryMethod === 'link') return true;
    if (giftType === 'single') return singleRecipient.email.includes('@');
    return recipients.every(r => r.email.includes('@'));
  };

  const handlePurchase = async () => {
    if (!purchaserEmail.includes('@')) { toast.error('Please enter your email address'); return; }
    if (!selectedTier) return;
    setIsLoading(true);
    try {
      const body = {
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

  const stepCount = 3;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 80px', fontFamily: 'Cormorant, Georgia, serif', background: C.cream }}>
      <WallpaperBackdrop />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 540 }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.muted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: 28 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </Link>

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 16px', borderRadius: 50, background: C.roseGlow, border: `1px solid rgba(191,82,74,0.15)`, marginBottom: 18 }}>
            <Gift style={{ width: 13, height: 13, color: C.rose }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.rose, letterSpacing: '0.1em' }}>GIVE THE GIFT OF SOUL</span>
          </div>

          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, fontSize: 'clamp(1.9rem, 7.5vw, 2.8rem)', color: C.ink, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 16 }}>
            Give Someone the Gift<br />
            of Truly Seeing<br />
            <em style={{ color: C.rose }}>Their Little Soul.</em>
          </h1>

          <p style={{ fontFamily: 'Cormorant, Georgia, serif', fontStyle: 'italic', color: C.earth, fontSize: 'clamp(1.05rem, 3.6vw, 1.2rem)', lineHeight: 1.55, maxWidth: 420, margin: '0 auto 18px' }}>
            A cosmic portrait of the soul they love most. Their pet's personality, their love language, the quiet truths only the stars know — written for the one person who'd cry reading it.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <StarRow n={5} />
            <span style={{ fontSize: '0.82rem', color: C.muted, fontStyle: 'italic' }}>Already gifted by thousands of pet parents</span>
          </div>
        </motion.div>

        {/* ── TIER CARDS ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <p style={{ fontFamily: 'Cormorant, Georgia, serif', fontSize: '0.72rem', fontWeight: 700, color: C.gold, textAlign: 'center', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 22 }}>
            Choose Their Reading
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1rem', color: C.ink }}>{TIERS[selectedTier].label}</span>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1rem', color: C.rose }}>${TIERS[selectedTier].cents / 100}</span>
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
                          background: step >= s ? C.rose : C.cream3,
                          color: step >= s ? '#fff' : C.muted,
                          transition: 'all 0.3s',
                        }}>
                          {step > s ? <CheckCircle style={{ width: 14, height: 14 }} /> : s}
                        </div>
                        {s < stepCount && (
                          <div style={{ width: 28, height: 2, background: step > s ? C.rose : C.cream3, borderRadius: 2, transition: 'background 0.3s' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">

                  {/* ── STEP 1: Who? ── */}
                  {step === 1 && (
                    <motion.div key="ds1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      <p style={{ textAlign: 'center', fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, fontSize: '1.3rem', color: C.ink }}>Who's it for?</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                          { key: 'single' as const, icon: User, title: 'One Soul', sub: 'For one cherished pet parent' },
                          { key: 'multiple' as const, icon: Users, title: 'A Few Souls', sub: 'For several gifts at once' },
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

                  {/* ── STEP 2: Delivery + recipient details ── */}
                  {step === 2 && (
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

                  {/* ── STEP 3: Checkout ── */}
                  {step === 3 && (
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
                              <PawPrint style={{ width: 14, height: 14, color: C.gold, flexShrink: 0 }} />
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
                  { n: '1', t: 'Choose their reading', d: 'Pick the gift, finish checkout' },
                  { n: '2', t: 'Share the link, your way', d: 'Email it, text it, slip it in a card' },
                  { n: '3', t: 'They tell us about their pet', d: 'A name, a birthday, a photo' },
                  { n: '4', t: 'A private cinematic reveal awaits them', d: 'Yours forever, theirs to revisit' },
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
