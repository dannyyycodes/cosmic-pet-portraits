import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportGeneratingProps {
  petName: string;
  gender?: string;
  sunSign?: string;
  reportId?: string;
  /** Public URL of the customer's uploaded pet photo — rendered at the centre of the cosmic waiting room. */
  petPhotoUrl?: string;
}

function getPronouns(gender?: string) {
  switch (gender) {
    case 'male': case 'boy': return { subject: 'he', Subject: 'He', possessive: 'his' };
    case 'female': case 'girl': return { subject: 'she', Subject: 'She', possessive: 'her' };
    default: return { subject: 'they', Subject: 'They', possessive: 'their' };
  }
}

// Four named stages, paced so the ritual feels authored — not a timer.
// Stage 1 ends at ~15s, stage 2 at ~45s, stage 3 at ~90s, stage 4 at ~115s+.
const STAGES = [
  {
    key: 'casting',
    eyebrow: 'I · Casting',
    label: 'Casting the chart',
    detail: 'Plotting planets at the exact moment of their arrival',
  },
  {
    key: 'consulting',
    eyebrow: 'II · Consulting',
    label: 'Consulting the cosmos',
    detail: 'Asking the stars what they remember',
  },
  {
    key: 'writing',
    eyebrow: 'III · Writing',
    label: 'Writing their chapters',
    detail: 'Turning the chart into the story of who they are',
  },
  {
    key: 'sealing',
    eyebrow: 'IV · Sealing',
    label: 'Sealing the scroll',
    detail: 'Setting the words in ink, tying the ribbon',
  },
] as const;

// Each stage lasts this many seconds (approximate — real completion is
// driven by Supabase realtime, not the clock). We slow near the end so
// the copy never races past real progress.
const STAGE_SECS = [15, 30, 45, 30];
const STAGE_CUMULATIVE = STAGE_SECS.reduce<number[]>((acc, s) => {
  acc.push((acc.at(-1) ?? 0) + s);
  return acc;
}, []);

// Reassurance copy tiers — shift as the wait stretches.
function waitCopy(petName: string, elapsed: number) {
  if (elapsed < 60) return `Keep this tab open — ${petName}&rsquo;s reading will unveil itself right here.`;
  if (elapsed < 120) return `The stars are taking their time with ${petName}. Stay close — it&rsquo;s worth the breath.`;
  if (elapsed < 180) return `The cosmos is being thorough for ${petName}. A moment more.`;
  return `We&rsquo;re taking a little extra care with ${petName}&rsquo;s reading. Stay right here — it will unveil itself the moment it&rsquo;s ready. Your link is already saved to your account if you need to step away.`;
}

