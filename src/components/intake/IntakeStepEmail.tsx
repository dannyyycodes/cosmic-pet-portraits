import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { ArrowLeft, Sparkles, CheckCircle, ChevronDown, Lock, Star, Heart, Zap, Eye, Share2, Download, Moon, Sun, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialProofBar } from './SocialProofBar';
import { ReportTeaser } from './ReportTeaser';
import { CheckoutPanel, CheckoutData } from './CheckoutPanel';
import { getSunSign, zodiacSigns } from '@/lib/zodiac';
import { supabase } from '@/integrations/supabase/client';
import { getReferralCode } from '@/lib/referralTracking';

interface IntakeStepEmailProps {
  petData: PetData;
  petsData?: PetData[];
  petCount?: number;
  onUpdate: (data: Partial<PetData>) => void;
  onReveal: (checkoutData?: CheckoutData) => void;
  onBack: () => void;
  totalSteps: number;
  modeContent: ModeContent;
  giftCode?: string | null;
  giftedTier?: 'essential' | 'portrait' | 'vip' | 'basic' | 'premium' | null;
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

export function IntakeStepEmail({ petData, petsData, petCount = 1, onUpdate, onReveal, onBack, totalSteps, modeContent, giftCode, giftedTier }: IntakeStepEmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  // If gift code is present, skip checkout stage entirely
  const [stage, setStage] = useState<'email' | 'reveal' | 'checkout'>(giftCode ? 'email' : 'email');
  const astrologyFacts = getSpeciesAstrologyFacts(petData.species);
  const [factIndex, setFactIndex] = useState(Math.floor(Math.random() * astrologyFacts.length));
  const hasTrackedEmail = useRef(false);
  
  // Stricter email validation - must end with valid TLD characters only
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(petData.email.trim());
  
  // Sanitize email input - remove trailing commas, spaces, etc.
  const handleEmailChange = (value: string) => {
    const sanitized = value.trim().replace(/[,\s]+$/, '');
    onUpdate({ email: sanitized });
  };

  // Track subscriber when moving to reveal stage
  const handleProceedToReveal = async () => {
    // Only track once per session
    if (!hasTrackedEmail.current && isValidEmail) {
      hasTrackedEmail.current = true;
      
      // Track subscriber asynchronously - don't block UI
      supabase.functions.invoke('track-subscriber', {
        body: { 
          email: petData.email.trim(),
          event: 'intake_started',
          petName: petData.name,
          referralCode: getReferralCode(),
        },
      }).catch(console.error); // Silent fail - don't interrupt flow
    }
    
    setStage('reveal');
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
    "Why they act differently on full moons",
    "Their ideal bonding activities based on their chart",
    "Hidden health patterns to watch for",
    "Their deepest fears and how to comfort them",
    "The reason behind that ONE weird habit",
    "How to speak their cosmic love language",
  ];

  return (
    <div className="space-y-6 text-center">
      <button
        onClick={() => {
          if (stage === 'checkout') setStage('reveal');
          else if (stage === 'reveal') setStage('email');
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
            <SocialProofBar petName={petData.name} />

            <div className="space-y-3">
              <p className="text-primary/80 text-sm uppercase tracking-widest">Step {totalSteps} of {totalSteps}</p>
              
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

              <Button
                onClick={handleProceedToReveal}
                disabled={!isValidEmail}
                variant="gold"
                size="xl"
                className="w-full max-w-xs mx-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {modeContent.emailButton}
              </Button>
            </div>
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Celebration confetti animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="text-center mb-4"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>

            {/* Zodiac reveal cards - Show ALL pets */}
            <div className="space-y-4">
              {allPets.map((pet, index) => {
                const { sign: petSign, signData: petSignData } = getPetSignData(pet);
                if (!petSign || !petSignData) return null;
                
                return (
                  <motion.div
                    key={`pet-reveal-${index}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8, delay: index * 0.2 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 p-6"
                  >
                    <div className="absolute inset-0 opacity-30">
                      <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${elementColors[petSignData?.element || 'Fire']} blur-3xl`} />
                      <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br ${elementColors[petSignData?.element || 'Fire']} blur-2xl`} />
                    </div>

                    <div className="relative z-10 text-center space-y-3">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${elementColors[petSignData?.element || 'Fire']} flex items-center justify-center shadow-2xl shadow-primary/30`}
                      >
                        <span className="text-4xl">{petSignData?.icon || '✨'}</span>
                      </motion.div>

                      <div>
                        <p className="text-xs text-primary uppercase tracking-widest mb-1">✨ Cosmic Identity Revealed ✨</p>
                        <h2 className="text-3xl font-display font-bold text-foreground capitalize">
                          {pet.name} Is A {petSign}
                        </h2>
                        <div className="flex justify-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="capitalize px-2 py-1 rounded-full bg-primary/10">{petSignData?.element} Element</span>
                          <span className="px-2 py-1 rounded-full bg-primary/10">{petSignData?.archetype}</span>
                        </div>
                      </div>

                      {/* Shareable Soul Snapshot Card */}
                      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/60 border border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-primary font-medium uppercase tracking-wider">Soul Snapshot</span>
                          <div className="flex gap-2">
                            <button className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" title="Share">
                              <Share2 className="w-3.5 h-3.5 text-primary" />
                            </button>
                            <button className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" title="Download">
                              <Download className="w-3.5 h-3.5 text-primary" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-card/50">
                            <Sun className="w-4 h-4 mx-auto mb-1 text-cosmic-gold" />
                            <p className="text-[10px] text-muted-foreground">Sun</p>
                            <p className="text-xs font-medium text-foreground capitalize">{petSign}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-card/50">
                            <div className="w-4 h-4 mx-auto mb-1 text-lg">{petSignData?.element === 'Fire' ? '🔥' : petSignData?.element === 'Earth' ? '🌍' : petSignData?.element === 'Air' ? '💨' : '💧'}</div>
                            <p className="text-[10px] text-muted-foreground">Element</p>
                            <p className="text-xs font-medium text-foreground">{petSignData?.element}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-card/50">
                            <Moon className="w-4 h-4 mx-auto mb-1 text-nebula-purple" />
                            <p className="text-[10px] text-muted-foreground">Type</p>
                            <p className="text-xs font-medium text-foreground">{petSignData?.archetype?.split(' ')[1] || 'Soul'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* FREE Mini Reading - Shows ALL pets */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-xl bg-gradient-to-br from-cosmic-gold/10 to-amber-500/5 border border-cosmic-gold/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-cosmic-gold" />
                <h3 className="font-display font-semibold text-foreground">
                  {allPets.length > 1 ? 'Your Free Cosmic Mini-Readings' : 'Your Free Cosmic Mini-Reading'}
                </h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cosmic-gold/20 text-cosmic-gold font-medium">FREE</span>
              </div>
              
              <div className="space-y-4 text-sm text-left">
                {allPets.map((pet, index) => {
                  const { sign: petSign, signData: petSignData } = getPetSignData(pet);
                  if (!petSignData) return null;
                  
                  return (
                    <div key={`mini-reading-${index}`} className="space-y-3">
                      {allPets.length > 1 && (
                        <div className="flex items-center gap-2 pt-2 first:pt-0">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${elementColors[petSignData.element]} flex items-center justify-center`}>
                            <span className="text-sm">{petSignData.icon}</span>
                          </div>
                          <span className="font-medium text-foreground">{pet.name}</span>
                        </div>
                      )}
                      
                      {/* Element Deep Dive */}
                      <div className="p-3 rounded-lg bg-card/30 space-y-2">
                        <p className="font-medium text-foreground flex items-center gap-2">
                          <span className="text-lg">{petSignData.element === 'Fire' ? '🔥' : petSignData.element === 'Earth' ? '🌍' : petSignData.element === 'Air' ? '💨' : '💧'}</span>
                          {petSignData.element} Element Profile
                        </p>
                        <p className="text-foreground/90">
                          <span className="font-medium text-cosmic-gold">{pet.name}</span>'s greatest strength is their <span className="font-medium">{elementTraits[petSignData.element]?.strength}</span>. 
                          Their challenge? <span className="text-muted-foreground">{elementTraits[petSignData.element]?.challenge}</span>.
                        </p>
                        <p className="text-muted-foreground text-xs">
                          What they need most: <span className="text-foreground">{elementTraits[petSignData.element]?.need}</span>
                        </p>
                      </div>

                      {/* Personalized Insight */}
                      <p className="text-foreground/90">
                        As a <span className="font-medium">{petSign}</span>, {pet.name} experiences the world through a lens of 
                        {petSignData.element === 'Fire' && " passionate energy. They're natural leaders who light up every room—but beneath that confidence lies a sensitive soul who fears being overlooked."}
                        {petSignData.element === 'Earth' && " grounded stability. They crave routine and security—but their deep loyalty means they feel abandonment more intensely than other pets."}
                        {petSignData.element === 'Air' && " curious exploration. They need constant mental stimulation—but their social nature masks a fear of being truly alone."}
                        {petSignData.element === 'Water' && " emotional depth. They sense your moods before you do—but this sensitivity makes them absorb stress around them."}
                      </p>

                      {/* Soul Type Integration */}
                      {pet.soulType && (
                        <p className="text-muted-foreground italic">
                          Combined with their {pet.soulType} soul nature, this creates a unique cosmic signature that influences everything from their sleep patterns to how they bond with you...
                        </p>
                      )}
                      
                      {allPets.length > 1 && index < allPets.length - 1 && (
                        <div className="border-b border-border/30 mt-4" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Astrology Fact - Builds Belief */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-4 rounded-xl bg-nebula-purple/10 border border-nebula-purple/30"
            >
              <div className="flex items-start gap-3 text-left">
                <span className="text-2xl">{astrologyFacts[factIndex].icon}</span>
                <div>
                  <p className="text-xs text-nebula-purple uppercase tracking-wider mb-1">Did You Know?</p>
                  <p className="text-sm text-foreground/90">{astrologyFacts[factIndex].fact}</p>
                </div>
              </div>
            </motion.div>

            {/* Blurred Report Teaser - FOMO */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="relative overflow-hidden rounded-xl border border-border/50 p-4"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10" />
              <div className="blur-sm opacity-60 text-left space-y-2">
                <p className="text-xs text-primary font-medium">Chapter 5: Hidden Fears & Comfort Needs</p>
                <p className="text-sm text-foreground">
                  {petData.name}'s deepest fear stems from their {signData?.element || 'cosmic'} nature. When they feel ████████, 
                  they will often ████████ as a coping mechanism. The best way to comfort them is to ████████...
                </p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 border border-primary/30">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Unlock Full Report</span>
                </div>
              </div>
            </motion.div>

            {/* What You'd Miss - FOMO List */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-4 rounded-xl bg-red-500/5 border border-red-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-semibold text-foreground">Without the full report, you'll never know...</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-left">
                {whatYoudMiss.map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                    <span className="text-red-400/60">✗</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* What's included - teaser cards */}
            <div className="space-y-3 pt-2">
              <h3 className="text-lg font-display font-semibold text-foreground text-center">
                Your full 18-chapter reading reveals...
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                {revealInsights.map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="p-3 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 text-left hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                        <insight.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{insight.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{insight.teaser}</p>
                    <div className="flex items-center gap-1 text-[10px] text-primary/60 mt-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Full details in report</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social proof with real impact */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center space-y-2 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20"
            >
              <div className="flex items-center justify-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground font-medium">
                12,847 pet parents discovered their pet's cosmic truth
              </p>
              <p className="text-xs text-muted-foreground italic px-4">
                "This explained SO much about my dog's personality. It's like someone who really knows her wrote it!" — Sarah M.
              </p>
            </motion.div>

            {/* CTA to checkout - or direct reveal for gift recipients */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="space-y-3 pt-2"
            >
              {giftCode ? (
                // Gift recipients skip checkout entirely
                <Button
                  onClick={() => onReveal()}
                  variant="gold"
                  size="xl"
                  className="w-full max-w-sm mx-auto shadow-lg shadow-primary/20"
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
                    className="w-full max-w-sm mx-auto shadow-lg shadow-primary/20"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Unlock {petData.name}'s Full Cosmic Truth
                  </Button>
                  
                  <button
                    onClick={() => setStage('checkout')}
                    className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  >
                    <span>See pricing options</span>
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
            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-foreground">
                Choose Your Reading
              </h2>
              <p className="text-sm text-muted-foreground">
                {petCount > 1 
                  ? `Unlock cosmic profiles for all ${petCount} of your pets`
                  : `Unlock ${petData.name}'s complete cosmic profile`}
              </p>
            </div>

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
