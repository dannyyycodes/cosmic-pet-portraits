import { PetData, PetSpecies } from './IntakeWizard';
import { ArrowLeft, Dog, Cat, Rabbit, Bird, Fish, HelpCircle, Rat, Turtle } from 'lucide-react';
import { PiHorseBold } from 'react-icons/pi';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepSpeciesProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

export function IntakeStepSpecies({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepSpeciesProps) {
  const { t } = useLanguage();
  
  const speciesOptions: { id: PetSpecies; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'dog', labelKey: 'intake.species.dog', icon: <Dog className="w-6 h-6" /> },
    { id: 'cat', labelKey: 'intake.species.cat', icon: <Cat className="w-6 h-6" /> },
    { id: 'rabbit', labelKey: 'intake.species.rabbit', icon: <Rabbit className="w-6 h-6" /> },
    { id: 'hamster', labelKey: 'intake.species.hamster', icon: <Rat className="w-6 h-6" /> },
    { id: 'guinea_pig', labelKey: 'intake.species.guineaPig', icon: <Rat className="w-6 h-6" /> },
    { id: 'bird', labelKey: 'intake.species.bird', icon: <Bird className="w-6 h-6" /> },
    { id: 'fish', labelKey: 'intake.species.fish', icon: <Fish className="w-6 h-6" /> },
    { id: 'reptile', labelKey: 'intake.species.reptile', icon: <Turtle className="w-6 h-6" /> },
    { id: 'horse', labelKey: 'intake.species.horse', icon: <PiHorseBold className="w-6 h-6" /> },
    { id: 'other', labelKey: 'intake.species.other', icon: <HelpCircle className="w-6 h-6" /> },
  ];

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
        <p className="text-primary/80 text-sm uppercase tracking-widest">{t('intake.step')} 2 {t('intake.of')} {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t('intake.species.title').replace('{name}', petData.name)}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('intake.species.subtitle')}
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
            <span className="font-medium text-sm">{t(option.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
