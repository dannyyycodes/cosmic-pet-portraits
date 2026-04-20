import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
// priceCentsForPair is kept imported-ish via this comment because the paid
// compatibility upsell is parked — see PR feat/compat-free-multipet. The
// paid path (and priceCentsForPair, tiered pricing) stays in `pricing.ts`
// so re-enabling is a one-file edit when the feature is ready again.

interface PetSummary {
  reportId: string;
  petName: string;
  petPhotoUrl?: string;
  /** Memorial pets are filtered out of the picker — compatibility readings are
   *  framed as a living relationship and would land as a care failure otherwise. */
  occasionMode?: string;
}

interface CompatibilityOfferProps {
  pets: PetSummary[];
  /** Current pet being viewed — not used for the complimentary path but kept
   *  for API compatibility with the prior paid-upsell signature. */
  currentReportId?: string;
  buyerEmail: string;
}

/**
 * Complimentary cross-pet reading teaser — shown inside the multi-pet report
 * viewer when the buyer has 2+ living pets. Replaces the prior paid upsell
 * (see PR feat/compat-free-multipet): instead of charging per pairing, we
 * auto-generate the first pair on checkout and surface it here. Status is
 * read from the `pet_compatibilities` row seeded by stripe-webhook.
 */
export function CompatibilityOffer({ pets, buyerEmail }: CompatibilityOfferProps) {
  // Only living pets are eligible for compatibility pairings.
  const livingPets = pets.filter(p => p.occasionMode !== 'memorial');

  // Canonical pair = the first two living pets sorted by reportId (matches
  // the stripe-webhook insert + the DB check constraint).
  const sortedIds = [...livingPets.map(p => p.reportId)].sort();
  const pairA = sortedIds[0];
  const pairB = sortedIds[1];
  const petA = livingPets.find(p => p.reportId === pairA);
  const petB = livingPets.find(p => p.reportId === pairB);

  type CompatRow = {
    id: string;
    status: string;
    share_token: string | null;
    is_complimentary: boolean | null;
  };
  const [row, setRow] = useState<CompatRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!buyerEmail || !pairA || !pairB) {
      setLoaded(true);
      return;
    }

    const fetchRow = async () => {
      const { data } = await supabase
        .from('pet_compatibilities')
        .select('id, status, share_token, is_complimentary')
        .eq('pet_report_a_id', pairA)
        .eq('pet_report_b_id', pairB)
        .maybeSingle();
      if (!cancelled) {
        setRow((data as CompatRow | null) ?? null);
        setLoaded(true);
      }
    };

    fetchRow();
    // Poll every 10s while we're waiting for generation to finish, so the
    // UI flips from "preparing" → "ready" without a manual refresh.
    const interval = window.setInterval(fetchRow, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [buyerEmail, pairA, pairB]);

  // Need at least two living pets for a compatibility pairing to make sense.
  if (livingPets.length < 2) return null;
  // Hide entirely until the first fetch completes — avoids flashing a
  // "preparing" state when the row is actually ready.
  if (!loaded) return null;

  const isReady = row?.status === 'ready' && !!row?.share_token;
  // CompatibilityViewer expects `/compatibility?token=...` — the existing
  // share-link format used in all other surfaces.
  const compatHref = row?.share_token
    ? `/compatibility?token=${row.share_token}`
    : `/compatibility?a=${pairA}&b=${pairB}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="my-10 mx-auto max-w-[560px] px-4"
    >
      <div
        className="relative rounded-[22px] p-6 md:p-7 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(196,162,101,0.12), rgba(191,82,74,0.08))',
          border: '1.5px solid rgba(196,162,101,0.35)',
        }}
      >
        <motion.div
          className="absolute top-3 right-4 text-[#c4a265]"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[0.62rem] font-bold uppercase tracking-wider mb-3"
          style={{ background: 'rgba(191,82,74,0.9)', color: 'white' }}>
          <Heart className="w-3 h-3" /> Complimentary · Cross-pet reading
        </div>

        <h3 className="text-[1.35rem] md:text-[1.55rem] text-[#2D2926] mb-2"
          style={{ fontFamily: 'DM Serif Display, serif' }}>
          How do {petA?.petName || 'they'} and {petB?.petName || 'the others'} move through the world together?
        </h3>

        <p className="text-[0.92rem] text-[#6B5E54] italic mb-5 leading-relaxed"
          style={{ fontFamily: 'Cormorant, serif' }}>
          We composed a cross-pet reading showing how their charts interact — where they harmonise, where they clash, and the little rituals that keep the bond steady.
        </p>

        <div className="flex items-center justify-center gap-4 mb-5">
          <PetAvatar pet={petA} />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-[1.8rem]" style={{ color: '#bf524a' }}>✦</span>
          </motion.div>
          <PetAvatar pet={petB} />
        </div>

        {isReady ? (
          <Link
            to={compatHref}
            className="block w-full py-3.5 rounded-xl text-white font-semibold text-center transition-all relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #c4a265, #bf524a)',
              fontFamily: 'DM Serif Display, serif',
              fontSize: '1.02rem',
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
              Your complimentary cross-pet reading is ready
              <Sparkles className="w-4 h-4" />
            </span>
          </Link>
        ) : (
          <div
            className="block w-full py-3.5 rounded-xl font-semibold text-center"
            style={{
              background: '#e8dccb',
              color: '#6B5E54',
              fontFamily: 'DM Serif Display, serif',
              fontSize: '1.02rem',
            }}
          >
            <span className="inline-flex items-center justify-center gap-1.5">
              Your complimentary reading is being prepared
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >…</motion.span>
            </span>
          </div>
        )}

        <p className="text-center text-[0.72rem] text-[#9B8E84] mt-2.5"
          style={{ fontFamily: 'Cormorant, serif' }}>
          Included with your multi-pet order · Lives in your account
        </p>
      </div>
    </motion.div>
  );
}

function PetAvatar({ pet }: { pet?: PetSummary }) {
  if (!pet) {
    return (
      <div
        className="w-14 h-14 rounded-full border-[1.5px] border-dashed flex items-center justify-center"
        style={{ borderColor: '#d8c7b5', color: '#9B8E84' }}
      >
        <span className="text-xs">?</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-14 h-14 rounded-full overflow-hidden border-2"
        style={{ borderColor: '#c4a265' }}
      >
        {pet.petPhotoUrl ? (
          <img src={pet.petPhotoUrl} alt={pet.petName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[1.2rem]"
            style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.25), rgba(191,82,74,0.15))' }}>
            🐾
          </div>
        )}
      </div>
      <span className="text-[0.72rem] text-[#6B5E54] mt-1.5 font-semibold"
        style={{ fontFamily: 'Cormorant, serif' }}>
        {pet.petName}
      </span>
    </div>
  );
}
