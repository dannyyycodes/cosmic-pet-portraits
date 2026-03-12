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

const innerPlanetKeys = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'ascendant']);

function formatDegree(degree: number): string {
  const deg = Math.floor(degree);
  const min = Math.round((degree - deg) * 60);
  return `${deg}° ${String(min).padStart(2, '0')}'`;
}

const rowVariants = {
  hidden: { opacity: 0, x: -18 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.055,
    },
  }),
};

export function BirthChartTable({ chartPlacements, petName }: BirthChartTableProps) {
  const header = useScrollReveal();
  const innerSection = useScrollReveal();
  const outerSection = useScrollReveal();

  const innerRows = planetRows.filter((p) => innerPlanetKeys.has(p.key));
  const outerRows = planetRows.filter((p) => !innerPlanetKeys.has(p.key));

  return (
    <>
      {/* ── Header ── */}
      <motion.div
        ref={header.ref}
        initial="hidden"
        animate={header.isInView ? 'visible' : 'hidden'}
        variants={header.variants}
        className="text-center px-6 py-5 max-w-[520px] mx-auto"
      >
        <div
          className="text-[0.6rem] font-bold tracking-[2.5px] uppercase"
          style={{ color: '#b8a0d4' }}
        >
          {petName}'s Birth Chart
        </div>
        <h2
          className="text-2xl text-white leading-tight mt-1.5"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          Planetary Positions
        </h2>
        <p
          className="text-[0.84rem] leading-[1.75] max-w-[380px] mx-auto mt-1.5"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          The exact celestial coordinates at the moment {petName} entered this world.
        </p>
      </motion.div>

      {/* ── Main container ── */}
      <div
        className="mx-4 rounded-[18px] overflow-hidden max-w-[520px] sm:mx-auto relative"
        style={{
          background: 'linear-gradient(160deg, #2a1f2a 0%, #1a1520 100%)',
          border: '1px solid rgba(184,160,212,0.22)',
          boxShadow:
            '0 0 0 1px rgba(184,160,212,0.08), 0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(184,160,212,0.12)',
        }}
      >
        {/* Corner glow accents */}
        <div
          className="absolute top-0 left-0 w-[120px] h-[120px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(184,160,212,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[120px] h-[120px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 100% 100%, rgba(184,160,212,0.14) 0%, transparent 70%)',
          }}
        />

        {/* ── Column header ── */}
        <div
          className="grid grid-cols-3 px-4 py-2.5 text-[0.6rem] font-bold tracking-[1.5px] uppercase"
          style={{
            color: 'rgba(184,160,212,0.7)',
            borderBottom: '1px solid rgba(184,160,212,0.12)',
            background: 'rgba(184,160,212,0.06)',
          }}
        >
          <span>Planet</span>
          <span>Sign</span>
          <span>Position</span>
        </div>

        {/* ── Inner Planets section ── */}
        <motion.div
          ref={innerSection.ref}
          initial="hidden"
          animate={innerSection.isInView ? 'visible' : 'hidden'}
        >
          <div
            className="px-4 pt-3 pb-1 text-[0.55rem] font-bold tracking-[2px] uppercase"
            style={{ color: 'rgba(184,160,212,0.45)' }}
          >
            Inner Planets
          </div>
          {innerRows.map((planet, i) => {
            const placement = chartPlacements[planet.key];
            if (!placement) return null;
            return (
              <motion.div
                key={planet.key}
                custom={i}
                variants={rowVariants}
                className="grid grid-cols-3 px-4 py-2.5 items-center"
                style={{
                  borderBottom: '1px solid rgba(184,160,212,0.08)',
                }}
              >
                {/* Planet symbol + label */}
                <span
                  className="font-semibold flex items-center gap-2 text-[0.82rem]"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  <span
                    className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full flex-shrink-0 text-[0.85rem]"
                    style={{
                      background: 'rgba(184,160,212,0.12)',
                      border: '1px solid rgba(184,160,212,0.25)',
                      textShadow: '0 0 8px rgba(184,160,212,0.8)',
                      boxShadow: '0 0 6px rgba(184,160,212,0.2)',
                      color: '#d4bff0',
                    }}
                  >
                    {planet.symbol}
                  </span>
                  {planet.label}
                </span>

                {/* Sign */}
                <span
                  className="text-[0.82rem]"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  {placement.sign}
                </span>

                {/* Degree */}
                <span
                  className="text-[0.75rem] font-mono"
                  style={{ color: 'rgba(184,160,212,0.65)' }}
                >
                  {formatDegree(placement.degree)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Divider ── */}
        <div className="px-4 py-1.5 flex items-center gap-3">
          <div
            className="flex-1 h-px"
            style={{ background: 'rgba(184,160,212,0.18)' }}
          />
          <span
            className="text-[0.55rem] font-bold tracking-[1.5px] uppercase"
            style={{ color: 'rgba(184,160,212,0.4)' }}
          >
            ✦
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: 'rgba(184,160,212,0.18)' }}
          />
        </div>

        {/* ── Outer & Karmic Planets section ── */}
        <motion.div
          ref={outerSection.ref}
          initial="hidden"
          animate={outerSection.isInView ? 'visible' : 'hidden'}
        >
          <div
            className="px-4 pt-1 pb-1 text-[0.55rem] font-bold tracking-[2px] uppercase"
            style={{ color: 'rgba(184,160,212,0.45)' }}
          >
            Outer &amp; Karmic
          </div>
          {outerRows.map((planet, i) => {
            const placement = chartPlacements[planet.key];
            if (!placement) return null;
            return (
              <motion.div
                key={planet.key}
                custom={i}
                variants={rowVariants}
                className="grid grid-cols-3 px-4 py-2.5 items-center last:pb-3.5"
                style={{
                  borderBottom: i < outerRows.length - 1 ? '1px solid rgba(184,160,212,0.08)' : 'none',
                }}
              >
                {/* Planet symbol + label */}
                <span
                  className="font-semibold flex items-center gap-2 text-[0.82rem]"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  <span
                    className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full flex-shrink-0 text-[0.85rem]"
                    style={{
                      background: 'rgba(184,160,212,0.08)',
                      border: '1px solid rgba(184,160,212,0.18)',
                      textShadow: '0 0 8px rgba(184,160,212,0.7)',
                      boxShadow: '0 0 5px rgba(184,160,212,0.15)',
                      color: '#c4aee8',
                    }}
                  >
                    {planet.symbol}
                  </span>
                  {planet.label}
                </span>

                {/* Sign */}
                <span
                  className="text-[0.82rem]"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  {placement.sign}
                </span>

                {/* Degree */}
                <span
                  className="text-[0.75rem] font-mono"
                  style={{ color: 'rgba(184,160,212,0.55)' }}
                >
                  {formatDegree(placement.degree)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </>
  );
}
