import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IntakeStepOccasion } from './IntakeStepOccasion';
import { IntakeStepPetCount } from './IntakeStepPetCount';
import { IntakeStepName } from './IntakeStepName';
import { IntakeStepSpecies } from './IntakeStepSpecies';
import { IntakeStepBreed } from './IntakeStepBreed';
import { IntakeStepGender } from './IntakeStepGender';
import { IntakeStepDOB } from './IntakeStepDOB';
import { IntakeStepLocation } from './IntakeStepLocation';
import { IntakeStepSoul } from './IntakeStepSoul';
import { IntakeStepSuperpower } from './IntakeStepSuperpower';
import { IntakeStepStrangers } from './IntakeStepStrangers';
import { IntakeStepEmail } from './IntakeStepEmail';
import { CosmicLoading } from './CosmicLoading';
import { SocialProofBar } from './SocialProofBar';
import { MiniReport } from './MiniReport';
import { OccasionMode, occasionModeContent } from '@/lib/occasionMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { CosmicProgress } from '@/components/cosmic/CosmicProgress';
import { EmotionProvider, useEmotion } from '@/contexts/EmotionContext';
import { CheckoutData } from './CheckoutPanel';
import { saveIntakeProgress, loadIntakeProgress, clearIntakeProgress } from '@/lib/intakeStorage';
import { getReferralCode } from '@/lib/referralTracking';

export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'hamster' | 'guinea_pig' | 'bird' | 'fish' | 'reptile' | 'horse' | 'other' | '';
export type PetGender = 'boy' | 'girl' | '';

export interface PetData {
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  dateOfBirth: Date | null;
  timeOfBirth: string;
  location: string;
  soulType: string;
  superpower: string;
  strangerReaction: string;
  email: string;
  occasionMode: OccasionMode;
}

export interface CosmicReport {
  sunSign: string;
  archetype: string;
  element: string;
  modality: string;
  nameVibration: number;
  coreEssence: string;
  soulMission: string;
  hiddenGift: string;
  loveLanguage: string;
  cosmicAdvice: string;
}

interface IntakeWizardProps {
  mode: OccasionMode;
}

const createEmptyPetData = (mode: OccasionMode): PetData => ({
  name: '',
  species: '',
  breed: '',
  gender: '',
  dateOfBirth: null,
  timeOfBirth: '',
  location: '',
  soulType: '',
  superpower: '',
  strangerReaction: '',
  email: '',
  occasionMode: mode
});

// Wrapper component with EmotionProvider
export function IntakeWizard({ mode }: IntakeWizardProps) {
  return (
    <EmotionProvider>
      <IntakeWizardContent mode={mode} />
    </EmotionProvider>
  );
}

