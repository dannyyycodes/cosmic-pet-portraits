import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepBreedProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

export function IntakeStepBreed({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepBreedProps) {
  const { t } = useLanguage();
  
  const getBreedPlaceholder = (species: string) => {
    switch (species) {
      case 'dog': return t('intake.breed.placeholderDog');
      case 'cat': return t('intake.breed.placeholderCat');
      case 'rabbit': return t('intake.breed.placeholderRabbit');
      case 'hamster': return t('intake.breed.placeholderHamster');
      case 'guinea_pig': return t('intake.breed.placeholderGuineaPig');
      case 'bird': return t('intake.breed.placeholderBird');
      case 'fish': return t('intake.breed.placeholderFish');
      case 'reptile': return t('intake.breed.placeholderReptile');
      case 'horse': return t('intake.breed.placeholderHorse');
      default: return t('intake.breed.placeholderDefault');
    }
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">{t('intake.step')} 3 {t('intake.of')} {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t('intake.breed.title').replace('{name}', petData.name)}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('intake.breed.subtitle')}
        </p>
      </div>

      <div className="space-y-6">
        <Input
          type="text"
          placeholder={getBreedPlaceholder(petData.species)}
          value={petData.breed}
          onChange={(e) => onUpdate({ breed: e.target.value })}
          className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
        />
        <p className="text-xs text-muted-foreground/60">{t('intake.breed.hint')}</p>
      </div>

      <Button
        onClick={onNext}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        {t('intake.continue')} ➝
      </Button>
    </div>
  );
}
