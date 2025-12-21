import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Gift } from 'lucide-react';

export function UrgencyBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Christmas countdown - December 25th
    const getChristmasDate = () => {
      const now = new Date();
      const christmas = new Date(now.getFullYear(), 11, 25); // December 25
      if (now > christmas) {
        christmas.setFullYear(christmas.getFullYear() + 1);
      }
      return christmas.getTime();
    };

    const endTime = getChristmasDate();

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

  const dismissed = localStorage.getItem('astropets_xmas_banner_dismissed');
  if (dismissed === 'true' || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('astropets_xmas_banner_dismissed', 'true');
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-50 bg-gradient-to-r from-red-600 via-green-700 to-red-600 overflow-hidden"
        >
          {/* Festive pattern overlay */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L32 15 L30 12 L28 15 Z' fill='white'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
          </div>
          
          <div className="relative container mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-white text-sm sm:text-base">
            <Gift className="w-4 h-4 hidden sm:block animate-bounce" />
            
            <span className="font-medium">
              <span className="hidden sm:inline">🎄 Christmas Sale: </span>
              <span className="text-yellow-300 font-bold">Holiday Special</span>
              <span className="hidden sm:inline"> - The Perfect Gift!</span>
            </span>
            
            <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono font-bold tabular-nums text-xs sm:text-sm">
                {timeLeft.days}d {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
              </span>
            </div>
            
            <span className="hidden md:inline text-white/90">
              🎁 <span className="font-bold text-yellow-300">FREE</span> gift wrapping
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
