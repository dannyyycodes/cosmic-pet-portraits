import { motion } from 'framer-motion';
import { PetData, CosmicReport } from './IntakeWizard';
import { Lock, Sparkles, Star, Heart, Users, ChevronRight, Gift, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPossessive } from '@/lib/pronouns';
import type { PetGender } from '@/lib/pronouns';

interface MiniReportProps {
  petData: PetData;
  cosmicReport: CosmicReport | null;
}

const zodiacIcons: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const elementEmoji: Record<string, string> = {
  Fire: '🔥', Earth: '🌍', Air: '💨', Water: '💧',
};

export function MiniReport({ petData, cosmicReport }: MiniReportProps) {
  if (!cosmicReport) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const { sunSign, archetype, element, nameVibration, coreEssence } = cosmicReport;
  const pronoun = getPossessive((petData.gender || '') as PetGender);
  const displayPronoun = pronoun;
  const subjectPronoun = petData.gender === 'boy' ? 'he' : 'she';

  // Calculate a "compatibility score" for teaser
  const compatScore = Math.floor(78 + (nameVibration * 2));

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Hero - The Big Reveal */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background to-background" />
        
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-10 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Instant credibility */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground mb-4"
            >
              ✓ Analysis complete
            </motion.p>

            {/* THE BIG REVEAL - Pattern interrupt */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-primary/30 rounded-3xl p-6 mb-6 shadow-2xl shadow-primary/10"
            >
              {/* Zodiac badge */}
              <div className="relative mx-auto w-20 h-20 mb-4">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-gold/40 blur-xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg">
                  <span className="text-3xl">{zodiacIcons[sunSign] || '⭐'}</span>
                </div>
              </div>

              {/* The reveal */}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
                {petData.name} is a {sunSign}
              </h1>
              <p className="text-gold font-medium text-lg mb-3">{archetype}</p>
              
              {/* Element tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/60 border border-border/50 text-sm">
                <span>{elementEmoji[element] || '✨'}</span>
                <span className="text-foreground/80">{element} Soul</span>
              </div>
            </motion.div>

            {/* Core insight - hooks them */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/50 border border-border/40 rounded-2xl p-5 mb-6 text-left"
            >
              <p className="text-xs text-primary uppercase tracking-wider font-medium mb-2">
                ✨ What this means
              </p>
              <p className="text-foreground/90 leading-relaxed">
                {coreEssence}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* COMPATIBILITY HOOK - High-value preview */}
      <div className="max-w-lg mx-auto px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-pink-500/10 via-card/60 to-violet-500/10 border border-pink-500/30 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-pink-500/20 rounded-full text-[10px] text-pink-400 font-semibold">
            NEW
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{compatScore}%</span>
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-pink-400/50"
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-pink-400" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">You & {petData.name}</p>
              </div>
              <p className="text-base font-semibold text-foreground">Cosmic Compatibility</p>
              <p className="text-xs text-muted-foreground mt-0.5">See why your souls connected...</p>
            </div>
            <Lock className="w-5 h-5 text-muted-foreground/50" />
          </div>
        </motion.div>
      </div>

      {/* URGENCY + SCARCITY - What they're missing */}
      <div className="max-w-lg mx-auto px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-2xl p-5"
        >
          <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-amber-500">⚠️</span> You're only seeing 10%
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Why {subjectPronoun} does <span className="italic">that thing</span></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>What {subjectPronoun} needs but can't tell you</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Your compatibility breakdown (pet + owner)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>{displayPronoun.charAt(0).toUpperCase() + displayPronoun.slice(1)} emotional triggers decoded</span>
            </div>
          </div>
          
          {/* Progress visual */}
          <div className="mt-4 pt-3 border-t border-amber-500/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">You've unlocked:</span>
              <span className="text-amber-500 font-medium">4 of 30+ insights</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className="w-[13%] h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* SOCIAL PROOF - Quick hits */}
      <div className="max-w-lg mx-auto px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-2 text-center"
        >
          <div className="bg-card/40 border border-border/30 rounded-xl p-3">
            <p className="text-lg font-bold text-primary">12k+</p>
            <p className="text-[10px] text-muted-foreground">Pet owners</p>
          </div>
          <div className="bg-card/40 border border-border/30 rounded-xl p-3">
            <p className="text-lg font-bold text-gold">4.9★</p>
            <p className="text-[10px] text-muted-foreground">Rating</p>
          </div>
          <div className="bg-card/40 border border-border/30 rounded-xl p-3">
            <p className="text-lg font-bold text-foreground">97%</p>
            <p className="text-[10px] text-muted-foreground">Recommend</p>
          </div>
        </motion.div>
      </div>

      {/* BLURRED PREVIEW - Creates desire */}
      <div className="max-w-lg mx-auto px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-card/50 border border-border/40 rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-gold/20 rounded-full text-[10px] text-gold font-medium">
            SNEAK PEEK
          </div>
          
          <p className="text-xs text-primary uppercase tracking-wider font-medium mb-2">
            From {petData.name}'s Full Reading
          </p>
          
          <div className="relative">
            <p className="text-foreground/80 text-sm leading-relaxed blur-[4px] select-none">
              "When the moon enters {displayPronoun} opposite sign, {petData.name} may feel restless. 
              This is when {subjectPronoun} needs extra comfort. During these times, {subjectPronoun} seeks 
              dark, quiet spaces to process cosmic downloads. Your job is to..."
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary rounded-full text-primary-foreground text-sm font-medium shadow-lg">
                <Lock className="w-4 h-4" />
                <span>Unlock Full Reading</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* VALUE STACK - Quick benefits */}
      <div className="max-w-lg mx-auto px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/30">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-foreground">30+ personalized insights</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/30">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-foreground">Owner-pet compatibility score</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/30">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-foreground">Emotional needs decoded</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-card/30 rounded-xl border border-border/30">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm text-foreground">Beautiful PDF to keep forever</span>
          </div>
        </motion.div>
      </div>

      {/* RISK REVERSAL - Trust signals */}
      <div className="max-w-lg mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="flex items-center justify-center gap-4 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-green-500" />
            <span>7-day guarantee</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>Instant delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-gold" />
            <span>Giftable</span>
          </div>
        </motion.div>
      </div>

      {/* STICKY CTA - Always visible */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.9 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-transparent pt-6 pb-6 px-4"
      >
        <div className="max-w-md mx-auto">
          <Button
            variant="gold"
            size="xl"
            className="w-full shadow-2xl shadow-gold/30"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            See {petData.name}'s Full Reading
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <p className="text-center text-xs text-muted-foreground/70 mt-2">
            From $35 • Instant access • No subscription
          </p>
        </div>
      </motion.div>
    </div>
  );
}