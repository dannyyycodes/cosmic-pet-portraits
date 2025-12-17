import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Sparkles } from 'lucide-react';

interface SocialProofBarProps {
  petName: string;
  position?: 'top' | 'bottom';
}

export function SocialProofBar({ petName, position = 'top' }: SocialProofBarProps) {
  const [viewers, setViewers] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  // Simulate live viewers (realistic fluctuation)
  useEffect(() => {
    const baseViewers = Math.floor(Math.random() * 15) + 23;
    setViewers(baseViewers);
    
    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(15, Math.min(50, prev + change));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Recent purchases counter
  useEffect(() => {
    const basePurchases = Math.floor(Math.random() * 20) + 47;
    setRecentPurchases(basePurchases);
    
    const interval = setInterval(() => {
      setRecentPurchases(prev => prev + 1);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }, Math.random() * 30000 + 20000);

    return () => clearInterval(interval);
  }, []);

  const petNames = ['Luna', 'Max', 'Bella', 'Charlie', 'Milo', 'Daisy', 'Oscar', 'Coco'];
  const [randomPet] = useState(() => petNames[Math.floor(Math.random() * petNames.length)]);

  return (
    <>
      {/* Top bar social proof */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50`}
      >
        <div className="bg-gradient-to-r from-primary/90 via-cosmic-gold/80 to-primary/90 backdrop-blur-md px-4 py-2">
          <div className="max-w-xl mx-auto flex items-center justify-center gap-6 text-xs">
            {/* Live viewers */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <Eye className="w-3.5 h-3.5 text-primary-foreground/80" />
              <span className="text-primary-foreground font-medium">
                <strong>{viewers}</strong> viewing now
              </span>
            </div>
            
            <div className="w-px h-4 bg-primary-foreground/30" />
            
            {/* Reports today */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground/80" />
              <span className="text-primary-foreground font-medium">
                <strong>{recentPurchases}</strong> readings today
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Purchase notification toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed top-16 left-4 z-50 flex items-center gap-3 bg-card/95 backdrop-blur-md border border-cosmic-gold/30 rounded-xl p-3 shadow-xl shadow-cosmic-gold/10"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cosmic-gold to-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🐾</span>
            </div>
            <div className="text-xs">
              <p className="text-foreground font-medium">{randomPet}'s reading unlocked!</p>
              <p className="text-muted-foreground">just now</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
