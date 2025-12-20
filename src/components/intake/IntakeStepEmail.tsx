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
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);
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

            {/* FREE Mini Reading - Tabbed for multi-pet */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-gradient-to-br from-cosmic-gold/10 to-amber-500/5 border border-cosmic-gold/30 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-2 p-4 pb-0">
                <Sparkles className="w-5 h-5 text-cosmic-gold" />
                <h3 className="font-display font-semibold text-foreground">
                  Your Free Mini-Reading
                </h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cosmic-gold/20 text-cosmic-gold font-medium">FREE</span>
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
              
              {/* Single Pet Reading Display */}
              <div className="p-4 text-sm text-left">
                {(() => {
                  const pet = allPets[selectedPetIndex] || allPets[0];
                  const { sign: petSign, signData: petSignData } = getPetSignData(pet);
                  if (!petSignData) return null;
                  
                  return (
                    <div className="space-y-4">
                      {/* Personalized Hook - Emotional */}
                      <div className="p-4 rounded-xl bg-card/40 border border-primary/20">
                        <p className="text-foreground text-base leading-relaxed">
                          <span className="font-semibold text-cosmic-gold">{pet.name}</span> isn't just any {pet.species}.
                          As a <span className="font-medium">{petSign}</span> with <span className="font-medium">{petSignData.element}</span> energy, 
                          {petSignData.element === 'Fire' && " they carry a flame in their soul that lights up your darkest days. But that same fire means they feel rejection more deeply than you'd ever guess..."}
                          {petSignData.element === 'Earth' && " their loyalty runs deeper than the roots of an ancient tree. When they curl up beside you, they're offering you their entire world..."}
                          {petSignData.element === 'Air' && " their mind is always dancing with curiosity. That look in their eyes? It's them trying to understand the mysteries of your heart..."}
                          {petSignData.element === 'Water' && " they feel your emotions before you do. When you're sad, they know. When you're happy, they celebrate with you in ways you might not even notice..."}
                        </p>
                      </div>

                      {/* One Powerful Insight with Humor */}
                      <div className="space-y-2">
                        <p className="text-xs text-primary font-medium uppercase tracking-wider">🔮 One Truth About {pet.name}</p>
                        <p className="text-foreground/90 italic">
                          {petSign === 'Aries' && `${pet.name} thinks they're in charge. (They're not wrong.) Their biggest fear? Being ignored. Try that "look away" trick when they misbehave—it's cosmic torture for them.`}
                          {petSign === 'Taurus' && `${pet.name} has probably claimed "their spot" on the couch. Move it at your peril. Their secret? They'd do anything for a good belly rub and routine.`}
                          {petSign === 'Gemini' && `${pet.name} gets bored faster than you can say "fetch." Two personalities in one adorable package. Keep it interesting or they'll find their own entertainment (RIP your shoes).`}
                          {petSign === 'Cancer' && `${pet.name} remembers EVERYTHING. That time you left them at the vet? Filed away forever. They love you so much it almost hurts them.`}
                          {petSign === 'Leo' && `${pet.name} knows they're the main character. The drama? Intentional. They secretly check if you're watching before doing anything cute.`}
                          {petSign === 'Virgo' && `${pet.name} judges you. Lovingly. That stare when you don't follow their routine? Pure disappointment. They're the most helpful soul you'll ever meet.`}
                          {petSign === 'Libra' && `${pet.name} hates conflict so much they'll literally leave the room. Their mission? Keeping everyone happy. They're basically a furry diplomat.`}
                          {petSign === 'Scorpio' && `${pet.name} has depths you'll never fully understand. Those intense eyes? They're reading your soul. Betray their trust and they'll remember forever.`}
                          {petSign === 'Sagittarius' && `${pet.name}'s attention span is... squirrel! They're eternal optimists who treat every walk like a grand adventure. Freedom is their love language.`}
                          {petSign === 'Capricorn' && `${pet.name} is basically a tiny CEO. They have goals. They have standards. They judge other pets. They're secretly proud of you.`}
                          {petSign === 'Aquarius' && `${pet.name} does things their own way. Always. They're the pet that makes you question "is this normal?" (It is, for them.)`}
                          {petSign === 'Pisces' && `${pet.name} dreams in cosmic frequencies. Sometimes they stare at nothing—they're seeing things you can't. They absorb your stress, so protect this gentle soul.`}
                        </p>
                      </div>

                      {/* Emotional FOMO - What's Missing */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-nebula-purple/10 border border-nebula-purple/20">
                        <Lock className="w-5 h-5 text-nebula-purple flex-shrink-0" />
                        <p className="text-sm text-foreground/80">
                          <span className="font-medium">But wait—there's so much more.</span> What's {pet.name}'s secret fear? Why do they do <em>that</em> thing? How do they actually want to be loved? The full reading reveals everything... 
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>

            {/* Single Testimonial - Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border/30"
            >
              <div className="flex gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic flex-1">
                "Explained SO much about my {allPets[selectedPetIndex]?.species || 'pet'}'s quirks!" — Sarah M.
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
