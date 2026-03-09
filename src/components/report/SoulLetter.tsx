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
  const letter = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signIcon = signData?.icon || '⭐';

  return (
    <>
      {/* Emotional pause before the letter */}
      <motion.div
        ref={pause.ref}
        initial="hidden"
        animate={pause.isInView ? 'visible' : 'hidden'}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } } }}
        className="text-center px-8 py-12 max-w-[520px] mx-auto"
      >
        <div className="w-16 h-[1px] bg-[#c4a265]/40 mx-auto mb-6" />
        <p
          className="text-[1.05rem] text-[#9a8578] italic leading-[1.8]"
          style={{ fontFamily: 'Cormorant, serif' }}
        >
          {occasionMode === 'memorial'
            ? `Now, take a breath. ${petName} has something to tell you.`
            : `Now, the part that matters most. ${petName} has something to say to you.`}
        </p>
        <div className="w-16 h-[1px] bg-[#c4a265]/40 mx-auto mt-6" />
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
        <h2 className="font-dm-serif text-2xl text-[#3d2f2a] leading-tight mt-1.5">
          The Part That Makes People Cry
        </h2>
      </motion.div>

      {/* The letter itself */}
      <motion.div
        ref={letter.ref}
        initial="hidden"
        animate={letter.isInView ? 'visible' : 'hidden'}
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 1, ease: 'easeOut' } } }}
        className="mx-4 my-2.5 py-9 px-7 rounded-[18px] text-center italic max-w-[520px] sm:mx-auto relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #faf6ef 0%, #f5ede0 30%, #f0e6d6 60%, #ebe0d2 100%)',
          boxShadow: '0 4px 24px rgba(196,162,101,0.12), inset 0 1px 0 rgba(255,255,255,0.6)',
          border: '1px solid rgba(196,162,101,0.2)',
        }}
      >
        {/* Soft corner glow */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.15), transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,162,101,0.15), transparent 70%)' }} />

        {/* Opening quote mark */}
        <div className="font-dm-serif text-[4rem] text-[#c4a265]/40 leading-none -mb-2 not-italic">
          &ldquo;
        </div>

        <div
          className="text-[1.02rem] leading-[2] text-[#3d2f2a] px-2 max-w-md mx-auto"
          style={{ fontFamily: 'Cormorant, serif' }}
          dangerouslySetInnerHTML={{ __html: epilogue.replace(/\n\n/g, '<br /><br />') }}
        />

        {/* Closing quote */}
        <div className="font-dm-serif text-[4rem] text-[#c4a265]/40 leading-none -mt-2 not-italic">
          &rdquo;
        </div>

        <div className="w-10 h-[1px] bg-[#c4a265]/30 mx-auto my-3" />

        <div className="not-italic font-bold text-[#3d2f2a] text-[0.9rem]">
          — {petName}&rsquo;s Soul {signIcon}
        </div>
      </motion.div>
    </>
  );
}
