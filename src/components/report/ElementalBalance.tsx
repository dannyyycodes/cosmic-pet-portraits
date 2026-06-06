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

const dominantQualities: Record<string, string> = {
  Water: 'feelings',
  Fire: 'passion',
  Earth: 'stability',
  Air: 'thought',
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
      className="mx-4 my-3 max-w-[520px] sm:mx-auto"
      style={{
        background: 'rgba(22,16,42,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: '18px',
        border: '1px solid rgba(154,126,230,0.18)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
      }}
    >
      <div className="px-6 pt-6 pb-5">
        {/* Header */}
        <div className="text-center mb-5">
          <div
            className="text-[0.6rem] font-bold tracking-[2.5px] uppercase mb-1.5"
            style={{ color: '#e6c179' }}
          >
            Elemental Balance
          </div>
          <h2
            className="text-[1.2rem] mt-0 mb-1"
            style={{ fontFamily: 'DM Serif Display, serif', color: '#f3ecff' }}
          >
            {petName}&apos;s Inner Composition
          </h2>
          <p
            className="text-[0.84rem] leading-[1.75] max-w-[360px] mx-auto mt-1"
            style={{ color: '#d8c5f5' }}
          >
            How the four elements shape {petName}&apos;s temperament.
          </p>
        </div>

        {/* Element rows */}
        <div className="flex flex-col gap-3">
          {elementOrder.map((element, index) => {
            const config = elementConfig[element];
            const pct = elementalBalance[element] ?? elementalBalance[element.toLowerCase()] ?? 0;
            const isDominant = dominantElement === element;

            return (
              <motion.div
                key={element}
                initial={{ opacity: 0, y: 10 }}
                animate={container.isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.1, ease: 'easeOut' }}
                className="px-3 py-2.5 rounded-[12px]"
                style={{
                  borderLeft: isDominant ? '3px solid #e6c179' : '3px solid transparent',
                  background: isDominant ? 'rgba(230,193,121,0.08)' : 'transparent',
                }}
              >
                {/* Label row */}
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-lg leading-none">{config.emoji}</span>
                  <span
                    className="text-[0.84rem] font-bold flex-1"
                    style={{ color: '#f3ecff' }}
                  >
                    {element}
                  </span>

                  {isDominant && (
                    <span
                      className="text-[0.58rem] font-bold tracking-[1.5px] uppercase px-1.5 py-0.5 rounded-full"
                      style={{
                        color: '#e6c179',
                        background: 'rgba(230,193,121,0.14)',
                        border: '1px solid rgba(230,193,121,0.38)',
                      }}
                    >
                      Dominant
                    </span>
                  )}

                  <span
                    className="text-[0.78rem] font-semibold tabular-nums ml-1"
                    style={{ color: '#d8c5f5' }}
                  >
                    {pct}%
                  </span>
                </div>

                {/* Animated gradient bar */}
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(154,126,230,0.14)' }}
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
          <div className="text-center mt-4 pt-4" style={{ borderTop: '1px solid rgba(154,126,230,0.10)' }}>
            <p
              className="text-[0.8rem] italic"
              style={{ color: '#9a86c8' }}
            >
              Heavily {dominantElement}-dominant &mdash; {petName} lives through{' '}
              {dominantQualities[dominantElement] ?? 'instinct'}.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
