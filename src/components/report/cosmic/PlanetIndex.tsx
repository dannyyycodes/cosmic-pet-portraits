import { motion } from 'framer-motion';
import { COSMIC, PlanetPreset } from './tokens';
import { useActiveSection } from './useActiveSection';

export interface PlanetIndexItem {
  id: string;
  preset: PlanetPreset;
  sign?: string;
}

// Short rail labels so long names don't truncate at thumbnail width.
const RAIL_LABEL: Record<string, string> = {
  Ascendant: 'ASC',
  'North Node': 'NODE',
  Mercury: 'MERC',
};

interface PlanetIndexProps {
  items: PlanetIndexItem[];
}

// Sticky scannable rail of the planetary placements. The reader's map through
// the readings: active planet glows gold, discovered ones stay lit, the rest
// dim — a quiet progress/collection cue. Tap a planet to jump to its reading.
// Owns the shared scroll observer so no other component invents its own.
export function PlanetIndex({ items }: PlanetIndexProps) {
  const { active, discovered, scrollTo, inView } = useActiveSection(items.map((i) => i.id));
  const onJump = scrollTo;
  const doneCount = discovered.size;
  return (
    <motion.div
      className="sticky z-30 mx-auto mb-8 max-w-[940px] px-2"
      style={{ top: 64 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : -8, pointerEvents: inView ? 'auto' : 'none' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div
        className="rounded-2xl px-4 py-3 sm:px-3 sm:py-2.5"
        style={{
          background: 'rgba(10,8,18,0.72)', border: `1px solid ${COSMIC.border}`,
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
        }}
      >
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.2em', color: '#b9a8e0' }}
                className="uppercase">The Placements</span>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: COSMIC.gold }}>
            {doneCount} / {items.length} discovered
          </span>
        </div>

        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', scrollSnapType: 'x proximity' }}
        >
          {items.map((it) => {
            const isActive = active === it.id;
            const seen = discovered.has(it.id);
            return (
              <button
                key={it.id}
                onClick={() => onJump(it.id)}
                title={`${it.preset.planet}${it.sign ? ' in ' + it.sign : ''}`}
                className="relative shrink-0 flex flex-col items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-colors min-h-[44px]"
                style={{ scrollSnapAlign: 'start', minWidth: 56 }}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.12 : 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className="relative rounded-full overflow-hidden"
                  style={{
                    width: 38, height: 38,
                    boxShadow: isActive
                      ? `0 0 0 2px ${it.preset.accent}, 0 0 14px ${it.preset.glow}88`
                      : `0 0 0 1px ${COSMIC.border}`,
                    opacity: seen || isActive ? 1 : 0.45,
                  }}
                >
                  {it.preset.image ? (
                    <img src={it.preset.image} alt={it.preset.planet} loading="lazy"
                         className="w-full h-full object-cover"
                         style={{ transform: `scale(${it.preset.imageScale ?? 1})` }} />
                  ) : (
                    <div className="w-full h-full" style={{ background: COSMIC.raised }} />
                  )}
                  <div className="absolute inset-0 pointer-events-none"
                       style={{ boxShadow: 'inset -3px -4px 10px rgba(0,0,0,0.55)' }} />
                </motion.div>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
                  color: isActive ? it.preset.accent : '#b9a8e0',
                }} className="uppercase whitespace-nowrap">{RAIL_LABEL[it.preset.planet] ?? it.preset.planet}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
