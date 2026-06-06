import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import DOMPurify from 'dompurify';
import { ChevronDown } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { deDash } from './cosmic/text';

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
  container: 'rounded-[18px] border border-[#2a1f47]',
  containerStyle: {
    background: 'rgba(22,16,42,0.72)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    boxShadow: '0 2px 18px rgba(0,0,0,0.35)',
  } as React.CSSProperties,
};

const variantStyles: Record<number, { container: string; containerStyle: React.CSSProperties }> = {
  0: cleanWhiteStyle,
  1: cleanWhiteStyle,
  2: cleanWhiteStyle,
};

function cleanContent(raw: string): string {
  return deDash(raw)
    .replace(/\n\n/g, '<br /><br />')
    .replace(/^- /gm, '• ')
    .replace(/\n- /g, '<br />• ');
}

function getPreview(raw: string): string {
  const plain = deDash(raw)
    .replace(/\n\n/g, ' ')
    .replace(/\n/g, ' ')
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
            <div className="text-[0.72rem] font-bold tracking-[2px] uppercase text-[#e6c179]">
              {deDash(label)}
            </div>
            <h3 className="text-[1.25rem] text-[#f3ecff] mt-1 leading-[1.3]" style={{ fontFamily: 'DM Serif Display, serif' }}>{deDash(title)}</h3>
          </div>
          {collapsible && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isExpanded ? 'rgba(230,193,121,0.14)' : 'rgba(230,193,121,0.08)',
                border: '1px solid rgba(230,193,121,0.28)',
              }}
            >
              <ChevronDown
                className={`w-4 h-4 text-[#e6c179] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Collapsed preview */}
        {collapsible && !isExpanded && (
          <p className="text-[0.95rem] text-[#b9a8e0] leading-[1.62] mt-3.5 max-w-[64ch]">
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
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.82rem] font-semibold transition-all hover:scale-105 uppercase tracking-[1.5px]"
                      style={{
                        background: showWhy ? 'rgba(230,193,121,0.16)' : 'rgba(230,193,121,0.08)',
                        border: '1px solid rgba(230,193,121,0.28)',
                        color: '#e6c179',
                      }}
                    >
                      {whyBoxIcon && <span className="text-[0.82rem]">{whyBoxIcon}</span>}
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
                          <div className="mt-2.5 pl-4 border-l-2 border-[#e6c179]/30">
                            <p className="text-[0.95rem] text-[#ece5ff] leading-[1.65] italic max-w-[64ch]"
                              style={{ fontFamily: 'Cormorant, serif' }}
                            >
                              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(deDash(whyText)) }} />
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Content */}
                <div
                  className="text-[1.05rem] leading-[1.65] text-[#ece5ff] max-w-[64ch]"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanContent(content)) }}
                />

                {/* Tip box */}
                {tipBox && (
                  <div className="mt-5 p-4 rounded-[12px] bg-[#1d1538] border-l-[3px] border-[#e6c179]">
                    <div className="text-[0.72rem] font-bold tracking-[1.5px] uppercase text-[#e6c179] mb-1.5">
                      {tipBox.icon} {deDash(tipBox.label)}
                    </div>
                    <p className="text-[0.95rem] text-[#ece5ff] leading-[1.65] max-w-[64ch]">{deDash(tipBox.text)}</p>
                  </div>
                )}

                {/* Fun fact */}
                {funFact && (
                  <p className="mt-4 text-[0.95rem] text-[#b9a8e0] italic leading-[1.65] max-w-[64ch]"
                    style={{ fontFamily: 'Cormorant, serif' }}
                  >
                    {deDash(funFact)}
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
