import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Heart, ArrowRight, Star, Wand2, Image, CalendarHeart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const C = {
  cream: '#FFFDF5', cream2: '#faf4e8', cream3: '#f3eadb',
  ink: '#1f1c18', warm: '#4d443b', earth: '#6e6259', muted: '#958779',
  rose: '#bf524a', roseGlow: 'rgba(191,82,74,0.10)',
  gold: '#c4a265', goldSoft: 'rgba(196,162,101,0.15)',
  green: '#4a8c5c',
};

export default function RedeemGift() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = searchParams.get('code') || '';

  const [giftCode, setGiftCode] = useState(codeFromUrl);
  const [isValidating, setIsValidating] = useState(false);
  const [giftData, setGiftData] = useState<{
    recipientName: string | null;
    giftMessage: string | null;
    amountCents: number;
    giftTier?: string;
    petCount?: number;
    includesPortrait?: boolean;
    includesWeeklyHoroscope?: boolean;
  } | null>(null);

  useEffect(() => { if (codeFromUrl) validateCode(codeFromUrl); }, [codeFromUrl]);

  const validateCode = async (code: string) => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-gift-code', { body: { code: code.toUpperCase() } });
      if (error || data?.error || !data?.valid) { toast.error('This code doesn\'t seem to be valid. Please check and try again.'); setGiftData(null); return; }
      setGiftData({
        recipientName: data.recipientName, giftMessage: data.giftMessage, amountCents: data.amountCents,
        giftTier: data.giftTier, petCount: data.petCount || 1,
        includesPortrait: data.includesPortrait, includesWeeklyHoroscope: data.includesWeeklyHoroscope,
      });
    } catch { toast.error('Something went wrong. Please try again.'); } finally { setIsValidating(false); }
  };

  const handleContinue = () => navigate(`/redeem-intake?gift=${giftCode.toUpperCase()}&pets=${giftData?.petCount || 1}`);

  const getTierName = () => {
    if (giftData?.giftTier === 'portrait') return 'The Portrait Edition';
    if (giftData?.giftTier === 'essential') return 'The Soul Reading';
    return 'Cosmic Pet Reading';
  };

  const features = [
    { icon: Star, text: 'Deep Personality & Emotional Blueprint' },
    { icon: Wand2, text: 'Soul Message, Life Purpose & Past Life Glimpse' },
    { icon: Heart, text: 'Love Language & Cosmic Compatibility' },
    ...(giftData?.includesPortrait ? [{ icon: Image, text: 'Stunning Cosmic Portrait' }] : []),
    ...(giftData?.includesWeeklyHoroscope ? [{ icon: CalendarHeart, text: 'Weekly Cosmic Updates' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: 'Cormorant, Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

        {/* Gift icon with slow rotating ring */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15, stiffness: 180 }}
          style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, #9a7b3a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(196,162,101,0.25)' }}>
            <Gift style={{ width: 40, height: 40, color: '#fff' }} />
          </div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `2px dashed ${C.gold}30` }} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
            style={{ position: 'absolute', top: -4, right: -6 }}>
            <Sparkles style={{ width: 22, height: 22, color: C.gold }} />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!giftData ? (
            /* ── Enter Code ── */
            <motion.div key="enter" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', color: C.ink, lineHeight: 1.1, marginBottom: 8 }}>
                  Someone sent you<br />something <em style={{ color: C.rose }}>special</em>
                </h1>
                <p style={{ color: C.earth, fontSize: '1rem', lineHeight: 1.5 }}>Enter your gift code to unwrap it</p>
              </div>

              <div>
                <input type="text" value={giftCode} onChange={e => setGiftCode(e.target.value.toUpperCase())} placeholder="GIFT-XXXX-XXXX"
                  style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: `2px solid ${C.cream3}`, background: C.cream2, fontSize: '1.2rem', fontFamily: 'monospace', color: C.ink, textAlign: 'center', letterSpacing: '0.15em', outline: 'none' }} />
              </div>

              <button onClick={() => validateCode(giftCode)} disabled={!giftCode || isValidating}
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 50, border: 'none',
                  background: (!giftCode || isValidating) ? C.cream3 : C.rose,
                  color: (!giftCode || isValidating) ? C.muted : '#fff',
                  cursor: (!giftCode || isValidating) ? 'default' : 'pointer',
                  fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {isValidating ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Validating...</>
                ) : (
                  <><Sparkles style={{ width: 18, height: 18 }} /> Unwrap My Gift</>
                )}
              </button>

              <p style={{ fontSize: '0.78rem', color: C.muted }}>Your gift code was sent to you by the person who bought this</p>
            </motion.div>

          ) : (
            /* ── Gift Revealed ── */
            <motion.div key="revealed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Sparkle badge */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', background: C.goldSoft, border: `1px solid ${C.gold}30`, borderRadius: 50, fontSize: '0.82rem', fontWeight: 600, color: C.gold }}>
                  <Sparkles style={{ width: 14, height: 14 }} /> A Gift Just For You
                </span>
              </motion.div>

              {/* Greeting */}
              <div>
                <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', color: C.ink, lineHeight: 1.1, marginBottom: 8 }}>
                  {giftData.recipientName
                    ? <>Hello, <em style={{ color: C.rose }}>{giftData.recipientName}</em></>
                    : <>You've received<br />something <em style={{ color: C.rose }}>beautiful</em></>}
                </h1>
                <p style={{ color: C.earth, fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Someone who loves you has gifted you a cosmic reading for your pet
                </p>
              </div>

              {/* Personal message */}
              {giftData.giftMessage && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ padding: 24, background: 'white', borderRadius: 20, border: `1px solid ${C.cream3}`, position: 'relative' }}>
                  {/* Decorative quotes */}
                  <div style={{ position: 'absolute', top: 10, left: 16, fontSize: '2.5rem', fontFamily: 'Georgia, serif', color: C.gold, opacity: 0.2, lineHeight: 1 }}>"</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                    <Heart style={{ width: 14, height: 14, color: C.rose, fill: C.rose }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.muted }}>A Message From the Heart</span>
                    <Heart style={{ width: 14, height: 14, color: C.rose, fill: C.rose }} />
                  </div>
                  <p style={{ fontSize: '1.1rem', color: C.ink, fontStyle: 'italic', lineHeight: 1.6, fontWeight: 500 }}>
                    "{giftData.giftMessage}"
                  </p>
                </motion.div>
              )}

              {/* What you've been gifted */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ padding: 24, background: `linear-gradient(135deg, ${C.goldSoft}, ${C.roseGlow})`, borderRadius: 20, border: `1px solid ${C.gold}20` }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: `1px solid ${C.cream3}` }}>
                  <Gift style={{ width: 24, height: 24, color: C.gold }} />
                </div>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: C.gold, marginBottom: 4 }}>You've Been Gifted</p>
                <h2 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1.5rem', color: C.ink, marginBottom: 6 }}>{getTierName()}</h2>
                <p style={{ fontSize: '0.85rem', color: C.warm }}>
                  {giftData.giftTier === 'portrait'
                    ? 'A cosmic portrait and complete soul reading for your pet'
                    : 'A deep cosmic soul reading for your beloved pet'}
                  {(giftData.petCount || 1) > 1 ? ` (for ${giftData.petCount} pets!)` : ''}
                </p>
              </motion.div>

              {/* Features */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}`, textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: C.ink, marginBottom: 14, textAlign: 'center' }}>Your Gift Includes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.goldSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${C.gold}20` }}>
                        <f.icon style={{ width: 16, height: 16, color: C.gold }} />
                      </div>
                      <span style={{ fontSize: '0.88rem', color: C.warm, fontWeight: 500 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: '0.85rem', color: C.earth }}>
                  Just tell us a little about your pet and we'll create their personalised reading
                </p>
                <button onClick={handleContinue} style={{
                  width: '100%', padding: '18px 0', borderRadius: 50, border: 'none',
                  background: C.rose, color: '#fff', cursor: 'pointer',
                  fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1.05rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `0 4px 20px ${C.roseGlow}`,
                }}>
                  Unwrap My Gift <ArrowRight style={{ width: 18, height: 18 }} />
                </button>
                <p style={{ fontSize: '0.72rem', color: C.muted }}>Takes about 2 minutes — your reading appears instantly</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
