import { Button } from '@/components/ui/button';
import { PetData } from './IntakeWizard';
import { ArrowLeft, MapPin, Locate, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeStepLocationProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

interface LocationResult {
  display_name: string;
  name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    state?: string;
  };
}

const famousCities = [
  { city: 'New York', country: 'USA', flag: '🇺🇸' },
  { city: 'London', country: 'UK', flag: '🇬🇧' },
  { city: 'Paris', country: 'France', flag: '🇫🇷' },
  { city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
  { city: 'Dubai', country: 'UAE', flag: '🇦🇪' },
];

export function IntakeStepLocation({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepLocationProps) {
  const { t } = useLanguage();
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const isValid = petData.location.trim() !== '';

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    const query = petData.location.trim();
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&featuretype=city`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.log('Location search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [petData.location]);

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );
      const data = await response.json();
      
      const city = data.address?.city || data.address?.town || data.address?.village || '';
      const country = data.address?.country || '';
      const locationString = city && country ? `${city}, ${country}` : city || country || t('intake.location.locationFound');
      
      onUpdate({ location: locationString });
      setShowResults(false);
    } catch (error) {
      console.log('Could not get location');
    } finally {
      setIsLocating(false);
    }
  };

  const selectLocation = (displayName: string, result?: LocationResult) => {
    if (result?.address) {
      const city = result.address.city || result.address.town || result.address.village || result.name;
      const country = result.address.country;
      const formatted = city && country ? `${city}, ${country}` : displayName.split(',').slice(0, 2).join(',');
      onUpdate({ location: formatted });
    } else {
      onUpdate({ location: displayName });
    }
    setShowResults(false);
  };

  const selectFamousCity = (city: string, country: string) => {
    onUpdate({ location: `${city}, ${country}` });
    setShowResults(false);
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">{t('intake.step')} 6 {t('intake.of')} {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          {t('intake.location.title', { name: petData.name })}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t('intake.location.subtitle')}
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-sm mx-auto">
          <div className={cn(
            "relative rounded-xl transition-all duration-300",
            inputFocused && "ring-2 ring-primary/30"
          )}>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
            <input
              type="text"
              placeholder={t('intake.location.placeholder')}
              value={petData.location}
              onChange={(e) => {
                onUpdate({ location: e.target.value });
              }}
              onFocus={() => {
                setInputFocused(true);
                if (petData.location.length >= 2) {
                  setShowResults(true);
                }
              }}
              onBlur={() => {
                setInputFocused(false);
                setTimeout(() => setShowResults(false), 200);
              }}
              className={cn(
                "w-full h-14 pl-12 pr-12 text-lg bg-card/50 border border-border/50 rounded-xl",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:border-primary/50 transition-all"
              )}
            />
            {isSearching ? (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
            ) : petData.location && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden"
              >
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectLocation(result.display_name, result)}
                    className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span className="text-foreground text-sm truncate">
                        {result.display_name.split(',').slice(0, 3).join(',')}
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 mx-auto text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
        >
          <Locate className={cn("w-4 h-4", isLocating && "animate-pulse")} />
          <span className="text-sm">
            {isLocating ? t('intake.location.finding') : t('intake.location.useCurrent')}
          </span>
        </button>

        <AnimatePresence>
          {!petData.location && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground">{t('intake.location.quickSelect')}:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {famousCities.map((loc) => (
                  <motion.button
                    key={`${loc.city}-${loc.country}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectFamousCity(loc.city, loc.country)}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm transition-all",
                      "border border-border/50 hover:border-primary/50",
                      "bg-card/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="mr-1">{loc.flag}</span>
                    {loc.city}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => {
            onUpdate({ location: t('intake.location.unknown') });
            setShowResults(false);
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('intake.location.dontKnow')}
        </button>
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