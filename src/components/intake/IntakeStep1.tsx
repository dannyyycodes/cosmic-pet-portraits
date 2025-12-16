import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { Dog, Cat } from 'lucide-react';

interface IntakeStep1Props {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
}

export function IntakeStep1({ petData, onUpdate, onNext }: IntakeStep1Props) {
  const isValid = petData.name.trim() !== '' && petData.species !== '';

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 1 of 3</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Who are we analyzing today?
        </h1>
        <p className="text-muted-foreground text-lg">
          Enter your companion's details to begin the cosmic scan.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Pet's Name"
            value={petData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Species</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onUpdate({ species: 'dog' })}
              className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all duration-300 ${
                petData.species === 'dog'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Dog className="w-10 h-10" />
              <span className="font-medium">Dog</span>
            </button>
            <button
              onClick={() => onUpdate({ species: 'cat' })}
              className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all duration-300 ${
                petData.species === 'cat'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Cat className="w-10 h-10" />
              <span className="font-medium">Cat</span>
            </button>
          </div>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        Continue
      </Button>
    </div>
  );
}
