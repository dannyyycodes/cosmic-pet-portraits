import { motion } from 'framer-motion';

interface CosmicProgressProps {
  current: number;
  total: number;
  stepLabel?: string;
}

export function CosmicProgress({ current, total, stepLabel }: CosmicProgressProps) {
  const progressPercent = Math.min((current / total) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      {/* Simple progress bar */}
      <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      
      {/* Clear step indicator */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">
          {stepLabel || `Step ${current} of ${total}`}
        </span>
        <span className="text-xs font-medium text-primary">
          {Math.round(progressPercent)}% complete
        </span>
      </div>
    </div>
  );
}
