import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, CheckCircle, Copy, ArrowRight, LinkIcon, Share2, Sparkles, Heart, Mail } from 'lucide-react';
import { toast } from 'sonner';

const C = {
  cream: '#FFFDF5', cream2: '#faf4e8', cream3: '#f3eadb',
  ink: '#1f1c18', warm: '#4d443b', earth: '#6e6259', muted: '#958779',
  rose: '#bf524a', roseGlow: 'rgba(191,82,74,0.10)',
  gold: '#c4a265', goldSoft: 'rgba(196,162,101,0.15)',
  green: '#4a8c5c',
};

export default function GiftSuccess() {
  const [searchParams] = useSearchParams();
  const giftCode = searchParams.get('code') || '';
  const deliveryMethod = searchParams.get('delivery') || 'email';
  const recipientCount = parseInt(searchParams.get('count') || '1', 10);

  const redeemUrl = `${window.location.origin}/redeem?code=${giftCode}`;
  const isMulti = recipientCount > 1;
  const isLink = deliveryMethod === 'link';

  const copyCode = () => { navigator.clipboard.writeText(giftCode); toast.success('Gift code copied!'); };
  const copyLink = () => { navigator.clipboard.writeText(redeemUrl); toast.success('Link copied!'); };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'A special gift for you', text: 'Someone who loves you gifted you a cosmic pet reading!', url: redeemUrl }); } catch { copyLink(); }
    } else copyLink();
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: 'Cormorant, Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

        {/* Celebration */}
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.15, stiffness: 200 }} style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: `linear-gradient(135deg, ${C.green}, #3a7a4a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(74,140,92,0.25)' }}>
            <CheckCircle style={{ width: 44, height: 44, color: '#fff' }} />
          </div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} style={{ position: 'absolute', top: -6, right: -8 }}>
            <Sparkles style={{ width: 24, height: 24, color: C.gold }} />
          </motion.div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.65 }} style={{ position: 'absolute', bottom: 0, left: -10 }}>
            <Heart style={{ width: 20, height: 20, color: C.rose, fill: C.rose, opacity: 0.7 }} />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 'clamp(1.6rem, 8vw, 2.4rem)', color: C.ink, lineHeight: 1.1, marginBottom: 8 }}>
            You just made<br />someone's <em style={{ color: C.rose }}>whole day</em>
          </h1>
          <p style={{ color: C.earth, fontSize: '1rem', lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>
            {isMulti
              ? `${recipientCount} cosmic gifts are ready to be shared!`
              : isLink
                ? 'Your gift is ready — share the magic link below.'
                : 'A beautiful gift email has been sent on your behalf.'}
          </p>
        </motion.div>

        {/* Gift code / link card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ padding: 28, background: 'white', borderRadius: 20, border: `1px solid ${C.cream3}`, boxShadow: '0 4px 24px rgba(0,0,0,0.04)', marginBottom: 20 }}>

          {isLink ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: C.gold, marginBottom: 14 }}>
                <LinkIcon style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Share this link</span>
              </div>
              <div style={{ padding: 14, background: C.cream2, borderRadius: 14, border: `1px solid ${C.cream3}`, marginBottom: 14, wordBreak: 'break-all' as const }}>
                <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: C.ink }}>{redeemUrl}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={copyLink} style={{ padding: '12px 0', borderRadius: 50, border: `1px solid ${C.cream3}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Cormorant, Georgia, serif', fontWeight: 600, fontSize: '0.88rem', color: C.ink }}>
                  <Copy style={{ width: 15, height: 15 }} /> Copy Link
                </button>
                <button onClick={share} style={{ padding: '12px 0', borderRadius: 50, border: 'none', background: C.rose, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Cormorant, Georgia, serif', fontWeight: 600, fontSize: '0.88rem' }}>
                  <Share2 style={{ width: 15, height: 15 }} /> Share
                </button>
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.cream3}` }}>
                <p style={{ fontSize: '0.75rem', color: C.muted }}>Gift code: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.ink, letterSpacing: '0.1em' }}>{giftCode}</span>
                  <button onClick={copyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, marginLeft: 6 }}><Copy style={{ width: 12, height: 12 }} /></button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: C.green, marginBottom: 14 }}>
                <Mail style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                  {isMulti ? `Sent to ${recipientCount} recipients` : 'Gift email sent!'}
                </span>
              </div>
              <div style={{ padding: 16, background: C.cream2, borderRadius: 14, border: `1px solid ${C.cream3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, color: C.ink, letterSpacing: '0.15em' }}>{giftCode}</p>
                <button onClick={copyCode} style={{ padding: 8, borderRadius: 10, border: `1px solid ${C.cream3}`, background: 'transparent', cursor: 'pointer' }}>
                  <Copy style={{ width: 16, height: 16, color: C.muted }} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 10 }}>Keep this code as a backup — you can also share it manually</p>
            </>
          )}
        </motion.div>

        {/* What happens next */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}`, textAlign: 'left', marginBottom: 24 }}>
          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: C.ink, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles style={{ width: 14, height: 14, color: C.gold }} /> What happens next
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(isLink ? [
              'Send the link to your lucky person (text, card, or in person)',
              'They click the link and enter their pet\'s details',
              'A personalised cosmic reading appears — magic!',
            ] : [
              'Your recipient just received a beautiful gift email',
              'They\'ll click the link and enter their pet\'s details',
              'A personalised cosmic reading appears — pure magic!',
            ]).map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: '0.88rem', flexShrink: 0 }}>{i + 1}.</span>
                <p style={{ fontSize: '0.85rem', color: C.warm, lineHeight: 1.4 }}>{text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link to="/gift" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '14px 0', borderRadius: 50, background: C.rose, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Gift style={{ width: 18, height: 18 }} /> Gift Another Person
            </button>
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%', padding: '12px 0', borderRadius: 50, background: 'transparent', border: `1px solid ${C.cream3}`, color: C.muted, cursor: 'pointer', fontFamily: 'Cormorant, Georgia, serif', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Back to home <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </Link>
        </motion.div>

        <p style={{ fontSize: '0.72rem', color: C.muted, marginTop: 20 }}>
          Questions? <Link to="/contact" style={{ color: C.rose, textDecoration: 'none' }}>Get in touch</Link>
        </p>
      </div>
    </div>
  );
}
