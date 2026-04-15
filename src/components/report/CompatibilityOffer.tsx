import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocalizedPrice } from '@/hooks/useLocalizedPrice';

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
  /** Current pet being viewed — auto-selects as "Pet A" so the picker asks "and which one with them?". */
  currentReportId?: string;
  buyerEmail: string;
}

/**
 * Tiered pricing — first pair at full price, subsequent pairs discounted to
 * match the multi-pet base-tier volume discount philosophy. Returns USD dollars.
 */
function priceForPair(existingPairsCount: number): number {
  if (existingPairsCount >= 2) return 8;   // 3rd+ pair
  if (existingPairsCount >= 1) return 10;  // 2nd pair
  return 12;                               // 1st pair
}

/**
 * Appears inside the multi-pet report viewer as a contextual upsell. Lets a
 * buyer with 2+ pets pair any two of their pets and pay to generate a
 * cross-pet compatibility reading.
 */
export function CompatibilityOffer({ pets, currentReportId, buyerEmail }: CompatibilityOfferProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { fmtUsd } = useLocalizedPrice();

  // Only living pets are eligible for compatibility pairings.
  const livingPets = pets.filter(p => p.occasionMode !== 'memorial');

  const defaultA = livingPets.find(p => p.reportId === currentReportId)?.reportId ?? livingPets[0]?.reportId ?? '';
  const defaultB = livingPets.find(p => p.reportId !== defaultA)?.reportId ?? '';

  const [petAId, setPetAId] = useState<string>(defaultA);
  const [petBId, setPetBId] = useState<string>(defaultB);
  // Look up how many compatibility pairings this household has already
  // unlocked so we can surface the volume discount in the CTA copy.
  const [existingPairs, setExistingPairs] = useState<number>(0);
  useEffect(() => {
    let cancelled = false;
    if (!buyerEmail) return;
    (async () => {
      const { count } = await supabase
        .from('pet_compatibilities')
        .select('id', { count: 'exact', head: true })
        .eq('email', buyerEmail.toLowerCase().trim())
        .eq('status', 'ready');
      if (!cancelled) setExistingPairs(count ?? 0);
    })();
    return () => { cancelled = true; };
  }, [buyerEmail]);

  const priceDollars = priceForPair(existingPairs);
  const nextDiscountDollars = existingPairs === 0 ? priceForPair(1) : existingPairs === 1 ? priceForPair(2) : null;

  const petA = livingPets.find(p => p.reportId === petAId);
  const petB = livingPets.find(p => p.reportId === petBId);
  const canProceed = !!petA && !!petB && petA.reportId !== petB.reportId && !!buyerEmail && !isLoading;

  const handleStart = async () => {
    if (!canProceed) return;
    setIsLoading(true);
    // Fire-and-forget analytics — don't block the Stripe redirect on it.
    try {
      await supabase.from('page_analytics').insert([{
        session_id: (() => {
          try { return sessionStorage.getItem('analytics_session_id') || `${Date.now()}`; }
          catch { return `${Date.now()}`; }
        })(),
        event_type: 'compat_upsell_started',
        page_path: '/report',
        event_data: { pairIndex: existingPairs, priceUsd: priceDollars, petAId: petA!.reportId, petBId: petB!.reportId } as never,
        user_agent: navigator.userAgent,
      }]);
    } catch { /* non-fatal */ }
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          compatibilityUpsellCheckout: true,
          compatPetReportAId: petA!.reportId,
          compatPetReportBId: petB!.reportId,
          purchaserEmail: buyerEmail,
          // Server-side pricing authority — the server recomputes from DB to
          // prevent tampering, but sending the client's count lets the
          // server log any mismatches in telemetry.
          existingPairsCount: existingPairs,
        },
      });
      if (error || !data?.url) throw error || new Error('No checkout URL');
      window.location.href = data.url;
    } catch (err) {
      console.error('[CompatibilityOffer] Checkout error:', err);
      toast.error('Could not start checkout — please try again.');
      setIsLoading(false);
    }
  };

  // Need at least two living pets for a compatibility pairing to make sense.
  if (livingPets.length < 2) return null;

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
        {/* Floating sparkle accents */}
        <motion.div
          className="absolute top-3 right-4 text-[#c4a265]"
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[0.62rem] font-bold uppercase tracking-wider mb-3"
          style={{ background: 'rgba(191,82,74,0.9)', color: 'white' }}>
          <Heart className="w-3 h-3" /> New · Cross-pet reading
        </div>

        <h3 className="text-[1.35rem] md:text-[1.55rem] text-[#2D2926] mb-2"
          style={{ fontFamily: 'DM Serif Display, serif' }}>
          How do {petA?.petName || 'they'} and {petB?.petName || 'the others'} move through the world together?
        </h3>

        <p className="text-[0.92rem] text-[#6B5E54] italic mb-5 leading-relaxed"
          style={{ fontFamily: 'Cormorant, serif' }}>
          We'll compose a cross-pet reading showing how their charts interact — where they harmonise, where they clash, and the little rituals that keep the bond steady.
        </p>

        {/* Pet pair picker */}
        {livingPets.length > 2 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-[0.6rem] uppercase tracking-widest text-[#9B8E84] font-semibold mb-1 block"
                style={{ fontFamily: 'Cormorant, serif' }}>First pet</label>
              <div className="relative">
                <select
                  value={petAId}
                  onChange={(e) => setPetAId(e.target.value)}
                  className="w-full appearance-none pr-8 pl-3.5 py-2.5 rounded-xl border-[1.5px] text-[0.92rem] text-[#2D2926] bg-white focus:outline-none focus:border-[#bf524a]"
                  style={{ borderColor: '#E8DFD6', fontFamily: 'Cormorant, serif', fontSize: '16px' }}
                >
                  {livingPets.map(p => (
                    <option key={p.reportId} value={p.reportId} disabled={p.reportId === petBId}>
                      🐾 {p.petName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-widest text-[#9B8E84] font-semibold mb-1 block"
                style={{ fontFamily: 'Cormorant, serif' }}>Second pet</label>
              <div className="relative">
                <select
                  value={petBId}
                  onChange={(e) => setPetBId(e.target.value)}
                  className="w-full appearance-none pr-8 pl-3.5 py-2.5 rounded-xl border-[1.5px] text-[0.92rem] text-[#2D2926] bg-white focus:outline-none focus:border-[#bf524a]"
                  style={{ borderColor: '#E8DFD6', fontFamily: 'Cormorant, serif', fontSize: '16px' }}
                >
                  {livingPets.map(p => (
                    <option key={p.reportId} value={p.reportId} disabled={p.reportId === petAId}>
                      🐾 {p.petName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8E84] pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Visual duet */}
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

        <button
          onClick={handleStart}
          disabled={!canProceed}
          className="w-full py-3.5 rounded-xl text-white font-semibold transition-all relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: canProceed
              ? 'linear-gradient(135deg, #c4a265, #bf524a)'
              : '#d8c7b5',
            fontFamily: 'DM Serif Display, serif',
            fontSize: '1.02rem',
          }}
        >
          {canProceed && (
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
            {isLoading ? (
              <>Loading…</>
            ) : (
              <>
                Reveal their bond · {fmtUsd(priceDollars)}
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        <p className="text-center text-[0.72rem] text-[#9B8E84] mt-2.5"
          style={{ fontFamily: 'Cormorant, serif' }}>
          One-time · Lives in your account · Shareable with the other pet's family
        </p>

        {nextDiscountDollars !== null && (
          <p className="text-center text-[0.72rem] mt-1" style={{ color: '#a07c3a', fontFamily: 'Cormorant, serif' }}>
            ✨ Next pairing drops to {fmtUsd(nextDiscountDollars)}{existingPairs === 0 ? ' · 3rd pairing ' + fmtUsd(8) : ''}
          </p>
        )}
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
