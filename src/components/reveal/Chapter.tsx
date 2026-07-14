import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ReadingCard } from './ReadingCard';
import type { ChapterModel } from './types';

interface Props {
  chapter: ChapterModel;
  onActive: (chapter: ChapterModel) => void;
  children?: React.ReactNode;   // extra content (e.g. keepsake in Legacy)
  preHead?: React.ReactNode;    // ceremonial content rendered before the head
}

export function Chapter({ chapter, onActive, children, preHead }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  // active-chapter detection: whichever chapter crosses the viewport middle
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) onActive(chapter);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [chapter, onActive]);

  const headEntrance = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.5 },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section ref={ref} className="rv-chapter" id={`chapter-${chapter.id}`} aria-labelledby={`chtitle-${chapter.id}`}>
      <div className="rv-chapter-inner">
        {preHead}
        <motion.header className="rv-chapter-head" {...headEntrance}>
          <span className="rv-chapter-num">{`Chapter ${chapter.numeral}`}</span>
          <h2 className="rv-chapter-title" id={`chtitle-${chapter.id}`}>{chapter.title}</h2>
          <p className="rv-chapter-sub">{chapter.subtitle}</p>
        </motion.header>
        <div className="rv-cards">
          {chapter.cards.map((card) => <ReadingCard key={card.key} card={card} />)}
        </div>
        {children}
      </div>
    </section>
  );
}
