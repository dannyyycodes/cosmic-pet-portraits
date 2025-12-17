import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Sparkles, ArrowLeft, Send, Star, LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const giftAmounts = [
  { cents: 3500, label: 'Basic Report', description: 'Complete cosmic profile' },
  { cents: 5500, label: 'Premium Report', description: 'Extended insights + compatibility' },
  { cents: 8000, label: 'Family Bundle', description: 'Up to 3 pets + family dynamics' },
];

type DeliveryMethod = 'email' | 'link';

export default function GiftPurchase() {
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(3500);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');

  const handlePurchase = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!purchaserEmail) {
      toast.error('Please enter your email');
      return;
    }
    
    if (deliveryMethod === 'email' && !recipientEmail) {
      toast.error('Please enter recipient email');
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
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <StarfieldBackground intensity="calm" />
      
      <div className="w-full max-w-lg relative z-10">
        {/* Back button */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple mb-2">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Give the Gift of Cosmic Discovery
            </h1>
            <p className="text-muted-foreground text-lg">
              A truly meaningful gift that reveals the magic of their beloved pet
            </p>
          </div>

          {/* Emotional value props */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-card/30 border border-border/30">
              <Heart className="w-5 h-5 text-nebula-pink mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Deepens their bond</p>
            </div>
            <div className="p-3 rounded-xl bg-card/30 border border-border/30">
              <Sparkles className="w-5 h-5 text-gold mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Unique & personal</p>
            </div>
            <div className="p-3 rounded-xl bg-card/30 border border-border/30">
              <Star className="w-5 h-5 text-nebula-purple mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Instant delivery</p>
            </div>
          </div>

          {/* Gift amount selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Select Gift Amount</label>
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

          {/* Delivery method toggle */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">How do you want to send this gift?</label>
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
                <p className="text-sm font-medium text-foreground">Send via Email</p>
                <p className="text-xs text-muted-foreground">We'll email them directly</p>
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
                <p className="text-sm font-medium text-foreground">Get a Link</p>
                <p className="text-xs text-muted-foreground">Share it yourself</p>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePurchase} className="space-y-4">
            <CosmicInput
              label="Your Email"
              type="email"
              value={purchaserEmail}
              onChange={(e) => setPurchaserEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            
            <CosmicInput
              label="Recipient's Name (optional)"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Who's this gift for?"
            />
            
            {deliveryMethod === 'email' && (
              <CosmicInput
                label="Recipient's Email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="They'll receive their gift here"
                required
              />
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Personal Message (optional)</label>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Add a heartfelt message to go with your gift..."
                className="w-full min-h-[100px] px-4 py-3 rounded-xl bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>

            {/* Purchase button */}
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
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {deliveryMethod === 'email' ? <Send className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  {deliveryMethod === 'email' ? 'Send Gift' : 'Get Gift Link'} — ${(selectedAmount / 100).toFixed(2)}
                </span>
              )}
            </Button>
          </form>

          {/* How it works */}
          <div className="p-4 rounded-xl bg-card/30 border border-border/30 space-y-2">
            <p className="text-sm font-medium text-foreground">How it works:</p>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Complete your purchase</li>
              <li>2. {deliveryMethod === 'email' 
                ? 'Your recipient gets an email with their gift' 
                : 'You receive a unique gift link to share'}</li>
              <li>3. They fill in their pet's details</li>
              <li>4. Their cosmic report is revealed instantly!</li>
            </ol>
          </div>

          {/* Trust */}
          <p className="text-center text-xs text-muted-foreground">
            Secure payment powered by Stripe. Gift certificates valid for 1 year.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
