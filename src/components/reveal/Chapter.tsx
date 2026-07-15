import { Fragment, useEffect, useRef } from 'react';
import { ReadingCard } from './ReadingCard';
import { ChapterHero } from './ChapterHero';
import { Divider, MotifInterlude } from './Flourishes';
import type { ChapterModel } from './types';

interface Props {
  chapter: ChapterModel;
  onActive: (chapter: ChapterModel) => void;
  eagerHero?: boolean;          // first chapter -> load hero immediately
  isMemorial?: boolean;
  children?: React.ReactNode;   // extra content (e.g. keepsake in Legacy)
}

export function Chapter({ chapter, onActive, eagerHero, isMemorial, children }: Props) {
  const ref = useRef<HTMLElement | null>(null);

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

  // insert the element motif once the emotional (hero) cards give way to the
  // lighter cards — a natural mid-chapter breath. Fallback: middle of the run.
  const firstNonHero = chapter.cards.findIndex((c) => c.tier !== 'hero');
  const motifAt = chapter.motif
    ? firstNonHero > 0
      ? firstNonHero
      : Math.ceil(chapter.cards.length / 2)
    : -1;

  return (
    <section
      ref={ref}
      className="rv-chapter"
      id={`chapter-${chapter.id}`}
      aria-labelledby={`chtitle-${chapter.id}`}
    >
      <ChapterHero chapter={chapter} eager={eagerHero} isMemorial={isMemorial} />

      <div className="rv-chapter-inner">
        <div className="rv-cards">
          {chapter.cards.map((card, i) => (
            <Fragment key={card.key}>
              {i > 0 && i !== motifAt && <Divider index={chapter.index + i} />}
              {i === motifAt && chapter.motif && (
                <MotifInterlude motif={chapter.motif} accent={chapter.accent} />
              )}
              <ReadingCard card={card} />
            </Fragment>
          ))}
        </div>
        {children}
      </div>
    </section>
  );
}
