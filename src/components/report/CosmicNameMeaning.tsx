import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface CosmicNameMeaningProps {
  nameMeaning: ReportContent['nameMeaning'];
}

export function CosmicNameMeaning({ nameMeaning }: CosmicNameMeaningProps) {
  const s = useScrollReveal();

  if (!nameMeaning) return null;

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-5 bg-white rounded-[14px] border border-[#e8ddd0] text-center max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
        Cosmic Name Meaning
      </div>
      <div className="font-dm-serif text-[1.6rem] text-[#c4a265] my-1.5">
        {nameMeaning.title}
      </div>
      <p className="text-[0.84rem] leading-[1.75] text-[#5a4a42] max-w-[360px] mx-auto mt-1">
        {nameMeaning.cosmicSignificance}
      </p>
      {nameMeaning.origin && (
        <p className="text-[0.78rem] text-[#9a8578] mt-2 italic">
          Origin: {nameMeaning.origin}
        </p>
      )}
    </motion.div>
  );
}
