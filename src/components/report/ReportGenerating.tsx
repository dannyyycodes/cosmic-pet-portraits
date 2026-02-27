import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportGeneratingProps {
  petName: string;
  gender?: string;
  sunSign?: string;
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

export function ReportGenerating({ petName, gender, sunSign }: ReportGeneratingProps) {
  const p = getPronouns(gender);
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = [
    `Mapping the position of 10 celestial bodies at the exact moment ${p.subject} was born...`,
    `Calculating ${p.possessive} Sun, Moon, and Rising signs from real astronomical data...`,
    `${p.Subject} chose you, you know. The stars confirm it.`,
    `Writing ${p.possessive} soul portrait now — every word shaped by ${p.possessive} unique chart...`,
    `Almost ready. Some things are worth the wait.`,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Generate paw print positions once
  const pawPrints = Array.from({ length: 7 }, (_, i) => ({
    left: `${10 + Math.random() * 80}%`,
    top: `${10 + Math.random() * 80}%`,
    size: 0.6 + Math.random() * 0.3,
    delay: i * 0.8,
    rotation: Math.random() * 60 - 30,
  }));

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

        {/* Breathing orb */}
        <motion.div
          className="w-[100px] h-[100px] rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'radial-gradient(circle, #f0d5d2 0%, transparent 70%)',
            boxShadow: '0 0 40px rgba(240,213,210,0.3)',
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[1.5rem]">🐾</span>
        </motion.div>

        {/* Status text */}
        <h2 className="text-[1.15rem] text-[#2D2926] mb-6" style={{ fontFamily: 'DM Serif Display, serif' }}>
          Reading {p.possessive} stars now
        </h2>

        {/* Progress line */}
        <div className="w-[200px] h-[2px] bg-[#E8DFD6] rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #bf524a, #c4a265)' }}
            initial={{ width: '0%' }}
            animate={{ width: '94%' }}
            transition={{ duration: 20, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Rotating messages */}
        <div className="h-[48px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-[0.88rem] text-[#6B5E54] italic text-center max-w-sm"
              style={{ fontFamily: 'Cormorant, serif' }}
            >
              {messages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Small note */}
        <p className="text-[0.72rem] text-[#9B8E84] mt-8">
          This usually takes about 20 seconds
        </p>
      </div>
    </div>
  );
}
