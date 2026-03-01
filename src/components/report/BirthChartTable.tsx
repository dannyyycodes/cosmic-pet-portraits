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
];

function formatDegree(degree: number): string {
  const deg = Math.floor(degree);
  const min = Math.round((degree - deg) * 60);
  return `${deg}° ${String(min).padStart(2, '0')}'`;
}

export function BirthChartTable({ chartPlacements, petName }: BirthChartTableProps) {
  const header = useScrollReveal();
  const table = useScrollReveal();

  return (
    <>
      <motion.div
        ref={header.ref}
        initial="hidden"
        animate={header.isInView ? 'visible' : 'hidden'}
        variants={header.variants}
        className="text-center px-6 py-5 max-w-[520px] mx-auto"
      >
        <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
          {petName}'s Birth Chart
        </div>
        <h2 className="font-dm-serif text-2xl text-[#3d2f2a] leading-tight mt-1.5">
          Planetary Positions
        </h2>
        <p className="text-[0.84rem] leading-[1.75] text-[#9a8578] max-w-[380px] mx-auto mt-1.5">
          The exact celestial coordinates at the moment {petName} entered this world.
        </p>
      </motion.div>

      <motion.div
        ref={table.ref}
        initial="hidden"
        animate={table.isInView ? 'visible' : 'hidden'}
        variants={table.variants}
        className="mx-6 rounded-[14px] overflow-hidden border border-[#e8ddd0] bg-white max-w-[520px] sm:mx-auto"
      >
        <div className="grid grid-cols-3 px-3.5 py-2.5 bg-[#3d2f2a] text-white/80 text-[0.65rem] font-bold tracking-[1px] uppercase">
          <span>Planet</span>
          <span>Sign</span>
          <span>Position</span>
        </div>
        {planetRows.map((planet) => {
          const placement = chartPlacements[planet.key];
          if (!placement) return null;
          return (
            <div
              key={planet.key}
              className="grid grid-cols-3 px-3.5 py-2.5 text-[0.8rem] border-b border-[#e8ddd0] last:border-b-0 items-center"
            >
              <span className="font-semibold text-[#3d2f2a] flex items-center gap-1.5">
                {planet.symbol} {planet.label}
              </span>
              <span className="text-[#5a4a42]">{placement.sign}</span>
              <span className="text-[#9a8578] text-[0.75rem]">
                {formatDegree(placement.degree)}
              </span>
            </div>
          );
        })}
      </motion.div>
    </>
  );
}
