import { motion } from 'framer-motion';
import { OccasionMode } from '@/lib/occasionMode';
import { Sparkles, Cake, Heart, RotateCcw, Star, Palette, Calendar, Clock } from 'lucide-react';
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
      details: 'Explore their zodiac sign, personality traits, hidden gifts, and cosmic purpose.',
      features: ['Full birth chart analysis', 'Personality insights', 'Care & bonding tips'],
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/20',
    },
    {
      id: 'birthday' as OccasionMode,
      icon: Cake,
      titleKey: 'intake.occasion.birthday',
      subtitleKey: 'intake.occasion.birthdayDesc',
      details: 'Celebrate their special day with a personalized cosmic birthday portrait.',
      features: ['Birthday-themed reading', 'Year ahead predictions', 'Shareable celebration card'],
      gradient: 'from-amber-400 to-orange-500',
      bgGlow: 'bg-amber-500/20',
    },
    {
      id: 'memorial' as OccasionMode,
      icon: Heart,
      titleKey: 'intake.occasion.memorial',
      subtitleKey: 'intake.occasion.memorialDesc',
      details: 'Honor their beautiful spirit with a heartfelt tribute to their cosmic soul.',
      features: ['Eternal soul portrait', 'Memory keepsake', 'Legacy of love tribute'],
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

      <div className="grid grid-cols-1 gap-4">
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
              
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${occasion.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">
                      {t(occasion.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-0.5">
                      {t(occasion.subtitleKey)}
                    </p>
                    <p className="text-foreground/80 text-sm mt-2">
                      {occasion.details}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {occasion.features.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground text-xs"
                        >
                          <Star className="w-3 h-3" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-6 text-muted-foreground/70 text-sm"
      >
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          2 minutes to complete
        </span>
        <span className="flex items-center gap-1.5">
          <Palette className="w-4 h-4" />
          Personalized reading
        </span>
      </motion.div>
    </div>
  );
}
