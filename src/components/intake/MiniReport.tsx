import { motion } from 'framer-motion';
import { PetData } from './IntakeWizard';
import { getSunSign, zodiacSigns } from '@/lib/zodiac';
import { Lock, Moon, ArrowUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MiniReportProps {
  petData: PetData;
}

export function MiniReport({ petData }: MiniReportProps) {
  const dob = petData.dateOfBirth!;
  const sunSignKey = getSunSign(dob.getMonth() + 1, dob.getDate());
  const sunSign = zodiacSigns[sunSignKey];

  const lockedItems = [
    { icon: Moon, label: "Moon Sign (Emotions)", preview: "Deep emotional patterns revealed..." },
    { icon: ArrowUp, label: "Rising Sign (Personality)", preview: "How the world perceives them..." },
    { icon: Sparkles, label: "Karmic Contract", preview: "Why you found each other..." },
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
                  <span className="text-4xl">{sunSign.icon}</span>
                </div>
              </div>

              {/* Name & Sign */}
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm uppercase tracking-widest">It's confirmed</p>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  {petData.name} is a {sunSign.name}
                </h1>
                <p className="text-xl text-gold font-medium">{sunSign.archetype}</p>
              </div>

              {/* Element Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/50 border border-border/50">
                <span className="text-xl">{sunSign.elementIcon}</span>
                <span className="text-foreground/80">{sunSign.element} Element</span>
              </div>

              {/* Core Description */}
              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm uppercase tracking-widest text-primary/80 mb-3">The Core Truth</h3>
                <p className="text-foreground/80 text-lg leading-relaxed">
                  {sunSign.coreDescription}
                </p>
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
          transition={{ delay: 0.6 }}
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
              transition={{ delay: 0.8 + index * 0.1 }}
              className="relative overflow-hidden bg-card/40 border border-border/50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{item.label}</h3>
                    <p className="text-sm text-muted-foreground blur-sm select-none">
                      {item.preview}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Locked</span>
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
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4"
      >
        <div className="max-w-md mx-auto">
          <Button
            variant="gold"
            size="xl"
            className="w-full shadow-2xl shadow-gold/20"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Unlock {petData.name}'s Full Soul Portrait ($27)
          </Button>
          <p className="text-center text-xs text-muted-foreground/60 mt-3">
            Instant access • 30-page PDF • Lifetime updates
          </p>
        </div>
      </motion.div>
    </div>
  );
}
