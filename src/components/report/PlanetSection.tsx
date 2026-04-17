import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { PlanetOrb, PlanetOrbConfig } from './PlanetOrb';

interface PlanetSectionProps {
  /** Stable id (use the section key). */
  id: string;
  /** The orb config — colour, glow, modifiers. */
  planet: PlanetOrbConfig;
  /** Section label shown above title in small caps gold. */
  label: string;
  /** Section heading. */
  title: string;
  /** Index into the readings — drives left/right alternation. */
  index: number;
  /** The card body. Should be the existing ReportSectionCard. */
  children: ReactNode;
}

// Wraps a single reading section with its signature planet visual.
// Layout alternates: even indices place the planet on the LEFT (desktop)
// and the content on the right; odd indices flip. On mobile the planet
// always sits above the card. Each section gets a faint per-planet tint
// behind the planet so the colour identity carries through.
export function PlanetSection({
  id,
  planet,
  label,
  title,
  index,
  children,
}: PlanetSectionProps) {
  const planetRight = index % 2 === 1;
  const orbSize = planet.size ?? 120;

  return (
    <section className="relative my-8 mx-4 sm:mx-auto max-w-[820px]">
      {/* Faint per-planet wash behind the section — gives each section
          a colour identity without overwhelming the cream background. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[28px] pointer-events-none"
        style={{
          background: `radial-gradient(${planetRight ? 'circle at 85% 50%' : 'circle at 15% 50%'}, ${planet.glow}14 0%, transparent 60%)`,
        }}
      />

      <div
        className={`relative flex flex-col items-center gap-6 sm:gap-10 ${planetRight ? 'sm:flex-row-reverse' : 'sm:flex-row'}`}
      >
        {/* Planet column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: planetRight ? 30 : -30 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative shrink-0 flex flex-col items-center"
        >
          <PlanetOrb id={id} {...planet} />

          {/* Tiny chapter-style label under the planet — adds editorial
              feel without competing with the card's own title. */}
          <div className="mt-3 text-center">
            <div
              className="text-[0.55rem] font-bold tracking-[2.5px] uppercase"
              style={{ color: planet.color }}
            >
              {label}
            </div>
            <div
              className="text-[0.78rem] mt-0.5 text-[#3d2f2a]/70 italic max-w-[180px]"
              style={{ fontFamily: 'Cormorant, serif' }}
            >
              {title}
            </div>
          </div>
        </motion.div>

        {/* Content column — the existing ReportSectionCard */}
        <div className="flex-1 min-w-0 w-full">
          {children}
        </div>
      </div>
    </section>
  );
}
