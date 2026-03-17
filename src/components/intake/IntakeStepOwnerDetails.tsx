import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, Heart, Sparkles, ChevronDown, ChevronUp, MapPin, Loader2 } from 'lucide-react';
import { CosmicButton } from '../cosmic/CosmicButton';
import { CosmicInput } from '../cosmic/CosmicInput';

interface OwnerDetailsProps {
  ownerName: string;
  ownerBirthDate: string;
  ownerBirthTime: string;
  ownerBirthLocation: string;
  onUpdate: (data: {
    ownerName?: string;
    ownerBirthDate?: string;
    ownerBirthTime?: string;
    ownerBirthLocation?: string;
  }) => void;
  onNext: () => void;
  onSkip: () => void;
  petName: string;
}

export function IntakeStepOwnerDetails({
  ownerName,
  ownerBirthDate,
  ownerBirthTime,
  ownerBirthLocation,
  onUpdate,
  onNext,
  onSkip,
  petName,
}: OwnerDetailsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [locationResults, setLocationResults] = useState<Array<{ display_name: string; address?: { city?: string; town?: string; village?: string; country?: string; state?: string }; name?: string }>>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const locationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canProceed = ownerName.trim() && ownerBirthDate;

  // Location autocomplete
  useEffect(() => {
    if (locationTimeout.current) clearTimeout(locationTimeout.current);
    const query = ownerBirthLocation.trim();
    if (query.length < 2) { setLocationResults([]); setShowLocationResults(false); return; }
    setIsSearchingLocation(true);
    locationTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setLocationResults(data);
        setShowLocationResults(true);
      } catch { setLocationResults([]); }
      finally { setIsSearchingLocation(false); }
    }, 300);
    return () => { if (locationTimeout.current) clearTimeout(locationTimeout.current); };
  }, [ownerBirthLocation]);

  const selectLocation = (result: typeof locationResults[0]) => {
    const city = result.address?.city || result.address?.town || result.address?.village || result.name || '';
    const country = result.address?.country || '';
    const state = result.address?.state;
    let formatted: string;
    if (country === 'United States' && state && city) formatted = `${city}, ${state}, USA`;
    else if (city && country) formatted = `${city}, ${country}`;
    else formatted = result.display_name.split(',').slice(0, 3).join(',').trim();
    onUpdate({ ownerBirthLocation: formatted });
    setShowLocationResults(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#bf524a]/10 to-[#c4a265]/5 border border-[#bf524a]/20"
        >
          <Heart className="w-4 h-4 text-[#bf524a]" />
          <span className="text-sm font-medium text-[#bf524a]">Pet-Parent Soul Bond</span>
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground">
          Your Cosmic Bond with {petName}
        </h2>
        <p className="text-foreground/70">
          Share your birth details and we'll reveal the invisible thread that connects your souls
        </p>
      </div>

      {/* Privacy Badge - Prominent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-gradient-to-br from-[#4a8c5c]/10 to-[#4a8c5c]/5 border border-[#4a8c5c]/20"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-[#4a8c5c]/15">
            <Shield className="w-5 h-5 text-[#4a8c5c]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#4a8c5c] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Your Privacy is Sacred
            </h3>
            <p className="text-sm text-foreground/70 mt-1">
              Your data is encrypted end-to-end and never shared. We use it only for your compatibility reading.
            </p>
            
            <button
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="text-xs text-[#4a8c5c] hover:text-[#4a8c5c] mt-2 flex items-center gap-1"
            >
              {showPrivacyDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showPrivacyDetails ? 'Hide details' : 'Learn more about our privacy practices'}
            </button>
            
            {showPrivacyDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 text-xs text-foreground/60 space-y-1.5 border-t border-[#4a8c5c]/15 pt-3"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-[#4a8c5c]" />
                  <span>256-bit AES encryption for all personal data</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="w-3 h-3 text-[#4a8c5c]" />
                  <span>We never sell or share your information</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-[#4a8c5c]" />
                  <span>Data is used only for your reading, then secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-[#4a8c5c]" />
                  <span>You can request deletion anytime via hello@littlesouls.app</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Input Form */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            Your Name
          </label>
          <CosmicInput
            type="text"
            value={ownerName}
            onChange={(e) => onUpdate({ ownerName: e.target.value })}
            placeholder="Enter your name"
            maxLength={50}
          />
        </div>

        {/* Birth Date - Required */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            Your Birth Date <span className="text-[#c4a265]">*</span>
          </label>
          <CosmicInput
            type="date"
            value={ownerBirthDate}
            onChange={(e) => onUpdate({ ownerBirthDate: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-foreground/80">
                Add more details for deeper insights
              </span>
            </div>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-foreground/50" />
            </motion.div>
          </div>
          <p className="text-xs text-foreground/50 mt-1 ml-6">
            Optional: birth time & location for more accurate compatibility
          </p>
        </button>

        {/* Advanced Fields */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pl-4 border-l-2 border-violet-500/30"
          >
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Birth Time (optional)
              </label>
              <CosmicInput
                type="time"
                value={ownerBirthTime}
                onChange={(e) => onUpdate({ ownerBirthTime: e.target.value })}
              />
              <p className="text-xs text-foreground/50 mt-1">
                Helps calculate your rising sign for deeper compatibility
              </p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Birth City (optional)
              </label>
              <div className="relative">
                <CosmicInput
                  type="text"
                  value={ownerBirthLocation}
                  onChange={(e) => onUpdate({ ownerBirthLocation: e.target.value })}
                  placeholder="Start typing a city..."
                  maxLength={100}
                  onFocus={() => { if (ownerBirthLocation.length >= 2) setShowLocationResults(true); }}
                  onBlur={() => setTimeout(() => setShowLocationResults(false), 200)}
                />
                {isSearchingLocation && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                )}
              </div>
              <AnimatePresence>
                {showLocationResults && locationResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {locationResults.map((r, i) => (
                      <button key={i} onMouseDown={e => e.preventDefault()} onClick={() => selectLocation(r)}
                        className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0 text-sm text-foreground flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" />
                        {r.display_name.split(',').slice(0, 3).join(',')}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-xs text-foreground/50 mt-1">
                For precise planetary positions
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <CosmicButton
          onClick={onNext}
          disabled={!canProceed}
          className="w-full"
        >
          <span className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Reveal Our Soul Bond
          </span>
        </CosmicButton>

        <button
          onClick={onSkip}
          className="w-full py-3 text-sm text-foreground/60 hover:text-foreground/80 transition-colors"
        >
          Skip for now — I just want {petName}'s reading
        </button>

        <p className="text-xs text-center text-foreground/40">
          You can always add your details later from your report
        </p>
      </div>
    </motion.div>
  );
}
