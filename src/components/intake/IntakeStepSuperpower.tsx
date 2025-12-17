import { PetData } from './IntakeWizard';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSuperpowerOptions, PetSpecies } from '@/lib/speciesOptions';

interface IntakeStepSuperpowerProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

export function IntakeStepSuperpower({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepSuperpowerProps) {
  const baseSuperpowerOptions = getSuperpowerOptions((petData.species || 'other') as PetSpecies);
  const superpowerOptions = [
    ...baseSuperpowerOptions,
    { id: 'not-sure', label: "I'm Not Sure", description: 'Multiple might fit', icon: HelpCircle },
  ];
  
  const handleSelect = (superpower: string) => {
    onUpdate({ superpower });
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 8 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          What is {petData.name}'s secret superpower?
        </h1>
        <p className="text-muted-foreground text-lg">
          Every soul has a unique gift.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {superpowerOptions.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(option.id)}
            className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
              petData.superpower === option.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/50 bg-card/30 text-foreground hover:border-primary/50 hover:bg-card/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
              petData.superpower === option.id ? 'bg-primary/20' : 'bg-muted/30 group-hover:bg-primary/10'
            }`}>
              <option.icon className={`w-7 h-7 ${petData.superpower === option.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{option.label}</h3>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
