import { motion } from 'framer-motion';
import { Lock, Sparkles, Star, Heart, Zap, Eye } from 'lucide-react';
import { PetData } from './IntakeWizard';
import { getSunSign, zodiacSigns } from '@/lib/zodiac';

interface ReportTeaserProps {
  petData: PetData;
}

const elementColors: Record<string, string> = {
  Fire: 'from-orange-500 to-red-500',
  Earth: 'from-emerald-500 to-green-600',
  Air: 'from-sky-400 to-blue-500',
  Water: 'from-blue-500 to-indigo-600',
};

const modalityMap: Record<string, string> = {
  aries: 'Cardinal', taurus: 'Fixed', gemini: 'Mutable',
  cancer: 'Cardinal', leo: 'Fixed', virgo: 'Mutable',
  libra: 'Cardinal', scorpio: 'Fixed', sagittarius: 'Mutable',
  capricorn: 'Cardinal', aquarius: 'Fixed', pisces: 'Mutable',
};

export function ReportTeaser({ petData }: ReportTeaserProps) {
  const sign = petData.dateOfBirth 
    ? getSunSign(petData.dateOfBirth.getMonth() + 1, petData.dateOfBirth.getDate()) 
    : null;
  const signData = sign ? zodiacSigns[sign] : null;
  const element = signData?.element || null;
  const modality = sign ? modalityMap[sign] : null;

  const teaserSections = [
    { icon: Star, title: 'Soul Blueprint', preview: `${petData.name}'s cosmic DNA reveals...`, locked: true },
    { icon: Heart, title: 'Love Language', preview: 'How they express affection...', locked: true },
    { icon: Zap, title: 'Hidden Superpower', preview: 'Their secret cosmic gift...', locked: true },
    { icon: Eye, title: 'Life Purpose', preview: 'Why they chose you...', locked: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Zodiac preview card */}
      {sign && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${elementColors[element || 'Fire']} blur-3xl`} />
            <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gradient-to-br ${elementColors[element || 'Fire']} blur-2xl`} />
          </div>

          <div className="relative z-10 flex items-center gap-4">
          {/* Zodiac symbol */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${elementColors[element || 'Fire']} flex items-center justify-center shadow-lg`}
            >
              <span className="text-3xl text-white">{signData?.icon || '✨'}</span>
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-xs text-primary uppercase tracking-widest mb-1">Cosmic Identity Unlocked</p>
              <h3 className="text-xl font-bold text-foreground capitalize">
                {petData.name} is a {sign}
              </h3>
              <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="capitalize">{element} Element</span>
                <span>•</span>
                <span className="capitalize">{modality} Energy</span>
              </div>
            </div>

            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>

          {/* Teaser text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 mt-4 text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3"
          >
            "{petData.name}'s {sign} soul carries ancient wisdom that shapes every wag, every purr, every moment of connection..."
          </motion.p>
        </motion.div>
      )}

      {/* Locked sections preview */}
      <div className="space-y-2">
        <p className="text-xs text-center text-muted-foreground uppercase tracking-wider mb-3">
          Your Full Report Includes
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {teaserSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <section.icon className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{section.title}</span>
                </div>
                
                {/* Blurred preview */}
                <div className="relative">
                  <p className="text-xs text-muted-foreground blur-[3px] select-none">
                    {section.preview}
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-3 h-3 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Value proposition */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-2 pt-2"
      >
        <div className="flex items-center justify-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Join <strong className="text-foreground">12,847</strong> pet parents who've discovered their pet's cosmic truth
        </p>
      </motion.div>
    </motion.div>
  );
}
