import { motion } from 'framer-motion';
import { Dog, Plus, Minus, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { clearIntakeProgress } from '@/lib/intakeStorage';

interface IntakeStepPetCountProps {
  petCount: number;
  onUpdate: (count: number) => void;
  onNext: () => void;
  showRestart?: boolean;
  onRestart?: () => void;
}

export function IntakeStepPetCount({ petCount, onUpdate, onNext, showRestart, onRestart }: IntakeStepPetCountProps) {
  const { t } = useLanguage();

  const handleRestart = () => {
    clearIntakeProgress();
    onRestart?.();
  };

  return (
    <div className="space-y-8 text-center">
      {showRestart && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          {t('intake.occasion.startFresh')}
        </motion.button>
      )}

      <div className="space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-nebula-purple mx-auto mb-4"
        >
          <Dog className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t('intake.petCount.title')}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('intake.petCount.subtitle')}
        </p>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => onUpdate(Math.max(1, petCount - 1))}
          disabled={petCount <= 1}
          className="w-14 h-14 rounded-full border-2 border-border/50 bg-card/30 flex items-center justify-center transition-all hover:border-primary/50 hover:bg-card/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-6 h-6 text-foreground" />
        </button>
        
        <motion.div
          key={petCount}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-nebula-purple/20 border-2 border-primary/50 flex items-center justify-center"
        >
          <span className="text-5xl font-display font-bold text-foreground">{petCount}</span>
        </motion.div>
        
        <button
          onClick={() => onUpdate(Math.min(5, petCount + 1))}
          disabled={petCount >= 5}
          className="w-14 h-14 rounded-full border-2 border-border/50 bg-card/30 flex items-center justify-center transition-all hover:border-primary/50 hover:bg-card/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-6 h-6 text-foreground" />
        </button>
      </div>

      <Button
        onClick={onNext}
        variant="cosmic"
        size="xl"
        className="w-full max-w-sm mx-auto"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {petCount === 1 ? t('intake.petCount.letsBegin') : t('intake.petCount.continueWith').replace('{count}', String(petCount))}
      </Button>
    </div>
  );
}
