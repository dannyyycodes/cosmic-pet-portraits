import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';

interface ShareableCardProps {
  petName: string;
  sunSign: string;
  moonSign: string;
  archetype: string;
  element: string;
  reportId?: string;
  ascendant?: string;
  shareableCard?: {
    cosmicNickname: string;
    sixKeyTraits: string[];
    signatureLine: string;
  };
}

export function ShareableCard({
  petName,
  sunSign,
  moonSign,
  archetype,
  element,
  reportId,
  ascendant,
  shareableCard,
}: ShareableCardProps) {
  const s = useScrollReveal();
  const [copied, setCopied] = useState(false);

  const sunData = zodiacSigns[sunSign.toLowerCase()];
  const sunIcon = sunData?.icon || '';

  const shareUrl = reportId
    ? `${window.location.origin}/view-report?id=${reportId}`
    : window.location.href;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${petName}'s Little Souls Reading`,
          text: `${petName} is a ${sunSign} ${archetype}! Check out their cosmic soul reading.`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    }
  };

  const risingLabel = ascendant ? `${ascendant} Rising` : '';
  const signLine = [
    `${sunSign} Sun`,
    `${moonSign} Moon`,
    risingLabel,
  ].filter(Boolean).join(' · ');

  const nickname = shareableCard?.cosmicNickname || archetype;
  const traits = shareableCard?.sixKeyTraits || [];
  const signatureLine = shareableCard?.signatureLine;

  const elementEmoji = element === 'Fire' ? '🔥' : element === 'Earth' ? '🌍' : element === 'Air' ? '💨' : '💧';

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 p-5 bg-white rounded-[14px] border border-[#e8ddd0] text-center max-w-[520px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265]">
        Share {petName}'s Soul
      </div>
      <h3 className="font-dm-serif text-[1.05rem] text-[#3d2f2a] mt-1">Shareable Cosmic Card</h3>

      {/* Collectible card */}
      <div
        className="mx-auto my-4 max-w-[300px] rounded-2xl overflow-hidden border-2 border-[#c4a265]/30 shadow-lg"
        style={{ background: 'linear-gradient(155deg, #faf6ef 0%, #f0e6d6 50%, #e8ddd0 100%)' }}
      >
        {/* Card header */}
        <div className="px-4 pt-3.5 pb-1 flex justify-between items-center">
          <span className="text-[0.55rem] font-bold tracking-[2px] uppercase text-[#c4a265]">
            Little Souls
          </span>
          <span className="text-[0.55rem] text-[#9a8578]">
            {elementEmoji} {element}
          </span>
        </div>

        {/* Main content */}
        <div className="px-4 py-3 text-center">
          <div className="text-[2.2rem] mb-1">{sunIcon}</div>
          <div className="font-dm-serif text-[1.4rem] text-[#3d2f2a] leading-tight">{petName}</div>
          <div className="text-[0.78rem] font-semibold text-[#c4a265] mt-0.5">{nickname}</div>
          <div className="text-[0.68rem] text-[#9a8578] mt-1">{signLine}</div>
        </div>

        {/* Traits grid */}
        {traits.length > 0 && (
          <div className="px-3 pb-2">
            <div className="grid grid-cols-3 gap-1.5">
              {traits.slice(0, 6).map((trait, i) => (
                <div
                  key={i}
                  className="px-2 py-1.5 rounded-lg text-center"
                  style={{ background: 'rgba(196,162,101,0.08)', border: '1px solid rgba(196,162,101,0.15)' }}
                >
                  <span className="text-[0.65rem] text-[#5a4a42] font-medium">{trait}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature line */}
        {signatureLine && (
          <div className="px-4 py-2.5 border-t border-[#e8ddd0]/60">
            <p className="text-[0.72rem] text-[#6b4c3b] italic leading-snug">
              "{signatureLine}"
            </p>
          </div>
        )}

        {/* Card footer */}
        <div className="px-4 py-2 border-t border-[#e8ddd0]/60 flex justify-between items-center">
          <span className="text-[0.5rem] text-[#9a8578]/60 uppercase tracking-[1px]">littlesouls.co</span>
          <span className="text-[0.5rem] text-[#9a8578]/40 font-mono">One of a kind</span>
        </div>
      </div>

      <div className="flex gap-2 justify-center mt-3">
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-[10px] border border-[#e8ddd0] bg-[#faf6ef] text-[0.75rem] font-semibold text-[#6b4c3b] cursor-pointer font-[DM_Sans,sans-serif]"
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-[10px] border border-[#e8ddd0] bg-[#faf6ef] text-[0.75rem] font-semibold text-[#6b4c3b] cursor-pointer font-[DM_Sans,sans-serif]"
          >
            Share
          </button>
        )}
      </div>
    </motion.div>
  );
}
