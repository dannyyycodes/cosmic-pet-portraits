import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';

interface IntakeStepNameProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  totalSteps: number;
  modeContent: ModeContent;
  petNumber?: number;
}

export function IntakeStepName({ petData, onUpdate, onNext, totalSteps, modeContent, petNumber }: IntakeStepNameProps) {
  const isValid = petData.name.trim() !== '';

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 1 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {petNumber ? `What's pet #${petNumber}'s name?` : modeContent.nameTitle}
        </h1>
        <p className="text-muted-foreground text-lg">
          {modeContent.nameSubtitle}
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

    </div>
  );
}
