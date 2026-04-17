import { motion, useInView } from 'framer-motion';
import { useRef, useState, useMemo } from 'react';

interface ChartPlacement {
  sign: string;
  degree: number;
  symbol?: string;
}

interface ConstellationChartProps {
  placements: Record<string, ChartPlacement>;
  petName: string;
}

// Signature moment 1 — The Constellation Birth Chart Reveal.
// Brand-aligned (cream + gold, not dark) version of the birth chart.
// When the component scrolls into view:
//   1. Outer zodiac ring draws itself (SVG stroke-dashoffset)
//   2. House lines sweep out from centre
//   3. Planets drop into place one by one with a glow bloom
// Tapping a planet dims the others and highlights its degree + sign.
// Tapping empty space resets.

const zodiacData = [
  { name: 'aries',       symbol: '\u2648', startDeg: 0,   element: 'fire'  },
  { name: 'taurus',      symbol: '\u2649', startDeg: 30,  element: 'earth' },
  { name: 'gemini',      symbol: '\u264A', startDeg: 60,  element: 'air'   },
  { name: 'cancer',      symbol: '\u264B', startDeg: 90,  element: 'water' },
  { name: 'leo',         symbol: '\u264C', startDeg: 120, element: 'fire'  },
  { name: 'virgo',       symbol: '\u264D', startDeg: 150, element: 'earth' },
  { name: 'libra',       symbol: '\u264E', startDeg: 180, element: 'air'   },
  { name: 'scorpio',     symbol: '\u264F', startDeg: 210, element: 'water' },
  { name: 'sagittarius', symbol: '\u2650', startDeg: 240, element: 'fire'  },
  { name: 'capricorn',   symbol: '\u2651', startDeg: 270, element: 'earth' },
  { name: 'aquarius',    symbol: '\u2652', startDeg: 300, element: 'air'   },
  { name: 'pisces',      symbol: '\u2653', startDeg: 330, element: 'water' },
];

const elementInk: Record<string, string> = {
  fire: '#c06d43',
  earth: '#7a8a4a',
  air: '#7a8ac0',
  water: '#7358a8',
};

const planetCatalog = [
  { key: 'sun',       name: 'Sun',        symbol: '\u2609', color: '#c4a265' },
  { key: 'moon',      name: 'Moon',       symbol: '\u263D', color: '#8a6f8c' },
  { key: 'mercury',   name: 'Mercury',    symbol: '\u263F', color: '#5a8ab0' },
  { key: 'venus',     name: 'Venus',      symbol: '\u2640', color: '#bf524a' },
  { key: 'mars',      name: 'Mars',       symbol: '\u2642', color: '#a04030' },
  { key: 'jupiter',   name: 'Jupiter',    symbol: '\u2643', color: '#c88a3c' },
  { key: 'saturn',    name: 'Saturn',     symbol: '\u2644', color: '#706252' },
  { key: 'uranus',    name: 'Uranus',     symbol: '\u2645', color: '#5a9ab0' },
  { key: 'neptune',   name: 'Neptune',    symbol: '\u2646', color: '#6878a8' },
  { key: 'pluto',     name: 'Pluto',      symbol: '\u2647', color: '#55384a' },
  { key: 'northNode', name: 'North Node', symbol: '\u260A', color: '#8a6a98' },
  { key: 'chiron',    name: 'Chiron',     symbol: '\u26B7', color: '#4a8878' },
  { key: 'ascendant', name: 'Ascendant',  symbol: 'ASC',    color: '#c06d43' },
];

