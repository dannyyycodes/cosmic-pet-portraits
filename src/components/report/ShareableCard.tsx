import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';
import { ChartPlacement } from './types';

interface ShareableCardProps {
  petName: string;
  sunSign: string;
  moonSign: string;
  archetype: string;
  element: string;
  reportId?: string;
  ascendant?: string;
  portraitUrl?: string;
  occasionMode?: string;
  chartPlacements?: Record<string, ChartPlacement>;
  shareableCard?: {
    cosmicNickname: string;
    sixKeyTraits: string[];
    signatureLine: string;
  };
}

const elementConfig: Record<string, { emoji: string; accent: string }> = {
  Fire: { emoji: '🔥', accent: '#c4a265' },
  Water: { emoji: '💧', accent: '#7ba7c9' },
  Air: { emoji: '💨', accent: '#b8a0d4' },
  Earth: { emoji: '🌿', accent: '#8fae7e' },
};

interface StatDef {
  label: string;
  planets: string[];
  min: number;
}

const statDefs: StatDef[] = [
  { label: 'Cuddle', planets: ['venus', 'moon'], min: 75 },
  { label: 'Chaos', planets: ['mars', 'lilith'], min: 70 },
  { label: 'Loyalty', planets: ['saturn', 'sun'], min: 80 },
  { label: 'Sass', planets: ['mercury', 'ascendant'], min: 72 },
  { label: 'Psychic', planets: ['moon', 'neptune', 'chiron'], min: 75 },
  { label: 'Zoomie', planets: ['mars', 'jupiter'], min: 70 },
];

function calculateStat(
  planets: string[],
  chartPlacements: Record<string, ChartPlacement> | undefined,
  min: number,
): number {
  if (!chartPlacements) return min + 15;
  let total = 0;
  let count = 0;
  for (const p of planets) {
    const placement = chartPlacements[p];
    if (placement) {
      // Normalize degree (0-360) to a 60-100 range
      const degNorm = 60 + (placement.degree / 360) * 40;
      total += degNorm;
      count++;
    }
  }
  const base = count > 0 ? total / count : 75;
  const inflated = Math.round(base + 15); // +15 base inflation
  return Math.max(min, Math.min(99, inflated));
}

function calculateOVR(stats: number[]): number {
  const avg = stats.reduce((a, b) => a + b, 0) / stats.length;
  return Math.max(85, Math.round(avg));
}

