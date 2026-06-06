import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ReactNode } from 'react';

type Dir = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: ReactNode;
  /** Slide-in direction. Default 'up'. */
  from?: Dir;
  /** Seconds delay (stagger). */
  delay?: number;
  /** Travel distance px. Default 24. */
  distance?: number;
  /** Duration s. Default 0.8. */
  duration?: number;
  /** Add a gentle blur-in. Default true. */
  blur?: boolean;
  className?: string;
  /** Re-trigger every time it enters view. Default false (once). */
  repeat?: boolean;
  style?: React.CSSProperties;
}

const offset = (from: Dir, d: number) => {
  switch (from) {
    case 'up': return { y: d };
    case 'down': return { y: -d };
    case 'left': return { x: d };
    case 'right': return { x: -d };
    default: return {};
  }
};

// Reveal-on-scroll primitive. GPU-only (transform/opacity/filter). Respects
// reduced-motion (renders final state instantly). The whole report's "discovered,
// not scrolled" feel is built on this — every meaningful beat fades + rises in.
export function Reveal({
  children, from = 'up', delay = 0, distance = 24, duration = 0.8,
  blur = true, className, repeat = false, style,
}: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} style={style}>{children}</div>;

  const variants: Variants = {
    hidden: { opacity: 0, ...offset(from, distance), filter: blur ? 'blur(6px)' : 'blur(0px)' },
    show: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)',
      transition: { duration, delay, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: !repeat, margin: '-12% 0px' }}
    >
      {children}
    </motion.div>
  );
}
