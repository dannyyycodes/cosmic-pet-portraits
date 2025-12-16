import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ArrowLeft } from 'lucide-react';

interface IntakeStepBreedProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

const getBreedPlaceholder = (species: string) => {
  switch (species) {
    case 'dog': return 'e.g., Golden Retriever, Labrador';
    case 'cat': return 'e.g., Siamese, Persian';
    case 'rabbit': return 'e.g., Holland Lop, Lionhead';
    case 'hamster': return 'e.g., Syrian, Dwarf';
    case 'guinea_pig': return 'e.g., American, Abyssinian';
    case 'bird': return 'e.g., Cockatiel, Budgie';
    case 'fish': return 'e.g., Betta, Goldfish';
    case 'reptile': return 'e.g., Bearded Dragon, Gecko';
    case 'horse': return 'e.g., Arabian, Quarter Horse';
    default: return 'Enter breed or type';
  }
};

export function IntakeStepBreed({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepBreedProps) {
  return (
    <div className="space-y-8 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 3 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          What breed is {petData.name}?
        </h1>
        <p className="text-muted-foreground text-lg">
          This helps us refine their cosmic profile.
        </p>
      </div>

      <div className="space-y-6">
        <Input
          type="text"
          placeholder={getBreedPlaceholder(petData.species)}
          value={petData.breed}
          onChange={(e) => onUpdate({ breed: e.target.value })}
          className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
        />
        <p className="text-xs text-muted-foreground/60">Leave blank if unknown or mixed breed</p>
      </div>

      <Button
        onClick={onNext}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        Continue ➝
      </Button>
    </div>
  );
}
