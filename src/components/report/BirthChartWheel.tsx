import { motion } from 'framer-motion';

interface ChartPlacement {
  sign: string;
  degree: number;
  symbol: string;
}

interface BirthChartWheelProps {
  placements: Record<string, ChartPlacement>;
  petName: string;
}

const zodiacData = [
  { name: 'Aries', symbol: '♈', startDegree: 0, element: 'Fire' },
  { name: 'Taurus', symbol: '♉', startDegree: 30, element: 'Earth' },
  { name: 'Gemini', symbol: '♊', startDegree: 60, element: 'Air' },
  { name: 'Cancer', symbol: '♋', startDegree: 90, element: 'Water' },
  { name: 'Leo', symbol: '♌', startDegree: 120, element: 'Fire' },
  { name: 'Virgo', symbol: '♍', startDegree: 150, element: 'Earth' },
  { name: 'Libra', symbol: '♎', startDegree: 180, element: 'Air' },
  { name: 'Scorpio', symbol: '♏', startDegree: 210, element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', startDegree: 240, element: 'Fire' },
  { name: 'Capricorn', symbol: '♑', startDegree: 270, element: 'Earth' },
  { name: 'Aquarius', symbol: '♒', startDegree: 300, element: 'Air' },
  { name: 'Pisces', symbol: '♓', startDegree: 330, element: 'Water' },
];

const elementColors: Record<string, string> = {
  Fire: '#ef4444',
  Earth: '#22c55e',
  Air: '#3b82f6',
  Water: '#8b5cf6',
};

const planetOrder = [
  { key: 'sun', name: 'Sun', symbol: '☉', color: '#fbbf24' },
  { key: 'moon', name: 'Moon', symbol: '☽', color: '#e2e8f0' },
  { key: 'mercury', name: 'Mercury', symbol: '☿', color: '#06b6d4' },
  { key: 'venus', name: 'Venus', symbol: '♀', color: '#ec4899' },
  { key: 'mars', name: 'Mars', symbol: '♂', color: '#ef4444' },
  { key: 'jupiter', name: 'Jupiter', symbol: '♃', color: '#f97316' },
  { key: 'saturn', name: 'Saturn', symbol: '♄', color: '#78716c' },
  { key: 'uranus', name: 'Uranus', symbol: '♅', color: '#22d3ee' },
  { key: 'neptune', name: 'Neptune', symbol: '♆', color: '#818cf8' },
  { key: 'pluto', name: 'Pluto', symbol: '♇', color: '#6b21a8' },
  { key: 'northNode', name: 'North Node', symbol: '☊', color: '#a855f7' },
  { key: 'chiron', name: 'Chiron', symbol: '⚷', color: '#14b8a6' },
  { key: 'ascendant', name: 'Ascendant', symbol: 'ASC', color: '#f43f5e' },
];

function getAbsoluteDegree(sign: string, degree: number): number {
  const signIndex = zodiacData.findIndex(z => z.name.toLowerCase() === sign.toLowerCase());
  if (signIndex === -1) return 0;
  return zodiacData[signIndex].startDegree + degree;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  // Chart starts at 9 o'clock (180°) and goes counter-clockwise
  const angleInRadians = ((180 - angleInDegrees) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy - radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function BirthChartWheel({ placements, petName }: BirthChartWheelProps) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 180;
  const zodiacRingWidth = 35;
  const innerRadius = outerRadius - zodiacRingWidth;
  const planetRadius = innerRadius - 30;

  // Calculate planet positions with collision avoidance
  const planetPositions = planetOrder
    .filter(p => placements[p.key])
    .map(planet => {
      const placement = placements[planet.key];
      const absoluteDegree = getAbsoluteDegree(placement.sign, placement.degree);
      return {
        ...planet,
        placement,
        absoluteDegree,
        displayDegree: absoluteDegree,
      };
    })
    .sort((a, b) => a.absoluteDegree - b.absoluteDegree);

  // Simple collision avoidance - spread overlapping planets
  const minGap = 12;
  for (let i = 1; i < planetPositions.length; i++) {
    const prev = planetPositions[i - 1];
    const curr = planetPositions[i];
    if (curr.displayDegree - prev.displayDegree < minGap) {
      curr.displayDegree = prev.displayDegree + minGap;
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
      {/* Chart Wheel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative"
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="w-80 h-80 sm:w-96 sm:h-96">
          <defs>
            {/* Gradient definitions for elements */}
            <radialGradient id="centerGlow">
              <stop offset="0%" stopColor="rgba(168, 85, 247, 0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="planetGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle cx={cx} cy={cy} r={outerRadius + 5} fill="rgba(0,0,0,0.5)" />
          
          {/* Zodiac wheel segments */}
          {zodiacData.map((zodiac, i) => {
            const startAngle = zodiac.startDegree;
            const endAngle = startAngle + 30;
            const midAngle = startAngle + 15;
            const symbolPos = polarToCartesian(cx, cy, innerRadius + zodiacRingWidth / 2, midAngle);
            
            return (
              <g key={zodiac.name}>
                {/* Segment arc */}
                <path
                  d={`${describeArc(cx, cy, outerRadius, startAngle, endAngle)} 
                      L ${polarToCartesian(cx, cy, innerRadius, endAngle).x} ${polarToCartesian(cx, cy, innerRadius, endAngle).y}
                      ${describeArc(cx, cy, innerRadius, endAngle, startAngle).replace('M', 'L').split('A')[0]} A ${innerRadius} ${innerRadius} 0 0 0 ${polarToCartesian(cx, cy, innerRadius, startAngle).x} ${polarToCartesian(cx, cy, innerRadius, startAngle).y} Z`}
                  fill={`${elementColors[zodiac.element]}22`}
                  stroke={elementColors[zodiac.element]}
                  strokeWidth="1"
                  className="transition-all duration-300 hover:fill-opacity-40"
                />
                {/* Zodiac symbol */}
                <text
                  x={symbolPos.x}
                  y={symbolPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={elementColors[zodiac.element]}
                  fontSize="16"
                  fontWeight="bold"
                  className="select-none"
                >
                  {zodiac.symbol}
                </text>
              </g>
            );
          })}

          {/* Degree markers */}
          {Array.from({ length: 72 }).map((_, i) => {
            const degree = i * 5;
            const isMajor = i % 6 === 0;
            const markerLength = isMajor ? 8 : 4;
            const inner = polarToCartesian(cx, cy, innerRadius, degree);
            const outer = polarToCartesian(cx, cy, innerRadius + markerLength, degree);
            return (
              <line
                key={degree}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={isMajor ? 1.5 : 0.5}
              />
            );
          })}

          {/* Inner circle for planets */}
          <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={planetRadius + 25} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="4 4" />
          <circle cx={cx} cy={cy} r={planetRadius - 10} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

          {/* Center glow */}
          <circle cx={cx} cy={cy} r={60} fill="url(#centerGlow)" />

          {/* Planet positions */}
          {planetPositions.map((planet, i) => {
            const pos = polarToCartesian(cx, cy, planetRadius, planet.displayDegree);
            const lineEnd = polarToCartesian(cx, cy, innerRadius - 5, planet.absoluteDegree);
            
            return (
              <motion.g
                key={planet.key}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
              >
                {/* Line to zodiac ring */}
                <line
                  x1={pos.x}
                  y1={pos.y}
                  x2={lineEnd.x}
                  y2={lineEnd.y}
                  stroke={planet.color}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  strokeDasharray="2 2"
                />
                {/* Planet circle background */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={14}
                  fill="rgba(0,0,0,0.7)"
                  stroke={planet.color}
                  strokeWidth="2"
                  filter="url(#planetGlow)"
                />
                {/* Planet symbol */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={planet.color}
                  fontSize="12"
                  fontWeight="bold"
                  className="select-none"
                >
                  {planet.symbol}
                </text>
              </motion.g>
            );
          })}

          {/* Center label */}
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
            className="uppercase tracking-wider"
          >
            {petName}'s
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill="rgba(168, 85, 247, 1)"
            fontSize="11"
            fontWeight="bold"
            className="uppercase tracking-wider"
          >
            Birth Chart
          </text>
        </svg>
      </motion.div>

      {/* Planet Legend */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 text-sm"
      >
        {planetPositions.map((planet) => (
          <div
            key={planet.key}
            className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"
          >
            <span style={{ color: planet.color }} className="text-lg font-bold">
              {planet.symbol}
            </span>
            <div className="flex flex-col">
              <span className="text-white/80 text-xs font-medium">{planet.name}</span>
              <span className="text-white/60 text-xs">
                {planet.placement.sign} {Math.round(planet.placement.degree)}°
              </span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
