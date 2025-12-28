import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { ArrowLeft, Sparkles, CheckCircle, ChevronDown, Lock, Star, Heart, Zap, Eye, AlertTriangle, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { PremiumPreview } from './PremiumPreview';
import { TestimonialCarousel } from './TestimonialCarousel';
import { CheckoutPanel, CheckoutData } from './CheckoutPanel';
import { GiftReportShowcase } from '@/components/GiftReportShowcase';
import { getSunSign, zodiacSigns } from '@/lib/zodiac';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { getReferralCode } from '@/lib/referralTracking';
import { getPronoun, getPossessive } from '@/lib/pronouns';
import type { PetGender } from '@/lib/pronouns';

const stableHash = (input: string) => {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

const pickBySeed = <T,>(items: T[], seed: number) => items[seed % items.length];

interface IntakeStepEmailProps {
  petData: PetData;
  petsData?: PetData[];
  petCount?: number;
  onUpdate: (data: Partial<PetData>) => void;
  onReveal: (checkoutData?: CheckoutData) => void;
  onBack: () => void;
  onAddAnotherPet?: () => void;
  totalSteps: number;
  modeContent: ModeContent;
  giftCode?: string | null;
  giftedTier?: 'essential' | 'portrait' | 'vip' | 'basic' | 'premium' | null;
  skipEmailInput?: boolean;
}

// Species-specific astrology facts that build belief
const speciesAstrologyFacts: Record<string, Array<{ fact: string; icon: string }>> = {
  dog: [
    { fact: "Dogs can sense changes in barometric pressure before storms—ancient astrologers believed they were cosmic weather prophets.", icon: "🐕" },
    { fact: "Studies show dogs born under Fire signs (Aries, Leo, Sagittarius) are 23% more likely to be high-energy and playful.", icon: "🔥" },
    { fact: "Your dog's howling at the moon is an ancient pack communication ritual—they're tuned into lunar cycles.", icon: "🌙" },
    { fact: "Veterinary behaviorists have noted distinct personality clusters in dogs that align with astrological elements.", icon: "⭐" },
    { fact: "Your dog chose you before birth—their soul recognized yours across the cosmic web of connection.", icon: "💫" },
  ],
  cat: [
    { fact: "Ancient Egyptians believed cats were sacred because they could sense cosmic energy that humans couldn't perceive.", icon: "🐱" },
    { fact: "Studies show cats born under Water signs (Cancer, Scorpio, Pisces) tend to be more intuitive and mysterious.", icon: "🌊" },
    { fact: "The position of the Moon at birth affects emotional patterns—cats are especially attuned to lunar cycles.", icon: "🌙" },
    { fact: "Cats purr at a frequency (25-150 Hz) that promotes healing—ancient healers called them cosmic medicine.", icon: "⭐" },
    { fact: "Your cat chose you before birth—their soul recognized yours across the cosmic web of connection.", icon: "💫" },
  ],
  bird: [
    { fact: "Birds can see ultraviolet light, perceiving hidden cosmic energies invisible to humans.", icon: "🐦" },
    { fact: "Studies show birds born under Air signs (Gemini, Libra, Aquarius) are more vocal and social.", icon: "💨" },
    { fact: "Birds navigate using Earth's magnetic field—they're literally tuned into the planet's energy grid.", icon: "🌙" },
    { fact: "Birds sing at dawn to greet the sun's energy—a daily ritual of cosmic acknowledgment.", icon: "⭐" },
    { fact: "Your bird chose you before birth—their soul recognized yours across the cosmic web of connection.", icon: "💫" },
  ],
  rabbit: [
    { fact: "In many cultures, rabbits symbolize the moon and are considered messengers between realms.", icon: "🐰" },
    { fact: "Studies show rabbits born under Earth signs (Taurus, Virgo, Capricorn) are calmer and more grounded.", icon: "🌍" },
    { fact: "Rabbits are most active at dawn and dusk—the mystical twilight hours when worlds overlap.", icon: "🌙" },
    { fact: "A rabbit's nose twitches 20-120 times per minute, constantly sampling the energetic environment.", icon: "⭐" },
    { fact: "Your rabbit chose you before birth—their soul recognized yours across the cosmic web of connection.", icon: "💫" },
  ],
  horse: [
    { fact: "A horse's eyes are the largest of any land mammal, designed to perceive both physical and spiritual worlds.", icon: "🐴" },
    { fact: "Studies show horses born under Fire signs (Aries, Leo, Sagittarius) are more spirited and bold.", icon: "🔥" },
    { fact: "In mythology, horses carry souls between worlds—your horse may be your spirit guide.", icon: "🌙" },
    { fact: "Horses can sense human emotions through heart rate and pheromones, making them powerful empaths.", icon: "⭐" },
    { fact: "Your horse chose you before birth—their soul recognized yours across the cosmic web of connection.", icon: "💫" },
  ],
  default: [
    { fact: "Your pet's eyes contain light receptors that may perceive wavelengths humans cannot see.", icon: "✨" },
    { fact: "Studies show pets born under Fire signs (Aries, Leo, Sagittarius) are 23% more likely to be high-energy.", icon: "🔥" },
    { fact: "The position of the Moon at birth affects emotional patterns—this applies to all mammals, not just humans.", icon: "🌙" },
    { fact: "Veterinary behaviorists have noted distinct personality clusters that align with astrological elements.", icon: "⭐" },
    { fact: "Your pet chose you before birth—their soul recognized yours across the cosmic web of connection.", icon: "💫" },
  ],
};

// Get species-specific facts
const getSpeciesAstrologyFacts = (species: string) => {
  const normalized = species?.toLowerCase() || 'default';
  return speciesAstrologyFacts[normalized] || speciesAstrologyFacts.default;
};

export function IntakeStepEmail({ petData, petsData, petCount = 1, onUpdate, onReveal, onBack, onAddAnotherPet, totalSteps, modeContent, giftCode, giftedTier, skipEmailInput = false }: IntakeStepEmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Skip reveal stage entirely - go straight from email to checkout
  const [stage, setStage] = useState<'email' | 'reveal' | 'checkout'>(
    giftCode ? 'checkout' : (skipEmailInput ? 'checkout' : 'email')
  );
  const astrologyFacts = getSpeciesAstrologyFacts(petData.species);
  const [factIndex, setFactIndex] = useState(Math.floor(Math.random() * astrologyFacts.length));
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
  const hasTrackedEmail = useRef(false);
  
  // Stricter email validation - must end with valid TLD characters only
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(petData.email.trim());
  
  // Sanitize email input - remove trailing commas, spaces, etc.
  const handleEmailChange = (value: string) => {
    const sanitized = value.trim().replace(/[,\s]+$/, '');
    onUpdate({ email: sanitized });
  };

  // Track subscriber when moving to checkout stage
  const handleProceedToCheckout = async () => {
    // Only track once per session
    if (!hasTrackedEmail.current && isValidEmail) {
      hasTrackedEmail.current = true;
      
      // Track subscriber asynchronously - don't block UI
      supabase.functions.invoke('track-subscriber', {
        body: { 
          email: petData.email.trim(),
          event: 'intake_started',
          petName: petData.name,
          referralCode: getReferralCode() || undefined,
        },
      }).catch(console.error); // Silent fail - don't interrupt flow
    }
    
    // Go straight to checkout, skip reveal
    setStage('checkout');
  };

  // Get sign data for a specific pet
  const getPetSignData = (pet: PetData) => {
    const petSign = pet.dateOfBirth 
      ? getSunSign(pet.dateOfBirth.getMonth() + 1, pet.dateOfBirth.getDate()) 
      : null;
    return { sign: petSign, signData: petSign ? zodiacSigns[petSign] : null };
  };
  
  // Use first pet for primary display, but show all pets
  const primaryPet = petsData && petsData.length > 0 ? petsData[0] : petData;
  const allPets = petsData && petsData.length > 1 ? petsData : [petData];
  
  const sign = primaryPet.dateOfBirth 
    ? getSunSign(primaryPet.dateOfBirth.getMonth() + 1, primaryPet.dateOfBirth.getDate()) 
    : null;
  const signData = sign ? zodiacSigns[sign] : null;

  const handleCheckout = (checkoutData: CheckoutData) => {
    onReveal(checkoutData);
  };

  const elementColors: Record<string, string> = {
    Fire: 'from-orange-500 to-red-500',
    Earth: 'from-emerald-500 to-green-600',
    Air: 'from-sky-400 to-blue-500',
    Water: 'from-blue-500 to-indigo-600',
  };

  const elementTraits: Record<string, { strength: string; challenge: string; need: string }> = {
    Fire: { strength: 'passionate enthusiasm', challenge: 'impulsiveness', need: 'adventure and stimulation' },
    Earth: { strength: 'unwavering loyalty', challenge: 'stubbornness', need: 'routine and security' },
    Air: { strength: 'social intelligence', challenge: 'restlessness', need: 'mental engagement' },
    Water: { strength: 'deep intuition', challenge: 'mood swings', need: 'emotional connection' },
  };

  const revealInsights = [
    { icon: Star, title: 'Soul Blueprint', description: `${petData.name}'s cosmic DNA and spiritual origins`, teaser: signData ? `As a ${signData.element} sign, ${petData.name} carries ${signData.element === 'Fire' ? 'passionate energy' : signData.element === 'Earth' ? 'grounded wisdom' : signData.element === 'Air' ? 'curious intellect' : 'deep intuition'}...` : '' },
    { icon: Heart, title: 'Love Language', description: 'How they express and receive affection', teaser: petData.soulType === 'ancient' ? 'Their ancient soul shows love through quiet presence...' : petData.soulType === 'playful' ? 'Their playful spirit shows love through joyful energy...' : 'Their unique soul expresses love in special ways...' },
    { icon: Zap, title: 'Hidden Superpower', description: 'Their secret cosmic gift waiting to be unlocked', teaser: petData.superpower ? `Their ${petData.superpower} ability runs deeper than you know...` : 'A powerful gift awaits discovery...' },
    { icon: Eye, title: 'Life Purpose', description: 'Why they chose you as their human', teaser: 'The universe brought you together for a reason...' },
  ];

  // What you'd miss without the full report - FOMO content
  const whatYoudMiss = [
    "Why their mood shifts unexpectedly",
    "What you're here to teach each other",
    "The role they play in your life's journey",
    "What they truly need but can't express",
    "Their unique wellness patterns to support",
    "The deeper purpose of your bond",
  ];

  // Simple feature preview component for checkout
  const FeaturePreview = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-card/50 border border-border/30">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div className="text-left">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-center">
      <button
        onClick={() => {
          if (stage === 'checkout') setStage('email');
          else onBack();
        }}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <AnimatePresence mode="wait">
        {stage === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >

            <div className="space-y-3">
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-2"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-sm font-medium">{modeContent.emailBadge}</span>
              </motion.div>
              
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {modeContent.emailTitle(petData.name)}
              </h1>
              <p className="text-muted-foreground text-base">
                {modeContent.emailSubtitle}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={petData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={(e) => handleEmailChange(e.target.value)}
                className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
              />

              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={handleProceedToCheckout}
                  disabled={!isValidEmail}
                  variant="gold"
                  size="xl"
                  className="w-full max-w-xs"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {modeContent.emailButton}
                </Button>
                
                {/* Add Another Pet Option - on its own line below */}
                {onAddAnotherPet && (
                  <button
                    onClick={onAddAnotherPet}
                    className="text-primary/70 hover:text-primary underline text-sm transition-colors"
                  >
                    + Add another pet to this order
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 md:space-y-6"
          >
            {/* Subtle celebration particles - reduced on mobile */}
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 1 }}
                  animate={{ y: '100vh', opacity: 0 }}
                  transition={{ duration: 3 + Math.random() * 2, delay: Math.random() * 0.5, ease: "easeOut" }}
                  className="absolute text-sm md:text-lg"
                  style={{ left: `${Math.random() * 100}%` }}
                >
                  {['✨', '⭐', '🌟'][Math.floor(Math.random() * 3)]}
                </motion.div>
              ))}
            </div>

            {/* Clean Header - Compact on mobile */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-1.5 md:space-y-2"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-cosmic-gold/20 border border-cosmic-gold/30">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-cosmic-gold" />
                <span className="text-xs md:text-sm font-medium text-cosmic-gold">Cosmic Analysis Complete</span>
              </div>
              <h1 className="text-xl md:text-4xl font-display font-bold text-foreground px-2">
                {allPets.length > 1 
                  ? `Meet Your ${allPets.length} Cosmic Companions`
                  : `${primaryPet.name}'s Cosmic Blueprint`
                }
              </h1>
              <p className="text-xs md:text-base text-muted-foreground max-w-md mx-auto px-4">
                {allPets.length > 1 
                  ? "We've decoded the stars for your furry family"
                  : "The universe has revealed something extraordinary"
                }
              </p>
            </motion.div>

            {/* Zodiac reveal cards - Compact on mobile */}
            <div className="space-y-3 md:space-y-4">
              {allPets.map((pet, index) => {
                const { sign: petSign, signData: petSignData } = getPetSignData(pet);
                if (!petSign || !petSignData) return null;
                
                return (
                  <motion.div
                    key={`pet-reveal-${index}`}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8, delay: index * 0.2 }}
                    className="relative overflow-hidden rounded-xl border-2 border-primary/50 bg-gradient-to-br from-card via-card to-primary/20 p-3 md:p-6 shadow-lg shadow-primary/10"
                  >
                    {/* Animated background effects - smaller on mobile */}
                    <div className="absolute inset-0">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        className={`absolute -top-16 -right-16 w-40 md:w-60 h-40 md:h-60 rounded-full bg-gradient-to-br ${elementColors[petSignData?.element || 'Fire']} blur-3xl opacity-40`} 
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                        className={`absolute -bottom-16 -left-16 w-32 md:w-48 h-32 md:h-48 rounded-full bg-gradient-to-br ${elementColors[petSignData?.element || 'Fire']} blur-2xl opacity-30`} 
                      />
                    </div>

                    <div className="relative z-10 text-center space-y-2 md:space-y-4">
                      {/* Zodiac icon - compact on mobile */}
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className={`w-14 h-14 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-br ${elementColors[petSignData?.element || 'Fire']} flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-2xl md:text-5xl">{petSignData?.icon || '✨'}</span>
                      </motion.div>

                      <div className="space-y-1 md:space-y-2">
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.2 }}
                          className="text-[10px] md:text-sm text-primary uppercase tracking-widest font-semibold"
                        >
                          ✨ Cosmic Identity ✨
                        </motion.p>
                        <motion.h2 
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 + index * 0.2 }}
                          className="text-lg md:text-4xl font-display font-bold text-foreground capitalize"
                        >
                          {pet.name} Is A {petSign}!
                        </motion.h2>
                        
                        {/* Element and archetype badges */}
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.2 }}
                          className="flex flex-wrap justify-center gap-1.5 md:gap-2 mt-1 md:mt-3"
                        >
                          <span className={`capitalize px-2 py-1 md:px-4 md:py-2 rounded-full bg-gradient-to-r ${elementColors[petSignData?.element || 'Fire']} text-white font-semibold text-[10px] md:text-sm shadow`}>
                            {petSignData?.element === 'Fire' ? '🔥' : petSignData?.element === 'Earth' ? '🌍' : petSignData?.element === 'Air' ? '💨' : '💧'} {petSignData?.element}
                          </span>
                          <span className="px-2 py-1 md:px-4 md:py-2 rounded-full bg-primary/20 text-primary font-semibold text-[10px] md:text-sm border border-primary/30">
                            {petSignData?.archetype}
                          </span>
                        </motion.div>
                      </div>

                      {/* Soul Snapshot Card - Compact on mobile */}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 + index * 0.2 }}
                        className="mt-3 md:mt-6 p-2.5 md:p-4 rounded-lg bg-gradient-to-br from-background/90 to-background/70 border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-1.5 md:mb-3">
                          <span className="text-[9px] md:text-xs text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" /> Soul Snapshot
                          </span>
                          <span className="text-[9px] md:text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 font-medium">FREE</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2 text-center">
                          <div className="p-1.5 md:p-3 rounded-lg bg-card/50 border border-border/30">
                            <Sun className="w-3.5 h-3.5 md:w-5 md:h-5 mx-auto mb-0.5 text-cosmic-gold" />
                            <p className="text-[7px] md:text-[10px] text-muted-foreground uppercase">Sun</p>
                            <p className="text-[10px] md:text-sm font-semibold text-foreground capitalize">{petSign}</p>
                          </div>
                          <div className="p-1.5 md:p-3 rounded-lg bg-card/50 border border-border/30">
                            <span className="text-sm md:text-xl block mb-0.5">{petSignData?.element === 'Fire' ? '🔥' : petSignData?.element === 'Earth' ? '🌍' : petSignData?.element === 'Air' ? '💨' : '💧'}</span>
                            <p className="text-[7px] md:text-[10px] text-muted-foreground uppercase">Element</p>
                            <p className="text-[10px] md:text-sm font-semibold text-foreground">{petSignData?.element}</p>
                          </div>
                          <div className="p-1.5 md:p-3 rounded-lg bg-card/50 border border-border/30">
                            <Moon className="w-3.5 h-3.5 md:w-5 md:h-5 mx-auto mb-0.5 text-nebula-purple" />
                            <p className="text-[7px] md:text-[10px] text-muted-foreground uppercase">Soul</p>
                            <p className="text-[10px] md:text-sm font-semibold text-foreground">{petSignData?.archetype?.split(' ')[1] || 'Soul'}</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* FREE Mini Reading - Compact mobile layout */}
            {!giftCode && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl bg-gradient-to-br from-cosmic-gold/15 to-amber-500/10 border border-cosmic-gold/40 overflow-hidden"
            >
              {/* Header - Compact */}
              <div className="flex items-center gap-2 p-3 md:p-4 pb-0">
                <div className="p-1.5 md:p-2 rounded-full bg-cosmic-gold/20">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-cosmic-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base md:text-lg text-foreground truncate">
                    Your Free Cosmic Preview
                  </h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground">A glimpse into the cosmic truth...</p>
                </div>
                <span className="text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-green-500/20 text-green-500 font-bold border border-green-500/30 shrink-0">🎁 FREE</span>
              </div>
              
              {/* Pet Tabs for multiple pets */}
              {allPets.length > 1 && (
                <div className="flex gap-1 px-4 pt-3">
                  {allPets.map((pet, index) => {
                    const { signData: petSignData } = getPetSignData(pet);
                    return (
                      <button
                        key={`pet-tab-${index}`}
                        onClick={() => setSelectedPetIndex(index)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedPetIndex === index
                            ? 'bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/30'
                            : 'bg-card/30 text-muted-foreground hover:bg-card/50'
                        }`}
                      >
                        <span className="text-sm">{petSignData?.icon || '⭐'}</span>
                        <span>{pet.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Enhanced Reading Display */}
              <div className="p-4 text-sm text-left space-y-4">
                {(() => {
                  const pet = allPets[selectedPetIndex] || allPets[0];
                  const { sign: petSign, signData: petSignData } = getPetSignData(pet);
                  if (!petSignData) return null;
                  
                  const occasionMode = pet.occasionMode || 'discover';
                  const isMemorial = occasionMode === 'memorial';
                  const isBirthday = occasionMode === 'birthday';
                  const species = pet.species?.toLowerCase() || 'pet';
                  const element = petSignData.element;
                  const traits = elementTraits[element] || elementTraits.Fire;
                  
                  // Generate occasion-aware + species-specific hook (fun + unique + gender-correct)
                  const getPersonalizedHook = () => {
                    const gender = (pet.gender || '') as PetGender;
                    const subject = getPronoun(gender, 'subject');
                    const possessive = getPossessive(gender);
                    const seed = stableHash([pet.name, petSign, element, pet.breed, pet.soulType, pet.superpower, pet.strangerReaction].filter(Boolean).join('|'));

                    if (isMemorial) {
                      return `wasn't just any ${species}. As a ${petSign} with ${element} energy, ${pet.name} brought ${traits.strength} into your life — and you can still feel ${possessive} imprint in the quiet moments.`;
                    }
                    if (isBirthday) {
                      return `is celebrating another cosmic year. As a ${petSign} with ${element} energy, ${pet.name} brings ${traits.strength} to every day (and ${subject} knows it).`;
                    }

                    const templates = [
                      `isn't just any ${species}. As a ${petSign} with ${element} energy, ${pet.name} brings ${traits.strength} into your life — and ${subject} absolutely expects applause for it.`,
                      `is a ${petSign} ${species} with ${element} energy. Translation: ${subject} runs on ${traits.need}… and mild emotional manipulation.`,
                      `has strong ${element} vibes. ${subject} brings ${traits.strength}… then tests your boundaries like it's a sport.`,
                      `came pre-installed with ${traits.strength}. The catch? ${possessive} daily operating system requires ${traits.need}.`,
                    ];

                    return pickBySeed(templates, seed);
                  };

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        {pet.photoUrl ? (
                          <div className="h-12 w-12 rounded-full overflow-hidden border border-border/50 bg-card/40 shrink-0">
                            <img
                              src={pet.photoUrl}
                              alt={`Pet photo of ${pet.name}`}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full border border-border/50 bg-card/40 flex items-center justify-center shrink-0">
                            <span className="text-xl">{petSignData.icon || '⭐'}</span>
                          </div>
                        )}
                        <p className="text-foreground leading-relaxed text-base">
                          <span className="font-bold text-primary text-lg">{pet.name}</span> {getPersonalizedHook()}
                        </p>
                      </div>
                      
                      {/* Trait Cards - Mobile friendly */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 md:p-3 rounded-lg md:rounded-xl bg-card/40 border border-border/30">
                          <div className="text-base md:text-xl mb-0.5 md:mb-1">💪</div>
                          <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-semibold">Strength</p>
                          <p className="text-xs md:text-sm font-bold text-foreground capitalize">{traits.strength.split(' ')[0]}</p>
                        </div>
                        <div className="text-center p-2 md:p-3 rounded-lg md:rounded-xl bg-card/40 border border-border/30">
                          <div className="text-base md:text-xl mb-0.5 md:mb-1">⚡</div>
                          <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-semibold">Challenge</p>
                          <p className="text-xs md:text-sm font-bold text-foreground capitalize">{traits.challenge}</p>
                        </div>
                        <div className="text-center p-2 md:p-3 rounded-lg md:rounded-xl bg-card/40 border border-border/30">
                          <div className="text-base md:text-xl mb-0.5 md:mb-1">❤️</div>
                          <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-semibold">Need</p>
                          <p className="text-xs md:text-sm font-bold text-foreground capitalize">{traits.need.split(' ')[0]}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
            )}


            {/* What You'll Unlock - FOMO Builder */}
            {!giftCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="rounded-xl bg-gradient-to-br from-primary/10 to-nebula-purple/10 border border-primary/30 p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-foreground">What's In The Full Report?</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {revealInsights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 + i * 0.1 }}
                      className="flex items-start gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg bg-card/50 border border-border/30"
                    >
                      <insight.icon className="w-3 h-3 md:w-4 md:h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] md:text-xs font-semibold text-foreground">{insight.title}</p>
                        <p className="text-[8px] md:text-[10px] text-muted-foreground hidden md:block">{insight.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* What you'd miss teaser */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Without the full report, you'll miss:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {whatYoudMiss.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive/80 border border-destructive/20">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Premium Preview */}
            {!giftCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <PremiumPreview
                  petName={allPets[selectedPetIndex]?.name || petData.name}
                  sunSign={(() => {
                    const pet = allPets[selectedPetIndex] || petData;
                    return pet.dateOfBirth 
                      ? getSunSign(pet.dateOfBirth.getMonth() + 1, pet.dateOfBirth.getDate()) || 'Aries'
                      : 'Aries';
                  })()}
                  element={(() => {
                    const pet = allPets[selectedPetIndex] || petData;
                    const sign = pet.dateOfBirth 
                      ? getSunSign(pet.dateOfBirth.getMonth() + 1, pet.dateOfBirth.getDate())
                      : null;
                    return sign ? (zodiacSigns[sign]?.element || 'Fire') : 'Fire';
                  })()}
                  onUnlock={() => setStage('checkout')}
                />
              </motion.div>
            )}

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="space-y-4 pt-4"
            >
              {giftCode ? (
                // Gift recipients skip checkout entirely
                <Button
                  onClick={() => onReveal()}
                  variant="gold"
                  size="xl"
                  className="w-full max-w-sm mx-auto shadow-xl shadow-primary/30"
                  disabled={isLoading}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {isLoading ? 'Generating...' : `🎁 Reveal ${petData.name}'s Gifted Reading`}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setStage('checkout')}
                    variant="gold"
                    size="xl"
                    className="w-full max-w-sm mx-auto shadow-xl shadow-primary/30 text-lg py-6"
                  >
                    <Sparkles className="w-6 h-6 mr-2" />
                    Unlock {allPets.length > 1 ? 'Full Cosmic Truth' : `${petData.name}'s Full Reading`}
                  </Button>
                  
                  <button
                    onClick={() => setStage('checkout')}
                    className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mx-auto font-medium"
                  >
                    <span>See all packages & pricing</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {stage === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Rotating Testimonials at the top */}
            <div className="mb-4">
              <TestimonialCarousel />
            </div>

            {/* Compelling Header */}
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cosmic-gold/20 border border-cosmic-gold/30 mb-2">
                <Sparkles className="w-3 h-3 text-cosmic-gold" />
                <span className="text-xs font-medium text-cosmic-gold">Cosmic Analysis Ready</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                {petCount > 1 
                  ? `Your ${petCount} Pets' Full Readings`
                  : `${petData.name}'s Full Cosmic Reading`}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Unlock deep insights into their personality, needs & your cosmic bond
              </p>
            </div>

            {/* What's Inside - Compelling Feature Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-card/80 to-card/40 rounded-xl border border-border/50 p-4 space-y-3"
            >
              <p className="text-xs font-semibold text-center text-primary uppercase tracking-wider">What You'll Discover</p>
              <div className="grid grid-cols-2 gap-2">
                <FeaturePreview icon="🔮" title="Soul Blueprint" description="Why they act the way they do" />
                <FeaturePreview icon="❤️" title="Love Language" description="How they give & receive love" />
                <FeaturePreview icon="⚡" title="Hidden Superpower" description="Their secret cosmic gift" />
                <FeaturePreview icon="🌙" title="Emotional Needs" description="What they truly crave" />
                <FeaturePreview icon="💫" title="Life Purpose" description="Why they chose you" />
                <FeaturePreview icon="🐾" title="Behavior Decoded" description="What their quirks mean" />
              </div>
            </motion.div>

            {/* Report Preview Showcase */}
            <div className="max-w-xl mx-auto">
              <p className="text-xs text-center text-muted-foreground mb-2">Sample report cards:</p>
              <GiftReportShowcase />
            </div>

            {/* Checkout Panel */}
            <div className="max-w-md mx-auto">
              <CheckoutPanel
                petData={petData}
                petsData={petsData}
                petCount={petCount}
                onCheckout={handleCheckout}
                isLoading={isLoading}
                occasionMode={petData.occasionMode}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-muted-foreground/60">
        By continuing, you agree to receive your cosmic analysis and updates.
      </p>
    </div>
  );
}
