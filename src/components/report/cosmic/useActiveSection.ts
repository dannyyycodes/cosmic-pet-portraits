import { useEffect, useRef, useState, useCallback } from 'react';

// ONE shared IntersectionObserver for the whole planet system.
// Tracks which planet section is active (most-visible) + which have been
// "discovered" (entered view at least once) + a 0..1 scroll progress.
// Codex risk note: don't let every component invent its own scroll logic.
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const [discovered, setDiscovered] = useState<Set<string>>(() => new Set());
  const [inView, setInView] = useState(false); // any planet section currently on screen
  const ratios = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(`planet-${id}`))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const newlySeen: string[] = [];
        for (const e of entries) {
          const id = e.target.id.replace(/^planet-/, '');
          ratios.current.set(id, e.isIntersecting ? e.intersectionRatio : 0);
          if (e.isIntersecting && e.intersectionRatio > 0.3) newlySeen.push(id);
        }
        // most-visible section becomes active
        let best: string | null = null;
        let bestR = 0;
        ratios.current.forEach((r, id) => {
          if (r > bestR) { bestR = r; best = id; }
        });
        if (best && bestR > 0.12) setActive(best);
        let any = false;
        ratios.current.forEach((r) => { if (r > 0.02) any = true; });
        setInView(any);
        if (newlySeen.length) {
          setDiscovered((prev) => {
            let changed = false;
            const next = new Set(prev);
            for (const id of newlySeen) if (!next.has(id)) { next.add(id); changed = true; }
            return changed ? next : prev;
          });
        }
      },
      { threshold: [0, 0.12, 0.3, 0.6, 0.9], rootMargin: '-15% 0px -35% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(`planet-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return { active, discovered, scrollTo, inView };
}
