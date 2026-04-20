import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface IntakeStepMemorialDetailsProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  totalSteps: number;
  modeContent: ModeContent;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function IntakeStepMemorialDetails({
  petData,
  onUpdate,
  onNext,
  onBack,
  onSkip,
}: IntakeStepMemorialDetailsProps) {
  const [calendarDate, setCalendarDate] = useState<Date>(
    petData.passedDate || petData.dateOfBirth || new Date()
  );

  const petName = petData.name?.trim() || 'they';
  const themName = petData.name?.trim() || 'them';

  const handleMonthChange = (monthStr: string) => {
    setCalendarDate(setMonth(calendarDate, parseInt(monthStr)));
  };

  const handleYearChange = (yearStr: string) => {
    setCalendarDate(setYear(calendarDate, parseInt(yearStr)));
  };

  return (
    <motion.div
      className="space-y-8 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          A few last, gentle details
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Only share what you're ready to. These small details help us write a reading that's truly about them.
        </p>
      </div>

      <div className="space-y-8 text-left max-w-lg mx-auto">
        {/* Field 1 — Date of passing */}
        <div className="space-y-3">
          <label className="block text-base font-medium text-foreground">
            When did {petName} pass?
          </label>
          <p className="text-sm text-muted-foreground">
            This helps us send gentle anniversary remembrances each year. You can skip it.
          </p>

          <div className="flex gap-3">
            <Select
              value={calendarDate.getMonth().toString()}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-[140px] h-12 bg-card/50 border-border/50">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {months.map((month, i) => (
                  <SelectItem key={month} value={i.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={calendarDate.getFullYear().toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px] h-12 bg-card/50 border-border/50">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-14 text-base justify-center bg-card/50 border-border/50 hover:border-primary transition-all',
                  petData.passedDate && 'border-primary/50 bg-primary/5'
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                {petData.passedDate ? (
                  <span className="text-foreground">
                    {format(petData.passedDate, 'MMMM d, yyyy')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Tap to choose a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="center">
              <Calendar
                mode="single"
                month={calendarDate}
                onMonthChange={setCalendarDate}
                selected={petData.passedDate || undefined}
                onSelect={(date) => onUpdate({ passedDate: date || null })}
                disabled={(date) =>
                  date > new Date() ||
                  (petData.dateOfBirth ? date < petData.dateOfBirth : false)
                }
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Field 2 — A moment you want held */}
        <div className="space-y-3">
          <label
            htmlFor="favoriteMemory"
            className="block text-base font-medium text-foreground"
          >
            Is there one moment you want us to hold in the reading?
          </label>
          <p className="text-sm text-muted-foreground">
            A small moment only you'd remember — the spot they sat, what they did when you came home, a sound they made. Share as much or as little as you're ready to.
          </p>
          <textarea
            id="favoriteMemory"
            rows={4}
            maxLength={500}
            value={petData.favoriteMemory || ''}
            onChange={(e) => onUpdate({ favoriteMemory: e.target.value })}
            placeholder="A quiet moment, a small ritual, the way they looked at you…"
            className="w-full px-4 py-3 bg-card/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors text-foreground placeholder:text-muted-foreground/60 resize-none"
          />
          <p className="text-xs text-muted-foreground/70 text-right">
            {(petData.favoriteMemory || '').length}/500
          </p>
        </div>

        {/* Field 3 — One word that captures them */}
        <div className="space-y-3">
          <label
            htmlFor="rememberedBy"
            className="block text-base font-medium text-foreground"
          >
            If you had one word to capture {themName}, what would it be?
          </label>
          <p className="text-sm text-muted-foreground">
            A single word — their essence. "Golden light." "Gentle." "Mischief." Skip if nothing fits.
          </p>
          <input
            id="rememberedBy"
            type="text"
            maxLength={80}
            value={petData.rememberedBy || ''}
            onChange={(e) => onUpdate({ rememberedBy: e.target.value })}
            placeholder="One word, or a short phrase"
            className="w-full h-12 px-4 bg-card/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          onClick={onNext}
          variant="cosmic"
          size="xl"
          className="w-full max-w-xs"
        >
          Continue ➝
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </div>
    </motion.div>
  );
}
