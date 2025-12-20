import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Star, Check, Gift, X, Clock, Users, Zap, Bug, Moon, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PetData } from './IntakeWizard';
import { MultiPetPhotoUpload, PetPhotoData } from './MultiPetPhotoUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutPanelProps {
  petData: PetData;
  petsData?: PetData[];
  petCount?: number;
  onCheckout: (checkoutData: CheckoutData) => void;
  isLoading: boolean;
  occasionMode?: string;
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
  giftTierForFriend?: 'basic' | 'premium' | 'vip';
  includesPortrait?: boolean;
  petPhotoUrl?: string | null;
  petPhotos?: Record<number, PetPhotoData>;
  includeHoroscope?: boolean;
  // NEW: Per-pet tier selection
  petTiers?: Record<number, 'basic' | 'premium' | 'vip'>;
}

// Product tiers - $35 without portrait, $50 with AI portrait
const TIERS = {
  basic: {
    id: 'basic',
    name: 'Cosmic Reading',
    shortName: 'Basic',
    description: "Full 18-section report",
    priceCents: 3500, // $35
    originalPriceCents: 7900, // $79 anchoring
    icon: Sparkles,
    highlight: false,
    includesPortrait: false,
  },
  premium: {
    id: 'premium',
    name: 'Portrait Edition',
    shortName: 'Portrait',
    description: 'Report + AI trading card',
    priceCents: 5000, // $50
    originalPriceCents: 9900, // $99 anchoring
    icon: Crown,
    highlight: true,
    includesPortrait: true,
  },
  vip: {
    id: 'vip',
    name: 'VIP Experience',
    shortName: 'VIP',
    description: 'Everything + yearly updates',
    priceCents: 12900, // $129 - extreme anchor
    originalPriceCents: 24900, // $249 anchoring
    icon: Star,
    highlight: false,
    includesPortrait: true,
  },
};

// Gift tiers - 50% off all tiers for friends
const GIFT_TIERS = {
  basic: { priceCents: 1750, originalCents: 3500, name: 'Cosmic Pet Reading' },
  premium: { priceCents: 2500, originalCents: 5000, name: 'Cosmic Portrait Edition' },
  vip: { priceCents: 6450, originalCents: 12900, name: 'Cosmic VIP Experience' },
};

// Volume discount calculation
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.50; // 50% off for 5+ pets
  if (petCount >= 4) return 0.40; // 40% off for 4 pets
  if (petCount >= 3) return 0.30; // 30% off for 3 pets
  if (petCount >= 2) return 0.20; // 20% off for 2 pets
  return 0;
}

