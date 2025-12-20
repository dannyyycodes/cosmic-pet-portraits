import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Sparkles } from 'lucide-react';

export function UrgencyBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Create a countdown that resets every 24 hours from first visit
    const getEndTime = () => {
      const stored = localStorage.getItem('astropets_offer_end');
      if (stored) {
        const endTime = parseInt(stored);
        if (endTime > Date.now()) {
          return endTime;
        }
      }
      // Set new end time 23 hours from now for urgency
      const newEndTime = Date.now() + 23 * 60 * 60 * 1000;
      localStorage.setItem('astropets_offer_end', newEndTime.toString());
      return newEndTime;
    };

    const endTime = getEndTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, endTime - now);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const dismissed = localStorage.getItem('astropets_banner_dismissed');
  if (dismissed === 'true' || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('astropets_banner_dismissed', 'true');
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-50 bg-gradient-to-r from-nebula-purple via-primary to-nebula-pink overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-50" />
          
          <div className="relative container mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-white text-sm sm:text-base">
            <Sparkles className="w-4 h-4 hidden sm:block animate-pulse" />
            
            <span className="font-medium">
              <span className="hidden sm:inline">🎁 Special Offer: </span>
              <span className="text-cosmic-gold font-bold">20% OFF</span>
              <span className="hidden sm:inline"> your first reading</span>
            </span>
            
            <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono font-bold tabular-nums">
                {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
              </span>
            </div>
            
            <span className="hidden md:inline text-white/80">
              Code: <span className="font-bold text-white">COSMIC20</span>
            </span>
            
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
