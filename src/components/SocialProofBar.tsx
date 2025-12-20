import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface RecentPurchase {
  pet_name: string;
  created_at: string;
}

const timeAgo = (date: string): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return '1 hour ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return 'today';
};

// Generate fake but realistic names
const fakeNames = [
  'Luna', 'Max', 'Bella', 'Charlie', 'Milo', 'Daisy', 'Cooper', 'Sadie', 
  'Buddy', 'Molly', 'Rocky', 'Maggie', 'Bear', 'Sophie', 'Duke', 'Chloe',
  'Tucker', 'Penny', 'Jack', 'Zoey', 'Oliver', 'Nala', 'Leo', 'Stella'
];

const getFakePurchase = (): RecentPurchase => {
  const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
  const minutesAgo = Math.floor(Math.random() * 15) + 1;
  const date = new Date(Date.now() - minutesAgo * 60 * 1000);
  return { pet_name: name, created_at: date.toISOString() };
};

export function SocialProofBar() {
  const [currentPurchase, setCurrentPurchase] = useState<RecentPurchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchRecentPurchases = async () => {
      try {
        // Try to get real recent purchases (last 24 hours)
        const { data } = await supabase
          .from('pet_reports')
          .select('pet_name, created_at')
          .eq('payment_status', 'paid')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        return data || [];
      } catch {
        return [];
      }
    };

    const showNotification = async () => {
      const recentPurchases = await fetchRecentPurchases();
      
      // Use real data if available, otherwise generate fake
      const purchase = recentPurchases.length > 0 
        ? recentPurchases[Math.floor(Math.random() * recentPurchases.length)]
        : getFakePurchase();
      
      setCurrentPurchase(purchase);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => setIsVisible(false), 5000);
    };

    // Show first notification after 8 seconds
    const initialTimeout = setTimeout(showNotification, 8000);
    
    // Then show every 25-40 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 25000 + Math.random() * 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && currentPurchase && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-4 right-4 z-50 max-w-xs"
        >
          <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple flex items-center justify-center text-lg">
                🐾
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {currentPurchase.pet_name}'s cosmic reading
                </p>
                <p className="text-xs text-muted-foreground">
                  ✨ purchased {timeAgo(currentPurchase.created_at)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
