import { motion } from 'framer-motion';
import { Dog, Plus, Minus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IntakeStepPetCountProps {
  petCount: number;
  onUpdate: (count: number) => void;
  onNext: () => void;
}

const pricePerPet = 35;

function getDiscount(count: number): number {
  if (count >= 3) return 0.20; // 20% off
  if (count >= 2) return 0.10; // 10% off
  return 0;
}

function calculatePrice(count: number): { total: number; savings: number; perPet: number } {
  const fullPrice = count * pricePerPet;
  const discount = getDiscount(count);
  const total = Math.round(fullPrice * (1 - discount));
  const savings = fullPrice - total;
  const perPet = total / count;
  return { total, savings, perPet };
}

export function IntakeStepPetCount({ petCount, onUpdate, onNext }: IntakeStepPetCountProps) {
  const { total, savings, perPet } = calculatePrice(petCount);
  const discount = getDiscount(petCount);

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-nebula-purple mx-auto mb-4"
        >
          <Dog className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          How many cosmic companions?
        </h1>
        <p className="text-muted-foreground text-lg">
          Get a personalized reading for each of your pets
        </p>
      </div>

      {/* Pet counter */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => onUpdate(Math.max(1, petCount - 1))}
          disabled={petCount <= 1}
          className="w-14 h-14 rounded-full border-2 border-border/50 bg-card/30 flex items-center justify-center transition-all hover:border-primary/50 hover:bg-card/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-6 h-6 text-foreground" />
        </button>
        
        <motion.div
          key={petCount}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-nebula-purple/20 border-2 border-primary/50 flex items-center justify-center"
        >
          <span className="text-5xl font-display font-bold text-foreground">{petCount}</span>
        </motion.div>
        
        <button
          onClick={() => onUpdate(Math.min(5, petCount + 1))}
          disabled={petCount >= 5}
          className="w-14 h-14 rounded-full border-2 border-border/50 bg-card/30 flex items-center justify-center transition-all hover:border-primary/50 hover:bg-card/50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Pricing display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="p-4 rounded-xl bg-card/30 border border-border/30 space-y-2">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
            <span>${total}</span>
            {savings > 0 && (
              <span className="text-sm font-normal text-muted-foreground line-through">${petCount * pricePerPet}</span>
            )}
          </div>
          
          {discount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm"
            >
              <Sparkles className="w-3 h-3" />
              You save ${savings}! ({Math.round(discount * 100)}% off)
            </motion.div>
          )}
          
          <p className="text-sm text-muted-foreground">
            {petCount === 1 ? '$35 per report' : `$${perPet.toFixed(2)} per report`}
          </p>
        </div>

        {/* Discount tiers hint */}
        {petCount === 1 && (
          <p className="text-xs text-muted-foreground">
            💡 Add more pets for discounts: 10% off 2+, 20% off 3+
          </p>
        )}
      </motion.div>

      <Button
        onClick={onNext}
        variant="cosmic"
        size="xl"
        className="w-full max-w-sm mx-auto"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        {petCount === 1 ? "Let's Begin" : `Continue with ${petCount} Pets`}
      </Button>
    </div>
  );
}
