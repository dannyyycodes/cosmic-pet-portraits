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
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(petData.email);
  
  const sign = petData.dateOfBirth 
    ? getSunSign(petData.dateOfBirth.getMonth() + 1, petData.dateOfBirth.getDate()) 
    : null;
  const signData = sign ? zodiacSigns[sign] : null;

  const handleCheckout = async (checkoutData: CheckoutData) => {
    setIsLoading(true);
    try {
      onReveal(checkoutData);
    } finally {
      setIsLoading(false);
    }
  };

  const elementColors: Record<string, string> = {
    Fire: 'from-orange-500 to-red-500',
    Earth: 'from-emerald-500 to-green-600',
    Air: 'from-sky-400 to-blue-500',
    Water: 'from-blue-500 to-indigo-600',
  };

  const revealInsights = [
    { icon: Star, title: 'Soul Blueprint', description: `${petData.name}'s cosmic DNA and spiritual origins` },
    { icon: Heart, title: 'Love Language', description: 'How they express and receive affection' },
    { icon: Zap, title: 'Hidden Superpower', description: 'Their secret cosmic gift waiting to be unlocked' },
    { icon: Eye, title: 'Life Purpose', description: 'Why they chose you as their human' },
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
                onChange={(e) => onUpdate({ email: e.target.value })}
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
            {/* Zodiac reveal card */}
            {sign && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-card via-card to-primary/10 p-6"
              >
                <div className="absolute inset-0 opacity-30">
                  <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${elementColors[signData?.element || 'Fire']} blur-3xl`} />
                  <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br ${elementColors[signData?.element || 'Fire']} blur-2xl`} />
                </div>

                <div className="relative z-10 text-center space-y-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${elementColors[signData?.element || 'Fire']} flex items-center justify-center shadow-xl`}
                  >
                    <span className="text-4xl">{signData?.icon || '✨'}</span>
                  </motion.div>

                  <div>
                    <p className="text-xs text-primary uppercase tracking-widest mb-2">Cosmic Identity Revealed</p>
                    <h2 className="text-3xl font-display font-bold text-foreground capitalize">
                      {petData.name} is a {sign}
                    </h2>
                    <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="capitalize">{signData?.element} Element</span>
                      <span>•</span>
                      <span>{signData?.archetype}</span>
                    </div>
                  </div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-muted-foreground italic max-w-sm mx-auto"
                  >
                    "{petData.name}'s {sign} soul carries ancient wisdom that shapes every moment of connection..."
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* What's included - teaser */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Your full reading reveals...
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {revealInsights.map((insight, index) => (
                  <motion.div
                    key={insight.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 rounded-xl bg-card/50 border border-border/50 text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <insight.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{insight.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/60">
                      <Lock className="w-3 h-3" />
                      <span>Unlock in full report</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-1 text-amber-500"
            >
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
              <span className="text-sm text-muted-foreground ml-2">12,847 pet parents love this</span>
            </motion.div>

            {/* CTA to checkout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-3 pt-2"
            >
              <Button
                onClick={() => setStage('checkout')}
                variant="gold"
                size="xl"
                className="w-full max-w-xs mx-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Unlock Full Reading
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
