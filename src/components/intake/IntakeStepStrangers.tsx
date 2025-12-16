import { PetData } from './IntakeWizard';
import { ArrowLeft, PartyPopper, Eye, ShieldAlert, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';

interface IntakeStepStrangersProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

const strangerOptions = [
  { id: 'greeter', label: 'The Greeter', description: 'Jumps/licks immediately', icon: PartyPopper },
  { id: 'observer', label: 'The Observer', description: 'Watches from a distance', icon: Eye },
  { id: 'guardian', label: 'The Guardian', description: 'Vocalizes/stands ground', icon: ShieldAlert },
  { id: 'charmer', label: 'The Charmer', description: 'Belly up instantly', icon: HeartHandshake },
];

export function IntakeStepStrangers({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepStrangersProps) {
  const handleSelect = (strangerReaction: string) => {
    onUpdate({ strangerReaction });
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 9 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          How does {petData.name} react to new people?
        </h1>
        <p className="text-muted-foreground text-lg">
          First impressions reveal deep truths.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strangerOptions.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(option.id)}
            className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
              petData.strangerReaction === option.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/50 bg-card/30 text-foreground hover:border-primary/50 hover:bg-card/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
              petData.strangerReaction === option.id ? 'bg-primary/20' : 'bg-muted/30 group-hover:bg-primary/10'
            }`}>
              <option.icon className={`w-7 h-7 ${petData.strangerReaction === option.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
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
