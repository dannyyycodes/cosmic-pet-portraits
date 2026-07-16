import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ChevronDown } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useNarration } from '@/components/narration/useNarration';
import { NarrationControl } from '@/components/narration/NarrationControl';
import { NarratedWords, narratedLineClass } from '@/components/narration/NarratedWords';
import type { NarrationBlock } from '@/components/narration/types';

interface ReportSectionCardProps {
  icon: string;
  iconClass: string;
  label: string;
  title: string;
  whyText?: string;
  whyBoxIcon?: string;
  whyLabel?: string;
  content: string;
  tipBox?: { icon: string; label: string; text: string };
  funFact?: string;
  variant?: number;
  collapsible?: boolean;
}

const cleanWhiteStyle = {
  container: 'bg-[#1a1430] rounded-[18px] border border-[rgba(167,139,250,0.22)]',
  containerStyle: { boxShadow: '0 2px 12px rgba(0,0,0,0.04)' } as React.CSSProperties,
};

const variantStyles: Record<number, { container: string; containerStyle: React.CSSProperties }> = {
  0: cleanWhiteStyle,
  1: cleanWhiteStyle,
  2: cleanWhiteStyle,
};

function cleanContent(raw: string): string {
  return raw
    .replace(/\n\n/g, '<br /><br />')
    .replace(/ — /g, '. ')
    .replace(/ – /g, '. ')
    .replace(/^- /gm, '• ')
    .replace(/\n- /g, '<br />• ');
}

function decodeEntities(s: string): string {
  if (typeof document === 'undefined') return s;
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}

// Turn the section's (lightly HTML-flavoured) content into clean spoken
// paragraphs. Used both to build the voice blocks and to render the exact same
// words for the highlight while the voice reads — so the two never drift.
export function contentToParagraphs(raw: string): string[] {
  const stripped = raw.replace(/<[^>]+>/g, ' ');
  const decoded = decodeEntities(stripped);
  return decoded
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/^\s*[-•]\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean);
}

function getPreview(raw: string): string {
  const plain = raw
    .replace(/\n\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/ — /g, '. ')
    .replace(/ – /g, '. ')
    .replace(/^- /gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  // ~120 chars, break at word boundary
  if (plain.length <= 120) return plain;
  const cut = plain.slice(0, 120).replace(/\s\S*$/, '');
  return cut + '...';
}

export function ReportSectionCard({
  icon,
  iconClass,
  label,
  title,
  whyText,
  whyBoxIcon,
  whyLabel,
  content,
  tipBox,
  funFact,
  variant = 0,
  collapsible = false,
}: ReportSectionCardProps) {
  const s = useScrollReveal();
  const v = variantStyles[variant] || variantStyles[0];
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const [showWhy, setShowWhy] = useState(false);

  // Voice: the section title, then each paragraph, read in order. Lazy — the
  // audio is only fetched when the reader taps play.
  const paragraphs = useMemo(() => contentToParagraphs(content), [content]);
  const blocks = useMemo<NarrationBlock[]>(
    () => [
      ...(title && title.trim() ? [{ id: 'title', text: title }] : []),
      ...paragraphs.map((p, i) => ({ id: `p${i}`, text: p })),
    ],
    [title, paragraphs],
  );
  const nar = useNarration(blocks);

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className={`mx-4 my-3 max-w-[520px] sm:mx-auto ${v.container} ${collapsible ? 'cursor-pointer' : ''}`}
      style={v.containerStyle}
      onClick={collapsible && !isExpanded ? () => setIsExpanded(true) : undefined}
    >
      <div className={collapsible && !isExpanded ? 'p-5 sm:p-6' : 'p-6 sm:p-7'}>
        {/* Icon + label row */}
        <div className="flex items-center gap-3">
          <div
            className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0 ${iconClass}`}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#a78bfa]">
              {label}
            </div>
            <h3
              className={narratedLineClass('title', nar, 'text-[1.1rem] text-[#f2eeff] mt-0.5')}
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              <NarratedWords blockId="title" text={title} nar={nar} />
            </h3>
          </div>
          <NarrationControl
            nar={nar}
            mini
            className="flex-shrink-0"
            onBeforeToggle={() => { if (!isExpanded) setIsExpanded(true); }}
          />
          {collapsible && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isExpanded ? 'rgba(139,123,216,0.1)' : 'rgba(139,123,216,0.06)',
                border: '1px solid rgba(139,123,216,0.2)',
              }}
            >
              <ChevronDown
                className={`w-4 h-4 text-[#a78bfa] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Collapsed preview */}
        {collapsible && !isExpanded && (
          <p className="text-[0.82rem] text-[#a29ab8] leading-[1.6] mt-3">
            {getPreview(content)}
          </p>
        )}

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={collapsible ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={collapsible ? { height: 0, opacity: 0 } : undefined}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="mt-4">
                {/* Why box - collapsible */}
                {whyText && (
                  <div className="mb-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowWhy(!showWhy); }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.68rem] font-semibold transition-all hover:scale-105 uppercase tracking-[1.5px]"
                      style={{
                        background: showWhy ? 'rgba(139,123,216,0.12)' : 'rgba(139,123,216,0.06)',
                        border: '1px solid rgba(139,123,216,0.2)',
                        color: '#a78bfa',
                      }}
                    >
                      {whyBoxIcon && <span className="text-[0.75rem]">{whyBoxIcon}</span>}
                      {whyLabel || 'Why this matters'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showWhy ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showWhy && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="mt-2 pl-4 border-l-2 border-[#a78bfa]/30">
                            <p className="text-[0.78rem] text-[#c7bfe0] leading-[1.6] italic"
                              style={{ fontFamily: 'Cormorant, serif' }}
                            >
                              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(whyText) }} />
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Content — while the voice reads, the same words render as
                    spans so the highlight lands exactly; otherwise the fully
                    formatted reading shows. */}
                {nar.isActive ? (
                  <div className="text-[0.86rem] leading-[1.85] text-[#c7bfe0]">
                    {paragraphs.map((p, i) => (
                      <p key={i} className={narratedLineClass(`p${i}`, nar, i > 0 ? 'mt-4' : '')}>
                        <NarratedWords blockId={`p${i}`} text={p} nar={nar} />
                      </p>
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-[0.86rem] leading-[1.85] text-[#c7bfe0]"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanContent(content)) }}
                  />
                )}

                {/* Tip box */}
                {tipBox && (
                  <div className="mt-5 p-4 rounded-[12px] bg-[rgba(167,139,250,0.08)] border-l-[3px] border-[#a78bfa]">
                    <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#a78bfa] mb-1">
                      {tipBox.icon} {tipBox.label}
                    </div>
                    <p className="text-[0.82rem] text-[#c7bfe0] leading-[1.6]">{tipBox.text}</p>
                  </div>
                )}

                {/* Fun fact */}
                {funFact && (
                  <p className="mt-4 text-[0.78rem] text-[#a29ab8] italic leading-[1.6]"
                    style={{ fontFamily: 'Cormorant, serif' }}
                  >
                    {funFact}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
