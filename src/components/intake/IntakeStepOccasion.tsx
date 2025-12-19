import { motion } from 'framer-motion';
import { OccasionMode } from '@/lib/occasionMode';
import { Sparkles, Cake, Heart, RotateCcw } from 'lucide-react';
import { clearIntakeProgress } from '@/lib/intakeStorage';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepOccasionProps {
  selectedMode: OccasionMode;
  onSelect: (mode: OccasionMode) => void;
  showRestart?: boolean;
  onRestart?: () => void;
}

export function IntakeStepOccasion({ selectedMode, onSelect, showRestart, onRestart }: IntakeStepOccasionProps) {
  const { t } = useLanguage();
  
  const occasions = [
    {
      id: 'discover' as OccasionMode,
      icon: Sparkles,
      titleKey: 'intake.occasion.discover',
      subtitleKey: 'intake.occasion.discoverDesc',
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/20',
    },
    {
      id: 'birthday' as OccasionMode,
      icon: Cake,
      titleKey: 'intake.occasion.birthday',
      subtitleKey: 'intake.occasion.birthdayDesc',
      gradient: 'from-amber-400 to-orange-500',
      bgGlow: 'bg-amber-500/20',
    },
    {
      id: 'memorial' as OccasionMode,
      icon: Heart,
      titleKey: 'intake.occasion.memorial',
      subtitleKey: 'intake.occasion.memorialDesc',
      gradient: 'from-blue-400 to-indigo-500',
      bgGlow: 'bg-blue-500/20',
    },
  ];

  const handleSelect = (mode: OccasionMode) => {
    setTimeout(() => onSelect(mode), 200);
  };

  const handleRestart = () => {
    clearIntakeProgress();
    onRestart?.();
  };

  return (
    <div className="text-center space-y-8">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
          <Sparkles className="w-4 h-4" />
          <span>{t('intake.occasion.badge')}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t('intake.occasion.title')}
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          {t('intake.occasion.subtitle')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {occasions.map((occasion, index) => {
          const Icon = occasion.icon;
          const isSelected = selectedMode === occasion.id;
          
          return (
            <motion.button
              key={occasion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(occasion.id)}
              className={`relative group p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
                isSelected 
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                  : 'border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card/80'
              }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${occasion.bgGlow} blur-xl`} />
              
              <div className="relative z-10 space-y-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${occasion.gradient} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {t(occasion.titleKey)}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t(occasion.subtitleKey)}
                  </p>
                </div>
              </div>

              {isSelected && (
                <motion.div 
                  layoutId="occasion-selected"
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground/70 text-sm"
      >
        {t('intake.occasion.footer')}
      </motion.p>
    </div>
  );
}
