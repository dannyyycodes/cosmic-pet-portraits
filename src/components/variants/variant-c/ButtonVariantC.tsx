import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';

interface ButtonVariantCProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  bouncy?: boolean;
}

export const ButtonVariantC = forwardRef<HTMLButtonElement, ButtonVariantCProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, bouncy, children, disabled, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
    
    const variants = {
      primary: "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-400 hover:via-purple-400 hover:to-indigo-400 text-white shadow-lg shadow-purple-500/25 border-none",
      secondary: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25",
      outline: "border-2 border-purple-500 text-purple-500 hover:bg-purple-500/10",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm rounded-full",
      md: "px-6 py-3 text-sm rounded-full",
      lg: "px-8 py-4 text-base rounded-full",
      xl: "px-10 py-5 text-lg rounded-full",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        animate={bouncy && !disabled ? { y: [0, -5, 0] } : {}}
        transition={bouncy ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
        {...(props as any)}
      >
        {/* Shimmer effect */}
        <motion.span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        />
        
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            loading...
          </>
        ) : (
          <span className="relative flex items-center gap-2">
            {children}
          </span>
        )}
      </motion.button>
    );
  }
);

ButtonVariantC.displayName = 'ButtonVariantC';
