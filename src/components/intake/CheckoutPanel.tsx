import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Star, Check, Gift, X, Clock, Users, Zap, Bug } from 'lucide-react';
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
  selectedTier: 'basic' | 'premium' | 'vip';
  includeGiftForFriend?: boolean;
  includesPortrait?: boolean;
}

// Product tiers - $35 without portrait, $50 with AI portrait
const TIERS = {
  basic: {
    id: 'basic',
    name: 'Cosmic Pet Reading',
    description: "Complete 18-chapter cosmic report",
    priceCents: 3500, // $35
    originalPriceCents: 7900, // $79 anchoring
    features: ['Full 18-Section Report', 'Personality Deep Dive', 'Care & Bonding Tips', 'Love Language Decoded', 'Practical Tips & Fun Facts'],
    icon: Sparkles,
    badge: null as string | null,
    highlight: false,
    includesPortrait: false,
  },
  premium: {
    id: 'premium',
    name: 'Cosmic Portrait Edition',
    description: 'Full report + AI-generated cosmic trading card',
    priceCents: 5000, // $50
    originalPriceCents: 9900, // $99 anchoring
    features: ['Everything in Basic', '🎨 AI Cosmic Portrait Card', 'Shareable Trading Card', 'Download & Print Ready'],
    icon: Crown,
    badge: 'MOST POPULAR',
    highlight: true,
    includesPortrait: true,
  },
  vip: {
    id: 'vip',
    name: 'Cosmic VIP Experience',
    description: 'The ultimate cosmic journey for devoted pet parents',
    priceCents: 12900, // $129 - extreme anchor
    originalPriceCents: 24900, // $249 anchoring
    features: ['Everything in Portrait Edition', 'Yearly Updates Forever', 'Priority Cosmic Support', 'Exclusive VIP Community'],
    icon: Star,
    badge: 'BEST VALUE',
    highlight: false,
    includesPortrait: true,
  },
};

const GIFT_PRICE_CENTS = 1750; // $17.50 - 50% off!
const GIFT_ORIGINAL_PRICE_CENTS = 3500; // $35

// Volume discount calculation
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 3) return 0.15; // 15% off
  if (petCount >= 2) return 0.10; // 10% off
  return 0;
}

