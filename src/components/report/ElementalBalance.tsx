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
  const container = useScrollReveal();
  const elementOrder = ['Fire', 'Earth', 'Air', 'Water'];

  return (
    <motion.div
      ref={container.ref}
      initial="hidden"
      animate={container.isInView ? 'visible' : 'hidden'}
      variants={container.variants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto relative rounded-[20px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2a1f2a 0%, #1a1520 100%)',
        border: '1px solid rgba(184,160,212,0.15)',
      }}
    >
      {/* Corner glow accents */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(184,160,212,0.12) 0%, transparent 70%)',
          transform: 'translate(-40%, -40%)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-32 h-32 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(184,160,212,0.10) 0%, transparent 70%)',
          transform: 'translate(40%, 40%)',
        }}
      />

      <div className="relative z-10 px-6 pt-6 pb-5">
        {/* Header inside dark container */}
        <div className="text-center mb-5">
          <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#b8a0d4] mb-1.5">
            Elemental Balance
          </div>
          <h2 className="font-dm-serif text-[1.2rem] text-white mt-0">
            {petName}'s Inner Composition
          </h2>
          <p className="text-[0.84rem] leading-[1.75] text-white/50 max-w-[360px] mx-auto mt-1.5">
            How the four elements shape {petName}'s temperament.
          </p>
        </div>

        {/* Element cards */}
        <div className="flex flex-col gap-2.5">
          {elementOrder.map((element, index) => {
            const config = elementConfig[element];
            const pct = elementalBalance[element] || elementalBalance[element.toLowerCase()] || 0;
            const isDominant = dominantElement === element;

            return (
              <motion.div
                key={element}
                initial={{ opacity: 0, y: 10 }}
                animate={container.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.08, ease: 'easeOut' }}
                className="rounded-[12px] px-4 py-3"
                style={{
                  background: isDominant
                    ? 'rgba(184,160,212,0.10)'
                    : 'rgba(255,255,255,0.05)',
                  border: isDominant
                    ? '1px solid rgba(184,160,212,0.35)'
                    : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg leading-none">{config.emoji}</span>
                  <span className="text-[0.82rem] font-semibold text-white flex-1">
                    {element}
                    {isDominant && (
                      <span
                        className="ml-2 text-[0.6rem] font-bold tracking-[1.5px] uppercase align-middle"
                        style={{ color: '#b8a0d4' }}
                      >
                        Dominant
                      </span>
                    )}
                  </span>
                  <span className="text-[0.78rem] text-white/60 font-medium tabular-nums">
                    {pct}%
                  </span>
                </div>

                {/* Animated gradient bar */}
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: '0%' }}
                    animate={container.isInView ? { width: `${pct}%` } : { width: '0%' }}
                    transition={{ duration: 0.9, delay: 0.25 + index * 0.1, ease: 'easeOut' }}
                    style={{ background: fillColors[config.key] }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary text */}
        {dominantElement && (
          <div className="text-center mt-4">
            <p className="text-[0.78rem] text-white/70 max-w-[360px] mx-auto">
              Heavily {dominantElement}-dominant — {petName} lives through{' '}
              {dominantElement === 'Water'
                ? 'feelings'
                : dominantElement === 'Fire'
                ? 'passion'
                : dominantElement === 'Earth'
                ? 'stability'
                : 'thought'}.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
