import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';
import { deDash } from './cosmic/text';

interface CompatibilityChartProps {
  compatibilityNotes: {
    bestPlaymates: string[];
    challengingEnergies: string[];
    humanCompatibility: string;
    relationshipGift?: string;
  };
  petName: string;
}

// Playmate entries arrive as either "Libra" (legacy) or "Libra — reason" (new
// format). Split on the first em-dash / en-dash / hyphen-with-spaces so we can
// render the sign label and its chart-grounded reason separately.
function parsePlaymate(raw: string): { sign: string; reason: string } {
  const match = raw.match(/^\s*([A-Za-z]+)\s*[—–-]\s*(.+)$/);
  if (match) {
    return { sign: match[1].trim(), reason: match[2].trim() };
  }
  return { sign: raw.trim(), reason: '' };
}

function generatePercentages(
  playmates: string[],
): Array<{ sign: string; icon: string; pct: number; reason: string }> {
  return playmates.slice(0, 4).map((raw, i) => {
    const { sign, reason } = parsePlaymate(raw);
    const signData = zodiacSigns[sign.toLowerCase()];
    return {
      sign,
      reason,
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
      className="mx-4 my-2.5 p-5 rounded-[14px] border border-[#2a1f47] max-w-[520px] sm:mx-auto"
      style={{
        background: 'rgba(22,16,42,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#e6c179] mb-1">
        Pet-Parent Cosmic Match
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#f3ecff] mb-3">Best Zodiac Playmates</h3>

      {entries.map((entry) => (
        <div
          key={entry.sign}
          className="py-2 border-b border-[#2a1f47] last:border-b-0"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-dm-serif text-[0.95rem] text-[#f3ecff] w-20 shrink-0">
              {entry.icon} {entry.sign}
            </span>
            <div className="flex-1 h-1.5 bg-[#221a44] rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm"
                style={{
                  width: s.isInView ? `${entry.pct}%` : '0%',
                  background: 'linear-gradient(90deg, #c4a265, #8b6f3a)',
                  transition: 'width 1s ease-out',
                }}
              />
            </div>
            <span className="text-[0.72rem] font-semibold text-[#e6c179] w-9 text-right">
              {entry.pct}%
            </span>
          </div>
          {entry.reason && (
            <p className="text-[0.72rem] text-[#d8c5f5] mt-1 ml-[5.5rem] leading-[1.6] italic">
              {deDash(entry.reason)}
            </p>
          )}
        </div>
      ))}

      <p className="text-[0.78rem] text-[#d8c5f5] mt-2.5 leading-[1.75]">
        {deDash(compatibilityNotes.humanCompatibility)}
      </p>

      {compatibilityNotes.relationshipGift && (
        <p className="text-[0.78rem] text-[#f3ecff] mt-3 pt-3 border-t border-[#2a1f47] leading-[1.65] italic">
          <span className="text-[0.6rem] font-bold tracking-[2px] uppercase text-[#e6c179] not-italic block mb-1">
            What {petName} Brings
          </span>
          {deDash(compatibilityNotes.relationshipGift)}
        </p>
      )}
    </motion.div>
  );
}
