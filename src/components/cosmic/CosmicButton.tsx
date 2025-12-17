import { motion } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CosmicButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  glowing?: boolean;
  type?: 'button' | 'submit';
}

export const CosmicButton = forwardRef<HTMLButtonElement, CosmicButtonProps>(
  ({ children, onClick, disabled, variant = 'primary', size = 'md', className, glowing = true, type = 'button' }, ref) => {
    
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
      ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'relative rounded-xl font-medium transition-all duration-300 overflow-hidden',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        {/* Glow effect */}
        {glowing && variant === 'primary' && !disabled && (
          <motion.div
            className="absolute -inset-1 bg-gradient-to-r from-primary/60 via-accent/40 to-primary/60 rounded-xl blur-lg opacity-60"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
        
        {/* Content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {/* Particle burst on click */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          whileTap={{
            background: [
              'radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.3) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 50%, transparent 0%, transparent 70%)'
            ]
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    );
  }
);

CosmicButton.displayName = 'CosmicButton';
