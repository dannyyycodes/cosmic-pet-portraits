import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Sparkles, ArrowLeft, Send, Star, LinkIcon, CheckCircle, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type DeliveryMethod = 'email' | 'link';

export default function GiftPurchase() {
  const { t } = useLanguage();
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(3500);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');

  const giftAmounts = [
    { cents: 3500, tier: 'essential', label: t('gift.tier1Name'), description: t('gift.tier1Desc') },
    { cents: 5000, tier: 'portrait', label: t('gift.tier2Name'), description: t('gift.tier2Desc') },
    { cents: 12900, tier: 'vip', label: t('gift.tier3Name'), description: t('gift.tier3Desc') },
  ];

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
          amountCents: selectedAmount,
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
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple mb-2">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {t('gift.title')}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t('gift.subtitle')}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-nebula-pink/10 to-nebula-purple/10 border border-nebula-pink/20 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-nebula-pink" />
              {t('gift.whyPerfect')}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('gift.reason1Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('gift.reason1Desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('gift.reason2Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('gift.reason2Desc')}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t('gift.reason3Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('gift.reason3Desc')}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="relative p-5 rounded-2xl bg-card/40 border border-border/40">
            <Quote className="absolute top-4 left-4 w-6 h-6 text-gold/30" />
            <div className="pl-6">
              <p className="text-sm italic text-foreground/90 mb-3">
                {t('gift.testimonial')}
              </p>
              <p className="text-xs text-muted-foreground">— {t('gift.testimonialAuthor')}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-card/30 border border-border/30">
              <Sparkles className="w-5 h-5 text-gold mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t('gift.feature1')}</p>
            </div>
            <div className="p-3 rounded-xl bg-card/30 border border-border/30">
              <Star className="w-5 h-5 text-nebula-purple mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t('gift.feature2')}</p>
            </div>
            <div className="p-3 rounded-xl bg-card/30 border border-border/30">
              <Heart className="w-5 h-5 text-nebula-pink mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t('gift.feature3')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t('gift.selectAmount')}</label>
            <div className="space-y-2">
              {giftAmounts.map((amount) => (
                <button
                  key={amount.cents}
                  onClick={() => setSelectedAmount(amount.cents)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                    selectedAmount === amount.cents
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 bg-card/30 hover:border-primary/50'
                  }`}
                >
                  <div>
                    <p className="font-medium text-foreground">{amount.label}</p>
                    <p className="text-sm text-muted-foreground">{amount.description}</p>
                  </div>
                  <span className="text-lg font-bold text-primary">${(amount.cents / 100).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">{t('gift.deliveryMethod')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('email')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  deliveryMethod === 'email'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card/30 hover:border-primary/50'
                }`}
              >
                <Send className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">{t('gift.sendEmail')}</p>
                <p className="text-xs text-muted-foreground">{t('gift.sendEmailDesc')}</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod('link')}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  deliveryMethod === 'link'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card/30 hover:border-primary/50'
                }`}
              >
                <LinkIcon className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">{t('gift.getLink')}</p>
                <p className="text-xs text-muted-foreground">{t('gift.getLinkDesc')}</p>
              </button>
            </div>
          </div>

          <form onSubmit={handlePurchase} className="space-y-4">
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
                className="w-full min-h-[100px] px-4 py-3 rounded-xl bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !purchaserEmail || (deliveryMethod === 'email' && !recipientEmail)}
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
                  {t('gift.processing')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {deliveryMethod === 'email' ? <Send className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  {deliveryMethod === 'email' ? t('gift.sendGift') : t('gift.getGiftLink')} — ${(selectedAmount / 100).toFixed(2)}
                </span>
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {t('gift.securePayment')}
            </p>
            <p className="text-xs text-gold">
              💛 {t('gift.socialProof')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}