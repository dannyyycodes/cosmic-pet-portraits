import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import trustpilotStars from '@/assets/trustpilot-stars.png';

interface IntakeStepNameProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  totalSteps: number;
}

export function IntakeStepName({ petData, onUpdate, onNext, totalSteps }: IntakeStepNameProps) {
  const isValid = petData.name.trim() !== '';

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 1 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          What is your pet's name?
        </h1>
        <p className="text-muted-foreground text-lg">
          Let's begin their cosmic journey.
        </p>
      </div>

      <div className="space-y-6">
        <Input
          type="text"
          placeholder="Pet's Name"
          value={petData.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
        />
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

      {/* Trust Badge */}
      <div className="flex flex-col items-center gap-2 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Rated 4.9/5</span>
          <img src={trustpilotStars} alt="Trustpilot" className="h-5" />
        </div>
      </div>
    </div>
  );
}
