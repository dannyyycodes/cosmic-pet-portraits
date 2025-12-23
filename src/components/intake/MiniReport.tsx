import { motion } from 'framer-motion';
import { PetData, CosmicReport } from './IntakeWizard';
import { Lock, Moon, ArrowUp, Sparkles, Star, Heart, Lightbulb, AlertTriangle, Zap, Users, Activity, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestimonialCarousel } from './TestimonialCarousel';
import { getPossessive } from '@/lib/pronouns';
import type { PetGender } from '@/lib/pronouns';

interface MiniReportProps {
  petData: PetData;
  cosmicReport: CosmicReport | null;
}

const elementIcons: Record<string, string> = {
  Fire: '🔥',
  Earth: '🌍',
  Air: '💨',
  Water: '💧',
};

const zodiacIcons: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

const vibrationMeanings: Record<number, string> = {
  1: "Leadership & Independence",
  2: "Harmony & Partnership",
  3: "Creativity & Expression",
  4: "Stability & Foundation",
  5: "Freedom & Adventure",
  6: "Nurturing & Protection",
  7: "Wisdom & Intuition",
  8: "Power & Abundance",
  9: "Compassion & Completion",
  11: "Spiritual Illumination",
  22: "Master Builder",
  33: "Master Teacher",
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
  bird: [
    "Birds can see ultraviolet light, perceiving a hidden world of colors and energies invisible to humans.",
    "Many birds navigate using Earth's magnetic field—they're literally tuned into the planet's energy grid.",
    "Parrots can understand abstract concepts like shape and color, showing they process cosmic information uniquely.",
    "Birds sing at dawn to greet the sun's energy—a daily ritual of cosmic acknowledgment.",
    "Some birds can remember thousands of hiding spots, suggesting an extraordinary connection to spatial memory.",
  ],
  rabbit: [
    "Rabbits can see nearly 360 degrees around them, perceiving energy from almost every direction.",
    "A rabbit's nose twitches 20-120 times per minute, constantly sampling the energetic environment.",
    "Rabbits are most active at dawn and dusk—the mystical twilight hours when worlds overlap.",
    "In many cultures, rabbits symbolize the moon and are considered messengers between realms.",
    "Rabbits binky (jump and twist) when happy—a physical expression of pure cosmic joy.",
  ],
  horse: [
    "Horses can sense human emotions through heart rate and pheromones, making them powerful empaths.",
    "A horse's eyes are the largest of any land mammal, designed to perceive both physical and spiritual worlds.",
    "Horses sleep standing up and can enter REM sleep while remaining alert to cosmic disturbances.",
    "In mythology, horses carry souls between worlds—your horse may be your spirit guide.",
    "Horses communicate through 17 different facial expressions, a complex emotional language.",
  ],
  hamster: [
    "Hamsters can run up to 5 miles in a night on their wheel—channeling infinite cosmic energy.",
    "A hamster's cheek pouches can expand to three times the size of their head, storing abundance.",
    "Hamsters are crepuscular, most active during the magical twilight hours of dawn and dusk.",
    "Hamsters have scent glands that create invisible energy signatures others can detect.",
    "Baby hamsters are called 'pups' and are born knowing how to find their way by instinct alone.",
  ],
  fish: [
    "Fish can feel vibrations through their lateral line, sensing energy waves we cannot perceive.",
    "Goldfish have a memory span of months, not seconds—they remember their cosmic companions.",
    "Some fish can see polarized light, perceiving dimensions of reality hidden from us.",
    "Fish in schools move as one through a mysterious sixth sense—collective cosmic consciousness.",
    "Betta fish can recognize their owners and respond differently to familiar energies.",
  ],
  reptile: [
    "Reptiles are cold-blooded, meaning they literally absorb the sun's cosmic energy to survive.",
    "Many reptiles have a 'third eye' (parietal eye) that senses light and shadows from above.",
    "Reptiles have existed for over 300 million years, carrying ancient cosmic wisdom in their DNA.",
    "Geckos can walk on walls using Van der Waals forces—manipulating molecular-level energy.",
    "Reptiles shed their skin as a symbol of transformation and cosmic rebirth.",
  ],
  default: [
    "Your pet's eyes contain light receptors that may perceive wavelengths humans cannot see.",
    "Animals sense energy shifts before earthquakes and storms—they're tuned to Earth's cosmic frequency.",
    "The bond between humans and animals creates a measurable electromagnetic connection.",
    "Your pet chose you on a soul level—this connection was written in the stars.",
    "Animals experience time differently, living fully in each cosmic moment.",
  ],
};

// Get a random fact based on species
function getSpeciesFact(species: string): string {
  const normalizedSpecies = species?.toLowerCase() || 'default';
  const facts = speciesFacts[normalizedSpecies] || speciesFacts.default;
  return facts[Math.floor(Math.random() * facts.length)];
}

