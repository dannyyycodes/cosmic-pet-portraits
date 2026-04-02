import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COOKIE_CONSENT_KEY = 'cookie_consent';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', { analytics_storage: 'granted' });
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
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-max max-w-[calc(100vw-2rem)]"
        >
          <div className="flex items-center gap-3 bg-card/95 backdrop-blur-sm border border-border/60 rounded-full px-4 py-2.5 shadow-md text-[0.78rem] text-muted-foreground whitespace-nowrap">
            <span>
              We use cookies.{' '}
              <a href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Learn more
              </a>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleAccept}
                className="bg-primary text-primary-foreground font-medium px-3 py-1 rounded-full text-[0.75rem] hover:bg-primary/90 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors text-[0.75rem]"
              >
                No thanks
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
