import { motion } from 'framer-motion';
import { useEmotion } from '@/contexts/EmotionContext';

interface CosmicProgressProps {
  current: number;
  total: number;
}

export function CosmicProgress({ current, total }: CosmicProgressProps) {
  const { emotion } = useEmotion();
  
  const progressPercent = (current / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Step indicators */}
      <div className="flex justify-center gap-2 mb-3">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < current;
          const isCurrent = stepNum === current;
          
          return (
            <motion.div
              key={i}
              className="relative"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <motion.div
                className={`h-2 w-6 rounded-full transition-colors duration-500 ${
                  isCompleted ? 'bg-primary' : isCurrent ? 'bg-accent' : 'bg-muted'
                }`}
                animate={isCurrent ? {
                  boxShadow: [
                    '0 0 0 0 hsl(var(--accent) / 0)',
                    '0 0 10px 2px hsl(var(--accent) / 0.5)',
                    '0 0 0 0 hsl(var(--accent) / 0)'
                  ]
                } : {}}
                transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              />
              
              {/* Completion sparkle */}
              {isCompleted && (
                <motion.div
                  className="absolute -top-1 left-1/2 w-1 h-1 bg-accent rounded-full"
                  initial={{ scale: 0, y: 0 }}
                  animate={{ scale: [0, 1.5, 0], y: -5 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Progress bar */}
      <div className="relative h-1 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      </div>
      
      {/* Emotional encouragement */}
      <motion.p
        className="text-center text-xs text-muted-foreground mt-2"
        key={emotion}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {emotion === 'excited' && '✨ The stars are dancing with joy! ✨'}
        {emotion === 'hesitant' && '🌙 Take your time, the cosmos waits patiently...'}
        {emotion === 'engaged' && '🌟 Beautiful progress through the cosmos...'}
        {emotion === 'thoughtful' && '💫 Your care illuminates the reading...'}
        {emotion === 'connected' && '⭐ A deep bond emerges from the stars...'}
        {emotion === 'curious' && `🔮 Step ${current} of ${total} in your cosmic journey`}
      </motion.p>
    </div>
  );
}
