import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

export interface ReportChapter {
  number: number;
  title: string;
  anchor: string;
}

interface ReportScrollProgressProps {
  chapters: ReportChapter[];
}

// Fixed gold thread running up the right edge of the report with a dot
// per chapter. Clicking a dot scrolls to the chapter anchor. The thread
// fills from bottom-up as the reader moves through the report.
export function ReportScrollProgress({ chapters }: ReportScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.8 });
  const scaleY = useTransform(fill, (v) => v);

  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = chapters
      .map((c) => document.getElementById(c.anchor))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the top of the viewport that's intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const idx = chapters.findIndex((c) => c.anchor === visible[0].target.id);
          if (idx >= 0) setActive(idx);
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapters]);

  const scrollTo = (anchor: string) => {
    const el = document.getElementById(anchor);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-2 pointer-events-none"
      role="navigation"
      aria-label="Report chapter navigation"
    >
      {/* The rail */}
      <div className="relative w-px h-[60vh] bg-[#c4a265]/15 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 origin-bottom bg-[#c4a265]"
          style={{ scaleY }}
        />
      </div>

      {/* Chapter dots — absolute-positioned along the rail */}
      <div className="absolute inset-y-0 flex flex-col justify-between py-[5%]">
        {chapters.map((c, i) => (
          <button
            key={c.anchor}
            onClick={() => scrollTo(c.anchor)}
            className="pointer-events-auto group relative flex items-center justify-center w-6 h-6 -mx-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a265] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF5]"
            aria-label={`Jump to ${c.title}`}
            aria-current={i === active ? 'true' : undefined}
          >
            <span
              className={
                'block rounded-full transition-all duration-300 ' +
                (i === active
                  ? 'w-2.5 h-2.5 bg-[#c4a265] shadow-[0_0_12px_rgba(196,162,101,0.6)]'
                  : 'w-1.5 h-1.5 bg-[#c4a265]/40 group-hover:bg-[#c4a265]/70')
              }
            />
            <span className="absolute right-5 whitespace-nowrap text-[0.68rem] tracking-wider uppercase text-[#5a4a42]/70 opacity-0 group-hover:opacity-100 transition-opacity font-sans bg-[#FFFDF5]/90 px-2 py-1 rounded border border-[#c4a265]/20">
              {String(c.number).padStart(2, '0')} · {c.title}
            </span>
          </button>
        ))}
      </div>

      {/* Chapter counter (current / total) */}
      <div className="mt-3 text-[0.6rem] tracking-[0.2em] uppercase text-[#c4a265] font-sans pointer-events-none">
        {String(active + 1).padStart(2, '0')}
        <span className="text-[#c4a265]/40"> / {String(chapters.length).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
