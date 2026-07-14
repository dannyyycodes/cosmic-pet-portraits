import { motion } from 'framer-motion';

interface PullQuoteProps {
  /** The line to explode — one emotional sentence, keep short. */
  children: React.ReactNode;
  /** Optional attribution or context line below. */
  attribution?: string;
  /** Light (cream) or dark (indigo) background variant. */
  tone?: 'light' | 'dark';
}

// Full-bleed pull quote. Breaks up the wall of report text with a single
// large serif line the reader can't miss. This is the moment that ends up
// in a screenshot.
export function PullQuote({ children, attribution, tone = 'light' }: PullQuoteProps) {
  const isDark = tone === 'dark';

  return (
    <section
      className="relative w-full overflow-hidden py-24 md:py-32 px-6"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #14101f 0%, #2a2440 100%)'
          : 'linear-gradient(180deg, #f6f3ff 0%, #f2eeff 100%)',
      }}
    >
      {/* Parallax glow behind the text */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="w-[110%] h-[110%] blur-3xl"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at center, rgba(139,123,216,0.25) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at center, rgba(139,123,216,0.18) 0%, transparent 60%)',
          }}
        />
      </motion.div>

      <div className="relative max-w-[720px] mx-auto text-center">
        {/* Opening flourish */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 0.7, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.8 }}
          className="font-serif text-5xl md:text-6xl leading-none mb-6 select-none"
          style={{ color: isDark ? '#8b7bd8' : '#8b7bd8' }}
          aria-hidden="true"
        >
          &ldquo;
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="font-serif text-[1.75rem] md:text-[2.75rem] leading-[1.15] tracking-tight"
          style={{
            color: isDark ? '#f6f3ff' : '#14101f',
            fontFamily: '"DM Serif Display", "Playfair Display", Georgia, serif',
          }}
        >
          {children}
        </motion.blockquote>

        {attribution && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8 text-[0.72rem] tracking-[0.35em] uppercase font-sans"
            style={{ color: isDark ? 'rgba(139,123,216,0.8)' : '#928aa8' }}
          >
            {attribution}
          </motion.p>
        )}
      </div>
    </section>
  );
}
