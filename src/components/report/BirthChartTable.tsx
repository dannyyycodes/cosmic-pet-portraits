import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ChartPlacement } from './types';

interface BirthChartTableProps {
  chartPlacements: Record<string, ChartPlacement>;
  petName: string;
}

const planetRows = [
  { key: 'sun', symbol: '☉', label: 'Sun' },
  { key: 'moon', symbol: '☽', label: 'Moon' },
  { key: 'mercury', symbol: '☿', label: 'Mercury' },
  { key: 'venus', symbol: '♀', label: 'Venus' },
  { key: 'mars', symbol: '♂', label: 'Mars' },
  { key: 'ascendant', symbol: '⬆', label: 'Ascendant' },
  { key: 'jupiter', symbol: '♃', label: 'Jupiter' },
  { key: 'saturn', symbol: '♄', label: 'Saturn' },
  { key: 'uranus', symbol: '♅', label: 'Uranus' },
  { key: 'neptune', symbol: '♆', label: 'Neptune' },
  { key: 'pluto', symbol: '♇', label: 'Pluto' },
  { key: 'northNode', symbol: '☊', label: 'North Node' },
  { key: 'chiron', symbol: '⚷', label: 'Chiron' },
  { key: 'lilith', symbol: '⚸', label: 'Lilith' },
];

const personalPlanetKeys = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'ascendant']);

function formatDegree(degree: number): string {
  const deg = Math.floor(degree);
  const min = Math.round((degree - deg) * 60);
  return `${deg}° ${String(min).padStart(2, '0')}'`;
}

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.05,
    },
  }),
};

export function BirthChartTable({ chartPlacements, petName }: BirthChartTableProps) {
  const header = useScrollReveal();
  const personalSection = useScrollReveal();
  const outerSection = useScrollReveal();

  const personalRows = planetRows.filter((p) => personalPlanetKeys.has(p.key));
  const outerRows = planetRows.filter((p) => !personalPlanetKeys.has(p.key));

  return (
    <div
      className="mx-4 my-3 max-w-[520px] sm:mx-auto rounded-[18px] overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #e8ddd0',
        boxShadow: '0 2px 16px rgba(61,47,42,0.08), 0 1px 4px rgba(61,47,42,0.04)',
      }}
    >
      {/* ── Card Header ── */}
      <motion.div
        ref={header.ref}
        initial="hidden"
        animate={header.isInView ? 'visible' : 'hidden'}
        variants={header.variants}
        className="px-6 pt-6 pb-4 text-center"
        style={{ borderBottom: '1px solid #e8ddd0' }}
      >
        <div
          className="text-[0.58rem] font-bold tracking-[2.5px] uppercase mb-1.5"
          style={{ color: '#c4a265' }}
        >
          Birth Chart
        </div>
        <h2
          className="text-[1.45rem] leading-tight"
          style={{
            fontFamily: 'DM Serif Display, serif',
            color: '#3d2f2a',
          }}
        >
          {petName}'s Planetary Positions
        </h2>
        <p
          className="text-[0.82rem] leading-relaxed mt-1.5 max-w-[340px] mx-auto"
          style={{
            fontFamily: 'Cormorant, serif',
            color: '#9a8578',
            fontStyle: 'italic',
          }}
        >
          The exact celestial coordinates at the moment {petName} entered this world.
        </p>
      </motion.div>

      {/* ── Column header ── */}
      <div
        className="grid grid-cols-3 px-5 py-2 text-[0.58rem] font-bold tracking-[1.5px] uppercase"
        style={{
          color: '#9a8578',
          background: '#faf6ef',
          borderBottom: '1px solid #e8ddd0',
        }}
      >
        <span>Planet</span>
        <span>Sign</span>
        <span>Position</span>
      </div>

      {/* ── Personal Planets ── */}
      <motion.div
        ref={personalSection.ref}
        initial="hidden"
        animate={personalSection.isInView ? 'visible' : 'hidden'}
      >
        <div
          className="px-5 pt-3 pb-1 text-[0.55rem] font-bold tracking-[2px] uppercase"
          style={{ color: '#c4a265' }}
        >
          Personal Planets
        </div>
        {personalRows.map((planet, i) => {
          const placement = chartPlacements[planet.key];
          if (!placement) return null;
          const isEven = i % 2 === 0;
          return (
            <motion.div
              key={planet.key}
              custom={i}
              variants={rowVariants}
              className="grid grid-cols-3 px-5 py-2.5 items-center"
              style={{
                background: isEven ? '#ffffff' : '#fdf9f5',
                borderBottom: '1px solid #f0e8de',
              }}
            >
              <span
                className="flex items-center gap-2 text-[0.82rem] font-semibold"
                style={{ color: '#3d2f2a' }}
              >
                <span
                  className="inline-flex items-center justify-center w-[24px] h-[24px] rounded-full flex-shrink-0 text-[0.88rem]"
                  style={{
                    background: '#faf6ef',
                    border: '1px solid #e8ddd0',
                    color: '#c4a265',
                  }}
                >
                  {planet.symbol}
                </span>
                {planet.label}
              </span>

              <span
                className="text-[0.82rem]"
                style={{ color: '#5a4a42' }}
              >
                {placement.sign}
              </span>

              <span
                className="text-[0.75rem] font-mono"
                style={{ color: '#9a8578' }}
              >
                {formatDegree(placement.degree)}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Section Divider ── */}
      <div className="px-5 py-2.5 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: '#e8ddd0' }} />
        <span
          className="text-[0.65rem]"
          style={{ color: '#c4a265' }}
        >
          ✦
        </span>
        <div className="flex-1 h-px" style={{ background: '#e8ddd0' }} />
      </div>

      {/* ── Outer & Karmic Planets ── */}
      <motion.div
        ref={outerSection.ref}
        initial="hidden"
        animate={outerSection.isInView ? 'visible' : 'hidden'}
      >
        <div
          className="px-5 pt-1 pb-1 text-[0.55rem] font-bold tracking-[2px] uppercase"
          style={{ color: '#c4a265' }}
        >
          Outer &amp; Karmic
        </div>
        {outerRows.map((planet, i) => {
          const placement = chartPlacements[planet.key];
          if (!placement) return null;
          const isEven = i % 2 === 0;
          const isLast = i === outerRows.length - 1;
          return (
            <motion.div
              key={planet.key}
              custom={i}
              variants={rowVariants}
              className="grid grid-cols-3 px-5 py-2.5 items-center"
              style={{
                background: isEven ? '#ffffff' : '#fdf9f5',
                borderBottom: isLast ? 'none' : '1px solid #f0e8de',
                paddingBottom: isLast ? '1rem' : undefined,
              }}
            >
              <span
                className="flex items-center gap-2 text-[0.82rem] font-semibold"
                style={{ color: '#3d2f2a' }}
              >
                <span
                  className="inline-flex items-center justify-center w-[24px] h-[24px] rounded-full flex-shrink-0 text-[0.88rem]"
                  style={{
                    background: '#faf6ef',
                    border: '1px solid #e8ddd0',
                    color: '#c4a265',
                  }}
                >
                  {planet.symbol}
                </span>
                {planet.label}
              </span>

              <span
                className="text-[0.82rem]"
                style={{ color: '#5a4a42' }}
              >
                {placement.sign}
              </span>

              <span
                className="text-[0.75rem] font-mono"
                style={{ color: '#9a8578' }}
              >
                {formatDegree(placement.degree)}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
