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
import { TradingCard } from './TradingCard';
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
}

// Section configuration for the 10 reading sections
const readingSections = [
  {
    key: 'solarSoulprint' as const,
    icon: '☉',
    iconClass: 'bg-amber-500/10',
    label: 'I · Solar Soulprint',
    whyBoxIcon: '☉',
    whyPrefix: '<strong>Why the Sun matters:</strong> The Sun sign is the foundation of personality — core identity, life force, and the energy that makes them who they are at the deepest level.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'lunarHeart' as const,
    icon: '☽',
    iconClass: 'bg-violet-500/10',
    label: 'II · Lunar Heart',
    whyBoxIcon: '☽',
    whyPrefix: '<strong>Why the Moon matters:</strong> For animals, the Moon is arguably more important than the Sun. It governs instinct, emotional needs, and the unconscious patterns that shape daily behaviour.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'cosmicCuriosity' as const,
    icon: '☿',
    iconClass: 'bg-sky-400/10',
    label: 'III · Cosmic Curiosity',
    whyBoxIcon: '☿',
    whyPrefix: '<strong>Why Mercury matters:</strong> Mercury governs communication and intelligence. It determines how your pet expresses themselves, processes information, and connects with you.',
    tipIcon: '💡',
    tipLabel: 'Try this',
  },
  {
    key: 'harmonyHeartbeats' as const,
    icon: '♀',
    iconClass: 'bg-pink-500/10',
    label: 'IV · Harmony & Heartbeats',
    whyBoxIcon: '♀',
    whyPrefix: '<strong>Why Venus matters:</strong> Venus is the planet of love and pleasure. It reveals love language — how your pet gives affection, what brings joy, and what they need to feel cherished.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'spiritOfMotion' as const,
    icon: '♂',
    iconClass: 'bg-red-500/10',
    label: 'V · Spirit of Motion',
    whyBoxIcon: '♂',
    whyPrefix: '<strong>Why Mars matters:</strong> Mars governs physical energy, drive, and instinct. It determines whether your pet is a sprinter or a slow burner, a fighter or a lover.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'starlitGaze' as const,
    icon: '⬆',
    iconClass: 'bg-purple-500/10',
    label: 'VI · Starlit Gaze',
    whyBoxIcon: '⬆',
    whyPrefix: '<strong>Why the Ascendant matters:</strong> The rising sign is the "mask" — what others see before they know the real personality. It shapes first impressions and physical presence.',
    tipIcon: '💡',
    tipLabel: 'Practical tip',
  },
  {
    key: 'destinyCompass' as const,
    icon: '🧭',
    iconClass: 'bg-green-500/10',
    label: 'VII · Destiny Compass',
    whyBoxIcon: undefined,
    whyPrefix: undefined,
    tipIcon: '🧭',
    tipLabel: 'Past life hint',
  },
  {
    key: 'gentleHealer' as const,
    icon: '💚',
    iconClass: 'bg-teal-500/10',
    label: 'VIII · Gentle Healer',
    whyBoxIcon: undefined,
    whyPrefix: undefined,
    tipIcon: '💚',
    tipLabel: 'Healing tip',
  },
  {
    key: 'wildSpirit' as const,
    icon: '🌀',
    iconClass: 'bg-violet-600/10',
    label: 'IX · Wild Spirit',
    whyBoxIcon: undefined,
    whyPrefix: undefined,
    tipIcon: '🌀',
    tipLabel: 'Wild wisdom',
  },
  {
    key: 'keepersBond' as const,
    icon: '💕',
    iconClass: 'bg-rose-500/10',
    label: "X · Keeper's Bond",
    whyBoxIcon: undefined,
    whyPrefix: undefined,
    tipIcon: '💕',
    tipLabel: 'Soul contract',
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

      {/* ═══ METHODOLOGY ═══ */}
      <ReportMethodology petName={petName} />
      <SectionDivider />

      {/* ═══ PLANET EXPLAINERS ═══ */}
      <PlanetExplainers />
      <SectionDivider />

      {/* ═══ READING TRANSITION ═══ */}
      <ReadingTransition petName={petName} />

      {/* ═══ BIRTH CHART TABLE ═══ */}
      <BirthChartTable chartPlacements={report.chartPlacements || {}} petName={petName} />
      <SectionDivider />

      {/* ═══ AURA VISUAL ═══ */}
      <AuraVisual aura={report.aura} sunSign={sunSign} />

      {/* ═══ ELEMENTAL BALANCE ═══ */}
      <ElementalBalance
        elementalBalance={report.elementalBalance || {}}
        dominantElement={element}
        petName={petName}
      />
      <SectionDivider />

      {/* ═══ 10 READING SECTIONS ═══ */}
      {readingSections.map((config) => {
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
            />
            <SectionDivider />
          </div>
        );
      })}

      {/* ═══ UNLOCK CTA (preview mode) ═══ */}
      {isPreview && onUnlockFull && (
        <div className="text-center py-12 px-6">
          <div className="max-w-[520px] mx-auto p-8 rounded-[14px] bg-white border border-[#e8ddd0]">
            <Gift className="w-12 h-12 mx-auto text-[#c4a265] mb-4" />
            <h3 className="font-dm-serif text-2xl text-[#3d2f2a] mb-2">Unlock the Full Little Souls Reading</h3>
            <p className="text-[#9a8578] text-[0.84rem] mb-6 max-w-md mx-auto">
              Get all 10 reading sections, the soul letter, trading card, fun sections, and more.
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
          {/* ═══ SOUL LETTER ═══ */}
          <SoulLetter
            petName={petName}
            epilogue={report.epilogue}
            sunSign={sunSign}
            occasionMode={occasionMode}
          />
          <SectionDivider />

          {/* ═══ TRADING CARD ═══ */}
          <TradingCard
            petName={petName}
            sunSign={sunSign}
            moonSign={moonSign}
            element={element}
            archetype={report.archetype?.name || 'Cosmic Soul'}
            portraitUrl={portraitUrl}
            aura={report.aura}
            luckyElements={report.luckyElements}
            crystal={report.crystal}
            occasionMode={occasionMode}
          />
          <SectionDivider />

          {/* ═══ COSMIC NAME MEANING ═══ */}
          {report.nameMeaning && (
            <>
              <CosmicNameMeaning nameMeaning={report.nameMeaning} />
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
            </>
          )}

          {/* ═══ LUCKY ELEMENTS ═══ */}
          {report.luckyElements && (
            <LuckyGrid luckyElements={report.luckyElements} />
          )}

          {/* ═══ COSMIC PLAYLIST ═══ */}
          <CosmicPlaylist petName={petName} report={report} />
          <SectionDivider />

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

          {/* ═══ FUN EXTRAS ═══ */}
          {(report.memePersonality || report.topFiveCrimes || report.dreamJob) && (
            <>
              <FunExtras report={report} />
              <SectionDivider />
            </>
          )}

          {/* ═══ SHAREABLE CARD ═══ */}
          <ShareableCard
            petName={petName}
            sunSign={sunSign}
            moonSign={moonSign}
            archetype={report.archetype?.name || 'Cosmic Soul'}
            element={element}
            reportId={reportId}
            ascendant={ascendant}
          />

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
      {!isPreview && <SoulSpeakFAB reportId={reportId} />}
    </div>
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
// FUN EXTRAS (meme, dream job, dating, crimes)
// ═══════════════════════════════════════════════
function FunExtras({ report }: { report: ReportContent }) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265] mb-3.5">
        🎉 The Fun Extras
      </div>

      {report.memePersonality && (
        <div className="mb-3.5">
          <div className="text-[0.64rem] font-bold text-[#9a8578] uppercase tracking-[1px] mb-0.5">
            😼 Internet Personality
          </div>
          <div className="font-dm-serif text-[0.95rem] text-[#3d2f2a]">
            {report.memePersonality.type}
          </div>
        </div>
      )}

      {report.dreamJob && (
        <div className="mb-3.5">
          <div className="text-[0.64rem] font-bold text-[#9a8578] uppercase tracking-[1px] mb-0.5">
            💼 Dream Job
          </div>
          <div className="font-dm-serif text-[0.95rem] text-[#3d2f2a]">
            {report.dreamJob.job}
          </div>
        </div>
      )}

      {report.topFiveCrimes?.crimes && (
        <div className="mb-3.5">
          <div className="text-[0.64rem] font-bold text-[#9a8578] uppercase tracking-[1px] mb-0.5">
            🚨 Criminal Record
          </div>
          <div className="text-[0.82rem] text-[#5a4a42] leading-[1.6]">
            {report.topFiveCrimes.crimes.map((crime, i) => (
              <span key={i}>
                {i + 1}. {crime}
                {i < report.topFiveCrimes!.crimes.length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>
      )}
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
