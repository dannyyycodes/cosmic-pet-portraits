import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetData } from './IntakeWizard';

interface IntakeStepPortraitSelectProps {
  petsData: PetData[];
  portraitPetIndices: number[]; // Which pets are eligible for portraits
  selectedPetIndex: number | null;
  onSelect: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function IntakeStepPortraitSelect({
  petsData,
  portraitPetIndices,
  selectedPetIndex,
  onSelect,
  onNext,
  onBack,
}: IntakeStepPortraitSelectProps) {
  const eligiblePets = petsData.filter((_, idx) => portraitPetIndices.includes(idx));
  const canProceed = selectedPetIndex !== null;

  // If only one pet is eligible, auto-select and show different UI
  if (eligiblePets.length === 1) {
    return (
      <div className="space-y-6 text-center">
        <button
          onClick={onBack}
          className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nebula-purple/20 border border-nebula-purple/30"
        >
          <Camera className="w-4 h-4 text-nebula-purple" />
          <span className="text-nebula-purple text-sm font-medium">AI Portrait Included!</span>
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Ready for {petsData[portraitPetIndices[0]]?.name}'s Portrait
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Your gift includes an AI-generated cosmic portrait for{' '}
            <span className="text-primary font-medium">{petsData[portraitPetIndices[0]]?.name}</span>!
          </p>
        </div>

        <Button
          onClick={() => {
            onSelect(portraitPetIndices[0]);
            onNext();
          }}
          variant="gold"
          size="xl"
          className="w-full max-w-xs mx-auto"
        >
          <Camera className="w-5 h-5 mr-2" />
          Continue to Photo Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nebula-purple/20 border border-nebula-purple/30"
      >
        <Camera className="w-4 h-4 text-nebula-purple" />
        <span className="text-nebula-purple text-sm font-medium">AI Portrait Included!</span>
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Choose Your Portrait Pet
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Your gift includes{' '}
          <span className="text-primary font-medium">
            {portraitPetIndices.length} AI-generated cosmic portrait{portraitPetIndices.length > 1 ? 's' : ''}
          </span>
          ! Select which pet to create a portrait for:
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3 max-w-sm mx-auto"
      >
        {petsData.map((pet, idx) => {
          const isEligible = portraitPetIndices.includes(idx);
          const isSelected = selectedPetIndex === idx;

          if (!isEligible) return null;

          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                isSelected
                  ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
                  : 'border-border/50 bg-card/40 hover:border-primary/50'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {isSelected ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="text-xl">🐾</span>
                )}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-foreground">{pet.name || `Pet ${idx + 1}`}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {pet.species || 'Unknown species'}
                </p>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-primary"
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              )}
            </button>
          );
        })}
      </motion.div>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        variant="gold"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        <Camera className="w-5 h-5 mr-2" />
        Continue to Photo Upload
      </Button>
    </div>
  );
}
