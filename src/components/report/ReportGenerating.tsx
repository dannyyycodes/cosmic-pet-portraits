import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportGeneratingProps {
  petName: string;
  gender?: string;
  sunSign?: string;
  reportId?: string;
  /** Public URL of the customer's uploaded pet photo — displayed while the report is being woven. */
  petPhotoUrl?: string;
}

function getPronouns(gender?: string) {
  switch (gender) {
    case 'male': case 'boy': return { subject: 'he', Subject: 'He', possessive: 'his' };
    case 'female': case 'girl': return { subject: 'she', Subject: 'She', possessive: 'her' };
    default: return { subject: 'they', Subject: 'They', possessive: 'their' };
  }
}

const grainStyle: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
};

const FUN_FACTS = [
  "Every pet's birth chart contains 10+ planetary placements \u2014 just like yours.",
  "The Moon moves through all 12 zodiac signs every 28 days \u2014 just like your pet's moods.",
  "A dog's nose print is as unique as a human fingerprint.",
  "In astrology, your pet's birth chart has the same complexity as yours \u2014 10+ planetary placements.",
  "Rabbits purr when they're happy. It sounds like soft teeth chattering.",
  "Saturn takes 29 years to orbit the Sun. Your pet might never experience their Saturn return!",
  "Dogs dream about their owners. Researchers confirmed this by watching their brain patterns.",
];

const STEPS = [
  { label: 'Mapping celestial positions', threshold: 10 },
  { label: 'Calculating planetary aspects', threshold: 30 },
  { label: 'Writing soul portrait', threshold: 50 },
  { label: 'Adding personal touches', threshold: 75 },
];

export function ReportGenerating({ petName, gender, sunSign, reportId, petPhotoUrl }: ReportGeneratingProps) {
  const p = getPronouns(gender);
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  // Progress increments ~0.8% per second → reaches ~96% in 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.8, 96));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate fun facts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Show the calm "taking extra care" reassurance state after 4 minutes —
  // keeps the same animated screen (no scary "timeout" error). The Supabase
  // realtime subscription in PaymentSuccess.tsx navigates immediately on
  // completion; this is purely a fallback affordance.
  useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), 240000);
    return () => clearTimeout(timer);
  }, []);

  // Generate paw print positions once
  const pawPrints = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    left: `${10 + Math.random() * 80}%`,
    top: `${10 + Math.random() * 80}%`,
    size: 0.6 + Math.random() * 0.3,
    delay: i * 0.8,
    rotation: Math.random() * 60 - 30,
  })), []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: '#FFFDF5', ...grainStyle }}>

      {/* Floating paw prints */}
      {pawPrints.map((paw, i) => (
        <motion.span
          key={i}
          className="absolute select-none pointer-events-none"
          style={{ left: paw.left, top: paw.top, fontSize: `${paw.size}rem`, rotate: `${paw.rotation}deg` }}
          animate={{ opacity: [0, 0.06, 0], y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: paw.delay, ease: 'easeInOut' }}
        >
          🐾
        </motion.span>
      ))}

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Pet name */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[1.3rem] text-[#bf524a] mb-4" style={{ fontFamily: 'Caveat, cursive' }}>
          {petName}
        </motion.p>

        {/* Pet photo (or breathing orb fallback) surrounded by orbiting cosmic marks */}
        <div className="relative w-[140px] h-[140px] mb-6 flex items-center justify-center">
          {/* Orbiting glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, #f0d5d2 0%, transparent 72%)',
              boxShadow: '0 0 60px rgba(240,213,210,0.35)',
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Orbiting sparkles */}
          {['✨', '⭐', '🌙'].map((sym, i) => (
            <motion.span
              key={sym}
              className="absolute select-none pointer-events-none text-[0.85rem]"
              style={{ transformOrigin: '50% 60px' }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 14 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 0.8 }}
            >
              <span
                style={{ display: 'inline-block', transform: `translateY(-${60 + i * 6}px)`, opacity: 0.65 }}
              >
                {sym}
              </span>
            </motion.span>
          ))}

          {/* Pet photo in the centre */}
          {petPhotoUrl ? (
            <motion.img
              src={petPhotoUrl}
              alt={petName}
              loading="eager"
              className="relative z-10 w-[100px] h-[100px] rounded-full object-cover"
              style={{
                border: '3px solid rgba(191,82,74,0.25)',
                boxShadow: '0 4px 18px rgba(191,82,74,0.2)',
              }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: [1, 1.03, 1] }}
              transition={{ opacity: { duration: 0.6 }, scale: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' } }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <motion.div
              className="relative z-10 w-[90px] h-[90px] rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, #f6e6e3 0%, #fffdf5 75%)',
                boxShadow: '0 4px 18px rgba(191,82,74,0.12)',
              }}
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-[1.6rem]">🐾</span>
            </motion.div>
          )}
        </div>

        {/* Status text */}
        <h2 className="text-[1.15rem] text-[#2D2926] mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>
          Reading {p.possessive} stars now
        </h2>

        {/* Step-by-step progress indicators */}
        <div className="w-full max-w-[320px] space-y-2 mb-6">
          {STEPS.map((step, i) => {
            const isDone = progress > step.threshold;
            const isActive = !isDone && (i === 0 || progress > STEPS[i - 1].threshold);
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isDone ? 'bg-[#bf524a]' : isActive ? 'bg-[#E8DFD6]' : 'bg-[#E8DFD6]/50'
                }`}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : isActive ? (
                    <motion.div className="w-2 h-2 rounded-full bg-[#bf524a]"
                      animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-[#d4cbc3]" />
                  )}
                </div>
                <span className={`text-[0.85rem] font-[Cormorant,serif] transition-colors ${
                  isDone ? 'text-[#2D2926]' : isActive ? 'text-[#6B5E54]' : 'text-[#9B8E84]'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-[200px] h-[2px] bg-[#E8DFD6] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #bf524a, #c4a265)', width: `${progress}%` }}
          />
        </div>

        {/* Fun fact card */}
        <div className="bg-white border border-[#E8DFD6] rounded-xl px-5 py-4 mb-6 max-w-sm">
          <p className="text-[0.68rem] text-[#c4a265] uppercase tracking-widest font-semibold mb-1" style={{ fontFamily: 'Cormorant, serif' }}>
            Did you know?
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={factIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-[0.82rem] text-[#6B5E54] italic leading-relaxed"
              style={{ fontFamily: 'Cormorant, serif' }}
            >
              {FUN_FACTS[factIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Small note */}
        <p className="text-[0.72rem] text-[#9B8E84]">
          Creating something special just for them
        </p>
        <p className="text-[0.72rem] text-[#9B8E84] mt-2">
          A link to your report has been sent to your email
        </p>

        {/* Calm reassurance after 4 minutes — never a "timeout" error */}
        {showFallback && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center max-w-xs">
            <p className="text-[0.78rem] text-[#6B5E54] mb-2 leading-relaxed">
              We're taking a little extra care with {petName}'s reading. You can keep this tab
              open, or we'll email you the moment it's ready.
            </p>
            {reportId && (
              <a
                href={`/report?id=${reportId}`}
                className="inline-block mt-2 px-5 py-2.5 rounded-xl text-white text-[0.85rem] font-semibold no-underline transition-opacity hover:opacity-90"
                style={{ background: '#bf524a' }}
              >
                Check on your reading
              </a>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
