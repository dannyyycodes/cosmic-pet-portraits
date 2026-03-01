import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';

interface AuraVisualProps {
  aura: { primary: string; secondary: string; meaning: string };
  sunSign: string;
}

export function AuraVisual({ aura, sunSign }: AuraVisualProps) {
  const s = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const zodiacIcon = signData?.icon || '⭐';

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-6 px-5 bg-white rounded-[14px] border border-[#e8ddd0] text-center max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
        Aura Reading
      </div>
      <h2 className="font-dm-serif text-[1.2rem] text-[#3d2f2a] mt-1.5">
        {aura.primary}
        {aura.secondary ? ` with ${aura.secondary}` : ''}
      </h2>

      <div className="w-[120px] h-[120px] rounded-full mx-auto my-4 relative flex items-center justify-center">
        <span
          className="absolute rounded-full border-[3px] border-[#c8b8e8] opacity-60"
          style={{
            inset: '-8px',
            animation: 'aura-breathe 3s ease-in-out infinite',
          }}
        />
        <span
          className="absolute rounded-full border-[3px] border-[#b0a0d8] opacity-60"
          style={{
            inset: '-16px',
            animation: 'aura-breathe 3s ease-in-out infinite 0.3s',
          }}
        />
        <span
          className="absolute rounded-full border-[3px] border-[#9888c8] opacity-30"
          style={{
            inset: '-24px',
            animation: 'aura-breathe 3s ease-in-out infinite 0.6s',
          }}
        />
        <span className="text-[2rem] relative z-[1]">{zodiacIcon}</span>
      </div>

      <p className="text-[0.84rem] leading-[1.75] text-[#5a4a42] max-w-[340px] mx-auto">
        {aura.meaning}
      </p>

      <style>{`
        @keyframes aura-breathe {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.05); opacity: 0.7; }
        }
      `}</style>
    </motion.div>
  );
}
