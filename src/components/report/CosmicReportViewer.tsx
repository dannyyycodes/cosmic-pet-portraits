import { motion } from 'framer-motion';
import { Star, Heart, Sparkles, Sun, Moon, Compass, Gift, MessageCircle, Zap, Eye, Target, Flame, Wind, Droplet, Mountain, Gem, User, Users, Clock, Hash, Palette, Share2, Image as ImageIcon, Mail, Calendar, ChevronRight, Home, PartyPopper, Copy, Check, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { zodiacSigns } from '@/lib/zodiac';
import { useState, useRef } from 'react';
import { OccasionMode } from '@/lib/occasionMode';
import { CosmicPetCard, calculateCardStats } from './CosmicPetCard';
import { ViralPetCard } from './ViralPetCard';
import { BirthChartWheel } from './BirthChartWheel';
import { ReportPDFDownload } from './ReportPDFDownload';
import { SocialShareCard } from './SocialShareCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for the comprehensive report
interface ChartPlacement {
  sign: string;
  degree: number;
  symbol: string;
}

interface SectionContent {
  title: string;
  content: string;
  whyThisMatters?: string;
  practicalTip?: string;
  funFact?: string;
  interactiveChallenge?: string;
  loveLanguageType?: string;
  energyLevel?: string;
  firstImpressionPrediction?: string;
  southNode?: string;
  pastLifeHint?: string;
  growthOpportunity?: string;
  healingGift?: string;
  vulnerabilityNote?: string;
  secretDesire?: string;
  dominantElement?: string;
  balance?: Record<string, number>;
  temperamentInsight?: string;
  elementalAdvice?: string;
  harmoniousAspect?: string;
  growthAspect?: string;
  uniquePattern?: string;
  breedAstrologyBlend?: string;
  physicalPrediction?: string;
  primaryColor?: string;
  secondaryColor?: string;
  auraMeaning?: string;
  howToSense?: string;
  crystalName?: string;
  crystalColor?: string;
  crystalMeaning?: string;
  howToUse?: string;
  placement?: string;
  archetypeName?: string;
  archetypeDescription?: string;
  archetypeStory?: string;
  archetypeLesson?: string;
  mirrorQuality?: string;
  soulContract?: string;
  dailyRitual?: string;
  affirmation?: string;
}

interface ReportContent {
  chartPlacements: Record<string, ChartPlacement>;
  elementalBalance: Record<string, number>;
  dominantElement: string;
  crystal: { name: string; meaning: string; color: string };
  aura: { primary: string; secondary: string; meaning: string };
  archetype: { name: string; description: string };
  prologue: string;
  solarSoulprint: SectionContent;
  lunarHeart: SectionContent;
  cosmicCuriosity: SectionContent;
  harmonyHeartbeats: SectionContent;
  spiritOfMotion: SectionContent;
  starlitGaze: SectionContent;
  destinyCompass: SectionContent;
  gentleHealer: SectionContent;
  wildSpirit: SectionContent;
  elementalNature: SectionContent;
  celestialChoreography: SectionContent;
  earthlyExpression: SectionContent;
  luminousField: SectionContent;
  celestialGem: SectionContent;
  eternalArchetype: SectionContent;
  keepersBond: SectionContent;
  epilogue: string;
  compatibilityNotes: {
    bestPlaymates: string[];
    challengingEnergies: string[];
    humanCompatibility: string;
  };
  luckyElements: {
    luckyNumber: string;
    luckyDay: string;
    luckyColor: string;
    powerTime: string;
  };
  // Legacy support
  sunSign?: string;
  element?: string;
  modality?: string;
  nameVibration?: number;
  coreEssence?: string;
  soulMission?: string;
  hiddenGift?: string;
  loveLanguage?: string;
  cosmicAdvice?: string;
}

interface ReportData {
  petName: string;
  report: any;
  reportId: string;
}

interface CosmicReportViewerProps {
  petName: string;
  report: ReportContent;
  isPreview?: boolean;
  onUnlockFull?: () => void;
  reportId?: string;
  shareToken?: string;
  portraitUrl?: string;
  allReports?: ReportData[];
  currentIndex?: number;
  onSwitchReport?: (index: number) => void;
  onNextPet?: () => void;
  onAllComplete?: () => void;
  occasionMode?: string;
  hasActiveHoroscope?: boolean;
}

const elementColors: Record<string, string> = {
  Fire: 'from-orange-500 to-red-600',
  Earth: 'from-emerald-500 to-green-700',
  Air: 'from-sky-400 to-indigo-500',
  Water: 'from-blue-400 to-purple-600',
};

const elementIcons: Record<string, typeof Flame> = {
  Fire: Flame,
  Earth: Mountain,
  Air: Wind,
  Water: Droplet,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export function CosmicReportViewer({ petName, report, isPreview, onUnlockFull, reportId, shareToken, portraitUrl, allReports, currentIndex = 0, onSwitchReport, onNextPet, onAllComplete, occasionMode = 'discover', hasActiveHoroscope = false }: CosmicReportViewerProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);
  const [petPortraitUrl, setPetPortraitUrl] = useState<string | undefined>(portraitUrl);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const hasMultipleReports = allReports && allReports.length > 1;


  // Handle both new comprehensive format and legacy format
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Aries';
  const moonSign = report.chartPlacements?.moon?.sign || 'Cancer';
  const element = report.dominantElement || report.element || 'Fire';
  const signData = zodiacSigns[sunSign.toLowerCase() as keyof typeof zodiacSigns];
  const gradientClass = elementColors[element] || elementColors.Fire;
  const ElementIcon = elementIcons[element] || Flame;

  const scrollToSection = (sectionId: string) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  };

  const handleGeneratePortrait = async () => {
    toast.info("Portrait AI is paused for now — your uploaded photo will be used on the card.");
  };

  const handleSubscribeWeekly = async () => {
    if (!reportId) {
      toast.error('Report ID required for subscription');
      return;
    }
    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-horoscope-subscription', {
        body: { email: '', petReportId: reportId, petName },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Could not start subscription. Try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const cardStats = calculateCardStats({ ...report, petName });

  // Generate shareable link
  const getShareLink = () => {
    if (shareToken) {
      return `${window.location.origin}/report?share=${shareToken}`;
    }
    return null;
  };

  const handleCopyShareLink = async () => {
    const shareLink = getShareLink();
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      toast.success('Share link copied! Send it to friends and family.');
      setTimeout(() => setLinkCopied(false), 3000);
    } else {
      toast.error('Share link not available');
    }
  };
  const tableOfContents = [
    { id: 'chart', label: 'Birth Chart', icon: '✧' },
    { id: 'solar', label: 'Solar Soulprint', icon: '☉' },
    { id: 'lunar', label: 'Lunar Heart', icon: '☽' },
    { id: 'mercury', label: 'Cosmic Curiosity', icon: '☿' },
    { id: 'venus', label: 'Harmony & Heartbeats', icon: '♀' },
    { id: 'mars', label: 'Spirit of Motion', icon: '♂' },
    { id: 'ascendant', label: 'Starlit Gaze', icon: 'ASC' },
    { id: 'nodes', label: 'Destiny Compass', icon: '☊' },
    { id: 'chiron', label: 'Gentle Healer', icon: '⚷' },
    { id: 'lilith', label: 'Wild Spirit', icon: '⚸' },
    { id: 'elements', label: 'Elemental Nature', icon: '✦' },
    { id: 'aspects', label: 'Celestial Dance', icon: '✶' },
    { id: 'breed', label: 'Earthly Expression', icon: '🐾' },
    { id: 'aura', label: 'Luminous Field', icon: '✨' },
    { id: 'crystal', label: 'Celestial Gem', icon: '💎' },
    { id: 'archetype', label: 'Soul Archetype', icon: '👑' },
    { id: 'bond', label: "Keeper's Bond", icon: '💕' },
  ];

  // Check if this is a comprehensive report or legacy
  const isComprehensiveReport = !!report.chartPlacements;

  if (!isComprehensiveReport) {
    // Render legacy format (minimal)
    return <LegacyReportViewer petName={petName} report={report} isPreview={isPreview} onUnlockFull={onUnlockFull} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Multi-pet selector bar */}
      {hasMultipleReports && onSwitchReport && (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-muted-foreground text-sm mr-2">View Reports:</span>
              {allReports.map((r, idx) => (
                <button
                  key={r.reportId}
                  onClick={() => onSwitchReport(idx)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    idx === currentIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🐾 {r.petName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10`} />
        
        {/* Animated stars */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
          {/* Hero Portrait or Zodiac Symbol */}
          {petPortraitUrl ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative w-40 h-40 mx-auto mb-6"
            >
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientClass} blur-xl opacity-60`} />
              <img 
                src={petPortraitUrl} 
                alt={`${petName}'s cosmic portrait`}
                className="relative w-full h-full object-cover rounded-full ring-4 ring-primary/50 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-lg ring-2 ring-border">
                <span className="text-2xl">{signData?.icon || '✦'}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-2xl ring-4 ring-background/20`}
            >
              <span className="text-6xl">{signData?.icon || '✦'}</span>
            </motion.div>
          )}

          {/* Archetype title */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-primary font-medium tracking-widest uppercase text-sm mb-2"
          >
            {report.archetype?.name || 'Cosmic Soul'}
          </motion.p>

          {/* Pet name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-display font-bold text-foreground mb-4"
          >
            {petName}
          </motion.h1>

          {/* Archetype description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto"
          >
            {report.archetype?.description}
          </motion.p>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 text-sm"
          >
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50">
              <Sun className="w-4 h-4 text-cosmic-gold" />
              {sunSign} Sun
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50">
              <Moon className="w-4 h-4 text-primary" />
              {report.chartPlacements?.moon?.sign} Moon
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50">
              <Star className="w-4 h-4 text-purple-400" />
              {report.chartPlacements?.ascendant?.sign} Rising
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 border border-border/50">
              <ElementIcon className="w-4 h-4" />
              {element} Dominant
            </span>
          </motion.div>

          {/* VIP Badges - Horoscope & Portrait Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-6"
          >
            {hasActiveHoroscope && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/40 text-green-400 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Weekly Horoscopes Active
              </span>
            )}
            {petPortraitUrl && (
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/40 text-purple-400 text-sm font-medium">
                <ImageIcon className="w-4 h-4" />
                Photo Included
              </span>
            )}
          </motion.div>

          {/* Share Button */}
          {shareToken && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6"
            >
              <Button
                onClick={handleCopyShareLink}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                {linkCopied ? 'Link Copied!' : 'Share This Report'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Prologue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto px-6 py-12"
      >
        <div className="text-center space-y-4">
          <Sparkles className="w-8 h-8 text-cosmic-gold mx-auto" />
          <p className="text-lg text-muted-foreground leading-relaxed italic">
            {report.prologue}
          </p>
        </div>
      </motion.div>

      {/* Cosmic Trading Card Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-6 py-8"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
            <Share2 className="w-6 h-6 text-cosmic-gold" />
            Your Cosmic Trading Card
          </h2>
          <p className="text-muted-foreground text-sm">
            Share your pet's stats with friends and compare cosmic powers!
          </p>
        </div>

        {showCard ? (
          <div className="flex justify-center">
            <ViralPetCard
              petName={petName}
              archetype={report.archetype?.name || 'Cosmic Soul'}
              sunSign={sunSign}
              moonSign={moonSign}
              element={element}
              zodiacIcon={signData?.icon || '✦'}
              stats={cardStats}
              auraColor={report.aura?.primary || '#FFD700'}
              petPortraitUrl={petPortraitUrl}
              shareUrl={getShareLink() || undefined}
              occasionMode={occasionMode as OccasionMode}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-72 h-[420px] rounded-2xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50 flex flex-col items-center justify-center overflow-hidden">
              {/* Preview sparkles */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-cosmic-gold/50 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0.2, 1, 0.2],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10 text-center p-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cosmic-gold/20 to-primary/20 flex items-center justify-center">
                  <span className="text-4xl">{signData?.icon || '✦'}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{petName}'s Card</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Reveal your pet's cosmic stats in a shareable trading card format!
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>✨ 6 unique stat categories</p>
                  <p>🎨 Element-themed design</p>
                  <p>📱 Easy social sharing</p>
                  <p>🖼️ Optional AI portrait</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowCard(true)}
              variant="gold"
              size="lg"
              className="gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Reveal My Cosmic Card
            </Button>
          </div>
        )}
      </motion.div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-card/30 border border-border/50"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            Navigate Your Cosmic Journey
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all hover:bg-primary/10 ${
                  activeSection === item.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Birth Chart Wheel */}
      <div ref={(el) => (sectionRefs.current['chart'] = el)} className="max-w-5xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-card/50 to-card/30 border border-border/50"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center justify-center gap-2">
              <Star className="w-6 h-6 text-cosmic-gold" />
              {petName}'s Birth Chart
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              These planetary positions were calculated using precise astronomical algorithms from {petName}'s birth date. Each placement reveals a different facet of their cosmic personality.
            </p>
          </div>
          
          {/* Interactive Wheel Diagram */}
          <BirthChartWheel placements={report.chartPlacements || {}} petName={petName} />

          {/* Elemental Balance Bar */}
          <div className="mt-8 space-y-3">
            <h3 className="text-sm font-medium text-foreground text-center">Elemental Balance</h3>
            <div className="flex gap-1 h-10 rounded-lg overflow-hidden max-w-xl mx-auto">
              {Object.entries(report.elementalBalance || {}).map(([elem, percent]) => {
                const colors: Record<string, string> = {
                  Fire: 'bg-orange-500',
                  Earth: 'bg-emerald-500',
                  Air: 'bg-sky-400',
                  Water: 'bg-blue-500',
                };
                return (
                  <div
                    key={elem}
                    className={`${colors[elem]} flex items-center justify-center text-xs font-medium text-white transition-all hover:opacity-90`}
                    style={{ width: `${percent}%` }}
                  >
                    {percent > 15 && `${elem} ${percent}%`}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-12">
        {/* Solar Soulprint */}
        <ReportSection
          ref={(el) => (sectionRefs.current['solar'] = el)}
          icon={Sun}
          iconColor="text-cosmic-gold"
          section={report.solarSoulprint}
          index={0}
          locked={false}
        />

        {/* Lunar Heart */}
        <ReportSection
          ref={(el) => (sectionRefs.current['lunar'] = el)}
          icon={Moon}
          iconColor="text-primary"
          section={report.lunarHeart}
          index={1}
          locked={false}
        />

        {/* Mercury */}
        <ReportSection
          ref={(el) => (sectionRefs.current['mercury'] = el)}
          icon={MessageCircle}
          iconColor="text-sky-400"
          section={report.cosmicCuriosity}
          index={2}
          locked={isPreview}
        />

        {/* Venus */}
        <ReportSection
          ref={(el) => (sectionRefs.current['venus'] = el)}
          icon={Heart}
          iconColor="text-pink-400"
          section={report.harmonyHeartbeats}
          index={3}
          locked={isPreview}
        />

        {/* Mars */}
        <ReportSection
          ref={(el) => (sectionRefs.current['mars'] = el)}
          icon={Zap}
          iconColor="text-red-400"
          section={report.spiritOfMotion}
          index={4}
          locked={isPreview}
        />

        {/* Ascendant */}
        <ReportSection
          ref={(el) => (sectionRefs.current['ascendant'] = el)}
          icon={Eye}
          iconColor="text-purple-400"
          section={report.starlitGaze}
          index={5}
          locked={isPreview}
        />

        {/* North Node */}
        <ReportSection
          ref={(el) => (sectionRefs.current['nodes'] = el)}
          icon={Target}
          iconColor="text-emerald-400"
          section={report.destinyCompass}
          index={6}
          locked={isPreview}
        />

        {/* Chiron */}
        <ReportSection
          ref={(el) => (sectionRefs.current['chiron'] = el)}
          icon={Heart}
          iconColor="text-teal-400"
          section={report.gentleHealer}
          index={7}
          locked={isPreview}
        />

        {/* Lilith */}
        <ReportSection
          ref={(el) => (sectionRefs.current['lilith'] = el)}
          icon={Sparkles}
          iconColor="text-violet-400"
          section={report.wildSpirit}
          index={8}
          locked={isPreview}
        />

        {/* Elements */}
        <ReportSection
          ref={(el) => (sectionRefs.current['elements'] = el)}
          icon={ElementIcon}
          iconColor="text-orange-400"
          section={report.elementalNature}
          index={9}
          locked={isPreview}
        />

        {/* Aspects */}
        <ReportSection
          ref={(el) => (sectionRefs.current['aspects'] = el)}
          icon={Star}
          iconColor="text-indigo-400"
          section={report.celestialChoreography}
          index={10}
          locked={isPreview}
        />

        {/* Breed/Species */}
        <ReportSection
          ref={(el) => (sectionRefs.current['breed'] = el)}
          icon={User}
          iconColor="text-amber-400"
          section={report.earthlyExpression}
          index={11}
          locked={isPreview}
        />

        {/* Aura */}
        <div ref={(el) => (sectionRefs.current['aura'] = el)}>
          <AuraSection section={report.luminousField} aura={report.aura} index={12} locked={isPreview} />
        </div>

        {/* Crystal */}
        <div ref={(el) => (sectionRefs.current['crystal'] = el)}>
          <CrystalSection section={report.celestialGem} crystal={report.crystal} index={13} locked={isPreview} />
        </div>

        {/* Archetype */}
        <div ref={(el) => (sectionRefs.current['archetype'] = el)}>
          <ArchetypeSection section={report.eternalArchetype} archetype={report.archetype} index={14} locked={isPreview} />
        </div>

        {/* Keeper's Bond */}
        <ReportSection
          ref={(el) => (sectionRefs.current['bond'] = el)}
          icon={Users}
          iconColor="text-rose-400"
          section={report.keepersBond}
          index={15}
          locked={isPreview}
        />

        {/* Lucky Elements */}
        {!isPreview && report.luckyElements && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-gradient-to-br from-cosmic-gold/10 to-primary/10 border border-cosmic-gold/30"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cosmic-gold" />
              Lucky Elements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Hash className="w-6 h-6 mx-auto text-cosmic-gold mb-1" />
                <div className="text-sm text-muted-foreground">Lucky Number</div>
                <div className="font-bold text-foreground">{report.luckyElements.luckyNumber}</div>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto text-cosmic-gold mb-1" />
                <div className="text-sm text-muted-foreground">Lucky Day</div>
                <div className="font-bold text-foreground">{report.luckyElements.luckyDay}</div>
              </div>
              <div className="text-center">
                <Palette className="w-6 h-6 mx-auto text-cosmic-gold mb-1" />
                <div className="text-sm text-muted-foreground">Lucky Color</div>
                <div className="font-bold text-foreground" style={{ color: report.luckyElements.luckyColor }}>
                  ● {report.luckyElements.luckyColor}
                </div>
              </div>
              <div className="text-center">
                <Zap className="w-6 h-6 mx-auto text-cosmic-gold mb-1" />
                <div className="text-sm text-muted-foreground">Power Time</div>
                <div className="font-bold text-foreground">{report.luckyElements.powerTime}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Compatibility Notes */}
        {!isPreview && report.compatibilityNotes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl bg-card/40 border border-border/50"
          >
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Compatibility Notes
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Best Playmate Matches</h3>
                <div className="flex gap-2 flex-wrap">
                  {report.compatibilityNotes.bestPlaymates?.map((sign) => (
                    <span key={sign} className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                      {sign}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">May Need Extra Patience</h3>
                <div className="flex gap-2 flex-wrap">
                  {report.compatibilityNotes.challengingEnergies?.map((sign) => (
                    <span key={sign} className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 text-sm">
                      {sign}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{report.compatibilityNotes.humanCompatibility}</p>
            </div>
          </motion.div>
        )}

        {/* Unlock CTA for preview */}
        {isPreview && onUnlockFull && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center py-12"
          >
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-cosmic-gold/10 border border-primary/30">
              <Gift className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">Unlock the Full Cosmic Portrait</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get all 18 sections including practical tips, lucky elements, compatibility insights, and your personalized keeper's bond reading.
              </p>
              <Button onClick={onUnlockFull} variant="gold" size="xl" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Unlock Full Report
              </Button>
            </div>
          </motion.div>
        )}

        {/* Share & Download Section */}
        {!isPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-12 space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">Share & Save</h2>
              <p className="text-muted-foreground">Keep and share {petName}'s cosmic profile</p>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
              <SocialShareCard
                petName={petName}
                sunSign={sunSign}
                moonSign={moonSign}
                element={element}
                archetype={report.archetype?.name || 'Cosmic Soul'}
              />
              
              <div className="flex flex-col gap-4">
                <ReportPDFDownload petName={petName} reportContent={report} />
                
                {/* Only show horoscope upsell if not already purchased */}
                {!hasActiveHoroscope && (
                  <Button
                    onClick={handleSubscribeWeekly}
                    disabled={isSubscribing}
                    className="gap-2"
                    variant="outline"
                  >
                    <Mail className="w-4 h-4" />
                    {isSubscribing ? 'Loading...' : 'Weekly Horoscopes - $4.99/mo'}
                  </Button>
                )}
                
                {hasActiveHoroscope && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    <Check className="w-4 h-4" />
                    Weekly Horoscopes Active
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Epilogue */}
        {!isPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center py-12 space-y-4"
          >
            <div className="flex justify-center gap-2">
              <Star className="w-6 h-6 text-cosmic-gold" />
              <Star className="w-8 h-8 text-primary" />
              <Star className="w-6 h-6 text-cosmic-gold" />
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed italic max-w-2xl mx-auto">
              {report.epilogue}
            </p>
          </motion.div>
        )}

        {/* Next Pet / All Complete Footer */}
        {(hasMultipleReports || onAllComplete) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pt-8 pb-4 border-t border-border/50"
          >
            <div className="text-center space-y-6">
              {hasMultipleReports && (
                <p className="text-muted-foreground">
                  Report {currentIndex + 1} of {allReports!.length} complete
                </p>
              )}
              
              {hasMultipleReports && currentIndex < allReports!.length - 1 ? (
                <div className="space-y-4">
                  <p className="text-lg text-foreground">
                    Ready to see <span className="font-semibold text-primary">{allReports![currentIndex + 1].petName}</span>&apos;s cosmic secrets?
                  </p>
                  <Button
                    onClick={onNextPet}
                    variant="cosmic"
                    size="xl"
                    className="gap-2"
                  >
                    <span>View {allReports![currentIndex + 1].petName}&apos;s Report</span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-foreground">
                    {hasMultipleReports 
                      ? "You've viewed all your cosmic pet reports! 🌟" 
                      : `${petName}'s cosmic journey awaits! 🌟`}
                  </p>
                  <Button
                    onClick={onAllComplete}
                    variant="gold"
                    size="xl"
                    className="gap-2"
                  >
                    <PartyPopper className="w-5 h-5" />
                    <span>Complete Journey</span>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Report Section Component
interface ReportSectionProps {
  icon: typeof Sun;
  iconColor: string;
  section: SectionContent;
  index: number;
  locked: boolean;
}

const ReportSection = motion(
  ({ icon: Icon, iconColor, section, index, locked, ...props }: ReportSectionProps & { ref?: React.Ref<HTMLDivElement> }) => {
    if (!section) return null;

    return (
      <motion.div
        {...props}
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={sectionVariants}
        className={`relative p-6 rounded-2xl border transition-all ${
          locked
            ? 'bg-card/20 border-border/30'
            : 'bg-card/40 border-border/50 hover:border-primary/30'
        }`}
      >
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center ${iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
        </div>

        {/* Content or locked state */}
        {locked ? (
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
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            
            {/* Why This Matters */}
            {section.whyThisMatters && (
              <div className="p-4 rounded-xl bg-muted/20 border-l-4 border-primary/50">
                <h4 className="text-sm font-semibold text-foreground mb-1">🔮 Why This Matters</h4>
                <p className="text-sm text-muted-foreground">{section.whyThisMatters}</p>
              </div>
            )}

            {/* Practical Tip */}
            {section.practicalTip && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <h4 className="text-sm font-semibold text-emerald-400 mb-1">💡 Practical Tip</h4>
                <p className="text-sm text-muted-foreground">{section.practicalTip}</p>
              </div>
            )}

            {/* Fun Fact */}
            {section.funFact && (
              <div className="p-3 rounded-lg bg-cosmic-gold/10 text-sm">
                <span className="text-cosmic-gold font-medium">✨ Fun Fact:</span>{' '}
                <span className="text-muted-foreground">{section.funFact}</span>
              </div>
            )}

            {/* Interactive Challenge */}
            {section.interactiveChallenge && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <h4 className="text-sm font-semibold text-purple-400 mb-1">🎯 Try This</h4>
                <p className="text-sm text-muted-foreground">{section.interactiveChallenge}</p>
              </div>
            )}

            {/* Special fields */}
            {section.loveLanguageType && (
              <p className="text-sm"><span className="text-pink-400 font-medium">Love Language:</span> {section.loveLanguageType}</p>
            )}
            {section.energyLevel && (
              <p className="text-sm"><span className="text-red-400 font-medium">Energy Level:</span> {section.energyLevel}</p>
            )}
            {section.firstImpressionPrediction && (
              <p className="text-sm"><span className="text-purple-400 font-medium">First Impression:</span> {section.firstImpressionPrediction}</p>
            )}
            {section.pastLifeHint && (
              <p className="text-sm italic text-muted-foreground">{section.pastLifeHint}</p>
            )}
            {section.healingGift && (
              <p className="text-sm"><span className="text-teal-400 font-medium">Healing Gift:</span> {section.healingGift}</p>
            )}
            {section.secretDesire && (
              <p className="text-sm"><span className="text-violet-400 font-medium">Secret Desire:</span> {section.secretDesire}</p>
            )}
            {section.mirrorQuality && (
              <p className="text-sm"><span className="text-rose-400 font-medium">Mirror Quality:</span> {section.mirrorQuality}</p>
            )}
            {section.soulContract && (
              <p className="text-sm"><span className="text-rose-400 font-medium">Soul Contract:</span> {section.soulContract}</p>
            )}
            {section.dailyRitual && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <h4 className="text-sm font-semibold text-rose-400 mb-1">✨ Daily Ritual</h4>
                <p className="text-sm text-muted-foreground">{section.dailyRitual}</p>
              </div>
            )}
            {section.affirmation && (
              <p className="text-center text-lg italic text-primary">"{section.affirmation}"</p>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

// Aura Section Component
function AuraSection({ section, aura, index, locked }: { section: SectionContent; aura: ReportContent['aura']; index: number; locked: boolean }) {
  if (!section) return null;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={sectionVariants}
      className={`relative p-6 rounded-2xl border ${locked ? 'bg-card/20 border-border/30' : 'bg-card/40 border-border/50'}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${aura?.primary}, ${aura?.secondary})` }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
      </div>

      {locked ? (
        <div className="relative">
          <p className="text-muted-foreground/50 blur-sm select-none">{section.content}</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Unlock full reading</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{section.content}</p>
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full" style={{ background: aura?.primary }} />
            <div className="w-12 h-12 rounded-full" style={{ background: aura?.secondary }} />
            <p className="text-sm text-muted-foreground flex-1">{aura?.meaning}</p>
          </div>
          {section.howToSense && (
            <p className="text-sm text-muted-foreground italic">{section.howToSense}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Crystal Section Component
function CrystalSection({ section, crystal, index, locked }: { section: SectionContent; crystal: ReportContent['crystal']; index: number; locked: boolean }) {
  if (!section) return null;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={sectionVariants}
      className={`relative p-6 rounded-2xl border ${locked ? 'bg-card/20 border-border/30' : 'bg-card/40 border-border/50'}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: crystal?.color }}
        >
          <Gem className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
          <p className="text-sm text-muted-foreground">{crystal?.name}</p>
        </div>
      </div>

      {locked ? (
        <div className="relative">
          <p className="text-muted-foreground/50 blur-sm select-none">{crystal?.meaning}</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Unlock full reading</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{crystal?.meaning}</p>
          {section.howToUse && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <h4 className="text-sm font-semibold text-emerald-400 mb-1">💎 How to Use</h4>
              <p className="text-sm text-muted-foreground">{section.howToUse}</p>
            </div>
          )}
          {section.placement && (
            <p className="text-sm text-muted-foreground"><span className="font-medium">Placement:</span> {section.placement}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Archetype Section Component
function ArchetypeSection({ section, archetype, index, locked }: { section: SectionContent; archetype: ReportContent['archetype']; index: number; locked: boolean }) {
  if (!section) return null;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={sectionVariants}
      className={`relative p-6 rounded-2xl bg-gradient-to-br from-cosmic-gold/10 to-primary/10 border border-cosmic-gold/30 ${locked ? 'opacity-60' : ''}`}
    >
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cosmic-gold to-primary flex items-center justify-center">
          <span className="text-4xl">👑</span>
        </div>
        <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
        <h3 className="text-xl text-cosmic-gold font-display">{archetype?.name}</h3>
        
        {locked ? (
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Unlock full reading</span>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground">{archetype?.description}</p>
            {section.archetypeStory && (
              <p className="text-muted-foreground italic">{section.archetypeStory}</p>
            )}
            {section.archetypeLesson && (
              <div className="p-4 rounded-xl bg-cosmic-gold/10 border border-cosmic-gold/20 text-left">
                <h4 className="text-sm font-semibold text-cosmic-gold mb-1">✨ Archetype Lesson</h4>
                <p className="text-sm text-muted-foreground">{section.archetypeLesson}</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// Legacy Report Viewer for backwards compatibility
function LegacyReportViewer({ petName, report, isPreview, onUnlockFull }: CosmicReportViewerProps) {
  const sunSign = report.sunSign || 'Aries';
  const element = report.element || 'Fire';
  const signData = zodiacSigns[sunSign.toLowerCase() as keyof typeof zodiacSigns];
  const gradientClass = elementColors[element] || elementColors.Fire;

  const sections = [
    { icon: Sun, title: 'Core Essence', content: report.coreEssence, color: 'text-cosmic-gold', locked: false },
    { icon: Compass, title: 'Soul Mission', content: report.soulMission, color: 'text-primary', locked: false },
    { icon: Sparkles, title: 'Hidden Gift', content: report.hiddenGift, color: 'text-nebula-pink', locked: isPreview },
    { icon: Heart, title: 'Love Language', content: report.loveLanguage, color: 'text-red-400', locked: isPreview },
    { icon: MessageCircle, title: 'Cosmic Advice', content: report.cosmicAdvice, color: 'text-emerald-400', locked: isPreview },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10`} />
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-2xl`}
          >
            <span className="text-5xl">{signData?.icon || '✦'}</span>
          </motion.div>
          <p className="text-primary font-medium tracking-widest uppercase text-sm mb-2">{typeof report.archetype === 'string' ? report.archetype : report.archetype?.name || 'Cosmic Soul'}</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">{petName}</h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-cosmic-gold" />{sunSign}</span>
            <span className="text-border">•</span>
            <span>{element} Sign</span>
            <span className="text-border">•</span>
            <span>{report.modality}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionVariants}
            className={`p-6 rounded-2xl border ${section.locked ? 'bg-card/20 border-border/30' : 'bg-card/40 border-border/50'}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center ${section.color}`}>
                <section.icon className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
            </div>
            {section.locked ? (
              <div className="relative">
                <p className="text-muted-foreground/50 blur-sm select-none">{section.content}</p>
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

        {isPreview && onUnlockFull && (
          <div className="text-center pt-8">
            <Button onClick={onUnlockFull} variant="gold" size="xl" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Unlock Full Cosmic Portrait
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
