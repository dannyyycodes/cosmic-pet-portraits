import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Sparkles, ArrowLeft, Send, Star, LinkIcon, CheckCircle, Quote, Shield, Users, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type DeliveryMethod = 'email' | 'link';

// Volume discount tiers
const VOLUME_DISCOUNTS = [
  { minPets: 1, discount: 0, label: '' },
  { minPets: 2, discount: 20, label: '20% off' },
  { minPets: 3, discount: 30, label: '30% off' },
  { minPets: 4, discount: 40, label: '40% off' },
  { minPets: 5, discount: 50, label: '50% off' },
];

const getVolumeDiscount = (petCount: number) => {
  for (let i = VOLUME_DISCOUNTS.length - 1; i >= 0; i--) {
    if (petCount >= VOLUME_DISCOUNTS[i].minPets) {
      return VOLUME_DISCOUNTS[i];
    }
  }
  return VOLUME_DISCOUNTS[0];
};

export default function GiftPurchase() {
  const { t } = useLanguage();
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [selectedTier, setSelectedTier] = useState<'essential' | 'portrait' | 'vip'>('portrait');
  const [petCount, setPetCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');

  const giftTiers = [
    { tier: 'essential' as const, baseCents: 3500, label: t('gift.tier1Name'), description: t('gift.tier1Desc'), popular: false },
    { tier: 'portrait' as const, baseCents: 5000, label: t('gift.tier2Name'), description: t('gift.tier2Desc'), popular: true },
    { tier: 'vip' as const, baseCents: 12900, label: t('gift.tier3Name'), description: t('gift.tier3Desc'), popular: false },
  ];

  const selectedTierData = giftTiers.find(t => t.tier === selectedTier)!;
  const volumeDiscount = getVolumeDiscount(petCount);
  
  const pricing = useMemo(() => {
    const baseTotal = selectedTierData.baseCents * petCount;
    const discountAmount = Math.round(baseTotal * (volumeDiscount.discount / 100));
    const finalTotal = baseTotal - discountAmount;
    const perPetPrice = Math.round(finalTotal / petCount);
    return { baseTotal, discountAmount, finalTotal, perPetPrice };
  }, [selectedTierData.baseCents, petCount, volumeDiscount.discount]);

  const handlePetCountChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(10, petCount + delta));
    setPetCount(newCount);
  };

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
          tier: selectedTier,
          petCount,
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

          {/* Gift Tier Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <label className="text-sm font-medium text-foreground">{t('gift.selectAmount')}</label>
            <div className="space-y-3">
              {giftTiers.map((tier) => (
                <button
                  key={tier.tier}
                  onClick={() => setSelectedTier(tier.tier)}
                  className={`relative w-full p-5 rounded-xl border-2 transition-all text-left flex items-center justify-between group ${
                    selectedTier === tier.tier
                      ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
                      : 'border-border/50 bg-card/40 hover:border-primary/50 hover:bg-card/60'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-2.5 right-4 px-3 py-0.5 text-xs font-bold bg-gradient-to-r from-gold to-amber-500 text-background rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedTier === tier.tier ? 'border-primary bg-primary' : 'border-muted-foreground/50'
                    }`}>
                      {selectedTier === tier.tier && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{tier.label}</p>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                  </div>
                  <span className={`text-xl font-bold ${selectedTier === tier.tier ? 'text-primary' : 'text-foreground'}`}>
                    ${(tier.baseCents / 100).toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pet Count Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="space-y-3"
          >
            <label className="text-sm font-medium text-foreground">How many pet readings to gift?</label>
            <div className="p-5 rounded-xl border-2 border-border/50 bg-card/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handlePetCountChange(-1)}
                    disabled={petCount <= 1}
                    className="w-10 h-10 rounded-full border-2 border-border/50 bg-card/50 flex items-center justify-center hover:border-primary/50 hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-center min-w-[60px]">
                    <span className="text-3xl font-bold text-foreground">{petCount}</span>
                    <p className="text-xs text-muted-foreground">{petCount === 1 ? 'pet' : 'pets'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePetCountChange(1)}
                    disabled={petCount >= 10}
                    className="w-10 h-10 rounded-full border-2 border-border/50 bg-card/50 flex items-center justify-center hover:border-primary/50 hover:bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {volumeDiscount.discount > 0 && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30"
                  >
                    <span className="text-sm font-bold text-green-400">{volumeDiscount.label}</span>
                  </motion.div>
                )}
              </div>
              
              {/* Volume Discount Tiers Preview */}
              <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-border/30">
                {VOLUME_DISCOUNTS.slice(1).map((tier) => (
                  <div 
                    key={tier.minPets}
                    className={`px-2 py-1 rounded-md text-xs transition-colors ${
                      petCount >= tier.minPets 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-card/30 text-muted-foreground'
                    }`}
                  >
                    {tier.minPets}+ pets: {tier.label}
                  </div>
                ))}
              </div>
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
              <span className="text-muted-foreground">{petCount}x {selectedTierData.label}</span>
              <span className="text-foreground">${(pricing.baseTotal / 100).toFixed(2)}</span>
            </div>
            {volumeDiscount.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Volume discount ({volumeDiscount.discount}% off)</span>
                <span className="text-green-400">-${(pricing.discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gold/20">
              <span className="text-foreground">Total</span>
              <span className="text-gold">${(pricing.finalTotal / 100).toFixed(2)}</span>
            </div>
            {petCount > 1 && (
              <p className="text-xs text-muted-foreground text-center">
                (${(pricing.perPetPrice / 100).toFixed(2)} per pet)
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
                className="w-full min-h-[100px] px-4 py-3 rounded-xl bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !purchaserEmail || (deliveryMethod === 'email' && !recipientEmail)}
              variant="gold"
              size="xl"
              className="w-full shadow-xl shadow-gold/20"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                  />
                  {t('gift.processing')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {deliveryMethod === 'email' ? <Send className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  {deliveryMethod === 'email' ? t('gift.sendGift') : t('gift.getGiftLink')} — ${(pricing.finalTotal / 100).toFixed(2)}
                </span>
              )}
            </Button>
          </motion.form>

          {/* Trust Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 text-center"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs">{t('gift.securePayment')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 text-gold" />
              <span className="text-xs">{t('gift.socialProof')}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
