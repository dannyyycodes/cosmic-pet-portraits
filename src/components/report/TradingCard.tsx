import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';

interface TradingCardProps {
  petName: string;
  sunSign: string;
  moonSign: string;
  element: string;
  archetype: string;
  portraitUrl?: string;
  aura: { primary: string; secondary: string; meaning: string };
  luckyElements: { luckyNumber: string; luckyDay: string; luckyColor: string; powerTime: string };
  crystal?: { name: string; meaning: string; color: string };
  birthYear?: string;
  occasionMode?: string;
}

function generatePowerStats(element: string, sunSign: string) {
  const base: Record<string, number> = {
    'Emotional Depth': 80,
    'Guilt Trip Power': 75,
    'Sock Theft Skill': 70,
    'Strategic Napping': 78,
    'Psychic Staring': 82,
    'Selective Zoomies': 72,
  };

  // Adjust by element
  if (element === 'Water') {
    base['Emotional Depth'] = 95;
    base['Psychic Staring'] = 92;
  } else if (element === 'Fire') {
    base['Selective Zoomies'] = 95;
    base['Guilt Trip Power'] = 88;
  } else if (element === 'Earth') {
    base['Strategic Napping'] = 93;
    base['Sock Theft Skill'] = 85;
  } else if (element === 'Air') {
    base['Psychic Staring'] = 90;
    base['Guilt Trip Power'] = 86;
  }

  // Ensure all 65+ min
  return Object.fromEntries(
    Object.entries(base).map(([k, v]) => [k, Math.max(65, v)])
  );
}

const powerGradients: Record<string, string> = {
  'Emotional Depth': 'linear-gradient(90deg, #8b5cf6, #c084fc)',
  'Guilt Trip Power': 'linear-gradient(90deg, #ec4899, #f472b6)',
  'Sock Theft Skill': 'linear-gradient(90deg, #f59e0b, #fbbf24)',
  'Strategic Napping': 'linear-gradient(90deg, #14b8a6, #5eead4)',
  'Psychic Staring': 'linear-gradient(90deg, #6366f1, #a78bfa)',
  'Selective Zoomies': 'linear-gradient(90deg, #ef4444, #f87171)',
};

const powerEmojis: Record<string, string> = {
  'Emotional Depth': '😭',
  'Guilt Trip Power': '🥺',
  'Sock Theft Skill': '🧦',
  'Strategic Napping': '💤',
  'Psychic Staring': '👁️',
  'Selective Zoomies': '⚡',
};

const elementEmojis: Record<string, string> = {
  Fire: '🔥', Earth: '🌍', Air: '💨', Water: '💧',
};