export function ShareableCard({
  petName,
  sunSign,
  moonSign,
  archetype,
  element,
  reportId,
  ascendant,
  portraitUrl,
  occasionMode = 'discover',
  chartPlacements,
  shareableCard,
}: ShareableCardProps) {
  const header = useScrollReveal();
  const card = useScrollReveal();
  const [copied, setCopied] = useState(false);

  const sunData = zodiacSigns[sunSign.toLowerCase()];
  const moonData = zodiacSigns[moonSign.toLowerCase()];
  const sunIcon = sunData?.icon || '⭐';
  const moonIcon = moonData?.icon || '🌙';
  const ascData = ascendant ? zodiacSigns[ascendant.toLowerCase()] : null;
  const ascIcon = ascData?.icon || '⬆';

  const elCfg = elementConfig[element] || elementConfig.Fire;
  const nickname = shareableCard?.cosmicNickname || archetype;

  const isMemorial = occasionMode === 'memorial';
  const isBirthday = occasionMode === 'birthday';
  const isGift = occasionMode === 'gift';

  // Calculate stats
  const stats = statDefs.map((sd) => ({
    label: sd.label,
    value: calculateStat(sd.planets, chartPlacements, sd.min),
  }));
  const ovr = calculateOVR(stats.map((s) => s.value));

  // Collector number from reportId
  const collectorNum = reportId
    ? reportId.replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase()
    : 'UNIQUE';

  const shareUrl = reportId
    ? `${window.location.origin}/view-report?id=${reportId}`
    : window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${petName}'s Little Souls Reading`,
          text: `${petName} is a ${sunSign} ${archetype}! Check out their cosmic soul reading.`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    }
  };

  // Memorial traits from shareableCard
  const traits = shareableCard?.sixKeyTraits || [];

  // Occasion badge
  const occasionBadge = isBirthday
    ? '🎂 Birthday Edition'
    : isMemorial
      ? '🌈 Forever in the Stars'
      : isGift
        ? '🎁 Gifted with Love'
        : null;

  // Card background — memorial gets softer tones
  const cardBg = isMemorial
    ? 'linear-gradient(155deg, #FFFDF5 0%, #f5ede3 50%, #ebe3d9 100%)'
    : 'linear-gradient(155deg, #FFFDF5 0%, #faf3e8 50%, #f0e6d6 100%)';

  const goldAccent = '#c4a265';

  return (
    <>
      <motion.div
        ref={header.ref}
        initial="hidden"
        animate={header.isInView ? 'visible' : 'hidden'}
        variants={header.variants}
        className="text-center px-6 py-5 max-w-[520px] mx-auto"
      >
        <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
          Collector's Edition
        </div>
        <h2 className="font-dm-serif text-2xl text-[#3d2f2a] leading-tight mt-1.5">
          {petName}'s Cosmic Card
        </h2>
        <p className="text-[0.84rem] leading-[1.75] text-[#9a8578] max-w-[340px] mx-auto mt-1">
          Screenshot and share — every card is one of a kind.
        </p>
      </motion.div>

      <motion.div
        ref={card.ref}
        initial="hidden"
        animate={card.isInView ? 'visible' : 'hidden'}
        variants={card.variants}
        className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
      >
        <div
          className="max-w-[340px] mx-auto rounded-[20px] overflow-hidden relative"
          style={{
            background: cardBg,
            boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 0 0 2px ${goldAccent}40`,
          }}
        >
          {/* Top badges row */}
          <div className="flex justify-between items-center px-3.5 pt-3 pb-1">
            <span
              className="text-[0.55rem] font-extrabold tracking-[2px] uppercase px-2 py-0.5 rounded-md"
              style={{ color: goldAccent, background: `${goldAccent}15`, border: `1px solid ${goldAccent}25` }}
            >
              ✦ LEGENDARY
            </span>
            <span
              className="text-[0.58rem] font-bold px-2 py-0.5 rounded-md"
              style={{ color: elCfg.accent, background: `${elCfg.accent}15`, border: `1px solid ${elCfg.accent}25` }}
            >
              {elCfg.emoji} {element}
            </span>
          </div>

          {/* Occasion badge */}
          {occasionBadge && (
            <div className="text-center -mt-0.5 mb-1">
              <span
                className="text-[0.58rem] font-bold px-2.5 py-0.5 rounded-full inline-block"
                style={{
                  color: isMemorial ? '#7a6b5e' : goldAccent,
                  background: isMemorial ? 'rgba(122,107,94,0.08)' : `${goldAccent}12`,
                }}
              >
                {occasionBadge}
              </span>
            </div>
          )}

          {/* Portrait + OVR */}
          <div className="relative flex justify-center pt-2 pb-1">
            {/* OVR badge */}
            {!isMemorial && (
              <div
                className="absolute top-1 right-3.5 flex flex-col items-center"
                style={{ zIndex: 2 }}
              >
                <span className="text-[0.45rem] font-bold tracking-[1.5px] uppercase" style={{ color: goldAccent }}>
                  OVR
                </span>
                <span
                  className="font-dm-serif text-[1.6rem] leading-none font-bold"
                  style={{ color: '#3d2f2a' }}
                >
                  {ovr}
                </span>
              </div>
            )}

            {/* Pet photo circle */}
            <div
              className="w-[100px] h-[100px] rounded-full overflow-hidden flex items-center justify-center"
              style={{
                border: `3px solid ${goldAccent}40`,
                background: portraitUrl
                  ? `url(${portraitUrl}) center/cover`
                  : `linear-gradient(135deg, ${elCfg.accent}15, ${goldAccent}10)`,
              }}
            >
              {!portraitUrl && <span className="text-[2.8rem]">{sunIcon}</span>}
            </div>

            {/* Zodiac badge */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 px-2.5 py-0.5 rounded-full text-[0.75rem]"
              style={{
                background: '#FFFDF5',
                border: `1.5px solid ${goldAccent}40`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              {sunIcon}
            </div>
          </div>

          {/* Name + nickname */}
          <div className="text-center pt-4 pb-1 px-4">
            <h3 className="font-dm-serif text-[1.5rem] text-[#3d2f2a] leading-tight">{petName}</h3>
            <div className="text-[0.75rem] font-semibold mt-0.5" style={{ color: goldAccent }}>
              {nickname}
            </div>
          </div>

          {/* Sun / Moon / Rising */}
          <div className="flex justify-center gap-4 py-2 text-center">
            {[
              { icon: sunIcon, label: `${sunSign} Sun`, key: 'sun' },
              { icon: moonIcon, label: `${moonSign} Moon`, key: 'moon' },
              ...(ascendant ? [{ icon: ascIcon, label: `${ascendant} Rising`, key: 'asc' }] : []),
            ].map((item) => (
              <div key={item.key} className="flex flex-col items-center gap-0.5">
                <span className="text-[1rem]">{item.icon}</span>
                <span className="text-[0.58rem] text-[#9a8578] font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Stats or Traits (memorial mode) */}
          {isMemorial ? (
            <div className="px-4 pb-3">
              <div className="grid grid-cols-2 gap-1.5">
                {traits.slice(0, 6).map((trait, i) => (
                  <div
                    key={i}
                    className="px-2 py-2 rounded-lg text-center"
                    style={{ background: 'rgba(122,107,94,0.06)', border: '1px solid rgba(122,107,94,0.1)' }}
                  >
                    <span className="text-[0.68rem] text-[#5a4a42] font-medium">{trait}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 pt-1 pb-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-1.5">
                    <span className="text-[0.62rem] text-[#5a4a42] font-semibold w-[50px] flex-shrink-0">
                      {stat.label}
                    </span>
                    <div
                      className="flex-1 h-[6px] rounded-full overflow-hidden"
                      style={{ background: 'rgba(61,47,42,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: card.isInView ? `${stat.value}%` : '0%',
                          background:
                            stat.value >= 90
                              ? `linear-gradient(90deg, ${goldAccent}, #dfc07a)`
                              : `linear-gradient(90deg, ${elCfg.accent}cc, ${elCfg.accent})`,
                          transition: 'width 1.5s ease-out',
                        }}
                      />
                    </div>
                    <span
                      className="text-[0.58rem] font-bold w-5 text-right"
                      style={{ color: stat.value >= 90 ? goldAccent : '#5a4a42' }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            className="flex justify-between items-center px-3.5 py-2.5 border-t"
            style={{ borderColor: `${goldAccent}15` }}
          >
            <span className="text-[0.5rem] font-bold tracking-[1.5px] uppercase" style={{ color: `${goldAccent}80` }}>
              LITTLE SOULS
            </span>
            <span className="text-[0.48rem] font-mono tracking-[0.5px]" style={{ color: '#9a857860' }}>
              #{collectorNum}
            </span>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 justify-center mt-4">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-[10px] border border-[#e8ddd0] bg-[#faf6ef] text-[0.75rem] font-semibold text-[#6b4c3b] cursor-pointer font-[DM_Sans,sans-serif]"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="px-4 py-2 rounded-[10px] border border-[#e8ddd0] bg-[#faf6ef] text-[0.75rem] font-semibold text-[#6b4c3b] cursor-pointer font-[DM_Sans,sans-serif]"
            >
              Share
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
