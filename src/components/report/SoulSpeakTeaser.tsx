import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface SoulSpeakTeaserProps {
  petName: string;
  reportId?: string;
  variant: 'monologue' | 'bond';
}

export function SoulSpeakTeaser({ petName, reportId, variant }: SoulSpeakTeaserProps) {
  const s = useScrollReveal();

  if (!reportId) return null;

  const content = variant === 'monologue'
    ? {
        emoji: '💬',
        text: `Want to hear more from ${petName}?`,
        subtext: `Try SoulSpeak — talk to ${petName}'s soul`,
      }
    : {
        emoji: '✨',
        text: `Ask ${petName} about your bond`,
        subtext: 'Start a SoulSpeak conversation',
      };

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
    >
      <a
        href={`/soul-chat.html?id=${reportId}`}
        className="block mx-4 my-2 p-4 max-w-[520px] sm:mx-auto rounded-xl no-underline transition-all duration-200 hover:shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #faf6ef 0%, #f5ede0 100%)',
          border: '1px solid #e8ddd0',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{content.emoji}</span>
          <div className="flex-1">
            <div className="text-[0.78rem] font-semibold text-[#3d2f2a]">
              {content.text}
            </div>
            <div className="text-[0.68rem] text-[#9a8578]">
              {content.subtext}
            </div>
          </div>
          <span className="text-[#c4a265] text-[0.75rem]">→</span>
        </div>
      </a>
    </motion.div>
  );
}
