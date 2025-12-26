import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PetData } from './IntakeWizard';
import { ModeContent } from '@/lib/occasionMode';
import { CalendarIcon, ArrowLeft, Clock, Sparkles, HelpCircle } from 'lucide-react';
import { format, setMonth, setYear, subYears, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepDOBProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
  modeContent: ModeContent;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

export function IntakeStepDOB({ petData, onUpdate, onNext, onBack, totalSteps, modeContent }: IntakeStepDOBProps) {
  const { t } = useLanguage();
  const [calendarDate, setCalendarDate] = useState<Date>(petData.dateOfBirth || new Date());
  const [showTimeInput, setShowTimeInput] = useState(!!petData.timeOfBirth);
  const [useEstimate, setUseEstimate] = useState(false);
  const [estimateYears, setEstimateYears] = useState<string>('');
  const [estimateMonths, setEstimateMonths] = useState<string>('');
  
  const isValid = petData.dateOfBirth !== null;

  const months = [
    t('months.january'), t('months.february'), t('months.march'), t('months.april'),
    t('months.may'), t('months.june'), t('months.july'), t('months.august'),
    t('months.september'), t('months.october'), t('months.november'), t('months.december')
  ];

  const timePresets = [
    { label: t('intake.dob.morning'), value: '09:00', icon: '🌅' },
    { label: t('intake.dob.afternoon'), value: '14:00', icon: '☀️' },
    { label: t('intake.dob.evening'), value: '19:00', icon: '🌆' },
    { label: t('intake.dob.night'), value: '23:00', icon: '🌙' },
  ];

  useEffect(() => {
    if (useEstimate && (estimateYears || estimateMonths)) {
      const yearsNum = parseInt(estimateYears) || 0;
      const monthsNum = parseInt(estimateMonths) || 0;
      
      if (yearsNum > 0 || monthsNum > 0) {
        let estimatedDate = new Date();
        estimatedDate = subYears(estimatedDate, yearsNum);
        estimatedDate = subMonths(estimatedDate, monthsNum);
        onUpdate({ dateOfBirth: estimatedDate });
      }
    }
  }, [estimateYears, estimateMonths, useEstimate]);

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(calendarDate, parseInt(monthStr));
    setCalendarDate(newDate);
  };

  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(calendarDate, parseInt(yearStr));
    setCalendarDate(newDate);
  };

  const switchToEstimate = () => {
    setUseEstimate(true);
    onUpdate({ dateOfBirth: null });
  };

  const switchToExact = () => {
    setUseEstimate(false);
    setEstimateYears('');
    setEstimateMonths('');
    onUpdate({ dateOfBirth: null });
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
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {modeContent.dobTitle(petData.name)}
        </h1>
        <p className="text-muted-foreground text-lg">
          {modeContent.dobSubtitle}
        </p>
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={switchToExact}
          className={cn(
            "px-4 py-2 rounded-full text-sm transition-all border",
            !useEstimate
              ? "bg-primary/20 border-primary text-foreground"
              : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarIcon className="w-4 h-4 inline mr-2" />
          {t('intake.dob.knowDate')}
        </button>
        <button
          onClick={switchToEstimate}
          className={cn(
            "px-4 py-2 rounded-full text-sm transition-all border",
            useEstimate
              ? "bg-primary/20 border-primary text-foreground"
              : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <HelpCircle className="w-4 h-4 inline mr-2" />
          {t('intake.dob.estimateAge')}
        </button>
      </div>

      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {!useEstimate ? (
            <motion.div
              key="exact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {t('intake.dob.dateOfBirth')}
              </p>
              
              <div className="flex gap-3 justify-center">
                <Select
                  value={calendarDate.getMonth().toString()}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-[140px] h-12 bg-card/50 border-border/50">
                    <SelectValue placeholder={t('intake.dob.month')} />
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
                    <SelectValue placeholder={t('intake.dob.year')} />
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
                      "w-full max-w-sm mx-auto h-14 text-lg justify-center bg-card/50 border-border/50 hover:border-primary transition-all",
                      petData.dateOfBirth && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                    {petData.dateOfBirth ? (
                      <span className="text-foreground">{format(petData.dateOfBirth, "MMMM d, yyyy")}</span>
                    ) : (
                      <span className="text-muted-foreground">{t('intake.dob.tapToSelect')}</span>
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
            </motion.div>
          ) : (
            <motion.div
              key="estimate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                {t('intake.dob.howOld', { name: petData.name })}
              </p>
              
              <div className="flex gap-4 justify-center items-end">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('intake.dob.years')}</label>
                  <Select value={estimateYears} onValueChange={setEstimateYears}>
                    <SelectTrigger className="w-[100px] h-12 bg-card/50 border-border/50">
                      <SelectValue placeholder={t('intake.dob.years')} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border max-h-[200px]">
                      {Array.from({ length: 26 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i} {i === 1 ? t('intake.dob.yearSingular') : t('intake.dob.years')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t('intake.dob.months')}</label>
                  <Select value={estimateMonths} onValueChange={setEstimateMonths}>
                    <SelectTrigger className="w-[110px] h-12 bg-card/50 border-border/50">
                      <SelectValue placeholder={t('intake.dob.months')} />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i} {i === 1 ? t('intake.dob.monthSingular') : t('intake.dob.months')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {petData.dateOfBirth && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-primary/80"
                >
                  {t('intake.dob.estimatedBirth')}: ~{format(petData.dateOfBirth, "MMMM yyyy")}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!useEstimate && (
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
                <span className="text-sm">{t('intake.dob.addTimeAccuracy')}</span>
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
                  {t('intake.dob.timeOfBirth')} <span className="text-primary/60">({t('intake.dob.approximateFine')})</span>
                </p>
                
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
                
                <div className="flex items-center justify-center gap-2">
                  <span className="text-muted-foreground text-sm">{t('intake.dob.orExactTime')}:</span>
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
                  {t('intake.dob.skipTime')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        variant="cosmic"
        size="xl"
        className="w-full max-w-xs mx-auto"
      >
        {t('intake.continue')} ➝
      </Button>
    </motion.div>
  );
}