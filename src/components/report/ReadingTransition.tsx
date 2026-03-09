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
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1, ease: 'easeOut' } } }}
      className="text-center px-8 py-12 max-w-[520px] mx-auto"
    >
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="w-10 h-[1px] bg-[#c4a265]/40" />
        <span className="text-[#c4a265]/50 text-[0.65rem]">✦</span>
        <div className="w-10 h-[1px] bg-[#c4a265]/40" />
      </div>
      <div className="text-[0.55rem] font-bold tracking-[3px] uppercase text-[#c4a265] mb-2">
        {petName}&rsquo;s Personal Reading
      </div>
      <h2
        className="text-[1.6rem] text-[#3d2f2a] leading-tight mb-3"
        style={{ fontFamily: 'DM Serif Display, serif' }}
      >
        Now, Let&rsquo;s Meet {petName}&rsquo;s Soul
      </h2>
      <p
        className="text-[0.92rem] leading-[1.8] text-[#9a8578] max-w-[380px] mx-auto italic"
        style={{ fontFamily: 'Cormorant, serif' }}
      >
        Everything below was calculated from {petName}&rsquo;s birth chart. No two readings are alike.
      </p>
      <div className="flex items-center justify-center gap-3 mt-6">
        <div className="w-10 h-[1px] bg-[#c4a265]/40" />
        <span className="text-[#c4a265]/50 text-[0.65rem]">✦</span>
        <div className="w-10 h-[1px] bg-[#c4a265]/40" />
      </div>
    </motion.div>
  );
}
