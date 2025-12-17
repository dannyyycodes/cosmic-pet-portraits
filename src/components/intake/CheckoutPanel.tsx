import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Check, Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PetData } from './IntakeWizard';

interface CheckoutPanelProps {
  petData: PetData;
  petsData?: PetData[];
  petCount?: number;
  onCheckout: (checkoutData: CheckoutData) => void;
  isLoading: boolean;
}

export interface CheckoutData {
  selectedProducts: string[];
  couponId: string | null;
  giftCertificateId: string | null;
  isGift: boolean;
  recipientName: string;
  recipientEmail: string;
  giftMessage: string;
  totalCents: number;
  petCount?: number;
  selectedTier: 'basic' | 'premium';
  includeGiftForFriend?: boolean;
}

// Product tiers with fixed pricing
const TIERS = {
  basic: {
    id: 'basic',
    name: 'Cosmic Pet Report',
    description: "Your pet's complete astrological profile",
    priceCents: 3500, // $35
    features: ['Zodiac Analysis', 'Personality Traits', 'Care Tips', 'Love Language'],
    icon: Sparkles,
  },
  premium: {
    id: 'premium',
    name: 'Premium Cosmic Report',
    description: 'Extended report with compatibility & life path',
    priceCents: 5000, // $50
    features: ['Everything in Basic', 'Compatibility Analysis', 'Life Path Prediction', 'Monthly Forecasts'],
    icon: Crown,
    badge: 'MOST POPULAR',
    savings: 20,
  },
};

const GIFT_PRICE_CENTS = 3500; // $35 for a gift reading

// Volume discount calculation
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 3) return 0.15; // 15% off
  if (petCount >= 2) return 0.10; // 10% off
  return 0;
}

export function CheckoutPanel({ petData, petsData, petCount = 1, onCheckout, isLoading }: CheckoutPanelProps) {
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium'>('premium');
  const [showGiftUpsell, setShowGiftUpsell] = useState(false);
  const [includeGift, setIncludeGift] = useState(false);

  const tier = TIERS[selectedTier];
  const baseTotal = tier.priceCents * petCount;
  const volumeDiscountRate = getVolumeDiscount(petCount);
  const volumeDiscountAmount = Math.round(baseTotal * volumeDiscountRate);
  const giftAmount = includeGift ? GIFT_PRICE_CENTS : 0;
  const total = baseTotal - volumeDiscountAmount + giftAmount;

  // Get all pet names for display
  const petNames = petsData?.map(p => p.name).filter(Boolean) || [petData.name];

  const handleCheckoutClick = () => {
    // Show gift upsell modal first
    setShowGiftUpsell(true);
  };

  const proceedToCheckout = (withGift: boolean) => {
    setShowGiftUpsell(false);
    const finalTotal = baseTotal - volumeDiscountAmount + (withGift ? GIFT_PRICE_CENTS : 0);
    
    onCheckout({
      selectedProducts: [selectedTier],
      couponId: null,
      giftCertificateId: null,
      isGift: false,
      recipientName: '',
      recipientEmail: '',
      giftMessage: '',
      totalCents: finalTotal,
      petCount,
      selectedTier,
      includeGiftForFriend: withGift,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Emotional header */}
      <div className="text-center space-y-2 pb-4 border-b border-border/30">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Choose Your Reading
        </h2>
        <p className="text-muted-foreground text-sm">
          {petCount > 1 
            ? `Unlock ${petNames.join(' & ')}'s cosmic profiles`
            : `Unlock ${petData.name}'s complete cosmic profile`}
        </p>
      </div>

      {/* Value proposition cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">💫</div>
          <p className="text-xs text-muted-foreground">Deepen your bond</p>
        </div>
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">🔮</div>
          <p className="text-xs text-muted-foreground">Understand their soul</p>
        </div>
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">❤️</div>
          <p className="text-xs text-muted-foreground">Learn their love language</p>
        </div>
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-center">
          <div className="text-2xl mb-1">✨</div>
          <p className="text-xs text-muted-foreground">Discover hidden gifts</p>
        </div>
      </div>

      {/* Product tiers */}
      <div className="grid gap-3">
        {(['basic', 'premium'] as const).map((key, index) => {
          const product = TIERS[key];
          const isSelected = selectedTier === key;
          const isPremium = key === 'premium';
          const Icon = product.icon;
          
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedTier(key)}
              className={cn(
                "relative w-full p-4 rounded-xl border-2 text-left transition-all duration-300",
                isSelected 
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                  : "border-border/50 bg-card/30 hover:border-primary/50",
                isPremium && "ring-2 ring-cosmic-gold/30",
              )}
            >
              {/* Badge */}
              {isPremium && (
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-cosmic-gold text-cosmic-gold-foreground text-xs font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Radio/Check */}
                <div className={cn(
                  "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  isSelected 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground/40"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {product.features.map((feature, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-foreground">
                    ${(product.priceCents / 100).toFixed(2)}
                  </div>
                  {isPremium && (
                    <div className="text-xs text-green-500">
                      Save $20
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Order summary */}
      <div className="rounded-xl bg-card/30 border border-border/30 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {tier.name} {petCount > 1 ? `× ${petCount} pets` : ''}
          </span>
          <span className="text-foreground">${(tier.priceCents * petCount / 100).toFixed(2)}</span>
        </div>
        
        {volumeDiscountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Multi-pet discount ({Math.round(volumeDiscountRate * 100)}% off)</span>
            <span>-${(volumeDiscountAmount / 100).toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t border-border/30 pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-primary">${((baseTotal - volumeDiscountAmount) / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Instant delivery
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Satisfaction guaranteed
        </span>
      </div>

      {/* Checkout button */}
      <Button
        onClick={handleCheckoutClick}
        disabled={isLoading}
        variant="gold"
        size="xl"
        className="w-full"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
            />
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Reveal {petCount > 1 ? 'Their' : `${petData.name}'s`} Truth — ${((baseTotal - volumeDiscountAmount) / 100).toFixed(2)}
          </span>
        )}
      </Button>

      {/* Final reassurance */}
      <p className="text-center text-xs text-muted-foreground">
        🔒 Secure checkout powered by Stripe
      </p>

      {/* Gift Upsell Modal */}
      <AnimatePresence>
        {showGiftUpsell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowGiftUpsell(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setShowGiftUpsell(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Gift icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple flex items-center justify-center"
                >
                  <Gift className="w-10 h-10 text-white" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="text-center space-y-3 mb-6">
                <h3 className="text-xl font-display font-bold text-foreground">
                  Gift One to a Friend?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Know someone who'd love to discover their pet's cosmic truth? Add a gift reading to your order!
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nebula-pink/10 border border-nebula-pink/30">
                  <Gift className="w-4 h-4 text-nebula-pink" />
                  <span className="text-sm font-medium text-foreground">Only $35 — They'll love it!</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => proceedToCheckout(true)}
                  variant="gold"
                  size="lg"
                  className="w-full"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Yes, Add a Gift — ${((baseTotal - volumeDiscountAmount + GIFT_PRICE_CENTS) / 100).toFixed(2)} total
                </Button>
                
                <Button
                  onClick={() => proceedToCheckout(false)}
                  variant="ghost"
                  size="lg"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  No thanks, continue to checkout
                </Button>
              </div>

              {/* Social proof */}
              <p className="text-center text-xs text-muted-foreground mt-4">
                🎁 847 gifts sent this month
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
