import { motion } from 'framer-motion';
import { PetData, CosmicReport } from './IntakeWizard';
import { Lock, Moon, ArrowUp, Sparkles, Star, Heart, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestimonialCarousel } from './TestimonialCarousel';

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

export function MiniReport({ petData, cosmicReport }: MiniReportProps) {
  if (!cosmicReport) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading your cosmic portrait...</p>
      </div>
    );
  }

  const { sunSign, archetype, element, nameVibration, coreEssence, soulMission, hiddenGift, loveLanguage } = cosmicReport;

  const lockedItems = [
    { icon: Moon, label: "Moon Sign Analysis", preview: "Deep emotional patterns revealed..." },
    { icon: ArrowUp, label: "Rising Sign Profile", preview: "How the world perceives them..." },
    { icon: Sparkles, label: "Full Soul Contract", preview: "The cosmic reason for your bond..." },
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
          </motion.div>
        </div>
      </div>

      {/* Locked Content Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
              transition={{ delay: 1 + index * 0.1 }}
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

      {/* Testimonials */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <h2 className="text-xl font-display font-semibold text-foreground text-center mb-6">
            What Others Discovered
          </h2>
          <TestimonialCarousel />
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
