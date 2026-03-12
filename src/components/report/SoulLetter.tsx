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
  const pause = useScrollReveal();
  const header = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '';

  // Split epilogue into paragraphs for breathing room
  const rawParagraphs = epilogue.split(/\n\n+/).filter(Boolean);
  // If only 1 paragraph, try splitting on sentence boundaries into ~3 groups
  const paragraphs = rawParagraphs.length > 1
    ? rawParagraphs
    : epilogue.split(/(?<=[.!?])\s+(?=[A-Z])/).reduce((acc: string[], sentence) => {
        const lastIdx = acc.length - 1;
        if (lastIdx >= 0 && acc[lastIdx].split(/[.!?]/).length < 5) {
          acc[lastIdx] += ' ' + sentence;
        } else {
          acc.push(sentence);
        }
        return acc;
      }, []);

  return (
    <>
      {/* Emotional pause */}
      <motion.div
        ref={pause.ref}
        initial="hidden"
        animate={pause.isInView ? 'visible' : 'hidden'}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } } }}
        className="text-center px-8 py-8 max-w-[520px] mx-auto"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-[1px] bg-[#c4a265]/30" />
          <span className="text-[#c4a265]/50 text-[0.7rem]">✦</span>
          <div className="w-10 h-[1px] bg-[#c4a265]/30" />
        </div>
        <p
          className="text-[1.05rem] text-[#9a8578] italic leading-[1.8]"
          style={{ fontFamily: 'Cormorant, serif' }}
        >
          {occasionMode === 'memorial'
            ? `Now, take a breath. ${petName} has something to tell you.`
            : `Now, the part that matters most. ${petName} has something to say to you.`}
        </p>
      </motion.div>

      {/* Header */}
      <motion.div
        ref={header.ref}
        initial="hidden"
        animate={header.isInView ? 'visible' : 'hidden'}
        variants={header.variants}
        className="text-center px-6 py-3 max-w-[520px] mx-auto"
      >
        <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
          A Message From {petName}&rsquo;s Soul
        </div>
      </motion.div>

      {/* The letter — dark immersive container */}
      <div
        className="mx-4 my-2.5 max-w-[520px] sm:mx-auto rounded-[20px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #3d2f2a 0%, #2a1f1a 40%, #1a1210 100%)',
          boxShadow: '0 8px 40px rgba(61,47,42,0.35)',
          border: '1px solid rgba(196,162,101,0.15)',
        }}
      >
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.4), transparent 70%)' }} />

        <div className="relative z-10 px-7 py-10 sm:px-9">
          {/* Opening quote */}
          <div className="text-[3.5rem] leading-none text-[#c4a265]/25 font-serif mb-2">&ldquo;</div>

          {/* Paragraphs with staggered reveal */}
          <div className="space-y-5">
            {paragraphs.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                className="text-[0.95rem] sm:text-[1rem] text-white/80 leading-[2] italic"
                style={{ fontFamily: 'Cormorant, serif' }}
              >
                {para}
              </motion.p>
            ))}
          </div>

          {/* Closing quote */}
          <div className="text-[3.5rem] leading-none text-[#c4a265]/25 font-serif mt-3 text-right">&rdquo;</div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 my-5">
            <div className="w-10 h-[1px] bg-[#c4a265]/20" />
            <span className="text-[#c4a265]/40 text-[0.6rem]">✦</span>
            <div className="w-10 h-[1px] bg-[#c4a265]/20" />
          </div>

          {/* Attribution */}
          <div className="text-center">
            <div className="text-[0.9rem] text-[#c4a265] font-bold">
              — {petName}&rsquo;s Soul {signIcon}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
