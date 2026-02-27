import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Camera, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PetPhotoUpload } from './PetPhotoUpload';
import { getPossessive, PetGender } from '@/lib/pronouns';

interface IntakeStepPhotoProps {
  petName: string;
  petGender?: PetGender;
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  isRequired?: boolean;
}

export function IntakeStepPhoto({
  petName,
  petGender = '',
  photoUrl,
  onPhotoChange,
  onNext,
  onBack,
  onSkip,
  isRequired = false,
}: IntakeStepPhotoProps) {
  const pronoun = getPossessive(petGender);
  const canProceed = !isRequired || photoUrl;

  return (
    <div className="space-y-6 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nebula-purple/20 border border-nebula-purple/30"
      >
        <Camera className="w-4 h-4 text-nebula-purple" />
        <span className="text-nebula-purple text-sm font-medium">✨ Cosmic Soul Reading Included!</span>
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          Upload {petName}'s Photo
        </h1>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Your gift includes a <span className="text-primary font-medium">magical cosmic portrait</span>! 
          Upload a photo and we'll transform {pronoun} into an amazing trading card.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-sm mx-auto"
      >
        <PetPhotoUpload
          petName={petName}
          photoUrl={photoUrl}
          onPhotoUploaded={onPhotoChange}
          isRequired={isRequired}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-gradient-to-br from-nebula-purple/10 to-nebula-pink/10 border border-nebula-purple/20 max-w-sm mx-auto"
      >
        <div className="flex items-start gap-3">
          <Wand2 className="w-5 h-5 text-nebula-purple mt-0.5 shrink-0" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">✨ Magic Preview</p>
            <p className="text-xs text-muted-foreground mt-1">
              Our cosmic magic will transform {pronoun} photo into a stunning trading card with zodiac elements and celestial styling!
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3 pt-4">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          variant="gold"
          size="xl"
          className="w-full max-w-xs mx-auto"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {photoUrl ? 'Continue with Photo' : 'Continue'}
        </Button>

        {!isRequired && !photoUrl && onSkip && (
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now — I'll add a photo later
          </button>
        )}
      </div>
    </div>
  );
}
