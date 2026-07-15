import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { heroMobile, heroWide } from './assets';
import type { ChapterModel } from './types';

/**
 * ChapterHero — a full-bleed cosmic image that opens every chapter. The title,
 * numeral and subtitle sit in the lower third over a scrim so the image melts
 * into the page. A gentle transform parallax gives depth without mobile jank
 * (single GPU-composited transform, disabled under reduced-motion).
 *
 * `eager` marks the very first hero so it paints immediately; the rest lazy-load.
 */
export function ChapterHero({
  chapter,
  eager = false,
  isMemorial = false,
}: {
  chapter: ChapterModel;
  eager?: boolean;
  isMemorial?: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  // image drifts slower than the scroll -> parallax depth
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.06, 1.12]);

  const wide = heroWide(chapter.hero);
  const mobile = heroMobile(chapter.hero);

  return (
    <div className="rv-chero" ref={ref} aria-hidden="true">
      <motion.div
        className="rv-chero-media"
        style={reduced ? undefined : { y, scale }}
      >
        <picture>
          <source media="(max-width: 640px)" srcSet={mobile} />
          <img
            src={wide}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'low'}
            decoding="async"
            draggable={false}
          />
        </picture>
      </motion.div>

      <div className="rv-chero-scrim" />
      <div className="rv-chero-glow" style={{ ['--rv-accent' as string]: chapter.accent }} />

      <motion.div
        className="rv-chero-caption"
        initial={reduced ? undefined : { opacity: 0, y: 26, filter: 'blur(6px)' }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="rv-chero-num">{`Chapter ${chapter.numeral}`}</span>
        <h2 className="rv-chero-title" id={`chtitle-${chapter.id}`}>{chapter.title}</h2>
        <p className="rv-chero-sub">{chapter.subtitle}</p>
        {isMemorial && chapter.special === 'legacy' && (
          <span className="rv-chero-tender">held in the light</span>
        )}
      </motion.div>
    </div>
  );
}
