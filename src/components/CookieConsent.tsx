import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash immediately on page load
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
    // Enable analytics after consent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
        >
          <div className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-lg">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            
            <p className="text-sm text-foreground/80 pr-6">
              We use cookies to improve your experience.{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Learn more
              </a>
            </p>
            
            <button
              onClick={handleAccept}
              className="mt-3 w-full bg-primary text-primary-foreground text-sm font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
