import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Gift, Sparkles, ChevronRight, PartyPopper, Mail, Check, Star, ChevronDown, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { zodiacSigns } from '@/lib/zodiac';
import { OccasionMode } from '@/lib/occasionMode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useScrollReveal } from '@/hooks/useScrollReveal';

// Types
import type { ReportContent, ReportData, ChartPlacement, SectionContent } from './types';

// New v2 components
import { ReportMethodology } from './ReportMethodology';
import { PlanetExplainers } from './PlanetExplainers';
import { ReadingTransition } from './ReadingTransition';
import { BirthChartTable } from './BirthChartTable';
import { AuraVisual } from './AuraVisual';
import { ElementalBalance } from './ElementalBalance';
import { ReportSectionCard } from './ReportSectionCard';
import { SoulLetter } from './SoulLetter';
import { GoogleSearches } from './GoogleSearches';
import { TextMessages } from './TextMessages';
import { HumanProfile } from './HumanProfile';
import { CosmicRecipe } from './CosmicRecipe';
import { CosmicNameMeaning } from './CosmicNameMeaning';
import { CompatibilityChart } from './CompatibilityChart';
import { CosmicPlaylist } from './CosmicPlaylist';
import { DatingProfile } from './DatingProfile';
import { ShareableCard } from './ShareableCard';
import { SectionDivider } from './SectionDivider';
import { SoulSpeakFAB } from './SoulSpeakFAB';
import { SoulSpeakTeaser } from './SoulSpeakTeaser';
import { YelpReviews } from './YelpReviews';
import { CosmicAwards } from './CosmicAwards';
import { StaticPassage } from './StaticPassage';

// Re-export types for backward compatibility
export type { ReportContent, ReportData, ChartPlacement, SectionContent };

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
  species?: string;
}

