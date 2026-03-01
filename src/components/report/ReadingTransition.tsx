import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ReadingTransitionProps {
  petName: string;
}

export function ReadingTransition({ petName }: ReadingTransitionProps) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="text-center px-8 py-8 max-w-[520px] mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
        {petName}'s Personal Reading
      </div>
      <h2 className="font-dm-serif text-2xl text-[#3d2f2a] leading-tight mt-1.5">
        Now, Let's Meet {petName}'s Soul
      </h2>
      <p className="text-[0.84rem] leading-[1.75] text-[#9a8578] max-w-[400px] mx-auto mt-2">
        Everything below was calculated specifically from {petName}'s birth chart. No two readings
        are alike — this is uniquely theirs.
      </p>
      <div className="w-10 h-0.5 bg-[#c4a265] mx-auto mt-[18px] rounded-sm" />
    </motion.div>
  );
}
