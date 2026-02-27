import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

interface EmotionalReportRevealProps {
  petName: string;
  report: any;
  onComplete: () => void;
  occasionMode?: string;
}

function getPronouns(gender?: string) {
  switch (gender) {
    case 'male': case 'boy': return { subject: 'he', Subject: 'He', possessive: 'his' };
    case 'female': case 'girl': return { subject: 'she', Subject: 'She', possessive: 'her' };
    default: return { subject: 'they', Subject: 'They', possessive: 'their' };
  }
}

const signEmojis: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
};

export function EmotionalReportReveal({ petName, report, onComplete, occasionMode }: EmotionalReportRevealProps) {
  const [visible, setVisible] = useState(false);

  const sunSign = report?.chartPlacements?.sun?.sign || report?.sunSign || 'Aries';
  const moonSign = report?.chartPlacements?.moon?.sign || report?.moonSign || '';
  const risingSign = report?.chartPlacements?.ascendant?.sign || report?.risingSign || '';
  const element = report?.dominantElement || report?.element || 'Fire';
  const modality = report?.modality || 'Cardinal';
  const ruler = report?.rulingPlanet || report?.ruler || '';
  const archetype = report?.archetype?.name || report?.archetype || report?.cosmicNickname || '';
  const prologue = report?.prologue || report?.solarSoulprint?.content || report?.coreEssence || '';
  const gender = report?.gender;

  const p = getPronouns(gender);
  const isMemorial = occasionMode === 'memorial';
  const isBirthday = occasionMode === 'birthday';
  const isGift = occasionMode === 'gift';
  const timeMult = isMemorial ? 1.5 : 1;

  const bornText = isBirthday
    ? `${petName} celebrates another year under`
    : isMemorial
    ? `${petName} walked this earth under`
    : `${petName} was born under`;

  const signEmoji = signEmojis[sunSign] || '✨';

  const pills = [
    `☉ ${sunSign} Sun`,
    moonSign ? `☽ ${moonSign} Moon` : null,
    risingSign ? `↑ ${risingSign} Rising` : null,
    element ? `${element === 'Water' ? '🌊' : element === 'Fire' ? '🔥' : element === 'Earth' ? '🌿' : '💨'} ${element} Dominant` : null,
  ].filter(Boolean);

  const elementLine = [
    signEmoji,
    `${element} Sign`,
    modality ? `· ${modality}` : '',
    ruler ? `· Ruled by ${ruler}` : '',
  ].filter(Boolean).join(' ');

  // Background gold dots
  const dots = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    left: `${5 + Math.random() * 90}%`,
    top: `${5 + Math.random() * 90}%`,
    size: 2 + Math.random(),
    opacity: 0.2 + Math.random() * 0.2,
    delay: (i / 12) * 3,
  })), []);

  useEffect(() => {
    setVisible(true);
  }, []);

  const d = (base: number) => base * timeMult;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ backgroundColor: '#FFFDF5', ...grainStyle }}>

      {/* Background dots */}
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.left, top: dot.top,
            width: dot.size, height: dot.size,
            backgroundColor: isMemorial ? 'rgba(200,200,210,0.3)' : isBirthday ? `hsl(${i * 30}, 70%, 60%)` : `rgba(196,162,101,${dot.opacity})`,
          }}
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : {}}
          transition={{ delay: dot.delay, duration: 0.5 }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center text-center max-w-[520px] w-full">
        {/* Gift pre-text */}
        {isGift && (
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0 }}
            className="text-[1.1rem] text-[#bf524a] mb-6"
            style={{ fontFamily: 'Caveat, cursive' }}>
            You're about to give someone a gift they'll never forget
          </motion.p>
        )}

        {/* "born under" */}
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: d(isGift ? 1.2 : 0.2) }}
          className="text-[0.7rem] text-[#9B8E84] uppercase tracking-[0.15em] mb-2"
          style={{ fontFamily: 'Cormorant, serif', fontVariant: 'small-caps' }}>
          {bornText}
        </motion.p>

        {/* Sun sign — hero moment */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
          animate={visible ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
          transition={{ delay: d(isGift ? 1.5 : 0.5), duration: 0.8, ease: 'easeOut' }}
          className="text-[#2D2926] mb-2"
          style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(2.5rem, 8vw, 3.5rem)' }}>
          {sunSign}
        </motion.h1>

        {/* Element line */}
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: d(isGift ? 2.2 : 1.2) }}
          className="text-[0.82rem] text-[#9B8E84] mb-3"
          style={{ fontFamily: 'Cormorant, serif' }}>
          {elementLine}
        </motion.p>

        {/* Cosmic nickname */}
        {archetype && (
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: d(isGift ? 2.6 : 1.6) }}
            className="text-[1.3rem] text-[#bf524a] mb-4"
            style={{ fontFamily: 'Caveat, cursive' }}>
            {archetype}
          </motion.p>
        )}

        {/* Big three stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: d(isGift ? 3.0 : 2.0) }}
          className="flex flex-wrap gap-2 justify-center mb-6">
          {pills.map((pill, i) => (
            <span key={i} className="bg-white border border-[#E8DFD6] rounded-[20px] px-3 py-[0.35rem] text-[0.78rem] text-[#2D2926]"
              style={{ fontFamily: 'Cormorant, serif' }}>
              {pill}
            </span>
          ))}
        </motion.div>

        {/* Prologue card */}
        {prologue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: d(isGift ? 3.4 : 2.4) }}
            className="bg-white border border-[#E8DFD6] rounded-[16px] p-6 w-full mb-6">
            <p className="text-[1.02rem] text-[#6B5E54] italic leading-[1.7]"
              style={{ fontFamily: 'Cormorant, serif' }}>
              {typeof prologue === 'string' ? prologue : ''}
            </p>
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: d(isGift ? 4.2 : 3.2) }}
          onClick={onComplete}
          className="w-full max-w-[400px] py-4 rounded-xl text-white text-[1.05rem] relative overflow-hidden"
          style={{ fontFamily: 'DM Serif Display, serif', backgroundColor: '#bf524a' }}>
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="relative z-10">Read {petName}'s Full Soul Reading →</span>
        </motion.button>
      </div>
    </div>
  );
}
