import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExitIntentPopupProps {
  isEnabled?: boolean;
  couponCode?: string;
  discountPercent?: number;
  onClose?: () => void;
}

export function ExitIntentPopup({ 
  isEnabled = true, 
  couponCode = 'STAYCOSMIC10',
  discountPercent = 10,
  onClose 
}: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes in seconds

  // Check if popup was already shown in this session
  useEffect(() => {
    const exitPopupShown = sessionStorage.getItem('exitPopupShown');
    if (exitPopupShown) {
      setHasShown(true);
    }
  }, []);

  // Handle mouse leave detection (exit intent)
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves from the top of the page
    if (e.clientY <= 0 && !hasShown && isEnabled) {
      setIsVisible(true);
      setHasShown(true);
      sessionStorage.setItem('exitPopupShown', 'true');
    }
  }, [hasShown, isEnabled]);

  // Add/remove event listener
  useEffect(() => {
    if (!isEnabled || hasShown) return;

    // Small delay before enabling exit intent detection
    const timeout = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseLeave, isEnabled, hasShown]);

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md w-full z-50"
          >
            <div className="relative bg-gradient-to-br from-card via-card to-primary/5 border border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/50 hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative p-6 text-center space-y-4">
                {/* Icon */}
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                  className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cosmic-gold to-primary flex items-center justify-center"
                >
                  <Gift className="w-8 h-8 text-background" />
                </motion.div>

                {/* Headline */}
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Wait! Don't Leave Empty-Pawed! 🐾
                  </h2>
                  <p className="text-muted-foreground">
                    Here's a special gift just for you
                  </p>
                </div>

                {/* Discount offer */}
                <div className="py-4 px-6 rounded-xl bg-gradient-to-r from-cosmic-gold/20 to-primary/20 border border-cosmic-gold/30">
                  <p className="text-sm text-muted-foreground mb-1">Your exclusive discount</p>
                  <p className="text-4xl font-display font-bold text-cosmic-gold">
                    {discountPercent}% OFF
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    Any Cosmic Pet Reading
                  </p>
                </div>

                {/* Coupon code */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Use code at checkout:</p>
                  <div 
                    onClick={handleCopyCode}
                    className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-background/80 border-2 border-dashed border-primary/50 cursor-pointer hover:border-primary transition-colors"
                  >
                    <code className="text-xl font-mono font-bold text-primary tracking-widest">
                      {couponCode}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {copied ? '✓ Copied!' : '(click to copy)'}
                    </span>
                  </div>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Offer expires in</span>
                  <span className="font-mono font-bold text-cosmic-gold">{formatTime(countdown)}</span>
                </div>

                {/* CTA */}
                <Button
                  onClick={handleClose}
                  variant="gold"
                  size="lg"
                  className="w-full group"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Continue My Reading
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                {/* No thanks */}
                <button
                  onClick={handleClose}
                  className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  No thanks, I'll pay full price
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
