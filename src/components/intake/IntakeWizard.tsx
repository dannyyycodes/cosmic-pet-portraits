import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [step, setStep] = useState(0);
  const [petCount, setPetCount] = useState(1);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [petsData, setPetsData] = useState<PetData[]>([createEmptyPetData(mode)]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cosmicReport, setCosmicReport] = useState<CosmicReport | null>(null);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const stepStartTime = useRef<number>(Date.now());
  const { trackAction, intensity } = useEmotion();

  const modeContent = occasionModeContent[mode];

  // Restore saved progress on mount
  useEffect(() => {
    if (hasRestoredProgress) return;
    
    const saved = loadIntakeProgress();
    if (saved && saved.petsData.length > 0) {
      // Convert date strings back to Date objects
      const restoredPets = saved.petsData.map(pet => ({
        ...pet,
        dateOfBirth: pet.dateOfBirth ? new Date(pet.dateOfBirth) : null,
      }));
      
      setPetsData(restoredPets);
      setCurrentPetIndex(saved.currentPetIndex);
      setStep(saved.step);
      setPetCount(saved.petCount);
      
      toast.success('Welcome back! Your progress has been restored.');
    }
    setHasRestoredProgress(true);
  }, [hasRestoredProgress]);

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

  // Steps per pet (1-9), then email (10), then checkout (11)
  const stepsPerPet = 9;
  const totalSteps = 1 + (petCount * stepsPerPet) + 1; // pet count + pet steps + email

  // Calculate current global step for progress
  const getGlobalStep = () => {
    if (step === 0) return 0;
    if (step === 10) return 1 + (petCount * stepsPerPet) + 1; // Email step
    return 1 + (currentPetIndex * stepsPerPet) + step;
  };

  // Track step timing
  useEffect(() => {
    trackAction({ type: 'step_start' });
    stepStartTime.current = Date.now();
  }, [step, currentPetIndex, trackAction]);

  // Update pet count and initialize pet data array
  const handlePetCountChange = (count: number) => {
    setPetCount(count);
    const newPetsData = Array(count).fill(null).map((_, i) => 
      petsData[i] || createEmptyPetData(mode)
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

  const handleBack = (prevStep: number) => {
    trackAction({ type: 'back_pressed' });
    
    // If going back from step 1 and not the first pet, go to previous pet's last step
    if (prevStep === 0 && currentPetIndex > 0) {
      setCurrentPetIndex(currentPetIndex - 1);
      setStep(9);
    } else if (prevStep === 0 && currentPetIndex === 0) {
      setStep(0); // Go back to pet count selection
    } else {
      setStep(prevStep);
    }
  };

  const handleNextPetOrEmail = () => {
    if (currentPetIndex < petCount - 1) {
      // Move to next pet
      setCurrentPetIndex(currentPetIndex + 1);
      setStep(1);
    } else {
      // All pets done, go to email
      setStep(10);
    }
  };

  const handleReveal = async (checkoutData?: CheckoutData) => {
    setIsLoading(true);
    
    try {
      // Save all pets to database
      const email = petsData[0].email;
      const reportIds: string[] = [];

      for (const pet of petsData) {
        const { data: savedReport, error: dbError } = await supabase
          .from('pet_reports')
          .insert({
            email: email,
            pet_name: pet.name,
            species: pet.species,
            breed: pet.breed || null,
            gender: pet.gender || null,
            birth_date: pet.dateOfBirth?.toISOString().split('T')[0] || null,
            birth_location: pet.location || null,
            soul_type: pet.soulType || null,
            superpower: pet.superpower || null,
            stranger_reaction: pet.strangerReaction || null,
            occasion_mode: pet.occasionMode,
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error('Failed to save pet data');
        }
        reportIds.push(savedReport.id);
      }

      // Create checkout with volume discount
      if (checkoutData) {
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
            },
          }
        );

        if (checkoutError) {
          console.error('Checkout error:', checkoutError);
          throw new Error('Failed to create checkout session');
        }

        if (checkoutResult?.url) {
          // Clear saved progress before checkout
          clearIntakeProgress();
          window.location.href = checkoutResult.url;
          return;
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
      <SocialProofBar petName={currentPetData?.name || ''} />
      
      <div className="w-full max-w-xl relative z-10">
        {/* Progress bar - only show after pet count selection */}
        {step > 0 && (
          <CosmicProgress current={getGlobalStep()} total={totalSteps} />
        )}

        {/* Pet indicator for multi-pet flow */}
        {step > 0 && step < 10 && petCount > 1 && (
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
            <motion.div key="step0" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepPetCount 
                petCount={petCount} 
                onUpdate={handlePetCountChange} 
                onNext={() => goToStep(1)} 
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key={`step1-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepName 
                petData={currentPetData} 
                onUpdate={updatePetData} 
                onNext={() => goToStep(2)} 
                totalSteps={stepsPerPet} 
                modeContent={modeContent}
                petNumber={petCount > 1 ? currentPetIndex + 1 : undefined}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key={`step2-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSpecies petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(3)} onBack={() => handleBack(1)} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key={`step3-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepBreed petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(4)} onBack={() => handleBack(2)} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key={`step4-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepGender petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(5)} onBack={() => handleBack(3)} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key={`step5-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepDOB petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(6)} onBack={() => handleBack(4)} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key={`step6-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepLocation petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(7)} onBack={() => handleBack(5)} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key={`step7-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSoul petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(8)} onBack={() => handleBack(6)} totalSteps={stepsPerPet} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key={`step8-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSuperpower petData={currentPetData} onUpdate={updatePetData} onNext={() => goToStep(9)} onBack={() => handleBack(7)} totalSteps={stepsPerPet} />
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key={`step9-pet${currentPetIndex}`} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepStrangers 
                petData={currentPetData} 
                onUpdate={updatePetData} 
                onNext={handleNextPetOrEmail} 
                onBack={() => handleBack(8)} 
                totalSteps={stepsPerPet} 
              />
            </motion.div>
          )}

          {step === 10 && (
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
                  setStep(9);
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