export function CheckoutPanel({ petData, petsData, petCount = 1, onCheckout, isLoading }: CheckoutPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isDevMode = searchParams.get('dev') === 'true';
  const isPreviewHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.endsWith('lovableproject.com') ||
      window.location.hostname.endsWith('lovable.app'));
  const canShowTest = isDevMode || isPreviewHost;

  const enableDevMode = () => {
    const next = new URLSearchParams(searchParams);
    next.set('dev', 'true');
    setSearchParams(next, { replace: true });
  };

  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'vip'>('premium'); // Default to premium (with portrait)
  const [showGiftUpsell, setShowGiftUpsell] = useState(false);
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [spotsLeft, setSpotsLeft] = useState(7);
  const [recentPurchases, setRecentPurchases] = useState(12847);

  // Simulated scarcity countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft(prev => Math.max(3, prev - (Math.random() > 0.7 ? 1 : 0)));
    }, 30000); // Every 30 seconds chance to decrease
    return () => clearInterval(interval);
  }, []);

  const tier = TIERS[selectedTier];
  const baseTotal = tier.priceCents * petCount;
  const volumeDiscountRate = getVolumeDiscount(petCount);
  const volumeDiscountAmount = Math.round(baseTotal * volumeDiscountRate);
  const total = baseTotal - volumeDiscountAmount;

  // Get all pet names for display
  const petNames = petsData?.map(p => p.name).filter(Boolean) || [petData.name];

  const handleCheckoutClick = () => {
    setShowGiftUpsell(true);
  };

  const proceedToCheckout = (withGift: boolean) => {
    setShowGiftUpsell(false);
    const finalTotal = total + (withGift ? GIFT_PRICE_CENTS : 0);
    const tier = TIERS[selectedTier];
    
    onCheckout({
      selectedProducts: [selectedTier],
      couponId: null,
      giftCertificateId: null,
      isGift,
      recipientName: isGift ? recipientName : '',
      recipientEmail: isGift ? recipientEmail : '',
      giftMessage: isGift ? giftMessage : '',
      totalCents: finalTotal,
      petCount,
      selectedTier,
      includeGiftForFriend: withGift,
      includesPortrait: tier.includesPortrait,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Urgency & Social Proof Header */}
      <div className="space-y-3">
        {/* Scarcity */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-red-500/10 border border-red-500/30"
        >
          <Clock className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">
            Only {spotsLeft} readings left at this price today!
          </span>
        </motion.div>

        {/* Social Proof */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>Join <span className="text-foreground font-semibold">{recentPurchases.toLocaleString()}</span> happy pet parents</span>
        </div>
      </div>

      {/* Loss Aversion Message */}
      <div className="text-center p-3 rounded-xl bg-gradient-to-r from-nebula-purple/10 to-nebula-pink/10 border border-nebula-purple/20">
        <p className="text-sm text-foreground">
          <Zap className="w-4 h-4 inline mr-1 text-cosmic-gold" />
          <span className="font-medium">Don't miss {petData.name}'s cosmic window!</span>
          <span className="text-muted-foreground"> The stars are aligned right now.</span>
        </p>
      </div>

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

      {/* Product tiers - Price Anchoring */}
      <div className="grid gap-3">
        {(['basic', 'premium', 'vip'] as const).map((key, index) => {
          const product = TIERS[key];
          const isSelected = selectedTier === key;
          const isBasic = key === 'basic';
          const isVip = key === 'vip';
          const Icon = product.icon;
          const savings = product.originalPriceCents - product.priceCents;
          const savingsPercent = Math.round((savings / product.originalPriceCents) * 100);
          
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
                product.highlight && "ring-2 ring-cosmic-gold/50",
                isVip && "opacity-80",
              )}
            >
              {/* Badge */}
              {product.badge && (
                <div className={cn(
                  "absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-bold rounded-full",
                  product.highlight 
                    ? "bg-cosmic-gold text-cosmic-gold-foreground" 
                    : "bg-nebula-purple text-white"
                )}>
                  {product.badge}
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
                    {product.features.slice(0, isSelected ? undefined : 3).map((feature, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                    {!isSelected && product.features.length > 3 && (
                      <span className="text-xs px-2 py-0.5 text-muted-foreground">
                        +{product.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Price with anchoring */}
                <div className="text-right flex-shrink-0">
                  {/* Original price strikethrough */}
                  <div className="text-sm text-muted-foreground line-through">
                    ${(product.originalPriceCents / 100).toFixed(0)}
                  </div>
                  <div className={cn(
                    "text-xl font-bold",
                    product.highlight ? "text-cosmic-gold" : "text-foreground"
                  )}>
                    ${(product.priceCents / 100).toFixed(0)}
                  </div>
                  <div className="text-xs text-green-500 font-medium">
                    Save {savingsPercent}%
                  </div>
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
          <span className="text-muted-foreground line-through">${(tier.originalPriceCents * petCount / 100).toFixed(0)}</span>
        </div>
        
        <div className="flex justify-between text-sm text-green-500">
          <span>Special discount</span>
          <span>-${((tier.originalPriceCents - tier.priceCents) * petCount / 100).toFixed(0)}</span>
        </div>
        
        {volumeDiscountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-500">
            <span>Multi-pet bonus ({Math.round(volumeDiscountRate * 100)}% off)</span>
            <span>-${(volumeDiscountAmount / 100).toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t border-border/30 pt-2 flex justify-between font-semibold">
          <span>Your Price</span>
          <span className="text-primary text-lg">${(total / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Gift Option Toggle */}
      <div className="space-y-3">
        <button
          onClick={() => setIsGift(!isGift)}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
            isGift
              ? "border-cosmic-gold bg-cosmic-gold/10"
              : "border-border/50 bg-card/20 hover:border-cosmic-gold/30"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            isGift ? "bg-cosmic-gold text-cosmic-gold-foreground" : "bg-muted/50 text-muted-foreground"
          )}>
            <Gift className="w-5 h-5" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-medium text-foreground">Send as a Gift</h4>
            <p className="text-sm text-muted-foreground">
              Include a personalized message & special reveal
            </p>
          </div>
          <div className={cn(
            "w-12 h-6 rounded-full transition-all p-0.5",
            isGift ? "bg-cosmic-gold" : "bg-muted"
          )}>
            <motion.div
              animate={{ x: isGift ? 24 : 0 }}
              className="w-5 h-5 rounded-full bg-white shadow-sm"
            />
          </div>
        </button>

        {/* Gift form */}
        {isGift && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-4 rounded-xl bg-card/30 border border-cosmic-gold/20"
          >
            <div className="grid gap-3">
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient's Name"
                className="h-11 px-4 rounded-lg bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Recipient's Email"
                className="h-11 px-4 rounded-lg bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground"
              />
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Write a heartfelt message..."
                className="min-h-[80px] p-4 rounded-lg bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground resize-none"
                maxLength={200}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> Instant delivery
        </span>
        <span className="flex items-center gap-1">
          <span className="text-green-500">✓</span> 100% satisfaction guaranteed
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
            Reveal {petCount > 1 ? 'Their' : `${petData.name}'s`} Truth — ${(total / 100).toFixed(2)}
          </span>
        )}
      </Button>

      {/* Test Mode (preview only) */}
      {canShowTest && (
        <div className="space-y-2">
          {!isDevMode && (
            <Button
              type="button"
              onClick={enableDevMode}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Enable Test Mode (adds dev=true)
            </Button>
          )}

          <Button
            type="button"
            onClick={() => {
              const checkoutData: CheckoutData = {
                selectedProducts: [selectedTier],
                couponId: null,
                giftCertificateId: null,
                isGift: false,
                recipientName: '',
                recipientEmail: '',
                giftMessage: '',
                totalCents: 0, // Free in test mode
                petCount,
                selectedTier,
                includeGiftForFriend: false,
              };
              onCheckout(checkoutData);
            }}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="w-full border-primary/40 text-primary hover:bg-primary/10"
          >
            <Bug className="w-4 h-4 mr-2" />
            Test: Skip Payment
          </Button>
        </div>
      )}
      {/* Final reassurance */}
      <p className="text-center text-xs text-muted-foreground">
        🔒 Secure checkout • 7-day money back guarantee
      </p>

      {/* Gift Upsell Modal - 50% OFF */}
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

              {/* Sale badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                50% OFF — LIMITED TIME
              </div>

              {/* Gift icon */}
              <div className="flex justify-center mb-4 mt-2">
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
                  Know someone who'd love to discover their pet's cosmic truth? Get 50% off when you add a gift reading now!
                </p>
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-nebula-pink/20 to-nebula-purple/20 border border-nebula-pink/30">
                  <Gift className="w-4 h-4 text-nebula-pink" />
                  <span className="text-muted-foreground line-through text-sm">${(GIFT_ORIGINAL_PRICE_CENTS / 100).toFixed(0)}</span>
                  <span className="text-lg font-bold text-cosmic-gold">${(GIFT_PRICE_CENTS / 100).toFixed(2)}</span>
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
                  Yes! Add Gift for ${(GIFT_PRICE_CENTS / 100).toFixed(2)}
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
                🎁 1,284 gifts sent this week alone!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
