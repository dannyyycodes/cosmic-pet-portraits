import { Button } from '@/components/ui/button';
import { PetData } from './IntakeWizard';
import { ArrowLeft, MapPin, Locate, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface IntakeStepLocationProps {
  petData: PetData;
  onUpdate: (data: Partial<PetData>) => void;
  onNext: () => void;
  onBack: () => void;
  totalSteps: number;
}

const popularLocations = [
  { city: 'New York', country: 'USA', flag: '🇺🇸' },
  { city: 'Los Angeles', country: 'USA', flag: '🇺🇸' },
  { city: 'London', country: 'UK', flag: '🇬🇧' },
  { city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
  { city: 'Toronto', country: 'Canada', flag: '🇨🇦' },
  { city: 'Paris', country: 'France', flag: '🇫🇷' },
];

export function IntakeStepLocation({ petData, onUpdate, onNext, onBack, totalSteps }: IntakeStepLocationProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const isValid = petData.location.trim() !== '';

  // Filter suggestions based on input
  const filteredSuggestions = petData.location.trim()
    ? popularLocations.filter(loc => 
        loc.city.toLowerCase().includes(petData.location.toLowerCase()) ||
        loc.country.toLowerCase().includes(petData.location.toLowerCase())
      )
    : popularLocations;

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

      // Reverse geocode using a free service
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      
      const city = data.address?.city || data.address?.town || data.address?.village || '';
      const country = data.address?.country || '';
      const locationString = city && country ? `${city}, ${country}` : city || country || 'Location found';
      
      onUpdate({ location: locationString });
      setShowSuggestions(false);
    } catch (error) {
      console.log('Could not get location');
    } finally {
      setIsLocating(false);
    }
  };

  const selectLocation = (city: string, country: string) => {
    onUpdate({ location: `${city}, ${country}` });
    setShowSuggestions(false);
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
        <p className="text-primary/80 text-sm uppercase tracking-widest">Step 6 of {totalSteps}</p>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Where was {petData.name} born?
        </h1>
        <p className="text-muted-foreground text-lg">
          Location helps us map the cosmic energies present at birth.
        </p>
      </div>

      <div className="space-y-4">
        {/* Location Input */}
        <div className="relative max-w-sm mx-auto">
          <div className={cn(
            "relative rounded-xl transition-all duration-300",
            inputFocused && "ring-2 ring-primary/30"
          )}>
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
            <input
              type="text"
              placeholder="Start typing city name..."
              value={petData.location}
              onChange={(e) => {
                onUpdate({ location: e.target.value });
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setInputFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={() => setInputFocused(false)}
              className={cn(
                "w-full h-14 pl-12 pr-4 text-lg bg-card/50 border border-border/50 rounded-xl",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:border-primary/50 transition-all"
              )}
            />
            {petData.location && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Use Current Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 mx-auto text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
        >
          <Locate className={cn("w-4 h-4", isLocating && "animate-pulse")} />
          <span className="text-sm">
            {isLocating ? 'Finding location...' : 'Use my current location'}
          </span>
        </button>

        {/* Quick Select Suggestions */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <p className="text-xs text-muted-foreground">Quick select:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {filteredSuggestions.slice(0, 6).map((loc) => (
                  <motion.button
                    key={`${loc.city}-${loc.country}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectLocation(loc.city, loc.country)}
                    className={cn(
                      "px-3 py-2 rounded-full text-sm transition-all",
                      "border border-border/50 hover:border-primary/50",
                      "bg-card/50 text-muted-foreground hover:text-foreground",
                      petData.location === `${loc.city}, ${loc.country}` && 
                        "bg-primary/20 border-primary text-foreground"
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

        {/* Don't know option */}
        <button
          onClick={() => {
            onUpdate({ location: 'Unknown' });
            setShowSuggestions(false);
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          I don't know the birthplace
        </button>
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