export function ReportGenerating({ petName, gender, sunSign, reportId, petPhotoUrl }: ReportGeneratingProps) {
  const p = getPronouns(gender);
  const [elapsed, setElapsed] = useState(0);

  // Tick elapsed seconds. Drives both the stage selector and the copy
  // rotator. Max at 600s to avoid runaway; realtime normally navigates us
  // away long before.
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => Math.min(s + 1, 600)), 1000);
    return () => clearInterval(t);
  }, []);

  const activeStage = useMemo(() => {
    for (let i = 0; i < STAGE_CUMULATIVE.length; i++) {
      if (elapsed < STAGE_CUMULATIVE[i]) return i;
    }
    return STAGE_CUMULATIVE.length - 1;
  }, [elapsed]);

  // Pre-computed starfield: 120 twinkling stars in stable positions.
  const starfield = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 5,
      opacity: 0.2 + Math.random() * 0.6,
    }));
  }, []);

  // Five anchor positions around the pet photo — one lights up per stage,
  // plus a final centre flare. Each anchor connects to the previous with
  // a drawn line as stages advance.
  const anchors = useMemo(() => {
    const r = 170;
    return [
      { angle: -70 },
      { angle: -10 },
      { angle: 70 },
      { angle: 170 },
    ].map((a) => {
      const rad = (a.angle * Math.PI) / 180;
      return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
    });
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, #1f1a24 0%, #141016 40%, #0a0709 100%)',
      }}
    >
      {/* ═══ STARFIELD BACKDROP ═══ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {starfield.map((s) => (
          <motion.span
            key={s.i}
            className="absolute rounded-full"
            style={{
              left: s.left + '%',
              top: s.top + '%',
              width: s.size,
              height: s.size,
              background: '#faf6ef',
              boxShadow: '0 0 ' + s.size * 2 + 'px rgba(250,246,239,0.6)',
            }}
            animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.3] }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: s.delay,
            }}
          />
        ))}

        {/* Slow-moving nebula */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 70% 60%, rgba(196,162,101,0.10), transparent 70%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(191,82,74,0.08), transparent 70%)',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ═══ CENTRAL RITUAL STAGE ═══ */}
      <div className="relative z-10 w-full max-w-[520px] flex flex-col items-center text-center">

        {/* Pet name in cursive */}
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[1.5rem] text-[#c4a265] mb-5"
          style={{ fontFamily: 'Caveat, cursive' }}
        >
          {petName}
        </motion.p>

        {/* Cosmic frame — pet photo at centre with orbiting anchors */}
        <div className="relative" style={{ width: 380, height: 380, marginBottom: 24 }}>
          {/* Outer drifting halo */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(196,162,101,0.25) 0%, rgba(191,82,74,0.08) 45%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Rotating gold ring */}
          <div
            aria-hidden="true"
            className="absolute inset-6 rounded-full"
            style={{
              padding: 2,
              background:
                'conic-gradient(from 0deg, #c4a265, #c4a26588, #c4a265, #d9b87c, #c4a265)',
              animation: 'rg-rotate 22s linear infinite',
              WebkitMask:
                'radial-gradient(circle, transparent 55%, black 56%, black 58%, transparent 59%)',
              mask:
                'radial-gradient(circle, transparent 55%, black 56%, black 58%, transparent 59%)',
              opacity: 0.8,
            }}
          />

          {/* Constellation — anchors light up as stages advance, with a
              line traced from the previous one. */}
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox="-190 -190 380 380"
            aria-hidden="true"
          >
            {/* Connecting lines (traced only for already-reached stages) */}
            {anchors.map((a, i) => {
              if (i === 0) return null;
              const prev = anchors[i - 1];
              const reached = activeStage >= i;
              return (
                <motion.line
                  key={'line-' + i}
                  x1={prev.x}
                  y1={prev.y}
                  x2={a.x}
                  y2={a.y}
                  stroke="#c4a265"
                  strokeWidth="0.9"
                  strokeOpacity="0.55"
                  strokeDasharray="4 5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: reached ? 1 : 0 }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              );
            })}

            {/* Anchor stars */}
            {anchors.map((a, i) => {
              const lit = activeStage >= i;
              return (
                <motion.g key={'anchor-' + i}>
                  <motion.circle
                    cx={a.x}
                    cy={a.y}
                    r={6}
                    fill="#c4a265"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={
                      lit
                        ? { opacity: [0.4, 1, 0.7], scale: 1 }
                        : { opacity: 0.1, scale: 0.6 }
                    }
                    transition={{
                      opacity: lit ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6 },
                      scale: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                    }}
                    style={{ filter: lit ? 'drop-shadow(0 0 8px #c4a265)' : 'none' }}
                  />
                  <motion.circle
                    cx={a.x}
                    cy={a.y}
                    r={2}
                    fill="#faf6ef"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: lit ? 1 : 0 }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.g>
              );
            })}
          </svg>

          {/* Pet photo centre */}
          <div
            className="absolute rounded-full overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
              width: 180,
              height: 180,
              marginLeft: -90,
              marginTop: -90,
              boxShadow:
                '0 0 50px rgba(196,162,101,0.35), 0 0 100px rgba(191,82,74,0.25), inset 0 0 0 2px rgba(196,162,101,0.45)',
            }}
          >
            {petPhotoUrl ? (
              <img
                src={petPhotoUrl}
                alt={petName}
                loading="eager"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background:
                    'radial-gradient(circle, #3a2c2f 0%, #1f1a24 80%)',
                }}
              >
                <span className="text-5xl">🐾</span>
              </div>
            )}
            {/* Breathing colour wash */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 35% 30%, rgba(196,162,101,0.28), transparent 60%), radial-gradient(circle at 70% 75%, rgba(191,82,74,0.22), transparent 60%)',
                mixBlendMode: 'overlay',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Stage header — the ritual name changes over time */}
        <AnimatePresence mode="wait">
          <motion.div
            key={STAGES[activeStage].key}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <div className="text-[0.62rem] tracking-[2.8px] uppercase text-[#c4a265]/85 font-semibold mb-1.5">
              {STAGES[activeStage].eyebrow}
            </div>
            <h2
              className="text-[1.4rem] text-[#faf6ef]"
              style={{ fontFamily: 'DM Serif Display, serif' }}
            >
              {STAGES[activeStage].label}&hellip;
            </h2>
            <p className="mt-2 text-[0.82rem] text-[#c4a265]/70 italic max-w-[320px] mx-auto leading-relaxed">
              {STAGES[activeStage].detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Named-stage pipeline checklist */}
        <div className="w-full max-w-[360px] space-y-2.5 mb-8">
          {STAGES.map((stage, i) => {
            const done = i < activeStage;
            const active = i === activeStage;
            return (
              <div
                key={stage.key}
                className="flex items-center gap-3 transition-opacity"
                style={{ opacity: i > activeStage ? 0.38 : 1 }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    background: done ? '#c4a265' : active ? 'rgba(196,162,101,0.2)' : 'rgba(250,246,239,0.08)',
                    border: active ? '1px solid #c4a265' : '1px solid rgba(250,246,239,0.15)',
                  }}
                >
                  {done && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="#1f1a24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {active && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-[#c4a265]"
                      animate={{ scale: [1, 1.6, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>
                <span
                  className="text-[0.88rem]"
                  style={{
                    color: done ? '#faf6ef' : active ? '#c4a265' : 'rgba(250,246,239,0.55)',
                    fontFamily: 'Cormorant, serif',
                  }}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Breathing gold ring — ambient progress (not a % bar) */}
        <div className="relative w-16 h-16 mb-6">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: '#c4a265', boxShadow: '0 0 24px rgba(196,162,101,0.35)' }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0.3, 0.9] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute inset-3 rounded-full border"
            style={{ borderColor: '#c4a265', boxShadow: '0 0 12px rgba(196,162,101,0.5)' }}
            animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          />
        </div>

        {/* Reassurance copy — tier shifts at 60s / 120s / 180s */}
        <AnimatePresence mode="wait">
          <motion.p
            key={Math.floor(elapsed / 60)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.6 }}
            className="text-[0.84rem] max-w-sm text-[#faf6ef]/70 leading-relaxed italic"
            style={{ fontFamily: 'Cormorant, serif' }}
            dangerouslySetInnerHTML={{ __html: waitCopy(petName, elapsed) }}
          />
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes rg-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
