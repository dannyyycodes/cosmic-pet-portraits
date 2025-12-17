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
      {/* Fixed corner social proof - subtle and non-intrusive */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-4 left-4 z-40 flex flex-col gap-1.5 text-[10px] text-muted-foreground/70 bg-background/30 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-border/20"
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
          </span>
          <Eye className="w-2.5 h-2.5" />
          <span><strong className="text-foreground/80">{viewers}</strong> viewing</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Users className="w-2.5 h-2.5" />
          <span><strong className="text-foreground/80">{recentPurchases}</strong> today</span>
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
