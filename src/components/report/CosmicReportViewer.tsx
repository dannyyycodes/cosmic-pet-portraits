import { motion } from 'framer-motion';
import { useState } from 'react';
import { Gift, Sparkles, ChevronRight, PartyPopper, Mail, Check, Star } from 'lucide-react';
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
  onRequestTestimonial?: () => void;
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
  { number: 1, title: 'How They Came Into This World', subtitle: 'The stars were watching', icon: '✦' },
  { number: 2, title: 'Their Soul, Decoded', subtitle: 'Planet by planet, layer by layer', icon: '🗺️' },
  { number: 3, title: 'The Fun Stuff', subtitle: 'Crimes, chaos, and questionable life choices', icon: '😸' },
  { number: 4, title: 'What They\u2019re Really Thinking', subtitle: 'Spoiler: it\u2019s mostly about you', icon: '🔮' },
  { number: 5, title: 'Why They Chose You', subtitle: 'This was never random', icon: '💕' },
  { number: 6, title: 'The Part That Makes People Cry', subtitle: 'You\u2019ve been warned', icon: '🎁' },
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
  onRequestTestimonial,
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
        onRequestTestimonial={onRequestTestimonial}
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
        />
        <SectionDivider />
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: '#f5efe6' }}>
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

      {/* ═══ READING TRANSITION ═══ */}
      <ReadingTransition petName={petName} />

      {/* ══════════════════════════════════════════
          CHAPTER 2 — THE SOUL MAP
         ══════════════════════════════════════════ */}
      <ChapterTitle chapter={chapters[1]} />

      {/* ═══ BIRTH CHART TABLE ═══ */}
      <BirthChartTable chartPlacements={report.chartPlacements || {}} petName={petName} />
      <SectionDivider />

      {/* Planet explanations are now inline within each reading section via planetExplanation field */}

      {/* ═══ AURA VISUAL ═══ */}
      <AuraVisual aura={report.aura} sunSign={sunSign} />

      {/* ═══ LUMINOUS FIELD (detailed aura) ═══ */}
      {report.luminousField && (
        <ReportSectionCard
          icon="✨"
          iconClass="bg-purple-400/10"
          label="Luminous Field"
          title={report.luminousField.title}
          content={report.luminousField.content}
          tipBox={
            report.luminousField.howToSense
              ? { icon: '👁️', label: 'How to sense it', text: report.luminousField.howToSense }
              : undefined
          }
        />
      )}

      {/* ═══ ELEMENTAL BALANCE ═══ */}
      <ElementalBalance
        elementalBalance={report.elementalBalance || {}}
        dominantElement={element}
        petName={petName}
      />
      <SectionDivider />

      {/* ═══ READING SECTIONS: First Half (I-VI) ═══ */}
      {readingSections.slice(0, 6).map((config, i) => renderReadingSection(config, i))}

      {/* ═══ MID-READING TRANSITION ═══ */}
      <MidReadingTransition petName={petName} />

      {/* ═══ READING SECTIONS: Second Half (VII-XII) ═══ */}
      {readingSections.slice(6).map((config, i) => renderReadingSection(config, i + 6))}

      {/* ═══ CELESTIAL CHOREOGRAPHY (planetary aspects) ═══ */}
      {report.celestialChoreography && (
        <>
          <ReportSectionCard
            icon="✶"
            iconClass="bg-indigo-500/10"
            label="Celestial Choreography"
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
              <SectionDivider />
            </>
          )}

          {/* ══════════════════════════════════════════
              CHAPTER 3 — THE LIGHTER SIDE
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[2]} />

          {/* ═══ MEME PERSONALITY ═══ */}
          {report.memePersonality && (
            <FunExtrasCard
              icon="😼"
              label="Internet Personality"
              title={report.memePersonality.type}
              description={report.memePersonality.description}
            />
          )}

          {/* ═══ TOP 5 CRIMES ═══ */}
          {report.topFiveCrimes?.crimes && (
            <>
              <CrimesSection crimes={report.topFiveCrimes.crimes} />
              <SectionDivider />
            </>
          )}

          {/* ═══ DATING PROFILE ═══ */}
          {report.datingProfile && (
            <>
              <DatingProfile
                petName={petName}
                datingProfile={report.datingProfile}
                sunSign={sunSign}
                element={element}
              />
              <SectionDivider />
            </>
          )}

          {/* ═══ DREAM JOB ═══ */}
          {report.dreamJob && (
            <FunExtrasCard
              icon="💼"
              label="Dream Job"
              title={report.dreamJob.job}
              description={report.dreamJob.description}
              extra={<span className="text-[0.72rem] text-[#9a8578] italic">Salary: {report.dreamJob.salary}</span>}
            />
          )}

          {/* ═══ VILLAIN ORIGIN STORY ═══ */}
          {report.villainOriginStory && (
            <>
              <VillainOriginStory story={report.villainOriginStory} petName={petName} />
              <SectionDivider />
            </>
          )}

          {/* ═══ QUIRK DECODER ═══ */}
          {report.quirkDecoder && (
            <>
              <QuirkDecoder quirkDecoder={report.quirkDecoder} petName={petName} />
              <SectionDivider />
            </>
          )}

          {/* ══════════════════════════════════════════
              CHAPTER 4 — THEIR SECRET WORLD
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[3]} />

          {/* ═══ GOOGLE SEARCHES ═══ */}
          <GoogleSearches petName={petName} report={report} />
          <SectionDivider />

          {/* ═══ TEXT MESSAGES ═══ */}
          <TextMessages petName={petName} report={report} occasionMode={occasionMode} />
          <SectionDivider />

          {/* ═══ HUMAN PROFILE ═══ */}
          <HumanProfile petName={petName} report={report} occasionMode={occasionMode} />
          <SectionDivider />

          {/* ═══ COSMIC RECIPE ═══ */}
          <CosmicRecipe petName={petName} report={report} />
          <SectionDivider />

          {/* ═══ COSMIC PLAYLIST ═══ */}
          <CosmicPlaylist petName={petName} report={report} />
          <SectionDivider />

          {/* ══════════════════════════════════════════
              CHAPTER 5 — THE BOND
             ══════════════════════════════════════════ */}
          <ChapterTitle chapter={chapters[4]} />

          {/* ═══ KEEPER'S BOND ═══ */}
          {report.keepersBond && (
            <>
              <ReportSectionCard
                icon="💕"
                iconClass="bg-rose-500/10"
                label="Keeper's Bond"
                title={(report.keepersBond as SectionContent).title}
                whyText="Synastry &mdash; the astrology of relationships &mdash; examines how two charts interact. The bond between a pet and their keeper is one of the most pure forms of connection astrologers can study, free from ego or pretence."
                whyBoxIcon="💕"
                content={(report.keepersBond as SectionContent).content}
                tipBox={(report.keepersBond as SectionContent).soulContract ? { icon: '💕', label: 'Soul contract', text: (report.keepersBond as SectionContent).soulContract! } : undefined}
                funFact={(report.keepersBond as SectionContent).funFact}
                variant={1}
              />
              <SectionDivider />
            </>
          )}

          {/* ═══ ACCURACY PREDICTIONS ═══ */}
          {report.accuracyMoments && (
            <>
              <AccuracyPredictions accuracyMoments={report.accuracyMoments} />
              <SectionDivider />
            </>
          )}

          {/* ═══ COMPATIBILITY CHART ═══ */}
          {report.compatibilityNotes && (
            <>
              <CompatibilityChart
                compatibilityNotes={report.compatibilityNotes}
                petName={petName}
              />
              <SectionDivider />
            </>
          )}

          {/* ═══ EARTHLY EXPRESSION (if exists) ═══ */}
          {report.earthlyExpression && (
            <>
              <ReportSectionCard
                icon="🌎"
                iconClass="bg-green-500/10"
                label="Earthly Expression"
                title={report.earthlyExpression.title}
                content={report.earthlyExpression.content}
                tipBox={
                  report.earthlyExpression.practicalTip
                    ? { icon: '💡', label: 'Practical tip', text: report.earthlyExpression.practicalTip }
                    : undefined
                }
                funFact={report.earthlyExpression.funFact}
              />
              <SectionDivider />
            </>
          )}

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

          {/* ═══ COSMIC NAME MEANING ═══ */}
          {report.nameMeaning && (
            <>
              <CosmicNameMeaning nameMeaning={report.nameMeaning} />
              <SectionDivider />
            </>
          )}

          {/* ═══ BASED ON YOUR ANSWERS ═══ */}
          {report.basedOnYourAnswers && (
            <>
              <BasedOnYourAnswers data={report.basedOnYourAnswers} />
              <SectionDivider />
            </>
          )}

          {/* ═══ SOUL LETTER (epilogue) ═══ */}
          <SoulLetter
            petName={petName}
            epilogue={report.epilogue}
            sunSign={sunSign}
            occasionMode={occasionMode}
          />
          <SectionDivider />

          {/* ═══ HOROSCOPE SUBSCRIPTION ═══ */}
          <div className="text-center py-8 px-6 max-w-[520px] mx-auto">
            {!hasActiveHoroscope ? (
              <Button
                onClick={handleSubscribeWeekly}
                disabled={isSubscribing}
                className="gap-2"
                variant="outline"
              >
                <Mail className="w-4 h-4" />
                {isSubscribing ? 'Loading...' : 'Weekly Horoscopes - $4.99/mo'}
              </Button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                Weekly Horoscopes Active
              </div>
            )}
          </div>

          {/* ═══ SOULSPEAK CTA ═══ */}
          {!isPreview && reportId && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mx-4 my-6 max-w-[520px] sm:mx-auto"
            >
              <a
                href={`/soul-chat.html?id=${reportId}`}
                className="block p-7 rounded-[18px] text-center no-underline relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(165deg, #3d2f2a 0%, #5a3e2e 50%, #3d2f2a 100%)',
                  boxShadow: '0 4px 24px rgba(61,47,42,0.3)',
                }}
              >
                <div className="text-[1.6rem] mb-2">✨</div>
                <div
                  className="text-[1.15rem] text-white leading-tight mb-2"
                  style={{ fontFamily: 'DM Serif Display, serif' }}
                >
                  {petName} has more to tell you
                </div>
                <p className="text-[0.82rem] text-white/70 leading-[1.6] max-w-xs mx-auto mb-4"
                  style={{ fontFamily: 'Cormorant, serif' }}
                >
                  Ask {petName} anything. Why they do the things they do, what they dream about, or just tell them how you feel.
                </p>
                <span
                  className="inline-block px-6 py-2.5 rounded-full text-[0.8rem] font-semibold tracking-[0.5px]"
                  style={{
                    background: 'linear-gradient(135deg, #c4a265, #d4b87a)',
                    color: '#3d2f2a',
                  }}
                >
                  Talk to {petName}&rsquo;s Soul
                </span>
              </a>
            </motion.div>
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
// CHAPTER TITLE
// ═══════════════════════════════════════════════
function ChapterTitle({ chapter }: { chapter: typeof chapters[number] }) {
  const s = useScrollReveal();

  return (
    <motion.div
      id={`chapter-${chapter.number}`}
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="text-center py-10 px-6 max-w-[520px] mx-auto"
    >
      <div
        className="py-8 px-6 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(196,162,101,0.06) 0%, rgba(245,239,230,0.8) 50%, rgba(196,162,101,0.04) 100%)',
        }}
      >
        <div className="text-[0.6rem] font-bold tracking-[3px] uppercase text-[#c4a265] mb-2">
          Chapter {chapter.number}
        </div>
        <h2
          className="text-[1.8rem] text-[#3d2f2a] leading-tight mb-1.5"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {chapter.title}
        </h2>
        <p
          className="text-[0.9rem] text-[#9a8578] italic"
          style={{ fontFamily: 'Cormorant, serif' }}
        >
          {chapter.subtitle}
        </p>
        {/* Decorative line */}
        <div className="w-12 h-[1px] bg-[#c4a265]/30 mx-auto mt-4" />
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
  const s = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  return (
    <>
      {/* Emotional intro before the monologue */}
      <motion.div
        ref={intro.ref}
        initial="hidden"
        animate={intro.isInView ? 'visible' : 'hidden'}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1, ease: 'easeOut' } } }}
        className="text-center px-6 py-6 max-w-[520px] mx-auto"
      >
        <p
          className="text-[1.05rem] text-[#9a8578] italic leading-[1.7]"
          style={{ fontFamily: 'Cormorant, serif' }}
        >
          If {petName} could speak to you, just once, in words you could understand&hellip;
        </p>
      </motion.div>

      <motion.div
        ref={s.ref}
        initial="hidden"
        animate={s.isInView ? 'visible' : 'hidden'}
        variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: 'easeOut' } } }}
        className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
      >
        <div
          className="p-10 rounded-[18px] text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(165deg, #faf6ef 0%, #f5ede0 40%, #f0e6d6 100%)',
            boxShadow: '0 4px 24px rgba(196,162,101,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
            border: '1px solid rgba(196,162,101,0.15)',
          }}
        >
          {/* Soft corner accents */}
          <div className="absolute top-0 left-0 w-24 h-24 rounded-full opacity-25 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.15), transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full opacity-25 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.15), transparent 70%)' }} />

          {/* Opening quote */}
          <div className="text-[4.5rem] leading-none text-[#c4a265]/35 font-serif mb-[-1.2rem]">&ldquo;</div>

          <p
            className="text-[1.08rem] text-[#3d2f2a] leading-[2] italic px-3 max-w-md mx-auto"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {monologue.monologue}
          </p>

          {/* Closing quote */}
          <div className="text-[4.5rem] leading-none text-[#c4a265]/35 font-serif mt-[-0.6rem]">&rdquo;</div>

          <div className="w-10 h-[1px] bg-[#c4a265]/30 mx-auto my-3" />

          {/* Attribution */}
          <div className="text-[0.85rem] text-[#3d2f2a] font-bold">
            — {petName} {signIcon}
          </div>
          <div className="text-[0.68rem] text-[#9a8578]/70 mt-0.5">{sunSign}</div>

          {/* Post script */}
          {monologue.postScript && (
            <p className="mt-5 text-[0.82rem] text-[#6b4c3b] italic opacity-80 max-w-sm mx-auto" style={{ fontFamily: 'Cormorant, serif' }}>
              P.S. {monologue.postScript}
            </p>
          )}
        </div>
      </motion.div>
    </>
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
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265] mb-1">
        🦹 Villain Origin Story
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-3.5">
        {petName}'s Descent into Chaos
      </h3>

      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.label}>
            <div className="text-[0.68rem] font-bold text-[#9a8578] uppercase tracking-[1px] mb-0.5">
              {s.icon} {s.label}
            </div>
            <p className="text-[0.82rem] text-[#5a4a42] leading-[1.65]"
               dangerouslySetInnerHTML={{ __html: (s.text || '').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '• ') }}
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
      <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265] mb-1 px-1">
        🔍 Quirk Decoder
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-3 px-1">
        Why {petName} Does That
      </h3>

      <div className="space-y-3">
        {quirks.map((quirk, i) => (
          <div key={i} className="p-4 bg-white rounded-[14px] border border-[#e8ddd0]">
            <h4 className="font-dm-serif text-[0.95rem] text-[#3d2f2a] mb-2.5">
              {quirk.behavior}
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-[0.64rem] font-bold text-[#c4a265] uppercase tracking-[1px]">Cosmic explanation</span>
                <p className="text-[0.8rem] text-[#5a4a42] leading-[1.6] mt-0.5">{quirk.cosmicExplanation}</p>
              </div>
              <div>
                <span className="text-[0.64rem] font-bold text-[#9a8578] uppercase tracking-[1px]">What it really means</span>
                <p className="text-[0.8rem] text-[#5a4a42] leading-[1.6] mt-0.5">{quirk.whatItReallyMeans}</p>
              </div>
            </div>
          </div>
        ))}
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
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.64rem] font-bold text-[#9a8578] uppercase tracking-[1px] mb-0.5">
        {icon} {label}
      </div>
      <div className="font-dm-serif text-[0.95rem] text-[#3d2f2a]">{title}</div>
      {description && (
        <p className="text-[0.82rem] text-[#5a4a42] leading-[1.6] mt-1"
           dangerouslySetInnerHTML={{ __html: (description || '').replace(/ — /g, '. ').replace(/ – /g, '. ').replace(/^- /gm, '• ') }}
        />
      )}
      {extra && <div className="mt-1.5">{extra}</div>}
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
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.64rem] font-bold text-[#9a8578] uppercase tracking-[1px] mb-0.5">
        🚨 Criminal Record
      </div>
      <div className="text-[0.82rem] text-[#5a4a42] leading-[1.6]">
        {crimes.map((crime, i) => (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: `${i + 1}. ${(crime || '').replace(/ — /g, '. ').replace(/ – /g, '. ')}` }} />
            {i < crimes.length - 1 && <br />}
          </span>
        ))}
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
  const s = useScrollReveal();

  return (
    <div className="text-center px-6 py-10 max-w-[520px] mx-auto">
      {/* Zodiac circle / portrait */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="relative mx-auto mb-6"
        style={{ width: portraitUrl ? 160 : 130, height: portraitUrl ? 160 : 130 }}
      >
        {portraitUrl ? (
          <>
            <img
              src={portraitUrl}
              alt={petName}
              className="w-full h-full object-cover rounded-full"
              style={{ border: '3px solid #c4a265', boxShadow: '0 0 40px rgba(196,162,101,0.2)' }}
            />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md border border-[#e8ddd0]">
              <span className="text-xl">{signIcon}</span>
            </div>
          </>
        ) : (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-[4rem]"
            style={{
              background: 'linear-gradient(135deg, rgba(196,162,101,0.2), rgba(196,162,101,0.05))',
              border: '2px solid rgba(196,162,101,0.3)',
              boxShadow: '0 0 60px rgba(196,162,101,0.15)',
            }}
          >
            {signIcon}
          </div>
        )}
      </motion.div>

      {/* Archetype */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1"
      >
        {archetype}
      </motion.div>

      {/* Pet name */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="font-dm-serif text-[2.8rem] text-[#3d2f2a] leading-tight mb-2"
      >
        {petName}
      </motion.h1>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-2 text-[0.75rem]"
      >
        <span className="px-3 py-1 rounded-full bg-white border border-[#e8ddd0] text-[#5a4a42]">
          ☉ {sunSign}
        </span>
        <span className="px-3 py-1 rounded-full bg-white border border-[#e8ddd0] text-[#5a4a42]">
          ☽ {moonSign}
        </span>
        {ascendant && (
          <span className="px-3 py-1 rounded-full bg-white border border-[#e8ddd0] text-[#5a4a42]">
            ⬆ {ascendant}
          </span>
        )}
        <span className="px-3 py-1 rounded-full bg-white border border-[#e8ddd0] text-[#5a4a42]">
          {element === 'Fire' ? '🔥' : element === 'Earth' ? '🌍' : element === 'Air' ? '💨' : '💧'} {element}
        </span>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// LUCKY GRID
// ═══════════════════════════════════════════════
function LuckyGrid({ luckyElements }: { luckyElements: ReportContent['luckyElements'] }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="grid grid-cols-2 gap-2 mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      {[
        { label: 'Lucky Number', value: luckyElements.luckyNumber },
        { label: 'Lucky Day', value: luckyElements.luckyDay },
        { label: 'Lucky Colour', value: luckyElements.luckyColor },
        { label: 'Power Time', value: luckyElements.powerTime },
      ].map((item) => (
        <div
          key={item.label}
          className="bg-white border border-[#e8ddd0] rounded-xl p-3.5 text-center"
        >
          <div className="text-[0.56rem] font-bold tracking-[1.5px] uppercase text-[#9a8578] mb-0.5">
            {item.label}
          </div>
          <div className="font-dm-serif text-[1.05rem] text-[#3d2f2a]">{item.value}</div>
        </div>
      ))}
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
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } } }}
      className="mx-4 my-4 max-w-[520px] sm:mx-auto text-center"
    >
      <div className="text-[0.56rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-3">
        Prologue
      </div>
      <p
        className="text-[1rem] text-[#5a4a42] leading-[2] italic px-4"
        style={{ fontFamily: 'Cormorant, serif' }}
        dangerouslySetInnerHTML={{ __html: prologue.replace(/\n\n/g, '<br /><br />') }}
      />
      <div className="w-12 h-[1px] bg-[#c4a265]/30 mx-auto mt-6" />
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
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } } }}
      className="text-center px-8 py-10 max-w-[520px] mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-2">
        Going Deeper
      </div>
      <h2
        className="text-[1.4rem] text-[#3d2f2a] leading-tight mb-2"
        style={{ fontFamily: 'DM Serif Display, serif' }}
      >
        The Hidden Layers of {petName}&rsquo;s Soul
      </h2>
      <p
        className="text-[0.88rem] text-[#9a8578] italic leading-[1.7] max-w-[380px] mx-auto"
        style={{ fontFamily: 'Cormorant, serif' }}
      >
        The outer planets, karmic points, and soul contracts reveal what lies beneath the surface.
      </p>
      <div className="w-10 h-0.5 bg-[#c4a265] mx-auto mt-5 rounded-sm" />
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

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[1rem] flex-shrink-0 bg-emerald-500/10">
          💎
        </div>
        <div>
          <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265]">Celestial Gem</div>
          <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mt-px">{gem.crystalName || gem.title}</h3>
        </div>
      </div>
      {gem.crystalMeaning && (
        <p className="text-[0.82rem] text-[#5a4a42] leading-[1.65] mb-2">{gem.crystalMeaning}</p>
      )}
      {gem.howToUse && (
        <div className="p-3 rounded-xl bg-[#faf6ef] border border-[#e8ddd0]/50">
          <div className="text-[0.64rem] font-bold text-[#c4a265] uppercase tracking-[1px] mb-0.5">
            💡 How to use
          </div>
          <p className="text-[0.78rem] text-[#5a4a42] leading-[1.6]">{gem.howToUse}</p>
        </div>
      )}
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
        className="p-6 rounded-[14px] text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #faf6ef, #f5ede0, #faf6ef)' }}
      >
        <div className="text-[0.56rem] font-bold tracking-[2px] uppercase text-[#c4a265] mb-1">
          🌟 Eternal Archetype
        </div>
        <div
          className="text-[1.3rem] text-[#3d2f2a] mb-2"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {archetype.archetypeName || archetype.title}
        </div>
        {archetype.archetypeStory && (
          <p
            className="text-[0.9rem] text-[#5a4a42] leading-[1.7] italic max-w-md mx-auto mb-3"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {archetype.archetypeStory}
          </p>
        )}
        {archetype.archetypeLesson && (
          <div className="p-3 rounded-xl bg-white/60 border border-[#e8ddd0]/50 text-left">
            <div className="text-[0.64rem] font-bold text-[#c4a265] uppercase tracking-[1px] mb-0.5">
              ✦ {petName}'s Lesson
            </div>
            <p className="text-[0.78rem] text-[#5a4a42] leading-[1.6]">{archetype.archetypeLesson}</p>
          </div>
        )}
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
  onRequestTestimonial,
}: Pick<CosmicReportViewerProps, 'petName' | 'report' | 'isPreview' | 'onUnlockFull' | 'onRequestTestimonial'>) {
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

        {onRequestTestimonial && !isPreview && (
          <div className="text-center pt-8 pb-4">
            <button
              onClick={onRequestTestimonial}
              className="text-[0.82rem] text-[#9a8578] hover:text-[#bf524a] transition-colors font-[Cormorant,serif] underline underline-offset-4"
            >
              Rate your reading
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
