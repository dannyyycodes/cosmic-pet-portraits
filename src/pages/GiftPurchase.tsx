import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowLeft, Send, LinkIcon, CheckCircle, Plus, Trash2, ChevronRight, Users, User, Sparkles, Heart, Star, Quote, Shield, Clock } from 'lucide-react';
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
  horoscopeAddon?: 'none' | 'monthly' | 'yearly';
}

const TIERS = {
  essential: { 
    cents: 3500, 
    label: 'Essential', 
    description: 'A thoughtful surprise',
    icon: '⭐',
    features: [
      "They'll discover their pet's cosmic personality",
      "Finally understand those funny quirks",
      "A gift that shows you really care",
    ],
    shortFeatures: ['Personality', 'Quirks', 'Heartfelt'],
    highlight: null,
  },
  portrait: { 
    cents: 5000, 
    label: 'Portrait', 
    description: 'The gift they\'ll treasure',
    icon: '🎨',
    features: [
      "Everything in Essential, plus...",
      "A collectible card with fun cosmic stats",
      "Frame it, share it, treasure it forever",
    ],
    shortFeatures: ['+ Portrait', '+ Share Card'],
    popular: true,
    highlight: 'Best Value',
  },
  vip: { 
    cents: 12900, 
    label: 'VIP', 
    description: 'The ultimate pet lover gift',
    icon: '👑',
    features: [
      "Everything in Portrait, plus...",
      "A full year of weekly cosmic updates",
      "The gift that keeps on giving",
    ],
    shortFeatures: ['+ 52 Horoscopes', '+ Year of Joy'],
    highlight: 'Premium',
  },
} as const;

const HOROSCOPE_ADDONS = {
  none: { cents: 0, label: 'No thanks', description: '', save: '' },
  monthly: { cents: 499, label: 'Monthly', description: '$4.99/mo', save: '' },
  yearly: { cents: 3999, label: 'Yearly', description: '$39.99/year', save: 'Save 33%' },
} as const;

const TESTIMONIALS = [
  { quote: "My sister literally cried reading her cat's report. Best gift ever!", author: "Sarah M.", rating: 5 },
  { quote: "Got this for my mom's birthday - she reads it to her dog every night now!", author: "David K.", rating: 5 },
  { quote: "Gifted to 4 friends last Christmas. They still talk about it!", author: "Jessica L.", rating: 5 },
  { quote: "My dad was skeptical but ended up LOVING his cat's reading!", author: "Michael R.", rating: 5 },
];

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.50;
  if (count >= 4) return 0.40;
  if (count >= 3) return 0.30;
  if (count >= 2) return 0.20;
  return 0;
};

