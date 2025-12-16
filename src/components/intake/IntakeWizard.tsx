import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntakeStep1 } from './IntakeStep1';
import { IntakeStep2 } from './IntakeStep2';
import { IntakeStepSoul } from './IntakeStepSoul';
import { IntakeStepSuperpower } from './IntakeStepSuperpower';
import { IntakeStepStrangers } from './IntakeStepStrangers';
import { IntakeStepEmail } from './IntakeStepEmail';
import { CosmicLoading } from './CosmicLoading';
import { MiniReport } from './MiniReport';

export interface PetData {
  name: string;
  species: 'dog' | 'cat' | 'other' | '';
  location: string;
  dateOfBirth: Date | null;
  timeOfBirth: string;
  breed: string;
  soulType: string;
  superpower: string;
  strangerReaction: string;
  email: string;
}

export function IntakeWizard() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [petData, setPetData] = useState<PetData>({
    name: '',
    species: '',
    location: '',
    dateOfBirth: null,
    timeOfBirth: '',
    breed: '',
    soulType: '',
    superpower: '',
    strangerReaction: '',
    email: ''
  });

  const updatePetData = (data: Partial<PetData>) => {
    setPetData(prev => ({ ...prev, ...data }));
  };

  const handleReveal = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 3500);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const totalSteps = 6;

  if (showResults) {
    return <MiniReport petData={petData} />;
  }

  if (isLoading) {
    return <CosmicLoading />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl relative">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-12">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <IntakeStep1
                petData={petData}
                onUpdate={updatePetData}
                onNext={() => setStep(2)}
                totalSteps={totalSteps}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <IntakeStep2
                petData={petData}
                onUpdate={updatePetData}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
                totalSteps={totalSteps}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <IntakeStepSoul
                petData={petData}
                onUpdate={updatePetData}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
                totalSteps={totalSteps}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <IntakeStepSuperpower
                petData={petData}
                onUpdate={updatePetData}
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
                totalSteps={totalSteps}
              />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <IntakeStepStrangers
                petData={petData}
                onUpdate={updatePetData}
                onNext={() => setStep(6)}
                onBack={() => setStep(4)}
                totalSteps={totalSteps}
              />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <IntakeStepEmail
                petData={petData}
                onUpdate={updatePetData}
                onReveal={handleReveal}
                onBack={() => setStep(5)}
                totalSteps={totalSteps}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
