import { useState } from 'react';
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
import { MiniReport } from './MiniReport';

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
}

export function IntakeWizard() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
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

  const totalSteps = 10;

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
              className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepName petData={petData} onUpdate={updatePetData} onNext={() => setStep(2)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSpecies petData={petData} onUpdate={updatePetData} onNext={() => setStep(3)} onBack={() => setStep(1)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepBreed petData={petData} onUpdate={updatePetData} onNext={() => setStep(4)} onBack={() => setStep(2)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepGender petData={petData} onUpdate={updatePetData} onNext={() => setStep(5)} onBack={() => setStep(3)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepDOB petData={petData} onUpdate={updatePetData} onNext={() => setStep(6)} onBack={() => setStep(4)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="step6" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepLocation petData={petData} onUpdate={updatePetData} onNext={() => setStep(7)} onBack={() => setStep(5)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 7 && (
            <motion.div key="step7" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSoul petData={petData} onUpdate={updatePetData} onNext={() => setStep(8)} onBack={() => setStep(6)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 8 && (
            <motion.div key="step8" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepSuperpower petData={petData} onUpdate={updatePetData} onNext={() => setStep(9)} onBack={() => setStep(7)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 9 && (
            <motion.div key="step9" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepStrangers petData={petData} onUpdate={updatePetData} onNext={() => setStep(10)} onBack={() => setStep(8)} totalSteps={totalSteps} />
            </motion.div>
          )}

          {step === 10 && (
            <motion.div key="step10" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
              <IntakeStepEmail petData={petData} onUpdate={updatePetData} onReveal={handleReveal} onBack={() => setStep(9)} totalSteps={totalSteps} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
