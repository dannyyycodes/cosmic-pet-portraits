import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Star, Gift, Camera, Zap, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutVariantCProps {
  petName: string;
  petCount: number;
  onSelectTier: (tier: 'basic' | 'premium') => void;
  selectedTier: 'basic' | 'premium';
  baseTotal: number;
  volumeDiscount: number;
}

export function CheckoutVariantC({ 
  petName, 
  petCount, 
  onSelectTier, 
  selectedTier,
  baseTotal,
  volumeDiscount 
}: CheckoutVariantCProps) {
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);

  const tiers = [
    {
      id: 'basic' as const,
      name: 'The Tea ☕',
      tagline: 'Spill the cosmic tea',
      price: 35,
      emoji: '✨',
      gradient: 'from-pink-500 to-purple-500',
      features: ['Personality decoded', 'Quirks explained', 'Bond tips'],
    },
    {
      id: 'premium' as const,
      name: 'Main Character 👑',
      tagline: 'They deserve the spotlight',
      price: 50,
      emoji: '💅',
      gradient: 'from-purple-500 to-indigo-500',
      features: ['Everything in Tea', 'Printable card', 'Frame-worthy vibes'],
      popular: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Fun Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full mb-3">
          <PartyPopper className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-foreground">Treat Yourself & Your Bestie</span>
          <PartyPopper className="w-4 h-4 text-purple-400" />
        </div>
        
        <h2 className="text-xl font-bold text-foreground">
          Pick {petName}'s Vibe ✨
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          (they're worth it, we both know it)
        </p>
      </motion.div>

      {/* Tier Cards - Playful Style */}
      <div className="space-y-3">
        {tiers.map((tier, index) => {
          const isSelected = selectedTier === tier.id;
          const isHovered = hoveredTier === tier.id;
          
          return (
            <motion.button
              key={tier.id}
              onClick={() => onSelectTier(tier.id)}
              onMouseEnter={() => setHoveredTier(tier.id)}
              onMouseLeave={() => setHoveredTier(null)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card/30 hover:border-primary/50"
              )}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <motion.div 
                  initial={{ rotate: -3 }}
                  animate={{ rotate: [0, -3, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl"
                >
                  fan fave 💖
                </motion.div>
              )}
              
              {/* Animated background on hover */}
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  className={`absolute inset-0 bg-gradient-to-r ${tier.gradient}`}
                />
              )}
              
              <div className="relative flex items-center gap-4">
                {/* Emoji Avatar */}
                <motion.div 
                  animate={isSelected ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                    `bg-gradient-to-br ${tier.gradient}`
                  )}
                >
                  {tier.emoji}
                </motion.div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-lg">{tier.name}</span>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-green-500"
                      >
                        ✓
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.tagline}</p>
                  
                  {/* Features as tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tier.features.map((feature, i) => (
                      <span 
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    ${tier.price}
                  </div>
                  <div className="text-xs text-muted-foreground">one time</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Volume Discount Callout */}
      {petCount > 1 && volumeDiscount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-3 text-center"
        >
          <div className="flex items-center justify-center gap-2">
            <Gift className="w-5 h-5 text-green-400" />
            <span className="font-medium text-green-400">
              Multi-pet squad discount: ${(volumeDiscount / 100).toFixed(0)} off! 🎉
            </span>
          </div>
        </motion.div>
      )}

      {/* Social Proof - Fun Style */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex -space-x-2">
          {['🐕', '🐈', '🐰', '🐹'].map((emoji, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border-2 border-background"
            >
              {emoji}
            </motion.div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">12,847</span> pets roasted this week
        </p>
      </div>

      {/* Casual CTA Message */}
      <div className="text-center py-2">
        <p className="text-sm text-muted-foreground">
          Worst case? You get a hilariously accurate reading. 
          <span className="text-primary"> Best case? You finally understand your chaos goblin.</span>
        </p>
      </div>

      {/* Fun guarantee */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Heart className="w-4 h-4 text-pink-400" />
        <span>100% satisfaction guaranteed or your money back, no drama</span>
      </div>
    </div>
  );
}
