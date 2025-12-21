import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Heart, Sparkles, ArrowLeft, Send, Star, LinkIcon, CheckCircle, Quote, Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type DeliveryMethod = 'email' | 'link';
type GiftTier = 'essential' | 'portrait' | 'vip';

interface GiftPet {
  id: string;
  tier: GiftTier;
}

const TIERS = {
  essential: { cents: 3500, label: 'Essential', description: 'Core cosmic reading' },
  portrait: { cents: 5000, label: 'Portrait Edition', description: 'Includes AI portrait' },
  vip: { cents: 12900, label: 'VIP Experience', description: 'Full cosmic package' },
} as const;

// Volume discounts based on total pet count
const getVolumeDiscount = (petCount: number): number => {
  if (petCount >= 5) return 0.50;
  if (petCount >= 4) return 0.40;
  if (petCount >= 3) return 0.30;
  if (petCount >= 2) return 0.20;
  return 0;
};

export default function GiftPurchase() {
  const { t } = useLanguage();
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  
  // Multi-pet with individual tier selection
  const [giftPets, setGiftPets] = useState<GiftPet[]>([
    { id: crypto.randomUUID(), tier: 'portrait' }
  ]);

  const addPet = () => {
    if (giftPets.length < 10) {
      setGiftPets([...giftPets, { id: crypto.randomUUID(), tier: 'portrait' }]);
    }
  };

  const removePet = (id: string) => {
    if (giftPets.length > 1) {
      setGiftPets(giftPets.filter(p => p.id !== id));
    }
  };

  const updatePetTier = (id: string, tier: GiftTier) => {
    setGiftPets(giftPets.map(p => p.id === id ? { ...p, tier } : p));
  };

  const petCount = giftPets.length;
  const discount = getVolumeDiscount(petCount);
  
  const pricing = useMemo(() => {
    const baseTotal = giftPets.reduce((sum, pet) => sum + TIERS[pet.tier].cents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const finalTotal = baseTotal - discountAmount;
    return { baseTotal, discountAmount, finalTotal };
  }, [giftPets, discount]);

  const handlePurchase = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!purchaserEmail) {
      toast.error(t('gift.errorYourEmail'));
      return;
    }
    
    if (deliveryMethod === 'email' && !recipientEmail) {
      toast.error(t('gift.errorRecipientEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', {
        body: {
          purchaserEmail,
          recipientEmail: deliveryMethod === 'email' ? recipientEmail : null,
          recipientName,
          giftMessage,
          giftPets, // Send individual pet tiers
          deliveryMethod,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Gift purchase error:', error);
      toast.error(t('gift.errorGeneric'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <StarfieldBackground intensity="calm" />
      
      <div className="w-full max-w-lg relative z-10">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.backHome')}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-nebula-pink via-nebula-purple to-primary shadow-2xl shadow-nebula-purple/30"
            >
              <Gift className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-foreground via-nebula-purple to-nebula-pink bg-clip-text text-transparent">
              {t('gift.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t('gift.subtitle')}
            </p>
          </div>

          {/* Volume Discount Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
          >
            <p className="text-sm font-medium text-center text-green-400">
              🎁 Multi-Pet Savings: 2 pets = 20% off • 3 = 30% • 4 = 40% • 5+ = 50% off
            </p>
          </motion.div>

          {/* Why It's Perfect */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-nebula-pink/15 to-nebula-purple/15 border border-nebula-pink/30 backdrop-blur-sm space-y-4"
          >
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-nebula-pink" />
              {t('gift.whyPerfect')}
            </h2>
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t(`gift.reason${i}Title`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`gift.reason${i}Desc`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Testimonial */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative p-5 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
          >
            <Quote className="absolute top-4 left-4 w-8 h-8 text-gold/20" />
            <div className="pl-8">
              <p className="text-sm italic text-foreground/90 mb-3">
                {t('gift.testimonial')}
              </p>
              <p className="text-xs text-gold font-medium">— {t('gift.testimonialAuthor')}</p>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Sparkles, color: 'text-gold', key: 'feature1' },
              { icon: Star, color: 'text-nebula-purple', key: 'feature2' },
              { icon: Heart, color: 'text-nebula-pink', key: 'feature3' },
            ].map((feature, i) => (
              <motion.div 
                key={feature.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="p-4 rounded-xl bg-card/40 border border-border/40 backdrop-blur-sm hover:bg-card/60 transition-colors"
              >
                <feature.icon className={`w-6 h-6 ${feature.color} mx-auto mb-2`} />
                <p className="text-xs text-muted-foreground">{t(`gift.${feature.key}`)}</p>
              </motion.div>
            ))}
          </div>

          {/* Pet Selection - Mix & Match */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Select readings to gift</label>
              {discount > 0 && (
                <span className="px-2 py-1 rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                  {Math.round(discount * 100)}% off applied
                </span>
              )}
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {giftPets.map((pet, index) => (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl border-2 border-border/50 bg-card/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Pet {index + 1}</span>
                      {giftPets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePet(pet.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(TIERS) as [GiftTier, typeof TIERS.essential][]).map(([key, tier]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updatePetTier(pet.id, key)}
                          className={`p-3 rounded-lg border-2 transition-all text-center ${
                            pet.tier === key
                              ? 'border-primary bg-primary/15 shadow-lg shadow-primary/10'
                              : 'border-border/30 bg-card/30 hover:border-primary/30'
                          }`}
                        >
                          <p className={`text-sm font-semibold ${pet.tier === key ? 'text-primary' : 'text-foreground'}`}>
                            {tier.label}
                          </p>
                          <p className="text-lg font-bold text-foreground">${tier.cents / 100}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Pet Button */}
              {giftPets.length < 10 && (
                <button
                  type="button"
                  onClick={addPet}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-border/50 bg-card/20 hover:border-primary/50 hover:bg-card/40 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add another pet</span>
                  {giftPets.length === 1 && (
                    <span className="text-xs text-green-400 ml-2">(20% off with 2+)</span>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Price Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-gradient-to-br from-gold/10 to-amber-500/5 border border-gold/30 space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {petCount} {petCount === 1 ? 'reading' : 'readings'}
              </span>
              <span className="text-foreground">${(pricing.baseTotal / 100).toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Volume discount ({Math.round(discount * 100)}% off)</span>
                <span className="text-green-400">-${(pricing.discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gold/20">
              <span className="text-foreground">Total</span>
              <span className="text-gold">${(pricing.finalTotal / 100).toFixed(2)}</span>
            </div>
            {petCount > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                You save ${(pricing.discountAmount / 100).toFixed(2)}!
              </p>
            )}
          </motion.div>

          {/* Delivery Method */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="space-y-3"
          >
            <label className="text-sm font-medium text-foreground">{t('gift.deliveryMethod')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('email')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  deliveryMethod === 'email'
                    ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
                    : 'border-border/50 bg-card/40 hover:border-primary/50'
                }`}
              >
                <Send className={`w-6 h-6 mx-auto mb-2 ${deliveryMethod === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium text-foreground">{t('gift.sendEmail')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('gift.sendEmailDesc')}</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('link')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  deliveryMethod === 'link'
                    ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
                    : 'border-border/50 bg-card/40 hover:border-primary/50'
                }`}
              >
                <LinkIcon className={`w-6 h-6 mx-auto mb-2 ${deliveryMethod === 'link' ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium text-foreground">{t('gift.getLink')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('gift.getLinkDesc')}</p>
              </button>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form 
            onSubmit={handlePurchase} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-4"
          >
            <CosmicInput
              label={t('gift.yourEmail')}
              type="email"
              value={purchaserEmail}
              onChange={(e) => setPurchaserEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            
            <CosmicInput
              label={t('gift.recipientName')}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={t('gift.recipientNamePlaceholder')}
            />
            
            {deliveryMethod === 'email' && (
              <CosmicInput
                label={t('gift.recipientEmail')}
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder={t('gift.recipientEmailPlaceholder')}
                required
              />
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('gift.personalMessage')}</label>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder={t('gift.messagePlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-card/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none text-foreground placeholder:text-muted-foreground"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{giftMessage.length}/500</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-nebula-pink via-nebula-purple to-primary hover:opacity-90 transition-opacity shadow-xl shadow-nebula-purple/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Purchase Gift — ${(pricing.finalTotal / 100).toFixed(2)}
                </span>
              )}
            </Button>
          </motion.form>

          {/* Trust Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center space-y-2"
          >
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              {t('gift.securePayment')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('gift.validFor')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}