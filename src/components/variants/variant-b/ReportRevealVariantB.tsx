import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Star, Sparkles, Gift, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dynamic import for canvas-confetti
const triggerConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'];

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

interface ReportRevealVariantBProps {
  petName: string;
  sunSign: string;
  archetype: string;
  onComplete: () => void;
}

export function ReportRevealVariantB({ petName, sunSign, archetype, onComplete }: ReportRevealVariantBProps) {
  const [stage, setStage] = useState<'celebration' | 'reveal' | 'upsell'>('celebration');

  // Confetti on mount
  useEffect(() => {
    triggerConfetti();

    // Auto advance after celebration
    const timer = setTimeout(() => setStage('reveal'), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <AnimatePresence mode="wait">
        {stage === 'celebration' && (
          <motion.div
            key="celebration"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-8xl mb-6"
            >
              🎉
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              CONGRATULATIONS!
            </h1>
            <p className="text-xl text-muted-foreground">
              You did it! {petName}'s cosmic reading is ready!
            </p>
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="max-w-md w-full text-center"
          >
            {/* Success Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30"
            >
              <PartyPopper className="w-12 h-12 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              🌟 {petName}'s Reading is LIVE! 🌟
            </motion.h1>

            {/* Quick Stats Preview */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-card/50 border border-border/50 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-foreground font-medium">{sunSign} Sun</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="text-foreground font-medium">{archetype}</span>
                </div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground mb-8"
            >
              Your personalized cosmic insights are waiting inside. 
              <span className="text-primary font-medium"> This reading will change how you see {petName} forever.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <Button
                onClick={() => setStage('upsell')}
                variant="cosmic"
                size="xl"
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 border-none"
              >
                <Zap className="w-5 h-5 mr-2" />
                VIEW MY READING NOW
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {stage === 'upsell' && (
          <motion.div
            key="upsell"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full"
          >
            {/* Upsell for Weekly Horoscope */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                🔮 WAIT! Double Your Insights
              </h2>
              <p className="text-muted-foreground">
                Get weekly cosmic updates for {petName} — know what each week brings!
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-purple-500/50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-foreground text-lg">Weekly Cosmic Updates</h3>
                  <p className="text-sm text-muted-foreground">Personalized for {petName}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">$4.99</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {[
                  'Weekly personalized horoscope',
                  'Best days for activities & bonding',
                  'Mood predictions & energy levels',
                  'Cancel anytime',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="text-green-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                variant="cosmic"
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                onClick={onComplete}
              >
                ADD WEEKLY UPDATES + VIEW READING
              </Button>
            </div>

            <button
              onClick={onComplete}
              className="w-full text-center text-muted-foreground text-sm hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              No thanks, just show me the reading
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
