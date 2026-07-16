import { useMemo } from 'react';
import { useNarration } from './useNarration';
import { NarrationControl } from './NarrationControl';
import { NarratedWords } from './NarratedWords';
import { contentToParagraphs } from '@/components/report/ReportSectionCard';
import type { NarrationBlock } from './types';
import './narration.css';

export interface WholeReadingItem {
  /** Section key, unique. */
  key: string;
  /** Short chapter/section heading shown while it reads. */
  heading: string;
  /** Section title, read first. */
  title: string;
  /** Section body. */
  content: string;
}

/**
 * One control that reads the whole reading aloud, section by section, in a
 * single request and a single audio stream (so it starts on the tap, no
 * autoplay fight). While it reads, a soft live caption shows the current line
 * with the word lighting up in time — the page itself is left untouched.
 */
export function WholeReadingPlayer({ items }: { items: WholeReadingItem[] }) {
  const { blocks, meta } = useMemo(() => {
    const blocks: NarrationBlock[] = [];
    const meta: Record<string, { heading: string; text: string }> = {};
    for (const it of items) {
      if (it.title && it.title.trim()) {
        const id = `${it.key}::title`;
        blocks.push({ id, text: it.title });
        meta[id] = { heading: it.heading, text: it.title };
      }
      contentToParagraphs(it.content).forEach((p, i) => {
        const id = `${it.key}::p${i}`;
        blocks.push({ id, text: p });
        meta[id] = { heading: it.heading, text: p };
      });
    }
    return { blocks, meta };
  }, [items]);

  const nar = useNarration(blocks);

  if (blocks.length === 0 || !nar.available) return null;

  const active = nar.activeBlockId ? meta[nar.activeBlockId] : null;

  return (
    <div className="flex flex-col items-center px-6 py-5">
      <NarrationControl
        nar={nar}
        idleLabel="Play the whole reading"
        busyLabel="Warming the voice"
        playingLabel="Reading it all to you"
      />
      {nar.isActive && active && (
        <div className="mt-4 w-full max-w-[520px] rounded-[14px] border border-[rgba(167,139,250,0.24)] bg-[rgba(154,126,230,0.06)] px-5 py-4 text-center">
          <div className="text-[0.52rem] font-bold uppercase tracking-[2px] text-[#a78bfa]">
            Now reading · {active.heading}
          </div>
          <p
            className="ls-nar-line is-narrating mt-2 text-[0.98rem] leading-[1.7] text-[#d9d2ea]"
            style={{ fontFamily: 'Cormorant, Georgia, serif' }}
          >
            <NarratedWords blockId={nar.activeBlockId as string} text={active.text} nar={nar} />
          </p>
        </div>
      )}
    </div>
  );
}
