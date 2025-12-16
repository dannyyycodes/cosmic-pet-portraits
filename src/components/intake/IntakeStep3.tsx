import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface IntakeStep3Props {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onReveal: () => void;
  onBack: () => void;
}

export function IntakeStep3({ petData, onUpdate, onReveal, onBack }: IntakeStep3Props) {
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 3 of 3</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Where should we send the cosmic analysis?
        </h1>
        <p className="text-muted-foreground text-lg">
          We'll deliver {petData.name}'s soul reading to your inbox.
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
        Reveal Cosmic Soul
      </Button>

      <p className="text-xs text-muted-foreground/60">
        By continuing, you agree to receive your cosmic analysis and updates.
      </p>
    </div>
  );
}
