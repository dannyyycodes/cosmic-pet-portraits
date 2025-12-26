import { PetData, PetGender } from './IntakeWizard';
import { ArrowLeft } from 'lucide-react';
import { FaMars, FaVenus } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import { ModeContent } from '@/lib/occasionMode';

interface IntakeStepGenderProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
  modeContent: ModeContent;
}

export function IntakeStepGender({ petData, onUpdate, onNext, onBack, totalSteps, modeContent }: IntakeStepGenderProps) {
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
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {modeContent.genderTitle(petData.name)}
        </h1>
        <p className="text-muted-foreground text-lg">
          {modeContent.genderSubtitle}
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
