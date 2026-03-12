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
      className="mx-4 my-3 max-w-[520px] sm:mx-auto"
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e8ddd0',
        boxShadow: '0 2px 12px rgba(61,47,42,0.07)',
        padding: '28px 24px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold label */}
      <div
        style={{
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: '#c4a265',
          marginBottom: '6px',
        }}
      >
        Aura Reading
      </div>

      {/* Title */}
      <h2
        className="font-dm-serif"
        style={{
          fontSize: '1.25rem',
          fontFamily: 'DM Serif Display, serif',
          color: '#3d2f2a',
          margin: '0 0 24px',
          lineHeight: 1.3,
        }}
      >
        {aura.primary}
        {aura.secondary ? ` with ${aura.secondary}` : ''}
      </h2>

      {/* Orb backdrop + orb */}
      <div
        style={{
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          margin: '0 auto 24px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          /* Warm backdrop gradient */
          background: `radial-gradient(circle, rgba(196,162,101,0.10) 0%, rgba(245,239,230,0.55) 55%, transparent 75%)`,
        }}
      >
        {/* Outer breathing glow — slowest */}
        <div
          style={{
            position: 'absolute',
            inset: '10px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
            animation: 'aura-breathe 4s ease-in-out infinite',
          }}
        />
        {/* Middle breathing glow */}
        <div
          style={{
            position: 'absolute',
            inset: '22px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${secondaryColor}2e 0%, transparent 70%)`,
            animation: 'aura-breathe 4s ease-in-out infinite 0.6s',
          }}
        />
        {/* Inner breathing glow */}
        <div
          style={{
            position: 'absolute',
            inset: '34px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}38 0%, transparent 70%)`,
            animation: 'aura-breathe 4s ease-in-out infinite 1.2s',
          }}
        />
        {/* Main orb — 180px */}
        <div
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${primaryColor}cc, ${secondaryColor}99, ${primaryColor}66)`,
            boxShadow: `0 0 40px ${primaryColor}40, 0 0 80px ${secondaryColor}22, inset 0 0 24px rgba(255,255,255,0.18)`,
            animation: 'aura-breathe 4s ease-in-out infinite',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Zodiac icon overlay */}
          <span
            style={{
              fontSize: '3.2rem',
              lineHeight: 1,
              zIndex: 2,
              filter: 'brightness(0) invert(1)',
              opacity: 0.88,
              textShadow: `0 0 18px rgba(255,255,255,0.6)`,
              userSelect: 'none',
            }}
          >
            {zodiacIcon}
          </span>
        </div>
      </div>

      {/* Meaning text */}
      <p
        style={{
          fontSize: '0.875rem',
          lineHeight: 1.8,
          color: '#5a4a42',
          maxWidth: '360px',
          margin: '0 auto 20px',
        }}
      >
        {aura.meaning}
      </p>

      {/* Color pills */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Primary pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f5efe6',
            border: '1px solid #e8ddd0',
            borderRadius: '999px',
            padding: '5px 13px 5px 8px',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: primaryColor,
              flexShrink: 0,
              boxShadow: `0 0 4px ${primaryColor}80`,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.4px',
              color: '#9a8578',
              textTransform: 'uppercase',
            }}
          >
            Primary:
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              color: '#3d2f2a',
              textTransform: 'capitalize',
            }}
          >
            {aura.primary}
          </span>
        </div>

        {/* Secondary pill */}
        {aura.secondary && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f5efe6',
              border: '1px solid #e8ddd0',
              borderRadius: '999px',
              padding: '5px 13px 5px 8px',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: secondaryColor,
                flexShrink: 0,
                boxShadow: `0 0 4px ${secondaryColor}80`,
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.4px',
                color: '#9a8578',
                textTransform: 'uppercase',
              }}
            >
              Secondary:
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 500,
                color: '#3d2f2a',
                textTransform: 'capitalize',
              }}
            >
              {aura.secondary}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes aura-breathe {
          0%, 100% { transform: scale(1); opacity: 0.82; }
          50% { transform: scale(1.06); opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
}
