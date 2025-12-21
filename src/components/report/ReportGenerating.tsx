import { motion } from 'framer-motion';
import { Sparkles, Star, Moon } from 'lucide-react';

interface ReportGeneratingProps {
  petName: string;
  sunSign?: string;
}

export function ReportGenerating({ petName, sunSign }: ReportGeneratingProps) {
  const steps = [
    { label: 'Calculating planetary positions...', delay: 0 },
    { label: `Mapping ${petName}'s natal chart...`, delay: 2 },
    { label: 'Analyzing cosmic alignments...', delay: 4 },
    { label: 'Interpreting celestial influences...', delay: 6 },
    { label: 'Crafting your personalized portrait...', delay: 8 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated stars background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Rotating cosmic ring */}
      <motion.div
        className="absolute w-80 h-80 border border-primary/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-96 h-96 border border-primary/10 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 text-center px-6 max-w-md">
        {/* Central orb */}
        <motion.div
          className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary/20 via-primary/40 to-nebula-purple/30 flex items-center justify-center shadow-2xl shadow-primary/20"
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 40px rgba(var(--primary), 0.2)',
              '0 0 80px rgba(var(--primary), 0.4)',
              '0 0 40px rgba(var(--primary), 0.2)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-12 h-12 text-primary" />
          </motion.div>
        </motion.div>

        {/* Pet name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2"
        >
          {petName}'s Cosmic Portrait
        </motion.h1>

        {sunSign && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-primary font-medium mb-8"
          >
            {sunSign} ✦
          </motion.p>
        )}

        {/* Progress steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              className="flex items-center gap-3 justify-center"
            >
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: step.delay }}
              >
                {index % 3 === 0 && <Star className="w-4 h-4 text-cosmic-gold" />}
                {index % 3 === 1 && <Moon className="w-4 h-4 text-primary" />}
                {index % 3 === 2 && <Sparkles className="w-4 h-4 text-nebula-pink" />}
              </motion.div>
              <span className="text-muted-foreground">{step.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Shimmer bar */}
        <motion.div
          className="mt-8 h-1 bg-muted/30 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-cosmic-gold to-nebula-purple"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 12, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Time notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-6 space-y-2"
        >
          <p className="text-sm text-muted-foreground">
            ✨ This may take a few moments...
          </p>
          <p className="text-xs text-muted-foreground/70">
            We're performing advanced astrological calculations using {petName}'s exact birth data to create a truly unique cosmic portrait.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
