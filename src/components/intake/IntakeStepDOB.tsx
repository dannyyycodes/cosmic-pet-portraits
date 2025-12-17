import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { CalendarIcon, ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface IntakeStepDOBProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
  modeContent: ModeContent;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

const timePresets = [
  { label: 'Morning', value: '09:00', icon: '🌅' },
  { label: 'Afternoon', value: '14:00', icon: '☀️' },
  { label: 'Evening', value: '19:00', icon: '🌆' },
  { label: 'Night', value: '23:00', icon: '🌙' },
];

export function IntakeStepDOB({ petData, onUpdate, onNext, onBack, totalSteps, modeContent }: IntakeStepDOBProps) {
  const [calendarDate, setCalendarDate] = useState<Date>(petData.dateOfBirth || new Date());
  const [showTimeInput, setShowTimeInput] = useState(!!petData.timeOfBirth);
  const isValid = petData.dateOfBirth !== null;

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(calendarDate, parseInt(monthStr));
    setCalendarDate(newDate);
  };

  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(calendarDate, parseInt(yearStr));
    setCalendarDate(newDate);
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
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="space-y-3">
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 5 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {modeContent.dobTitle(petData.name)}
        </h1>
        <p className="text-muted-foreground text-lg">
          {modeContent.dobSubtitle}
        </p>
      </div>

      <div className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Date of Birth
          </p>
          
          {/* Month/Year Quick Selectors */}
          <div className="flex gap-3 justify-center">
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

          {/* Calendar */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full max-w-sm mx-auto h-14 text-lg justify-center bg-card/50 border-border/50 hover:border-primary transition-all",
                  petData.dateOfBirth && "border-primary/50 bg-primary/5"
                )}
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                {petData.dateOfBirth ? (
                  <span className="text-foreground">{format(petData.dateOfBirth, "MMMM d, yyyy")}</span>
                ) : (
                  <span className="text-muted-foreground">Tap to select day</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="center">
              <Calendar
                mode="single"
                month={calendarDate}
                onMonthChange={setCalendarDate}
                selected={petData.dateOfBirth || undefined}
                onSelect={(date) => onUpdate({ dateOfBirth: date || null })}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <AnimatePresence>
          {!showTimeInput ? (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimeInput(true)}
              className="flex items-center justify-center gap-2 text-primary/70 hover:text-primary transition-colors mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Add birth time for extra accuracy</span>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Time of Birth <span className="text-primary/60">(approximate is fine)</span>
              </p>
              
              {/* Time Presets */}
              <div className="flex flex-wrap gap-2 justify-center">
                {timePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => onUpdate({ timeOfBirth: preset.value })}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm transition-all",
                      "border border-border/50 hover:border-primary/50",
                      petData.timeOfBirth === preset.value
                        ? "bg-primary/20 border-primary text-foreground"
                        : "bg-card/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="mr-1">{preset.icon}</span>
                    {preset.label}
                  </button>
                ))}
              </div>
              
              {/* Custom Time Input */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-muted-foreground text-sm">or exact time:</span>
                <input
                  type="time"
                  value={petData.timeOfBirth}
                  onChange={(e) => onUpdate({ timeOfBirth: e.target.value })}
                  className="h-10 px-3 text-center bg-card/50 border border-border/50 rounded-lg focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <button
                onClick={() => {
                  onUpdate({ timeOfBirth: '' });
                  setShowTimeInput(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip time
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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
    </motion.div>
  );
}
