import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { useState } from 'react';
import { ArrowLeft, Sparkles, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

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
    <div className="space-y-6 text-center relative">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute -top-2 left-0 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Clear value proposition */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">Personalized Cosmic Reading</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {petNumber ? t('intake.name.titleMulti').replace('{number}', String(petNumber)) : modeContent.nameTitle}
        </h1>
        
        <p className="text-muted-foreground text-base max-w-sm mx-auto">
          In 2 minutes, discover what makes your pet unique — their personality, hidden traits, and cosmic destiny.
        </p>
      </motion.div>

      <div className="space-y-2">
        <Input
          type="text"
          placeholder={t('intake.name.placeholder')}
          value={petData.name}
          onChange={(e) => handleChange(e.target.value)}
          className={`h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary ${error ? 'border-destructive' : ''}`}
          maxLength={MAX_NAME_LENGTH + 1}
          autoFocus
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

      {/* Privacy moved to subtle footer */}
      <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" />
        We never share your info
      </p>
    </div>
  );
}
