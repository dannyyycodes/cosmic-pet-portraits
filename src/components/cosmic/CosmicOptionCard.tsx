import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CosmicOptionCardProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

export function CosmicOptionCard({ 
  children, 
  selected, 
  onClick, 
  icon,
  description,
  className 
}: CosmicOptionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative w-full p-4 rounded-xl text-left transition-all duration-300',
        'border backdrop-blur-sm',
        selected 
          ? 'bg-primary/20 border-primary/50 text-foreground' 
          : 'bg-card/50 border-border hover:border-primary/30 hover:bg-card/70',
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Selection glow */}
      {selected && (
        <motion.div
          className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          layoutId="selection-glow"
        />
      )}
      
      <div className="relative flex items-center gap-3">
        {/* Icon */}
        {icon && (
          <motion.div 
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
              selected ? 'bg-primary/30' : 'bg-muted/50'
            )}
            animate={{ 
              rotate: selected ? [0, -5, 5, 0] : 0,
              scale: selected ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 0.4 }}
          >
            {icon}
          </motion.div>
        )}
        
        <div className="flex-1">
          <span className="font-medium">{children}</span>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        
        {/* Check indicator */}
        <motion.div
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
          )}
          animate={{ scale: selected ? 1 : 0.8 }}
        >
          {selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Particle effect on selection */}
      {selected && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-accent rounded-full"
              initial={{ 
                x: '50%', 
                y: '50%',
                opacity: 1 
              }}
              animate={{
                x: `${20 + Math.random() * 60}%`,
                y: `${20 + Math.random() * 60}%`,
                opacity: 0,
                scale: [1, 2, 0]
              }}
              transition={{ 
                duration: 0.6,
                delay: i * 0.05
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.button>
  );
}
