import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PetSummary {
  reportId: string;
  petName: string;
  petPhotoUrl?: string;
}

interface CompatibilityOfferProps {
  pets: PetSummary[];
  /** Current pet being viewed — auto-selects as "Pet A" so the picker asks "and which one with them?". */
  currentReportId?: string;
  buyerEmail: string;
  /** Price to show, in whole dollars. Defaults to 12. */
  priceDollars?: number;
}

/**
 * Appears inside the multi-pet report viewer as a contextual upsell. Lets a
 * buyer with 2+ pets pair any two of their pets and pay to generate a
 * cross-pet compatibility reading.
 */
export function CompatibilityOffer({ pets, currentReportId, buyerEmail, priceDollars = 12 }: CompatibilityOfferProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [petAId, setPetAId] = useState<string>(currentReportId ?? pets[0]?.reportId ?? '');
  const [petBId, setPetBId] = useState<string>(
    (pets.find(p => p.reportId !== (currentReportId ?? pets[0]?.reportId))?.reportId) ?? '',
  );

  const petA = pets.find(p => p.reportId === petAId);
  const petB = pets.find(p => p.reportId === petBId);
  const canProceed = !!petA && !!petB && petA.reportId !== petB.reportId && !!buyerEmail && !isLoading;

  const handleStart = async () => {
    if (!canProceed) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          compatibilityUpsellCheckout: true,
          compatPetReportAId: petA!.reportId,
          compatPetReportBId: petB!.reportId,
          purchaserEmail: buyerEmail,
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

  if (pets.length < 2) return null;

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
        {pets.length > 2 && (
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
                  {pets.map(p => (
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
                  {pets.map(p => (
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
                Reveal their bond · ${priceDollars}
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </span>
        </button>

        <p className="text-center text-[0.72rem] text-[#9B8E84] mt-2.5"
          style={{ fontFamily: 'Cormorant, serif' }}>
          One-time · Lives in your account · Shareable with the other pet's family
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
