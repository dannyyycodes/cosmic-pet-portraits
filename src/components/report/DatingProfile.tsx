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
    Fire: '#fff3e6',
    Earth: '#f0f5ed',
    Water: '#e8f0f8',
    Air: '#f0edf8',
  };
  const bg = avatarBg[element] || '#faf6ef';
  const avatarEmoji = zodiacSigns[sunSign.toLowerCase()]?.icon || '⭐';

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[420px] sm:mx-auto"
    >
      <div className="text-[0.6rem] font-bold tracking-[2.5px] uppercase text-[#c4a265] mb-2 text-center">
        💕 {petName}'s Dating Profile
      </div>

      <div className="bg-white rounded-2xl border border-[#e8ddd0] overflow-hidden">
        {/* Avatar area */}
        <div className="text-center py-6" style={{ background: bg }}>
          <div className="text-5xl mb-2">{avatarEmoji}</div>
          <p className="text-[#3d2f2a] font-bold text-lg">{petName}</p>
          <p className="text-[#9a8578] text-xs">{sunSign} · {element} Energy</p>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Headline */}
          <p className="text-[#3d2f2a] text-xl italic font-dm-serif text-center mb-3">
            "{datingProfile.headline}"
          </p>

          {/* Bio */}
          <p className="text-[#5a4a42] text-sm leading-relaxed mb-4">
            {datingProfile.bio}
          </p>

          {/* Green Flags */}
          {datingProfile.greenFlags?.length > 0 && (
            <div className="mb-3">
              <p className="text-[#9a8578] text-[10px] uppercase tracking-widest font-bold mb-1.5">Green Flags</p>
              {datingProfile.greenFlags.map((flag, i) => (
                <p key={i} className="text-[#6b8f5e] text-sm mb-1">✅ {flag}</p>
              ))}
            </div>
          )}

          {/* Red Flags (funny) */}
          {datingProfile.redFlags?.length > 0 && (
            <div className="mb-3">
              <p className="text-[#9a8578] text-[10px] uppercase tracking-widest font-bold mb-1.5">Red Flags (Endearing)</p>
              {datingProfile.redFlags.map((flag, i) => (
                <p key={i} className="text-[#c4a265] text-sm mb-1">🚩 {flag}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
