import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Share2, MessageCircle, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportRevealVariantCProps {
  petName: string;
  sunSign: string;
  archetype: string;
  onComplete: () => void;
}

export function ReportRevealVariantC({ petName, sunSign, archetype, onComplete }: ReportRevealVariantCProps) {
  const [stage, setStage] = useState<'tease' | 'reveal' | 'share'>('tease');
  const [emojiRain, setEmojiRain] = useState<string[]>([]);

  // Emoji rain effect
  useEffect(() => {
    const emojis = ['✨', '🌟', '💫', '⭐', '🐾', '💖', '🔮', '🌙'];
    const rain: string[] = [];
    for (let i = 0; i < 20; i++) {
      rain.push(emojis[Math.floor(Math.random() * emojis.length)]);
    }
    setEmojiRain(rain);

    const timer = setTimeout(() => setStage('reveal'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 overflow-hidden relative">
      {/* Emoji Rain */}
      {emojiRain.map((emoji, i) => (
        <motion.div
          key={i}
          initial={{ 
            y: -50, 
            x: Math.random() * window.innerWidth,
            opacity: 1,
            rotate: 0,
          }}
          animate={{ 
            y: window.innerHeight + 50,
            rotate: 360,
            opacity: [1, 1, 0],
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
          className="absolute text-2xl pointer-events-none"
        >
          {emoji}
        </motion.div>
      ))}

      <AnimatePresence mode="wait">
        {stage === 'tease' && (
          <motion.div
            key="tease"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="text-center relative z-10"
          >
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xl text-muted-foreground mb-4"
            >
              omg wait...
            </motion.p>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="text-6xl"
            >
              👀
            </motion.div>
          </motion.div>
        )}

        {stage === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="max-w-md w-full text-center relative z-10"
          >
            {/* Fun Reveal Card */}
            <motion.div
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-primary/30 rounded-3xl p-8 mb-6"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                🌟
              </motion.div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {petName} is a
              </h1>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-4"
              >
                {sunSign} {archetype}
              </motion.div>

              <p className="text-muted-foreground">
                and honestly? that explains SO much 😭💀
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground mb-6"
            >
              your group chat NEEDS to see this
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setStage('share')}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white border-none"
                size="lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                share the tea & view full reading
              </Button>
              
              <button
                onClick={onComplete}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors"
              >
                skip sharing (antisocial era, valid)
              </button>
            </motion.div>
          </motion.div>
        )}

        {stage === 'share' && (
          <motion.div
            key="share"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full text-center relative z-10"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              spread the chaos 🌪️
            </h2>
            <p className="text-muted-foreground mb-6">
              let everyone know {petName} has main character energy
            </p>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: MessageCircle, label: 'iMessage', color: 'from-green-500 to-emerald-500' },
                { icon: Instagram, label: 'Instagram', color: 'from-pink-500 to-purple-500' },
                { icon: Twitter, label: 'X / Twitter', color: 'from-gray-600 to-gray-800' },
                { icon: Share2, label: 'Copy Link', color: 'from-blue-500 to-indigo-500' },
              ].map((option, i) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${option.color} text-white flex flex-col items-center gap-2`}
                  onClick={() => {
                    // In real implementation, this would trigger share
                    onComplete();
                  }}
                >
                  <option.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Unlock Teaser */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-card/50 border border-border/50 rounded-xl p-4 mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔓</div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Share to unlock {petName}'s villain origin story
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (it's in the full reading, trust)
                  </p>
                </div>
              </div>
            </motion.div>

            <Button
              onClick={onComplete}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              just take me to the reading already
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
