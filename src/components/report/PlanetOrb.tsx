import { motion } from 'framer-motion';
import { useMemo } from 'react';

export interface PlanetOrbConfig {
  /** Realistic planet image path (served from /public). When set, the orb renders as a photo. */
  image?: string;
  /** Zoom factor for the photo — used to crop the dark edges of JPG sources (Sun, Moon). */
  imageScale?: number;
  /** Custom geometric shape instead of orb/photo. Used for symbolic placements. */
  shape?: 'orb' | 'chiron' | 'horizon';
  /** Suppress rotation — for asymmetric photos (comet, horizon) where spinning looks wrong. */
  staticImage?: boolean;
  /** Hex of the orb's main fill (used for halo, label, glow tint). */
  color: string;
  /** Halo / glow accent — usually a lighter or complementary tone. */
  glow: string;
  /** Pixel diameter of the orb itself (excluding halo). 60-160 reasonable. */
  size?: number;
  /** Show a rotating ring system (Saturn / Jupiter / North Node). */
  rings?: boolean;
  /** Show solar rays flaring out. */
  rays?: boolean;
  /** Crescent shadow occluding part of the orb (used for SVG-only Moon fallback). */
  crescent?: boolean;
  /** Number of orbiting dust particles (Mercury, outer planets). 0 = none. */
  particles?: number;
  /** Seconds for one full rotation (default 60). */
  rotateDur?: number;
  /** Surface banding (Jupiter), only for SVG fallback. */
  banded?: boolean;
  /** Tilt angle in degrees for the rings. */
  ringTilt?: number;
  /** Compass-rose overlay (North Node / Destiny). */
  compass?: boolean;
}

interface PlanetOrbProps extends PlanetOrbConfig {
  /** Stable id so SVG defs don't collide. */
  id: string;
}