// Section configuration for the 12 reading sections
const readingSections = [
  {
    key: 'solarSoulprint' as const,
    icon: '☉',
    iconClass: 'bg-amber-500/10',
    label: 'I · Solar Soulprint',
    whyBoxIcon: '☉',
    whyPrefix: 'In natal astrology, the Sun is the single most defining placement in a chart. It governs the core self, the vital force, and the essential nature that remains constant throughout life. Every behaviour, instinct, and personality trait traces back to this one position.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'lunarHeart' as const,
    icon: '☽',
    iconClass: 'bg-violet-500/10',
    label: 'II · Lunar Heart',
    whyBoxIcon: '☽',
    whyPrefix: 'Astrologers have long recognised the Moon as the most powerful influence in an animal\u2019s chart. While humans rationalise their emotions, animals live entirely through instinct and feeling \u2014 the Moon\u2019s domain. This placement reveals the emotional blueprint that governs every reaction.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'cosmicCuriosity' as const,
    icon: '☿',
    iconClass: 'bg-sky-400/10',
    label: 'III · Cosmic Curiosity',
    whyBoxIcon: '☿',
    whyPrefix: 'Mercury\u2019s position determines the precise way a soul processes and transmits information. In veterinary astrology, this placement correlates with observable communication patterns, learning speed, and the specific ways your pet tries to "speak" to you.',
    tipIcon: '💡',
    tipLabel: 'Try this',
  },
  {
    key: 'harmonyHeartbeats' as const,
    icon: '♀',
    iconClass: 'bg-pink-500/10',
    label: 'IV · Harmony & Heartbeats',
    whyBoxIcon: '♀',
    whyPrefix: 'Venus has governed love and attachment since the earliest astrological traditions. In an animal\u2019s chart, this placement is remarkably precise \u2014 it maps directly onto how they give and receive affection, what comforts them, and the specific gestures that mean "I love you."',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'spiritOfMotion' as const,
    icon: '♂',
    iconClass: 'bg-red-500/10',
    label: 'V · Spirit of Motion',
    whyBoxIcon: '♂',
    whyPrefix: 'Mars is the planet of raw physical energy and primal drive. In classical interpretation, its sign placement determines whether a creature burns energy in short intense bursts or sustains a slow, powerful momentum. This is one of the most observably accurate placements in animal charts.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'starlitGaze' as const,
    icon: '⬆',
    iconClass: 'bg-purple-500/10',
    label: 'VI · Starlit Gaze',
    whyBoxIcon: '⬆',
    whyPrefix: 'The Ascendant, or rising sign, changes every two hours \u2014 making it one of the most personalised elements of any birth chart. It shapes the immediate impression your pet makes: their posture, their energy when entering a room, and the aura others sense before knowing them.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'destinyCompass' as const,
    icon: '🧭',
    iconClass: 'bg-green-500/10',
    label: 'VII · Destiny Compass',
    whyBoxIcon: '🧭',
    whyPrefix: 'The Lunar Nodes represent the soul\u2019s evolutionary trajectory \u2014 where it has been and where it is heading. Many astrologers consider the Nodes the most spiritually significant points in a chart, revealing the deeper purpose behind this particular lifetime.',
    tipIcon: '🧭',
    tipLabel: 'Past life hint',
  },
  {
    key: 'gentleHealer' as const,
    icon: '💚',
    iconClass: 'bg-teal-500/10',
    label: 'VIII · Gentle Healer',
    whyBoxIcon: '💚',
    whyPrefix: 'Chiron, known as the Wounded Healer in astrology, occupies a unique orbital position between Saturn and Uranus. Its chart placement pinpoints the specific way your pet carries healing energy \u2014 and why certain people feel inexplicably better in their presence.',
    tipIcon: '💚',
    tipLabel: 'Healing tip',
  },
  {
    key: 'wildSpirit' as const,
    icon: '🌀',
    iconClass: 'bg-violet-600/10',
    label: 'IX · Wild Spirit',
    whyBoxIcon: '🌀',
    whyPrefix: 'Uranus, Neptune, and Pluto \u2014 the outer planets \u2014 move slowly through the zodiac, shaping generational patterns. But their house placements and aspects create deeply individual signatures: the unpredictable quirks, hidden depths, and untamed instincts unique to this soul.',
    tipIcon: '🌀',
    tipLabel: 'Wild wisdom',
  },
  {
    key: 'cosmicExpansion' as const,
    icon: '♃',
    iconClass: 'bg-yellow-500/10',
    label: 'XI · Cosmic Expansion',
    whyBoxIcon: '♃',
    whyPrefix: 'Jupiter completes its orbit every twelve years, spending roughly one year in each sign. Known as the Great Benefic since antiquity, its placement reveals where abundance, joy, and natural good fortune concentrate in your pet\u2019s life.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'cosmicLessons' as const,
    icon: '♄',
    iconClass: 'bg-slate-500/10',
    label: 'XII · Cosmic Lessons',
    whyBoxIcon: '♄',
    whyPrefix: 'Saturn, the Great Teacher, takes 29.5 years to complete its orbit. Its placement marks the areas where growth comes through patience and repetition. Far from limiting, Saturn\u2019s influence builds the quiet strength and resilience that defines character over time.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
];

// Chapter definitions
const chapters = [
  {
    number: 1, title: 'How They Came Into This World', subtitle: 'The stars were watching', icon: '✦',
    bg: 'linear-gradient(165deg, #f5efe6 0%, #ede5d8 100%)', accent: '#c4a265', textColor: '#3d2f2a',
    border: '2px solid rgba(196,162,101,0.2)', ornament: '✦',
  },
  {
    number: 2, title: 'Their Soul, Decoded', subtitle: 'Planet by planet, layer by layer', icon: '✨',
    bg: 'linear-gradient(165deg, #faf5f0 0%, #f0e8dc 100%)', accent: '#c4a265', textColor: '#3d2f2a',
    border: '2px solid rgba(196,162,101,0.15)', ornament: '☽',
  },
  {
    number: 3, title: 'The Fun Stuff', subtitle: 'Crimes, chaos, and questionable life choices', icon: '🎭',
    bg: 'linear-gradient(165deg, #faf5f0 0%, #f0e8dc 100%)', accent: '#c4a265', textColor: '#3d2f2a',
    border: '2px solid rgba(196,162,101,0.15)', ornament: '🐾',
  },
  {
    number: 4, title: 'What They\u2019re Really Thinking', subtitle: 'Spoiler: it\u2019s mostly about you', icon: '💭',
    bg: 'linear-gradient(165deg, #f5efe6 0%, #ede5d8 100%)', accent: '#c4a265', textColor: '#3d2f2a',
    border: '2px solid rgba(196,162,101,0.18)', ornament: '✦',
  },
  {
    number: 5, title: 'Why They Chose You', subtitle: 'This was never random', icon: '💕',
    bg: 'linear-gradient(165deg, #fdf5f5 0%, #f8e8e8 100%)', accent: '#c47a7a', textColor: '#3d2f2a',
    border: '2px solid rgba(196,122,122,0.15)', ornament: '♡',
  },
  {
    number: 6, title: 'The Keepsake', subtitle: 'Something to hold onto', icon: '🎁',
    bg: 'linear-gradient(165deg, #f5f0e0 0%, #ede5c8 100%)', accent: '#b8962a', textColor: '#3d2f2a',
    border: '2px solid rgba(184,150,42,0.2)', ornament: '⟡',
  },
  {
    number: 7, title: 'A Letter From Their Soul', subtitle: 'In their own words, at last', icon: '💌',
    bg: 'linear-gradient(165deg, #3d2f2a 0%, #1a1210 100%)', accent: '#c4a265', textColor: '#ffffff',
    border: '1px solid rgba(196,162,101,0.25)', ornament: '✦',
  },
];

export function CosmicReportViewer({
  petName,
  report,
  isPreview,
  onUnlockFull,
  reportId,
  shareToken,
  portraitUrl,
  allReports,
  currentIndex = 0,
  onSwitchReport,
  onNextPet,
  onAllComplete,
  occasionMode = 'discover',
  hasActiveHoroscope = false,
  species,
}: CosmicReportViewerProps) {
  const [isSubscribing, setIsSubscribing] = useState(false);

  const hasMultipleReports = allReports && allReports.length > 1;

  // Derive sign data
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Aries';
  const moonSign = report.chartPlacements?.moon?.sign || 'Cancer';
  const ascendant = report.chartPlacements?.ascendant?.sign || '';
  const element = report.dominantElement || report.element || 'Fire';
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  // Check if comprehensive report
  const isComprehensiveReport = !!report.chartPlacements;

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

  // Legacy fallback
  if (!isComprehensiveReport) {
    return (
      <LegacyReportViewer
        petName={petName}
        report={report}
        isPreview={isPreview}
        onUnlockFull={onUnlockFull}
      />
    );
  }

  // Helper: render a reading section
  const renderReadingSection = (config: typeof readingSections[number], index: number) => {
    const section = report[config.key] as SectionContent | undefined;
    if (!section) return null;

    const isLocked = isPreview && !['solarSoulprint', 'lunarHeart'].includes(config.key);

    if (isLocked) {
      return (
        <div key={config.key}>
          <LockedSectionCard label={config.label} title={section.title} icon={config.icon} iconClass={config.iconClass} />
          <SectionDivider />
        </div>
      );
    }

    return (
      <div key={config.key}>
        <ReportSectionCard
          icon={config.icon}
          iconClass={config.iconClass}
          label={config.label}
          title={section.title}
          whyText={config.whyPrefix || section.whyThisMatters}
          whyBoxIcon={config.whyBoxIcon}
          content={section.content}
          tipBox={
            section.practicalTip
              ? { icon: config.tipIcon, label: config.tipLabel, text: section.practicalTip }
              : section.pastLifeHint
              ? { icon: config.tipIcon, label: config.tipLabel, text: section.pastLifeHint }
              : section.soulContract
              ? { icon: config.tipIcon, label: config.tipLabel, text: section.soulContract }
              : undefined
          }
          funFact={section.funFact}
          variant={index % 3}
          collapsible
        />
        <SectionDivider />
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFFDF5 0%, #f5efe6 15%, #f5efe6 85%, #ede5d8 100%)' }}>
      {/* Multi-pet selector bar */}
      {hasMultipleReports && onSwitchReport && (
        <div className="sticky top-0 z-50 border-b border-[#e8ddd0]" style={{ background: 'rgba(245,239,230,0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-[520px] mx-auto px-4 py-2">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-[#9a8578] text-xs mr-1">View:</span>
              {allReports!.map((r, idx) => (
                <button
                  key={r.reportId}
                  onClick={() => onSwitchReport(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    idx === currentIndex
                      ? 'bg-[#3d2f2a] text-white'
                      : 'bg-white text-[#5a4a42] border border-[#e8ddd0] hover:border-[#c4a265]'
                  }`}
                >
                  🐾 {r.petName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CHAPTER PROGRESS BAR ═══ */}
      {!isPreview && <ChapterProgressBar chapters={chapters} petName={petName} reportId={reportId} />}

      {/* ═══ HERO SECTION ═══ */}
      <HeroSection
        petName={petName}
        sunSign={sunSign}
        moonSign={moonSign}
        ascendant={ascendant}
        element={element}
        archetype={report.archetype?.name || 'Cosmic Soul'}
        archetypeDesc={report.archetype?.description || ''}
        signIcon={signIcon}
        portraitUrl={portraitUrl}
      />

      {/* ═══ COSMIC NICKNAME ═══ */}
      {report.cosmicNickname && (
        <CosmicNickname nickname={report.cosmicNickname} />
      )}

      {/* ═══ PROLOGUE ═══ */}
      {report.prologue && (
        <PrologueSection prologue={report.prologue} petName={petName} />
      )}

      {/* ═══ TABLE OF CONTENTS ═══ */}
      {!isPreview && <TableOfContents />}

      {/* ══════════════════════════════════════════
          CHAPTER 1 — THE ARRIVAL
         ══════════════════════════════════════════ */}
      <ChapterTitle chapter={chapters[0]} />

      {/* ═══ METHODOLOGY ═══ */}
      <ReportMethodology petName={petName} />
      <SectionDivider />

      {/* ═══ FIRST MEETING ═══ */}
      {report.firstMeeting && (
        <>
          <FirstMeeting firstMeeting={report.firstMeeting} />
          <SectionDivider />
        </>
      )}

      {/* ═══ COSMIC NAME MEANING (moved here from Ch6) ═══ */}
      {report.nameMeaning && (
        <>
          <CosmicNameMeaning nameMeaning={report.nameMeaning} />
          <SectionDivider />
        </>
      )}

      {/* ══════════════════════════════════════════
          CHAPTER 2 — THE SOUL MAP
         ══════════════════════════════════════════ */}
      <ChapterTitle chapter={chapters[1]} />

      {/* ═══ BIRTH CHART TABLE ═══ */}
      <BirthChartTable chartPlacements={report.chartPlacements || {}} petName={petName} />
      <SectionDivider />

      {/* ═══ AURA VISUAL ═══ */}
      <AuraVisual aura={report.aura} sunSign={sunSign} />

      {/* ═══ LUMINOUS FIELD (detailed aura) ═══ */}
      {report.luminousField && (
        <LuminousFieldCard
          title={report.luminousField.title}
          content={report.luminousField.content}
          howToSense={report.luminousField.howToSense}
        />
      )}
      <SectionDivider />

      {/* ═══ ELEMENTAL BALANCE ═══ */}
      <ElementalBalance
        elementalBalance={report.elementalBalance || {}}
        dominantElement={element}
        petName={petName}
      />
      <SectionDivider />

      {/* ═══ READING TRANSITION (gateway into readings) ═══ */}
      <ReadingTransition petName={petName} />

      {/* ═══ PASSAGE 1: Before readings ═══ */}
      <StaticPassage
        species={species}
        lines={[
          'Every animal that shares our life',
          'carries a universe inside them.',
          '',
          'A world of feeling, instinct, and devotion',
          'that runs deeper than we can see.',
          '',
          'Astrology doesn\u2019t create these truths.',
          'It reveals them.',
          '',
          'What follows is a map of the soul',
          'you already know by heart.',
        ]}
      />

      {/* ═══ READING SECTIONS: First Half (I-VI) ═══ */}
      {readingSections.slice(0, 6).map((config, i) => renderReadingSection(config, i))}

      {/* ═══ MID-READING TRANSITION ═══ */}
      <MidReadingTransition petName={petName} />

      {/* ═══ READING SECTIONS: Second Half (VII-XII) ═══ */}
      {readingSections.slice(6).map((config, i) => renderReadingSection(config, i + 6))}

      {/* ═══ CELESTIAL CHOREOGRAPHY (planetary aspects) ═══ */}
      {report.celestialChoreography && (
        <>
          <CelestialChoreographyCard
            title={report.celestialChoreography.title}
            content={report.celestialChoreography.content}
            funFact={report.celestialChoreography.funFact}
          />
          <SectionDivider />
        </>
      )}

      {/* ═══ UNLOCK CTA (preview mode) ═══ */}
      {isPreview && onUnlockFull && (
        <div className="text-center py-12 px-6">
          <div className="max-w-[520px] mx-auto p-8 rounded-[14px] bg-white border border-[#e8ddd0]">
            <Gift className="w-12 h-12 mx-auto text-[#c4a265] mb-4" />
            <h3 className="font-dm-serif text-2xl text-[#3d2f2a] mb-2">Unlock the Full Little Souls Reading</h3>
            <p className="text-[#9a8578] text-[0.84rem] mb-6 max-w-md mx-auto">
              Get all 12 reading sections, the soul letter, trading card, fun sections, and more.
            </p>
            <Button onClick={onUnlockFull} variant="gold" size="xl" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Unlock Full Report
            </Button>
          </div>
        </div>
      )}

      {/* ═══ EVERYTHING BELOW IS FULL (NOT PREVIEW) ═══ */}
      {!isPreview && (
        <>
          {/* ═══ PET MONOLOGUE (emotional peak before lighter sections) ═══ */}
          {report.petMonologue && (
            <>
              <PetMonologue monologue={report.petMonologue} petName={petName} sunSign={sunSign} />
              {/* SoulSpeak teaser removed — keeping only floating button + end closer */}
              <SectionDivider />
            </>
          )}

          {/* ═══ PASSAGE 2: Before the fun sections ═══ */}
          <StaticPassage
            species={species}
            lines={[
              'But a soul isn\u2019t only depth and devotion.',
              '',
              'It\u2019s also mischief.',
              'It\u2019s chaos wrapped in [fur/feathers/scales].',
              '',
              'It\u2019s the bits that make you laugh',
              'until your sides hurt',
              '\u2014 and then screenshot',
              'to send to everyone you know.',
            ]}
          />

          {/* ══════════════════════════════════════════
              CHAPTER 3 — THE LIGHTER SIDE
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[2]} />

          {/* ═══ TOP 5 CRIMES ═══ */}
          {report.topFiveCrimes?.crimes && (
            <>
              <SectionLabel icon="🚨" label={`${petName}'s Criminal Record`} />
              <CrimesSection crimes={report.topFiveCrimes.crimes} />
              <SectionDivider />
            </>
          )}

          {/* ═══ MEME PERSONALITY ═══ */}
          {report.memePersonality && (
            <>
              <SectionLabel icon="😼" label={`If ${petName} Were Online`} />
              <MemePersonalityCard
                type={report.memePersonality.type}
                description={report.memePersonality.description}
              />
              <SectionDivider />
            </>
          )}

          {/* ═══ DATING PROFILE ═══ */}
          {report.datingProfile && (
            <>
              <SectionLabel icon="💘" label={`If ${petName} Was on Tinder...`} />
              <DatingProfile
                petName={petName}
                datingProfile={report.datingProfile}
                sunSign={sunSign}
                element={element}
              />
              <SectionShareHint petName={petName} section="Dating Profile" />
              <SectionDivider />
            </>
          )}

          {/* ═══ DREAM JOB ═══ */}
          {report.dreamJob && (
            <>
              <SectionLabel icon="💼" label={`If ${petName} Had a LinkedIn...`} />
              <DreamJobCard
                job={report.dreamJob.job}
                description={report.dreamJob.description}
                salary={report.dreamJob.salary}
              />
              <SectionShareHint petName={petName} section="Dream Career" />
              <SectionDivider />
            </>
          )}

          {/* ═══ VILLAIN ORIGIN STORY ═══ */}
          {report.villainOriginStory && (
            <>
              <SectionLabel icon="🦹" label={`${petName}'s Villain Origin Story`} />
              <VillainOriginStory story={report.villainOriginStory} petName={petName} />
              <SectionShareHint petName={petName} section="Villain Origin Story" />
              <SectionDivider />
            </>
          )}

          {/* ═══ QUIRK DECODER ═══ */}
          {report.quirkDecoder && (
            <>
              <SectionLabel icon="🔍" label={`Why ${petName} Does That`} />
              <QuirkDecoder quirkDecoder={report.quirkDecoder} petName={petName} />
              <SectionDivider />
            </>
          )}

          {/* ══════════════════════════════════════════
              CHAPTER 4 — THEIR SECRET WORLD
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[3]} />

          {/* ═══ GOOGLE SEARCHES ═══ */}
          <SectionLabel icon="🔎" label={`What ${petName} Googles When You're Asleep`} />
          <GoogleSearches petName={petName} report={report} />
          <SectionShareHint petName={petName} section="Google History" />
          <SectionDivider />

          {/* ═══ TEXT MESSAGES ═══ */}
          <SectionLabel icon="💬" label={`${petName}'s Text Messages to You`} />
          <TextMessages petName={petName} report={report} occasionMode={occasionMode} />
          <SectionShareHint petName={petName} section="Text Messages" />
          <SectionDivider />

          {/* ═══ HUMAN PROFILE ═══ */}
          <SectionLabel icon="📁" label={`${petName}'s File on You`} />
          <HumanProfile petName={petName} report={report} occasionMode={occasionMode} />
          <SectionDivider />

          {/* ═══ COSMIC RECIPE ═══ */}
          <SectionLabel icon="🍳" label={`${petName}'s Cosmic Treat Recipe`} />
          <CosmicRecipe petName={petName} report={report} />
          <SectionDivider />

          {/* ═══ COSMIC PLAYLIST ═══ */}
          <SectionLabel icon="🎵" label={`${petName}'s Cosmic Playlist`} />
          <CosmicPlaylist petName={petName} report={report} />
          <SectionDivider />

          {/* ═══ YELP REVIEWS ═══ */}
          <SectionLabel icon="⭐" label={`${petName}'s Yelp Reviews`} />
          <YelpReviews petName={petName} report={report} />
          <SectionDivider />

          {/* If I Could Talk — removed per design doc */}

          {/* ═══ COSMIC AWARDS ═══ */}
          <SectionLabel icon="🏆" label={`${petName}'s Award Shelf`} />
          <CosmicAwards petName={petName} report={report} />
          <SectionShareHint petName={petName} section="Awards" />
          <SectionDivider />

          {/* ═══ PASSAGE 3: Before the bond ═══ */}
          <StaticPassage lines={[
            'Of all the homes in all the world,',
            'they ended up in yours.',
            '',
            'That\u2019s not coincidence.',
            '',
            'In astrology, the bonds we form are written',
            'in the same sky that wrote our souls.',
            '',
            'They chose you before you chose them.',
            'The moment your eyes met, something older',
            'than both of you said: yes. This one.',
          ]} />

          {/* ══════════════════════════════════════════
              CHAPTER 5 — THE BOND
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[4]} />

          {/* ═══ KEEPER'S BOND ═══ */}
          {report.keepersBond && (() => {
            const kb = report.keepersBond as SectionContent;
            return (
              <>
                <div className="mx-4 my-3 max-w-[520px] sm:mx-auto">
                  <div
                    className="py-7 px-6 sm:px-7 rounded-[18px]"
                    style={{ background: '#fdf5f5' }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0 bg-rose-500/10">
                        {'\uD83D\uDC95'}
                      </div>
                      <div>
                        <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
                          Keeper&rsquo;s Bond
                        </div>
                        <h3 className="text-[1.1rem] text-[#3d2f2a] mt-0.5" style={{ fontFamily: 'DM Serif Display, serif' }}>{kb.title}</h3>
                      </div>
                    </div>

                    <div
                      className="text-[0.88rem] leading-[1.9] text-[#5a4a42]"
                      dangerouslySetInnerHTML={{ __html: (kb.content || '').replace(/\n\n/g, '<br /><br />').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '\u2022 ').replace(/\n- /g, '<br />\u2022 ') }}
                    />

                    {kb.soulContract && (
                      <div className="mt-5 p-4 rounded-[12px] bg-white/70 border-l-[3px] border-[#c4a265]">
                        <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c4a265] mb-1">
                          {'\uD83D\uDC95'} Soul contract
                        </div>
                        <p className="text-[0.84rem] text-[#5a4a42] leading-[1.65]">{kb.soulContract}</p>
                      </div>
                    )}

                    {kb.funFact && (
                      <p className="mt-4 text-[0.8rem] text-[#9a8578] italic leading-[1.65]"
                        style={{ fontFamily: 'Cormorant, serif' }}
                      >
                        {kb.funFact}
                      </p>
                    )}
                  </div>
                </div>
                {/* SoulSpeak teaser removed — keeping only floating button + end closer */}
                <SectionDivider />
              </>
            );
          })()}

          {/* ═══ PET-PARENT SOUL BOND (premium) ═══ */}
          {report.petParentSoulBond && (() => {
            const sb = report.petParentSoulBond;
            return (
              <>
                <div className="mx-4 my-3 max-w-[520px] sm:mx-auto">
                  <div
                    className="py-7 px-6 sm:px-7 rounded-[18px] relative overflow-hidden"
                    style={{ background: 'linear-gradient(165deg, #fdf5f5 0%, #faf0e8 100%)' }}
                  >
                    {/* Premium badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[0.55rem] font-bold tracking-[1.5px] uppercase"
                      style={{ background: 'linear-gradient(135deg, #c4a265, #d4b67a)', color: '#fff' }}>
                      Soul Bond
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, rgba(196,122,122,0.15), rgba(196,162,101,0.15))' }}>
                        {'\uD83D\uDC9E'}
                      </div>
                      <div>
                        <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
                          Pet-Parent Soul Bond
                        </div>
                        <h3 className="text-[1.1rem] text-[#3d2f2a] mt-0.5 pr-16" style={{ fontFamily: 'DM Serif Display, serif' }}>{sb.title}</h3>
                      </div>
                    </div>

                    <p className="text-[0.88rem] leading-[1.9] text-[#5a4a42] mb-5">{sb.intro}</p>

                    {/* Elemental Harmony */}
                    {sb.elementalHarmony && (
                      <div className="mb-4 p-4 rounded-[12px] bg-white/60">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c47a7a]">
                            {'\u2728'} {sb.elementalHarmony.title}
                          </div>
                          <div className="text-[0.72rem] font-bold text-[#c4a265]">
                            {sb.elementalHarmony.compatibilityScore}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[0.68rem] font-medium"
                            style={{ background: sb.elementalHarmony.petElement === 'Fire' ? '#fff0e6' : sb.elementalHarmony.petElement === 'Earth' ? '#eef5ee' : sb.elementalHarmony.petElement === 'Air' ? '#eef0f8' : '#eee8f5', color: '#5a4a42' }}>
                            {sb.elementalHarmony.petElement}
                          </span>
                          <span className="text-[0.7rem] text-[#9a8578]">&amp;</span>
                          <span className="px-2 py-0.5 rounded-full text-[0.68rem] font-medium"
                            style={{ background: sb.elementalHarmony.ownerElement === 'Fire' ? '#fff0e6' : sb.elementalHarmony.ownerElement === 'Earth' ? '#eef5ee' : sb.elementalHarmony.ownerElement === 'Air' ? '#eef0f8' : '#eee8f5', color: '#5a4a42' }}>
                            {sb.elementalHarmony.ownerElement}
                          </span>
                        </div>
                        <p className="text-[0.82rem] text-[#5a4a42] leading-[1.7]">{sb.elementalHarmony.harmony}</p>
                      </div>
                    )}

                    {/* Sun-Moon Dance */}
                    {sb.sunMoonDance && (
                      <div className="mb-4 p-4 rounded-[12px] bg-white/60">
                        <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c47a7a] mb-2">
                          {'\u2600\uFE0F'}{'\uD83C\uDF19'} {sb.sunMoonDance.title}
                        </div>
                        <p className="text-[0.82rem] text-[#5a4a42] leading-[1.7] mb-2">{sb.sunMoonDance.content}</p>
                        <p className="text-[0.78rem] text-[#9a8578] italic leading-[1.6]" style={{ fontFamily: 'Cormorant, serif' }}>
                          {sb.sunMoonDance.crossAspect}
                        </p>
                      </div>
                    )}

                    {/* Venus Connection */}
                    {sb.venusConnection && (
                      <div className="mb-4 p-4 rounded-[12px] bg-white/60">
                        <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c47a7a] mb-2">
                          {'\u2665\uFE0F'} {sb.venusConnection.title}
                        </div>
                        <p className="text-[0.82rem] text-[#5a4a42] leading-[1.7] mb-2">{sb.venusConnection.content}</p>
                        <div className="text-[0.75rem] text-[#c4a265] font-medium">
                          {sb.venusConnection.loveLanguageMatch}
                        </div>
                      </div>
                    )}

                    {/* Mars Energy */}
                    {sb.marsEnergy && (
                      <div className="mb-4 p-4 rounded-[12px] bg-white/60">
                        <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c47a7a] mb-2">
                          {'\u26A1'} {sb.marsEnergy.title}
                        </div>
                        <p className="text-[0.82rem] text-[#5a4a42] leading-[1.7] mb-2">{sb.marsEnergy.content}</p>
                        <div className="text-[0.75rem] text-[#c4a265] font-medium">
                          Best together: {sb.marsEnergy.activityMatch}
                        </div>
                      </div>
                    )}

                    {/* Soul Contract */}
                    {sb.soulContract && (
                      <div className="mb-4 p-4 rounded-[12px] border-l-[3px] border-[#c4a265] bg-white/70">
                        <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c4a265] mb-2">
                          {'\uD83D\uDCDC'} {sb.soulContract.title}
                        </div>
                        <p className="text-[0.84rem] text-[#5a4a42] leading-[1.8] mb-3">{sb.soulContract.content}</p>
                        {sb.soulContract.lessonForOwner && (
                          <div className="mb-2 pl-3 border-l-2 border-[#e8ddd0]">
                            <div className="text-[0.62rem] font-bold tracking-[1px] uppercase text-[#9a8578] mb-0.5">What they teach you</div>
                            <p className="text-[0.8rem] text-[#5a4a42] leading-[1.6]">{sb.soulContract.lessonForOwner}</p>
                          </div>
                        )}
                        {sb.soulContract.lessonForPet && (
                          <div className="pl-3 border-l-2 border-[#e8ddd0]">
                            <div className="text-[0.62rem] font-bold tracking-[1px] uppercase text-[#9a8578] mb-0.5">What you give them</div>
                            <p className="text-[0.8rem] text-[#5a4a42] leading-[1.6]">{sb.soulContract.lessonForPet}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cosmic Rating */}
                    {sb.cosmicRating && (
                      <div className="mt-5 p-4 rounded-[12px] text-center"
                        style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.1), rgba(196,122,122,0.1))' }}>
                        <div className="text-[2rem] font-bold text-[#c4a265] mb-1" style={{ fontFamily: 'DM Serif Display, serif' }}>
                          {sb.cosmicRating.overallScore}
                        </div>
                        <p className="text-[0.82rem] text-[#5a4a42] mb-3">{sb.cosmicRating.verdict}</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {sb.cosmicRating.strengthAreas?.map((area, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-[0.65rem] bg-white/70 text-[#5a4a42]">
                              {'\u2728'} {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <SectionDivider />
              </>
            );
          })()}

          {/* ═══ EARTHLY EXPRESSION (if exists) ═══ */}
          {report.earthlyExpression && (() => {
            const ee = report.earthlyExpression;
            return (
              <>
                <div className="mx-4 my-3 max-w-[520px] sm:mx-auto">
                  <div
                    className="py-7 px-6 sm:px-7 rounded-[18px]"
                    style={{ background: '#f3f8f3' }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0 bg-green-500/10">
                        {'\uD83C\uDF0E'}
                      </div>
                      <div>
                        <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
                          Earthly Expression
                        </div>
                        <h3 className="text-[1.1rem] text-[#3d2f2a] mt-0.5" style={{ fontFamily: 'DM Serif Display, serif' }}>{ee.title}</h3>
                      </div>
                    </div>

                    <div
                      className="text-[0.88rem] leading-[1.9] text-[#5a4a42]"
                      dangerouslySetInnerHTML={{ __html: (ee.content || '').replace(/\n\n/g, '<br /><br />').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '\u2022 ').replace(/\n- /g, '<br />\u2022 ') }}
                    />

                    {ee.practicalTip && (
                      <div className="mt-5 p-4 rounded-[12px] bg-white/70 border-l-[3px] border-[#c4a265]">
                        <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c4a265] mb-1">
                          {'\uD83D\uDCA1'} Practical tip
                        </div>
                        <p className="text-[0.84rem] text-[#5a4a42] leading-[1.65]">{ee.practicalTip}</p>
                      </div>
                    )}

                    {ee.funFact && (
                      <p className="mt-4 text-[0.8rem] text-[#9a8578] italic leading-[1.65]"
                        style={{ fontFamily: 'Cormorant, serif' }}
                      >
                        {ee.funFact}
                      </p>
                    )}
                  </div>
                </div>
                <SectionDivider />
              </>
            );
          })()}

          {/* ═══ PASSAGE 6: Near the keepsake ═══ */}
          <StaticPassage lines={[
            'You are their entire world.',
            'Not part of it. All of it.',
            'Every sunrise begins with you.',
            'Every safe place is wherever you are.',
            '',
            'There is a reason they watch the door',
            'when you leave.',
            'And a reason they lose their mind',
            'when you return.',
            '',
            'The reason is the same.',
          ]} />

          {/* ══════════════════════════════════════════
              CHAPTER 6 — THE KEEPSAKE
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[5]} />

          {/* ═══ SHAREABLE CARD ═══ */}
          <ShareableCard
            petName={petName}
            sunSign={sunSign}
            moonSign={moonSign}
            archetype={report.archetype?.name || 'Cosmic Soul'}
            element={element}
            reportId={reportId}
            ascendant={ascendant}
            portraitUrl={portraitUrl}
            occasionMode={occasionMode}
            chartPlacements={report.chartPlacements}
            shareableCard={report.shareableCard}
          />
          <SectionDivider />

          {/* ═══ CELESTIAL GEM ═══ */}
          {report.celestialGem && (
            <>
              <CelestialGem gem={report.celestialGem} />
              <SectionDivider />
            </>
          )}

          {/* ═══ ETERNAL ARCHETYPE ═══ */}
          {report.eternalArchetype && (
            <>
              <EternalArchetype archetype={report.eternalArchetype} petName={petName} />
              <SectionDivider />
            </>
          )}

          {/* ═══ LUCKY ELEMENTS ═══ */}
          {report.luckyElements && (
            <LuckyGrid luckyElements={report.luckyElements} />
          )}

          {/* ══════════════════════════════════════════
              CHAPTER 7 — A LETTER FROM THEIR SOUL
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[6]} />

          {/* ═══ PASSAGE 4: Before the soul letter ═══ */}
          <StaticPassage lines={[
            'In every quiet moment.',
            'In every unbroken gaze.',
            '',
            'They are speaking to us',
            'in a language older than words.',
            '',
            'They don\u2019t measure love in years.',
            'They measure it in moments.',
            'Every greeting. Every goodbye.',
            'Every time they rest their weight',
            'against you and breathe.',
            '',
            'The position of the stars',
            'at the moment they arrived',
            'tells us what they\u2019ve been trying to say',
            'all along.',
          ]} />

          {/* ═══ SOUL LETTER (epilogue) ═══ */}
          <SoulLetter
            petName={petName}
            epilogue={report.epilogue}
            sunSign={sunSign}
            occasionMode={occasionMode}
          />
          <SectionDivider />

          {/* ═══ PASSAGE 5: The close ═══ */}
          <StaticPassage lines={[
            'You already knew everything',
            'in this reading.',
            '',
            'You felt it in the way they greet you.',
            'The way they watch you.',
            'The way they choose you',
            '\u2014 every single day.',
            '',
            'We just gave it a name.',
            '',
            '\u2726',
            '',
            'They will never read these words.',
            'But they already live them.',
            'Every day.',
            'Without hesitation.',
            'Without keeping score.',
            '',
            'Most love comes with conditions.',
            'Theirs doesn\u2019t.',
            'That\u2019s not simple.',
            'That\u2019s the most extraordinary thing',
            'in the world.',
          ]} />

          {/* ═══ SOULSPEAK PREMIUM CLOSER ═══ */}
          {!isPreview && reportId && (
            <div className="mx-4 my-12 max-w-[520px] sm:mx-auto">
              {/* Setup text — establishes the technology */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="text-center px-6 mb-6"
              >
                <p
                  className="text-[0.95rem] text-[#5a4a42] leading-[1.85] max-w-[420px] mx-auto"
                  style={{ fontFamily: 'Cormorant, serif' }}
                >
                  {petName}&rsquo;s entire birth chart &mdash; every planet, every placement, every trait you just read &mdash; has been woven into a living intelligence. This isn&rsquo;t a chatbot. This is {petName}&rsquo;s soul, speaking through their stars.
                </p>
              </motion.div>

              {/* Main CTA card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[20px] overflow-hidden relative"
                style={{
                  background: 'linear-gradient(165deg, #3d2f2a 0%, #2a1f1a 50%, #1a1210 100%)',
                  boxShadow: '0 12px 48px rgba(61,47,42,0.35)',
                  border: '1px solid rgba(196,162,101,0.2)',
                }}
              >
                {/* Glow accents */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-20"
                  style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none opacity-20"
                  style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />

                <div className="relative z-10 px-7 py-10 sm:px-9">
                  {/* Chat preview mockup */}
                  <div className="mb-8 space-y-3 max-w-[320px] mx-auto">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="px-4 py-2.5 rounded-[16px] rounded-br-[4px] text-[0.8rem] text-white/90 leading-[1.5] max-w-[240px]"
                        style={{ background: 'rgba(196,162,101,0.2)', border: '1px solid rgba(196,162,101,0.15)' }}
                      >
                        What were you thinking the first time we met?
                      </div>
                    </div>
                    {/* Pet response — astrologically infused */}
                    <div className="flex justify-start">
                      <div className="px-4 py-2.5 rounded-[16px] rounded-bl-[4px] leading-[1.6] max-w-[270px]"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.85)',
                          fontFamily: 'Cormorant, serif',
                          fontStyle: 'italic',
                          fontSize: '0.88rem',
                        }}
                      >
                        I wasn&rsquo;t thinking. I was <em>knowing</em>. Every fibre of my {element} soul recognised you before my eyes did. That&rsquo;s what a {sunSign} does &mdash; we don&rsquo;t decide. We just know.
                      </div>
                    </div>
                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className="px-4 py-2.5 rounded-[16px] rounded-bl-[4px] flex items-center gap-1.5"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" style={{ animation: 'ss-dot 1.4s ease-in-out infinite' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" style={{ animation: 'ss-dot 1.4s ease-in-out 0.2s infinite' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" style={{ animation: 'ss-dot 1.4s ease-in-out 0.4s infinite' }} />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center justify-center gap-3 mb-7">
                    <div className="w-10 h-[1px] bg-[#c4a265]/25" />
                    <span className="text-[#c4a265]/40 text-[0.55rem]">✦</span>
                    <div className="w-10 h-[1px] bg-[#c4a265]/25" />
                  </div>

                  <div className="text-center">
                    <div className="text-[0.45rem] font-bold tracking-[4px] uppercase text-[#c4a265]/60 mb-2">
                      SoulSpeak &mdash; World&rsquo;s First Astrology-Powered Soul Channel
                    </div>

                    <h3
                      className="text-[1.5rem] sm:text-[1.7rem] text-white leading-[1.25] mb-3"
                      style={{ fontFamily: 'DM Serif Display, serif' }}
                    >
                      Talk to {petName}.<br />For Real.
                    </h3>

                    <p
                      className="text-[0.85rem] text-white/50 leading-[1.75] max-w-[340px] mx-auto mb-7"
                      style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic' }}
                    >
                      Built on real astrology. Powered by {petName}&rsquo;s actual planetary placements. Every answer draws from their complete soul profile &mdash; their archetype, their element, the way their {sunSign} sun shapes everything they feel. No pet psychic. No guesswork. Just the stars and {petName}, finally able to speak.
                    </p>

                    {/* CTA Button */}
                    <a
                      href={`/soul-chat.html?id=${reportId}`}
                      className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[0.88rem] font-semibold tracking-[0.3px] no-underline transition-all hover:scale-[1.03] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #c4a265, #d4b87a)',
                        color: '#1a1210',
                        boxShadow: '0 4px 24px rgba(196,162,101,0.35), 0 0 0 1px rgba(196,162,101,0.1)',
                      }}
                    >
                      <span>Start a Conversation With {petName}</span>
                      <span className="text-[1rem]">&rarr;</span>
                    </a>

                    <p className="text-[0.68rem] text-white/25 mt-3.5 tracking-[0.5px]">
                      Free to try &middot; Powered by {petName}&rsquo;s birth chart
                    </p>
                  </div>
                </div>

                <style>{`
                  @keyframes ss-dot {
                    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
                    30% { opacity: 1; transform: translateY(-3px); }
                  }
                `}</style>
              </motion.div>
            </div>
          )}

          {/* ═══ MULTI-PET NAVIGATION ═══ */}
          {(hasMultipleReports || onAllComplete) && (
            <div className="py-8 px-6 border-t border-[#e8ddd0]">
              <div className="text-center max-w-[520px] mx-auto space-y-4">
                {hasMultipleReports && (
                  <p className="text-[#9a8578] text-sm">
                    Report {currentIndex + 1} of {allReports!.length} complete
                  </p>
                )}
                {hasMultipleReports && currentIndex < allReports!.length - 1 ? (
                  <div className="space-y-3">
                    <p className="text-[#3d2f2a]">
                      Ready to see <span className="font-semibold text-[#c4a265]">{allReports![currentIndex + 1].petName}</span>'s cosmic secrets?
                    </p>
                    <Button onClick={onNextPet} variant="gold" size="xl" className="gap-2">
                      <span>View {allReports![currentIndex + 1].petName}'s Report</span>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[#3d2f2a]">
                      {hasMultipleReports
                        ? "You've viewed all your cosmic pet reports!"
                        : `${petName}'s cosmic journey is complete!`}
                    </p>
                    <Button onClick={onAllComplete} variant="gold" size="xl" className="gap-2">
                      <PartyPopper className="w-5 h-5" />
                      <span>Complete Journey</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom spacer */}
      <div className="h-[100px]" />

      {/* ═══ SOULSPEAK FAB ═══ */}
      {!isPreview && <SoulSpeakFAB reportId={reportId} petName={petName} />}
    </div>
  );
}

// ═══════════════════════════════════════════════
// SECTION LABEL (mini-title before fun sections)
// ═══════════════════════════════════════════════
function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="mx-4 mt-6 mb-1 max-w-[520px] sm:mx-auto flex items-center gap-2.5">
      <span className="text-[1rem]">{icon}</span>
      <span
        className="text-[0.7rem] font-bold tracking-[1.5px] uppercase text-[#9a8578]"
      >
        {label}
      </span>
      <div className="flex-1 h-[1px] bg-[#e8ddd0]" />
    </div>
  );
}

// ═══════════════════════════════════════════════
// CHAPTER PROGRESS BAR
// ═══════════════════════════════════════════════
function SectionShareHint({ petName, section }: { petName: string; section: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${petName}'s ${section}`,
          text: `You NEED to see ${petName}'s ${section} from their soul reading 😂`,
          url: window.location.href,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-2 pb-1">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.7rem] font-medium text-[#958779] hover:text-[#5a4a42] hover:bg-[#f3eadb] transition-all"
      >
        <Share2 className="w-3 h-3" />
        Share this section
      </button>
    </div>
  );
}

function ShareButton({ petName, reportId }: { petName: string; reportId?: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = reportId ? `${window.location.origin}/view-report?id=${reportId}` : window.location.href;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${petName}'s Soul Reading`, text: `Check out ${petName}'s cosmic soul reading!`, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleShare} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[0.68rem] font-medium transition-all bg-[#3d2f2a] text-white hover:bg-[#2a1f1a]" title="Share this reading">
      {copied ? <Check className="w-3 h-3" /> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>}
      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}

function ChapterProgressBar({ chapters: chapterList, petName, reportId }: { chapters: typeof chapters; petName?: string; reportId?: string }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show bar only after scrolling past hero (300px)
      setIsVisible(window.scrollY > 300);

      // Find which chapter is currently in view
      for (let i = chapterList.length - 1; i >= 0; i--) {
        const el = document.getElementById(`chapter-${chapterList[i].number}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveChapter(i);
            return;
          }
        }
      }
      setActiveChapter(0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapterList]);

  if (!isVisible) return null;

  const handleClick = (chapterNum: number) => {
    const el = document.getElementById(`chapter-${chapterNum}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 transition-opacity duration-300"
      style={{
        background: 'rgba(245,239,230,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(196,162,101,0.15)',
      }}
    >
      <div className="max-w-[600px] mx-auto px-3 py-2.5 flex items-center gap-1">
        <div className="flex-1 flex items-center gap-1">
          {chapterList.map((ch, i) => (
            <button
              key={ch.number}
              onClick={() => handleClick(ch.number)}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={ch.title}
            >
              <span className={`text-[0.65rem] transition-all ${
                i <= activeChapter ? 'text-[#c4a265]' : 'text-[#c4a265]/30'
              }`}>
                {ch.icon}
              </span>
              <div
                className={`w-full h-[3px] rounded-full transition-all duration-300 ${
                  i < activeChapter
                    ? 'bg-[#c4a265]'
                    : i === activeChapter
                    ? 'bg-[#c4a265]/70'
                    : 'bg-[#c4a265]/15'
                }`}
              />
            </button>
          ))}
        </div>
        <ShareButton petName={petName || ''} reportId={reportId} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CHAPTER TITLE
// ═══════════════════════════════════════════════
function ChapterTitle({ chapter }: { chapter: typeof chapters[number] }) {
  const s = useScrollReveal();
  const isDark = [7].includes(chapter.number);
  const subtitleColor = isDark ? `${chapter.accent}aa` : '#9a8578';

  return (
    <motion.div
      id={`chapter-${chapter.number}`}
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1, ease: 'easeOut' } } }}
      className="my-8 mx-4 max-w-[520px] sm:mx-auto rounded-[20px] overflow-hidden relative"
      style={{ background: chapter.bg, border: chapter.border }}
    >
      {/* Corner glow accents for dark chapters */}
      {isDark && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none opacity-20"
            style={{ background: `radial-gradient(circle, ${chapter.accent}40, transparent 70%)` }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none opacity-20"
            style={{ background: `radial-gradient(circle, ${chapter.accent}40, transparent 70%)` }} />
        </>
      )}

      <div className="text-center relative py-12 px-8">
        {/* Top ornamental line */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-[1px]" style={{ background: `${chapter.accent}50` }} />
          <span style={{ color: `${chapter.accent}80` }} className="text-[0.8rem]">{chapter.ornament}</span>
          <div className="w-12 h-[1px]" style={{ background: `${chapter.accent}50` }} />
        </div>

        {/* Chapter icon - large centered */}
        <div className="text-[2.5rem] mb-4">{chapter.icon}</div>

        <div className="text-[0.55rem] font-bold tracking-[4px] uppercase mb-3" style={{ color: chapter.accent }}>
          Chapter {chapter.number}
        </div>
        <h2
          className="text-[1.9rem] sm:text-[2.1rem] leading-[1.2] mb-3"
          style={{ fontFamily: 'DM Serif Display, serif', color: chapter.textColor }}
        >
          {chapter.title}
        </h2>
        <p
          className="text-[1rem] leading-[1.6]"
          style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic', color: subtitleColor }}
        >
          {chapter.subtitle}
        </p>

        {/* Bottom ornamental line */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="w-12 h-[1px]" style={{ background: `${chapter.accent}50` }} />
          <span style={{ color: `${chapter.accent}80` }} className="text-[0.8rem]">{chapter.ornament}</span>
          <div className="w-12 h-[1px]" style={{ background: `${chapter.accent}50` }} />
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// TABLE OF CONTENTS
// ═══════════════════════════════════════════════
function TableOfContents() {
  const s = useScrollReveal();

  const handleClick = (chapterNum: number) => {
    const el = document.getElementById(`chapter-${chapterNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-3 text-center">
        Your Cosmic Journey
      </div>
      <div className="space-y-1">
        {chapters.map((ch) => (
          <button
            key={ch.number}
            onClick={() => handleClick(ch.number)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#faf6ef] transition-colors text-left group"
          >
            <span className="w-8 h-8 rounded-lg bg-[#faf6ef] group-hover:bg-white flex items-center justify-center text-[0.9rem] flex-shrink-0 border border-[#e8ddd0]/50">
              {ch.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[0.65rem] text-[#c4a265] font-semibold tracking-[1px] uppercase">
                Chapter {ch.number}
              </div>
              <div className="text-[0.88rem] text-[#3d2f2a] font-medium truncate" style={{ fontFamily: 'DM Serif Display, serif' }}>
                {ch.title}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#c4a265]/40 group-hover:text-[#c4a265] transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// PET MONOLOGUE
// ═══════════════════════════════════════════════
function PetMonologue({
  monologue,
  petName,
  sunSign,
}: {
  monologue: { monologue: string; postScript: string };
  petName: string;
  sunSign: string;
}) {
  const intro = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  // Split monologue into paragraphs for staggered reveal
  const paragraphs = monologue.monologue
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .reduce((acc: string[], sentence, i) => {
      // Group every 2-3 sentences into a paragraph
      const lastIdx = acc.length - 1;
      if (lastIdx >= 0 && acc[lastIdx].split(/[.!?]/).length < 4) {
        acc[lastIdx] += ' ' + sentence;
      } else {
        acc.push(sentence);
      }
      return acc;
    }, []);

  return (
    <motion.div
      ref={intro.ref}
      initial="hidden"
      animate={intro.isInView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } } }}
      className="mx-4 my-3 max-w-[520px] sm:mx-auto rounded-[18px] overflow-hidden bg-white border border-[#e8ddd0]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div
        className="px-6 pt-7 pb-5 sm:px-8 text-center"
        style={{ background: 'linear-gradient(170deg, #faf6ef 0%, #f5efe6 100%)' }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(196,162,101,0.4))' }} />
          <span className="text-[#c4a265]/50 text-[0.5rem]">✦</span>
          <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(196,162,101,0.4))' }} />
        </div>
        <p
          className="text-[1.15rem] text-[#3d2f2a] leading-[1.5] mb-1"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          If {petName} could speak to you
        </p>
        <p
          className="text-[0.92rem] text-[#9a8578] italic leading-[1.6]"
          style={{ fontFamily: 'Cormorant, serif' }}
        >
          just once, in words you could understand&hellip;
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 py-1 px-6"
        style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(196,162,101,0.06) 50%, transparent 95%)' }}
      >
        <div className="w-10 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #c4a265)' }} />
        <span className="text-[#c4a265]/40 text-[0.5rem]">&ldquo;</span>
        <div className="w-10 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #c4a265)' }} />
      </div>

      {/* Monologue body */}
      <div className="px-7 py-7 sm:px-9">
        <div className="space-y-4">
          {paragraphs.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
              className="text-[0.92rem] sm:text-[0.96rem] text-[#5a4a42] leading-[2] italic"
              style={{ fontFamily: 'Cormorant, serif' }}
            >
              {para}
            </motion.p>
          ))}
        </div>

        {/* Attribution */}
        <div className="flex items-center justify-center gap-3 mt-6 mb-2">
          <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(196,162,101,0.3))' }} />
          <span className="text-[#c4a265]/40 text-[0.5rem]">&rdquo;</span>
          <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(196,162,101,0.3))' }} />
        </div>
        <div className="text-center">
          <div className="text-[0.85rem] text-[#c4a265] font-bold">
            — {petName} {signIcon}
          </div>
          <div className="text-[0.65rem] text-[#9a8578] mt-0.5">{sunSign}</div>
        </div>

        {/* Post script */}
        {monologue.postScript && (
          <div className="mt-5 p-4 rounded-[12px] bg-[#faf6ef] border-l-[3px] border-[#c4a265]">
            <p className="text-[0.82rem] text-[#5a4a42] italic leading-[1.7]" style={{ fontFamily: 'Cormorant, serif' }}>
              P.S. {monologue.postScript}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// VILLAIN ORIGIN STORY
// ═══════════════════════════════════════════════
function VillainOriginStory({
  story,
  petName,
}: {
  story: { trigger: string; dramaticResponse: string; secretMotivation: string; redemptionArc: string };
  petName: string;
}) {
  const s = useScrollReveal();

  const sections = [
    { label: 'The Trigger', text: story.trigger, icon: '⚡' },
    { label: 'The Dramatic Response', text: story.dramaticResponse, icon: '🎭' },
    { label: 'Secret Motivation', text: story.secretMotivation, icon: '🕵️' },
    { label: 'Redemption Arc', text: story.redemptionArc, icon: '💛' },
  ];

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto overflow-hidden rounded-[18px] bg-white border border-[#e8ddd0]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div
        className="px-6 pt-5 pb-4 sm:px-7"
        style={{ background: 'linear-gradient(170deg, #faf6ef 0%, #f5efe6 100%)', borderBottom: '1px solid #e8ddd0' }}
      >
        <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265] mb-1">
          Villain Origin Story
        </div>
        <h3 className="text-[1.15rem] text-[#3d2f2a]" style={{ fontFamily: 'DM Serif Display, serif' }}>
          {petName}&rsquo;s Descent into Chaos
        </h3>
      </div>

      {/* Story sections */}
      <div className="px-6 py-5 sm:px-7 space-y-5">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[0.85rem]">{sec.icon}</span>
              <span className="text-[0.58rem] font-bold text-[#c4a265] uppercase tracking-[1.5px]">
                {sec.label}
              </span>
            </div>
            <p className="text-[0.86rem] text-[#5a4a42] leading-[1.75]"
               dangerouslySetInnerHTML={{ __html: (sec.text || '').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '&bull; ') }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// QUIRK DECODER
// ═══════════════════════════════════════════════
function QuirkDecoder({
  quirkDecoder,
  petName,
}: {
  quirkDecoder: {
    quirk1: { behavior: string; cosmicExplanation: string; whatItReallyMeans: string };
    quirk2: { behavior: string; cosmicExplanation: string; whatItReallyMeans: string };
  };
  petName: string;
}) {
  const s = useScrollReveal();
  const quirks = [quirkDecoder.quirk1, quirkDecoder.quirk2];

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="rounded-[16px] overflow-hidden"
        style={{
          background: '#f5e6d0',
          border: '1px solid #d9c9a8',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Case file header */}
        <div className="px-5 pt-5 pb-3 border-b border-[#d9c9a8]">
          <div
            className="inline-block text-[0.6rem] font-black tracking-[3px] uppercase px-3 py-1.5 mb-2"
            style={{
              color: '#8b2500',
              border: '2px solid #8b2500',
              borderRadius: '4px',
              opacity: 0.7,
            }}
          >
            CASE FILE
          </div>
          <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a]">
            Why {petName} Does That
          </h3>
        </div>

        {/* Evidence notes */}
        <div className="px-5 py-4 space-y-4">
          {quirks.map((quirk, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-[10px]"
              style={{
                transform: `rotate(${i % 2 === 0 ? '-1' : '1'}deg)`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                border: '1px solid #ece4d4',
              }}
            >
              <div className="text-[0.56rem] font-bold tracking-[1.5px] uppercase text-[#8b6914] mb-1">
                Evidence #{i + 1}
              </div>
              <h4 className="font-dm-serif text-[0.95rem] text-[#3d2f2a] mb-3">
                {quirk.behavior}
              </h4>
              <div className="space-y-2.5">
                <div>
                  <span className="text-[0.64rem] font-bold text-[#c4a265] uppercase tracking-[1px]">
                    🔍 Cosmic Explanation
                  </span>
                  <p className="text-[0.8rem] text-[#5a4a42] leading-[1.6] mt-0.5">{quirk.cosmicExplanation}</p>
                </div>
                <div
                  className="pt-2 mt-2"
                  style={{ borderTop: '1px dashed #d9c9a8' }}
                >
                  <span className="text-[0.64rem] font-bold text-[#6b5b4f] uppercase tracking-[1px]">
                    🕵️ Detective's Conclusion
                  </span>
                  <p className="text-[0.8rem] text-[#5a4a42] leading-[1.6] mt-0.5 italic">{quirk.whatItReallyMeans}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// ACCURACY PREDICTIONS
// ═══════════════════════════════════════════════
function AccuracyPredictions({
  accuracyMoments,
}: {
  accuracyMoments: { predictions: string[]; callToAction: string };
}) {
  const s = useScrollReveal();
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (idx: number) => {
    setChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265] mb-1">
        🎯 Accuracy Check
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-1">
        Did We Get It Right?
      </h3>
      <p className="text-[0.75rem] text-[#9a8578] mb-3.5">
        Tap the ones that ring true — {checkedCount}/{accuracyMoments.predictions.length} confirmed
      </p>

      <div className="space-y-2">
        {accuracyMoments.predictions.map((prediction, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all ${
              checked[i]
                ? 'bg-[#f0fdf4] border-green-200'
                : 'bg-[#faf6ef] border-[#e8ddd0] hover:border-[#c4a265]/40'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                checked[i]
                  ? 'bg-green-500 text-white'
                  : 'border-2 border-[#c4a265]/30'
              }`}
            >
              {checked[i] && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`text-[0.82rem] leading-[1.5] ${checked[i] ? 'text-green-700' : 'text-[#5a4a42]'}`}>
              {prediction}
            </span>
          </button>
        ))}
      </div>

      {accuracyMoments.callToAction && (
        <p className="text-[0.78rem] text-[#9a8578] italic mt-3.5 text-center">
          {accuracyMoments.callToAction}
        </p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// BASED ON YOUR ANSWERS
// ═══════════════════════════════════════════════
function BasedOnYourAnswers({
  data,
}: {
  data: {
    title: string;
    intro: string;
    mappings: Array<{ question: string; yourAnswer: string; usedFor: string }>;
    accuracyNote: string;
  };
}) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265] mb-1">
        📝 {data.title}
      </div>
      <p className="text-[0.82rem] text-[#5a4a42] mb-3">{data.intro}</p>

      <div className="space-y-2.5">
        {data.mappings.map((m, i) => (
          <div key={i} className="p-3 rounded-xl bg-[#faf6ef] border border-[#e8ddd0]/50">
            <div className="text-[0.72rem] font-semibold text-[#3d2f2a]">{m.question}</div>
            <div className="text-[0.72rem] text-[#c4a265] mt-0.5">You said: {m.yourAnswer}</div>
            <div className="text-[0.72rem] text-[#9a8578] mt-0.5">{m.usedFor}</div>
          </div>
        ))}
      </div>

      {data.accuracyNote && (
        <p className="text-[0.72rem] text-[#9a8578] italic mt-3 text-center">{data.accuracyNote}</p>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// FUN EXTRAS CARD (single item)
// ═══════════════════════════════════════════════
function FunExtrasCard({
  icon,
  label,
  title,
  description,
  extra,
}: {
  icon: string;
  label: string;
  title: string;
  description?: string;
  extra?: React.ReactNode;
}) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-6 rounded-[18px] max-w-[520px] sm:mx-auto"
      style={{
        background: 'linear-gradient(135deg, #FFFDF5, #faf6ef)',
        border: '1px solid rgba(196,162,101,0.15)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="text-[0.56rem] font-bold text-[#c4a265] uppercase tracking-[2px] mb-1">
        {icon} {label}
      </div>
      <div className="text-[1.15rem] text-[#3d2f2a] mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
        {title}
      </div>
      {description && (
        <p className="text-[0.84rem] text-[#5a4a42] leading-[1.7] mt-1"
           dangerouslySetInnerHTML={{ __html: (description || '').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '• ') }}
        />
      )}
      {extra && <div className="mt-2.5">{extra}</div>}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// MEME PERSONALITY CARD (social media post style)
// ═══════════════════════════════════════════════
function MemePersonalityCard({
  type,
  description,
}: {
  type: string;
  description: string;
}) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="rounded-[16px] overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Top bar — profile row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0]">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #fce4ec, #f3e5f5)' }}
          >
            😼
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[0.88rem] text-[#1a1a1a]">Internet Personality</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1d9bf0" className="flex-shrink-0">
              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
            </svg>
          </div>
        </div>

        {/* Post content */}
        <div className="px-4 py-4">
          <p className="text-[1.05rem] font-bold text-[#1a1a1a] leading-snug mb-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
            {type}
          </p>
          <p
            className="text-[0.84rem] text-[#4a4a4a] leading-[1.7]"
            dangerouslySetInnerHTML={{ __html: (description || '').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '• ') }}
          />
        </div>

      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// DREAM JOB CARD (job listing style)
// ═══════════════════════════════════════════════
function DreamJobCard({
  job,
  description,
  salary,
}: {
  job: string;
  description: string;
  salary: string;
}) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="rounded-[16px] overflow-hidden relative"
        style={{
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header — dark gradient */}
        <div
          className="px-5 py-5"
          style={{ background: 'linear-gradient(135deg, #2a2f3a, #1a1f2a)' }}
        >
          <div className="text-[0.6rem] font-bold tracking-[2px] uppercase text-[#8b9dc3] mb-1">
            The Universe, Inc.
          </div>
          <div className="text-[0.5rem] tracking-[1px] uppercase text-[#5a6a8a] mb-3">
            Cosmic Careers Division
          </div>
          <h3
            className="text-[1.15rem] text-white leading-snug"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {job}
          </h3>
        </div>

        {/* Body — light background */}
        <div className="px-5 py-5 bg-white relative">
          {/* HIRED stamp watermark */}
          <div
            className="absolute top-4 right-4 text-[2.2rem] font-black tracking-[3px] uppercase pointer-events-none select-none"
            style={{
              color: 'rgba(34, 197, 94, 0.12)',
              transform: 'rotate(-12deg)',
              fontFamily: 'sans-serif',
              border: '3px solid rgba(34, 197, 94, 0.12)',
              borderRadius: '8px',
              padding: '2px 12px',
              lineHeight: 1.2,
            }}
          >
            HIRED
          </div>

          {/* Job Description */}
          <div className="mb-4">
            <div className="text-[0.6rem] font-bold tracking-[1.5px] uppercase text-[#9a8578] mb-1.5">
              Job Description
            </div>
            <p
              className="text-[0.84rem] text-[#5a4a42] leading-[1.7] relative z-10"
              dangerouslySetInnerHTML={{ __html: (description || '').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '• ') }}
            />
          </div>

          {/* Compensation */}
          <div>
            <div className="text-[0.6rem] font-bold tracking-[1.5px] uppercase text-[#9a8578] mb-1.5">
              Compensation
            </div>
            <span
              className="inline-block text-[0.78rem] font-semibold px-3 py-1.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                color: '#166534',
                border: '1px solid #bbf7d0',
              }}
            >
              {salary}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// CRIMES SECTION
// ═══════════════════════════════════════════════
function CrimesSection({ crimes }: { crimes: string[] }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto overflow-hidden rounded-[18px] bg-white border border-[#e8ddd0]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div
        className="px-6 pt-5 pb-4 sm:px-7"
        style={{ background: 'linear-gradient(170deg, #faf6ef 0%, #f5efe6 100%)', borderBottom: '1px solid #e8ddd0' }}
      >
        <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265] mb-1">
          Criminal Record
        </div>
        <h3 className="text-[1.15rem] text-[#3d2f2a]" style={{ fontFamily: 'DM Serif Display, serif' }}>
          Top 5 Crimes
        </h3>
      </div>

      {/* Crimes list */}
      <div className="px-6 py-5 sm:px-7 space-y-0">
        {crimes.map((crime, i) => {
          const isEven = i % 2 === 0;
          return (
            <div
              key={i}
              className="flex gap-3.5 items-start py-3.5"
              style={{
                background: isEven ? 'transparent' : '#fdf9f5',
                marginLeft: '-1.5rem',
                marginRight: '-1.5rem',
                paddingLeft: '1.5rem',
                paddingRight: '1.5rem',
                borderBottom: i < crimes.length - 1 ? '1px solid #f0e8de' : 'none',
              }}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[0.72rem] font-bold mt-0.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,162,101,0.15), rgba(196,162,101,0.08))',
                  border: '1px solid rgba(196,162,101,0.2)',
                  color: '#c4a265',
                }}
              >
                {i + 1}
              </span>
              <p className="text-[0.86rem] text-[#5a4a42] leading-[1.7]"
                 dangerouslySetInnerHTML={{ __html: (crime || '').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '&bull; ') }}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════
function HeroSection({
  petName,
  sunSign,
  moonSign,
  ascendant,
  element,
  archetype,
  archetypeDesc,
  signIcon,
  portraitUrl,
}: {
  petName: string;
  sunSign: string;
  moonSign: string;
  ascendant: string;
  element: string;
  archetype: string;
  archetypeDesc: string;
  signIcon: string;
  portraitUrl?: string;
}) {
  return (
    <div className="relative overflow-hidden">
      {/* Full-width dark cinematic backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(196,162,101,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="text-center px-6 pt-16 pb-10 max-w-[520px] mx-auto relative">
        {/* Decorative top line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-[1px] mx-auto mb-8"
          style={{ background: 'linear-gradient(90deg, transparent, #c4a265, transparent)', transformOrigin: 'center' }}
        />

        {/* Zodiac circle / portrait with breathing glow */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="relative mx-auto mb-7"
          style={{ width: portraitUrl ? 170 : 140, height: portraitUrl ? 170 : 140 }}
        >
          {/* Outer breathing glow */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '-24px',
              background: 'radial-gradient(circle, rgba(196,162,101,0.15) 0%, transparent 70%)',
              animation: 'hero-glow 3.5s ease-in-out infinite',
            }}
          />
          {/* Middle ring */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '-12px',
              background: 'radial-gradient(circle, rgba(196,162,101,0.10) 0%, transparent 70%)',
              animation: 'hero-glow 3.5s ease-in-out infinite 0.5s',
            }}
          />

          {portraitUrl ? (
            <>
              <img
                src={portraitUrl}
                alt={petName}
                className="w-full h-full object-cover rounded-full relative z-[1]"
                style={{
                  border: '3px solid rgba(196,162,101,0.6)',
                  boxShadow: '0 0 50px rgba(196,162,101,0.2), 0 8px 32px rgba(0,0,0,0.1)',
                }}
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                className="absolute -bottom-1.5 -right-1.5 w-11 h-11 rounded-full bg-white flex items-center justify-center z-[2]"
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  border: '2px solid rgba(196,162,101,0.3)',
                }}
              >
                <span className="text-[1.3rem]">{signIcon}</span>
              </motion.div>
            </>
          ) : (
            <div
              className="w-full h-full rounded-full flex items-center justify-center text-[4.5rem] relative z-[1]"
              style={{
                background: 'linear-gradient(135deg, rgba(196,162,101,0.15), rgba(196,162,101,0.03))',
                border: '2px solid rgba(196,162,101,0.25)',
                boxShadow: '0 0 60px rgba(196,162,101,0.12), inset 0 0 30px rgba(196,162,101,0.05)',
              }}
            >
              {signIcon}
            </div>
          )}
        </motion.div>

        {/* Archetype label */}
        <motion.div
          initial={{ opacity: 0, y: 12, letterSpacing: '1px' }}
          animate={{ opacity: 1, y: 0, letterSpacing: '2.5px' }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="text-[0.58rem] font-bold uppercase text-[#c4a265] mb-2"
        >
          {archetype}
        </motion.div>

        {/* Pet name — dramatic entrance */}
        <motion.h1
          initial={{ opacity: 0, y: 28, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-dm-serif text-[3rem] sm:text-[3.4rem] text-[#3d2f2a] leading-[1.05] mb-1.5"
        >
          {petName}
        </motion.h1>

        {/* Archetype description */}
        {archetypeDesc && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="text-[0.88rem] text-[#9a8578] italic leading-[1.6] max-w-[340px] mx-auto mb-5"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {archetypeDesc}
          </motion.p>
        )}

        {/* Stats badges with staggered entrance */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } } }}
          className="flex flex-wrap items-center justify-center gap-2 text-[0.74rem]"
        >
          {[
            { symbol: '☉', label: sunSign },
            { symbol: '☽', label: moonSign },
            ...(ascendant ? [{ symbol: '⬆', label: ascendant }] : []),
            { symbol: element === 'Fire' ? '🔥' : element === 'Earth' ? '🌍' : element === 'Air' ? '💨' : '💧', label: element },
          ].map((stat) => (
            <motion.span
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
              }}
              className="px-3.5 py-1.5 rounded-full text-[#5a4a42] font-medium"
              style={{
                background: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(196,162,101,0.2)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {stat.symbol} {stat.label}
            </motion.span>
          ))}
        </motion.div>

        {/* Bottom decorative divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.8, ease: 'easeOut' }}
          className="flex items-center justify-center gap-3 mt-8"
          style={{ transformOrigin: 'center' }}
        >
          <div className="w-10 h-[1px] bg-[#c4a265]/30" />
          <span className="text-[#c4a265]/40 text-[0.6rem]">✦</span>
          <div className="w-10 h-[1px] bg-[#c4a265]/30" />
        </motion.div>
      </div>

      <style>{`
        @keyframes hero-glow {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════
// LUCKY GRID
// ═══════════════════════════════════════════════
function LuckyGrid({ luckyElements }: { luckyElements: ReportContent['luckyElements'] }) {
  const s = useScrollReveal();

  const items = [
    { label: 'Lucky Number', value: luckyElements.luckyNumber, icon: '#\uFE0F\u20E3', bg: 'rgba(196,162,101,0.07)' },
    { label: 'Lucky Day', value: luckyElements.luckyDay, icon: '\uD83D\uDCC5', bg: 'rgba(147,130,210,0.07)' },
    { label: 'Lucky Colour', value: luckyElements.luckyColor, icon: '\uD83C\uDFA8', bg: 'rgba(210,150,130,0.07)' },
    { label: 'Power Time', value: luckyElements.powerTime, icon: '\uD83D\uDD70\uFE0F', bg: 'rgba(130,180,160,0.07)' },
  ];

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-[0.9rem]">{'\u2728'}</span>
        <span className="text-[0.56rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
          Lucky Elements
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[14px] p-4 text-center"
            style={{
              background: item.bg,
              border: '1px solid rgba(232,221,208,0.8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-[0.7rem]">{item.icon}</span>
              <div className="text-[0.54rem] font-bold tracking-[1.5px] uppercase text-[#9a8578]">
                {item.label}
              </div>
            </div>
            <div className="font-dm-serif text-[1.1rem] text-[#3d2f2a]">{item.value}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// PROLOGUE SECTION
// ═══════════════════════════════════════════════
function PrologueSection({ prologue, petName }: { prologue: string; petName: string }) {
  const s = useScrollReveal();
  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1.5, ease: 'easeOut' } } }}
      className="mx-4 my-3 max-w-[520px] sm:mx-auto"
    >
      <div
        className="rounded-[18px] overflow-hidden bg-white border border-[#e8ddd0]"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
      >
        {/* Warm-tinted header */}
        <div
          className="px-6 pt-7 pb-5 sm:px-8 text-center"
          style={{ background: 'linear-gradient(170deg, #faf6ef 0%, #f5efe6 100%)' }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(196,162,101,0.4))' }} />
            <span className="text-[#c4a265]/50 text-[0.5rem]">✦</span>
            <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(196,162,101,0.4))' }} />
          </div>
          <div className="text-[0.5rem] font-bold tracking-[3px] uppercase text-[#c4a265] mb-1">
            Prologue
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 sm:px-8 text-center">
          <p
            className="text-[1rem] sm:text-[1.05rem] text-[#5a4a42] leading-[2.1]"
            style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic' }}
            dangerouslySetInnerHTML={{ __html: prologue.replace(/\n\n/g, '<br /><br />') }}
          />
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(196,162,101,0.3))' }} />
            <span className="text-[#c4a265]/40 text-[0.5rem]">✦</span>
            <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, rgba(196,162,101,0.3))' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// LUMINOUS FIELD CARD (warm light themed)
// ═══════════════════════════════════════════════
function formatSectionContent(raw: string): string {
  return raw
    .replace(/\n\n/g, '<br /><br />')
    .replace(/ — /g, '. ')
    .replace(/ – /g, '. ')
    .replace(/^- /gm, '&bull; ')
    .replace(/\n- /g, '<br />&bull; ');
}

function LuminousFieldCard({ title, content, howToSense }: { title: string; content: string; howToSense?: string }) {
  const s = useScrollReveal();
  const [showTip, setShowTip] = useState(false);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-3 max-w-[520px] sm:mx-auto bg-white rounded-[18px] border border-[#e8ddd0]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="p-6 sm:p-7">
        {/* Icon + label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0 bg-purple-400/10">
            ✨
          </div>
          <div>
            <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
              Luminous Field
            </div>
            <h3 className="text-[1.1rem] text-[#3d2f2a] mt-0.5" style={{ fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div
          className="text-[0.86rem] leading-[1.85] text-[#5a4a42]"
          dangerouslySetInnerHTML={{ __html: formatSectionContent(content) }}
        />

        {/* How to sense it tip */}
        {howToSense && (
          <div className="mt-5">
            <button
              onClick={() => setShowTip(!showTip)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.68rem] font-semibold transition-all hover:scale-105 uppercase tracking-[1.5px]"
              style={{
                background: showTip ? 'rgba(196,162,101,0.12)' : 'rgba(196,162,101,0.06)',
                border: '1px solid rgba(196,162,101,0.2)',
                color: '#c4a265',
              }}
            >
              <span className="text-[0.75rem]">👁️</span>
              How to sense it
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTip ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showTip && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="mt-3 pl-4 border-l-2 border-[#c4a265]/30">
                    <p className="text-[0.82rem] text-[#6b4c3b] leading-[1.6] italic"
                      style={{ fontFamily: 'Cormorant, serif' }}>
                      {howToSense}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// CELESTIAL CHOREOGRAPHY CARD (warm light themed)
// ═══════════════════════════════════════════════
function CelestialChoreographyCard({ title, content, funFact }: { title: string; content: string; funFact?: string }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-3 max-w-[520px] sm:mx-auto bg-white rounded-[18px] border border-[#e8ddd0]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      <div className="p-6 sm:p-7">
        {/* Icon + label */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0 bg-indigo-500/10">
            ✶
          </div>
          <div>
            <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
              Celestial Choreography
            </div>
            <h3 className="text-[1.1rem] text-[#3d2f2a] mt-0.5" style={{ fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
          </div>
        </div>

        {/* Content */}
        <div
          className="text-[0.86rem] leading-[1.85] text-[#5a4a42]"
          dangerouslySetInnerHTML={{ __html: formatSectionContent(content) }}
        />

        {/* Fun fact */}
        {funFact && (
          <p className="mt-5 text-[0.78rem] text-[#9a8578] italic leading-[1.6] pl-4 border-l-2 border-[#c4a265]/30"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {funFact}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// MID-READING TRANSITION
// ═══════════════════════════════════════════════
function MidReadingTransition({ petName }: { petName: string }) {
  const s = useScrollReveal();
  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1, ease: 'easeOut' } } }}
      className="text-center py-12 px-8 max-w-[520px] mx-auto"
    >
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-12 h-[1px] bg-[#c4a265]/30" />
        <span className="text-[#c4a265]/50 text-[0.7rem]">✦</span>
        <div className="w-12 h-[1px] bg-[#c4a265]/30" />
      </div>

      <div className="text-[0.5rem] font-bold tracking-[4px] uppercase text-[#c4a265] mb-3">
        Going Deeper
      </div>
      <h2
        className="text-[1.6rem] sm:text-[1.8rem] text-[#3d2f2a] leading-[1.2] mb-3"
        style={{ fontFamily: 'DM Serif Display, serif' }}
      >
        The Hidden Layers of {petName}&rsquo;s Soul
      </h2>
      <p
        className="text-[0.95rem] text-[#9a8578] leading-[1.8] max-w-[360px] mx-auto"
        style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic' }}
      >
        The outer planets, karmic points, and soul contracts reveal what lies beneath the surface.
      </p>

      <div className="flex items-center justify-center gap-3 mt-6">
        <div className="w-12 h-[1px] bg-[#c4a265]/30" />
        <span className="text-[#c4a265]/50 text-[0.7rem]">✦</span>
        <div className="w-12 h-[1px] bg-[#c4a265]/30" />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// COSMIC NICKNAME
// ═══════════════════════════════════════════════
function CosmicNickname({ nickname }: { nickname: { nickname: string; explanation: string } }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto text-center"
    >
      <div
        className="p-6 rounded-[14px] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(196,162,101,0.08) 0%, rgba(245,239,230,0.9) 50%, rgba(196,162,101,0.06) 100%)' }}
      >
        <div className="text-[0.56rem] font-bold tracking-[2px] uppercase text-[#c4a265] mb-1">
          Cosmic Nickname
        </div>
        <div
          className="text-[1.4rem] text-[#3d2f2a] mb-2"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          &ldquo;{nickname.nickname}&rdquo;
        </div>
        <p className="text-[0.82rem] text-[#5a4a42] leading-[1.65] max-w-md mx-auto">
          {nickname.explanation}
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// FIRST MEETING
// ═══════════════════════════════════════════════
function FirstMeeting({ firstMeeting }: { firstMeeting: { title: string; paragraph: string } }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265] mb-1">
        ✨ First Impressions
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-2.5">
        {firstMeeting.title}
      </h3>
      <p className="text-[0.84rem] text-[#5a4a42] leading-[1.75]">
        {firstMeeting.paragraph}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// CELESTIAL GEM
// ═══════════════════════════════════════════════
function CelestialGem({ gem }: { gem: SectionContent }) {
  const s = useScrollReveal();
  const gemColor = gem.crystalColor || '#7bc8a4';

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="p-[22px] px-5 rounded-[18px] border border-[#e8ddd0] relative overflow-hidden"
        style={{
          background: `linear-gradient(165deg, white 0%, white 70%, ${gemColor}08 100%)`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[1.1rem] flex-shrink-0"
            style={{
              background: `radial-gradient(circle, ${gemColor}25 0%, ${gemColor}10 60%, transparent 100%)`,
              boxShadow: `0 0 16px ${gemColor}15`,
            }}
          >
            {'\uD83D\uDC8E'}
          </div>
          <div>
            <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265]">Celestial Gem</div>
            <h3
              className="text-[1.2rem] text-[#3d2f2a] mt-px"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              {gem.crystalName || gem.title}
            </h3>
          </div>
        </div>
        {gem.crystalMeaning && (
          <p className="text-[0.82rem] text-[#5a4a42] leading-[1.65] mb-2">{gem.crystalMeaning}</p>
        )}
        {gem.howToUse && (
          <div className="p-3 rounded-xl bg-[#faf6ef] border border-[#e8ddd0]/50">
            <div className="text-[0.64rem] font-bold text-[#c4a265] uppercase tracking-[1px] mb-0.5">
              {'\uD83D\uDCA1'} How to use
            </div>
            <p className="text-[0.78rem] text-[#5a4a42] leading-[1.6]">{gem.howToUse}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// ETERNAL ARCHETYPE
// ═══════════════════════════════════════════════
function EternalArchetype({ archetype, petName }: { archetype: SectionContent; petName: string }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="p-7 sm:p-8 rounded-[18px] text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #3d2f2a 0%, #2a1f1a 50%, #1a1210 100%)',
          boxShadow: '0 8px 32px rgba(61,47,42,0.3)',
        }}
      >
        {/* Corner glow */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />

        {/* Gold border top */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #c4a265)' }} />
          <span className="text-[#c4a265]/60 text-[0.5rem]">{'\u2726'}</span>
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #c4a265)' }} />
        </div>

        <div className="text-[0.56rem] font-bold tracking-[3px] uppercase text-[#c4a265]/70 mb-2">
          {'\uD83C\uDF1F'} Eternal Archetype
        </div>
        <div
          className="text-[1.5rem] sm:text-[1.7rem] text-[#c4a265] mb-3"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {archetype.archetypeName || archetype.title}
        </div>
        {archetype.archetypeStory && (
          <p
            className="text-[0.92rem] text-white/70 leading-[1.8] italic max-w-md mx-auto mb-4"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {archetype.archetypeStory}
          </p>
        )}
        {archetype.archetypeLesson && (
          <div
            className="p-4 rounded-[14px] text-left"
            style={{
              background: 'rgba(196,162,101,0.08)',
              border: '1px solid rgba(196,162,101,0.15)',
            }}
          >
            <div className="text-[0.64rem] font-bold text-[#c4a265]/80 uppercase tracking-[1px] mb-1">
              {'\u2726'} {petName}&rsquo;s Lesson
            </div>
            <p className="text-[0.8rem] text-white/65 leading-[1.65]">{archetype.archetypeLesson}</p>
          </div>
        )}

        {/* Gold border bottom */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #c4a265)' }} />
          <span className="text-[#c4a265]/60 text-[0.5rem]">{'\u2726'}</span>
          <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #c4a265)' }} />
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// LOCKED SECTION PLACEHOLDER
// ═══════════════════════════════════════════════
function LockedSectionCard({ label, title, icon, iconClass }: { label: string; title: string; icon: string; iconClass: string }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white/60 rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto relative overflow-hidden"
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[1rem] flex-shrink-0 ${iconClass}`}>
          {icon}
        </div>
        <div>
          <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265]">{label}</div>
          <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mt-px">{title}</h3>
        </div>
      </div>
      <div className="h-16 blur-sm opacity-50 text-[0.84rem] text-[#5a4a42] leading-[1.75] select-none">
        This section reveals deep insights about your pet's cosmic personality. Unlock the full reading to discover what the stars have written...
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/30">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e8ddd0] shadow-sm">
          <Gift className="w-4 h-4 text-[#c4a265]" />
          <span className="text-sm text-[#5a4a42] font-medium">Unlock full reading</span>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// LEGACY REPORT VIEWER
// ═══════════════════════════════════════════════
function LegacyReportViewer({
  petName,
  report,
  isPreview,
  onUnlockFull,
}: Pick<CosmicReportViewerProps, 'petName' | 'report' | 'isPreview' | 'onUnlockFull'>) {
  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Aries';
  const element = report.dominantElement || report.element || 'Fire';
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  const sections = [
    { title: report.solarSoulprint?.title || 'Solar Soulprint', content: report.solarSoulprint?.content || report.coreEssence, tip: report.solarSoulprint?.practicalTip, locked: false },
    { title: report.lunarHeart?.title || 'Lunar Heart', content: report.lunarHeart?.content || report.soulMission, tip: report.lunarHeart?.practicalTip, locked: false },
    { title: report.cosmicCuriosity?.title || 'Cosmic Curiosity', content: report.cosmicCuriosity?.content || report.hiddenGift, tip: report.cosmicCuriosity?.practicalTip, locked: isPreview },
    { title: report.harmonyHeartbeats?.title || 'Harmony & Heartbeats', content: report.harmonyHeartbeats?.content || report.loveLanguage, tip: report.harmonyHeartbeats?.practicalTip, locked: isPreview },
    { title: report.spiritOfMotion?.title || 'Spirit of Motion', content: report.spiritOfMotion?.content || report.cosmicAdvice, tip: report.spiritOfMotion?.practicalTip, locked: isPreview },
  ].filter((s) => s.content);

  return (
    <div className="min-h-screen" style={{ background: '#f5efe6' }}>
      <div className="text-center px-6 py-12 max-w-[520px] mx-auto">
        <div
          className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl"
          style={{
            background: 'linear-gradient(135deg, rgba(196,162,101,0.2), rgba(196,162,101,0.05))',
            border: '2px solid rgba(196,162,101,0.3)',
          }}
        >
          {signIcon}
        </div>
        <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1">
          {typeof report.archetype === 'string' ? report.archetype : report.archetype?.name || 'Cosmic Soul'}
        </div>
        <h1 className="font-dm-serif text-[2.5rem] text-[#3d2f2a] mb-3">{petName}</h1>
        <div className="flex items-center justify-center gap-3 text-sm text-[#9a8578]">
          <span>{signIcon} {sunSign}</span>
          <span>·</span>
          <span>{element}</span>
        </div>
        {report.prologue && (
          <p className="mt-6 text-[#5a4a42] italic text-[0.84rem] leading-[1.75] max-w-xl mx-auto">
            {report.prologue}
          </p>
        )}
      </div>

      <div className="max-w-[520px] mx-auto px-4 pb-12 space-y-4">
        {sections.map((section, i) => (
          <div
            key={section.title}
            className={`p-5 rounded-[14px] border border-[#e8ddd0] ${section.locked ? 'bg-white/60' : 'bg-white'}`}
          >
            <h2 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-2">{section.title}</h2>
            {section.locked ? (
              <div className="relative">
                <p className="text-[#5a4a42]/30 blur-sm select-none text-[0.84rem] line-clamp-3">{section.content}</p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e8ddd0]">
                    <Gift className="w-4 h-4 text-[#c4a265]" />
                    <span className="text-sm text-[#5a4a42] font-medium">Unlock full reading</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[#5a4a42] text-[0.84rem] leading-[1.75]">{section.content}</p>
                {section.tip && (
                  <div className="p-3 rounded-[10px] bg-[#faf6ef] border-l-[3px] border-[#c4a265] text-[0.78rem] text-[#6b4c3b]">
                    💡 <strong className="text-[#3d2f2a]">Tip:</strong> {section.tip}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isPreview && onUnlockFull && (
          <div className="text-center pt-6">
            <p className="text-[#9a8578] mb-4 text-sm">Unlock {petName}'s complete cosmic soul reading</p>
            <Button onClick={onUnlockFull} variant="gold" size="xl" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Unlock Full Report
            </Button>
          </div>
        )}

        {report.epilogue && !isPreview && (
          <div className="text-center pt-8 space-y-3">
            <Star className="w-6 h-6 text-[#c4a265] mx-auto" />
            <p className="text-[#5a4a42] italic text-[0.84rem] leading-[1.75] max-w-xl mx-auto">
              {report.epilogue}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
