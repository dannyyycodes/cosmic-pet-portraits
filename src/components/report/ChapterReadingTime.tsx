import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChapterReadingTimeProps {
  /** Chapter ids in document order — must match the `id="chapter-N"` on each ChapterTitle. */
  chapterAnchors: { number: number; title: string; anchor: string }[];
}

// Floating "~3 min left in this chapter" pill. Watches each chapter
// section's intersection, computes word-count of the visible chapter
// minus what the reader has already passed. Reframes the report as
// "lots of small commitments" instead of one infinite scroll.
export function ChapterReadingTime({ chapterAnchors }: ChapterReadingTimeProps) {
  const [active, setActive] = useState<{ idx: number; remaining: number } | null>(null);

  useEffect(() => {
    if (chapterAnchors.length === 0) return;

    // Word count cache per chapter (stable across renders).
    const wordCounts = new Map<string, number>();
    const measure = (anchor: string) => {
      if (wordCounts.has(anchor)) return wordCounts.get(anchor)!;
      const start = document.getElementById(anchor);
      if (!start) return 0;
      const idx = chapterAnchors.findIndex((c) => c.anchor === anchor);
      const next = chapterAnchors[idx + 1];
      const end = next ? document.getElementById(next.anchor) : null;
      // Walk forward through DOM until we hit the next chapter (or the end).
      let words = 0;
      let node: Node | null = start;
      while (node && node !== end) {
        if (node.nodeType === Node.TEXT_NODE) {
          words += (node.textContent || '').trim().split(/\s+/).filter(Boolean).length;
        }
        // Depth-first traversal.
        if (node.firstChild) {
          node = node.firstChild;
        } else {
          while (node && !node.nextSibling && node.parentNode) {
            node = node.parentNode;
            if (node === end) break;
          }
          if (node) node = node.nextSibling;
        }
      }
      wordCounts.set(anchor, words);
      return words;
    };

    const onScroll = () => {
      // Find the chapter whose top is above the viewport mid but bottom is below it.
      const mid = window.innerHeight / 2;
      let activeIdx = -1;
      for (let i = 0; i < chapterAnchors.length; i++) {
        const el = document.getElementById(chapterAnchors[i].anchor);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= mid) activeIdx = i;
      }
      if (activeIdx === -1) {
        setActive(null);
        return;
      }
      const anchor = chapterAnchors[activeIdx].anchor;
      const total = measure(anchor);
      const start = document.getElementById(anchor)?.getBoundingClientRect().top ?? 0;
      const next = chapterAnchors[activeIdx + 1]
        ? document.getElementById(chapterAnchors[activeIdx + 1].anchor)?.getBoundingClientRect().top
        : start + window.innerHeight * 4;
      const span = (next ?? start) - start;
      const passed = Math.max(0, Math.min(1, -start / Math.max(span, 1)));
      const remaining = Math.max(0, total * (1 - passed));
      const minutes = Math.max(1, Math.round(remaining / 220));
      setActive({ idx: activeIdx, remaining: minutes });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [chapterAnchors]);

  return (
    <div
      className="fixed top-4 right-3 z-40 pointer-events-none hidden md:block"
      aria-live="polite"
    >
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.idx}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 0.92, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45 }}
            className="rounded-full bg-[#FFFDF5]/85 backdrop-blur-md border border-[#c4a265]/30 px-3 py-1.5 text-[0.62rem] tracking-[0.18em] uppercase text-[#5a4a42] font-sans shadow-sm"
          >
            <span className="text-[#c4a265]">Ch {active.idx + 1}</span>
            <span className="text-[#c4a265]/40 mx-1.5">·</span>
            <span>~{active.remaining} min left</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
