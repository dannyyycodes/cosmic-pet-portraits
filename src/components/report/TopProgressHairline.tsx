import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

// 2px gold gradient bar pinned to the top of the viewport. Fills as the
// reader moves through the report. Externalises progress so the brain
// stops asking "how much left?" — the bar tells you. Sits above the
// side-rail (which gives chapter granularity) without competing.
export function TopProgressHairline() {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.7 });
  const scaleX = useTransform(fill, (v) => v);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 inset-x-0 z-50 pointer-events-none h-[3px]"
      style={{ background: 'rgba(139,123,216,0.08)' }}
    >
      <motion.div
        className="h-full origin-left"
        style={{
          scaleX,
          background:
            'linear-gradient(90deg, rgba(139,123,216,0) 0%, #8b7bd8 25%, #a78bfa 50%, #8b7bd8 75%, rgba(139,123,216,0.6) 100%)',
          boxShadow: '0 0 8px rgba(139,123,216,0.4)',
        }}
      />
    </div>
  );
}