export function MiniReport({ petData, cosmicReport }: MiniReportProps) {
  if (!cosmicReport) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your cosmic portrait...</p>
      </div>
    );
  }

  const { sunSign, archetype, element, nameVibration, coreEssence, soulMission, hiddenGift, loveLanguage } = cosmicReport;
  const speciesFact = getSpeciesFact(petData.species);
  const pronoun = getPossessive((petData.gender || '') as PetGender);

  const lockedItems = [
    { icon: Moon, label: "Moon Sign Analysis", preview: `Why ${pronoun} mood shifts unexpectedly...`, teaser: `Understanding ${pronoun} emotional rhythms` },
    { icon: ArrowUp, label: "Your Soul Contract", preview: "What you're here to teach each other...", teaser: "The deeper purpose of your bond" },
    { icon: Sparkles, label: `${petData.name}'s Life Purpose`, preview: `The role ${pronoun === 'his' ? 'he' : pronoun === 'her' ? 'she' : 'they'} plays in your journey...`, teaser: "Why this soul chose to be with you" },
    { icon: Heart, label: "Emotional Needs Decoded", preview: `What ${pronoun === 'his' ? 'he needs' : pronoun === 'her' ? 'she needs' : 'they need'} but can't express...`, teaser: `How to truly understand ${pronoun} heart` },
    { icon: Zap, label: "Energy & Vitality Insights", preview: `${petData.name}'s unique wellness patterns...`, teaser: `Supporting ${pronoun} highest potential` },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30"
            >
              <span className="text-primary text-sm font-medium">✨ Cosmic Analysis Complete</span>
            </motion.div>

            {/* Main Result Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 space-y-6"
            >
              {/* Zodiac Icon */}
              <div className="relative mx-auto w-24 h-24">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-2xl shadow-primary/30">
                  <span className="text-4xl">{zodiacIcons[sunSign] || '⭐'}</span>
                </div>
              </div>

              {/* Name & Sign */}
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm uppercase tracking-widest">It's confirmed</p>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  {petData.name} is a {sunSign}
                </h1>
                <p className="text-xl text-gold font-medium">{archetype}</p>
              </div>

              {/* Element Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/50 border border-border/50">
                <span className="text-xl">{elementIcons[element] || '✨'}</span>
                <span className="text-foreground/80">{element} Element</span>
              </div>

              {/* Core Essence */}
              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm uppercase tracking-widest text-primary/80 mb-3">The Core Truth</h3>
                <p className="text-foreground/80 text-lg leading-relaxed">
                  {coreEssence}
                </p>
              </div>
            </motion.div>

            {/* Soul Mission Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card/40 backdrop-blur-xl border border-primary/30 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Soul Mission</p>
                  <p className="text-foreground/90">{soulMission}</p>
                </div>
              </div>
            </motion.div>

            {/* Hidden Gift Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-card/40 backdrop-blur-xl border border-gold/30 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30 shrink-0">
                  <Lightbulb className="w-6 h-6 text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Hidden Gift</p>
                  <p className="text-foreground/90">{hiddenGift}</p>
                </div>
              </div>
            </motion.div>

            {/* Love Language Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card/40 backdrop-blur-xl border border-tangerine/30 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-tangerine/20 to-tangerine/10 flex items-center justify-center border border-tangerine/30 shrink-0">
                  <Star className="w-6 h-6 text-tangerine" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Love Language</p>
                  <p className="text-foreground/90">{loveLanguage}</p>
                </div>
              </div>
            </motion.div>

            {/* Name Vibration Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
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

            {/* NEW: Cosmic Compatibility Score - High Value Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68 }}
              className="bg-gradient-to-br from-primary/20 via-card/60 to-gold/20 backdrop-blur-xl border border-primary/40 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/30 rounded-full text-[10px] text-primary font-medium">
                EXCLUSIVE PREVIEW
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary-foreground">
                      {Math.floor(75 + (nameVibration * 2))}%
                    </span>
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-gold/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gold" />
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">You & {petData.name}</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">Cosmic Compatibility</p>
                  <p className="text-xs text-muted-foreground mt-1">Your souls are deeply connected...</p>
                </div>
              </div>
            </motion.div>

            {/* NEW: Personality Breakdown Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72 }}
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
                        transition={{ delay: 0.8 + idx * 0.1, duration: 0.8 }}
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

            {/* NEW: Quick Insights Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.76 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="bg-card/40 border border-border/50 rounded-xl p-4 text-center">
                <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Best Play Time</p>
                <p className="text-sm font-semibold text-foreground">{element === 'Fire' ? 'Morning' : element === 'Earth' ? 'Afternoon' : element === 'Air' ? 'Anytime' : 'Evening'}</p>
              </div>
              <div className="bg-card/40 border border-border/50 rounded-xl p-4 text-center">
                <TrendingUp className="w-6 h-6 text-gold mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Lucky Day</p>
                <p className="text-sm font-semibold text-foreground">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nameVibration % 7]}</p>
              </div>
            </motion.div>

            {/* Did You Know - Species Specific */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <p className="text-sm text-amber-500/90 uppercase tracking-wider font-medium mb-1">Did You Know?</p>
                  <p className="text-foreground/90 text-sm leading-relaxed">
                    {speciesFact}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Testimonials - MOVED HIGHER */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-xl font-display font-semibold text-foreground text-center mb-6">
            What Others Discovered
          </h2>
          <TestimonialCarousel />
        </motion.div>
      </div>

      {/* FOMO Section - Enhanced */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-4"
        >
          {/* Urgent Warning */}
          <div className="bg-gradient-to-r from-red-500/15 to-orange-500/15 border-2 border-red-500/40 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-foreground mb-2 text-lg">Don't Leave Without Knowing...</p>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-red-400">❌</span> 
                    <span>Why {petData.name}'s mood shifts unexpectedly</span>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-red-400">❌</span> 
                    <span>What you're here to teach each other</span>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-red-400">❌</span> 
                    <span>The role they play in your life's journey</span>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-red-400">❌</span> 
                    <span>What they need but can't express</span>
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <span className="text-red-400">❌</span> 
                    <span>Their unique wellness patterns to support</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sneak Peek - Blurred Content */}
          <div className="bg-card/60 border border-primary/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-3 right-3 px-2 py-1 bg-gold/20 rounded-full text-[10px] text-gold font-bold uppercase tracking-wider">
              Sneak Peek
            </div>
            <p className="text-sm text-primary font-medium mb-3">From {petData.name}'s Full Report:</p>
            <div className="relative">
              <p className="text-foreground/90 text-sm leading-relaxed blur-[3px] select-none">
                "When the moon enters their opposite sign, {petData.name} may experience unusual restlessness. 
                This is because their emotional core is being activated by lunar energies that challenge their 
                natural {element} tendencies. During these times, they need extra comfort and may seek out 
                dark, quiet spaces to process these cosmic downloads..."
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/90 rounded-full text-primary-foreground text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  <span>Unlock to Read</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Comparison */}
          <div className="bg-card/40 border border-border/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">What you're seeing:</p>
              <p className="text-sm text-muted-foreground">What's in the full report:</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">4</p>
                <p className="text-xs text-muted-foreground">insights</p>
              </div>
              <div className="flex-1 mx-4 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className="w-[15%] h-full bg-primary rounded-full" />
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gold">30+</p>
                <p className="text-xs text-muted-foreground">deep insights</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Locked Content Section - Enhanced */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="space-y-4"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              18 Chapters Waiting for You
            </h2>
            <p className="text-sm text-muted-foreground">Each one reveals something new about {petData.name}</p>
          </div>

          {lockedItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + index * 0.08 }}
              className="relative overflow-hidden bg-card/40 border border-border/50 rounded-2xl p-4 group hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2 text-sm">
                      <Lock className="w-3 h-3 text-muted-foreground" /> {item.label}
                    </h3>
                    <p className="text-xs text-primary/80 font-medium">{item.preview}</p>
                    <p className="text-xs text-muted-foreground">{item.teaser}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* More sections indicator */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">+ 13 more chapters including Quirks & Habits, Ideal Diet, Dream Analysis...</p>
          </div>
        </motion.div>

        {/* Value Proposition Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-8 bg-gradient-to-br from-primary/5 via-card/60 to-nebula-pink/5 border border-primary/20 rounded-2xl p-5"
        >
          <p className="text-sm text-foreground/90 leading-relaxed">
            <span className="font-semibold text-primary">Think about it:</span> A single vet behavior consultation costs <span className="line-through text-muted-foreground">$150+</span>, a pet psychic reading runs <span className="line-through text-muted-foreground">$200+</span>, and the emotional cost of misunderstanding your pet—missed moments, confusion, unexplained distance—is <span className="italic">priceless</span>. For less than a bag of premium treats, you get a lifetime of understanding, a deeper bond, and insights that transform how you see each other. <span className="font-semibold text-gold">This isn't an expense—it's an investment in the relationship that matters most.</span>
          </p>
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
            Unlock Full 30-Page Portrait ($27)
          </Button>
          <p className="text-center text-xs text-muted-foreground/60 mt-3">
            Instant access • 30-page PDF • Lifetime updates
          </p>
        </div>
      </motion.div>
    </div>
  );
}
