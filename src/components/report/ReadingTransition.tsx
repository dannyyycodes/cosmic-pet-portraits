import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ReadingTransitionProps {
  petName: string;
}

export function ReadingTransition({ petName }: ReadingTransitionProps) {
  const s = useScrollReveal();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.18,
        delayChildren: 0.1,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  };

  const dividerVariants = {
    hidden: { opacity: 0, scaleX: 0.6 },
    visible: { opacity: 1, scaleX: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className="text-center px-8 py-10 max-w-[520px] mx-auto"
      style={{ paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      {/* Top decorative divider */}
      <motion.div
        variants={dividerVariants}
        className="flex items-center justify-center gap-3 mb-7"
        style={{ originX: '50%' }}
      >
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, #c4a265)',
          }}
        />
        <span
          style={{
            color: '#c4a265',
            fontSize: '0.85rem',
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          ✦
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(to left, transparent, #c4a265)',
          }}
        />
      </motion.div>

      {/* Gold label */}
      <motion.div
        variants={fadeUp}
        className="mb-5"
        style={{
          color: '#c4a265',
          fontSize: '0.6rem',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          fontVariant: 'small-caps',
        }}
      >
        {petName}&rsquo;s Personal Reading
      </motion.div>

      {/* Main heading */}
      <motion.h2
        variants={fadeUp}
        className="mb-4"
        style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: '1.6rem',
          lineHeight: 1.35,
          color: '#3d2f2a',
          margin: '0 0 1rem',
        }}
      >
        Now, Let&rsquo;s Meet {petName}&rsquo;s Soul
      </motion.h2>

      {/* Subtitle */}
      <motion.p
        variants={fadeUp}
        style={{
          fontFamily: 'Cormorant, serif',
          fontStyle: 'italic',
          fontSize: '1.05rem',
          lineHeight: 1.75,
          color: '#9a8578',
          margin: '0 auto',
          maxWidth: '360px',
        }}
      >
        Everything below was calculated from {petName}&rsquo;s birth chart. No two readings are alike.
      </motion.p>

      {/* Bottom decorative divider */}
      <motion.div
        variants={dividerVariants}
        className="flex items-center justify-center gap-3 mt-7"
        style={{ originX: '50%' }}
      >
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, #c4a265)',
          }}
        />
        <span
          style={{
            color: '#c4a265',
            fontSize: '0.85rem',
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          ✦
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: 'linear-gradient(to left, transparent, #c4a265)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
