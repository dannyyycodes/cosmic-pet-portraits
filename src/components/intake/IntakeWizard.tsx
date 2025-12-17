import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Wrapper component with EmotionProvider
export function IntakeWizard({ mode }: IntakeWizardProps) {
  return (
    <EmotionProvider>
      <IntakeWizardContent mode={mode} />
    </EmotionProvider>
  );
}

function IntakeWizardContent({ mode }: IntakeWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cosmicReport, setCosmicReport] = useState<CosmicReport | null>(null);
  const stepStartTime = useRef<number>(Date.now());
  const { trackAction, intensity, getEmotionalLanguage } = useEmotion();
  
  const [petData, setPetData] = useState<PetData>({
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

  const modeContent = occasionModeContent[mode];

  // Track step timing
  useEffect(() => {
    trackAction({ type: 'step_start' });
    stepStartTime.current = Date.now();
  }, [step, trackAction]);

  const updatePetData = (data: Partial<PetData>) => {
    setPetData(prev => ({ ...prev, ...data }));
    // Track input detail level for emotion detection
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
    setStep(prevStep);
  };

  const handleReveal = async (checkoutData?: CheckoutData) => {
    setIsLoading(true);
    
    try {
      // Save to database first
      const { data: savedReport, error: dbError } = await supabase
        .from('pet_reports')
        .insert({
          email: petData.email,
          pet_name: petData.name,
          species: petData.species,
          breed: petData.breed || null,
          gender: petData.gender || null,
          birth_date: petData.dateOfBirth?.toISOString().split('T')[0] || null,
          birth_location: petData.location || null,
          soul_type: petData.soulType || null,
          superpower: petData.superpower || null,
          stranger_reaction: petData.strangerReaction || null,
          occasion_mode: petData.occasionMode,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save pet data');
      }

      // If checkout data exists, create Stripe checkout session
      if (checkoutData && checkoutData.selectedProducts.length > 0) {
        const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke(
          'create-checkout',
          {
            body: {
              reportId: savedReport.id,
              selectedProducts: checkoutData.selectedProducts,
              couponId: checkoutData.couponId,
              giftCertificateId: checkoutData.giftCertificateId,
              isGift: checkoutData.isGift,
              recipientName: checkoutData.recipientName,
              recipientEmail: checkoutData.recipientEmail,
              giftMessage: checkoutData.giftMessage,
              totalCents: checkoutData.totalCents,
            },
          }
        );

        if (checkoutError) {
          console.error('Checkout error:', checkoutError);
          throw new Error('Failed to create checkout session');
        }

        // Redirect to Stripe checkout or success page
        if (checkoutResult?.url) {
          window.location.href = checkoutResult.url;
          return; // Don't set loading to false, page is navigating away
        }
      }

      // Fallback: generate report directly (shouldn't happen normally)
      const { data: reportData, error: fnError } = await supabase.functions.invoke('generate-cosmic-report', {
        body: { 
          petData: {
            ...petData,
            dateOfBirth: petData.dateOfBirth?.toISOString()
          },
          reportId: savedReport.id 
        }
      });

      if (fnError) {
        console.error('Function error:', fnError);
        throw new Error('Failed to generate cosmic report');
      }

      if (reportData?.report) {
        setCosmicReport(reportData.report);
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

  const totalSteps = 10;

  if (showResults) {
    return <MiniReport petData={petData} cosmicReport={cosmicReport} />;
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Immersive starfield background */}
      <StarfieldBackground intensity={intensity} interactive />
      
      {/* Persistent social proof in corner */}
      <SocialProofBar petName={petData.name} />
      
      <div className="w-full max-w-xl relative z-10">
        {/* Enhanced cosmic progress */}
        <CosmicProgress current={step} total={totalSteps} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepName petData={petData} onUpdate={updatePetData} onNext={() => goToStep(2)} totalSteps={totalSteps} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSpecies petData={petData} onUpdate={updatePetData} onNext={() => goToStep(3)} onBack={() => handleBack(1)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepBreed petData={petData} onUpdate={updatePetData} onNext={() => goToStep(4)} onBack={() => handleBack(2)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepGender petData={petData} onUpdate={updatePetData} onNext={() => goToStep(5)} onBack={() => handleBack(3)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepDOB petData={petData} onUpdate={updatePetData} onNext={() => goToStep(6)} onBack={() => handleBack(4)} totalSteps={totalSteps} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepLocation petData={petData} onUpdate={updatePetData} onNext={() => goToStep(7)} onBack={() => handleBack(5)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key="step7" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSoul petData={petData} onUpdate={updatePetData} onNext={() => goToStep(8)} onBack={() => handleBack(6)} totalSteps={totalSteps} modeContent={modeContent} />
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key="step8" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSuperpower petData={petData} onUpdate={updatePetData} onNext={() => goToStep(9)} onBack={() => handleBack(7)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key="step9" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepStrangers petData={petData} onUpdate={updatePetData} onNext={() => goToStep(10)} onBack={() => handleBack(8)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 10 && (
            <motion.div key="step10" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepEmail petData={petData} onUpdate={updatePetData} onReveal={handleReveal} onBack={() => handleBack(9)} totalSteps={totalSteps} modeContent={modeContent} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
