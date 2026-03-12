import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ReportSectionCardProps {
  icon: string;
  iconClass: string;
  label: string;
  title: string;
  whyText?: string;
  whyBoxIcon?: string;
  content: string;
  tipBox?: { icon: string; label: string; text: string };
  funFact?: string;
  variant?: number;
  collapsible?: boolean;
}

const cleanWhiteStyle = {
  container: 'bg-white rounded-[18px] border border-[#e8ddd0]',
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
            <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
              {label}
            </div>
            <h3 className="text-[1.1rem] text-[#3d2f2a] mt-0.5" style={{ fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
          </div>
          {collapsible && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isExpanded ? 'rgba(196,162,101,0.1)' : 'rgba(196,162,101,0.06)',
                border: '1px solid rgba(196,162,101,0.2)',
              }}
            >
              <ChevronDown
                className={`w-4 h-4 text-[#c4a265] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Collapsed preview */}
        {collapsible && !isExpanded && (
          <p className="text-[0.82rem] text-[#9a8578] leading-[1.6] mt-3">
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
                        background: showWhy ? 'rgba(196,162,101,0.12)' : 'rgba(196,162,101,0.06)',
                        border: '1px solid rgba(196,162,101,0.2)',
                        color: '#c4a265',
                      }}
                    >
                      {whyBoxIcon && <span className="text-[0.75rem]">{whyBoxIcon}</span>}
                      Why this matters
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
                          <div className="mt-2 pl-4 border-l-2 border-[#c4a265]/30">
                            <p className="text-[0.78rem] text-[#6b4c3b] leading-[1.6] italic"
                              style={{ fontFamily: 'Cormorant, serif' }}
                            >
                              <span dangerouslySetInnerHTML={{ __html: whyText }} />
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Content */}
                <div
                  className="text-[0.86rem] leading-[1.85] text-[#5a4a42]"
                  dangerouslySetInnerHTML={{ __html: cleanContent(content) }}
                />

                {/* Tip box */}
                {tipBox && (
                  <div className="mt-5 p-4 rounded-[12px] bg-[#faf6ef] border-l-[3px] border-[#c4a265]">
                    <div className="text-[0.65rem] font-bold tracking-[1.5px] uppercase text-[#c4a265] mb-1">
                      {tipBox.icon} {tipBox.label}
                    </div>
                    <p className="text-[0.82rem] text-[#5a4a42] leading-[1.6]">{tipBox.text}</p>
                  </div>
                )}

                {/* Fun fact */}
                {funFact && (
                  <p className="mt-4 text-[0.78rem] text-[#9a8578] italic leading-[1.6]"
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
