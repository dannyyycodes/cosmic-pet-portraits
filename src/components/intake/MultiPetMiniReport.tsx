import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PetData } from './IntakeWizard';
import { Lock, Moon, ArrowUp, Sparkles, Star, Heart, Lightbulb, Zap, Users, Activity, ChevronLeft, ChevronRight, Fingerprint, PawPrint, AlertTriangle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonalizedTestimonials } from './PersonalizedTestimonials';
import { PremiumPreview } from './PremiumPreview';
import { ProgressBar } from './ProgressBar';
import { generateCosmicReport, CosmicReport } from '@/lib/cosmicReport';
import { cn } from '@/lib/utils';
import { OccasionMode } from '@/lib/occasionMode';
import { getPossessive, getPronoun, PetGender } from '@/lib/pronouns';

interface MultiPetMiniReportProps {
  petsData: PetData[];
}

// Helper to check if occasion is memorial
function isMemorialMode(petData: PetData): boolean {
  return petData.occasionMode === 'memorial';
}

// Helper to check if occasion is birthday
function isBirthdayMode(petData: PetData): boolean {
  return petData.occasionMode === 'birthday';
}

const zodiacIcons: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const elementIcons: Record<string, string> = {
  Fire: '🔥', Earth: '🌍', Air: '💨', Water: '💧',
};

const vibrationMeanings: Record<number, string> = {
  1: "Leadership & Independence", 2: "Harmony & Partnership", 3: "Creativity & Expression",
  4: "Stability & Foundation", 5: "Freedom & Adventure", 6: "Nurturing & Protection",
  7: "Wisdom & Intuition", 8: "Power & Abundance", 9: "Compassion & Completion",
  11: "Spiritual Illumination", 22: "Master Builder", 33: "Master Teacher",
};

// Species-specific cosmic facts
const speciesFacts: Record<string, string[]> = {
  dog: [
    "Dogs can sense changes in barometric pressure before storms—making them cosmic weather predictors!",
    "Your dog's howling at the moon is actually an ancient pack communication ritual passed down for millennia.",
    "Studies show dogs dream about their owners—they literally see you in their cosmic sleep journeys.",
    "Dogs can detect your emotional state through changes in your scent, making them empathic energy readers.",
    "A dog's nose print is as unique as a human fingerprint—their cosmic signature encoded in flesh.",
  ],
  cat: [
    "Ancient Egyptians believed cats were sacred because they could sense cosmic energy humans couldn't perceive.",
    "Cats purr at a frequency (25-150 Hz) that promotes healing and bone regeneration—they're natural energy healers.",
    "A cat's whiskers can detect the slightest changes in air currents, sensing invisible energies around them.",
    "Cats spend 70% of their lives sleeping, traveling to realms beyond our perception in their dreams.",
    "The reflective layer in a cat's eyes was once believed to capture moonlight and store lunar energy.",
  ],
  horse: [
    "Horses can sense human emotions through heart rate and pheromones, making them powerful empaths.",
    "A horse's eyes are the largest of any land mammal, designed to perceive both physical and spiritual worlds.",
    "Horses sleep standing up and can enter REM sleep while remaining alert to cosmic disturbances.",
    "In mythology, horses carry souls between worlds—your horse may be your spirit guide.",
    "Horses communicate through 17 different facial expressions, a complex emotional language.",
  ],
  bird: [
    "Birds can see ultraviolet light, perceiving a hidden world of colors and energies invisible to humans.",
    "Many birds navigate using Earth's magnetic field—they're literally tuned into the planet's energy grid.",
    "Parrots can understand abstract concepts like shape and color, showing they process cosmic information uniquely.",
    "Birds sing at dawn to greet the sun's energy—a daily ritual of cosmic acknowledgment.",
  ],
  rabbit: [
    "Rabbits can see nearly 360 degrees around them, perceiving energy from almost every direction.",
    "A rabbit's nose twitches 20-120 times per minute, constantly sampling the energetic environment.",
    "Rabbits are most active at dawn and dusk—the mystical twilight hours when worlds overlap.",
    "In many cultures, rabbits symbolize the moon and are considered messengers between realms.",
  ],
  hamster: [
    "Hamsters can run up to 5 miles in a night on their wheel—channeling infinite cosmic energy.",
    "A hamster's cheek pouches can expand to three times the size of their head, storing abundance.",
    "Hamsters are crepuscular, most active during the magical twilight hours of dawn and dusk.",
  ],
  guinea_pig: [
    "Guinea pigs 'popcorn' when happy—an irresistible expression of pure cosmic joy.",
    "They communicate through 11 different vocalizations, each carrying its own emotional frequency.",
    "Guinea pigs need companionship to thrive—their souls are designed for connection.",
  ],
  fish: [
    "Fish can feel vibrations through their lateral line, sensing energy waves we cannot perceive.",
    "Goldfish have a memory span of months, not seconds—they remember their cosmic companions.",
    "Fish in schools move as one through a mysterious sixth sense—collective cosmic consciousness.",
  ],
  reptile: [
    "Reptiles are cold-blooded, meaning they literally absorb the sun's cosmic energy to survive.",
    "Many reptiles have a 'third eye' (parietal eye) that senses light and shadows from above.",
    "Reptiles have existed for over 300 million years, carrying ancient cosmic wisdom in their DNA.",
  ],
  default: [
    "Your pet's eyes contain light receptors that may perceive wavelengths humans cannot see.",
    "Animals sense energy shifts before earthquakes and storms—they're tuned to Earth's cosmic frequency.",
    "The bond between humans and animals creates a measurable electromagnetic connection.",
    "Your pet chose you on a soul level—this connection was written in the stars.",
  ],
};

