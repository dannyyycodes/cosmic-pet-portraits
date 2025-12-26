import { motion } from 'framer-motion';
import { OccasionMode } from '@/lib/occasionMode';
import { Sparkles, Cake, Heart, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepPetOccasionProps {
  petName?: string;
  petNumber?: number;
  selectedMode: OccasionMode;
  onSelect: (mode: OccasionMode) => void;
  onBack?: () => void;
}

export function IntakeStepPetOccasion({ 
  petName, 
  petNumber, 
  selectedMode, 
  onSelect,
  onBack 
}: IntakeStepPetOccasionProps) {
  const { t } = useLanguage();
  
  const occasions = [
    {
      id: 'discover' as OccasionMode,
      icon: Sparkles,
      title: "I'm curious about my pet",
      subtitle: "Find out what makes them tick — personality secrets, hidden quirks, and why you two just click.",
      gradient: 'from-violet-500 to-purple-600',
      bgGlow: 'bg-violet-500/20',
    },
    {
      id: 'birthday' as OccasionMode,
      icon: Cake,
      title: "It's birthday time!",
      subtitle: "Make the day unforgettable with a personalized cosmic portrait and what the stars say about the year ahead.",
      gradient: 'from-amber-400 to-orange-500',
      bgGlow: 'bg-amber-500/20',
    },
    {
      id: 'memorial' as OccasionMode,
      icon: Heart,
      title: "I lost my beloved pet",
      subtitle: "Create a beautiful tribute celebrating the love you shared. A keepsake honoring the paw prints left on your heart.",
      gradient: 'from-blue-400 to-indigo-500',
      bgGlow: 'bg-blue-500/20',
    },
  ];

  const handleSelect = (mode: OccasionMode) => {
    setTimeout(() => onSelect(mode), 150);
  };

  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm">
          <Star className="w-4 h-4" />
          <span>{petNumber ? `Pet ${petNumber}` : 'Your Journey'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          What brings you here today?
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          {petName ? `Choose the perfect reading for ${petName}` : 'Choose the perfect reading for your companion'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-3">
        {occasions.map((occasion, index) => {
          const Icon = occasion.icon;
          const isSelected = selectedMode === occasion.id;
          
          return (
            <motion.button
              key={occasion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => handleSelect(occasion.id)}
              className={`relative group p-4 rounded-xl border transition-all duration-300 text-left overflow-hidden ${
                isSelected 
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30' 
                  : 'border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card/80'
              }`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${occasion.bgGlow} blur-xl`} />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${occasion.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {occasion.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {occasion.subtitle}
                  </p>
                </div>

                {isSelected && (
                  <motion.div 
                    layoutId="pet-occasion-selected"
                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0"
                  >
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {onBack && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Go back
        </motion.button>
      )}
    </div>
  );
}
