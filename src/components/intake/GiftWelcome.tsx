import { motion } from 'framer-motion';
import { Gift, Sparkles, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GiftWelcomeProps {
  recipientName?: string;
  giftMessage?: string;
  giftedTier: 'essential' | 'portrait' | 'vip' | 'basic' | 'premium'; // Support both old and new tier names
  includesPortrait?: boolean;
  onContinue: () => void;
}

export function GiftWelcome({ 
  recipientName, 
  giftMessage, 
  giftedTier,
  includesPortrait,
  onContinue 
}: GiftWelcomeProps) {
  // Normalize tier names (support old and new naming)
  const normalizedTier = giftedTier === 'basic' ? 'essential' : giftedTier === 'premium' ? 'portrait' : giftedTier;
  
  const tierLabels: Record<string, string> = {
    essential: 'Cosmic Pet Reading',
    portrait: 'Cosmic Soul Reading Edition',
    vip: 'Cosmic VIP Experience',
  };

  const tierFeatures: Record<string, string[]> = {
    essential: [
      'Complete 18-chapter cosmic report',
      'Personality insights & care tips',
      'Cosmic compatibility traits',
    ],
    portrait: [
      'Everything in Essential Reading',
      'Your pet\'s photo on a cosmic card',
      'Weekly cosmic horoscope emails',
    ],
    vip: [
      'Everything in Portrait Edition',
      'Yearly cosmic updates for life',
      'VIP priority support',
    ],
  };

  return (
    <div className="text-center space-y-8 max-w-lg mx-auto">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="relative"
      >
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
          <Gift className="w-12 h-12 text-white" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium">
          <Star className="w-4 h-4" />
          <span>You've Received a Gift!</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {recipientName ? `Hello, ${recipientName}!` : 'A Cosmic Gift Awaits!'}
        </h1>
        
        <p className="text-muted-foreground text-lg">
          Someone special has gifted you a <span className="text-primary font-semibold">{tierLabels[normalizedTier] || tierLabels.essential}</span> for your beloved pet.
        </p>
      </motion.div>

      {giftMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative p-6 rounded-2xl bg-card/50 border border-border/50"
        >
          <Heart className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-pink-400" />
          <p className="text-foreground italic">"{giftMessage}"</p>
          <p className="text-muted-foreground text-sm mt-2">— From your gift giver</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Your gift includes:
        </h3>
        <ul className="space-y-2">
          {(tierFeatures[normalizedTier] || tierFeatures.essential).map((feature, index) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-2 text-foreground justify-center"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <p className="text-muted-foreground text-sm">
          Answer a few quick questions about your pet to unlock their personalized cosmic reading. It only takes 2 minutes!
        </p>
        
        <Button
          onClick={onContinue}
          variant="cosmic"
          size="xl"
          className="w-full max-w-sm mx-auto"
        >
          <Gift className="w-5 h-5 mr-2" />
          Redeem My Gift
        </Button>
      </motion.div>
    </div>
  );
}