function getSpeciesFact(species: string, petName: string): string {
  const normalizedSpecies = species?.toLowerCase() || 'default';
  const facts = speciesFacts[normalizedSpecies] || speciesFacts.default;
  const index = petName.length % facts.length;
  return facts[index];
}

function SinglePetReport({ petData, cosmicReport, isActive }: { petData: PetData; cosmicReport: CosmicReport; isActive: boolean }) {
  const { sunSign, archetype, element, nameVibration, coreEssence, soulMission, hiddenGift, loveLanguage, breedInsight, ownerInsight, personalityType, occasionMode, luckyDay, powerPair, secretStrength, cosmicFact } = cosmicReport;
  const speciesFact = getSpeciesFact(petData.species, petData.name);
  const isMemorial = occasionMode === 'memorial';
  const isBirthday = occasionMode === 'birthday';
  
  // Gender-based pronouns
  const petGender = (petData.gender || '') as PetGender;
  const possessive = getPossessive(petGender);

  // Occasion-specific header text
  const getConfirmationText = () => {
    if (isMemorial) return "Forever remembered";
    if (isBirthday) return "Birthday Star Revealed";
    return "It's confirmed";
  };

  const getSignText = () => {
    if (isMemorial) return `${petData.name} was a ${sunSign}`;
    return `${petData.name} is a ${sunSign}`;
  };

  const getSectionTitle = (title: string) => {
    if (isMemorial) {
      switch (title) {
        case 'Soul Mission': return 'Soul Legacy';
        case 'Hidden Gift': return `Gift ${getPronoun(petGender, 'subject')} Shared`;
        case 'Love Language': return `How ${getPronoun(petGender, 'subject')} Loved`;
        default: return title;
      }
    }
    return title;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: isActive ? 1 : 0.3, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className={cn(
        "space-y-6 transition-all duration-300",
        !isActive && "pointer-events-none"
      )}
    >
      {/* Main Result Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "bg-card/60 backdrop-blur-xl border rounded-3xl p-8 space-y-6",
          isMemorial ? "border-purple-500/30" : "border-border/50"
        )}
      >
        {/* Zodiac Icon */}
        <div className="relative mx-auto w-24 h-24">
          <motion.div
            className={cn(
              "absolute inset-0 rounded-full blur-xl",
              isMemorial ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30" : "bg-gradient-to-br from-primary/30 to-gold/30"
            )}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className={cn(
            "relative w-full h-full rounded-full flex items-center justify-center shadow-2xl",
            isMemorial ? "bg-gradient-to-br from-purple-600 to-pink-500 shadow-purple-500/30" : "bg-gradient-to-br from-primary to-gold shadow-primary/30"
          )}>
            <span className="text-4xl">{zodiacIcons[sunSign] || '⭐'}</span>
          </div>
        </div>

        {/* Name & Sign */}
        <div className="space-y-2 text-center">
          <p className={cn(
            "text-sm uppercase tracking-widest",
            isMemorial ? "text-purple-400" : "text-muted-foreground"
          )}>{getConfirmationText()}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            {getSignText()}
          </h1>
          <p className={cn(
            "text-xl font-medium",
            isMemorial ? "text-purple-300" : "text-gold"
          )}>{archetype}</p>
          {personalityType && (
            <p className="text-sm text-primary/80 font-medium">"{personalityType}"</p>
          )}
          <p className="text-sm text-muted-foreground capitalize">
            {petData.breed ? `${petData.breed} • ` : ''}{petData.species} • {petData.gender === 'boy' ? 'Male' : petData.gender === 'girl' ? 'Female' : 'Pet'}
          </p>
        </div>

        {/* Element Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/50 border border-border/50">
            <span className="text-xl">{elementIcons[element] || '✨'}</span>
            <span className="text-foreground/80">{element} Element</span>
          </div>
        </div>

        {/* Core Essence */}
        <div className="pt-4 border-t border-border/50">
          <h3 className={cn(
            "text-sm uppercase tracking-widest mb-3 text-center",
            isMemorial ? "text-purple-400" : "text-primary/80"
          )}>{isMemorial ? `${possessive.charAt(0).toUpperCase() + possessive.slice(1)} Core Truth` : "The Core Truth"}</h3>
          <p className="text-foreground/80 text-lg leading-relaxed text-center">
            {coreEssence}
          </p>
        </div>
      </motion.div>

      {/* Soul Mission Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "bg-card/40 backdrop-blur-xl border rounded-2xl p-6",
          isMemorial ? "border-purple-500/30" : "border-primary/30"
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            isMemorial 
              ? "bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30" 
              : "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30"
          )}>
            <Heart className={cn("w-6 h-6", isMemorial ? "text-purple-400" : "text-primary")} />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{getSectionTitle('Soul Mission')}</p>
            <p className="text-foreground/90">{soulMission}</p>
          </div>
        </div>
      </motion.div>

      {/* Hidden Gift Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card/40 backdrop-blur-xl border border-gold/30 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30 shrink-0">
            <Lightbulb className="w-6 h-6 text-gold" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{getSectionTitle('Hidden Gift')}</p>
            <p className="text-foreground/90">{hiddenGift}</p>
          </div>
        </div>
      </motion.div>

      {/* Love Language Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card/40 backdrop-blur-xl border border-tangerine/30 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tangerine/20 to-tangerine/10 flex items-center justify-center border border-tangerine/30 shrink-0">
            <Star className="w-6 h-6 text-tangerine" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{getSectionTitle('Love Language')}</p>
            <p className="text-foreground/90">{loveLanguage}</p>
          </div>
        </div>
      </motion.div>

      {/* Name Vibration Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-foreground">{nameVibration}</span>
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">Name Vibration</p>
            <p className="text-lg font-medium text-foreground">{vibrationMeanings[nameVibration] || "Unique Energy"}</p>
          </div>
        </div>
      </motion.div>

      {/* Personality Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Personality Breakdown</p>
        </div>
        <div className="space-y-3">
          {[
            { trait: "Adventurous Spirit", value: 65 + (nameVibration * 3), color: "from-primary to-tangerine" },
            { trait: "Emotional Depth", value: 78 + (nameVibration), color: "from-nebula-purple to-nebula-pink" },
            { trait: "Intuitive Power", value: 82 + nameVibration, color: "from-gold to-gold-light" },
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground/80">{item.trait}</span>
                <span className="text-gold font-medium">{Math.min(item.value, 99)}%</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.value, 99)}%` }}
                  transition={{ delay: 0.6 + idx * 0.1, duration: 0.8 }}
                  className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                />
              </div>
            </div>
          ))}
          <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>12 more personality traits in full report...</span>
          </div>
        </div>
      </motion.div>

      {/* Secret Strength - NEW UNIQUE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className={cn(
          "bg-card/40 backdrop-blur-xl border rounded-2xl p-6",
          isMemorial ? "border-purple-400/30" : "border-emerald-500/30"
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0",
            isMemorial 
              ? "bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30"
              : "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border-emerald-500/30"
          )}>
            <Zap className={cn("w-6 h-6", isMemorial ? "text-purple-400" : "text-emerald-400")} />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
              {isMemorial ? `${possessive.charAt(0).toUpperCase() + possessive.slice(1)} Secret Strength` : "Secret Strength"}
            </p>
            <p className="text-foreground/90">{secretStrength}</p>
          </div>
        </div>
      </motion.div>

      {/* Lucky Day - NEW UNIQUE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card/40 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <span className="text-2xl">🌟</span>
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
              {isMemorial ? `${possessive.charAt(0).toUpperCase() + possessive.slice(1)} Lucky Day Was` : "Lucky Day"}
            </p>
            <p className="text-foreground/90">{luckyDay}</p>
          </div>
        </div>
      </motion.div>

      {/* Power Pair (Human Compatibility) - NEW UNIQUE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center border border-pink-500/30 shrink-0">
            <Users className="w-6 h-6 text-pink-400" />
          </div>
          <div className="text-left">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
              {isMemorial ? "Soul Connection" : "Power Pair"}
            </p>
            <p className="text-foreground/90 text-sm">{powerPair}</p>
          </div>
        </div>
      </motion.div>

      {/* Cosmic Fact - Personalized */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Fingerprint className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-amber-500/90 uppercase tracking-wider font-medium mb-1">
              {isMemorial ? `${petData.name}'s Cosmic Signature` : "Cosmic Signature"}
            </p>
            <p className="text-foreground/90 text-sm leading-relaxed">
              {cosmicFact}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MultiPetMiniReport({ petsData }: MultiPetMiniReportProps) {
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  
  // Generate cosmic reports for all pets
  const cosmicReports = petsData.map(pet => generateCosmicReport(pet));
  const currentPet = petsData[currentPetIndex];
  const currentReport = cosmicReports[currentPetIndex];
  
  const goToPrevPet = () => setCurrentPetIndex(prev => Math.max(0, prev - 1));
  const goToNextPet = () => setCurrentPetIndex(prev => Math.min(petsData.length - 1, prev + 1));

  // Check if any pet is in memorial mode
  const hasMemorialPet = petsData.some(pet => pet.occasionMode === 'memorial');
  const hasBirthdayPet = petsData.some(pet => pet.occasionMode === 'birthday');
  
  const getHeroBadgeText = () => {
    if (hasMemorialPet && petsData.length === 1) return "💜 Memorial Tribute Complete";
    if (hasMemorialPet) return `💜 Memorial & Cosmic Analysis Complete for ${petsData.length} Pets`;
    if (hasBirthdayPet && petsData.length === 1) return "🎂 Birthday Portrait Complete";
    if (hasBirthdayPet) return `🎂 Birthday & Cosmic Analysis Complete for ${petsData.length} Pets`;
    return `✨ Cosmic Analysis Complete for ${petsData.length} ${petsData.length === 1 ? 'Pet' : 'Pets'}`;
  };
  
  // Use first pet's name for personalization
  const firstName = petsData[0]?.name || 'your pet';
  const firstGender = (petsData[0]?.gender || '') as PetGender;
  const possessive = getPossessive(firstGender);
  const subject = getPronoun(firstGender, 'subject');
  
  const lockedItems = [
    { icon: Moon, label: hasMemorialPet ? "Moon Sign Memories" : "Moon Sign Analysis", preview: hasMemorialPet ? `Why ${possessive} mood would shift...` : `Why ${possessive} mood shifts unexpectedly...` },
    { icon: ArrowUp, label: hasMemorialPet ? "Your Soul Contract" : "Your Soul Contract", preview: hasMemorialPet ? `What you were here to teach each other...` : `What you're here to teach each other...` },
    { icon: Sparkles, label: hasMemorialPet ? `${firstName}'s Life Purpose` : `${firstName}'s Life Purpose`, preview: hasMemorialPet ? `The role ${subject} played in your journey...` : `The role ${subject} plays in your journey...` },
    { icon: Heart, label: hasMemorialPet ? "Emotional Legacy" : "Emotional Needs Decoded", preview: hasMemorialPet ? `What ${subject} needed but couldn't express...` : `What ${subject} needs but can't express...` },
    { icon: Zap, label: hasMemorialPet ? "Spirit & Energy" : "Energy & Vitality Insights", preview: hasMemorialPet ? `${firstName}'s unique energy patterns...` : `${firstName}'s unique wellness patterns...` },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Progress Bar */}
      <ProgressBar percentage={18} petName={firstName} />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-b via-background to-background",
          hasMemorialPet ? "from-purple-500/10" : "from-primary/10"
        )} />
        
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            {/* Confirmation Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border",
                hasMemorialPet ? "bg-purple-500/20 border-purple-500/30" : "bg-primary/20 border-primary/30"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                hasMemorialPet ? "text-purple-300" : "text-primary"
              )}>
                {getHeroBadgeText()}
              </span>
            </motion.div>

            {/* Pet Navigation - Only show if multiple pets */}
            {petsData.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevPet}
                  disabled={currentPetIndex === 0}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex gap-2">
                  {petsData.map((pet, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPetIndex(index)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        index === currentPetIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-card/50 text-muted-foreground hover:bg-card"
                      )}
                    >
                      {pet.name || `Pet ${index + 1}`}
                    </button>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextPet}
                  disabled={currentPetIndex === petsData.length - 1}
                  className="rounded-full"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </motion.div>
            )}

            {/* Current Pet Report */}
            <AnimatePresence mode="wait">
              <SinglePetReport
                key={currentPetIndex}
                petData={currentPet}
                cosmicReport={currentReport}
                isActive={true}
              />
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Premium Preview Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <PremiumPreview 
            petName={firstName}
            sunSign={currentReport.sunSign}
            element={currentReport.element}
          />
        </motion.div>
      </div>

      {/* Personalized Testimonials */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-xl font-display font-semibold text-foreground text-center mb-6">
            What Other {currentReport.sunSign} Pet Owners Discovered
          </h2>
          <PersonalizedTestimonials 
            petSign={currentReport.sunSign}
            petSpecies={currentPet.species}
            petName={firstName}
          />
        </motion.div>
      </div>

      {/* FOMO Section */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className={cn(
            "border rounded-2xl p-5",
            hasMemorialPet 
              ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30"
              : "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30"
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn("w-5 h-5 flex-shrink-0 mt-0.5", hasMemorialPet ? "text-purple-400" : "text-red-400")} />
            <div>
              <p className="font-medium text-foreground mb-1">
                {hasMemorialPet 
                  ? `Without the full tribute, these memories of ${firstName} stay locked away...`
                  : `Without the full report, you'll never truly understand ${firstName}...`
                }
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {hasMemorialPet ? (
                  <>
                    <p>❌ The complete story of {firstName}'s soul purpose</p>
                    <p>❌ Why {subject} behaved that one special way</p>
                    <p>❌ {possessive.charAt(0).toUpperCase() + possessive.slice(1)} messages for you from beyond</p>
                    <p>❌ How to carry {possessive} spirit forward</p>
                    <p>❌ {possessive.charAt(0).toUpperCase() + possessive.slice(1)} lasting gifts to your soul</p>
                    <p>❌ Signs {subject} may send you now</p>
                  </>
                ) : (
                  <>
                    <p>❌ Why {firstName}'s mood shifts unexpectedly</p>
                    <p>❌ What you're here to teach each other</p>
                    <p>❌ The role {subject} plays in your journey</p>
                    <p>❌ What {subject} truly needs but can't express</p>
                    <p>❌ {firstName}'s unique wellness patterns</p>
                    <p>❌ The deeper purpose of your bond</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Locked Content Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-display font-semibold text-foreground text-center mb-6">
            Unlock the Deep Dive
          </h2>

          {lockedItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.1 }}
              className="relative overflow-hidden bg-card/40 border border-border/50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      🔒 {item.label}
                    </h3>
                    <p className="text-sm text-muted-foreground blur-sm select-none">
                      {item.preview}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Sticky Footer CTA */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4"
      >
        <div className="max-w-md mx-auto">
          <Button
            variant="gold"
            size="xl"
            className="w-full shadow-2xl shadow-gold/20"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Unlock {petsData.length > 1 ? 'All Reports' : 'Full Report'} ($27{petsData.length > 1 ? '/each' : ''})
          </Button>
          <p className="text-center text-xs text-muted-foreground/60 mt-3">
            Instant access • 30-page PDF • Lifetime updates
          </p>
        </div>
      </motion.div>
    </div>
  );
}
