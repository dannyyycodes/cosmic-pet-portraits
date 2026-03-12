import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ReadingTransitionProps {
  petName: string;
}

export function ReadingTransition({ petName }: ReadingTransitionProps) {
  const s = useScrollReveal();

  const containerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut', staggerChildren: 0.22, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  const portalVariants = {
    hidden: { scaleY: 0, opacity: 0 },
    visible: {
      scaleY: 1,
      opacity: 1,
      transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.05 },
    },
  };

  const dotVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: [0, 1, 0.7],
      scale: [0, 1.2, 1],
      transition: { duration: 0.9, ease: 'easeOut', delay: 0.5 },
    },
  };

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className="mx-4 my-2.5 max-w-[520px] sm:mx-auto"
    >
      {/* Outer container with dark gradient and purple border */}
      <div
        className="relative rounded-[20px] overflow-hidden text-center px-8 py-10"
        style={{
          background: 'linear-gradient(160deg, #2a1f2a 0%, #1a1520 100%)',
          border: '1px solid rgba(184,160,212,0.15)',
        }}
      >
        {/* Corner glow — top-left */}
        <div
          className="absolute top-0 left-0 w-28 h-28 rounded-[20px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 0% 0%, rgba(184,160,212,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Corner glow — bottom-right */}
        <div
          className="absolute bottom-0 right-0 w-28 h-28 rounded-[20px] pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 100% 100%, rgba(184,160,212,0.14) 0%, transparent 70%)',
          }}
        />

        {/* Portal vertical line — left */}
        <motion.div
          variants={portalVariants}
          className="absolute left-6 top-8 bottom-8 w-[1px] origin-center"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(184,160,212,0.5) 35%, rgba(184,160,212,0.8) 50%, rgba(184,160,212,0.5) 65%, transparent 100%)',
          }}
        />

        {/* Portal vertical line — right */}
        <motion.div
          variants={portalVariants}
          className="absolute right-6 top-8 bottom-8 w-[1px] origin-center"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(184,160,212,0.5) 35%, rgba(184,160,212,0.8) 50%, rgba(184,160,212,0.5) 65%, transparent 100%)',
          }}
        />

        {/* Inner content */}
        <div className="relative z-10 flex flex-col items-center gap-0">

          {/* Label */}
          <motion.div
            variants={itemVariants}
            className="text-[0.55rem] font-bold tracking-[3px] uppercase mb-4"
            style={{ color: '#b8a0d4' }}
          >
            {petName}&rsquo;s Personal Reading
          </motion.div>

          {/* Pulsing star anchor */}
          <motion.div
            variants={dotVariants}
            className="mb-5"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.span
              animate={
                s.isInView
                  ? {
                      opacity: [0.5, 1, 0.5],
                      textShadow: [
                        '0 0 6px rgba(184,160,212,0.4)',
                        '0 0 16px rgba(184,160,212,0.9)',
                        '0 0 6px rgba(184,160,212,0.4)',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                fontSize: '1.1rem',
                color: '#b8a0d4',
                display: 'inline-block',
              }}
            >
              ✦
            </motion.span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="text-[1.6rem] leading-tight mb-4 text-white"
            style={{ fontFamily: 'DM Serif Display, serif' }}
          >
            Now, Let&rsquo;s Meet {petName}&rsquo;s Soul
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-[0.92rem] leading-[1.8] max-w-[340px] mx-auto italic"
            style={{
              fontFamily: 'Cormorant, serif',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Everything below was calculated from {petName}&rsquo;s birth chart. No two readings are alike.
          </motion.p>

        </div>
      </div>
    </motion.div>
  );
}
