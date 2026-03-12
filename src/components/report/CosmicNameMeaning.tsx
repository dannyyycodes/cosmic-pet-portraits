import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ReportContent } from './types';

interface CosmicNameMeaningProps {
  nameMeaning: ReportContent['nameMeaning'];
}

export function CosmicNameMeaning({ nameMeaning }: CosmicNameMeaningProps) {
  const s = useScrollReveal();

  if (!nameMeaning) return null;

  // Split cosmicSignificance into paragraphs if long
  const significanceParagraphs = nameMeaning.cosmicSignificance
    .split(/\n\n+/)
    .filter(Boolean);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-3 max-w-[520px] sm:mx-auto bg-white rounded-[18px] border border-[#e8ddd0]"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
    >
      {/* Header section with warm tint */}
      <div
        className="px-6 pt-6 pb-5 sm:px-8 sm:pt-7 text-center rounded-t-[18px]"
        style={{ background: 'linear-gradient(170deg, #faf6ef 0%, #f5efe6 100%)' }}
      >
        <div className="text-[0.52rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-3">
          Cosmic Name Meaning
        </div>

        <h3
          className="text-[1.8rem] sm:text-[2.1rem] text-[#3d2f2a] leading-tight"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {nameMeaning.title}
        </h3>

        {/* Numerology vibration number */}
        {nameMeaning.nameVibration && (
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{
              background: 'rgba(196,162,101,0.08)',
              border: '1px solid rgba(196,162,101,0.18)',
            }}
          >
            <span className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c4a265]">
              Name Vibration
            </span>
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[0.75rem] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #c4a265, #a8893e)' }}
            >
              {nameMeaning.nameVibration}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 py-1 px-6"
        style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(196,162,101,0.08) 50%, transparent 95%)' }}
      >
        <div className="w-10 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #c4a265)' }} />
        <span className="text-[#c4a265]/50 text-[0.5rem]">✦</span>
        <div className="w-10 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #c4a265)' }} />
      </div>

      {/* Content body */}
      <div className="px-6 pb-6 sm:px-8 sm:pb-7">
        {/* Cosmic significance */}
        <div className="mt-4 space-y-3">
          {significanceParagraphs.map((para, i) => (
            <p
              key={i}
              className="text-[0.88rem] leading-[1.85] text-[#5a4a42]"
            >
              {para}
            </p>
          ))}
        </div>

        {/* Origin section */}
        {nameMeaning.origin && (
          <div className="mt-5 p-4 rounded-[12px] bg-[#faf6ef] border-l-[3px] border-[#c4a265]">
            <div className="text-[0.6rem] font-bold tracking-[1.5px] uppercase text-[#c4a265] mb-1.5">
              Origin
            </div>
            <p className="text-[0.82rem] text-[#5a4a42] leading-[1.7]">
              {nameMeaning.origin}
            </p>
          </div>
        )}

        {/* Numerology meaning */}
        {nameMeaning.numerologyMeaning && (
          <div className="mt-4 p-4 rounded-[12px] bg-[#faf6ef]" style={{ border: '1px solid rgba(196,162,101,0.12)' }}>
            <div className="text-[0.6rem] font-bold tracking-[1.5px] uppercase text-[#c4a265] mb-1.5">
              Numerology
            </div>
            <p className="text-[0.82rem] text-[#5a4a42] leading-[1.7]">
              {nameMeaning.numerologyMeaning}
            </p>
          </div>
        )}

        {/* Fun fact */}
        {nameMeaning.funFact && (
          <p className="mt-4 text-[0.78rem] text-[#9a8578] italic leading-[1.6]"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {nameMeaning.funFact}
          </p>
        )}
      </div>
    </motion.div>
  );
}
