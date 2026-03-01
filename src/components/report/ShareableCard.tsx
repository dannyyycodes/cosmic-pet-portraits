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
}

export function ShareableCard({
  petName,
  sunSign,
  moonSign,
  archetype,
  element,
  reportId,
  ascendant,
}: ShareableCardProps) {
  const s = useScrollReveal();
  const [copied, setCopied] = useState(false);

  const sunData = zodiacSigns[sunSign.toLowerCase()];
  const sunIcon = sunData?.icon || '⭐';

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

      {/* Preview card */}
      <div
        className="mx-auto my-3.5 p-4 max-w-[260px] rounded-xl border border-[#e8ddd0]"
        style={{ background: 'linear-gradient(135deg, #faf6ef, #f0e6d6)' }}
      >
        <div className="text-[1.6rem] mb-1.5">{sunIcon}</div>
        <div className="font-dm-serif text-[1.1rem] text-[#3d2f2a]">{petName}</div>
        <div className="text-[0.7rem] text-[#c4a265] font-semibold">{signLine}</div>
        <div className="text-[0.75rem] text-[#9a8578] italic mt-1">{archetype}</div>
      </div>

      <div className="flex gap-2 justify-center mt-3">
        <button
          onClick={handleCopy}
          className="px-4 py-2 rounded-[10px] border border-[#e8ddd0] bg-[#faf6ef] text-[0.75rem] font-semibold text-[#6b4c3b] cursor-pointer font-[DM_Sans,sans-serif]"
        >
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-[10px] border border-[#e8ddd0] bg-[#faf6ef] text-[0.75rem] font-semibold text-[#6b4c3b] cursor-pointer font-[DM_Sans,sans-serif]"
          >
            📱 Share
          </button>
        )}
      </div>
    </motion.div>
  );
}