function TestimonialBanner() {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="p-4 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-start gap-3"
        >
          <Quote className="w-5 h-5 text-gold/50 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground/90 italic mb-2">"{TESTIMONIALS[index].quote}"</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">— {TESTIMONIALS[index].author}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

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
    tier: 'portrait',
    horoscopeAddon: 'none'
  });

  // Multiple recipients state
  const [recipients, setRecipients] = useState<GiftRecipient[]>([
    { id: crypto.randomUUID(), name: '', email: '', tier: 'portrait', horoscopeAddon: 'none' }
  ]);

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    const baseTotal = activeRecipients.reduce((sum, r) => {
      const tierCents = TIERS[r.tier].cents;
      const addonCents = r.horoscopeAddon && r.horoscopeAddon !== 'none' ? HOROSCOPE_ADDONS[r.horoscopeAddon].cents : 0;
      return sum + tierCents + addonCents;
    }, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const finalTotal = baseTotal - discountAmount;
    return { baseTotal, discountAmount, finalTotal };
  }, [activeRecipients, discount]);

  const addRecipient = () => {
    if (recipients.length < 10) {
      setRecipients([...recipients, { id: crypto.randomUUID(), name: '', email: '', tier: 'portrait', horoscopeAddon: 'none' }]);
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
        recipientName: r.name || '',
        recipientEmail: deliveryMethod === 'email' ? r.email : null,
      }));

      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', {
        body: {
          purchaserEmail,
          recipientEmail: giftType === 'single' && deliveryMethod === 'email' ? singleRecipient.email : '',
          recipientName: giftType === 'single' ? (singleRecipient.name || '') : '',
          giftMessage: giftMessage || '',
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
              {/* How It Works */}
              <div className="p-5 rounded-2xl bg-card/60 border border-border/40 space-y-4">
                <h3 className="font-display font-semibold text-foreground text-center">
                  How It Works
                </h3>
                <div className="space-y-3">
                  {[
                    { step: "1", title: "You purchase the gift", desc: "Choose a package & complete checkout" },
                    { step: "2", title: "Gift it your way", desc: "Email it, text it, or print the link for a card" },
                    { step: "3", title: "They enter their pet's details", desc: "Name, birthday & a cute photo" },
                    { step: "4", title: "A reading crafted just for them", desc: "Personalized insights they'll treasure forever" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why it's a perfect gift */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-nebula-pink/10 to-nebula-purple/10 border border-nebula-pink/20 space-y-3">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-nebula-pink" />
                  Why Pet Lovers Adore This Gift
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { icon: Sparkles, text: "Deeply personal & one-of-a-kind", color: "text-gold" },
                    { icon: Heart, text: "Shows you truly know what they love", color: "text-nebula-pink" },
                    { icon: Star, text: "Beautifully crafted cosmic insights", color: "text-primary" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <span className="text-foreground/90">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <TestimonialBanner />

              <div className="text-center pt-2">
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">
                  How many gifts are you sending?
                </h2>
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
                  className={`p-6 rounded-2xl border-2 transition-all text-center relative overflow-hidden ${
                    giftType === 'multiple'
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-border/50 bg-card/40 hover:border-primary/50'
                  }`}
                >
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/20 rounded-full">
                    <span className="text-[10px] font-bold text-green-400">SAVE UP TO 50%</span>
                  </div>
                  <Users className={`w-10 h-10 mx-auto mb-3 ${giftType === 'multiple' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-lg font-semibold text-foreground">Multiple People</p>
                  <p className="text-sm text-muted-foreground mt-1">Great for holidays!</p>
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 py-2">
                {[
                  { icon: Shield, text: "Secure checkout" },
                  { icon: Clock, text: "Instant delivery" },
                  { icon: Gift, text: "Valid 1 year" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.text}</span>
                  </div>
                ))}
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

              {/* Delivery method - Enhanced design */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">How should we deliver the gift?</h3>
                    <p className="text-sm text-muted-foreground">Choose how your recipient receives it</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('email')}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                      deliveryMethod === 'email'
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                        : 'border-border/50 bg-background/50 hover:border-primary/40 hover:bg-card/50'
                    }`}
                  >
                    {deliveryMethod === 'email' && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${
                      deliveryMethod === 'email' 
                        ? 'bg-primary/20' 
                        : 'bg-muted/50 group-hover:bg-primary/10'
                    }`}>
                      <Send className={`w-6 h-6 ${deliveryMethod === 'email' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
                    </div>
                    <p className="font-semibold text-foreground mb-1">Email directly</p>
                    <p className="text-sm text-muted-foreground leading-snug">We'll send a beautiful gift email on your behalf</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Instant delivery</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('link')}
                    className={`relative p-5 rounded-xl border-2 transition-all text-left group ${
                      deliveryMethod === 'link'
                        ? 'border-gold bg-gold/10 shadow-lg shadow-gold/10'
                        : 'border-border/50 bg-background/50 hover:border-gold/40 hover:bg-card/50'
                    }`}
                  >
                    {/* Recommended badge */}
                    <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-gold to-amber-500 text-background text-[10px] font-bold rounded-full shadow-sm">
                      ✨ FLEXIBLE
                    </div>
                    {deliveryMethod === 'link' && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-gold" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${
                      deliveryMethod === 'link' 
                        ? 'bg-gold/20' 
                        : 'bg-muted/50 group-hover:bg-gold/10'
                    }`}>
                      <LinkIcon className={`w-6 h-6 ${deliveryMethod === 'link' ? 'text-gold' : 'text-muted-foreground group-hover:text-gold/70'}`} />
                    </div>
                    <p className="font-semibold text-foreground mb-1">Get a magic link</p>
                    <p className="text-sm text-muted-foreground leading-snug">Share via text, card, or gift it in person</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gold">
                      <Heart className="w-3 h-3" />
                      <span>Perfect for surprises</span>
                    </div>
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
                    <label className="text-sm font-medium text-foreground mb-3 block">Choose their package</label>
                    <div className="space-y-3">
                      {(Object.entries(TIERS) as [GiftTier, typeof TIERS.portrait][]).map(([key, tier]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateRecipient(singleRecipient.id, 'tier', key)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                            singleRecipient.tier === key
                              ? 'border-primary bg-gradient-to-br from-primary/15 to-primary/5 shadow-lg shadow-primary/10'
                              : 'border-border/40 bg-card/40 hover:border-primary/40 hover:bg-card/60'
                          } ${'popular' in tier && tier.popular ? 'ring-2 ring-gold/40' : ''}`}
                        >
                          {/* Badge */}
                          {'highlight' in tier && tier.highlight && (
                            <span className={`absolute -top-0 right-4 px-3 py-1 text-[10px] font-bold rounded-b-lg ${
                              tier.highlight === 'Best Value' 
                                ? 'bg-gradient-to-r from-gold to-amber-500 text-background' 
                                : 'bg-gradient-to-r from-nebula-purple to-nebula-pink text-white'
                            }`}>
                              {tier.highlight}
                            </span>
                          )}
                          
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{'icon' in tier ? tier.icon : '⭐'}</span>
                              <div>
                                <p className={`font-bold text-lg ${singleRecipient.tier === key ? 'text-foreground' : 'text-foreground/90'}`}>
                                  {tier.label}
                                </p>
                                <p className="text-sm text-muted-foreground">{tier.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${singleRecipient.tier === key ? 'text-primary' : 'text-foreground/80'}`}>
                                ${tier.cents / 100}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 pl-1">
                            {tier.features.map((f, i) => (
                              <p key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                                {f}
                              </p>
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Updates Addon - only show if not VIP (VIP already includes) */}
                  {singleRecipient.tier !== 'vip' && (
                    <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-nebula-purple/10 to-primary/10 border border-nebula-purple/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-nebula-purple" />
                        <h4 className="font-semibold text-foreground">Add Weekly Cosmic Updates?</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Give them fresh insights every week — a gift that keeps delighting!
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(['none', 'monthly', 'yearly'] as const).map((option) => {
                          const addon = HOROSCOPE_ADDONS[option];
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => updateRecipient(singleRecipient.id, 'horoscopeAddon', option)}
                              className={`p-3 rounded-lg border-2 transition-all text-center relative ${
                                singleRecipient.horoscopeAddon === option
                                  ? 'border-nebula-purple bg-nebula-purple/15'
                                  : 'border-border/40 bg-background/40 hover:border-nebula-purple/40'
                              }`}
                            >
                              {addon.save && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[9px] font-bold bg-green-500 text-white rounded-full">
                                  {addon.save}
                                </span>
                              )}
                              <p className={`text-sm font-semibold ${singleRecipient.horoscopeAddon === option ? 'text-nebula-purple' : 'text-foreground/80'}`}>
                                {addon.label}
                              </p>
                              {option !== 'none' && (
                                <p className="text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                        {(Object.entries(TIERS) as [GiftTier, typeof TIERS.portrait][]).map(([key, tier]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateRecipient(recipient.id, 'tier', key)}
                            className={`p-3 rounded-lg border-2 transition-all text-center relative ${
                              recipient.tier === key
                                ? 'border-primary bg-primary/10 shadow-md'
                                : 'border-border/30 bg-background/30 hover:border-primary/30'
                            } ${'popular' in tier && tier.popular ? 'ring-1 ring-gold/30' : ''}`}
                          >
                            {'highlight' in tier && tier.highlight && (
                              <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0 text-[8px] font-bold rounded-full ${
                                tier.highlight === 'Best Value' 
                                  ? 'bg-gold text-background' 
                                  : 'bg-nebula-purple text-white'
                              }`}>
                                {tier.highlight === 'Best Value' ? 'BEST' : 'VIP'}
                              </span>
                            )}
                            <span className="text-lg block mb-1">{'icon' in tier ? tier.icon : '⭐'}</span>
                            <p className={`text-xs font-medium ${recipient.tier === key ? 'text-primary' : 'text-muted-foreground'}`}>
                              {tier.label}
                            </p>
                            <p className={`text-sm font-bold ${recipient.tier === key ? 'text-foreground' : 'text-foreground/70'}`}>
                              ${tier.cents / 100}
                            </p>
                          </button>
                        ))}
                      </div>
                      
                      {/* Show features for selected tier */}
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <div className="flex flex-wrap gap-1.5">
                          {TIERS[recipient.tier].features.map((f, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary/90 border border-primary/20">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
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

              {/* Money-back guarantee */}
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-400 text-sm mb-1">They'll Love It — Guaranteed</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      We're so confident they'll adore their cosmic pet reading that we offer a <span className="font-medium text-green-400">100% money-back guarantee</span>. If they're not amazed, full refund — no questions asked.
                    </p>
                  </div>
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
                    Complete Purchase — ${(pricing.finalTotal / 100).toFixed(2)}
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  Secure checkout
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Instant delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  Valid 1 year
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
