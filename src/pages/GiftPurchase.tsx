import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Heart, Sparkles, ArrowLeft, Send, Star, LinkIcon, CheckCircle, Quote, Plus, Trash2, PawPrint } from 'lucide-react';
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

const GIFT_TESTIMONIALS = [
  {
    quote: "I gifted this to my sister for her cat's birthday and she literally cried reading it. So thoughtful and unique!",
    author: "Sarah M.",
    pet: "Whiskers the Cat"
  },
  {
    quote: "Best birthday present ever! My mom loved learning about her dog's cosmic personality. She keeps reading it over and over.",
    author: "David K.",
    pet: "Bella the Golden Retriever"
  },
  {
    quote: "Gave this to my best friend who just adopted a rescue. She said it helped her understand her new pup so much better!",
    author: "Emma T.",
    pet: "Luna the Mixed Breed"
  },
  {
    quote: "Perfect Christmas gift for the person who has everything. My dad was skeptical but ended up LOVING his cat's reading!",
    author: "Michael R.",
    pet: "Shadow the Tabby"
  },
  {
    quote: "I got one for each of my cousins' pets. They couldn't stop sharing screenshots in our family group chat!",
    author: "Jessica L.",
    pet: "3 pets gifted"
  }
];

function GiftTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % GIFT_TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative p-5 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm min-h-[120px]"
    >
      <Quote className="absolute top-4 left-4 w-8 h-8 text-gold/20" />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="pl-8"
        >
          <p className="text-sm italic text-foreground/90 mb-3">
            "{GIFT_TESTIMONIALS[currentIndex].quote}"
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gold font-medium">— {GIFT_TESTIMONIALS[currentIndex].author}</p>
            <p className="text-xs text-muted-foreground">{GIFT_TESTIMONIALS[currentIndex].pet}</p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-center gap-1.5 mt-3">
        {GIFT_TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === currentIndex ? 'bg-gold w-4' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}

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
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {t('gift.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t('gift.subtitle')}
            </p>
          </div>

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

          {/* Gift Testimonials Carousel */}
          <GiftTestimonials />

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

          {/* Pet Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" />
              <label className="text-lg font-display font-semibold text-foreground">
                How many pets does your loved one have?
              </label>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {giftPets.map((pet, index) => (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {index === 0 ? "First pet" : index === 1 ? "Second pet" : index === 2 ? "Third pet" : `Pet ${index + 1}`}
                        </span>
                      </div>
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
                    
                    <div className="flex gap-2">
                      {(Object.entries(TIERS) as [GiftTier, typeof TIERS.essential][]).map(([key, tier]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updatePetTier(pet.id, key)}
                          className={`flex-1 p-3 rounded-lg border transition-all text-center ${
                            pet.tier === key
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                              : 'border-border/30 bg-background/30 hover:border-primary/30'
                          }`}
                        >
                          <p className={`text-xs font-medium mb-1 ${pet.tier === key ? 'text-primary' : 'text-muted-foreground'}`}>
                            {tier.label}
                          </p>
                          <p className={`text-base font-bold ${pet.tier === key ? 'text-foreground' : 'text-foreground/80'}`}>
                            ${tier.cents / 100}
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Pet Button */}
              {giftPets.length < 10 && (
                <motion.button
                  type="button"
                  onClick={addPet}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-center gap-2 text-primary"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add another pet</span>
                  {discount < 0.50 && giftPets.length >= 1 && (
                    <span className="text-xs text-green-400 ml-1">
                      +{Math.round((getVolumeDiscount(giftPets.length + 1) - discount) * 100)}% more savings
                    </span>
                  )}
                </motion.button>
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
                placeholder={t('gift.personalMessagePlaceholder')}
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