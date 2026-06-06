import { motion, useReducedMotion } from 'framer-motion';
import { PlanetPreset } from './tokens';

interface CosmicPlanetProps {
  preset: PlanetPreset;
  /** Diameter px (the orb). The metadata ring extends ~18% beyond. */
  size?: number;
  /** Placement degree 0..29 to mark on the orbital ring. */
  degree?: number;
  /** Sign glyph/short label to pin on the ring (optional). */
  className?: string;
}

// A NASA planet photo rendered as a LIT SPHERE, not a flat circle:
//  - image cover-cropped to a circle, slowly rotating
//  - a fixed specular highlight (top-left) + terminator shadow (bottom-right)
//    sells "lit sphere" over a flat disc
//  - a thin accent rim + tight glow (no big blur blob)
//  - an orbital metadata ring with 30 ticks and a bright marker at the
//    placement degree + one slow orbiting satellite dot for life
export function CosmicPlanet({ preset, size = 168, degree, className }: CosmicPlanetProps) {
  const reduce = useReducedMotion();
  const ringSize = Math.round(size * 1.34);
  const r = ringSize / 2;
  const orbR = size / 2;
  const imgScale = preset.imageScale ?? 1;

  // degree marker angle (astrology: 0 at top, clockwise). -90 to start at top.
  const markAngle = degree != null ? (degree / 30) * 360 - 90 : null;
  const ringR = r - 3;
  const ticks = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div
      className={`relative ${className ?? ''}`}
      style={{ width: ringSize, height: ringSize }}
    >
      {/* Orbital metadata ring */}
      <svg
        width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}
        className="absolute inset-0" aria-hidden="true"
      >
        <circle cx={r} cy={r} r={ringR} fill="none" stroke={preset.accent} strokeOpacity={0.22} strokeWidth={1} />
        {ticks.map((i) => {
          const a = (i / 30) * Math.PI * 2 - Math.PI / 2;
          const major = i % 5 === 0;
          const inner = ringR - (major ? 7 : 4);
          return (
            <line
              key={i}
              x1={r + Math.cos(a) * ringR} y1={r + Math.sin(a) * ringR}
              x2={r + Math.cos(a) * inner} y2={r + Math.sin(a) * inner}
              stroke={preset.accent} strokeOpacity={major ? 0.5 : 0.22} strokeWidth={major ? 1.4 : 0.8}
            />
          );
        })}
        {markAngle != null && (
          <g>
            <circle
              cx={r + Math.cos((markAngle * Math.PI) / 180) * ringR}
              cy={r + Math.sin((markAngle * Math.PI) / 180) * ringR}
              r={3.4} fill={preset.glow}
              style={{ filter: `drop-shadow(0 0 5px ${preset.glow})` }}
            />
          </g>
        )}
      </svg>

      {/* Slow orbiting satellite dot */}
      {!reduce && (
        <motion.div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{ width: ringR * 2, height: ringR * 2, marginLeft: -ringR, marginTop: -ringR }}
          animate={{ rotate: 360 }}
          transition={{ duration: 26, ease: 'linear', repeat: Infinity }}
        >
          <span
            className="absolute rounded-full"
            style={{ top: -2, left: '50%', width: 4, height: 4, marginLeft: -2,
              background: preset.glow, boxShadow: `0 0 6px ${preset.glow}` }}
          />
        </motion.div>
      )}

      {/* The orb */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: size, height: size, left: (ringSize - size) / 2, top: (ringSize - size) / 2,
          boxShadow: `0 0 0 1px ${preset.accent}66, 0 0 38px ${preset.glow}38, inset 0 0 0 1px rgba(255,255,255,0.04)`,
        }}
      >
        {/* rotating image layer */}
        <motion.img
          src={preset.image}
          alt={preset.planet}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover select-none"
          style={{ transform: `scale(${imgScale})`, transformOrigin: 'center' }}
          animate={reduce || preset.staticImage ? undefined : { rotate: 360 }}
          transition={reduce || preset.staticImage ? undefined : { duration: 140, ease: 'linear', repeat: Infinity }}
          draggable={false}
        />
        {/* terminator shadow — makes the disc read as a lit sphere */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 34% 28%, rgba(255,255,255,0.18) 0%, transparent 42%), radial-gradient(circle at 72% 78%, rgba(0,0,0,0.6) 0%, transparent 60%)',
          boxShadow: 'inset -10px -14px 36px rgba(0,0,0,0.6)',
        }} />
        {/* faint accent rim-light from the sun side */}
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{
          boxShadow: `inset 6px 6px 22px ${preset.glow}33`,
        }} />
      </div>
    </div>
  );
}
