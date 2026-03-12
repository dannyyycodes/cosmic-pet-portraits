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
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
      style={{
        background: 'linear-gradient(145deg, #2a1f2a 0%, #1f1828 50%, #1a1520 100%)',
        borderRadius: '20px',
        border: '1px solid rgba(184,160,212,0.15)',
        padding: '28px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner glow accents */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle at top left, rgba(184,160,212,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle at bottom right, rgba(184,160,212,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'radial-gradient(circle at top right, rgba(139,92,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Label */}
      <div
        style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: '#b8a0d4',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Aura Reading
      </div>

      {/* Title */}
      <h2
        className="font-dm-serif"
        style={{
          fontSize: '1.25rem',
          color: '#ffffff',
          marginTop: '6px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {aura.primary}
        {aura.secondary ? ` with ${aura.secondary}` : ''}
      </h2>

      {/* Orb container */}
      <div
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          margin: '28px auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {/* Outer glow ring — slowest */}
        <div
          style={{
            position: 'absolute',
            inset: '-32px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}18 0%, transparent 68%)`,
            animation: 'aura-breathe 4s ease-in-out infinite',
          }}
        />
        {/* Middle glow ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-18px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${secondaryColor}28 0%, transparent 68%)`,
            animation: 'aura-breathe 4s ease-in-out infinite 0.6s',
          }}
        />
        {/* Inner glow ring */}
        <div
          style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}35 0%, transparent 68%)`,
            animation: 'aura-breathe 4s ease-in-out infinite 1.2s',
          }}
        />
        {/* Main orb */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${primaryColor}95, ${secondaryColor}75, ${primaryColor}45)`,
            boxShadow: `0 0 50px ${primaryColor}50, 0 0 100px ${secondaryColor}28, inset 0 0 30px rgba(255,255,255,0.06)`,
            animation: 'aura-breathe 4s ease-in-out infinite',
          }}
        />
        {/* Zodiac icon overlay */}
        <span
          style={{
            position: 'absolute',
            fontSize: '3.2rem',
            zIndex: 2,
            filter: 'brightness(0) invert(1)',
            opacity: 0.9,
            textShadow: `0 0 20px ${primaryColor}80`,
          }}
        >
          {zodiacIcon}
        </span>
      </div>

      {/* Meaning text */}
      <p
        style={{
          fontSize: '0.84rem',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.80)',
          maxWidth: '340px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
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
