import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';
import { AuraVisual } from './AuraVisual';

interface AuraPortraitProps {
  aura: { primary: string; secondary: string; meaning: string };
  sunSign: string;
  petName: string;
  petPhotoUrl?: string;
  portraitUrl?: string;
}

// Same color map as AuraVisual — kept local so either component can render
// standalone.
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

/**
 * Pet photo in a cosmic frame with an animated particle halo. Uses the
 * pet's aura.primary / aura.secondary hues for the swirl and a slowly
 * rotating conic-gradient ring in brand gold. This is a "signature
 * moment" — the screenshot people share.
 *
 * Falls back to the original orb <AuraVisual /> when there's no photo.
 */
export function AuraPortrait({
  aura,
  sunSign,
  petName,
  petPhotoUrl,
  portraitUrl,
}: AuraPortraitProps) {
  const photo = portraitUrl || petPhotoUrl;
  const s = useScrollReveal();

  if (!photo) {
    return <AuraVisual aura={aura} sunSign={sunSign} />;
  }

  const signData = zodiacSigns[sunSign.toLowerCase()];
  const zodiacIcon = signData?.icon || '';

  const primaryColor = getAuraColor(aura.primary);
  const secondaryColor = getAuraColor(aura.secondary);

  // Generate 48 orbital particles pre-computed — stable per render so
  // React doesn't churn. Each gets a radius, starting angle, duration,
  // and color (primary or secondary). Radii expressed as a % of the
  // frame's half-width so they scale with the responsive container.
  const particles = Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2 + (i % 3) * 0.15;
    const ring = i % 3; // 0 inner, 1 middle, 2 outer
    // Frame is 80vw or 320px. Inner photo is 62% (radius 31%). Particles sit
    // outside the photo at 36/42/48% of frame half-width.
    const radiusPct = [36, 42, 48][ring];
    const size = ring === 0 ? 3 : ring === 1 ? 2 : 1.5;
    const duration = 14 + ring * 4;
    const color = i % 2 === 0 ? primaryColor : secondaryColor;
    return { i, angle, radiusPct, size, duration, color, ring };
  });

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-6 max-w-[520px] sm:mx-auto relative"
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e8ddd0',
        boxShadow: '0 2px 12px rgba(61,47,42,0.07)',
        padding: '36px 24px 28px',
        textAlign: 'center',
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
        Aura Portrait
      </div>

      <h2
        style={{
          fontSize: '1.35rem',
          fontFamily: 'DM Serif Display, serif',
          color: '#3d2f2a',
          margin: '0 0 28px',
          lineHeight: 1.3,
        }}
      >
        {aura.primary}
        {aura.secondary ? ` with ${aura.secondary}` : ''}
      </h2>

      {/* The cosmic frame — scales down on phones so it never overflows */}
      <div
        className="relative mx-auto"
        style={{
          width: 'min(320px, 80vw)',
          height: 'min(320px, 80vw)',
          aspectRatio: '1 / 1',
          marginBottom: 24,
        }}
      >
        {/* Outermost soft halo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${primaryColor}18 0%, ${secondaryColor}10 40%, transparent 70%)`,
            filter: 'blur(8px)',
            animation: 'aura-portrait-breathe 5s ease-in-out infinite',
          }}
        />

        {/* Rotating conic gold ring — signature brand move */}
        <div
          aria-hidden="true"
          className="absolute inset-2 rounded-full"
          style={{
            padding: 2,
            background: `conic-gradient(from 0deg, #c4a265, ${primaryColor}, #c4a265aa, ${secondaryColor}, #c4a265)`,
            animation: 'aura-portrait-rotate 18s linear infinite',
            WebkitMask:
              'radial-gradient(circle, transparent 52%, black 53%, black 55%, transparent 56%)',
            mask: 'radial-gradient(circle, transparent 52%, black 53%, black 55%, transparent 56%)',
            opacity: 0.85,
          }}
        />

        {/* Orbital particles — positioned via percentage so they scale */}
        {particles.map((p) => (
          <motion.span
            key={p.i}
            className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              marginLeft: -p.size / 2,
              marginTop: -p.size / 2,
              background: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
            animate={{
              rotate: 360,
              x: [
                `${Math.cos(p.angle) * p.radiusPct}%`,
                `${Math.cos(p.angle + Math.PI) * p.radiusPct}%`,
                `${Math.cos(p.angle + Math.PI * 2) * p.radiusPct}%`,
              ],
              y: [
                `${Math.sin(p.angle) * p.radiusPct}%`,
                `${Math.sin(p.angle + Math.PI) * p.radiusPct}%`,
                `${Math.sin(p.angle + Math.PI * 2) * p.radiusPct}%`,
              ],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'linear',
              opacity: { duration: p.duration / 2, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}

        {/* Inner photo disc — scales with frame */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            top: '50%',
            left: '50%',
            width: '62%',
            height: '62%',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 40px ${primaryColor}55, 0 0 80px ${secondaryColor}35, inset 0 0 32px rgba(0,0,0,0.15)`,
          }}
        >
          <img
            src={photo}
            alt={`${petName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Soft color wash to tie photo to aura palette */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${primaryColor}28, transparent 60%), radial-gradient(circle at 70% 80%, ${secondaryColor}28, transparent 60%)`,
              mixBlendMode: 'overlay',
            }}
          />
        </div>

        {/* Zodiac glyph floating top-right */}
        {zodiacIcon && (
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              top: 14,
              right: 18,
              fontSize: 28,
              color: '#c4a265',
              textShadow: `0 0 12px ${primaryColor}66`,
              filter: 'drop-shadow(0 0 6px rgba(196,162,101,0.4))',
            }}
          >
            {zodiacIcon}
          </div>
        )}
      </div>

      {/* Meaning text */}
      <p
        style={{
          fontSize: '0.9rem',
          lineHeight: 1.8,
          color: '#5a4a42',
          maxWidth: 380,
          margin: '0 auto 20px',
          fontStyle: 'italic',
        }}
      >
        {aura.meaning}
      </p>

      {/* Color pills */}
      <div className="flex flex-wrap gap-2.5 justify-center">
        {[
          { label: 'Primary', name: aura.primary, color: primaryColor },
          aura.secondary
            ? { label: 'Secondary', name: aura.secondary, color: secondaryColor }
            : null,
        ]
          .filter((x): x is { label: string; name: string; color: string } => !!x)
          .map((p) => (
            <div
              key={p.label}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f5efe6] border border-[#e8ddd0] px-3 py-1"
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: p.color, boxShadow: `0 0 4px ${p.color}80` }}
              />
              <span className="text-[0.68rem] font-semibold tracking-wider uppercase text-[#9a8578]">
                {p.label}
              </span>
              <span className="text-[0.78rem] font-medium text-[#3d2f2a] capitalize">
                {p.name}
              </span>
            </div>
          ))}
      </div>

      <style>{`
        @keyframes aura-portrait-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes aura-portrait-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}
