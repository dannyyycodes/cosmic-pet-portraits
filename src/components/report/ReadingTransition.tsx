import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { CosmicLineIcon } from './cosmic/CosmicLineIcon';

interface ReadingTransitionProps {
  petName: string;
}

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export function ReadingTransition({ petName }: ReadingTransitionProps) {
  const s = useScrollReveal();
  const reduce = !!useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reduce ? 0 : 0.16,
        delayChildren: reduce ? 0 : 0.08,
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.01 : 0.7, ease: EASE } },
  };

  const ruleVariants: Variants = {
    hidden: { opacity: 0, scaleX: reduce ? 1 : 0.55 },
    visible: { opacity: 1, scaleX: 1, transition: { duration: reduce ? 0.01 : 0.85, ease: EASE } },
  };

  const glowVariants: Variants = {
    hidden: { opacity: 0, scale: reduce ? 1 : 0.92 },
    visible: { opacity: 1, scale: 1, transition: { duration: reduce ? 0.01 : 1.1, ease: EASE } },
  };

  const markVariants: Variants = {
    hidden: { opacity: 0, scale: reduce ? 1 : 0.6 },
    visible: { opacity: 1, scale: 1, transition: { duration: reduce ? 0.01 : 0.7, ease: EASE } },
  };

  return (
    <motion.section
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className="relative text-center mx-auto max-w-[560px] px-6 py-14 sm:py-16"
      aria-label={`${petName}'s personal reading`}
    >
      {/* Soft radial glow behind the headline */}
      <motion.div
        variants={glowVariants}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[260px] w-[420px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(154,126,230,0.20) 0%, rgba(154,126,230,0.08) 38%, rgba(10,8,16,0) 72%)',
          filter: 'blur(6px)',
          willChange: 'transform, opacity',
        }}
      />

      {/* Gold framing rule with a single centred cosmic mark */}
      <motion.div
        variants={fadeUp}
        className="mb-7 flex items-center justify-center gap-4 select-none"
        aria-hidden="true"
      >
        <motion.span
          variants={ruleVariants}
          className="h-px w-14 sm:w-20"
          style={{
            transformOrigin: 'right center',
            background:
              'linear-gradient(to right, rgba(230,193,121,0) 0%, rgba(230,193,121,0.42) 100%)',
          }}
        />
        <motion.span
          variants={markVariants}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{
            color: '#e6c179',
            border: '1px solid rgba(230,193,121,0.30)',
            background: 'rgba(230,193,121,0.06)',
            boxShadow: '0 0 18px rgba(230,193,121,0.14)',
          }}
        >
          <CosmicLineIcon name="sparkle" size={17} />
        </motion.span>
        <motion.span
          variants={ruleVariants}
          className="h-px w-14 sm:w-20"
          style={{
            transformOrigin: 'left center',
            background:
              'linear-gradient(to left, rgba(230,193,121,0) 0%, rgba(230,193,121,0.42) 100%)',
          }}
        />
      </motion.div>

      {/* Gold eyebrow */}
      <motion.p
        variants={fadeUp}
        className="mb-4 font-semibold uppercase"
        style={{
          color: '#e6c179',
          fontSize: '0.74rem',
          letterSpacing: '0.26em',
          lineHeight: 1.4,
          margin: '0 0 1rem',
        }}
      >
        {petName}&rsquo;s Personal Reading
      </motion.p>

      {/* Headline */}
      <motion.h2
        variants={fadeUp}
        className="mb-5"
        style={{
          fontFamily: 'DM Serif Display, Cormorant, serif',
          fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
          lineHeight: 1.18,
          color: '#f3ecff',
          letterSpacing: '-0.01em',
          margin: '0 0 1.25rem',
          textShadow: '0 2px 30px rgba(154,126,230,0.22)',
        }}
      >
        Now, Let&rsquo;s Meet {petName}&rsquo;s Soul
      </motion.h2>

      {/* Supporting line */}
      <motion.p
        variants={fadeUp}
        style={{
          fontFamily: 'Cormorant, serif',
          fontStyle: 'italic',
          fontSize: '1.18rem',
          lineHeight: 1.65,
          color: '#ece5ff',
          margin: '0 auto',
          maxWidth: '400px',
        }}
      >
        Everything below was calculated from {petName}&rsquo;s birth chart. No two
        readings are alike.
      </motion.p>
    </motion.section>
  );
}
