import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ShadowSelfProps {
  shadowSelf: {
    title?: string;
    preamble?: string;
    petShadow: string;
    mirrorInYou: string;
    healingPath: string;
  };
  petName: string;
}

export function ShadowSelf({ shadowSelf, petName }: ShadowSelfProps) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-4 max-w-[560px] sm:mx-auto"
    >
      <div
        className="py-8 px-6 sm:px-8 rounded-[18px]"
        style={{
          background: 'linear-gradient(180deg, #241d33 0%, #2a2440 100%)',
          color: '#f3efff',
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0"
            style={{ background: 'rgba(139,123,216, 0.18)' }}
          >
            🌑
          </div>
          <div>
            <div
              className="text-[0.52rem] font-bold tracking-[2px] uppercase"
              style={{ color: '#8b7bd8' }}
            >
              Shadow Self
            </div>
            <h3
              className="text-[1.1rem] mt-0.5"
              style={{ fontFamily: 'DM Serif Display, serif', color: '#f3efff' }}
            >
              {shadowSelf.title || `The Wound ${petName} Came to Heal`}
            </h3>
          </div>
        </div>

        {shadowSelf.preamble && (
          <p
            className="text-[0.85rem] leading-[1.8] italic mb-5 opacity-80"
            style={{ color: '#e2dbf3' }}
          >
            {shadowSelf.preamble}
          </p>
        )}

        <div className="space-y-5">
          <div>
            <div
              className="text-[0.6rem] font-bold tracking-[2px] uppercase mb-1.5"
              style={{ color: '#8b7bd8' }}
            >
              {petName}&rsquo;s Shadow
            </div>
            <p className="text-[0.88rem] leading-[1.85]" style={{ color: '#f3efff' }}>
              {shadowSelf.petShadow}
            </p>
          </div>

          <div>
            <div
              className="text-[0.6rem] font-bold tracking-[2px] uppercase mb-1.5"
              style={{ color: '#8b7bd8' }}
            >
              The Mirror in You
            </div>
            <p className="text-[0.88rem] leading-[1.85]" style={{ color: '#f3efff' }}>
              {shadowSelf.mirrorInYou}
            </p>
          </div>

          <div
            className="p-4 rounded-[12px] border-l-[3px]"
            style={{
              background: 'rgba(250, 244, 232, 0.06)',
              borderColor: '#8b7bd8',
            }}
          >
            <div
              className="text-[0.6rem] font-bold tracking-[2px] uppercase mb-1.5"
              style={{ color: '#8b7bd8' }}
            >
              🕯️ Healing Path
            </div>
            <p className="text-[0.86rem] leading-[1.8]" style={{ color: '#f3efff' }}>
              {shadowSelf.healingPath}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
