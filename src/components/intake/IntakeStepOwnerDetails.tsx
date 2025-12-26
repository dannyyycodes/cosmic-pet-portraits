import { motion } from 'framer-motion';
import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Heart, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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

  const canProceed = ownerName.trim() && ownerBirthDate;

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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-pink-500/30"
        >
          <Heart className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-pink-300">Optional: Cosmic Connection</span>
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white">
          Discover Your Bond with {petName}
        </h2>
        <p className="text-white/70">
          Add your birth details to unlock personalized compatibility insights
        </p>
      </div>

      {/* Privacy Badge - Prominent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-emerald-500/20">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-300 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Your Privacy is Sacred
            </h3>
            <p className="text-sm text-white/70 mt-1">
              Your data is encrypted end-to-end and never shared. We use it only for your compatibility reading.
            </p>
            
            <button
              onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
              className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 flex items-center gap-1"
            >
              {showPrivacyDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showPrivacyDetails ? 'Hide details' : 'Learn more about our privacy practices'}
            </button>
            
            {showPrivacyDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 text-xs text-white/60 space-y-1.5 border-t border-emerald-500/20 pt-3"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-bit AES encryption for all personal data</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="w-3 h-3 text-emerald-400" />
                  <span>We never sell or share your information</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>Data is used only for your reading, then secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>You can request deletion anytime via contact@petreports.co</span>
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
          <label className="block text-sm font-medium text-white/80 mb-2">
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
          <label className="block text-sm font-medium text-white/80 mb-2">
            Your Birth Date <span className="text-pink-400">*</span>
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
              <span className="text-sm text-white/80">
                Add more details for deeper insights
              </span>
            </div>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-white/50" />
            </motion.div>
          </div>
          <p className="text-xs text-white/50 mt-1 ml-6">
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
              <label className="block text-sm font-medium text-white/70 mb-2">
                Birth Time (optional)
              </label>
              <CosmicInput
                type="time"
                value={ownerBirthTime}
                onChange={(e) => onUpdate({ ownerBirthTime: e.target.value })}
              />
              <p className="text-xs text-white/50 mt-1">
                Helps calculate your rising sign for deeper compatibility
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Birth City (optional)
              </label>
              <CosmicInput
                type="text"
                value={ownerBirthLocation}
                onChange={(e) => onUpdate({ ownerBirthLocation: e.target.value })}
                placeholder="e.g., New York, USA"
                maxLength={100}
              />
              <p className="text-xs text-white/50 mt-1">
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
            Reveal Our Cosmic Connection
          </span>
        </CosmicButton>

        <button
          onClick={onSkip}
          className="w-full py-3 text-sm text-white/60 hover:text-white/80 transition-colors"
        >
          Skip for now - I just want {petName}'s report
        </button>
        
        <p className="text-xs text-center text-white/40">
          You can always add your details later from your report
        </p>
      </div>
    </motion.div>
  );
}
