import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface IntakeStepEmailProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onReveal: () => void;
  onBack: () => void;
  totalSteps: number;
}

export function IntakeStepEmail({ petData, onUpdate, onReveal, onBack, totalSteps }: IntakeStepEmailProps) {
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(petData.email);

  return (
    <div className="space-y-8 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step {totalSteps} of {totalSteps}</p>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-4"
        >
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-500 text-sm font-medium">Analysis Complete</span>
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {petData.name}'s cosmic profile is ready
        </h1>
        <p className="text-muted-foreground text-lg">
          Where should we send the results?
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={petData.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
          />
        </div>
      </div>

      <Button
        onClick={onReveal}
        disabled={!isValidEmail}
        variant="gold"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Reveal Cosmic Profile
      </Button>

      <p className="text-xs text-muted-foreground/60">
        By continuing, you agree to receive your cosmic analysis and updates.
      </p>
    </div>
  );
}
