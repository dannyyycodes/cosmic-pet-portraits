import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';

interface SoulLetterProps {
  petName: string;
  epilogue: string;
  sunSign: string;
  occasionMode?: string;
}

export function SoulLetter({ petName, epilogue, sunSign, occasionMode }: SoulLetterProps) {
  const header = useScrollReveal();
  const letter = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  const headerTitle = occasionMode === 'memorial'
    ? 'The Part That Makes People Cry'
    : 'The Part That Makes People Cry';

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
          A Message From {petName}'s Soul
        </div>
        <h2 className="font-dm-serif text-2xl text-[#3d2f2a] leading-tight mt-1.5">
          {headerTitle}
        </h2>
      </motion.div>

      <motion.div
        ref={letter.ref}
        initial="hidden"
        animate={letter.isInView ? 'visible' : 'hidden'}
        variants={letter.variants}
        className="mx-4 my-2.5 py-7 px-6 rounded-[14px] border border-[#e8ddd0] text-center italic text-[0.92rem] leading-[1.9] text-[#5a4a42] max-w-[520px] sm:mx-auto"
        style={{ background: 'linear-gradient(135deg, #faf6ef, #f0e6d6)' }}
      >
        {/* Opening quote mark */}
        <div className="font-dm-serif text-[3rem] text-[#c4a265] leading-none -mb-1 not-italic">
          &ldquo;
        </div>

        <div dangerouslySetInnerHTML={{ __html: epilogue.replace(/\n\n/g, '<br /><br />') }} />

        <div className="mt-3.5 not-italic font-bold text-[#3d2f2a] text-[0.85rem]">
          — {petName}'s Soul {signIcon}
        </div>
      </motion.div>
    </>
  );
}
