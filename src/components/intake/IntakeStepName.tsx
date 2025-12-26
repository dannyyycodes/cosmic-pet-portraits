import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepNameProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack?: () => void;
  totalSteps: number;
  modeContent: ModeContent;
  petNumber?: number;
}

// Only allow letters, spaces, hyphens, and apostrophes
const NAME_REGEX = /^[a-zA-Z\s\-']+$/;
const MAX_NAME_LENGTH = 50;

export function IntakeStepName({ petData, onUpdate, onNext, onBack, totalSteps, modeContent, petNumber }: IntakeStepNameProps) {
  const { t } = useLanguage();
  const [error, setError] = useState('');
  
  const trimmedName = petData.name.trim();
  const isValid = trimmedName.length > 0 && trimmedName.length <= MAX_NAME_LENGTH && NAME_REGEX.test(trimmedName);

  const handleChange = (value: string) => {
    if (value.length > MAX_NAME_LENGTH) {
      setError(t('intake.name.errorLength').replace('{max}', String(MAX_NAME_LENGTH)));
      return;
    }
    
    if (value && !NAME_REGEX.test(value)) {
      setError(t('intake.name.errorChars'));
    } else {
      setError('');
    }
    
    onUpdate({ name: value });
  };

  return (
    <div className="space-y-8 text-center relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute -top-2 left-0 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {petNumber ? t('intake.name.titleMulti').replace('{number}', String(petNumber)) : modeContent.nameTitle}
        </h1>
        <p className="text-muted-foreground text-lg">
          {modeContent.nameSubtitle}
        </p>
      </div>

      <div className="space-y-2">
        <Input
          type="text"
          placeholder={t('intake.name.placeholder')}
          value={petData.name}
          onChange={(e) => handleChange(e.target.value)}
          className={`h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary ${error ? 'border-destructive' : ''}`}
          maxLength={MAX_NAME_LENGTH + 1}
        />
        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        {t('intake.continue')} ➝
      </Button>
    </div>
  );
}
