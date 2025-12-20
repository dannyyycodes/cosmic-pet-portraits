import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye } from 'lucide-react';

export function LiveActivityIndicator() {
  const [viewersCount, setViewersCount] = useState(0);
  const [purchasesToday, setPurchasesToday] = useState(0);

  useEffect(() => {
    // Simulate realistic viewer count (varies throughout the day)
    const hour = new Date().getHours();
    let baseViewers = 15;
    
    // Peak hours have more viewers
    if (hour >= 9 && hour <= 12) baseViewers = 35;
    else if (hour >= 18 && hour <= 22) baseViewers = 45;
    else if (hour >= 0 && hour <= 6) baseViewers = 8;
    
    const variance = Math.floor(Math.random() * 10) - 5;
    setViewersCount(baseViewers + variance);
    
    // Purchases today (realistic number)
    const dayProgress = (hour * 60 + new Date().getMinutes()) / (24 * 60);
    const basePurchases = Math.floor(47 * dayProgress) + 12;
    setPurchasesToday(basePurchases + Math.floor(Math.random() * 5));

    // Update every 30-60 seconds
    const interval = setInterval(() => {
      setViewersCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(5, prev + change);
      });
    }, 30000 + Math.random() * 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 text-xs">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 shadow-lg"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <Eye className="w-3 h-3 text-red-400" />
        <span className="text-foreground/90 font-medium">
          {viewersCount} watching
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 shadow-lg"
      >
        <Users className="w-3 h-3 text-primary" />
        <span className="text-foreground/90 font-medium">
          {purchasesToday} readings today
        </span>
      </motion.div>
    </div>
  );
}
