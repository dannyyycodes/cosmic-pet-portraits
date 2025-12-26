import { motion } from 'framer-motion';
import { PetData, CosmicReport } from './IntakeWizard';
import { Lock, Sparkles, Star, ChevronRight, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPossessive, getPronoun } from '@/lib/pronouns';
import type { PetGender } from '@/lib/pronouns';

interface MiniReportProps {
  petData: PetData;
  cosmicReport: CosmicReport | null;
}

const zodiacIcons: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export function MiniReport({ petData, cosmicReport }: MiniReportProps) {
  if (!cosmicReport) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Reading the stars...</div>
      </div>
    );
  }

  const { sunSign, archetype, element, nameVibration, coreEssence } = cosmicReport;
  const possessive = getPossessive((petData.gender || '') as PetGender);
  const subject = getPronoun((petData.gender || '') as PetGender, 'subject');
  const compatScore = Math.floor(78 + (nameVibration * 2));

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* === HERO: The Reveal === */}
      <div className="relative pt-8 pb-6 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        
        <div className="relative max-w-md mx-auto text-center">
          {/* Zodiac Symbol */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-24 h-24 mx-auto mb-5"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary via-gold to-primary flex items-center justify-center shadow-xl">
              <span className="text-4xl">{zodiacIcons[sunSign] || '⭐'}</span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              {petData.name} is a {sunSign}
            </h1>
            <p className="text-xl text-gold font-semibold">{archetype}</p>
            <p className="text-sm text-muted-foreground mt-2">{element} Element</p>
          </motion.div>
        </div>
      </div>

      {/* === CORE INSIGHT === */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/60 border border-border/50 rounded-2xl p-5"
        >
          <p className="text-foreground leading-relaxed">{coreEssence}</p>
        </motion.div>
      </div>

      {/* === HOOK: Compatibility Teaser === */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-pink-500/15 to-violet-500/15 border border-pink-500/40 rounded-2xl p-5"
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shadow-lg">
              <span className="text-xl font-bold text-white">{compatScore}%</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">You & {petData.name}</p>
              <p className="text-xs text-muted-foreground">Why your bond feels so deep...</p>
            </div>
            <Lock className="w-5 h-5 text-muted-foreground/60 shrink-0" />
          </div>
        </motion.div>
      </div>

      {/* === SCARCITY: What's Locked === */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5"
        >
          <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            This is just 10% of {possessive} reading
          </p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              `Why ${subject} does that thing`,
              `${subject === 'he' ? 'His' : 'Her'} emotional needs`,
              `Your cosmic compatibility`,
              `${subject === 'he' ? 'His' : 'Her'} hidden quirks`,
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-3 h-3 text-amber-500/70 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div className="w-[10%] h-full bg-amber-500 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* === SOCIAL PROOF === */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex justify-center gap-6 text-center"
        >
          <div>
            <p className="text-2xl font-bold text-primary">12k+</p>
            <p className="text-[10px] text-muted-foreground uppercase">Readings</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-gold">4.9</p>
            <p className="text-[10px] text-muted-foreground uppercase">★ Rating</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-foreground">97%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Love it</p>
          </div>
        </motion.div>
      </div>

      {/* === VALUE STACK === */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card/40 border border-border/40 rounded-2xl p-5"
        >
          <p className="text-xs text-primary font-medium uppercase tracking-wider mb-3">Full reading includes</p>
          <div className="space-y-2.5">
            {[
              '30+ personalized insights',
              'Owner-pet compatibility score',
              'Emotional triggers decoded',
              'Beautiful PDF keepsake',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-gold shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* === TRUST SIGNALS === */}
      <div className="max-w-md mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex justify-center gap-5 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            7-day guarantee
          </span>
          <span>•</span>
          <span>Instant delivery</span>
          <span>•</span>
          <span>No subscription</span>
        </motion.div>
      </div>

      {/* === STICKY CTA === */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4"
      >
        <div className="max-w-md mx-auto">
          <Button
            variant="gold"
            size="xl"
            className="w-full shadow-2xl shadow-gold/25 text-base"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Unlock {petData.name}'s Full Reading
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground/80 mt-2.5">
            From $35 • Instant access
          </p>
        </div>
      </motion.div>
    </div>
  );
}
