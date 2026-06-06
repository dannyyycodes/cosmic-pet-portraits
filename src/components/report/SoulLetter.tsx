import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';
import { deDash } from './cosmic/text';
import { CosmicLineIcon } from './cosmic/CosmicLineIcon';

interface SoulLetterProps {
  petName: string;
  epilogue: string;
  sunSign: string;
  occasionMode?: string;
}

// A small drawn wax-seal motif in gold + violet — the keepsake's signature mark.
// Stroke-only SVG so it matches the CosmicLineIcon family; the sun-sign glyph
// sits embossed at its centre.
function WaxSeal({ glyph }: { glyph: string }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 56,
        height: 56,
        background:
          'radial-gradient(circle at 34% 28%, rgba(230,193,121,0.35), rgba(154,126,230,0.18) 55%, rgba(10,8,16,0.9) 92%)',
        boxShadow:
          '0 6px 22px rgba(154,126,230,0.28), inset 0 1px 2px rgba(255,216,107,0.35), inset 0 -3px 6px rgba(10,8,16,0.6)',
      }}
      aria-hidden="true"
    >
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* wax rim + stitched inner ring */}
        <circle cx="28" cy="28" r="23" stroke="#e6c179" strokeOpacity="0.7" strokeWidth="1.2" />
        <circle
          cx="28"
          cy="28"
          r="19"
          stroke="#e6c179"
          strokeOpacity="0.45"
          strokeWidth="1"
          strokeDasharray="1.5 3"
        />
      </svg>
      <span
        className="relative font-serif select-none"
        style={{
          fontSize: '1.5rem',
          color: '#ffd86b',
          textShadow: '0 1px 2px rgba(10,8,16,0.7)',
        }}
      >
        {glyph || '✦'}
      </span>
    </span>
  );
}

