import { motion } from 'framer-motion';
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
}

const variantStyles: Record<number, { container: string; containerStyle: React.CSSProperties }> = {
  0: {
    container: 'bg-white rounded-[18px] border border-[#e8ddd0]',
    containerStyle: { boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  },
  1: {
    container: 'rounded-[18px]',
    containerStyle: { background: 'linear-gradient(165deg, #FFFDF5, #faf6ef)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(196,162,101,0.12)' },
  },
  2: {
    container: 'bg-white rounded-[18px]',
    containerStyle: { boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '3px solid #c4a265', border: '1px solid #e8ddd0', borderLeftWidth: '3px', borderLeftColor: '#c4a265' },
  },
};

function cleanContent(raw: string): string {
  return raw
    .replace(/\n\n/g, '<br /><br />')
    .replace(/ — /g, '. ')
    .replace(/ – /g, '. ')
    .replace(/^- /gm, '• ')
    .replace(/\n- /g, '<br />• ');
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
}: ReportSectionCardProps) {
  const s = useScrollReveal();
  const v = variantStyles[variant] || variantStyles[0];

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className={`mx-4 my-3 p-6 sm:p-7 max-w-[520px] sm:mx-auto ${v.container}`}
      style={v.containerStyle}
    >
      {/* Icon + label row */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] flex-shrink-0 ${iconClass}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-[0.52rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
            {label}
          </div>
          <h3 className="text-[1.1rem] text-[#3d2f2a] mt-0.5" style={{ fontFamily: 'DM Serif Display, serif' }}>{title}</h3>
        </div>
      </div>

      {/* Why box - styled as a pull quote */}
      {whyText && (
        <div className="my-4 pl-4 border-l-2 border-[#c4a265]/30">
          <p className="text-[0.78rem] text-[#6b4c3b] leading-[1.6] italic"
            style={{ fontFamily: 'Cormorant, serif' }}
          >
            {whyBoxIcon && <span className="not-italic mr-1">{whyBoxIcon}</span>}
            <span dangerouslySetInnerHTML={{ __html: whyText }} />
          </p>
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
          ✨ {funFact}
        </p>
      )}
    </motion.div>
  );
}
