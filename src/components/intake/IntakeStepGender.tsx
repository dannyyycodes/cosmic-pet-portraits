import { PetData, PetGender } from './IntakeWizard';
import { ArrowLeft } from 'lucide-react';
import { FaMars, FaVenus } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepGenderProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

export function IntakeStepGender({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepGenderProps) {
  const { t } = useLanguage();
  
  const handleSelect = (gender: PetGender) => {
    onUpdate({ gender });
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">{t('intake.step')} 4 {t('intake.of')} {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t('intake.gender.title').replace('{name}', petData.name)}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('intake.gender.subtitle')}
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => handleSelect('boy')}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 min-w-[140px] ${
            petData.gender === 'boy'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
          }`}
        >
          <FaMars className="w-10 h-10" />
          <span className="font-medium text-lg">{t('intake.gender.boy')}</span>
        </button>
        <button
          onClick={() => handleSelect('girl')}
          className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 min-w-[140px] ${
            petData.gender === 'girl'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border/50 bg-card/30 text-muted-foreground hover:border-primary/50'
          }`}
        >
          <FaVenus className="w-10 h-10" />
          <span className="font-medium text-lg">{t('intake.gender.girl')}</span>
        </button>
      </div>
    </div>
  );
}
