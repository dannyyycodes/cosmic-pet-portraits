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
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 py-3 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {petName}'s Cosmic Profile
          </span>
          <span className="text-sm text-gold font-semibold">
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
                style={{ left: `${milestone}%`, transform: 'translateX(-50%)' }}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                  percentage >= milestone 
                    ? 'bg-gold text-background' 
                    : 'bg-muted/50 text-muted-foreground border border-muted'
                }`}>
                  {percentage >= milestone ? (
                    <Check className="w-2.5 h-2.5" />
                  ) : (
                    <Lock className="w-2 h-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Sun Sign</span>
          <span>Moon</span>
          <span>Rising</span>
          <span className={percentage >= 100 ? 'text-gold' : ''}>Full Chart</span>
        </div>
      </div>
    </motion.div>
  );
}