// SoulLetter — the emotional climax, framed as an actual letter from the pet's
// soul: a parchment-of-light card on the dark cosmic ground, a serif drop-cap
// opening the first paragraph, a comfortable ~62ch reading measure, bright body
// (#ece5ff) at >=1.06rem / lh 1.7, and an elegant signature line closed with a
// drawn gold wax-seal. The keepsake centrepiece. All copy verbatim (deDash only).
export function SoulLetter({ petName, epilogue, sunSign, occasionMode }: SoulLetterProps) {
  const pause = useScrollReveal();
  const header = useScrollReveal();
  const signData = zodiacSigns[sunSign.toLowerCase()];
  const signGlyph = signData?.icon || '';

  // Split epilogue into paragraphs for breathing room.
  const rawParagraphs = epilogue.split(/\n\n+/).filter(Boolean);
  // If only 1 paragraph, group sentences into ~3 readable blocks.
  const paragraphs = (rawParagraphs.length > 1
    ? rawParagraphs
    : epilogue.split(/(?<=[.!?])\s+(?=[A-Z])/).reduce((acc: string[], sentence) => {
        const lastIdx = acc.length - 1;
        if (lastIdx >= 0 && acc[lastIdx].split(/[.!?]/).length < 5) {
          acc[lastIdx] += ' ' + sentence;
        } else {
          acc.push(sentence);
        }
        return acc;
      }, [])
  ).map((p) => deDash(p));

  return (
    <>
      {/* Emotional pause */}
      <motion.div
        ref={pause.ref}
        initial="hidden"
        animate={pause.isInView ? 'visible' : 'hidden'}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } },
        }}
        className="text-center px-7 py-9 max-w-[520px] mx-auto"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-10" style={{ background: 'rgba(230,193,121,0.35)' }} />
          <CosmicLineIcon name="sparkle" size={15} className="text-[#e6c179]" />
          <div className="h-px w-10" style={{ background: 'rgba(230,193,121,0.35)' }} />
        </div>
        <p
          className="italic"
          style={{
            fontFamily: 'Cormorant, serif',
            color: '#ece5ff',
            fontSize: 'clamp(1.1rem,2.8vw,1.3rem)',
            lineHeight: 1.7,
          }}
        >
          {deDash(occasionMode === 'memorial'
            ? `Now, take a breath. ${petName} has something to tell you.`
            : `Now, the part that matters most. ${petName} has something to say to you.`)}
        </p>
      </motion.div>

      {/* Header / eyebrow */}
      <motion.div
        ref={header.ref}
        initial="hidden"
        animate={header.isInView ? 'visible' : 'hidden'}
        variants={header.variants}
        className="text-center px-6 pt-2 pb-4 max-w-[560px] mx-auto"
      >
        <div
          className="font-bold uppercase"
          style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: '#e6c179' }}
        >
          A Message From {petName}&rsquo;s Soul
        </div>
      </motion.div>

      {/* The letter — parchment-of-light on the dark cosmic ground */}
      <div
        className="mx-4 my-3 sm:mx-auto rounded-[22px] relative overflow-hidden"
        style={{
          maxWidth: 600,
          background:
            'linear-gradient(168deg, rgba(34,26,68,0.92) 0%, rgba(22,16,42,0.95) 46%, rgba(10,8,16,0.97) 100%)',
          boxShadow: '0 18px 60px rgba(10,8,16,0.6), 0 0 0 1px rgba(154,126,230,0.16)',
          border: '1px solid #2a1f47',
        }}
      >
        {/* Parchment-of-light glow accents */}
        <div
          className="absolute -top-10 right-0 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(230,193,121,0.18), transparent 68%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-12 left-0 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(154,126,230,0.2), transparent 68%)' }}
          aria-hidden="true"
        />
        {/* faint top sheen — the "light on parchment" */}
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(243,236,255,0.06), transparent)' }}
          aria-hidden="true"
        />

        <div
          className="relative z-10"
          style={{ padding: 'clamp(30px,7vw,52px) clamp(24px,6vw,48px)' }}
        >
          {/* Opening quote glyph */}
          <div
            aria-hidden="true"
            className="leading-none mb-1 select-none"
            style={{
              fontSize: '3.4rem',
              color: 'rgba(230,193,121,0.32)',
              fontFamily: 'DM Serif Display, serif',
            }}
          >
            &ldquo;
          </div>

          {/* Paragraphs — drop-cap on the first, comfortable reading measure */}
          <div style={{ maxWidth: '62ch', marginInline: 'auto' }}>
            {paragraphs.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={i === 0 ? 'soul-letter-dropcap' : ''}
                style={{
                  fontFamily: 'Cormorant, serif',
                  color: '#ece5ff',
                  fontSize: 'clamp(1.06rem,2.4vw,1.18rem)',
                  lineHeight: 1.7,
                  marginTop: i === 0 ? 0 : 'clamp(16px,3.5vw,22px)',
                }}
              >
                {para}
              </motion.p>
            ))}
          </div>

          {/* Closing quote glyph */}
          <div
            aria-hidden="true"
            className="leading-none mt-3 text-right select-none"
            style={{
              fontSize: '3.4rem',
              color: 'rgba(230,193,121,0.32)',
              fontFamily: 'DM Serif Display, serif',
            }}
          >
            &rdquo;
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3 my-6">
            <div className="h-px w-12" style={{ background: 'rgba(230,193,121,0.3)' }} />
            <CosmicLineIcon name="star" size={14} className="text-[#e6c179]" />
            <div className="h-px w-12" style={{ background: 'rgba(230,193,121,0.3)' }} />
          </div>

          {/* Signature line + wax seal (no dash) */}
          <div className="flex items-center justify-center gap-3.5">
            <div className="text-right">
              <div
                style={{
                  fontFamily: 'Caveat, cursive',
                  fontSize: 'clamp(1.5rem,4vw,1.9rem)',
                  color: '#ffd86b',
                  lineHeight: 1.1,
                }}
              >
                {petName}&rsquo;s Soul
              </div>
              <div
                className="uppercase"
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.18em',
                  color: '#b9a8e0',
                  marginTop: 4,
                }}
              >
                Written in the stars
              </div>
            </div>
            <WaxSeal glyph={signGlyph} />
          </div>
        </div>
      </div>

      {/* Drop-cap styling for the first paragraph's first letter. */}
      <style>{`
        .soul-letter-dropcap::first-letter {
          font-family: 'DM Serif Display', serif;
          font-size: 3.4em;
          line-height: 0.78;
          float: left;
          margin: 0.04em 0.09em 0 0;
          color: #e6c179;
          font-style: normal;
        }
      `}</style>
    </>
  );
}