export function TradingCard({
  petName,
  sunSign,
  moonSign,
  element,
  archetype,
  portraitUrl,
  aura,
  luckyElements,
  crystal,
  birthYear,
  occasionMode,
}: TradingCardProps) {
  const header = useScrollReveal();
  const card = useScrollReveal();

  const sunData = zodiacSigns[sunSign.toLowerCase()];
  const moonData = zodiacSigns[moonSign.toLowerCase()];
  const sunIcon = sunData?.icon || '⭐';
  const moonIcon = moonData?.icon || '⭐';

  const stats = generatePowerStats(element, sunSign);
  const rarity = occasionMode === 'memorial' ? 'Forever Soul' : 'Legendary Soul';
  const totalPower = Object.values(stats).reduce((a, b) => a + b, 0);

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
        style={{ perspective: '800px' }}
      >
        <div
          className="max-w-[330px] mx-auto rounded-[20px] overflow-hidden relative"
          style={{
            background: 'linear-gradient(155deg, #0f0a1e 0%, #1a1233 40%, #0f0a1e 100%)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 2px #c4a265, 0 0 30px rgba(196,162,101,0.1)',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 pt-3 pb-2">
            <span className="text-[0.6rem] font-extrabold tracking-[2.5px] uppercase text-[#c4a265]">
              ✦ Cosmic Pets
            </span>
            <span
              className="text-[0.58rem] font-bold text-[#fbbf24] px-2.5 py-0.5 rounded-lg border"
              style={{ background: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.2)' }}
            >
              ⭐ {rarity}
            </span>
          </div>

          {/* Image area */}
          <div className="relative mx-3 rounded-[14px] overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <div
              className="w-full h-full flex items-center justify-center text-[5rem] border border-white/5"
              style={{
                background: portraitUrl
                  ? `url(${portraitUrl}) center/cover`
                  : 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(196,162,101,0.1), rgba(236,72,153,0.08))',
              }}
            >
              {!portraitUrl && sunIcon}
            </div>
            {/* Holographic overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(125deg, transparent 0%, transparent 30%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0.08) 38%, rgba(168,85,247,0.06) 42%, rgba(236,72,153,0.04) 48%, rgba(251,191,36,0.06) 52%, transparent 58%, transparent 100%)',
                animation: 'holo-shift 4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Name plate */}
          <div className="text-center pt-3.5 px-4 pb-1.5">
            <h3 className="font-dm-serif text-[1.6rem] text-white tracking-[0.5px] mb-0.5">{petName}</h3>
            <div className="text-[0.78rem] text-[#c4a265] italic mb-1">{archetype}</div>
            <div className="text-[0.68rem] text-white/35 tracking-[0.5px]">
              {sunIcon} {sunSign} · {moonIcon} {moonSign}
            </div>
          </div>

          {/* Power stats */}
          <div className="px-4 pt-2.5 pb-1.5">
            {Object.entries(stats).map(([label, value]) => (
              <div key={label} className="flex items-center gap-2 py-1">
                <span className="text-[0.68rem] text-white/55 w-[130px] flex-shrink-0">
                  {powerEmojis[label]} {label}
                </span>
                <div className="flex-1 h-[5px] rounded-sm overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: card.isInView ? `${value}%` : '0%',
                      background: powerGradients[label],
                      transition: 'width 1.5s ease-out',
                    }}
                  />
                </div>
                <span className="text-[0.65rem] font-bold text-white/70 w-6 text-right">{value}</span>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div
            className="grid grid-cols-4 gap-px mx-3 my-2.5 rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {[
              { emoji: elementEmojis[element] || '✨', value: element, label: 'Element' },
              { emoji: '🔮', value: crystal?.name || 'Moonstone', label: 'Crystal' },
              { emoji: '💜', value: aura.primary.split(' ')[0] || 'Lavender', label: 'Aura' },
              { emoji: '🌙', value: luckyElements.powerTime, label: 'Power Hour' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-2.5 px-1" style={{ background: '#0f0a1e' }}>
                <span className="block text-[1rem] mb-0.5">{stat.emoji}</span>
                <span className="block text-[0.7rem] font-semibold text-white mb-px">{stat.value}</span>
                <span className="block text-[0.48rem] text-white/30 uppercase tracking-[0.5px]">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <div className="text-center py-2.5 px-5 text-[0.72rem] text-white/35 italic">
            "Will emotionally manipulate you with one (1) slow blink"
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-4 py-2 pb-3 border-t border-white/[0.04]">
            <span className="text-[0.6rem] text-white/30">
              {elementEmojis[element] || '✨'} {element} Dominant{birthYear ? ` · Est. ${birthYear}` : ''}
            </span>
            <span className="text-[0.55rem] text-white/15 font-mono tracking-[1px]">
              #{String(totalPower).padStart(5, '0')} / ∞
            </span>
          </div>
        </div>

        <style>{`
          @keyframes holo-shift {
            0%, 100% { transform: translateX(-30%) rotate(-2deg); }
            50% { transform: translateX(30%) rotate(2deg); }
          }
        `}</style>
      </motion.div>
    </>
  );
}
