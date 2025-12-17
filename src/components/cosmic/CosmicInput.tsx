import { motion } from 'framer-motion';
import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CosmicInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const CosmicInput = forwardRef<HTMLInputElement, CosmicInputProps>(
  ({ label, error, hint, className, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <motion.label 
            className="block text-sm text-muted-foreground"
            animate={{ color: isFocused ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          {/* Glow ring when focused */}
          <motion.div
            className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/50 via-accent/30 to-primary/50 blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
          
          <input
            ref={ref}
            className={cn(
              'relative w-full px-4 py-3 bg-card/80 backdrop-blur-sm border border-border rounded-xl',
              'text-foreground placeholder:text-muted-foreground/50',
              'focus:outline-none focus:border-primary/50',
              'transition-colors duration-200',
              error && 'border-destructive',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          
          {/* Sparkle effect on focus */}
          {isFocused && (
            <>
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-primary rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </div>
        
        {hint && !error && (
          <motion.p 
            className="text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {hint}
          </motion.p>
        )}
        
        {error && (
          <motion.p 
            className="text-xs text-destructive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

CosmicInput.displayName = 'CosmicInput';
