import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, ArrowLeft, ArrowRight, Send, LinkIcon, CheckCircle, Check, Plus, Trash2,
  ChevronRight, Users, User, Sparkles, Shield, Clock,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocalizedPrice } from '@/hooks/useLocalizedPrice';

type DeliveryMethod = 'email' | 'link';
// Occasion is no longer chosen on the gift page — the recipient picks it when
// they redeem. Every gift is created as 'discover' and re-framed at redemption.
type GiftOccasion = 'discover' | 'new' | 'memorial' | 'birthday';

interface GiftRecipient {
  id: string;
  name: string;
  email: string;
  occasion?: GiftOccasion;
}

// Reveal-Ritual palette — full-bleed cosmic, white text, gold accent.
const T = {
  bg: '#07050c',
  ink: '#ffffff',
  sub: 'rgba(255,255,255,0.66)',
  faint: 'rgba(255,255,255,0.42)',
  line: 'rgba(255,255,255,0.14)',
  card: 'rgba(255,255,255,0.035)',
  cardActive: 'rgba(255,255,255,0.09)',
  gold: '#d4b67a',
  green: '#6fcf97',
};

const TIERS = {
  essential: {
    label: 'Soul Reading',
    tagline: "The reading they'll keep coming back to.",
    badge: null as string | null,
    features: [
      'A 30-section reading written for their pet',
      "Their pet's photo, woven into the reveal",
      'Theirs forever — on any device',
    ],
  },
  portrait: {
    label: 'Soul Bond',
    tagline: 'Them and their pet, read side by side.',
    badge: 'MOST GIFTED' as string | null,
    features: [
      'Everything in Soul Reading, plus:',
      "Their chart against their pet's — why the universe paired them",
      'The soul-reasons they found each other',
    ],
  },
} as const;

type TierKey = keyof typeof TIERS;

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.30;
  if (count >= 4) return 0.25;
  if (count >= 3) return 0.20;
  if (count >= 2) return 0.15;
  return 0;
};

