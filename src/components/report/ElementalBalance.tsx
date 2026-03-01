import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ElementalBalanceProps {
  elementalBalance: Record<string, number>;
  dominantElement: string;
  petName: string;
}

const elementConfig: Record<string, { emoji: string; gradient: string; key: string }> = {
  Fire: { emoji: '🔥', gradient: 'from-amber-500 to-red-500', key: 'fire' },
  Earth: { emoji: '🌍', gradient: 'from-lime-500 to-green-500', key: 'earth' },
  Air: { emoji: '💨', gradient: 'from-sky-400 to-blue-500', key: 'air' },
  Water: { emoji: '💧', gradient: 'from-violet-400 to-purple-600', key: 'water' },
};

const fillColors: Record<string, string> = {
  fire: 'linear-gradient(90deg, #f59e0b, #ef4444)',
  earth: 'linear-gradient(90deg, #84cc16, #22c55e)',
  air: 'linear-gradient(90deg, #38bdf8, #3b82f6)',
  water: 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
};

export function ElementalBalance({ elementalBalance, dominantElement, petName }: ElementalBalanceProps) {
  const header = useScrollReveal();
  const bars = useScrollReveal();

  const elementOrder = ['Fire', 'Earth', 'Air', 'Water'];

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
          Elemental Balance
        </div>
        <h2 className="font-dm-serif text-[1.2rem] text-[#3d2f2a] mt-1.5">
          {petName}'s Inner Composition
        </h2>
        <p className="text-[0.84rem] leading-[1.75] text-[#9a8578] max-w-[380px] mx-auto mt-1.5 mb-2.5">
          How the four elements shape {petName}'s temperament.
        </p>
      </motion.div>

      <motion.div
        ref={bars.ref}
        initial="hidden"
        animate={bars.isInView ? 'visible' : 'hidden'}
        variants={bars.variants}
        className="px-6 max-w-[520px] mx-auto"
      >
        {elementOrder.map((element) => {
          const config = elementConfig[element];
          const pct = elementalBalance[element] || elementalBalance[element.toLowerCase()] || 0;
          return (
            <div key={element} className="flex items-center gap-2.5 mb-2">
              <span className="w-[50px] text-[0.72rem] font-semibold text-[#3d2f2a] text-right">
                {config.emoji} {element}
              </span>
              <div className="flex-1 h-2 bg-[#e8ddd0] rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-1000 ease-out"
                  style={{
                    width: bars.isInView ? `${pct}%` : '0%',
                    background: fillColors[config.key],
                  }}
                />
              </div>
              <span className="text-[0.7rem] text-[#9a8578] w-[30px]">{pct}%</span>
            </div>
          );
        })}

        <div className="text-center py-1 px-6">
          <p className="text-[0.78rem] text-[#9a8578] max-w-[360px] mx-auto">
            {dominantElement ? (
              <>Heavily {dominantElement}-dominant — {petName} lives through {dominantElement === 'Water' ? 'feelings' : dominantElement === 'Fire' ? 'passion' : dominantElement === 'Earth' ? 'stability' : 'thought'}.</>
            ) : null}
          </p>
        </div>
      </motion.div>
    </>
  );
}
