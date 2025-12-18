import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { ArrowLeft, Sparkles, CheckCircle, ChevronDown, Lock, Star, Heart, Zap, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocialProofBar } from './SocialProofBar';
import { ReportTeaser } from './ReportTeaser';
import { CheckoutPanel, CheckoutData } from './CheckoutPanel';
import { getSunSign, zodiacSigns } from '@/lib/zodiac';

interface IntakeStepEmailProps {
  petData: PetData;
  petsData?: PetData[];
  petCount?: number;
  onUpdate: (data: Partial<PetData>) => void;
  onReveal: (checkoutData?: CheckoutData) => void;
  onBack: () => void;
  totalSteps: number;
  modeContent: ModeContent;
}

export function IntakeStepEmail({ petData, petsData, petCount = 1, onUpdate, onReveal, onBack, totalSteps, modeContent }: IntakeStepEmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<'email' | 'reveal' | 'checkout'>('email');
  
  // Stricter email validation - must end with valid TLD characters only
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(petData.email.trim());
  
  // Sanitize email input - remove trailing commas, spaces, etc.
  const handleEmailChange = (value: string) => {
    const sanitized = value.trim().replace(/[,\s]+$/, '');
    onUpdate({ email: sanitized });
  };
  
  const sign = petData.dateOfBirth 
    ? getSunSign(petData.dateOfBirth.getMonth() + 1, petData.dateOfBirth.getDate()) 
    : null;
  const signData = sign ? zodiacSigns[sign] : null;

  const handleCheckout = (checkoutData: CheckoutData) => {
    // Don't manage loading state here - let IntakeWizard handle it
    onReveal(checkoutData);
  };

  const elementColors: Record<string, string> = {
    Fire: 'from-orange-500 to-red-500',
    Earth: 'from-emerald-500 to-green-600',
    Air: 'from-sky-400 to-blue-500',
    Water: 'from-blue-500 to-indigo-600',
  };

  const revealInsights = [
    { icon: Star, title: 'Soul Blueprint', description: `${petData.name}'s cosmic DNA and spiritual origins`, teaser: signData ? `As a ${signData.element} sign, ${petData.name} carries ${signData.element === 'Fire' ? 'passionate energy' : signData.element === 'Earth' ? 'grounded wisdom' : signData.element === 'Air' ? 'curious intellect' : 'deep intuition'}...` : '' },
    { icon: Heart, title: 'Love Language', description: 'How they express and receive affection', teaser: petData.soulType === 'ancient' ? 'Their ancient soul shows love through quiet presence...' : petData.soulType === 'playful' ? 'Their playful spirit shows love through joyful energy...' : 'Their unique soul expresses love in special ways...' },
    { icon: Zap, title: 'Hidden Superpower', description: 'Their secret cosmic gift waiting to be unlocked', teaser: petData.superpower ? `Their ${petData.superpower} ability runs deeper than you know...` : 'A powerful gift awaits discovery...' },
    { icon: Eye, title: 'Life Purpose', description: 'Why they chose you as their human', teaser: 'The universe brought you together for a reason...' },
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
                onClick={() => setStage('reveal')}
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

            {/* Zodiac reveal card - Enhanced */}
            {sign && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="relative overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 p-8"
              >
                <div className="absolute inset-0 opacity-30">
                  <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${elementColors[signData?.element || 'Fire']} blur-3xl`} />
                  <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br ${elementColors[signData?.element || 'Fire']} blur-2xl`} />
                </div>

                <div className="relative z-10 text-center space-y-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${elementColors[signData?.element || 'Fire']} flex items-center justify-center shadow-2xl shadow-primary/30`}
                  >
                    <span className="text-5xl">{signData?.icon || '✨'}</span>
                  </motion.div>

                  <div>
                    <p className="text-xs text-primary uppercase tracking-widest mb-2">✨ Cosmic Identity Revealed ✨</p>
                    <h2 className="text-4xl font-display font-bold text-foreground capitalize">
                      {petData.name} Is A {sign}
                    </h2>
                    <div className="flex justify-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="capitalize px-3 py-1 rounded-full bg-primary/10">{signData?.element} Element</span>
                      <span className="px-3 py-1 rounded-full bg-primary/10">{signData?.archetype}</span>
                    </div>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-foreground/80 italic max-w-sm mx-auto text-lg leading-relaxed"
                  >
                    "{petData.name}'s {sign} soul carries ancient wisdom that shapes every moment of connection..."
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* FREE Mini Reading - Real Value */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-xl bg-gradient-to-br from-cosmic-gold/10 to-amber-500/5 border border-cosmic-gold/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-cosmic-gold" />
                <h3 className="font-display font-semibold text-foreground">Your Free Mini Reading</h3>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-cosmic-gold/20 text-cosmic-gold font-medium">FREE</span>
              </div>
              
              <div className="space-y-3 text-sm">
                {signData && (
                  <>
                    <p className="text-foreground/90">
                      <span className="font-medium text-cosmic-gold">{petData.name}</span> is a <span className="font-medium">{sign}</span> — 
                      {signData.element === 'Fire' && " a passionate soul with boundless energy and natural leadership. They light up every room and inspire those around them."}
                      {signData.element === 'Earth' && " a grounded soul with deep loyalty and steady presence. They bring stability and comfort to everyone they meet."}
                      {signData.element === 'Air' && " a curious soul with quick wit and social grace. They connect easily with others and love mental stimulation."}
                      {signData.element === 'Water' && " an intuitive soul with deep emotional intelligence. They sense feelings before words are spoken."}
                    </p>
                    <p className="text-muted-foreground">
                      As {signData.archetype}, {petData.name} approaches life with a unique perspective that makes them truly one-of-a-kind...
                    </p>
                  </>
                )}
              </div>
            </motion.div>

            {/* What's included - teaser cards */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xl font-display font-semibold text-foreground text-center">
                Your full reading reveals...
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {revealInsights.map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 text-left hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <insight.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{insight.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{insight.teaser}</p>
                    <div className="flex items-center gap-1 text-xs text-primary/60">
                      <Lock className="w-3 h-3" />
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
              transition={{ delay: 0.9 }}
              className="text-center space-y-3 py-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20"
            >
              <div className="flex items-center justify-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-foreground font-medium">
                12,847 pet parents love this
              </p>
              <p className="text-xs text-muted-foreground italic px-4">
                "This explained SO much about my dog's personality. It's like someone who really knows her wrote it!" — Sarah M.
              </p>
            </motion.div>

            {/* CTA to checkout - more urgent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="space-y-3 pt-2"
            >
              <Button
                onClick={() => setStage('checkout')}
                variant="gold"
                size="xl"
                className="w-full max-w-sm mx-auto shadow-lg shadow-primary/20"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Unlock Full 18-Chapter Reading
              </Button>
              
              <button
                onClick={() => setStage('checkout')}
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <span>See pricing options</span>
                <ChevronDown className="w-4 h-4" />
              </button>
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
