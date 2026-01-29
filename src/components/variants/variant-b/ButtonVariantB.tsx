import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonVariantBProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  pulse?: boolean;
}

export const ButtonVariantB = forwardRef<HTMLButtonElement, ButtonVariantBProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, pulse, children, disabled, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-500/25 border-none",
      secondary: "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/25",
      outline: "border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs rounded-lg",
      md: "px-6 py-3 text-sm rounded-lg",
      lg: "px-8 py-4 text-base rounded-xl",
      xl: "px-10 py-5 text-lg rounded-xl",
    };

    return (
      <motion.button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...(props as any)}
      >
        {/* Pulse animation ring */}
        {pulse && !disabled && (
          <motion.span
            className="absolute inset-0 rounded-xl border-2 border-red-500"
            animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
        
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

ButtonVariantB.displayName = 'ButtonVariantB';
