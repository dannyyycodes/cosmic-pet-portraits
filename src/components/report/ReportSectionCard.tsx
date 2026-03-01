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
}: ReportSectionCardProps) {
  const s = useScrollReveal();

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-[22px] px-5 bg-white rounded-[14px] border border-[#e8ddd0] max-w-[520px] sm:mx-auto"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}
    >
      {/* Icon + label row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[1rem] flex-shrink-0 ${iconClass}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-[0.56rem] font-bold tracking-[1.8px] uppercase text-[#c4a265]">
            {label}
          </div>
          <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mt-px">{title}</h3>
        </div>
      </div>

      {/* Why box */}
      {whyText && (
        <div className="mt-2.5 p-[10px] px-[13px] rounded-[10px] text-[0.76rem] text-[#6b4c3b] leading-[1.5]"
          style={{ background: 'rgba(196, 162, 101, 0.06)' }}
        >
          {whyBoxIcon && <>{whyBoxIcon} </>}
          <span dangerouslySetInnerHTML={{ __html: whyText }} />
        </div>
      )}

      {/* Content */}
      <div
        className="mt-2.5 text-[0.84rem] leading-[1.75] text-[#5a4a42]"
        dangerouslySetInnerHTML={{ __html: content.replace(/\n\n/g, '<br /><br />') }}
      />

      {/* Tip box */}
      {tipBox && (
        <div className="mt-3 p-[11px] px-[13px] rounded-[10px] bg-[#faf6ef] border-l-[3px] border-[#c4a265] text-[0.78rem] text-[#6b4c3b] leading-[1.5]">
          {tipBox.icon} <strong className="text-[#3d2f2a]">{tipBox.label}:</strong> {tipBox.text}
        </div>
      )}

      {/* Fun fact */}
      {funFact && (
        <p className="mt-2 text-[0.76rem] text-[#9a8578] italic">
          ✨ {funFact}
        </p>
      )}
    </motion.div>
  );
}