function IntakeWizardContent({ mode }: IntakeWizardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDevMode = searchParams.get('dev') === 'true';
  const isPreviewHost =
    typeof window !== 'undefined' &&
    window.location.hostname.endsWith('lovableproject.com');
  const isTestMode = isDevMode || isPreviewHost;


  const toggleDevMode = () => {
    const next = new URLSearchParams(searchParams);
    if (isDevMode) {
      next.delete('dev');
    } else {
      next.set('dev', 'true');
    }
    setSearchParams(next, { replace: true });
  };
  const [step, setStep] = useState(0);
  const [occasionMode, setOccasionMode] = useState<OccasionMode>(mode);
  const [petCount, setPetCount] = useState(1);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [petsData, setPetsData] = useState<PetData[]>([createEmptyPetData(mode)]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cosmicReport, setCosmicReport] = useState<CosmicReport | null>(null);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const stepStartTime = useRef<number>(Date.now());
  const { trackAction, intensity } = useEmotion();

  const modeContent = occasionModeContent[occasionMode];

  // Restore saved progress on mount - but always start with occasion step for fresh visits
  useEffect(() => {
    if (hasRestoredProgress) return;
    
    const saved = loadIntakeProgress();
    // Only restore if there's saved progress AND user isn't coming fresh from homepage
    // We detect fresh visits by checking if we're at step 0 with no data
    if (saved && saved.petsData.length > 0 && saved.step > 0) {
      // Convert date strings back to Date objects
      const restoredPets = saved.petsData.map(pet => ({
        ...pet,
        dateOfBirth: pet.dateOfBirth ? new Date(pet.dateOfBirth) : null,
      }));
      
      setPetsData(restoredPets);
      setCurrentPetIndex(saved.currentPetIndex);
      setStep(saved.step);
      setPetCount(saved.petCount);
      setOccasionMode(saved.petsData[0]?.occasionMode || mode);
      
      toast.success('Welcome back! Your progress has been restored.');
    }
    // Always start at step 0 (occasion) for fresh visits
    setHasRestoredProgress(true);
  }, [hasRestoredProgress, mode]);

  // Save progress whenever state changes
  useEffect(() => {
    if (!hasRestoredProgress) return;
    if (step === 0 && petsData[0].name === '') return; // Don't save if nothing entered
    
    saveIntakeProgress({
      petsData,
      currentPetIndex,
      step,
      petCount,
      savedAt: Date.now(),
    });
  }, [petsData, currentPetIndex, step, petCount, hasRestoredProgress]);

  // Steps: 0=occasion, 1=pet count, 2-10=pet data (9 steps), 11=email
  const stepsPerPet = 9;
  const totalSteps = 2 + (petCount * stepsPerPet) + 1; // occasion + pet count + pet steps + email

  // Calculate current global step for progress
  const getGlobalStep = () => {
    if (step === 0) return 0; // Occasion
    if (step === 1) return 1; // Pet count
    if (step === 11) return 2 + (petCount * stepsPerPet); // Email step
    // Pet data steps (2-10 per pet)
    return 2 + (currentPetIndex * stepsPerPet) + (step - 2);
  };

  // Track step timing
  useEffect(() => {
    trackAction({ type: 'step_start' });
    stepStartTime.current = Date.now();
  }, [step, currentPetIndex, trackAction]);

  // Update occasion mode and update all pets
  const handleOccasionSelect = (newMode: OccasionMode) => {
    setOccasionMode(newMode);
    setPetsData(prev => prev.map(pet => ({ ...pet, occasionMode: newMode })));
    goToStep(1);
  };

  // Update pet count and initialize pet data array
  const handlePetCountChange = (count: number) => {
    setPetCount(count);
    const newPetsData = Array(count).fill(null).map((_, i) => 
      petsData[i] || createEmptyPetData(occasionMode)
    );
    setPetsData(newPetsData);
  };

  const currentPetData = petsData[currentPetIndex];

  const updatePetData = (data: Partial<PetData>) => {
    setPetsData(prev => prev.map((pet, i) => 
      i === currentPetIndex ? { ...pet, ...data } : pet
    ));
    if ('name' in data && data.name) {
      trackAction({ type: 'input_change', length: data.name.length });
    }
  };

  const goToStep = (nextStep: number) => {
    const timeSpent = Date.now() - stepStartTime.current;
    trackAction({ type: 'step_complete', timeSpent });
    setStep(nextStep);
  };

  const handleBack = () => {
    trackAction({ type: 'back_pressed' });
    
    // If on step 2 (first pet data step) and not the first pet, go to previous pet's last step
    if (step === 2 && currentPetIndex > 0) {
      setCurrentPetIndex(currentPetIndex - 1);
      setStep(10); // Last pet data step
    } else if (step === 2 && currentPetIndex === 0) {
      setStep(1); // Go back to pet count selection
    } else if (step === 1) {
      setStep(0); // Go back to occasion
    } else if (step > 2) {
      setStep(step - 1); // Go to previous step
    }
  };

  const handleNextPetOrEmail = () => {
    if (currentPetIndex < petCount - 1) {
      // Move to next pet
      setCurrentPetIndex(currentPetIndex + 1);
      setStep(2); // First pet data step
    } else {
      // All pets done, go to email
      setStep(11);
    }
  };

  // Validate all required fields before submission
  const validatePetData = (pet: PetData): string | null => {
    const trimmedName = pet.name.trim();
    if (!trimmedName) return 'Pet name is required';
    if (trimmedName.length > 50) return 'Pet name is too long';
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) return 'Pet name contains invalid characters';
    if (!pet.species) return 'Species is required';
    if (!pet.gender || (pet.gender !== 'boy' && pet.gender !== 'girl')) return 'Gender is required';
    if (!pet.dateOfBirth) return 'Date of birth is required';
    return null;
  };

  const handleReveal = async (checkoutData?: CheckoutData) => {
    setIsLoading(true);
    
    try {
      // Validate all pets before proceeding
      for (let i = 0; i < petsData.length; i++) {
        const validationError = validatePetData(petsData[i]);
        if (validationError) {
          toast.error(`Pet ${i + 1}: ${validationError}`);
          setIsLoading(false);
          return;
        }
      }

      // Save all pets to database
      const email = petsData[0].email.trim(); // Trim to prevent Stripe email errors
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      const reportIds: string[] = [];

      for (const pet of petsData) {
        // Sanitize all string fields
        const sanitizedName = pet.name.trim().slice(0, 50);
        const sanitizedBreed = (pet.breed || '').trim().slice(0, 100);
        const sanitizedLocation = (pet.location || '').trim().slice(0, 100);
        const sanitizedSoulType = (pet.soulType || '').trim().slice(0, 50);
        const sanitizedSuperpower = (pet.superpower || '').trim().slice(0, 50);
        const sanitizedStrangerReaction = (pet.strangerReaction || '').trim().slice(0, 50);

        // Generate UUID client-side to avoid needing SELECT after INSERT (blocked by RLS)
        const reportId = crypto.randomUUID();
        console.log('[INTAKE] Saving pet report for:', sanitizedName, 'email:', email, 'id:', reportId);
        
        const { error: dbError } = await supabase
          .from('pet_reports')
          .insert({
            id: reportId,
            email: email,
            pet_name: sanitizedName,
            species: pet.species,
            breed: sanitizedBreed || null,
            gender: pet.gender,
            birth_date: pet.dateOfBirth?.toISOString().split('T')[0] || null,
            birth_location: sanitizedLocation || null,
            soul_type: sanitizedSoulType || null,
            superpower: sanitizedSuperpower || null,
            stranger_reaction: sanitizedStrangerReaction || null,
            occasion_mode: pet.occasionMode,
          });

        if (dbError) {
          console.error('[INTAKE] Database error saving report:', dbError);
          toast.error(`Failed to save ${sanitizedName}'s data: ${dbError.message}`);
          throw new Error(`Failed to save pet data: ${dbError.message}`);
        }
        console.log('[INTAKE] Report saved with ID:', reportId);
        reportIds.push(reportId);
      }

      // TEST MODE: Skip Stripe checkout for preview/dev
      if (isTestMode) {
        console.log('[TEST MODE] Skipping Stripe checkout, redirecting to success page');
        clearIntakeProgress();
        toast.success('Test mode: Skipping payment');
        const primaryReportId = reportIds[0];
        window.location.href = `/payment-success?session_id=dev_test_${Date.now()}&report_id=${primaryReportId}`;
        return;
      }

      // Create checkout with volume discount
      if (checkoutData) {
        // Get referral code if present
        const referralCode = getReferralCode();
        
        const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke(
          'create-checkout',
          {
            body: {
              reportIds, // Array of report IDs
              petCount,
              selectedTier: checkoutData.selectedTier || 'basic',
              selectedProducts: checkoutData.selectedProducts,
              couponId: checkoutData.couponId,
              giftCertificateId: checkoutData.giftCertificateId,
              isGift: checkoutData.isGift,
              recipientName: checkoutData.recipientName,
              recipientEmail: checkoutData.recipientEmail,
              giftMessage: checkoutData.giftMessage,
              includeGiftForFriend: checkoutData.includeGiftForFriend || false,
              referralCode: referralCode || undefined, // Pass referral code to checkout
            },
          }
        );

        if (checkoutError) {
          console.error('[INTAKE] Checkout error:', checkoutError);
          toast.error(`Checkout failed: ${checkoutError.message || 'Unknown error'}`);
          throw new Error('Failed to create checkout session');
        }

        console.log('[INTAKE] Checkout result:', checkoutResult);
        
        if (checkoutResult?.url) {
          console.log('[INTAKE] Redirecting to Stripe checkout:', checkoutResult.url);
          // Clear saved progress before checkout
          clearIntakeProgress();
          window.location.href = checkoutResult.url;
          return;
        } else {
          console.error('[INTAKE] No checkout URL returned');
          toast.error('Failed to get checkout URL');
        }
      }

      setIsLoading(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  if (showResults) {
    return <MiniReport petData={petsData[0]} cosmicReport={cosmicReport} />;
  }

  if (isLoading) {
    return (
      <>
        <StarfieldBackground intensity="excited" />
        <CosmicLoading />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-14 relative overflow-hidden">
      <StarfieldBackground intensity={intensity} interactive />
      
      {/* Mode Badge - clickable to toggle */}
      <button
        onClick={toggleDevMode}
        className="fixed top-3 left-3 z-50 group"
        title={isDevMode ? 'Click to disable dev mode' : 'Click to enable dev mode'}
      >
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide transition-all cursor-pointer ${
            isTestMode
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-yellow-400' : 'bg-green-400'}`} />
          {isDevMode ? 'Dev Mode' : isPreviewHost ? 'Preview Mode' : 'Live Mode'}
        </span>
      </button>

      <SocialProofBar petName={currentPetData?.name || ''} />
      
      <div className="w-full max-w-xl relative z-10">
        {/* Progress bar - only show after occasion selection */}
        {step > 0 && (
          <CosmicProgress current={getGlobalStep()} total={totalSteps} />
        )}

        {/* Occasion mode indicator - always editable */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-3"
          >
            <button
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/50 hover:bg-card/80 border border-border/50 hover:border-primary/30 text-xs text-muted-foreground hover:text-foreground transition-all"
              title="Click to change occasion"
            >
              <span>{occasionMode === 'discover' ? '🔮' : occasionMode === 'birthday' ? '🎂' : occasionMode === 'memorial' ? '🌈' : '🎁'}</span>
              <span className="capitalize">{occasionMode === 'gift' ? 'Gift' : occasionMode}</span>
              <span className="text-primary/60">• Edit</span>
            </button>
          </motion.div>
        )}

        {/* Pet indicator for multi-pet flow */}
        {step > 1 && step < 11 && petCount > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium">
              🐾 Pet {currentPetIndex + 1} of {petCount}
              {currentPetData?.name && `: ${currentPetData.name}`}
            </span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step-occasion" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepOccasion 
                selectedMode={occasionMode}
                onSelect={handleOccasionSelect}
                showRestart={petsData[0]?.name !== ''}
                onRestart={() => {
                  setPetsData([createEmptyPetData(mode)]);
                  setPetCount(1);
                  setCurrentPetIndex(0);
                  setStep(0);
                }}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step-petcount" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepPetCount 
                petCount={petCount} 
                onUpdate={handlePetCountChange} 
                onNext={() => goToStep(2)}
                onBack={() => goToStep(0)}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key={`step2-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepName 
                petData={currentPetData} 
                onUpdate={updatePetData} 
                onNext={() => goToStep(3)} 
                totalSteps={stepsPerPet} 
                modeContent={modeContent}
                petNumber={petCount > 1 ? currentPetIndex + 1 : undefined}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key={`step3-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSpecies petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(4)} onBack={handleBack} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key={`step4-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepBreed petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(5)} onBack={handleBack} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key={`step5-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepGender petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(6)} onBack={handleBack} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key={`step6-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepDOB petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(7)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key={`step7-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepLocation petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(8)} onBack={handleBack} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key={`step8-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSoul petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(9)} onBack={handleBack} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key={`step9-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSuperpower petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(10)} onBack={handleBack} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 10 && (
            <motion.div key={`step10-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepStrangers 
                petData={currentPetData} 
                onUpdate={updatePetData} 
                onNext={handleNextPetOrEmail} 
                onBack={handleBack} 
                totalSteps={stepsPerPet} 
              />
            </motion.div>
          )}

          {step === 11 && (
            <motion.div key="step-email" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepEmail 
                petData={currentPetData} 
                petsData={petsData}
                petCount={petCount}
                onUpdate={(data) => {
                  // Update email for all pets
                  if (data.email) {
                    setPetsData(prev => prev.map(pet => ({ ...pet, email: data.email! })));
                  }
                }} 
                onReveal={handleReveal} 
                onBack={() => {
                  setCurrentPetIndex(petCount - 1);
                  setStep(10);
                }} 
                totalSteps={stepsPerPet}
                modeContent={modeContent} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
