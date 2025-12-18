import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Heart, Sun, Moon, Compass, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportContent {
  sunSign: string;
  archetype: string;
  element: string;
  modality: string;
  nameVibration: number;
  coreEssence: string;
  soulMission: string;
  hiddenGift: string;
  loveLanguage: string;
  cosmicAdvice: string;
}

interface EmotionalReportRevealProps {
  petName: string;
  report: ReportContent;
  onComplete: () => void;
}

const elementEmojis: Record<string, string> = {
  Fire: '🔥',
  Earth: '🌿',
  Air: '💨',
  Water: '🌊',
};

const signEmojis: Record<string, string> = {
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

type RevealStage = 
  | 'intro'
  | 'sign-reveal'
  | 'archetype'
  | 'essence'
  | 'mission'
  | 'gift'
  | 'love'
  | 'advice'
  | 'complete';

const stages: RevealStage[] = [
  'intro',
  'sign-reveal',
  'archetype',
  'essence',
  'mission',
  'gift',
  'love',
  'advice',
  'complete',
];

type UnknownReport = any;

const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);

const normalizeRevealReport = (raw: UnknownReport): ReportContent => {
  const sunSign = asString(raw?.chartPlacements?.sun?.sign) || asString(raw?.sunSign) || 'Aries';
  const element = asString(raw?.dominantElement) || asString(raw?.element) || 'Fire';
  const modality = asString(raw?.modality) || 'Mystic';

  const archetype = asString(raw?.archetype?.name) || asString(raw?.archetype) || 'Cosmic Soul';

  const coreEssence =
    asString(raw?.coreEssence) ||
    asString(raw?.solarSoulprint?.content) ||
    asString(raw?.prologue) ||
    'A radiant presence with a heart full of starlight.';

  const soulMission =
    asString(raw?.soulMission) ||
    asString(raw?.destinyCompass?.content) ||
    asString(raw?.keepersBond?.soulContract) ||
    'To deepen your bond through presence, play, and gentle guidance.';

  const hiddenGift =
    asString(raw?.hiddenGift) ||
    asString(raw?.wildSpirit?.content) ||
    asString(raw?.gentleHealer?.content) ||
    'A quiet magic that turns ordinary moments into comfort.';

  const loveLanguage =
    asString(raw?.loveLanguage) ||
    asString(raw?.harmonyHeartbeats?.loveLanguageType) ||
    asString(raw?.harmonyHeartbeats?.content) ||
    'Quality time and affectionate rituals.';

  const cosmicAdvice =
    asString(raw?.cosmicAdvice) ||
    asString(raw?.keepersBond?.dailyRitual) ||
    asString(raw?.epilogue) ||
    'Follow the small daily rituals that make your bond feel sacred.';

  return {
    sunSign,
    archetype,
    element,
    modality,
    nameVibration: asNumber(raw?.nameVibration) ?? 0,
    coreEssence,
    soulMission,
    hiddenGift,
    loveLanguage,
    cosmicAdvice,
  };
};

