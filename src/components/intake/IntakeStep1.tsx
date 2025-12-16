import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { Dog, Cat, Rabbit, MapPin } from 'lucide-react';
import trustpilotStars from '@/assets/trustpilot-stars.png';

interface IntakeStep1Props {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  totalSteps: number;
}

export function IntakeStep1({ petData, onUpdate, onNext, totalSteps }: IntakeStep1Props) {
  const isValid = petData.name.trim() !== '' && petData.species !== '' && petData.location.trim() !== '';

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 1 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          What is your pet's true cosmic purpose?
        </h1>
        <p className="text-muted-foreground text-lg">
          92% of owners say this analysis changed their relationship forever.
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
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => onUpdate({ species: 'dog' })}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                petData.species === 'dog'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Dog className="w-8 h-8" />
              <span className="font-medium text-sm">Dog</span>
            </button>
            <button
              onClick={() => onUpdate({ species: 'cat' })}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                petData.species === 'cat'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Cat className="w-8 h-8" />
              <span className="font-medium text-sm">Cat</span>
            </button>
            <button
              onClick={() => onUpdate({ species: 'other' })}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
                petData.species === 'other'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Rabbit className="w-8 h-8" />
              <span className="font-medium text-sm">Other</span>
            </button>
          </div>
        </div>

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
          <p className="text-xs text-muted-foreground/60">Crucial for accurate chart calculation</p>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        Begin Analysis ➝
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
