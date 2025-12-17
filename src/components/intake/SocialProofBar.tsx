import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Users } from 'lucide-react';

interface SocialProofBarProps {
  petName: string;
}

export function SocialProofBar({ petName }: SocialProofBarProps) {
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
      {/* Fixed corner social proof - visible but not intrusive */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 text-xs bg-card/80 backdrop-blur-md rounded-xl px-4 py-3 border border-primary/20 shadow-lg shadow-primary/10"
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <Eye className="w-3.5 h-3.5 text-primary/70" />
          <span className="text-muted-foreground"><strong className="text-foreground">{viewers}</strong> viewing now</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-nebula-pink/60"></span>
          <Users className="w-3.5 h-3.5 text-primary/70" />
          <span className="text-muted-foreground"><strong className="text-foreground">{recentPurchases}</strong> reports today</span>
        </div>
      </motion.div>

      {/* Purchase notification toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-20 left-4 z-50 flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg p-2.5 shadow-xl max-w-[200px]"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple flex items-center justify-center flex-shrink-0">
              <span className="text-[10px]">🐾</span>
            </div>
            <div className="text-[10px]">
              <p className="text-foreground/90 font-medium">{randomPet}'s report unlocked!</p>
              <p className="text-muted-foreground/70">just now</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
