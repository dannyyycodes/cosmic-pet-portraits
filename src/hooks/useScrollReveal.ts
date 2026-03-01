import { useRef } from 'react';
import { useInView, Variants } from 'framer-motion';

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.12,
    margin: '0px 0px -30px 0px',
  });

  const variants: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return { ref, variants, isInView };
}
