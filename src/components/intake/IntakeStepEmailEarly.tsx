import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { ArrowLeft, Sparkles, Shield, Bell, Heart, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getReferralCode } from '@/lib/referralTracking';
import { getSunSign, zodiacSigns } from '@/lib/zodiac';

interface IntakeStepEmailEarlyProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
  currentStep: number;
  modeContent: ModeContent;
}

export function IntakeStepEmailEarly({ 
  petData, 
  onUpdate, 
  onNext, 
  onBack, 
  totalSteps,
  currentStep,
  modeContent
}: IntakeStepEmailEarlyProps) {
  const [isTracking, setIsTracking] = useState(false);
  const hasTracked = useRef(false);
  
  // Calculate zodiac sign from DOB for personalization
  const zodiacSign = petData.dateOfBirth 
    ? getSunSign(petData.dateOfBirth.getMonth() + 1, petData.dateOfBirth.getDate())
    : null;
  const signData = zodiacSign ? zodiacSigns[zodiacSign] : null;
  
  // Stricter email validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(petData.email.trim());
  
  // Sanitize email input
  const handleEmailChange = (value: string) => {
    const sanitized = value.trim().replace(/[,\s]+$/, '');
    onUpdate({ email: sanitized });
  };

  const handleContinue = async () => {
    if (!isValidEmail) return;
    
    setIsTracking(true);
    
    // Track subscriber asynchronously - only once
    if (!hasTracked.current) {
      hasTracked.current = true;
      supabase.functions.invoke('track-subscriber', {
        body: { 
          email: petData.email.trim(),
          event: 'intake_started',
          petName: petData.name,
          referralCode: getReferralCode(),
        },
      }).catch(console.error);
    }
    
    // Short delay for visual feedback then continue
    setTimeout(() => {
      setIsTracking(false);
      onNext();
    }, 300);
  };

  // Get occasion-specific friendly headline
  const getHeadline = () => {
    if (petData.occasionMode === 'memorial') {
      return `Where should we send ${petData.name}'s memorial?`;
    }
    if (signData) {
      return `${petData.name} is a ${signData.name}! ${signData.icon}`;
    }
    return `Almost there with ${petData.name}!`;
  };

  const getSubheadline = () => {
    if (petData.occasionMode === 'memorial') {
      return `We'll keep ${petData.name}'s cosmic tribute safe and send it to your inbox`;
    }
    if (signData) {
      return `We've calculated their cosmic profile. Where should we send ${petData.name}'s ${signData.element} sign reading?`;
    }
    return `Let us know where to send ${petData.name}'s personalized cosmic reading`;
  };

  return (
    <div className="space-y-6 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">
          Step {currentStep} of {totalSteps}
        </p>
        
        {/* Zodiac badge when available */}
        {signData && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-cosmic-gold/20 border border-primary/30 mb-2"
          >
            <span className="text-xl">{signData.icon}</span>
            <span className="text-primary text-sm font-medium">{signData.element} Sign • {signData.archetype}</span>
          </motion.div>
        )}

        {!signData && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-2"
          >
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">Save your progress</span>
          </motion.div>
        )}
        
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          {getHeadline()}
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          {getSubheadline()}
        </p>
      </div>

      <div className="space-y-4 pt-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={petData.email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={(e) => handleEmailChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && isValidEmail && handleContinue()}
          className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
          autoComplete="email"
        />

        <Button
          onClick={handleContinue}
          disabled={!isValidEmail || isTracking}
          variant="gold"
          size="xl"
          className="w-full max-w-xs"
        >
          {isTracking ? (
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              />
              Saving...
            </span>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Continue {petData.name ? `${petData.name}'s` : 'the'} Journey
            </>
          )}
        </Button>
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground pt-4">
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-green-500" />
          We never spam
        </span>
        <span className="flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-primary" />
          Progress saved
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-cosmic-gold" />
          Unsubscribe anytime
        </span>
      </div>

      {/* Teaser of what's next */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground/70 pt-2"
      >
        Just a few more fun questions about {petData.name}'s personality ✨
      </motion.div>
    </div>
  );
}
