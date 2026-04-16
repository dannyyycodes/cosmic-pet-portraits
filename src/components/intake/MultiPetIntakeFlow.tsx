import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { PostPurchaseIntake, type PetIntakeSnapshot } from './PostPurchaseIntake';

interface PendingPet {
  reportId: string;
  /** Optional — if provided we'll greet the user with it on the transition screen. */
  petName?: string;
  /** Optional — shows the pet's photo on the transition screen if uploaded at checkout. */
  petPhotoUrl?: string;
}

interface MultiPetIntakeFlowProps {
  pets: PendingPet[];
  /** Fires after every pet has had its intake submitted. */
  onAllComplete: () => void;
}

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
};

/**
 * Orchestrates a sequence of PostPurchaseIntake forms — one per pending pet.
 *
 * Carries the buyer's email and (if Soul Bond) owner birth data forward so
 * we don't re-ask the same questions across pets. Shows a short celebratory
 * transition between pets so the flow feels intentional, not repetitive.
 */
export function MultiPetIntakeFlow({ pets, onAllComplete }: MultiPetIntakeFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [sharedEmail, setSharedEmail] = useState<string | undefined>();
  const [sharedOwner, setSharedOwner] = useState<PetIntakeSnapshot['owner']>();

  const isSingle = pets.length <= 1;
  const activePet = pets[currentIndex];
  const nextPet = pets[currentIndex + 1];
  const isLast = currentIndex >= pets.length - 1;

  const handlePetComplete = (snapshot?: PetIntakeSnapshot) => {
    // Capture shared fields so the next pet's intake can skip them.
    if (snapshot?.email && !sharedEmail) setSharedEmail(snapshot.email);
    if (snapshot?.owner && !sharedOwner) setSharedOwner(snapshot.owner);

    if (isLast) {
      onAllComplete();
    } else {
      setShowTransition(true);
    }
  };

  const handleContinueToNext = () => {
    setShowTransition(false);
    setCurrentIndex((i) => i + 1);
  };

  const submitLabel = useMemo(
    () => (isSingle
      ? undefined
      : (petName: string) => (isLast ? `Create ${petName}'s Soul Reading →` : `Save ${petName} & continue →`)),
    [isSingle, isLast],
  );

  if (showTransition && nextPet) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
        style={{
          backgroundColor: '#FFFDF5',
          paddingBottom: 'calc(3rem + env(safe-area-inset-bottom, 0px))',
          paddingTop: 'calc(3rem + env(safe-area-inset-top, 0px))',
          ...grainStyle,
        }}
      >
        <motion.div
          key={`transition-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          className="max-w-[440px] w-full text-center"
        >
          {/* Orbiting sparkles */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.1 }}
            className="relative w-24 h-24 mx-auto mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(196,162,101,0.25), rgba(191,82,74,0.2))',
                filter: 'blur(16px)',
              }}
            />
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #c4a265, #bf524a)',
                boxShadow: '0 10px 40px -8px rgba(191,82,74,0.4)',
              }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[0.7rem] uppercase tracking-[0.2em] mb-3"
            style={{ color: '#a07c3a', fontFamily: 'Cormorant, serif', fontVariant: 'small-caps' }}
          >
            {currentIndex + 1} of {pets.length} saved ✦
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-[#2D2926] mb-3"
            style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(1.6rem, 5vw, 2.1rem)' }}
          >
            Beautiful.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-[1.05rem] text-[#6B5E54] italic mb-2 break-words px-2"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {nextPet.petName
              ? `Now let's introduce us to ${nextPet.petName}.`
              : `Now let's meet your next little soul.`}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-[0.88rem] text-[#9B8E84] mb-8"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {sharedEmail || sharedOwner
              ? 'Good news — we already have your email' + (sharedOwner ? ' and your own stars' : '') + ', so this one is faster.'
              : 'Each soul gets its own careful reading.'}
          </motion.p>

          {/* Progress pill row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="flex items-center gap-1.5 justify-center mb-8"
          >
            {pets.map((p, i) => (
              <div
                key={p.reportId}
                className="flex items-center gap-1.5"
              >
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i <= currentIndex ? 28 : 14,
                    background: i <= currentIndex ? '#bf524a' : '#E8DFD6',
                  }}
                />
              </div>
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            onClick={handleContinueToNext}
            className="w-full py-4 rounded-xl text-white text-[1.02rem] relative overflow-hidden"
            style={{ fontFamily: 'DM Serif Display, serif', backgroundColor: '#bf524a' }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="relative z-10">
              {nextPet.petName ? `Tell us about ${nextPet.petName} →` : 'Meet the next one →'}
            </span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!activePet) {
    // Defensive: nothing to do — bubble up.
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`intake-${activePet.reportId}`}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
      >
        <PostPurchaseIntake
          reportId={activePet.reportId}
          onComplete={handlePetComplete}
          petIndex={isSingle ? undefined : currentIndex}
          totalPets={isSingle ? undefined : pets.length}
          sharedEmail={sharedEmail}
          sharedOwner={sharedOwner}
          submitLabel={submitLabel}
        />
      </motion.div>
    </AnimatePresence>
  );
}
