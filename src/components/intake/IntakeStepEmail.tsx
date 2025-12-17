import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SocialProofBar } from './SocialProofBar';
import { ReportTeaser } from './ReportTeaser';
import { CheckoutPanel, CheckoutData } from './CheckoutPanel';

interface IntakeStepEmailProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onReveal: (checkoutData?: CheckoutData) => void;
  onBack: () => void;
  totalSteps: number;
  modeContent: ModeContent;
}

export function IntakeStepEmail({ petData, onUpdate, onReveal, onBack, totalSteps, modeContent }: IntakeStepEmailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(petData.email);

  const handleCheckout = async (checkoutData: CheckoutData) => {
    setIsLoading(true);
    try {
      onReveal(checkoutData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Social proof bar at top */}
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

      {/* Report teaser preview */}
      <ReportTeaser petData={petData} />

      {!showCheckout ? (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={petData.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
            />
          </div>

          <Button
            onClick={() => setShowCheckout(true)}
            disabled={!isValidEmail}
            variant="gold"
            size="xl"
            className="w-full max-w-xs mx-auto"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {modeContent.emailButton}
          </Button>
        </div>
      ) : (
        <div className="pt-2 max-w-md mx-auto">
          <CheckoutPanel
            petData={petData}
            onCheckout={handleCheckout}
            isLoading={isLoading}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground/60">
        By continuing, you agree to receive your cosmic analysis and updates.
      </p>
    </div>
  );
}