// Parametric planet visual. When `image` is provided, renders the
// photographic planet (NASA / Wikimedia public-domain) clipped to a
// circle with a subtle slow rotation, surrounded by a per-planet halo
// and optional ring/ray decorations. When no image, falls back to a
// stylised SVG orb (used for symbolic placements like Chiron).
//
// The component scales responsively: the `size` prop is the desktop
// diameter; on small screens we shrink to ~70% via CSS clamp() so the
// orb never crowds out the card on a phone.
export function PlanetOrb({
  id,
  image,
  imageScale = 1,
  shape = 'orb',
  staticImage = false,
  color,
  glow,
  size = 110,
  rings = false,
  rays = false,
  crescent = false,
  particles = 0,
  rotateDur = 60,
  banded = false,
  ringTilt = 18,
  compass = false,
}: PlanetOrbProps) {
  // Responsive size — shrink on phones, full on tablet+. Halo extends 35%.
  const minSize = Math.round(size * 0.62);
  const sizeCss = `clamp(${minSize}px, 26vw, ${size}px)`;
  const totalCss = `clamp(${Math.round(minSize * 1.55)}px, 40vw, ${Math.round(size * 1.55)}px)`;

  // For inner SVG drawing we still need numeric coords. We build them
  // assuming the desktop size and let CSS scale the wrapper.
  const total = Math.round(size * 1.55);
  const c = total / 2;
  const r = size / 2;

  const ringRadii = [r * 1.25, r * 1.45, r * 1.62];

  const particleArray = useMemo(() => {
    if (!particles) return [];
    return Array.from({ length: particles }, (_, i) => {
      const angle = (i / particles) * Math.PI * 2;
      const dist = r + 14 + (i % 3) * 8;
      return {
        i,
        angle,
        dist,
        delay: (i / particles) * (rotateDur / particles) * 0.6,
        size: 1.5 + (i % 3) * 0.5,
      };
    });
  }, [particles, r, rotateDur]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: totalCss, height: totalCss }}
      aria-hidden="true"
    >
      {/* Outer breathing halo — same on image + SVG variants */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glow}55 0%, ${color}22 35%, transparent 70%)`,
          filter: 'blur(6px)',
        }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Solar rays — for the Sun + Ascendant */}
      {rays && (
        <svg
          viewBox={`0 0 ${total} ${total}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <motion.g
            style={{ transformOrigin: `${c}px ${c}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const x1 = c + Math.cos(angle) * (r + 6);
              const y1 = c + Math.sin(angle) * (r + 6);
              const x2 = c + Math.cos(angle) * (r + 22);
              const y2 = c + Math.sin(angle) * (r + 22);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              );
            })}
          </motion.g>
        </svg>
      )}

      {/* Rings — Saturn / Jupiter / Destiny */}
      {rings && (
        <svg
          viewBox={`0 0 ${total} ${total}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `rotate(${ringTilt}deg)` }}
        >
          {ringRadii.map((rr, i) => (
            <ellipse
              key={i}
              cx={c}
              cy={c}
              rx={rr}
              ry={rr * 0.32}
              fill="none"
              stroke={color}
              strokeWidth={i === 1 ? 1.3 : 0.7}
              opacity={0.55 - i * 0.12}
            />
          ))}
          <motion.ellipse
            cx={c}
            cy={c}
            rx={ringRadii[1]}
            ry={ringRadii[1] * 0.32}
            fill="none"
            stroke={glow}
            strokeWidth="1"
            strokeDasharray="4 8"
            opacity="0.7"
            animate={{ rotate: 360 }}
            transition={{ duration: rotateDur, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: `${c}px ${c}px` }}
          />
        </svg>
      )}

      {/* Photographic planet OR SVG fallback (shape) */}
      {image && shape === 'orb' ? (
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            top: '50%',
            left: '50%',
            width: sizeCss,
            height: sizeCss,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 24px ${color}55, inset 0 0 14px rgba(0,0,0,0.35)`,
          }}
        >
          <motion.img
            src={image}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            animate={
              staticImage
                ? { scale: imageScale }
                : { rotate: 360, scale: imageScale }
            }
            transition={
              staticImage
                ? { scale: { duration: 0 } }
                : {
                    rotate: { duration: rotateDur, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 0 },
                  }
            }
            style={{ display: 'block' }}
            onError={(e) => {
              // Hide broken image — halo + rings still render so the orb still reads.
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Subtle gold rim for cohesion with the brand */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: `inset 0 0 0 1px ${color}99` }}
          />
          {/* Specular highlight to give photographic planets a touch of life */}
          <span
            aria-hidden="true"
            className="absolute rounded-full pointer-events-none"
            style={{
              top: '14%',
              left: '14%',
              width: '32%',
              height: '20%',
              background: 'rgba(255,255,255,0.18)',
              filter: 'blur(8px)',
            }}
          />
          {/* Compass rose overlay (North Node) */}
          {compass && (
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <g opacity="0.6">
                {[0, 45, 90, 135].map((deg) => (
                  <line
                    key={deg}
                    x1="50"
                    y1="12"
                    x2="50"
                    y2="88"
                    stroke={glow}
                    strokeWidth="0.8"
                    transform={`rotate(${deg} 50 50)`}
                  />
                ))}
                <circle cx="50" cy="50" r="5" fill={glow} />
              </g>
            </svg>
          )}
        </div>
      ) : shape === 'chiron' ? (
        // Chiron — small icy centaur body with a comet tail and a soft
        // healing-pulse aura. Different silhouette so it doesn't read as
        // just another orb.
        <svg
          viewBox={`0 0 ${total} ${total}`}
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <radialGradient id={'chiron-body-' + id} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor={glow} stopOpacity="1" />
              <stop offset="55%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor="#2c4540" stopOpacity="1" />
            </radialGradient>
            <linearGradient id={'chiron-tail-' + id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
              <stop offset="100%" stopColor={glow} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Comet tail — gentle outward sweep */}
          <motion.g
            style={{ transformOrigin: `${c}px ${c}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: rotateDur, repeat: Infinity, ease: 'linear' }}
          >
            <ellipse
              cx={c + r * 0.95}
              cy={c}
              rx={r * 1.15}
              ry={r * 0.18}
              fill={`url(#chiron-tail-${id})`}
              opacity="0.7"
            />
          </motion.g>

          {/* Pulsing heal halo */}
          <motion.circle
            cx={c}
            cy={c}
            r={r * 0.92}
            fill="none"
            stroke={glow}
            strokeWidth="0.8"
            opacity="0.5"
            animate={{ r: [r * 0.92, r * 1.15, r * 0.92], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Body — irregular oval to feel like a small icy fragment */}
          <motion.g
            style={{ transformOrigin: `${c}px ${c}px` }}
            animate={{ rotate: -360 }}
            transition={{ duration: rotateDur * 1.4, repeat: Infinity, ease: 'linear' }}
          >
            <ellipse
              cx={c}
              cy={c}
              rx={r * 0.78}
              ry={r * 0.72}
              fill={`url(#chiron-body-${id})`}
            />
            {/* Healing crack — a thin lighter line across the body */}
            <path
              d={`M ${c - r * 0.55} ${c - r * 0.1}
                  Q ${c} ${c + r * 0.05} ${c + r * 0.55} ${c - r * 0.18}`}
              stroke={glow}
              strokeWidth="0.9"
              strokeOpacity="0.7"
              fill="none"
            />
            {/* Surface speckles for texture */}
            <circle cx={c - r * 0.32} cy={c - r * 0.22} r="1.2" fill={glow} opacity="0.55" />
            <circle cx={c + r * 0.18} cy={c + r * 0.32} r="0.9" fill={glow} opacity="0.45" />
            <circle cx={c + r * 0.4} cy={c - r * 0.28} r="0.7" fill={glow} opacity="0.55" />
          </motion.g>

          {/* Specular highlight */}
          <ellipse
            cx={c - r * 0.28}
            cy={c - r * 0.3}
            rx={r * 0.22}
            ry={r * 0.14}
            fill="white"
            opacity="0.3"
          />
        </svg>
      ) : shape === 'horizon' ? (
        // Ascendant / Rising Sign — a horizon line with a half-sun rising,
        // soft rays and a few stars above. Symbolic of the moment of birth
        // when a particular sign was rising on the eastern horizon.
        <svg
          viewBox={`0 0 ${total} ${total}`}
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <radialGradient id={'horizon-sun-' + id} cx="50%" cy="100%" r="80%">
              <stop offset="0%" stopColor={glow} stopOpacity="1" />
              <stop offset="55%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </radialGradient>
            <linearGradient id={'horizon-glow-' + id} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <clipPath id={'horizon-clip-' + id}>
              <rect x="0" y="0" width={total} height={c + r * 0.2} />
            </clipPath>
          </defs>

          {/* Atmospheric glow above horizon */}
          <rect
            x="0"
            y={c - r}
            width={total}
            height={r * 1.2}
            fill={`url(#horizon-glow-${id})`}
            opacity="0.7"
          />

          {/* Stars dotted above */}
          {[
            { x: 0.2, y: 0.18, s: 1.4 },
            { x: 0.78, y: 0.12, s: 1.0 },
            { x: 0.58, y: 0.25, s: 0.8 },
            { x: 0.32, y: 0.32, s: 0.9 },
          ].map((p, i) => (
            <motion.circle
              key={i}
              cx={total * p.x}
              cy={total * p.y}
              r={p.s}
              fill={glow}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
              style={{ filter: `drop-shadow(0 0 ${p.s * 2}px ${glow})` }}
            />
          ))}

          {/* Rising sun — half-disc clipped at horizon line */}
          <g clipPath={`url(#horizon-clip-${id})`}>
            {/* Rays */}
            <motion.g
              style={{ transformOrigin: `${c}px ${c + r * 0.1}px` }}
              animate={{ rotate: 360 }}
              transition={{ duration: rotateDur * 1.2, repeat: Infinity, ease: 'linear' }}
            >
              {Array.from({ length: 9 }).map((_, i) => {
                const angle = (i / 9) * Math.PI - Math.PI / 2;
                const cy0 = c + r * 0.1;
                const x1 = c + Math.cos(angle) * (r * 0.82);
                const y1 = cy0 + Math.sin(angle) * (r * 0.82);
                const x2 = c + Math.cos(angle) * (r * 1.12);
                const y2 = cy0 + Math.sin(angle) * (r * 1.12);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                );
              })}
            </motion.g>
            {/* Sun disc */}
            <circle cx={c} cy={c + r * 0.1} r={r * 0.72} fill={`url(#horizon-sun-${id})`} />
            {/* Specular */}
            <ellipse
              cx={c - r * 0.18}
              cy={c - r * 0.05}
              rx={r * 0.18}
              ry={r * 0.1}
              fill="white"
              opacity="0.32"
            />
          </g>

          {/* Horizon line */}
          <line
            x1={total * 0.08}
            y1={c + r * 0.2}
            x2={total * 0.92}
            y2={c + r * 0.2}
            stroke="#c4a265"
            strokeWidth="1.1"
            opacity="0.85"
          />
        </svg>
      ) : (
        // Default SVG orb fallback (Aspects, generic).
        <svg
          viewBox={`0 0 ${total} ${total}`}
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <radialGradient id={'orb-' + id} cx="35%" cy="32%" r="68%">
              <stop offset="0%" stopColor={glow} stopOpacity="1" />
              <stop offset="50%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </radialGradient>
            {crescent && (
              <radialGradient id={'crescent-' + id} cx="70%" cy="42%" r="80%">
                <stop offset="0%" stopColor="#0a070d" stopOpacity="0" />
                <stop offset="60%" stopColor="#0a070d" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#0a070d" stopOpacity="0.85" />
              </radialGradient>
            )}
            {banded && (
              <linearGradient id={'band-' + id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0" />
                <stop offset="40%" stopColor={glow} stopOpacity="0.35" />
                <stop offset="50%" stopColor={color} stopOpacity="0.35" />
                <stop offset="60%" stopColor={glow} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            )}
          </defs>

          <motion.g
            style={{ transformOrigin: `${c}px ${c}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: rotateDur, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx={c} cy={c} r={r} fill={`url(#orb-${id})`} />
            {banded && (
              <ellipse
                cx={c}
                cy={c}
                rx={r * 0.95}
                ry={r * 0.18}
                fill={`url(#band-${id})`}
                opacity="0.8"
              />
            )}
            {compass && (
              <g opacity="0.5">
                {[0, 45, 90, 135].map((deg) => (
                  <line
                    key={deg}
                    x1={c}
                    y1={c - r * 0.85}
                    x2={c}
                    y2={c + r * 0.85}
                    stroke={glow}
                    strokeWidth="0.8"
                    transform={`rotate(${deg} ${c} ${c})`}
                  />
                ))}
                <circle cx={c} cy={c} r={r * 0.18} fill={glow} />
              </g>
            )}
          </motion.g>

          {crescent && <circle cx={c} cy={c} r={r} fill={`url(#crescent-${id})`} />}

          <ellipse
            cx={c - r * 0.32}
            cy={c - r * 0.32}
            rx={r * 0.28}
            ry={r * 0.18}
            fill="white"
            opacity="0.32"
          />
        </svg>
      )}

      {/* Orbital particles — Mercury, outer planets */}
      {particleArray.map((p) => (
        <motion.span
          key={p.i}
          className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            background: glow,
            boxShadow: `0 0 ${p.size * 3}px ${glow}`,
          }}
          animate={{
            x: [
              Math.cos(p.angle) * p.dist,
              Math.cos(p.angle + Math.PI) * p.dist,
              Math.cos(p.angle + Math.PI * 2) * p.dist,
            ],
            y: [
              Math.sin(p.angle) * p.dist,
              Math.sin(p.angle + Math.PI) * p.dist,
              Math.sin(p.angle + Math.PI * 2) * p.dist,
            ],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: rotateDur / 2,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}