function toAbsoluteDeg(sign: string, degree: number): number {
  const idx = zodiacData.findIndex((z) => z.name === sign.toLowerCase());
  if (idx === -1) return 0;
  return zodiacData[idx].startDeg + (degree || 0);
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((180 - deg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

export function ConstellationChart({ placements, petName }: ConstellationChartProps) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 195;
  const zodiacRing = 36;
  const innerR = outerR - zodiacRing;
  const planetR = innerR - 32;
  const hubR = 46;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { once: true, margin: '-20% 0px' });
  const [activePlanet, setActivePlanet] = useState<string | null>(null);

  const planets = useMemo(() => {
    const list = planetCatalog
      .filter((p) => placements[p.key])
      .map((p) => {
        const pl = placements[p.key];
        const absDeg = toAbsoluteDeg(pl.sign, pl.degree);
        return { ...p, placement: pl, absDeg, displayDeg: absDeg };
      })
      .sort((a, b) => a.absDeg - b.absDeg);

    // Collision avoidance — gently fan out clustered planets.
    const minGap = 12;
    for (let i = 1; i < list.length; i++) {
      if (list[i].displayDeg - list[i - 1].displayDeg < minGap) {
        list[i].displayDeg = list[i - 1].displayDeg + minGap;
      }
    }
    return list;
  }, [placements]);

  // Pre-computed segment paths for the zodiac ring.
  const segments = useMemo(() => {
    return zodiacData.map((z, i) => {
      const start = z.startDeg;
      const end = start + 30;
      const mid = start + 15;

      const p1 = polar(cx, cy, outerR, start);
      const p2 = polar(cx, cy, outerR, end);
      const p3 = polar(cx, cy, innerR, end);
      const p4 = polar(cx, cy, innerR, start);
      const mp = polar(cx, cy, innerR + zodiacRing / 2, mid);

      const large = '0';
      const d =
        `M ${p1.x} ${p1.y} ` +
        `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y} ` +
        `L ${p3.x} ${p3.y} ` +
        `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y} Z`;

      return { ...z, i, d, symbolPos: mp, ink: elementInk[z.element] };
    });
  }, []);

  const activeData = activePlanet ? planets.find((p) => p.key === activePlanet) : null;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto my-10 max-w-[520px] sm:max-w-[580px] px-4"
    >
      {/* Eyebrow */}
      <div className="text-center mb-3">
        <div className="text-[0.62rem] font-bold tracking-[2.8px] uppercase text-[#c4a265]">
          The Constellation
        </div>
        <h3
          className="mt-1 text-[1.35rem] font-serif text-[#3d2f2a]"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {petName}&rsquo;s sky at the moment of arrival
        </h3>
      </div>

      <div
        className="relative rounded-[22px] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at center, #FFFDF5 0%, #f5efe6 60%, #ede5d8 100%)',
          border: '1px solid rgba(196,162,101,0.25)',
          boxShadow: '0 4px 28px rgba(61,47,42,0.1)',
          padding: '28px 18px 24px',
        }}
      >
        {/* Backdrop parchment texture via dotted pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #3d2f2a 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />

        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="block mx-auto w-full max-w-[420px]"
          onClick={() => setActivePlanet(null)}
        >
          <defs>
            <radialGradient id="cchart-hub">
              <stop offset="0%" stopColor="rgba(196,162,101,0.35)" />
              <stop offset="60%" stopColor="rgba(196,162,101,0.12)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="cchart-planet-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Zodiac segments — fade in first */}
          {segments.map((s) => (
            <motion.g
              key={s.name}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.05 * s.i, duration: 0.55, ease: 'easeOut' }}
            >
              <path d={s.d} fill={s.ink + '18'} stroke={s.ink + '88'} strokeWidth="0.75" />
              <text
                x={s.symbolPos.x}
                y={s.symbolPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={s.ink}
                fontSize="16"
                className="select-none"
              >
                {s.symbol}
              </text>
            </motion.g>
          ))}

          {/* Outer ring — drawn on */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            stroke="#c4a265"
            strokeWidth="1.4"
            pathLength={1}
            initial={{ strokeDashoffset: 1, strokeDasharray: 1 }}
            animate={inView ? { strokeDashoffset: 0 } : { strokeDashoffset: 1 }}
            transition={{ duration: 2.2, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
          />

          {/* Inner ring — drawn on */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={innerR}
            fill="none"
            stroke="rgba(196,162,101,0.55)"
            strokeWidth="0.8"
            pathLength={1}
            initial={{ strokeDashoffset: 1, strokeDasharray: 1 }}
            animate={inView ? { strokeDashoffset: 0 } : { strokeDashoffset: 1 }}
            transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.35 }}
          />

          {/* Degree ticks */}
          {Array.from({ length: 72 }).map((_, i) => {
            const deg = i * 5;
            const isMajor = i % 6 === 0;
            const len = isMajor ? 7 : 3;
            const inner = polar(cx, cy, innerR, deg);
            const outer = polar(cx, cy, innerR + len, deg);
            return (
              <motion.line
                key={deg}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(61,47,42,0.35)"
                strokeWidth={isMajor ? 1 : 0.5}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + (i / 72) * 0.5 }}
              />
            );
          })}

          {/* Centre hub glow */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={hubR}
            fill="url(#cchart-hub)"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 1.4, delay: 1, ease: 'easeOut' }}
          />

          {/* Planet lines sweeping out from hub */}
          {planets.map((p, i) => {
            const planetPos = polar(cx, cy, planetR, p.displayDeg);
            const ringPos = polar(cx, cy, innerR - 3, p.absDeg);
            const dimmed = activePlanet && activePlanet !== p.key;
            return (
              <motion.line
                key={'l-' + p.key}
                x1={cx}
                y1={cy}
                x2={ringPos.x}
                y2={ringPos.y}
                stroke={p.color}
                strokeWidth="0.6"
                strokeOpacity={dimmed ? 0.08 : 0.35}
                strokeDasharray="2 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.9, delay: 1.1 + i * 0.1, ease: 'easeOut' }}
              />
            );
          })}

          {/* Planet discs */}
          {planets.map((p, i) => {
            const pos = polar(cx, cy, planetR, p.displayDeg);
            const isActive = activePlanet === p.key;
            const dimmed = activePlanet && !isActive;
            const baseR = 13;
            return (
              <motion.g
                key={p.key}
                initial={{ scale: 0, opacity: 0 }}
                animate={
                  inView
                    ? { scale: isActive ? 1.2 : 1, opacity: dimmed ? 0.3 : 1 }
                    : { scale: 0, opacity: 0 }
                }
                transition={{
                  delay: inView ? 1.3 + i * 0.09 : 0,
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ cursor: 'pointer', transformOrigin: `${pos.x}px ${pos.y}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePlanet(isActive ? null : p.key);
                }}
              >
                {/* Halo */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={baseR + 6}
                  fill={p.color}
                  opacity={isActive ? 0.28 : 0.12}
                  filter="url(#cchart-planet-glow)"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={baseR}
                  fill="#FFFDF5"
                  stroke={p.color}
                  strokeWidth="1.5"
                />
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={p.color}
                  fontSize={p.symbol.length > 2 ? '9' : '13'}
                  fontWeight="700"
                  className="select-none pointer-events-none"
                >
                  {p.symbol}
                </text>
              </motion.g>
            );
          })}

          {/* Pet name in centre hub */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1, delay: 2, ease: 'easeOut' }}
          >
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fill="#5a4a42"
              fontSize="9"
              fontWeight="700"
              letterSpacing="2.5"
              className="select-none uppercase"
            >
              {petName.length > 16 ? petName.slice(0, 14) + '…' : petName}
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fill="#c4a265"
              fontSize="8.5"
              fontWeight="700"
              letterSpacing="2.2"
              className="select-none uppercase"
            >
              Birth Chart
            </text>
          </motion.g>
        </svg>

        {/* Active planet readout */}
        <motion.div
          key={activeData?.key || 'idle'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 text-center min-h-[44px]"
        >
          {activeData ? (
            <>
              <div className="text-[0.62rem] tracking-[2.5px] uppercase font-bold" style={{ color: activeData.color }}>
                {activeData.name}
              </div>
              <div className="text-[0.95rem] font-serif text-[#3d2f2a]" style={{ fontFamily: 'DM Serif Display, serif' }}>
                {activeData.placement.sign} &middot; {Math.round(activeData.placement.degree)}&deg;
              </div>
            </>
          ) : (
            <div className="text-[0.72rem] text-[#9a8578] italic">
              Tap a planet to see where the stars placed it
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
