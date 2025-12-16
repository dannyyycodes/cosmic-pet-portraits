import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ArrowLeft, MapPin } from 'lucide-react';

interface IntakeStepLocationProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

export function IntakeStepLocation({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepLocationProps) {
  const isValid = petData.location.trim() !== '';

  return (
    <div className="space-y-8 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 6 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Where was {petData.name} born?
        </h1>
        <p className="text-muted-foreground text-lg">
          Location is crucial for accurate chart calculation.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4" />
            Location of Birth
          </p>
          <Input
            type="text"
            placeholder="City, Country"
            value={petData.location}
            onChange={(e) => onUpdate({ location: e.target.value })}
            className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        Continue ➝
      </Button>
    </div>
  );
}
