import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';

interface ProgressBarProps {
  percentage: number;
  petName: string;
}

export function ProgressBar({ percentage, petName }: ProgressBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 py-3 px-4 overflow-hidden"
    >
      <div className="w-full max-w-2xl mx-auto px-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-foreground truncate mr-2">
            {petName}'s Cosmic Profile
          </span>
          <span className="text-xs sm:text-sm text-gold font-semibold whitespace-nowrap">
            {percentage}% Revealed
          </span>
        </div>
        <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-gold to-tangerine rounded-full"
          />
          
          {/* Milestone markers */}
          <div className="absolute inset-0 flex items-center">
            {[25, 50, 75, 100].map((milestone) => (
              <div 
                key={milestone} 
                className="absolute flex items-center justify-center"
                style={{ 
                  left: `calc(${milestone}% - ${milestone === 100 ? '8px' : '0px'})`, 
                  transform: milestone === 100 ? 'none' : 'translateX(-50%)' 
                }}
              >
                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[8px] ${
                  percentage >= milestone 
                    ? 'bg-gold text-background' 
                    : 'bg-muted/50 text-muted-foreground border border-muted'
                }`}>
                  {percentage >= milestone ? (
                    <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                  ) : (
                    <Lock className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-[9px] sm:text-[10px] text-muted-foreground">
          <span>Sun Sign</span>
          <span>Moon</span>
          <span>Rising</span>
          <span className={percentage >= 100 ? 'text-gold' : ''}>Full Chart</span>
        </div>
      </div>
    </motion.div>
  );
}