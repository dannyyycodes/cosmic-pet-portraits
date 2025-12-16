import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PetData } from './IntakeWizard';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface IntakeStepDOBProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

export function IntakeStepDOB({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepDOBProps) {
  const isValid = petData.dateOfBirth !== null;

  return (
    <div className="space-y-8 text-center">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 5 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          When was {petData.name} born?
        </h1>
        <p className="text-muted-foreground text-lg">
          The stars remember the moment they arrived.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Date of Birth</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-14 text-lg justify-center bg-card/50 border-border/50 hover:border-primary",
                  !petData.dateOfBirth && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                {petData.dateOfBirth ? format(petData.dateOfBirth, "MMMM d, yyyy") : "Select birth date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="center">
              <Calendar
                mode="single"
                selected={petData.dateOfBirth || undefined}
                onSelect={(date) => onUpdate({ dateOfBirth: date || null })}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Time of Birth <span className="text-primary/60">(For higher accuracy)</span>
          </p>
          <Input
            type="time"
            value={petData.timeOfBirth}
            onChange={(e) => onUpdate({ timeOfBirth: e.target.value })}
            className="h-14 text-lg text-center bg-card/50 border-border/50 focus:border-primary"
          />
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        Continue ➝
      </Button>
    </div>
  );
}
