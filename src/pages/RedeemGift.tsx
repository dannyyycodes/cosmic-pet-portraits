import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CosmicInput } from '@/components/cosmic/CosmicInput';
import { StarfieldBackground } from '@/components/cosmic/StarfieldBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function RedeemGift() {
  const { t } = useLanguage();
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

  useEffect(() => {
    if (codeFromUrl) {
      validateCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const validateCode = async (code: string) => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-gift-code', {
        body: { code: code.toUpperCase() },
      });

      if (error || data?.error) {
        toast.error(t('redeem.invalidCode'));
        setGiftData(null);
        return;
      }

      if (!data.valid) {
        toast.error(t('redeem.invalidCode'));
        setGiftData(null);
        return;
      }

      setGiftData({
        recipientName: data.recipientName,
        giftMessage: data.giftMessage,
        amountCents: data.amountCents,
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(t('redeem.errorGeneric'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
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
                  {t('redeem.title')}
                </h1>
                <p className="text-muted-foreground">
                  {t('redeem.subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                <CosmicInput
                  label={t('redeem.codeLabel')}
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
                      {t('redeem.validating')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {t('redeem.validateButton')}
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
                      ? t('redeem.receivedTitleName', { name: giftData.recipientName })
                      : t('redeem.receivedTitle')}
                  </h1>
                  <p className="text-muted-foreground">
                    {t('redeem.receivedSubtitle')}
                  </p>
                </div>

                {giftData.giftMessage && (
                  <div className="p-6 rounded-2xl bg-card/50 border border-primary/20 space-y-3">
                    <Heart className="w-6 h-6 text-nebula-pink mx-auto" />
                    <p className="text-foreground italic">"{giftData.giftMessage}"</p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-card/30 border border-border/30 text-left space-y-3">
                  <p className="text-sm font-medium text-foreground text-center">{t('redeem.includes')}</p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      {t('redeem.feature1')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      {t('redeem.feature2')}
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-gold" />
                      {t('redeem.feature3')}
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
                    {t('redeem.continueButton')}
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>

                <p className="text-xs text-muted-foreground">
                  {t('redeem.instructions')}
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}