import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Gift } from 'lucide-react';

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

  // Compact inline version for hero section
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
        </span>
        <Eye className="w-3 h-3 text-red-400" />
        <span className="text-foreground/80 font-medium">{viewersCount} shopping</span>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
        <Gift className="w-3 h-3 text-green-400" />
        <span className="text-foreground/80 font-medium">{purchasesToday} gifts sent today</span>
      </div>
    </motion.div>
  );
}
