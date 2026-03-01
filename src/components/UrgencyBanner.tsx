import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Sparkles } from 'lucide-react';

export function UrgencyBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // New Year offer ends January 5th
    const getEndDate = () => {
      const now = new Date();
      const endDate = new Date(now.getFullYear(), 0, 5, 23, 59, 59); // January 5th
      if (now > endDate) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      return endDate.getTime();
    };

    const endTime = getEndDate();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, endTime - now);
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const dismissed = sessionStorage.getItem('littlesouls_banner_dismissed');
  if (dismissed === 'true' || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('littlesouls_banner_dismissed', 'true');
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-50 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 overflow-hidden"
        >
          {/* Sparkle overlay */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
          
          <div className="relative container mx-auto px-4 py-2.5 flex items-center justify-center gap-2 sm:gap-3 text-white text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 hidden sm:block" />
            
            <span className="font-medium">
              <span className="hidden sm:inline">🎉 </span>
              <span className="font-bold text-yellow-200">NEW YEAR SALE</span>
              <span className="hidden sm:inline"> 20% OFF</span>
              <span className="sm:hidden"> 20% OFF</span>
            </span>
            
            <span className="hidden sm:inline">use code</span>
            <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-yellow-200">NEWYEAR20</span>
            
            <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              <span className="font-mono font-bold tabular-nums">
                {timeLeft.days > 0 && `${timeLeft.days}d `}{formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
              </span>
            </div>
            
            <button
              onClick={handleDismiss}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
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
