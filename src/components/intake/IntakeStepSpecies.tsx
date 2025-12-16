import { PetData, PetSpecies } from './IntakeWizard';
import { ArrowLeft, Dog, Cat, Rabbit, Bird, Fish, HelpCircle, Rat, Turtle } from 'lucide-react';
import { PiHorseBold } from 'react-icons/pi';

interface IntakeStepSpeciesProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

const speciesOptions: { id: PetSpecies; label: string; icon: React.ReactNode }[] = [
  { id: 'dog', label: 'Dog', icon: <Dog className="w-6 h-6" /> },
  { id: 'cat', label: 'Cat', icon: <Cat className="w-6 h-6" /> },
  { id: 'rabbit', label: 'Rabbit', icon: <Rabbit className="w-6 h-6" /> },
  { id: 'hamster', label: 'Hamster', icon: <Rat className="w-6 h-6" /> },
  { id: 'guinea_pig', label: 'Guinea Pig', icon: <Rat className="w-6 h-6" /> },
  { id: 'bird', label: 'Bird', icon: <Bird className="w-6 h-6" /> },
  { id: 'fish', label: 'Fish', icon: <Fish className="w-6 h-6" /> },
  { id: 'reptile', label: 'Reptile', icon: <Turtle className="w-6 h-6" /> },
  { id: 'horse', label: 'Horse', icon: <PiHorseBold className="w-6 h-6" /> },
  { id: 'other', label: 'Other', icon: <HelpCircle className="w-6 h-6" /> },
];

export function IntakeStepSpecies({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepSpeciesProps) {
  const handleSelect = (species: PetSpecies) => {
    onUpdate({ species });
    setTimeout(() => onNext(), 300);
  };

  return (
    <div className="space-y-8 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 2 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          What kind of pet is {petData.name}?
        </h1>
        <p className="text-muted-foreground text-lg">
          Select their species below.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {speciesOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${
              petData.species === option.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
            }`}
          >
            {option.icon}
            <span className="font-medium text-sm">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