export function CheckoutPanel({ petData, petsData, petCount = 1, onCheckout, isLoading, occasionMode }: CheckoutPanelProps) {
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

  // Per-pet tier selection - initialize all pets to 'premium' by default
  const allPets = petsData || [petData];
  const [petTiers, setPetTiers] = useState<Record<number, 'basic' | 'premium' | 'vip'>>(() => {
    const initial: Record<number, 'basic' | 'premium' | 'vip'> = {};
    allPets.forEach((_, idx) => { initial[idx] = 'premium'; });
    return initial;
  });
  
  const [showGiftUpsell, setShowGiftUpsell] = useState(false);
  const [selectedGiftTier, setSelectedGiftTier] = useState<'basic' | 'premium' | 'vip'>('basic');
  const [includeHoroscope, setIncludeHoroscope] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState(7);
  const [recentPurchases, setRecentPurchases] = useState(12847);
  const [petPhotos, setPetPhotos] = useState<Record<number, PetPhotoData>>({});
  
  // Calculate how many pets need weekly updates (exclude memorial pets)
  const nonMemorialPets = allPets.filter(p => p.occasionMode !== 'memorial');
  const subscriptionPetCount = Math.max(1, nonMemorialPets.length);

  // Simulated scarcity countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft(prev => Math.max(3, prev - (Math.random() > 0.7 ? 1 : 0)));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate which pets need photo upload (Premium or VIP)
  const petsNeedingPhotos = allPets
    .map((pet, idx) => ({ pet, idx, tier: petTiers[idx] }))
    .filter(({ tier }) => tier === 'premium' || tier === 'vip');

  // Calculate total with per-pet tiers
  const calculateTotal = () => {
    let baseTotal = 0;
    allPets.forEach((_, idx) => {
      const tier = petTiers[idx] || 'premium';
      baseTotal += TIERS[tier].priceCents;
    });
    
    const volumeDiscountRate = getVolumeDiscount(allPets.length);
    const volumeDiscount = Math.round(baseTotal * volumeDiscountRate);
    return { baseTotal, volumeDiscount, total: baseTotal - volumeDiscount };
  };

  const { baseTotal, volumeDiscount, total } = calculateTotal();
  const volumeDiscountRate = getVolumeDiscount(allPets.length);

  // Get all pet names for display
  const petNames = allPets.map(p => p.name).filter(Boolean);
  
  // Check if any pet has VIP (includes horoscope for free)
  const hasVipPet = Object.values(petTiers).some(tier => tier === 'vip');
  
  // Only show gift upsell for non-gift occasion modes
  const shouldShowGiftUpsell = occasionMode !== 'gift';

  // Check if any pet needs portrait
  const anyPetNeedsPortrait = Object.values(petTiers).some(tier => tier === 'premium' || tier === 'vip');

  const handleTierChange = (petIndex: number, tier: 'basic' | 'premium' | 'vip') => {
    setPetTiers(prev => ({ ...prev, [petIndex]: tier }));
    
    // If downgrading from portrait tier, remove photo
    if (tier === 'basic' && petPhotos[petIndex]) {
      setPetPhotos(prev => {
        const updated = { ...prev };
        delete updated[petIndex];
        return updated;
      });
    }
  };

  const handleCheckoutClick = () => {
    if (shouldShowGiftUpsell) {
      setShowGiftUpsell(true);
    } else {
      proceedToCheckout(false);
    }
  };

  const proceedToCheckout = (withGift: boolean) => {
    setShowGiftUpsell(false);
    const giftPrice = withGift ? GIFT_TIERS[selectedGiftTier].priceCents : 0;
    const finalTotal = total + giftPrice;
    
    // Get the first pet's photo URL for backward compatibility
    const firstPortraitPetIdx = petsNeedingPhotos[0]?.idx;
    const firstPetPhoto = firstPortraitPetIdx !== undefined ? petPhotos[firstPortraitPetIdx] : undefined;
    
    // Determine dominant tier for backward compatibility
    const tierCounts = { basic: 0, premium: 0, vip: 0 };
    Object.values(petTiers).forEach(t => tierCounts[t]++);
    const dominantTier = tierCounts.vip > 0 ? 'vip' : tierCounts.premium > 0 ? 'premium' : 'basic';
    
    onCheckout({
      selectedProducts: includeHoroscope || hasVipPet ? [dominantTier, 'horoscope_subscription'] : [dominantTier],
      couponId: null,
      giftCertificateId: null,
      isGift: false,
      recipientName: '',
      recipientEmail: '',
      giftMessage: '',
      totalCents: finalTotal,
      petCount: allPets.length,
      selectedTier: dominantTier,
      includeGiftForFriend: withGift,
      giftTierForFriend: withGift ? selectedGiftTier : undefined,
      includesPortrait: anyPetNeedsPortrait,
      petPhotoUrl: firstPetPhoto?.url || null,
      petPhotos: petPhotos,
      includeHoroscope: includeHoroscope || hasVipPet,
      petTiers: petTiers,
    });
  };
  
  const handlePhotoChange = (petIndex: number, photo: PetPhotoData | null) => {
    setPetPhotos(prev => {
      const updated = { ...prev };
      if (photo) {
        updated[petIndex] = photo;
      } else {
        delete updated[petIndex];
      }
      return updated;
    });
  };

  // Quick tier select for all pets
  const setAllPetsTier = (tier: 'basic' | 'premium' | 'vip') => {
    const newTiers: Record<number, 'basic' | 'premium' | 'vip'> = {};
    allPets.forEach((_, idx) => { newTiers[idx] = tier; });
    setPetTiers(newTiers);
    
    // Clear photos if setting all to basic
    if (tier === 'basic') {
      setPetPhotos({});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Social Proof - Simplified */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
        <Users className="w-4 h-4" />
        <span><span className="text-foreground font-semibold">{recentPurchases.toLocaleString()}</span> happy pet parents</span>
      </div>

      {/* Header */}
      <div className="text-center space-y-1 pb-3 border-b border-border/30">
        <h2 className="text-xl font-display font-bold text-foreground">
          Choose Your Reading{allPets.length > 1 ? 's' : ''}
        </h2>
        <p className="text-muted-foreground text-sm">
          {allPets.length > 1 
            ? `Select a tier for each pet`
            : `Unlock ${petData.name}'s complete cosmic profile`}
        </p>
      </div>

      {/* Volume Discount Applied - only show when applicable */}
      {allPets.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-2 rounded-lg bg-green-500/10 border border-green-500/20"
        >
          <div className="flex items-center justify-center gap-2">
            <Users className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400">
              🎉 {Math.round(volumeDiscountRate * 100)}% Multi-Pet Discount Applied!
            </span>
          </div>
        </motion.div>
      )}

      {/* Quick tier select for multiple pets */}
      {allPets.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick select:</span>
          <div className="flex gap-1 flex-1">
            {(['basic', 'premium', 'vip'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setAllPetsTier(tier)}
                className={cn(
                  "flex-1 py-1.5 px-2 text-xs font-medium rounded-lg border transition-all",
                  Object.values(petTiers).every(t => t === tier)
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border/50 text-muted-foreground hover:border-primary/50"
                )}
              >
                All {TIERS[tier].shortName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Per-Pet Tier Selection */}
      <div className="space-y-3">
        {allPets.map((pet, petIndex) => {
          const currentTier = petTiers[petIndex] || 'premium';
          const isMemorial = pet.occasionMode === 'memorial';
          
          return (
            <motion.div
              key={petIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: petIndex * 0.1 }}
              className={cn(
                "p-4 rounded-xl border",
                isMemorial 
                  ? "bg-purple-500/5 border-purple-500/30"
                  : "bg-card/30 border-border/50"
              )}
            >
              {/* Pet Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  isMemorial 
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-primary/20 text-primary"
                )}>
                  {petIndex + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{pet.name || `Pet ${petIndex + 1}`}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {pet.species}{pet.breed ? ` • ${pet.breed}` : ''}
                    {isMemorial && <span className="text-purple-400 ml-1">• Memorial</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cosmic-gold">
                    ${(TIERS[currentTier].priceCents / 100).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground line-through">
                    ${(TIERS[currentTier].originalPriceCents / 100).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Tier Selection Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {(['basic', 'premium', 'vip'] as const).map((tierKey) => {
                  const tier = TIERS[tierKey];
                  const isSelected = currentTier === tierKey;
                  const Icon = tier.icon;
                  
                  return (
                    <button
                      key={tierKey}
                      onClick={() => handleTierChange(petIndex, tierKey)}
                      className={cn(
                        "relative p-2 rounded-lg border-2 text-center transition-all",
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border/50 bg-card/20 hover:border-primary/50",
                        tier.highlight && !isSelected && "ring-1 ring-cosmic-gold/30"
                      )}
                    >
                      {tier.highlight && !isSelected && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.5 bg-cosmic-gold text-background font-bold rounded-full whitespace-nowrap">
                          POPULAR
                        </span>
                      )}
                      <Icon className={cn(
                        "w-4 h-4 mx-auto mb-1",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <p className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {tier.shortName}
                      </p>
                      <p className={cn(
                        "text-[10px]",
                        isSelected ? "text-foreground/70" : "text-muted-foreground/70"
                      )}>
                        ${(tier.priceCents / 100).toFixed(0)}
                      </p>
                      {tier.includesPortrait && (
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          <Camera className="w-3 h-3 text-nebula-purple" />
                          <span className="text-[8px] text-nebula-purple">AI Card</span>
                        </div>
                      )}
                      {isSelected && (
                        <motion.div 
                          layoutId={`check-${petIndex}`}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Photo Upload for Portrait Tier Pets */}
      <AnimatePresence>
        {petsNeedingPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-gradient-to-r from-nebula-purple/10 to-cosmic-gold/10 border border-nebula-purple/30">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="w-4 h-4 text-nebula-purple" />
                <span className="text-sm font-medium text-foreground">
                  Upload Photos for AI Cards ({petsNeedingPhotos.length} pet{petsNeedingPhotos.length > 1 ? 's' : ''})
                </span>
              </div>
              
              <div className="space-y-2">
                {petsNeedingPhotos.map(({ pet, idx }) => (
                  <SinglePetPhotoUploadInline
                    key={idx}
                    petName={pet.name || `Pet ${idx + 1}`}
                    petIndex={idx}
                    photoData={petPhotos[idx] || null}
                    onPhotoChange={(photo) => handlePhotoChange(idx, photo)}
                  />
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 text-center">
                📸 Clear face photos work best for the AI transformation!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order summary */}
      <div className="rounded-xl bg-card/30 border border-border/30 p-4 space-y-2">
        {allPets.map((pet, idx) => {
          const tier = petTiers[idx];
          return (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {pet.name || `Pet ${idx + 1}`} — {TIERS[tier].shortName}
              </span>
              <span className="text-muted-foreground">${(TIERS[tier].priceCents / 100).toFixed(0)}</span>
            </div>
          );
        })}
        
        {volumeDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-500 pt-1 border-t border-border/30">
            <span>Multi-pet bonus ({Math.round(volumeDiscountRate * 100)}% off)</span>
            <span>-${(volumeDiscount / 100).toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t border-border/30 pt-2 flex justify-between font-semibold">
          <span>Your Price</span>
          <span className="text-primary text-lg">${(total / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Weekly Horoscope Subscription Add-on */}
      {!hasVipPet && nonMemorialPets.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setIncludeHoroscope(!includeHoroscope)}
            className={cn(
              "w-full p-4 rounded-xl border-2 transition-all text-left",
              includeHoroscope
                ? "border-nebula-purple bg-gradient-to-r from-nebula-purple/20 to-nebula-pink/10"
                : "border-border/50 bg-card/20 hover:border-nebula-purple/30"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                includeHoroscope
                  ? "border-nebula-purple bg-nebula-purple"
                  : "border-muted-foreground/40"
              )}>
                {includeHoroscope && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Moon className={cn("w-5 h-5", includeHoroscope ? "text-nebula-purple" : "text-muted-foreground")} />
                  <h4 className="font-semibold text-foreground">Weekly Cosmic Updates</h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-nebula-purple to-nebula-pink text-white">LAUNCH SPECIAL</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Personalized weekly insights for all your pets
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="text-foreground font-bold">${((499 * subscriptionPetCount) / 100).toFixed(2)}/month</span>
                    {subscriptionPetCount > 1 && <span className="text-xs text-muted-foreground ml-1">({subscriptionPetCount} pets)</span>}
                  </p>
                  <span className="text-xs text-nebula-purple font-medium">Cancel anytime</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {hasVipPet && (
        <div className="p-3 rounded-lg bg-cosmic-gold/10 border border-cosmic-gold/30 text-center">
          <p className="text-sm text-cosmic-gold font-medium">
            ⭐ VIP includes free weekly horoscopes for life!
          </p>
        </div>
      )}

      {/* Trust signals */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> Instant delivery
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> 100% satisfaction guaranteed
          </span>
        </div>
        {allPets.length === 1 && (
          <p className="text-[10px] text-center text-muted-foreground/70">
            Multi-pet savings: 2 pets 20% off • 3 pets 30% off • 4 pets 40% off • 5+ pets 50% off
          </p>
        )}
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
            Reveal {allPets.length > 1 ? 'Their' : `${petData.name}'s`} Truth — ${(total / 100).toFixed(2)}
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
              const tierCounts = { basic: 0, premium: 0, vip: 0 };
              Object.values(petTiers).forEach(t => tierCounts[t]++);
              const dominantTier = tierCounts.vip > 0 ? 'vip' : tierCounts.premium > 0 ? 'premium' : 'basic';
              
              const checkoutData: CheckoutData = {
                selectedProducts: [dominantTier],
                couponId: null,
                giftCertificateId: null,
                isGift: false,
                recipientName: '',
                recipientEmail: '',
                giftMessage: '',
                totalCents: 0, // Free in test mode
                petCount: allPets.length,
                selectedTier: dominantTier,
                includeGiftForFriend: false,
                includesPortrait: anyPetNeedsPortrait,
                petPhotos: petPhotos,
                petTiers: petTiers,
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
              className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowGiftUpsell(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                50% OFF ALL TIERS
              </div>

              <div className="flex justify-center mb-4 mt-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple flex items-center justify-center"
                >
                  <Gift className="w-8 h-8 text-white" />
                </motion.div>
              </div>

              <div className="text-center space-y-2 mb-4">
                <h3 className="text-xl font-display font-bold text-foreground">
                  Gift One to a Friend?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Know someone who'd love this? All tiers are 50% off!
                </p>
              </div>

              <div className="space-y-2 mb-4">
                {(['basic', 'premium', 'vip'] as const).map((giftTier) => {
                  const tierInfo = GIFT_TIERS[giftTier];
                  const isSelected = selectedGiftTier === giftTier;
                  const Icon = TIERS[giftTier].icon;
                  
                  return (
                    <button
                      key={giftTier}
                      onClick={() => setSelectedGiftTier(giftTier)}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3",
                        isSelected 
                          ? "border-nebula-purple bg-nebula-purple/10" 
                          : "border-border/50 bg-card/30 hover:border-nebula-purple/50"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        isSelected ? "border-nebula-purple bg-nebula-purple" : "border-muted-foreground/40"
                      )}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <Icon className={cn("w-4 h-4", isSelected ? "text-nebula-purple" : "text-muted-foreground")} />
                      <span className="flex-1 text-sm font-medium text-foreground">{tierInfo.name}</span>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground line-through">${(tierInfo.originalCents / 100).toFixed(0)}</span>
                        <span className="text-sm font-bold text-cosmic-gold ml-1">${(tierInfo.priceCents / 100).toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => proceedToCheckout(true)}
                  variant="gold"
                  size="lg"
                  className="w-full"
                >
                  <Gift className="w-5 h-5 mr-2" />
                  Add {GIFT_TIERS[selectedGiftTier].name} — ${(GIFT_TIERS[selectedGiftTier].priceCents / 100).toFixed(2)}
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

// Inline single pet photo upload for checkout context
function SinglePetPhotoUploadInline({ 
  petName, 
  petIndex,
  photoData,
  onPhotoChange 
}: { 
  petName: string;
  petIndex: number;
  photoData: PetPhotoData | null;
  onPhotoChange: (photo: PetPhotoData | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Please use an image under 10MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('pet-photos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filename);

      onPhotoChange({ url: urlData.publicUrl, processingMode: 'pokemon' });
      toast.success(`${petName}'s photo uploaded!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-card/30 border border-border/30">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
        {petIndex + 1}
      </div>
      <span className="font-medium text-sm text-foreground flex-1">{petName}</span>
      
      {photoData ? (
        <div className="flex items-center gap-2">
          <img src={photoData.url} alt={petName} className="w-8 h-8 rounded object-cover" />
          <button
            onClick={() => onPhotoChange(null)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id={`checkout-photo-${petIndex}`}
          />
          <label
            htmlFor={`checkout-photo-${petIndex}`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            className={cn(
              "px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs font-medium flex items-center gap-1.5",
              dragActive
                ? "border-nebula-purple bg-nebula-purple/20 text-nebula-purple"
                : "border-border/50 bg-card/20 text-muted-foreground hover:border-nebula-purple/50",
              isUploading && "opacity-50 cursor-wait"
            )}
          >
            {isUploading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border border-current border-t-transparent rounded-full"
              />
            ) : (
              <Camera className="w-3 h-3" />
            )}
            {isUploading ? 'Uploading...' : 'Upload'}
          </label>
        </>
      )}
    </div>
  );
}
