import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowLeft, Send, LinkIcon, CheckCircle, Plus, Trash2, ChevronRight, Users, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type DeliveryMethod = 'email' | 'link';
type GiftTier = 'essential' | 'portrait' | 'vip';

interface GiftRecipient {
  id: string;
  name: string;
  email: string;
  tier: GiftTier;
}

const TIERS = {
  essential: { cents: 3500, label: 'Essential', description: 'Core cosmic reading' },
  portrait: { cents: 5000, label: 'Portrait', description: 'With AI portrait' },
  vip: { cents: 12900, label: 'VIP', description: 'Full cosmic package' },
} as const;

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.50;
  if (count >= 4) return 0.40;
  if (count >= 3) return 0.30;
  if (count >= 2) return 0.20;
  return 0;
};

export default function GiftPurchase() {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [giftType, setGiftType] = useState<'single' | 'multiple' | null>(null);
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Single recipient state
  const [singleRecipient, setSingleRecipient] = useState<GiftRecipient>({
    id: crypto.randomUUID(),
    name: '',
    email: '',
    tier: 'portrait'
  });

  // Multiple recipients state
  const [recipients, setRecipients] = useState<GiftRecipient[]>([
    { id: crypto.randomUUID(), name: '', email: '', tier: 'portrait' }
  ]);

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    const baseTotal = activeRecipients.reduce((sum, r) => sum + TIERS[r.tier].cents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const finalTotal = baseTotal - discountAmount;
    return { baseTotal, discountAmount, finalTotal };
  }, [activeRecipients, discount]);

  const addRecipient = () => {
    if (recipients.length < 10) {
      setRecipients([...recipients, { id: crypto.randomUUID(), name: '', email: '', tier: 'portrait' }]);
    }
  };

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter(r => r.id !== id));
    }
  };

  const updateRecipient = (id: string, field: keyof GiftRecipient, value: string) => {
    if (giftType === 'single') {
      setSingleRecipient({ ...singleRecipient, [field]: value });
    } else {
      setRecipients(recipients.map(r => r.id === id ? { ...r, [field]: value } : r));
    }
  };

  const canProceedToStep2 = giftType !== null;
  const canProceedToStep3 = () => {
    if (deliveryMethod === 'link') return true;
    if (giftType === 'single') return singleRecipient.email.includes('@');
    return recipients.every(r => r.email.includes('@'));
  };

  const handlePurchase = async () => {
    if (!purchaserEmail.includes('@')) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const giftPets = activeRecipients.map(r => ({
        id: r.id,
        tier: r.tier,
        recipientName: r.name,
        recipientEmail: deliveryMethod === 'email' ? r.email : null,
      }));

      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', {
        body: {
          purchaserEmail,
          recipientEmail: giftType === 'single' && deliveryMethod === 'email' ? singleRecipient.email : null,
          recipientName: giftType === 'single' ? singleRecipient.name : null,
          giftMessage,
          giftPets,
          deliveryMethod,
          multiRecipient: giftType === 'multiple',
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Gift purchase error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8 relative overflow-hidden">
      <StarfieldBackground intensity="calm" />
      
      <div className="w-full max-w-xl relative z-10">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nav.backHome')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-nebula-pink via-nebula-purple to-primary shadow-xl shadow-nebula-purple/30 mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Give the Gift of Cosmic Insight
          </h1>
          <p className="text-muted-foreground">
            A unique, personalized reading for someone's beloved pet
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Choose gift type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  How many gifts are you sending?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose whether you're gifting to one person or multiple people
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setGiftType('single')}
                  className={`p-6 rounded-2xl border-2 transition-all text-center ${
                    giftType === 'single'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border/50 bg-card/40 hover:border-primary/50'
                  }`}
                >
                  <User className={`w-10 h-10 mx-auto mb-3 ${giftType === 'single' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-lg font-semibold text-foreground">One Person</p>
                  <p className="text-sm text-muted-foreground mt-1">For their pet(s)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGiftType('multiple')}
                  className={`p-6 rounded-2xl border-2 transition-all text-center ${
                    giftType === 'multiple'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border/50 bg-card/40 hover:border-primary/50'
                  }`}
                >
                  <Users className={`w-10 h-10 mx-auto mb-3 ${giftType === 'multiple' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-lg font-semibold text-foreground">Multiple People</p>
                  <p className="text-sm text-muted-foreground mt-1">Different recipients</p>
                </button>
              </div>

              {giftType && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedToStep2}
                    className="w-full py-6 text-lg bg-gradient-to-r from-primary to-nebula-purple"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Add recipients */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  {giftType === 'single' ? 'Recipient Details' : 'Add Recipients'}
                </h2>
                <div className="w-12" />
              </div>

              {/* Delivery method */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">How will you deliver the gift?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('email')}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      deliveryMethod === 'email'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 bg-card/40 hover:border-primary/50'
                    }`}
                  >
                    <Send className={`w-5 h-5 mx-auto mb-2 ${deliveryMethod === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm font-medium text-foreground">Email directly</p>
                    <p className="text-xs text-muted-foreground">We'll send it for you</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('link')}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      deliveryMethod === 'link'
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 bg-card/40 hover:border-primary/50'
                    }`}
                  >
                    <LinkIcon className={`w-5 h-5 mx-auto mb-2 ${deliveryMethod === 'link' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-sm font-medium text-foreground">Get a link</p>
                    <p className="text-xs text-muted-foreground">Send it yourself</p>
                  </button>
                </div>
              </div>

              {/* Single recipient form */}
              {giftType === 'single' && (
                <div className="p-5 rounded-2xl border border-border/50 bg-card/30 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Recipient's name</label>
                      <input
                        type="text"
                        value={singleRecipient.name}
                        onChange={(e) => updateRecipient(singleRecipient.id, 'name', e.target.value)}
                        placeholder="Their name"
                        className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    {deliveryMethod === 'email' && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Recipient's email</label>
                        <input
                          type="email"
                          value={singleRecipient.email}
                          onChange={(e) => updateRecipient(singleRecipient.id, 'email', e.target.value)}
                          placeholder="their@email.com"
                          className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Choose package</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(TIERS) as [GiftTier, typeof TIERS.essential][]).map(([key, tier]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateRecipient(singleRecipient.id, 'tier', key)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            singleRecipient.tier === key
                              ? 'border-primary bg-primary/10'
                              : 'border-border/30 bg-background/30 hover:border-primary/30'
                          }`}
                        >
                          <p className={`text-xs font-medium ${singleRecipient.tier === key ? 'text-primary' : 'text-muted-foreground'}`}>
                            {tier.label}
                          </p>
                          <p className={`text-lg font-bold ${singleRecipient.tier === key ? 'text-foreground' : 'text-foreground/70'}`}>
                            ${tier.cents / 100}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Multiple recipients */}
              {giftType === 'multiple' && (
                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <motion.div
                      key={recipient.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-border/50 bg-card/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-nebula-purple flex items-center justify-center text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {recipient.name || `Recipient ${index + 1}`}
                          </span>
                        </div>
                        {recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipient(recipient.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <input
                          type="text"
                          value={recipient.name}
                          onChange={(e) => updateRecipient(recipient.id, 'name', e.target.value)}
                          placeholder="Name"
                          className="px-3 py-2.5 text-sm rounded-lg bg-background/50 border border-border/40 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                        />
                        {deliveryMethod === 'email' && (
                          <input
                            type="email"
                            value={recipient.email}
                            onChange={(e) => updateRecipient(recipient.id, 'email', e.target.value)}
                            placeholder="Email"
                            className="px-3 py-2.5 text-sm rounded-lg bg-background/50 border border-border/40 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {(Object.entries(TIERS) as [GiftTier, typeof TIERS.essential][]).map(([key, tier]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateRecipient(recipient.id, 'tier', key)}
                            className={`p-2 rounded-lg border transition-all text-center ${
                              recipient.tier === key
                                ? 'border-primary bg-primary/10'
                                : 'border-border/30 bg-background/30 hover:border-primary/30'
                            }`}
                          >
                            <p className={`text-xs font-medium ${recipient.tier === key ? 'text-primary' : 'text-muted-foreground'}`}>
                              {tier.label}
                            </p>
                            <p className={`text-sm font-bold ${recipient.tier === key ? 'text-foreground' : 'text-foreground/70'}`}>
                              ${tier.cents / 100}
                            </p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  {recipients.length < 10 && (
                    <button
                      type="button"
                      onClick={addRecipient}
                      className="w-full p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-center gap-2 text-primary"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Add another recipient</span>
                      {discount < 0.50 && recipients.length >= 1 && (
                        <span className="text-xs text-green-400 ml-1">
                          +{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% savings
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}

              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3()}
                className="w-full py-6 text-lg bg-gradient-to-r from-primary to-nebula-purple"
              >
                Continue to Checkout
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 3: Checkout */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Complete Purchase
                </h2>
                <div className="w-12" />
              </div>

              {/* Order Summary */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border/30">
                  <Gift className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Order Summary</h3>
                </div>

                <div className="space-y-2">
                  {activeRecipients.map((r, index) => (
                    <div key={r.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{TIERS[r.tier].label} Reading</p>
                          {(r.name || r.email) && deliveryMethod === 'email' && (
                            <p className="text-xs text-primary">→ {r.name || r.email}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">${(TIERS[r.tier].cents / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${(pricing.baseTotal / 100).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {Math.round(discount * 100)}% Volume Discount
                      </span>
                      <span className="text-green-400">-${(pricing.discountAmount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-3 border-t border-border/30">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">${(pricing.finalTotal / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Your details */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Your email (for receipt)</label>
                  <input
                    type="email"
                    value={purchaserEmail}
                    onChange={(e) => setPurchaserEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Personal message (optional)</label>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Add a personal note to your gift..."
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground resize-none"
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isLoading || !purchaserEmail.includes('@')}
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
                    Pay ${(pricing.finalTotal / 100).toFixed(2)}
                  </span>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Secure checkout • Gift valid for 1 year
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
