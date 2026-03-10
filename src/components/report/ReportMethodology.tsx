import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ReportMethodologyProps {
  petName: string;
}

const steps = [
  {
    num: '01',
    title: 'Celestial Snapshot',
    desc: (name: string) =>
      `Using ${name}'s birth date, time, and location, we calculate the precise position of every major celestial body. These positions form a unique cosmic fingerprint that never repeats.`,
  },
  {
    num: '02',
    title: 'Planetary Influence Mapping',
    desc: (name: string) =>
      `Each planet governs a specific aspect of personality. The Sun shapes core identity. The Moon governs emotional patterns. Mercury influences communication style. We map each one to understand every layer of who ${name} is.`,
  },
  {
    num: '03',
    title: 'Aspects & Elemental Balance',
    desc: (name: string) =>
      `Planets don't act alone — they form geometric relationships called aspects. When two planets are 120° apart, they create harmony. At 90°, creative tension. We analyse every interaction to reveal ${name}'s inner dynamics.`,
  },
  {
    num: '04',
    title: 'Archetype Synthesis',
    desc: (name: string) =>
      `From this celestial map, a unique soul archetype emerges — a pattern that captures who ${name} truly is beneath the fur, the habits, and the adorable quirks. No two charts produce the same result.`,
  },
];

export function ReportMethodology({ petName }: ReportMethodologyProps) {
  const header = useScrollReveal();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <motion.div
        ref={header.ref}
        initial="hidden"
        animate={header.isInView ? 'visible' : 'hidden'}
        variants={header.variants}
        className="text-center px-8 py-8 max-w-[520px] mx-auto"
      >
        <div className="text-[0.55rem] font-bold tracking-[3px] uppercase text-[#c4a265]">
          Before Your Reading
        </div>
        <h2 className="text-[1.6rem] text-[#3d2f2a] leading-tight mt-2" style={{ fontFamily: 'DM Serif Display, serif' }}>
          How We Mapped {petName}&rsquo;s Soul
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-[0.82rem] text-[#c4a265] hover:text-[#a88a4a] transition-colors cursor-pointer bg-transparent border-none"
          style={{ fontFamily: 'Cormorant, serif' }}
        >
          {isExpanded ? 'Hide details' : 'See how we calculated this'} {isExpanded ? '\u25B4' : '\u203A'}
        </button>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="relative flex flex-col max-w-[520px] mx-auto px-6">
              {/* Connecting line */}
              <div className="absolute left-[46px] top-7 bottom-7 w-[1.5px] bg-gradient-to-b from-[#c4a265] to-[#e8ddd0]" />

              {steps.map((step) => (
                <div
                  key={step.num}
                  className="flex gap-4 py-3.5 relative"
                >
                  <div className="w-11 h-11 rounded-full flex-shrink-0 bg-white border-[1.5px] border-[#c4a265] flex items-center justify-center text-[0.75rem] font-bold text-[#c4a265] relative z-[1]">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="font-dm-serif text-[0.95rem] text-[#3d2f2a] mb-0.5">
                      {step.title}
                    </h4>
                    <p className="text-[0.78rem] text-[#9a8578] leading-[1.55]">
                      {step.desc(petName)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
