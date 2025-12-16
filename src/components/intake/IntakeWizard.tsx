import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntakeStep1 } from './IntakeStep1';
import { IntakeStep2 } from './IntakeStep2';
import { IntakeStep3 } from './IntakeStep3';
import { CosmicLoading } from './CosmicLoading';
import { MiniReport } from './MiniReport';

export interface PetData {
  name: string;
  species: 'dog' | 'cat' | '';
  dateOfBirth: Date | null;
  timeOfBirth: string;
  email: string;
}

export function IntakeWizard() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [petData, setPetData] = useState<PetData>({
    name: '',
    species: '',
    dateOfBirth: null,
    timeOfBirth: '',
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
    }, 3000);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  if (showResults) {
    return <MiniReport petData={petData} />;
  }

  if (isLoading) {
    return <CosmicLoading />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-16 rounded-full transition-all duration-300 ${
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
              <IntakeStep3
                petData={petData}
                onUpdate={updatePetData}
                onReveal={handleReveal}
                onBack={() => setStep(2)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
