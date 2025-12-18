import { motion } from 'framer-motion';
import { Lock, Sparkles, Star, Heart, Zap, Eye, Moon, Compass, Brain, Crown, Shield, Palette, BookOpen } from 'lucide-react';
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

// What they'll get - massive value stack
const reportSections = [
  { icon: BookOpen, title: 'Complete 18-Chapter Report', items: ['Sun, Moon & Rising Signs', 'Mercury & Venus Analysis', 'Mars Energy Profile'] },
  { icon: Brain, title: 'Personality Deep Dive', items: ['Core Traits Explained', 'Hidden Strengths', 'Secret Fears'] },
  { icon: Heart, title: 'Love & Bonding Guide', items: ['5 Love Languages for Pets', 'Bonding Activities', 'Communication Tips'] },
  { icon: Shield, title: 'Health & Wellness', items: ['Stress Triggers', 'Calming Techniques', 'Energy Management'] },
  { icon: Compass, title: 'Practical Tips', items: ['Training Approaches', 'Diet Recommendations', 'Exercise Needs'] },
  { icon: Palette, title: 'Fun Extras', items: ['Lucky Colors & Numbers', 'Crystal Recommendations', 'Compatible Pet Signs'] },
];

const lockedPreviews = [
  { icon: Moon, title: 'Moon Sign Analysis', preview: `Emotional patterns & inner world...` },
  { icon: Compass, title: 'Rising Sign Profile', preview: `How the world perceives them...` },
  { icon: Star, title: 'Full Soul Contract', preview: `Why you were destined to meet...` },
  { icon: Zap, title: 'Hidden Superpower', preview: `Their secret cosmic gift...` },
];

export function ReportTeaser({ petData }: ReportTeaserProps) {
  const sign = petData.dateOfBirth 
    ? getSunSign(petData.dateOfBirth.getMonth() + 1, petData.dateOfBirth.getDate()) 
    : null;
  const signData = sign ? zodiacSigns[sign] : null;
  const element = signData?.element || null;
  const modality = sign ? modalityMap[sign] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Zodiac preview card - Main reveal */}
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
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${elementColors[element || 'Fire']} flex items-center justify-center shadow-lg`}
            >
              <span className="text-4xl text-white">{signData?.icon || '✨'}</span>
            </motion.div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-xs text-primary uppercase tracking-widest mb-1">✨ Cosmic Identity Unlocked</p>
              <h3 className="text-2xl font-bold text-foreground capitalize">
                {petData.name} is a {sign}
              </h3>
              <div className="flex gap-3 mt-1.5 text-sm text-muted-foreground">
                <span className="capitalize">{element} Element</span>
                <span>•</span>
                <span className="capitalize">{modality} Energy</span>
              </div>
            </div>

            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>

          {/* Teaser insight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 mt-4 p-4 rounded-xl bg-background/50 border border-primary/20"
          >
            <p className="text-sm text-foreground/90 italic">
              "{petData.name}'s {sign} soul carries {element?.toLowerCase()} energy that shapes their every interaction. 
              Your full report reveals exactly how this manifests in their personality, relationships, and daily life..."
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Value Stack - What's included */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-center">
          <Crown className="w-4 h-4 text-cosmic-gold" />
          <p className="text-sm font-medium text-foreground">Your Report Includes</p>
          <Crown className="w-4 h-4 text-cosmic-gold" />
        </div>
        
        <div className="grid gap-3">
          {reportSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="p-3 rounded-xl bg-card/40 border border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">{section.title}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {section.items.map((item, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Locked sections preview */}
      <div className="space-y-2">
        <p className="text-xs text-center text-muted-foreground uppercase tracking-wider mb-3">
          🔒 Unlock These Cosmic Secrets
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {lockedPreviews.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
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

      {/* Social Proof */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-3 pt-2"
      >
        <div className="flex items-center justify-center gap-1 text-amber-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-current" />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Join <strong className="text-foreground">12,847</strong> pet parents who've discovered their pet's cosmic truth
        </p>
        
        {/* Sample testimonial */}
        <div className="p-3 rounded-xl bg-card/30 border border-border/30 text-left">
          <p className="text-xs text-foreground/80 italic">
            "I was skeptical but WOW. It explained why my cat does that weird thing at 3am. 
            Mind = blown 🤯"
          </p>
          <p className="text-xs text-muted-foreground mt-1">— Sarah M., Cat Mom</p>
        </div>
      </motion.div>
    </motion.div>
  );
}