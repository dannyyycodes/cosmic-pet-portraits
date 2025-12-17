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
  const randomPet = petNames[Math.floor(Math.random() * petNames.length)];

  return (
    <div className="space-y-3">
      {/* Live activity bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-6 text-xs text-muted-foreground"
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <Eye className="w-3 h-3" />
          <span><strong className="text-foreground">{viewers}</strong> viewing now</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          <span><strong className="text-foreground">{recentPurchases}</strong> reports today</span>
        </div>
      </motion.div>


      {/* Purchase notification toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-card border border-border rounded-lg p-3 shadow-xl"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple flex items-center justify-center">
              <span className="text-xs">🐾</span>
            </div>
            <div className="text-sm">
              <p className="text-foreground font-medium">Someone just unlocked {randomPet}'s report!</p>
              <p className="text-muted-foreground text-xs">A few seconds ago</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
