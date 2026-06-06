import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { CosmicLineIcon } from './cosmic/CosmicLineIcon';
import { deDash } from './cosmic/text';

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
  petPhotoUrl?: string;
}

// Split a paragraph into a lead (first 1-2 sentences) and the remainder,
// without rewording any copy. Sentence boundaries: . ! ? followed by space.
function splitBio(bio: string): { lead: string; rest: string } {
  const trimmed = (bio || '').trim();
  if (!trimmed) return { lead: '', rest: '' };
  const parts = trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (!parts || parts.length <= 2) return { lead: trimmed, rest: '' };
  const lead = parts.slice(0, 2).join('').trim();
  const rest = parts.slice(2).join('').trim();
  return { lead, rest };
}

export function DatingProfile({ petName, datingProfile, sunSign, element, petPhotoUrl }: DatingProfileProps) {
  const s = useScrollReveal();
  const [bioOpen, setBioOpen] = useState(false);

  const { lead, rest } = splitBio(datingProfile.bio);
  const hasMore = rest.length > 0;

  const greenFlags = datingProfile.greenFlags ?? [];
  const redFlags = datingProfile.redFlags ?? [];

  const headerBg: Record<string, string> = {
    Fire: 'linear-gradient(135deg,#2a1730,#3a1f2a)',
    Earth: 'linear-gradient(135deg,#1a2030,#1f2a26)',
    Water: 'linear-gradient(135deg,#16162a,#1a2238)',
    Air: 'linear-gradient(135deg,#1d1538,#221a44)',
  };
  const bg = headerBg[element] || 'linear-gradient(135deg,#1a1330,#221a44)';

  return (
    <motion.div
      ref={s.ref}
      initial="hidden"
      animate={s.isInView ? 'visible' : 'hidden'}
      variants={s.variants}
      className="mx-4 my-2.5 max-w-[560px] sm:mx-auto"
    >
      <div className="text-[0.7rem] font-bold tracking-[2.5px] uppercase text-[#e6c179] mb-2.5 text-center flex items-center justify-center gap-1.5">
        <CosmicLineIcon name="heartOrbit" size={14} />
        {petName}'s Dating Profile
      </div>

      <div
        className="rounded-3xl border overflow-hidden"
        style={{
          background: 'rgba(22,16,42,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderColor: 'rgba(154,126,230,0.18)',
        }}
      >
        {/* ── Profile header ── */}
        <div className="px-5 pt-6 pb-5" style={{ background: bg }}>
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="relative shrink-0 w-20 h-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                border: '2px solid rgba(230,193,121,0.55)',
                background: 'rgba(10,8,16,0.45)',
                boxShadow: '0 0 0 4px rgba(154,126,230,0.10)',
              }}
            >
              {petPhotoUrl ? (
                <img
                  src={petPhotoUrl}
                  alt={petName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#e6c179]">
                  <CosmicLineIcon name="heartOrbit" size={40} />
                </span>
              )}
              {/* online dot */}
              <span
                className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full"
                style={{
                  background: '#6fe3b8',
                  border: '2px solid #16102a',
                  boxShadow: '0 0 6px #6fe3b8',
                }}
              />
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <p className="text-[#ece5ff] font-bold text-xl leading-tight truncate">
                {petName}
              </p>
              <p className="text-[#b9a8e0] text-[0.78rem] leading-snug mt-0.5">
                {sunSign} · {element} Energy
              </p>
              <span
                className="inline-flex items-center gap-1.5 mt-2 text-[0.7rem] font-semibold tracking-wide"
                style={{ color: '#6fe3b8' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#6fe3b8', boxShadow: '0 0 5px #6fe3b8' }}
                />
                Active now
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-5">
          {/* Headline pull line */}
          <p className="text-[#ece5ff] text-xl sm:text-2xl italic font-dm-serif text-center leading-snug mb-4">
            &ldquo;{deDash(datingProfile.headline)}&rdquo;
          </p>

          {/* Bio: lead + collapsible rest */}
          <div className="mb-5">
            <p className="text-[#ece5ff] text-[1.05rem] leading-[1.6]">
              {deDash(lead)}
            </p>

            <AnimatePresence initial={false}>
              {bioOpen && hasMore && (
                <motion.p
                  key="bio-rest"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                  className="text-[#d8c5f5] text-[1.05rem] leading-[1.6]"
                >
                  <span className="block pt-2">{deDash(rest)}</span>
                </motion.p>
              )}
            </AnimatePresence>

            {hasMore && (
              <button
                type="button"
                onClick={() => setBioOpen((o) => !o)}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold tracking-wide rounded-full px-3 py-2"
                style={{
                  color: '#e6c179',
                  border: '1px solid rgba(230,193,121,0.30)',
                  background: 'rgba(243,236,255,0.025)',
                  minHeight: 44,
                }}
                aria-expanded={bioOpen}
              >
                <motion.span
                  animate={{ rotate: bioOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="inline-flex"
                >
                  <CosmicLineIcon name="compass" size={14} />
                </motion.span>
                {bioOpen ? 'Hide full bio' : 'Read full bio'}
              </button>
            )}
          </div>

          {/* Green flags */}
          {greenFlags.length > 0 && (
            <div className="mb-3.5">
              <p
                className="text-[0.7rem] uppercase tracking-[2px] font-bold mb-2"
                style={{ color: '#6fe3b8' }}
              >
                Green Flags
              </p>
              <div className="flex flex-col gap-2">
                {greenFlags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-2xl px-3.5 py-3"
                    style={{
                      border: '1px solid rgba(111,227,184,0.22)',
                      background: 'rgba(111,227,184,0.06)',
                    }}
                  >
                    <span className="shrink-0 mt-0.5" style={{ color: '#6fe3b8' }}>
                      <CosmicLineIcon name="leaf" size={18} />
                    </span>
                    <p className="text-[#ece5ff] text-[1.05rem] leading-[1.5] text-left">
                      {deDash(flag)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red flags (endearing) */}
          {redFlags.length > 0 && (
            <div className="mb-1">
              <p
                className="text-[0.7rem] uppercase tracking-[2px] font-bold mb-2"
                style={{ color: '#e98aa0' }}
              >
                Red Flags (Endearing)
              </p>
              <div className="flex flex-col gap-2">
                {redFlags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-2xl px-3.5 py-3"
                    style={{
                      border: '1px solid rgba(233,138,160,0.22)',
                      background: 'rgba(233,138,160,0.06)',
                    }}
                  >
                    <span className="shrink-0 mt-0.5" style={{ color: '#e98aa0' }}>
                      <CosmicLineIcon name="shield" size={18} />
                    </span>
                    <p className="text-[#ece5ff] text-[1.05rem] leading-[1.5] text-left">
                      {deDash(flag)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Decorative dating-app actions ── */}
          <div
            className="mt-5 pt-4 flex items-center justify-center gap-5"
            style={{ borderTop: '1px solid rgba(154,126,230,0.18)' }}
          >
            {/* pass */}
            <span
              aria-hidden="true"
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                border: '1px solid rgba(233,138,160,0.35)',
                background: 'rgba(233,138,160,0.06)',
                color: '#e98aa0',
              }}
            >
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>

            <span
              className="text-[0.72rem] tracking-wide text-[#b9a8e0]"
              style={{ minWidth: '7ch', textAlign: 'center' }}
            >
              Swipe right
            </span>

            {/* like */}
            <span
              aria-hidden="true"
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                border: '1px solid rgba(230,193,121,0.40)',
                background: 'rgba(230,193,121,0.08)',
                color: '#e6c179',
              }}
            >
              <CosmicLineIcon name="heartOrbit" size={24} />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
