import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function RedeemGift() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [giftCode, setGiftCode] = useState(codeFromUrl);
  const [isValidating, setIsValidating] = useState(false);
  const [giftData, setGiftData] = useState<{
    recipientName: string | null;
    giftMessage: string | null;
    amountCents: number;
  } | null>(null);

  // Auto-validate if code is in URL
  useEffect(() => {
    if (codeFromUrl) {
      validateCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const validateCode = async (code: string) => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from('gift_certificates')
        .select('recipient_name, gift_message, amount_cents, is_redeemed')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        toast.error('Invalid gift code. Please check and try again.');
        setGiftData(null);
        return;
      }

      if (data.is_redeemed) {
        toast.error('This gift has already been redeemed.');
        setGiftData(null);
        return;
      }

      setGiftData({
        recipientName: data.recipient_name,
        giftMessage: data.gift_message,
        amountCents: data.amount_cents,
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    // Navigate to intake with gift code
    navigate(`/intake?mode=discover&gift=${giftCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <StarfieldBackground intensity="calm" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-center"
        >
          {/* Gift icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-nebula-pink to-nebula-purple mx-auto"
          >
            <Gift className="w-10 h-10 text-white" />
          </motion.div>

          {!giftData ? (
            <>
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Redeem Your Cosmic Gift
                </h1>
                <p className="text-muted-foreground">
                  Enter your gift code to unlock your pet's cosmic profile
                </p>
              </div>

              <div className="space-y-4">
                <CosmicInput
                  label="Gift Code"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                  placeholder="GIFT-XXXX-XXXX"
                  className="text-center text-lg tracking-widest"
                />
                
                <Button
                  onClick={() => validateCode(giftCode)}
                  disabled={!giftCode || isValidating}
                  variant="cosmic"
                  size="lg"
                  className="w-full"
                >
                  {isValidating ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      />
                      Validating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Validate Code
                    </span>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    {giftData.recipientName 
                      ? `${giftData.recipientName}, You've Received a Gift!` 
                      : "You've Received a Cosmic Gift!"}
                  </h1>
                  <p className="text-muted-foreground">
                    Someone special wants you to discover your pet's cosmic truth
                  </p>
                </div>

                {/* Gift message */}
                {giftData.giftMessage && (
                  <div className="p-6 rounded-2xl bg-card/50 border border-primary/20 space-y-3">
                    <Heart className="w-6 h-6 text-nebula-pink mx-auto" />
                    <p className="text-foreground italic">"{giftData.giftMessage}"</p>
                  </div>
                )}

                {/* What you get */}
                <div className="p-4 rounded-xl bg-card/30 border border-border/30 text-left space-y-3">
                  <p className="text-sm font-medium text-foreground text-center">Your gift includes:</p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Complete cosmic personality profile
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Soul mission & hidden gifts
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      Love language & care insights
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={handleContinue}
                  variant="gold"
                  size="xl"
                  className="w-full"
                >
                  <span className="flex items-center gap-2">
                    Tell Us About Your Pet
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>

                <p className="text-xs text-muted-foreground">
                  Just answer a few quick questions about your pet to unlock their reading
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
