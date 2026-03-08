import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';

interface AuraVisualProps {
  aura: { primary: string; secondary: string; meaning: string };
  sunSign: string;
}

const auraColorMap: Record<string, string> = {
  red: '#ef4444', crimson: '#dc2626', scarlet: '#b91c1c',
  orange: '#f97316', amber: '#f59e0b', gold: '#eab308', golden: '#eab308',
  yellow: '#facc15', lemon: '#fde047',
  green: '#22c55e', emerald: '#10b981', sage: '#84cc16', olive: '#65a30d', mint: '#34d399',
  teal: '#14b8a6', cyan: '#06b6d4', turquoise: '#2dd4bf', aqua: '#22d3ee',
  blue: '#3b82f6', navy: '#1e40af', cobalt: '#2563eb', sky: '#38bdf8', cerulean: '#0ea5e9', azure: '#0284c7',
  indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7', plum: '#9333ea', amethyst: '#7c3aed',
  lavender: '#c4b5fd', lilac: '#d8b4fe', mauve: '#c084fc',
  pink: '#ec4899', rose: '#f43f5e', magenta: '#d946ef', fuchsia: '#c026d3', coral: '#fb7185',
  white: '#f8fafc', silver: '#94a3b8', pearl: '#e2e8f0', ivory: '#fefce8', cream: '#fef9c3',
  copper: '#b45309', bronze: '#92400e',
  warm: '#f59e0b', soft: '#c4b5fd', deep: '#6366f1', bright: '#facc15', pale: '#e2e8f0',
  iridescent: '#c4b5fd', opalescent: '#e2e8f0', shimmering: '#fbbf24', luminous: '#fde68a',
};

function getAuraColor(colorName: string): string {
  const lower = colorName.toLowerCase();
  for (const [key, value] of Object.entries(auraColorMap)) {
    if (lower.includes(key)) return value;
  }
  return '#c4b5fd';
}

export function AuraVisual({ aura, sunSign }: AuraVisualProps) {
  const s = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const zodiacIcon = signData?.icon || '';

  const primaryColor = getAuraColor(aura.primary);
  const secondaryColor = getAuraColor(aura.secondary);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-6 px-5 bg-white rounded-[14px] border border-[#e8ddd0] text-center max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
        Aura Reading
      </div>
      <h2 className="font-dm-serif text-[1.2rem] text-[#3d2f2a] mt-1.5">
        {aura.primary}
        {aura.secondary ? ` with ${aura.secondary}` : ''}
      </h2>

      {/* Gradient orb */}
      <div className="w-[160px] h-[160px] rounded-full mx-auto my-6 relative flex items-center justify-center">
        {/* Outer glow */}
        <div
          className="absolute inset-[-20px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
            animation: 'aura-breathe 3s ease-in-out infinite',
          }}
        />
        {/* Middle ring */}
        <div
          className="absolute inset-[-10px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${secondaryColor}30 0%, transparent 70%)`,
            animation: 'aura-breathe 3s ease-in-out infinite 0.4s',
          }}
        />
        {/* Main orb */}
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${primaryColor}90, ${secondaryColor}70, ${primaryColor}40)`,
            boxShadow: `0 0 40px ${primaryColor}40, 0 0 80px ${secondaryColor}20`,
            animation: 'aura-breathe 3s ease-in-out infinite',
          }}
        />
        {/* Zodiac icon overlay */}
        <span className="absolute text-[2.2rem] z-[1] drop-shadow-md" style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }}>
          {zodiacIcon}
        </span>
      </div>

      <p className="text-[0.84rem] leading-[1.75] text-[#5a4a42] max-w-[340px] mx-auto">
        {aura.meaning}
      </p>

      <style>{`
        @keyframes aura-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.06); opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
}
