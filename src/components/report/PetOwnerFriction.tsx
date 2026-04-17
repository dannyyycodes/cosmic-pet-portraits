import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface PetOwnerFrictionProps {
  petOwnerFriction: {
    title?: string;
    preamble?: string;
    clashPattern: string;
    whyItHappens: string;
    repairRitual: string;
    reframe?: string;
  };
  petName: string;
}

export function PetOwnerFriction({ petOwnerFriction, petName }: PetOwnerFrictionProps) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-3 max-w-[520px] sm:mx-auto"
    >
      <div
        className="py-7 px-6 sm:px-7 rounded-[18px]"
        style={{ background: '#fffdf5', border: '1px solid #e8ddd0' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0 bg-[#bf524a]/10">
            ⚡
          </div>
          <div>
            <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
              Cosmic Friction
            </div>
            <h3
              className="text-[1.1rem] text-[#3d2f2a] mt-0.5"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              {petOwnerFriction.title || `When You and ${petName} Clash`}
            </h3>
          </div>
        </div>

        {petOwnerFriction.preamble && (
          <p className="text-[0.85rem] leading-[1.8] text-[#958779] italic mb-4">
            {petOwnerFriction.preamble}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <div className="text-[0.6rem] font-bold tracking-[1.8px] uppercase text-[#bf524a] mb-1.5">
              The Clash Pattern
            </div>
            <p className="text-[0.88rem] leading-[1.85] text-[#5a4a42]">
              {petOwnerFriction.clashPattern}
            </p>
          </div>

          <div>
            <div className="text-[0.6rem] font-bold tracking-[1.8px] uppercase text-[#958779] mb-1.5">
              What You&rsquo;re Both Actually Needing
            </div>
            <p className="text-[0.88rem] leading-[1.85] text-[#5a4a42]">
              {petOwnerFriction.whyItHappens}
            </p>
          </div>

          <div
            className="p-4 rounded-[12px] border-l-[3px] border-[#c4a265]"
            style={{ background: '#faf4e8' }}
          >
            <div className="text-[0.6rem] font-bold tracking-[1.8px] uppercase text-[#c4a265] mb-1.5">
              💛 Repair Ritual
            </div>
            <p className="text-[0.86rem] leading-[1.8] text-[#3d2f2a]">
              {petOwnerFriction.repairRitual}
            </p>
          </div>

          {petOwnerFriction.reframe && (
            <p
              className="text-[0.9rem] leading-[1.6] text-[#3d2f2a] text-center pt-2 italic"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              &ldquo;{petOwnerFriction.reframe}&rdquo;
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