export function EmotionalReportReveal({ petName, report, onComplete }: EmotionalReportRevealProps) {
  const [currentStage, setCurrentStage] = useState<RevealStage>('intro');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const stageIndex = stages.indexOf(currentStage);
  const progress = (stageIndex / (stages.length - 1)) * 100;
  const r = normalizeRevealReport(report);

  const advanceStage = useCallback(() => {
    const nextIndex = stageIndex + 1;
    if (nextIndex < stages.length) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStage(stages[nextIndex]);
        setIsTransitioning(false);
      }, 500);
    }
  }, [stageIndex]);

  // Auto-advance intro after delay
  useEffect(() => {
    if (currentStage === 'intro') {
      const timer = setTimeout(advanceStage, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, advanceStage]);

  const renderStage = () => {
    switch (currentStage) {
      case 'intro':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-32 h-32 mx-auto relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-nebula-purple via-primary to-nebula-pink opacity-50 blur-xl" />
              <div className="relative w-full h-full rounded-full bg-card/50 flex items-center justify-center border border-primary/30">
                <Star className="w-16 h-16 text-cosmic-gold" />
              </div>
            </motion.div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                The cosmos are aligning...
              </h2>
              <p className="text-muted-foreground">
                Preparing to reveal {petName}&apos;s cosmic truth
              </p>
            </div>
          </motion.div>
        );

      case 'sign-reveal':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              className="relative"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="w-48 h-48 mx-auto relative"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cosmic-gold via-primary to-cosmic-gold opacity-30 blur-2xl" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="text-8xl"
                >
                  {signEmojis[r.sunSign] || '✨'}
                </motion.span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-cosmic-gold text-sm uppercase tracking-widest mb-2">
                {petName} was born under
              </p>
              <h1 className="text-5xl font-display font-bold text-foreground mb-4">
                {r.sunSign}
              </h1>
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  {elementEmojis[r.element]} {r.element}
                </span>
                <span>•</span>
                <span>{r.modality}</span>
              </div>
            </motion.div>

            <Button onClick={advanceStage} variant="gold" size="lg" className="mt-8">
              <Sparkles className="w-5 h-5 mr-2" />
              Discover Their Archetype
            </Button>
          </motion.div>
        );

      case 'archetype':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
              className="space-y-4"
            >
              <p className="text-muted-foreground text-sm uppercase tracking-widest">
                {petName}&apos;s Soul Archetype
              </p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-cosmic-gold via-primary to-nebula-pink bg-clip-text text-transparent"
              >
                &ldquo;{r.archetype}&rdquo;
              </motion.h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-2"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <Star className="w-6 h-6 text-cosmic-gold fill-cosmic-gold" />
                </motion.div>
              ))}
            </motion.div>

            <Button onClick={advanceStage} variant="gold" size="lg" className="mt-8">
              <Sun className="w-5 h-5 mr-2" />
              Reveal Core Essence
            </Button>
          </motion.div>
        );

      case 'essence':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <Sun className="w-12 h-12 mx-auto text-cosmic-gold mb-4" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Core Essence
              </h2>
              <p className="text-sm text-muted-foreground">
                The heart of {petName}&apos;s being
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-cosmic-gold/20"
            >
              <p className="text-lg text-foreground leading-relaxed italic">
                &ldquo;{r.coreEssence}&rdquo;
              </p>
            </motion.div>

            <div className="text-center">
              <Button onClick={advanceStage} variant="gold" size="lg">
                <Compass className="w-5 h-5 mr-2" />
                Discover Soul Mission
              </Button>
            </div>
          </motion.div>
        );

      case 'mission':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <Compass className="w-12 h-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Soul Mission
              </h2>
              <p className="text-sm text-muted-foreground">
                Why {petName} came into your life
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-primary/20"
            >
              <p className="text-lg text-foreground leading-relaxed italic">
                &ldquo;{r.soulMission}&rdquo;
              </p>
            </motion.div>

            <div className="text-center">
              <Button onClick={advanceStage} variant="gold" size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Reveal Hidden Gift
              </Button>
            </div>
          </motion.div>
        );

      case 'gift':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto text-nebula-pink mb-4" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Hidden Gift
              </h2>
              <p className="text-sm text-muted-foreground">
                A special quality {petName} brings to your world
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-nebula-pink/20"
            >
              <p className="text-lg text-foreground leading-relaxed italic">
                &ldquo;{r.hiddenGift}&rdquo;
              </p>
            </motion.div>

            <div className="text-center">
              <Button onClick={advanceStage} variant="gold" size="lg">
                <Heart className="w-5 h-5 mr-2" />
                Discover Love Language
              </Button>
            </div>
          </motion.div>
        );

      case 'love':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <Heart className="w-12 h-12 mx-auto text-red-400 mb-4" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Love Language
              </h2>
              <p className="text-sm text-muted-foreground">
                How {petName} gives and receives love
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-red-400/20"
            >
              <p className="text-lg text-foreground leading-relaxed italic">
                &ldquo;{r.loveLanguage}&rdquo;
              </p>
            </motion.div>

            <div className="text-center">
              <Button onClick={advanceStage} variant="gold" size="lg">
                <Moon className="w-5 h-5 mr-2" />
                Receive Cosmic Wisdom
              </Button>
            </div>
          </motion.div>
        );

      case 'advice':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8 max-w-lg mx-auto"
          >
            <div className="text-center">
              <Moon className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Cosmic Wisdom
              </h2>
              <p className="text-sm text-muted-foreground">
                Guidance for deepening your bond
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/30 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/20"
            >
              <p className="text-lg text-foreground leading-relaxed italic">
                &ldquo;{r.cosmicAdvice}&rdquo;
              </p>
            </motion.div>

            <div className="text-center">
              <Button onClick={advanceStage} variant="gold" size="lg">
                <Eye className="w-5 h-5 mr-2" />
                View Complete Portrait
              </Button>
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-cosmic-gold via-primary to-nebula-pink p-1">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <span className="text-4xl">{signEmojis[r.sunSign] || '✨'}</span>
                </div>
              </div>
            </motion.div>
            
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                {petName}&apos;s Portrait is Complete
              </h2>
              <p className="text-muted-foreground">
                May this cosmic wisdom deepen your bond forever
              </p>
            </div>

            <Button onClick={onComplete} variant="gold" size="xl">
              <Sparkles className="w-5 h-5 mr-2" />
              View Full Report
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 30%, hsl(280 50% 30% / 0.5), transparent 60%)',
          }}
        />
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-muted/30">
          <motion.div
            className="h-full bg-gradient-to-r from-cosmic-gold to-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0.5 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            {renderStage()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
