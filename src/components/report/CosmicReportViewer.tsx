import { motion } from 'framer-motion';
import { Star, Heart, Sparkles, Sun, Moon, Compass, Gift, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { zodiacSigns } from '@/lib/zodiac';

interface ReportContent {
  sunSign: string;
  archetype: string;
  element: string;
  modality: string;
  nameVibration: number;
  coreEssence: string;
  soulMission: string;
  hiddenGift: string;
  loveLanguage: string;
  cosmicAdvice: string;
}

interface CosmicReportViewerProps {
  petName: string;
  report: ReportContent;
  isPreview?: boolean;
  onUnlockFull?: () => void;
}

const elementColors: Record<string, string> = {
  Fire: 'from-orange-500 to-red-600',
  Earth: 'from-emerald-500 to-green-700',
  Air: 'from-sky-400 to-indigo-500',
  Water: 'from-blue-400 to-purple-600',
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' as const },
  }),
};

export function CosmicReportViewer({ petName, report, isPreview, onUnlockFull }: CosmicReportViewerProps) {
  const signData = zodiacSigns[report.sunSign.toLowerCase() as keyof typeof zodiacSigns];
  const gradientClass = elementColors[report.element] || elementColors.Fire;

  const sections = [
    {
      icon: Sun,
      title: 'Core Essence',
      content: report.coreEssence,
      color: 'text-cosmic-gold',
      locked: false,
    },
    {
      icon: Compass,
      title: 'Soul Mission',
      content: report.soulMission,
      color: 'text-primary',
      locked: false,
    },
    {
      icon: Sparkles,
      title: 'Hidden Gift',
      content: report.hiddenGift,
      color: 'text-nebula-pink',
      locked: isPreview,
    },
    {
      icon: Heart,
      title: 'Love Language',
      content: report.loveLanguage,
      color: 'text-red-400',
      locked: isPreview,
    },
    {
      icon: MessageCircle,
      title: 'Cosmic Advice',
      content: report.cosmicAdvice,
      color: 'text-emerald-400',
      locked: isPreview,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section with zodiac */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10`} />
        
        {/* Animated particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
          {/* Zodiac symbol */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className={`w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-2xl`}
          >
            <span className="text-5xl">{signData?.icon || '✦'}</span>
          </motion.div>

          {/* Archetype title */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-primary font-medium tracking-widest uppercase text-sm mb-2"
          >
            {report.archetype}
          </motion.p>

          {/* Pet name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4"
          >
            {petName}
          </motion.h1>

          {/* Sign info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4 text-muted-foreground"
          >
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-cosmic-gold" />
              {report.sunSign}
            </span>
            <span className="text-border">•</span>
            <span>{report.element} Sign</span>
            <span className="text-border">•</span>
            <span>{report.modality}</span>
          </motion.div>

          {/* Name vibration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50"
          >
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Name Vibration:</span>
            <span className="font-bold text-foreground">{report.nameVibration}</span>
          </motion.div>
        </div>
      </div>

      {/* Report sections */}
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={sectionVariants}
            className={`relative p-6 rounded-2xl border transition-all ${
              section.locked
                ? 'bg-card/20 border-border/30'
                : 'bg-card/40 border-border/50 hover:border-primary/30'
            }`}
          >
            {/* Section header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center ${section.color}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            </div>

            {/* Content or locked state */}
            {section.locked ? (
              <div className="relative">
                <p className="text-muted-foreground/50 blur-sm select-none">
                  {section.content}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Unlock full reading</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            )}
          </motion.div>
        ))}

        {/* Unlock CTA for preview */}
        {isPreview && onUnlockFull && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center pt-8"
          >
            <Button onClick={onUnlockFull} variant="gold" size="xl" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Unlock Full Cosmic Portrait
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