export default function GiftPurchase() {
  const [searchParams] = useSearchParams();
  const { fmt, code: currencyCode, currency, isLocalized, prices } = useLocalizedPrice();
  const TIER_CENTS: Record<TierKey, { cents: number; wasCents: number }> = {
    essential: { cents: prices.basic, wasCents: prices.wasBasic },
    portrait:  { cents: prices.premium, wasCents: prices.wasPremium },
  };

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
  const [singleRecipient, setSingleRecipient] = useState<GiftRecipient>({ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' });
  const [recipients, setRecipients] = useState<GiftRecipient[]>([{ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' }]);

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
    setTimeout(() => {
      document.getElementById('gift-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    if (!selectedTier) return { baseTotal: 0, discountAmount: 0, promoAmount: 0, finalTotal: 0 };
    const tierCents = TIER_CENTS[selectedTier].cents;
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
          occasion: r.occasion ?? 'discover',
        })),
        deliveryMethod,
        multiRecipient: giftType === 'multiple',
        couponId: appliedCoupon?.id || null,
        currency,
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

  const fmtTier = selectedTier ? TIERS[selectedTier] : null;

  return (
    <main className="gf">
      <header className="gf-topbar">
        <Link to="/" className="gf-back"><ArrowLeft size={15} /> Home</Link>
        <span className="gf-mark">✦ Little Souls</span>
        <span style={{ width: 56 }} />
      </header>

      {/* ── SCENE 1 — hero ── */}
      <section className="gf-hero">
        <motion.h1
          className="gf-hero-title"
          initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          Some gifts are opened.<br /><span className="gf-em">This one is felt.</span>
        </motion.h1>
        <motion.button
          className="gf-hero-cta"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }}
          onClick={() => document.getElementById('gift-tiers')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          Begin the gift <ArrowRight size={17} />
        </motion.button>
      </section>

      {/* ── SCENE 2 — tier choice ── */}
      <section id="gift-tiers" className="gf-scene">
        <motion.h2 className="gf-h2" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-12%' }} transition={{ duration: 0.7 }}>
          How deep should it go?
        </motion.h2>
        <div className="gf-tiers">
          {(['essential', 'portrait'] as TierKey[]).map((key, i) => {
            const t = TIERS[key];
            const sel = selectedTier === key;
            return (
              <motion.button
                key={key}
                className={`gf-tier ${sel ? 'is-active' : ''}`}
                onClick={() => handleTierSelect(key)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                {t.badge && <span className="gf-tier-badge">{t.badge}</span>}
                <div className="gf-tier-top">
                  <p className="gf-tier-name">{t.label}</p>
                  <div className="gf-tier-price">
                    <span className="gf-was">{fmt(TIER_CENTS[key].wasCents)}</span>
                    <span className="gf-now">{fmt(TIER_CENTS[key].cents)}</span>
                  </div>
                </div>
                <p className="gf-tier-tag">{t.tagline}</p>
                <div className="gf-feats">
                  {t.features.map((f) => {
                    const div = f.endsWith(':');
                    return (
                      <p key={f} className={div ? 'gf-feat-div' : 'gf-feat'}>
                        {!div && <Check size={13} />}<span>{f}</span>
                      </p>
                    );
                  })}
                </div>
                <span className="gf-tier-pick">{sel ? '✓ Selected — continue below ↓' : 'Choose this'}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── FLOW — appears after a tier is chosen ── */}
      <div id="gift-flow">
        <AnimatePresence>
          {selectedTier && (
            <motion.section
              className="gf-scene gf-flow"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* selected reminder + steps */}
              <div className="gf-selected">
                <span>{fmtTier?.label}</span>
                <span className="gf-selected-dot">·</span>
                <span>{fmt(TIER_CENTS[selectedTier].cents)}</span>
                <button className="gf-change" onClick={() => { setSelectedTier(null); setStep(1); }}>change</button>
              </div>

              <div className="gf-steps">
                {[1, 2, 3].map((s) => (
                  <span key={s} className={`gf-step-dot ${step >= s ? 'is-on' : ''}`}>{step > s ? <Check size={13} /> : s}</span>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* STEP 1 — who */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="gf-stepwrap">
                    <p className="gf-step-q">Who's it for?</p>
                    <div className="gf-two">
                      {[
                        { key: 'single' as const, icon: User, title: 'One soul', sub: 'For one cherished pet parent' },
                        { key: 'multiple' as const, icon: Users, title: 'A few souls', sub: 'Several gifts at once' },
                      ].map(opt => (
                        <button key={opt.key} className={`gf-choice ${giftType === opt.key ? 'is-active' : ''}`} onClick={() => setGiftType(opt.key)}>
                          {opt.key === 'multiple' && <span className="gf-save">SAVE UP TO 30%</span>}
                          <opt.icon size={30} />
                          <p className="gf-choice-t">{opt.title}</p>
                          <p className="gf-choice-s">{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                    {giftType && (
                      <button className="gf-cta" onClick={() => setStep(2)}>Continue <ChevronRight size={18} /></button>
                    )}
                    <TrustRow />
                  </motion.div>
                )}

                {/* STEP 2 — delivery + recipients */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="gf-stepwrap">
                    <div className="gf-row-head">
                      <button className="gf-mini-back" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
                      <p className="gf-step-q gf-step-q--sm">{giftType === 'single' ? 'Their details' : 'Add recipients'}</p>
                      <span style={{ width: 48 }} />
                    </div>

                    <div className="gf-panel">
                      <p className="gf-panel-t">How should we deliver it?</p>
                      <div className="gf-two">
                        {[
                          { key: 'link' as const, icon: LinkIcon, title: 'Magic link', sub: 'Share via text, card, or in person', badge: 'Most flexible' },
                          { key: 'email' as const, icon: Send, title: 'Email directly', sub: 'We send a beautiful gift email', badge: null },
                        ].map(opt => (
                          <button key={opt.key} className={`gf-choice gf-choice--sm ${deliveryMethod === opt.key ? 'is-active' : ''}`} onClick={() => setDeliveryMethod(opt.key)}>
                            {opt.badge && <span className="gf-save gf-save--gold">{opt.badge}</span>}
                            <opt.icon size={20} />
                            <p className="gf-choice-t">{opt.title}</p>
                            <p className="gf-choice-s">{opt.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {giftType === 'single' && (
                      <div className="gf-panel">
                        <p className="gf-panel-t">Who's the lucky pet parent?</p>
                        <input className="gf-input" type="text" value={singleRecipient.name} onChange={e => updateSingleRecipient('name', e.target.value)} placeholder="Their name (optional)" />
                        {deliveryMethod === 'email' && (
                          <input className="gf-input" type="email" value={singleRecipient.email} onChange={e => updateSingleRecipient('email', e.target.value)} placeholder="Their email address" />
                        )}
                      </div>
                    )}

                    {giftType === 'multiple' && (
                      <div className="gf-recipients">
                        {recipients.map((r, idx) => (
                          <div key={r.id} className="gf-panel">
                            <div className="gf-recip-head">
                              <span className="gf-recip-num">{idx + 1}</span>
                              <span className="gf-recip-name">{r.name || `Recipient ${idx + 1}`}</span>
                              {recipients.length > 1 && (
                                <button className="gf-trash" onClick={() => setRecipients(rs => rs.filter(x => x.id !== r.id))}><Trash2 size={16} /></button>
                              )}
                            </div>
                            <div className={deliveryMethod === 'email' ? 'gf-two-thin' : ''}>
                              <input className="gf-input gf-input--sm" type="text" value={r.name} onChange={e => updateRecipient(r.id, 'name', e.target.value)} placeholder="Name" />
                              {deliveryMethod === 'email' && (
                                <input className="gf-input gf-input--sm" type="email" value={r.email} onChange={e => updateRecipient(r.id, 'email', e.target.value)} placeholder="Email" />
                              )}
                            </div>
                          </div>
                        ))}
                        {recipients.length < 10 && (
                          <button className="gf-add" onClick={() => setRecipients(rs => [...rs, { id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' }])}>
                            <Plus size={18} /> Add another person
                            {discount < 0.30 && <span className="gf-add-off">+{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% off</span>}
                          </button>
                        )}
                      </div>
                    )}

                    <button className="gf-cta" disabled={!canProceedStep2()} onClick={() => setStep(3)}>
                      Continue to checkout <ChevronRight size={18} />
                    </button>
                  </motion.div>
                )}

                {/* STEP 3 — checkout */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="gf-stepwrap">
                    <div className="gf-row-head">
                      <button className="gf-mini-back" onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
                      <p className="gf-step-q gf-step-q--sm">Almost done</p>
                      <span style={{ width: 48 }} />
                    </div>

                    <div>
                      <label className="gf-label">Write them a message</label>
                      <p className="gf-hint">They'll see this the moment they open their gift.</p>
                      <textarea className="gf-input gf-textarea" value={giftMessage} onChange={e => setGiftMessage(e.target.value)} rows={3} maxLength={500}
                        placeholder="From the moment I saw you with your pet, I knew you two were meant to be..." />
                    </div>

                    <div>
                      <label className="gf-label">Your email <span className="gf-label-sub">(for your receipt & gift link)</span></label>
                      <input className="gf-input" type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" />
                    </div>

                    <div className="gf-panel">
                      <div className="gf-sum-head"><Gift size={16} /> <span>Order summary</span></div>
                      {activeRecipients.map((r, idx) => (
                        <div key={r.id} className="gf-sum-row" style={{ borderBottom: idx < activeRecipients.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                          <div>
                            <p className="gf-sum-name">{TIERS[selectedTier].label}</p>
                            {r.name && <p className="gf-sum-for">for {r.name}</p>}
                          </div>
                          <span className="gf-sum-cents">{fmt(TIER_CENTS[selectedTier].cents)}</span>
                        </div>
                      ))}
                      <div className="gf-sum-foot">
                        {discount > 0 && (
                          <div className="gf-sum-line gf-green"><span><Sparkles size={12} /> {Math.round(discount * 100)}% volume discount</span><span>−{fmt(pricing.discountAmount)}</span></div>
                        )}
                        {pricing.promoAmount > 0 && appliedCoupon && (
                          <div className="gf-sum-line gf-green"><span><Sparkles size={12} /> {appliedCoupon.code} ({appliedCoupon.discount_value}% off)</span><span>−{fmt(pricing.promoAmount)}</span></div>
                        )}
                        <div className="gf-total"><span>Total</span><span className="gf-total-cents">{fmt(pricing.finalTotal)}</span></div>
                        {isLocalized && <p className="gf-fx">Shown in {currencyCode} — billed in USD at checkout.</p>}
                      </div>
                    </div>

                    {appliedCoupon ? (
                      <div className="gf-promo-on">
                        <span>{appliedCoupon.code} — {appliedCoupon.discount_value}% off applied!</span>
                        <button onClick={() => setAppliedCoupon(null)}>×</button>
                      </div>
                    ) : (
                      <div>
                        <div className="gf-promo">
                          <input className="gf-input" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="PROMO CODE" onKeyDown={e => e.key === 'Enter' && applyPromo()} style={{ flex: 1, textTransform: 'uppercase' }} />
                          <button className="gf-promo-apply" onClick={applyPromo} disabled={!promoCode.trim() || isValidatingPromo}>{isValidatingPromo ? '...' : 'Apply'}</button>
                        </div>
                        {promoError && <p className="gf-promo-err">{promoError}</p>}
                      </div>
                    )}

                    <div className="gf-guarantee">
                      <Shield size={18} />
                      <div>
                        <p className="gf-guar-t">100% happiness guarantee</p>
                        <p className="gf-guar-s">If they don't absolutely love it, full refund — no questions asked.</p>
                      </div>
                    </div>

                    <button className="gf-cta gf-cta--pay" onClick={handlePurchase} disabled={isLoading || !purchaserEmail.includes('@')}>
                      {isLoading ? <><SpinnerInline /> Processing...</> : <><Gift size={20} /> Send this gift — {fmt(pricing.finalTotal)}</>}
                    </button>
                    <TrustRow />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* ── How it works (only before a tier is chosen) ── */}
      {!selectedTier && (
        <section className="gf-scene gf-how">
          <p className="gf-how-eyebrow">How gifting works</p>
          <div className="gf-how-grid">
            {[
              { n: '1', t: 'Choose their reading', d: 'Pick the gift, finish checkout' },
              { n: '2', t: 'Share the link, your way', d: 'Email it, text it, slip it in a card' },
              { n: '3', t: 'They tell us about their pet', d: 'A name, a birthday, a photo' },
              { n: '4', t: 'A private cinematic reveal', d: 'Theirs forever, to revisit' },
            ].map((s) => (
              <div key={s.n} className="gf-how-step">
                <span className="gf-how-num">{s.n}</span>
                <p className="gf-how-t">{s.t}</p>
                <p className="gf-how-d">{s.d}</p>
              </div>
            ))}
          </div>
          <TrustRow />
        </section>
      )}

      <style>{`
        .gf { background: radial-gradient(130% 90% at 50% -10%, rgba(60,44,86,0.5), transparent 55%), ${T.bg}; color: ${T.ink}; min-height: 100vh; font-family: Lato, system-ui, sans-serif; }
        .gf-topbar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(7,5,12,0.7); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .gf-back { display: inline-flex; align-items: center; gap: 5px; color: ${T.faint}; text-decoration: none; font-size: 0.85rem; }
        .gf-mark { font-family: "Playfair Display", Georgia, serif; font-style: italic; color: ${T.gold}; font-size: 0.95rem; letter-spacing: 0.04em; }

        .gf-hero { min-height: 86vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 12vh 6vw; }
        .gf-hero-title { font-family: "Playfair Display", Georgia, serif; font-weight: 500; color: #fff; font-size: clamp(2.4rem, 8vw, 5rem); line-height: 1.05; }
        .gf-em { font-style: italic; }
        .gf-hero-cta { margin-top: 42px; display: inline-flex; align-items: center; gap: 10px; padding: 16px 36px; border: 1px solid rgba(255,255,255,0.5); border-radius: 50px; background: transparent; color: #fff; font: 600 1rem Lato, system-ui, sans-serif; cursor: pointer; transition: all 0.25s; }
        .gf-hero-cta:hover { background: #fff; color: ${T.bg}; }

        .gf-scene { padding: clamp(60px, 10vw, 120px) 20px; max-width: 620px; margin: 0 auto; }
        .gf-h2 { font-family: "Playfair Display", Georgia, serif; font-weight: 500; color: #fff; font-size: clamp(1.9rem, 5vw, 3rem); line-height: 1.1; text-align: center; margin-bottom: 40px; }

        .gf-tiers { display: grid; gap: 16px; }
        .gf-tier { position: relative; text-align: left; padding: 26px 24px; border-radius: 18px; cursor: pointer; border: 1px solid ${T.line}; background: ${T.card}; transition: all 0.25s; }
        .gf-tier:hover { background: rgba(255,255,255,0.06); }
        .gf-tier.is-active { border-color: rgba(255,255,255,0.8); background: ${T.cardActive}; }
        .gf-tier-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #fff; color: ${T.bg}; font: 800 0.56rem Lato, system-ui, sans-serif; letter-spacing: 0.1em; padding: 3px 13px; border-radius: 20px; white-space: nowrap; }
        .gf-tier-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
        .gf-tier-name { font-family: "Playfair Display", Georgia, serif; font-size: 1.5rem; color: #fff; }
        .gf-tier-price { text-align: right; flex-shrink: 0; }
        .gf-was { display: block; color: ${T.faint}; text-decoration: line-through; font-family: "Playfair Display", serif; font-size: 0.95rem; }
        .gf-now { font-family: "Playfair Display", serif; font-size: 2.1rem; color: #fff; }
        .gf-tier-tag { color: ${T.sub}; font-style: italic; font-size: 0.92rem; margin: 6px 0 16px; }
        .gf-feats { display: flex; flex-direction: column; gap: 8px; }
        .gf-feat { display: flex; align-items: flex-start; gap: 8px; color: ${T.sub}; font-size: 0.88rem; line-height: 1.45; }
        .gf-feat svg { color: ${T.green}; flex-shrink: 0; margin-top: 2px; }
        .gf-feat-div { color: ${T.gold}; font-style: italic; font-weight: 600; font-size: 0.86rem; }
        .gf-tier-pick { display: block; margin-top: 16px; padding-top: 14px; border-top: 1px solid ${T.line}; text-align: center; font-size: 0.82rem; font-weight: 600; color: ${T.faint}; }
        .gf-tier.is-active .gf-tier-pick { color: #fff; }

        .gf-flow { border-top: 1px solid ${T.line}; }
        .gf-selected { display: flex; align-items: center; justify-content: center; gap: 8px; font-family: "Playfair Display", serif; color: #fff; margin-bottom: 22px; }
        .gf-selected-dot { color: ${T.faint}; }
        .gf-change { margin-left: 6px; font-family: Lato, system-ui, sans-serif; font-size: 0.74rem; color: ${T.faint}; background: none; border: none; cursor: pointer; text-decoration: underline; }
        .gf-steps { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 34px; }
        .gf-step-dot { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 0.78rem; font-weight: 700; background: rgba(255,255,255,0.08); color: ${T.faint}; border: 1px solid ${T.line}; }
        .gf-step-dot.is-on { background: #fff; color: ${T.bg}; border-color: #fff; }
        .gf-stepwrap { display: flex; flex-direction: column; gap: 18px; }
        .gf-step-q { text-align: center; font-family: "Playfair Display", Georgia, serif; font-size: 1.6rem; color: #fff; }
        .gf-step-q--sm { font-size: 1.1rem; margin: 0; }
        .gf-row-head { display: flex; align-items: center; justify-content: space-between; }
        .gf-mini-back { background: none; border: none; color: ${T.faint}; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.85rem; }

        .gf-two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .gf-two-thin { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .gf-choice { position: relative; padding: 22px 16px; border-radius: 16px; border: 1px solid ${T.line}; background: ${T.card}; cursor: pointer; text-align: center; color: #fff; transition: all 0.2s; }
        .gf-choice svg { margin: 0 auto 10px; color: ${T.faint}; }
        .gf-choice.is-active { border-color: rgba(255,255,255,0.8); background: ${T.cardActive}; }
        .gf-choice.is-active svg { color: #fff; }
        .gf-choice--sm { text-align: left; padding: 16px; }
        .gf-choice--sm svg { margin: 0 0 8px; }
        .gf-choice-t { font-weight: 700; font-size: 0.92rem; color: #fff; }
        .gf-choice-s { font-size: 0.78rem; color: ${T.sub}; margin-top: 3px; line-height: 1.3; }
        .gf-save { position: absolute; top: 8px; right: 8px; font-size: 0.56rem; font-weight: 800; background: ${T.green}; color: ${T.bg}; padding: 2px 8px; border-radius: 20px; letter-spacing: 0.05em; }
        .gf-save--gold { background: ${T.gold}; top: -8px; right: auto; left: 12px; }

        .gf-panel { padding: 20px; border-radius: 16px; background: ${T.card}; border: 1px solid ${T.line}; display: flex; flex-direction: column; gap: 12px; }
        .gf-panel-t { font-weight: 600; color: #fff; font-size: 0.92rem; }
        .gf-recipients { display: flex; flex-direction: column; gap: 12px; }
        .gf-recip-head { display: flex; align-items: center; gap: 8px; }
        .gf-recip-num { width: 24px; height: 24px; border-radius: 50%; background: #fff; color: ${T.bg}; display: grid; place-items: center; font-size: 0.7rem; font-weight: 700; }
        .gf-recip-name { font-weight: 600; font-size: 0.88rem; color: #fff; flex: 1; }
        .gf-trash { background: none; border: none; cursor: pointer; color: ${T.faint}; }
        .gf-add { padding: 14px; border-radius: 14px; border: 1px dashed rgba(255,255,255,0.3); background: rgba(255,255,255,0.03); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; color: #fff; font-weight: 600; font-size: 0.88rem; }
        .gf-add-off { color: ${T.green}; font-size: 0.72rem; }

        .gf-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid ${T.line}; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.95rem; font-family: Lato, system-ui, sans-serif; outline: none; box-sizing: border-box; }
        .gf-input::placeholder { color: rgba(255,255,255,0.4); }
        .gf-input--sm { padding: 10px 14px; font-size: 0.88rem; }
        .gf-textarea { resize: none; }
        .gf-label { font-size: 0.85rem; font-weight: 600; color: #fff; display: block; margin-bottom: 4px; }
        .gf-label-sub { font-weight: 400; color: ${T.faint}; }
        .gf-hint { font-size: 0.78rem; color: ${T.faint}; margin-bottom: 8px; }

        .gf-cta { width: 100%; padding: 16px; border-radius: 50px; background: #fff; color: ${T.bg}; font-weight: 700; font-size: 0.98rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s; }
        .gf-cta:disabled { opacity: 0.4; cursor: default; }
        .gf-cta--pay { background: ${T.gold}; font-size: 1.04rem; padding: 18px; box-shadow: 0 14px 36px rgba(212,182,122,0.28); }

        .gf-sum-head { display: flex; align-items: center; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid ${T.line}; font-weight: 700; font-size: 0.88rem; color: #fff; }
        .gf-sum-head svg { color: ${T.gold}; }
        .gf-sum-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; }
        .gf-sum-name { font-weight: 600; font-size: 0.85rem; color: #fff; }
        .gf-sum-for { font-size: 0.72rem; color: ${T.gold}; }
        .gf-sum-cents { font-size: 0.88rem; color: ${T.sub}; }
        .gf-sum-foot { margin-top: 12px; padding-top: 12px; border-top: 1px solid ${T.line}; }
        .gf-sum-line { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem; }
        .gf-sum-line span:first-child { display: flex; align-items: center; gap: 4px; }
        .gf-green { color: ${T.green}; }
        .gf-total { display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 700; color: #fff; }
        .gf-total-cents { font-family: "Playfair Display", serif; }
        .gf-fx { font-size: 0.7rem; color: ${T.faint}; margin-top: 6px; text-align: right; }

        .gf-promo { display: flex; gap: 8px; }
        .gf-promo-apply { padding: 14px 20px; border-radius: 12px; background: #fff; color: ${T.bg}; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; white-space: nowrap; }
        .gf-promo-apply:disabled { opacity: 0.5; }
        .gf-promo-err { color: ${T.gold}; font-size: 0.75rem; margin-top: 4px; }
        .gf-promo-on { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px; background: rgba(111,207,151,0.1); border: 1px solid rgba(111,207,151,0.3); color: ${T.green}; font-size: 0.85rem; font-weight: 600; }
        .gf-promo-on button { background: none; border: none; color: ${T.green}; cursor: pointer; font-size: 1.1rem; }

        .gf-guarantee { display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-radius: 16px; background: rgba(111,207,151,0.06); border: 1px solid rgba(111,207,151,0.16); }
        .gf-guarantee svg { color: ${T.green}; flex-shrink: 0; }
        .gf-guar-t { font-weight: 700; font-size: 0.85rem; color: ${T.green}; }
        .gf-guar-s { font-size: 0.78rem; color: ${T.sub}; line-height: 1.4; margin-top: 2px; }

        .gf-how { border-top: 1px solid ${T.line}; text-align: center; }
        .gf-how-eyebrow { color: ${T.gold}; font: 600 0.72rem/1 Lato, system-ui, sans-serif; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 30px; }
        .gf-how-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; text-align: left; }
        .gf-how-step { padding: 18px; border-radius: 14px; background: ${T.card}; border: 1px solid ${T.line}; }
        .gf-how-num { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: rgba(212,182,122,0.15); color: ${T.gold}; font-weight: 700; font-size: 0.72rem; margin-bottom: 10px; }
        .gf-how-t { font-weight: 600; color: #fff; font-size: 0.92rem; }
        .gf-how-d { color: ${T.sub}; font-size: 0.8rem; margin-top: 3px; }

        @media (prefers-reduced-motion: reduce) {
          .gf-hero-title { filter: none !important; }
        }
        @keyframes gf-spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

function SpinnerInline() {
  return <span style={{ width: 18, height: 18, border: '2px solid rgba(7,5,12,0.3)', borderTopColor: '#07050c', borderRadius: '50%', animation: 'gf-spin 1s linear infinite', display: 'inline-block' }} />;
}

function TrustRow() {
  const items = [{ i: Shield, t: 'Secure checkout' }, { i: Clock, t: 'Instant delivery' }, { i: Gift, t: 'Valid 1 year' }];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', fontSize: '0.74rem', color: 'rgba(255,255,255,0.42)', marginTop: 8 }}>
      {items.map((b, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><b.i size={13} />{b.t}</span>
      ))}
    </div>
  );
}
