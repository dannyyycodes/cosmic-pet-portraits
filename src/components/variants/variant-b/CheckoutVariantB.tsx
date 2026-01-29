import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Clock, CheckCircle, Users, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutVariantBProps {
  petName: string;
  petCount: number;
  onSelectTier: (tier: 'basic' | 'premium' | 'vip') => void;
  selectedTier: 'basic' | 'premium' | 'vip';
  baseTotal: number;
  volumeDiscount: number;
}

export function CheckoutVariantB({ 
  petName, 
  petCount, 
  onSelectTier, 
  selectedTier,
  baseTotal,
  volumeDiscount 
}: CheckoutVariantBProps) {
  const [countdown, setCountdown] = useState({ minutes: 9, seconds: 47 });
  const [spotsLeft, setSpotsLeft] = useState(7);
  const [recentPurchases, setRecentPurchases] = useState(23);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds === 0) {
          if (prev.minutes === 0) {
            return { minutes: 9, seconds: 59 }; // Reset
          }
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fake scarcity updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSpotsLeft(prev => Math.max(2, prev - 1));
        setRecentPurchases(prev => prev + 1);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const tiers = [
    {
      id: 'basic' as const,
      name: 'FULL READING',
      price: 35,
      originalPrice: 79,
      features: ['Complete cosmic personality analysis', 'Behavioral insights decoded', 'Bond-strengthening tips'],
      urgency: 'Most affordable',
    },
    {
      id: 'premium' as const,
      name: 'KEEPSAKE CARD',
      price: 50,
      originalPrice: 99,
      features: ['Everything in Full Reading', 'Beautiful printed cosmic card', 'Perfect for framing or gifting'],
      urgency: 'MOST POPULAR',
      popular: true,
    },
    {
      id: 'vip' as const,
      name: 'VIP ALL-ACCESS',
      price: 129,
      originalPrice: 249,
      features: ['Everything in Keepsake', 'Weekly personalized updates', 'Ongoing cosmic guidance'],
      urgency: 'Best value',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Urgency Header */}
      <div className="bg-red-600 text-white rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span className="font-bold text-sm uppercase tracking-wide">Limited Time Offer</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl font-bold font-mono">
            {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
          </span>
          <span className="text-sm opacity-90">until price increases</span>
        </div>
      </div>

      {/* Scarcity Bar */}
      <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-2 text-orange-400">
          <Users className="w-4 h-4" />
          <span>{recentPurchases} people purchased in the last hour</span>
        </div>
        <div className="flex items-center gap-1 text-red-400 font-bold">
          <Zap className="w-4 h-4" />
          <span>Only {spotsLeft} spots left!</span>
        </div>
      </div>

      {/* Section Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          🔒 SECURE YOUR READING NOW
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Don't miss {petName}'s cosmic secrets
        </p>
      </div>

      {/* Tier Cards */}
      <div className="space-y-3">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const savings = tier.originalPrice - tier.price;
          const savingsPercent = Math.round((savings / tier.originalPrice) * 100);
          
          return (
            <motion.button
              key={tier.id}
              onClick={() => onSelectTier(tier.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden",
                isSelected
                  ? "border-red-500 bg-red-500/10 ring-2 ring-red-500/30"
                  : "border-border/50 bg-card/30 hover:border-red-500/50",
                tier.popular && "ring-2 ring-orange-500/50"
              )}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  {tier.urgency}
                </div>
              )}
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      isSelected ? "border-red-500 bg-red-500" : "border-muted-foreground"
                    )}>
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="font-bold text-foreground">{tier.name}</span>
                  </div>
                  
                  <ul className="mt-2 space-y-1 ml-7">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-muted-foreground line-through">${tier.originalPrice}</div>
                  <div className="text-2xl font-bold text-foreground">${tier.price}</div>
                  <div className="text-xs text-green-400 font-medium">Save {savingsPercent}%</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-4 py-3 border-t border-border/30">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-green-500" />
          <span>Secure Checkout</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>Instant Delivery</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>4.9★ Rating</span>
        </div>
      </div>

      {/* Risk Reversal */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
        <p className="text-sm text-green-400 font-medium">
          ✓ 100% Money-Back Guarantee — Love it or get a full refund, no questions asked
        </p>
      </div>

      {/* Testimonial */}
      <div className="bg-card/30 border border-border/30 rounded-lg p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
            🐕
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground italic">
              "I was skeptical but WOW. It explained EXACTLY why my dog acts the way he does. Worth every penny!"
            </p>
            <p className="text-xs text-muted-foreground mt-1">— Sarah M., Golden Retriever owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
