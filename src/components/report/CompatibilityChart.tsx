import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';

interface CompatibilityChartProps {
  compatibilityNotes: {
    bestPlaymates: string[];
    challengingEnergies: string[];
    humanCompatibility: string;
  };
  petName: string;
}

// Generate compatibility percentages from playmate order
function generatePercentages(playmates: string[]): Array<{ sign: string; icon: string; pct: number }> {
  return playmates.slice(0, 4).map((sign, i) => {
    const signData = zodiacSigns[sign.toLowerCase()];
    return {
      sign,
      icon: signData?.icon || '⭐',
      pct: Math.max(75, 95 - i * 5),
    };
  });
}

export function CompatibilityChart({ compatibilityNotes, petName }: CompatibilityChartProps) {
  const s = useScrollReveal();
  const entries = generatePercentages(compatibilityNotes.bestPlaymates);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-1">
        Pet-Parent Cosmic Match
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mb-3">Best Zodiac Playmates</h3>

      {entries.map((entry) => (
        <div
          key={entry.sign}
          className="flex items-center gap-2.5 py-2 border-b border-[#e8ddd0] last:border-b-0"
        >
          <span className="font-dm-serif text-[0.95rem] text-[#3d2f2a] w-20">
            {entry.icon} {entry.sign}
          </span>
          <div className="flex-1 h-1.5 bg-[#e8ddd0] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm"
              style={{
                width: s.isInView ? `${entry.pct}%` : '0%',
                background: 'linear-gradient(90deg, #c4a265, #8b6f3a)',
                transition: 'width 1s ease-out',
              }}
            />
          </div>
          <span className="text-[0.72rem] font-semibold text-[#c4a265] w-9 text-right">
            {entry.pct}%
          </span>
        </div>
      ))}

      <p className="text-[0.78rem] text-[#5a4a42] mt-2.5 leading-[1.75]">
        {compatibilityNotes.humanCompatibility}
      </p>
    </motion.div>
  );
}
