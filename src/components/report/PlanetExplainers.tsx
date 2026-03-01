import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const planets = [
  {
    icon: '☉',
    iconClass: 'bg-amber-500/10',
    name: 'The Sun',
    governs: 'Core Identity & Life Force',
    desc: "The Sun is who your pet is at the deepest level — their fundamental nature, the energy that drives everything they do. It determines their basic personality, their vitality, and what makes them uniquely them. Think of it as their soul's signature.",
  },
  {
    icon: '☽',
    iconClass: 'bg-violet-500/10',
    name: 'The Moon',
    governs: 'Emotions & Inner Needs',
    desc: "The Moon reveals your pet's emotional landscape — how they process feelings, what makes them feel safe, and what they need to feel loved. Animals are deeply lunar creatures; they live more from instinct and feeling than logic. This is arguably the most important placement in a pet's chart.",
  },
  {
    icon: '☿',
    iconClass: 'bg-sky-400/10',
    name: 'Mercury',
    governs: 'Communication & Intelligence',
    desc: "Mercury shapes how your pet expresses themselves and processes information. It influences whether they're vocal or quiet, a quick learner or a thoughtful observer. It's the reason some pets seem to understand every word you say.",
  },
  {
    icon: '♀',
    iconClass: 'bg-pink-500/10',
    name: 'Venus',
    governs: 'Love, Affection & Harmony',
    desc: "Venus determines how your pet gives and receives love — their love language, what brings them pleasure, and how they create harmony in relationships. It's what makes them gravitate toward certain people, textures, and experiences.",
  },
  {
    icon: '♂',
    iconClass: 'bg-red-500/10',
    name: 'Mars',
    governs: 'Energy, Drive & Instinct',
    desc: "Mars reveals your pet's energy patterns — how they play, fight, defend, and move through the world. A high-energy Mars means zoomies and intensity. A calm Mars means grace and patience. It's the fire in their belly.",
  },
  {
    icon: '⬆',
    iconClass: 'bg-purple-500/10',
    name: 'The Ascendant (Rising Sign)',
    governs: 'First Impressions & Outer Self',
    desc: "The Ascendant is your pet's mask — what others see before they truly know them. It shapes first impressions, physical presence, and how they enter a room. It's the difference between who they appear to be and who they really are inside.",
  },
];

export function PlanetExplainers() {
  const header = useScrollReveal();

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
          The Celestial Bodies
        </div>
        <h2 className="font-dm-serif text-2xl text-[#3d2f2a] leading-tight mt-1.5">
          What Each Planet Reveals
        </h2>
        <p className="text-[0.84rem] leading-[1.75] text-[#9a8578] max-w-[400px] mx-auto mt-2">
          Every planet in your pet's chart tells a different story. Here's why each one matters — and
          what it reveals about your pet.
        </p>
      </motion.div>

      <div className="flex flex-col gap-1.5 px-6 max-w-[520px] mx-auto">
        {planets.map((planet) => {
          const s = useScrollReveal();
          return (
            <motion.div
              key={planet.name}
              ref={s.ref}
              initial="hidden"
              animate={s.isInView ? 'visible' : 'hidden'}
              variants={s.variants}
              className="flex gap-3 p-3 px-3.5 rounded-xl bg-white border border-[#e8ddd0]"
            >
              <div
                className={`w-[38px] h-[38px] rounded-[10px] flex-shrink-0 flex items-center justify-center text-[1.1rem] ${planet.iconClass}`}
              >
                {planet.icon}
              </div>
              <div>
                <h5 className="text-[0.8rem] font-bold text-[#3d2f2a] mb-0.5">{planet.name}</h5>
                <div className="text-[0.65rem] font-semibold text-[#c4a265] uppercase tracking-[0.5px] mb-0.5">
                  Governs: {planet.governs}
                </div>
                <p className="text-[0.74rem] text-[#9a8578] leading-[1.5]">{planet.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
