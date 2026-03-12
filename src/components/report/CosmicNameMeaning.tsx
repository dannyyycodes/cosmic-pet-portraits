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
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      <div
        className="p-6 sm:p-8 rounded-[18px] text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(170deg, #faf5eb 0%, #f5ece0 40%, #f0e6d6 100%)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          border: '1px solid rgba(196,162,101,0.15)',
        }}
      >
        <div className="text-[0.56rem] font-bold tracking-[3px] uppercase text-[#c4a265]/70 mb-4">
          Cosmic Name Meaning
        </div>

        <div
          className="text-[2rem] sm:text-[2.4rem] text-[#3d2f2a] mb-1 leading-tight"
          style={{ fontFamily: 'DM Serif Display, serif' }}
        >
          {nameMeaning.title}
        </div>

        {/* Ornamental divider */}
        <div className="flex items-center justify-center gap-3 my-4">
          <div className="w-12 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, #c4a265)' }} />
          <span className="text-[#c4a265] text-[0.5rem]" style={{ lineHeight: 1 }}>&#9670;</span>
          <div className="w-6 h-[1px] bg-[#c4a265]" />
          <span className="text-[#c4a265] text-[0.45rem]" style={{ lineHeight: 1 }}>&#10022;</span>
          <div className="w-6 h-[1px] bg-[#c4a265]" />
          <span className="text-[#c4a265] text-[0.5rem]" style={{ lineHeight: 1 }}>&#9670;</span>
          <div className="w-12 h-[1px]" style={{ background: 'linear-gradient(to left, transparent, #c4a265)' }} />
        </div>

        <p
          className="text-[0.88rem] leading-[1.85] text-[#5a4a42] max-w-[380px] mx-auto"
          style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic', fontSize: '1rem' }}
        >
          {nameMeaning.cosmicSignificance}
        </p>

        {nameMeaning.origin && (
          <div className="mt-4 inline-block">
            <span
              className="text-[0.68rem] font-semibold tracking-[1.5px] uppercase px-3 py-1 rounded-full"
              style={{
                background: 'rgba(196,162,101,0.12)',
                color: '#9a8578',
                border: '1px solid rgba(196,162,101,0.2)',
              }}
            >
              Origin: {nameMeaning.origin}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
