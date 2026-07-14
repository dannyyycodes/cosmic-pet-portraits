import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface DirectMessageProps {
  directMessage: {
    title?: string;
    preamble?: string;
    message: string;
    signoff?: string;
  };
  petName: string;
}

// Three-line pullquote — the most shareable single moment in the report.
// The prompt asks for three distinct lines; we split on newlines and render
// each on its own row so it reads as a pullquote / shareable card, not prose.
function splitLines(msg: string): string[] {
  return msg
    .split(/\n+/)
    .map((l) => l.replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

export function DirectMessage({ directMessage, petName }: DirectMessageProps) {
  const s = useScrollReveal();
  const lines = splitLines(directMessage.message);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-4 max-w-[560px] sm:mx-auto"
    >
      <div
        className="py-10 px-6 sm:px-10 rounded-[20px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #f3efff 0%, #fdf5f5 100%)',
          border: '1px solid #e2dbf3',
        }}
      >
        {/* Golden frame corners */}
        <div
          className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl-md"
          style={{ borderColor: '#8b7bd8' }}
        />
        <div
          className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 rounded-tr-md"
          style={{ borderColor: '#8b7bd8' }}
        />
        <div
          className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 rounded-bl-md"
          style={{ borderColor: '#8b7bd8' }}
        />
        <div
          className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br-md"
          style={{ borderColor: '#8b7bd8' }}
        />

        <div className="text-center mb-4">
          <div className="text-[0.6rem] font-bold tracking-[3px] uppercase text-[#8b7bd8] mb-1">
            A Message From {petName}
          </div>
          <h3
            className="text-[1.15rem] text-[#2a2440]"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            {directMessage.title || `The One Thing ${petName} Most Wants You to Know`}
          </h3>
        </div>

        {directMessage.preamble && (
          <p className="text-[0.78rem] text-[#928aa8] text-center leading-[1.7] italic mb-5">
            {directMessage.preamble}
          </p>
        )}

        <div className="text-center space-y-3 py-2">
          {lines.map((line, i) => (
            <p
              key={i}
              className="text-[1.05rem] sm:text-[1.15rem] text-[#2a2440] leading-[1.55]"
              style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}
            >
              {line}
            </p>
          ))}
        </div>

        {directMessage.signoff && (
          <p
            className="text-[0.82rem] text-[#4a4560] text-right mt-6 pt-4 border-t border-[#e2dbf3]"
            style={{ fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}
          >
            {directMessage.signoff}
          </p>
        )}
      </div>
    </motion.div>
  );
}
