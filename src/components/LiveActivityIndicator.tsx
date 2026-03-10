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

  // Compact inline version — warm theme
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "Cormorant, Georgia, serif", fontSize: "0.78rem" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(191,82,74,0.08)", border: "1px solid rgba(191,82,74,0.2)" }}>
        <span style={{ position: "relative", display: "inline-flex", width: 6, height: 6 }}>
          <span className="animate-ping" style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "#bf524a", opacity: 0.6 }}></span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#bf524a" }}></span>
        </span>
        <Eye style={{ width: 12, height: 12, color: "#bf524a" }} />
        <span style={{ color: "#4d443b", fontWeight: 600 }}>{viewersCount} shopping</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(74,140,92,0.08)", border: "1px solid rgba(74,140,92,0.2)" }}>
        <Gift style={{ width: 12, height: 12, color: "#4a8c5c" }} />
        <span style={{ color: "#4d443b", fontWeight: 600 }}>{purchasesToday} readings today</span>
      </div>
    </motion.div>
  );
}
