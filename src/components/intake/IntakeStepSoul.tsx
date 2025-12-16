import { PetData } from './IntakeWizard';
import { ArrowLeft, Brain, Flame, Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface IntakeStepSoulProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

const soulOptions = [
  { id: 'old-soul', label: 'An Old Soul', description: 'Wise & Calm', icon: Brain },
  { id: 'wild-spirit', label: 'A Wild Spirit', description: 'Untamed & Independent', icon: Flame },
  { id: 'pure-joy', label: 'Pure Joy', description: 'Innocent & Playful', icon: Sparkles },
  { id: 'deep-healer', label: 'A Deep Healer', description: 'Sensitive & Loving', icon: Heart },
];

export function IntakeStepSoul({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepSoulProps) {
  const handleSelect = (soulType: string) => {
    onUpdate({ soulType });
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 7 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          When you gaze into their eyes, what soul do you see?
        </h1>
        <p className="text-muted-foreground text-lg">
          Trust your intuition about {petData.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {soulOptions.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(option.id)}
            className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 ${
              petData.soulType === option.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/50 bg-card/30 text-foreground hover:border-primary/50 hover:bg-card/50'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
              petData.soulType === option.id ? 'bg-primary/20' : 'bg-muted/30 group-hover:bg-primary/10'
            }`}>
              <option.icon className={`w-7 h-7 ${petData.soulType === option.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
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
