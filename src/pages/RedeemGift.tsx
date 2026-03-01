import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Heart, ArrowRight, Star, Wand2, Image, CalendarHeart } from 'lucide-react';
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
    giftTier?: string;
    petCount?: number;
    includesPortrait?: boolean;
    includesWeeklyHoroscope?: boolean;
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
        giftTier: data.giftTier,
        petCount: data.petCount || 1,
        includesPortrait: data.includesPortrait,
        includesWeeklyHoroscope: data.includesWeeklyHoroscope,
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast.error(t('redeem.errorGeneric'));
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinue = () => {
    // Navigate to dedicated gift intake route (always starts fresh)
    const petCount = giftData?.petCount || 1;
    navigate(`/redeem-intake?gift=${giftCode.toUpperCase()}&pets=${petCount}`);
  };

  const getTierName = () => {
    switch (giftData?.giftTier) {
      case 'portrait': return 'Portrait Reading';
      case 'essential': return 'Essential Reading';
      case 'premium': return 'Premium Reading';
      default: return 'Cosmic Pet Reading';
    }
  };

  const getTierDescription = () => {
    const petText = (giftData?.petCount || 1) > 1 ? ` for ${giftData?.petCount} pets` : '';
    switch (giftData?.giftTier) {
      case 'portrait': return `A beautiful cosmic photo card plus complete personality reading${petText}`;
      case 'essential': return `A deep dive into your pet's cosmic personality and soul blueprint${petText}`;
      case 'premium': return `An enhanced cosmic reading with additional insights${petText}`;
      default: return `Discover the cosmic secrets of your beloved companion${petText}`;
    }
  };

  const getTierFeatures = () => {
    const features = [
      { icon: Star, text: 'Complete Personality Profile', included: true },
      { icon: Wand2, text: 'Soul Blueprint & Life Purpose', included: true },
      { icon: Heart, text: 'Love Language Analysis', included: true },
    ];

    if (giftData?.includesPortrait) {
      features.push({ icon: Image, text: 'Cosmic Photo Card', included: true });
    }

    // Show weekly horoscope if included (from addon purchase)
    if (giftData?.includesWeeklyHoroscope) {
      features.push({ icon: CalendarHeart, text: 'Weekly Cosmic Updates', included: true });
    }

    return features;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#FFFDF5' }}>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-center"
        >
          {/* Hero Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="relative inline-block"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#c4a265] to-[#8b6f3a] mx-auto shadow-2xl">
              <Gift className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-24 h-24 rounded-full border-2 border-dashed border-[#c4a265]/30"
            />
          </motion.div>

          {!giftData ? (
            <>
              {/* Enter Code View */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-[#3d2f2a] font-serif">
                  {t('redeem.title')}
                </h1>
                <p className="text-[#5a4a42] text-lg">
                  {t('redeem.subtitle')}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#3d2f2a]">{t('redeem.codeLabel')}</label>
                  <input
                    type="text"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                    placeholder="GIFT-XXXX-XXXX"
                    className="w-full px-4 py-3 bg-[#faf6ef] border border-[#e8ddd0] rounded-xl text-center text-lg tracking-widest font-mono text-[#3d2f2a] placeholder:text-[#9a8578] focus:outline-none focus:ring-2 focus:ring-[#c4a265]/50"
                  />
                </div>

                <button
                  onClick={() => validateCode(giftCode)}
                  disabled={!giftCode || isValidating}
                  className="w-full bg-gradient-to-r from-[#c4a265] to-[#8b6f3a] text-white font-semibold py-3 rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {isValidating ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      />
                      {t('redeem.validating')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {t('redeem.validateButton')}
                    </span>
                  )}
                </button>
              </motion.div>
            </>
          ) : (
            <>
              {/* Gift Revealed View */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c4a265]/10 border border-[#c4a265]/30 rounded-full"
                  >
                    <Sparkles className="w-4 h-4 text-[#c4a265]" />
                    <span className="text-sm font-medium text-[#c4a265]">A Special Gift For You!</span>
                  </motion.div>

                  <h1 className="text-3xl md:text-4xl font-display font-bold text-[#3d2f2a]">
                    {giftData.recipientName
                      ? `Hello ${giftData.recipientName}!`
                      : 'You\'ve Received a Gift!'}
                  </h1>
                  <p className="text-[#5a4a42] text-lg">
                    Someone who cares about you has gifted you a cosmic reading for your pet
                  </p>
                </div>

                {/* Personal Message - More prominent */}
                {giftData.giftMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-white border border-[#e8ddd0] shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-center gap-2 text-[#c4a265]">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-medium uppercase tracking-wide">Personal Message</span>
                      <Heart className="w-5 h-5" />
                    </div>
                    <p className="text-[#3d2f2a] italic text-lg leading-relaxed">"{giftData.giftMessage}"</p>
                  </motion.div>
                )}

                {/* What They've Been Gifted - Clear and Prominent */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 rounded-xl bg-[#c4a265]/5 border border-[#c4a265]/20 text-center space-y-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c4a265]/20 mb-2">
                    <Gift className="w-8 h-8 text-[#c4a265]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#c4a265] uppercase tracking-widest mb-1">You've Been Gifted</p>
                    <h2 className="text-2xl font-display font-bold text-[#3d2f2a]">{getTierName()}</h2>
                    <p className="text-sm text-[#9a8578] mt-2">{getTierDescription()}</p>
                  </div>
                </motion.div>

                {/* Features Included */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-5 rounded-xl bg-white border border-[#e8ddd0] text-left space-y-4"
                >
                  <p className="text-sm font-semibold text-[#3d2f2a] text-center">Your Gift Includes:</p>
                  <ul className="space-y-3">
                    {getTierFeatures().map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#c4a265]/10 flex items-center justify-center">
                          <feature.icon className="w-4 h-4 text-[#c4a265]" />
                        </div>
                        <span className="text-sm text-[#3d2f2a]">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* How it Works - Brief */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center space-y-2"
                >
                  <p className="text-sm text-[#9a8578]">
                    Simply tell us about your pet and we'll generate their personalized cosmic reading
                  </p>
                </motion.div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-[#c4a265] to-[#8b6f3a] text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-[#c4a265]/20 hover:opacity-90"
                >
                  <span className="flex items-center justify-center gap-2">
                    Enter Pet Details
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </button>

                <p className="text-xs text-[#9a8578]">
                  Takes about 2 minutes • Your reading will be ready instantly
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
