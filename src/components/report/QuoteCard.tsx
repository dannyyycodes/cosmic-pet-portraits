import { motion } from 'framer-motion';

interface QuoteCardProps {
  /** The lines of the existing StaticPassage — joined into a single quote. */
  lines: string[];
  /** Tiny attribution under the em-dash, e.g. "The chart, speaking". */
  attribution?: string;
  /** species token replacement, same as StaticPassage. */
  species?: string;
}

const speciesWord = (species?: string) => {
  if (!species) return 'fur';
  const s = species.toLowerCase();
  if (/(bird|parrot|cockatiel|budgie|canary|parakeet)/.test(s)) return 'feathers';
  if (/(reptile|snake|lizard|gecko|iguana|turtle|tortoise|chameleon)/.test(s)) return 'scales';
  if (/(fish|goldfish|betta|guppy|koi)/.test(s)) return 'fins';
  return 'fur';
};

// A poetic-bridge replacement for StaticPassage. Same input lines —
// just presented as an editorial pull quote instead of centered prose
// on cream. Top + bottom hairlines, oversized opening quote glyph, ink
// body in italic Cormorant, gold attribution in Caveat.
export function QuoteCard({ lines, attribution, species }: QuoteCardProps) {
  const cleaned = lines
    .map((l) => l.replace(/\[fur\/feathers\/scales\]/g, speciesWord(species)))
    .filter((l) => l.trim().length > 0);

  // Compose the body — keep line breaks for poetic rhythm.
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative max-w-[560px] mx-auto px-6 py-12 sm:py-14 my-8 text-center"
    >
      {/* Top hairline */}
      <div className="mx-auto mb-6 h-px w-24 bg-gradient-to-r from-transparent via-[#c4a265]/70 to-transparent" />

      {/* Oversized opening quote */}
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
        whileInView={{ opacity: 0.55, scale: 1, rotate: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="block font-serif text-[#c4a265] leading-none mb-3 select-none"
        style={{ fontSize: '3.5rem', fontFamily: 'DM Serif Display, serif' }}
      >
        &ldquo;
      </motion.span>

      <blockquote
        className="text-[#3d2f2a] italic"
        style={{
          fontFamily: 'Cormorant, serif',
          fontSize: 'clamp(1.05rem, 3vw, 1.25rem)',
          lineHeight: 1.7,
        }}
      >
        {cleaned.map((line, i) => (
          <p key={i} className={i < cleaned.length - 1 ? 'mb-2' : ''}>
            {line}
          </p>
        ))}
      </blockquote>

      {attribution && (
        <figcaption className="mt-6 flex items-center justify-center gap-2">
          <span className="block h-px w-6 bg-[#c4a265]/50" />
          <span
            className="text-[#c4a265]"
            style={{ fontFamily: 'Caveat, cursive', fontSize: '1rem' }}
          >
            {attribution}
          </span>
          <span className="block h-px w-6 bg-[#c4a265]/50" />
        </figcaption>
      )}

      {/* Bottom hairline */}
      <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#c4a265]/70 to-transparent" />
    </motion.figure>
  );
}
