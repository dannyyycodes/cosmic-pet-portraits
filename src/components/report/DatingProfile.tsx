import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { zodiacSigns } from '@/lib/zodiac';

interface DatingProfileProps {
  petName: string;
  datingProfile: {
    title?: string;
    headline: string;
    bio: string;
    lookingFor?: string;
    greenFlags?: string[];
    redFlags?: string[];
  };
  sunSign: string;
  element: string;
}

export function DatingProfile({ petName, datingProfile, sunSign, element }: DatingProfileProps) {
  const s = useScrollReveal();

  const avatarBg: Record<string, string> = {
    Fire: 'rgba(239,68,68,0.14)',
    Earth: 'rgba(34,197,94,0.14)',
    Water: 'rgba(56,189,248,0.14)',
    Air: 'rgba(167,139,250,0.14)',
  };
  const bg = avatarBg[element] || 'rgba(167,139,250,0.08)';
  const avatarEmoji = zodiacSigns[sunSign.toLowerCase()]?.icon || '⭐';

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[420px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#a78bfa] mb-2 text-center">
        💕 {petName}'s Dating Profile
      </div>

      <div className="bg-[#1a1430] rounded-2xl border border-[rgba(167,139,250,0.22)] overflow-hidden">
        {/* Avatar area */}
        <div className="text-center py-6" style={{ background: bg }}>
          <div className="text-5xl mb-2">{avatarEmoji}</div>
          <p className="text-[#f2eeff] font-bold text-lg">{petName}</p>
          <p className="text-[#a29ab8] text-xs">{sunSign} · {element} Energy</p>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Headline */}
          <p className="text-[#f2eeff] text-xl italic font-dm-serif text-center mb-3">
            "{datingProfile.headline}"
          </p>

          {/* Bio */}
          <p className="text-[#c7bfe0] text-sm leading-relaxed mb-4">
            {datingProfile.bio}
          </p>

          {/* Green Flags */}
          {datingProfile.greenFlags?.length > 0 && (
            <div className="mb-3">
              <p className="text-[#a29ab8] text-[10px] uppercase tracking-widest font-bold mb-1.5">Green Flags</p>
              {datingProfile.greenFlags.map((flag, i) => (
                <p key={i} className="text-[#c7bfe0] text-sm mb-1"><span className="text-[#a78bfa]">✦</span> {flag}</p>
              ))}
            </div>
          )}

          {/* Red Flags (funny) */}
          {datingProfile.redFlags?.length > 0 && (
            <div className="mb-3">
              <p className="text-[#a29ab8] text-[10px] uppercase tracking-widest font-bold mb-1.5">Red Flags (Endearing)</p>
              {datingProfile.redFlags.map((flag, i) => (
                <p key={i} className="text-[#a78bfa] text-sm mb-1">🚩 {flag}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
