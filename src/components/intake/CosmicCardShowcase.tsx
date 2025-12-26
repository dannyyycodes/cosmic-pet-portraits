import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Crown } from 'lucide-react';
import mysticalDreamer from '@/assets/archetypes/mystical-dreamer-cat-v2.jpg';
import nobleGuardian from '@/assets/archetypes/noble-guardian-dog-v2.jpg';

interface SampleCardData {
  name: string;
  archetype: string;
  sunSign: string;
  moonSign: string;
  element: string;
  zodiacIcon: string;
  imageUrl: string;
  totalPower: number;
  vibes: { trait: string; emoji: string; intensity: string }[];
  superpower: string;
  secretTalent: string;
  loveLanguage: string;
  chaosLevel: string;
}

const sampleCards: SampleCardData[] = [
  {
    name: 'Max',
    archetype: 'The Noble Guardian',
    sunSign: 'Leo',
    moonSign: 'Cancer',
    element: 'Fire',
    zodiacIcon: '♌',
    imageUrl: nobleGuardian,
    totalPower: 93,
    vibes: [
      { trait: 'Professional Tail Wagger', emoji: '💫', intensity: 'Infinite' },
      { trait: 'Ball Retrieval Expert', emoji: '🎾', intensity: 'Obsessed' },
      { trait: 'Unconditional Love Dealer', emoji: '❤️', intensity: 'Maximum' },
    ],
    superpower: 'Knows when you\'re sad before you do',
    secretTalent: 'Snack Detection from 3 Rooms Away',
    loveLanguage: 'Full Body Wiggles',
    chaosLevel: 'Happy Chaos',
  },
  {
    name: 'Luna',
    archetype: 'The Mystical Dreamer',
    sunSign: 'Pisces',
    moonSign: 'Scorpio',
    element: 'Water',
    zodiacIcon: '♓',
    imageUrl: mysticalDreamer,
    totalPower: 87,
    vibes: [
      { trait: 'Judges Your Life Choices', emoji: '👀', intensity: 'Expert Level' },
      { trait: '3am Zoomies Specialist', emoji: '🌙', intensity: 'Legendary' },
      { trait: 'Treat Negotiator', emoji: '🍖', intensity: 'Master' },
    ],
    superpower: 'Can sense when you\'re about to leave',
    secretTalent: 'Telepathic Guilt Trips',
    loveLanguage: 'Aggressive Head Bonks',
    chaosLevel: 'Controlled Chaos',
  },
];

const elementColors: Record<string, { from: string; to: string; glow: string }> = {
  Fire: { from: '#f97316', to: '#eab308', glow: 'rgba(249, 115, 22, 0.5)' },
  Water: { from: '#06b6d4', to: '#8b5cf6', glow: 'rgba(6, 182, 212, 0.5)' },
};

function MiniViralCard({ card, onExpand }: { card: SampleCardData; onExpand: () => void }) {
  const colors = elementColors[card.element];
  
  return (
    <motion.div
      whileHover={{ scale: 1.08, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={onExpand}
      className="relative w-[140px] rounded-xl overflow-hidden cursor-pointer shadow-xl"
      style={{
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
        padding: '2px',
        boxShadow: `0 0 20px ${colors.glow}`,
      }}
    >
      <div className="relative rounded-[10px] bg-slate-900 overflow-hidden">
        {/* Badge */}
        <div className="text-center py-1 text-[7px] font-bold tracking-wider bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white">
          ✨ LEGENDARY ✨
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1 bg-black/40">
          <div className="flex items-center gap-1">
            <span className="text-lg">{card.zodiacIcon}</span>
            <span className="text-[9px] font-bold text-white">{card.sunSign}</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${colors.from}40` }}>
            <Flame className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[10px] font-black text-white">{card.totalPower}</span>
          </div>
        </div>

        {/* Portrait */}
        <div className="relative mx-1.5 mt-1 h-20 rounded-lg overflow-hidden border border-white/20">
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
          {card.totalPower >= 90 && (
            <Crown className="absolute top-1 left-1 w-4 h-4 text-amber-400 drop-shadow" />
          )}
          <div 
            className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white text-[7px] font-bold"
            style={{ backgroundColor: `${colors.from}cc` }}
          >
            {card.element === 'Fire' ? '🔥' : '💧'}
          </div>
        </div>

        {/* Name */}
        <div className="px-2 mt-1.5 text-center">
          <p className="text-sm font-bold text-white">{card.name}</p>
          <p className="text-[7px] text-white/50 italic">{card.archetype}</p>
        </div>

        {/* Mini vibes */}
        <div className="px-1.5 mt-1.5 space-y-0.5 pb-2">
          {card.vibes.slice(0, 2).map((vibe, i) => (
            <div key={i} className="flex items-center gap-1 p-1 rounded bg-white/5 border border-white/10">
              <span className="text-xs">{vibe.emoji}</span>
              <span className="text-[7px] text-white truncate">{vibe.trait}</span>
            </div>
          ))}
        </div>

        {/* Tap hint */}
        <p className="text-[6px] text-white/40 text-center pb-1.5">Tap to expand</p>
      </div>
    </motion.div>
  );
}

function ExpandedViralCard({ card, onClose }: { card: SampleCardData; onClose: () => void }) {
  const colors = elementColors[card.element];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, rotateY: -15 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-80 rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          padding: '3px',
          boxShadow: `0 0 60px ${colors.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-20 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative rounded-xl bg-slate-900 overflow-hidden">
          {/* Badge */}
          <div className="text-center py-2 text-xs font-bold tracking-widest bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white">
            ✨ LEGENDARY ✨
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/40">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{card.zodiacIcon}</span>
              <div>
                <span className="text-sm font-bold text-white">{card.sunSign}</span>
                <span className="text-[10px] text-white/50 ml-1">SUN</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${colors.from}40`, border: `1px solid ${colors.from}60` }}>
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black text-white">{card.totalPower}</span>
            </div>
          </div>

          {/* Portrait */}
          <div className="relative mx-3 mt-2 h-40 rounded-xl overflow-hidden border-2 border-white/20">
            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
            {card.totalPower >= 75 && (
              <motion.div 
                className="absolute top-2 left-2"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-8 h-8 text-amber-400 drop-shadow-lg" />
              </motion.div>
            )}
            <div 
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold backdrop-blur-md"
              style={{ backgroundColor: `${colors.from}cc` }}
            >
              {card.element === 'Fire' ? '🔥' : '💧'} {card.element}
            </div>
          </div>

          {/* Name & archetype */}
          <div className="px-4 mt-3 text-center">
            <h2 className="text-2xl font-black text-white">{card.name}</h2>
            <p className="text-sm text-white/60 italic">{card.archetype}</p>
          </div>

          {/* Moon sign */}
          <div className="flex justify-center mt-2">
            <span className="text-xs text-white/50">☽ {card.moonSign} Moon</span>
          </div>

          {/* Vibes */}
          <div className="px-4 mt-3 space-y-2">
            {card.vibes.map((vibe, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10"
              >
                <span className="text-xl">{vibe.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{vibe.trait}</p>
                  <p className="text-[10px] text-white/60">{vibe.intensity}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Special abilities */}
          <div className="px-4 mt-3 space-y-1.5 pb-4">
            <div className="flex items-start gap-2">
              <span className="text-sm">⚡</span>
              <div>
                <span className="text-[10px] text-white/50">Superpower</span>
                <p className="text-xs text-white font-medium">{card.superpower}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm">🤫</span>
              <div>
                <span className="text-[10px] text-white/50">Secret Talent</span>
                <p className="text-xs text-white font-medium">{card.secretTalent}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-1">
                <span>💕</span>
                <span className="text-[10px] text-white/70">{card.loveLanguage}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🌀</span>
                <span className="text-[10px] text-white/70">{card.chaosLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CosmicCardShowcase() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <>
      {/* Side by side cards */}
      <div className="flex justify-center gap-2">
        {sampleCards.map((card, idx) => (
          <MiniViralCard
            key={idx}
            card={card}
            onExpand={() => setExpandedCard(idx)}
          />
        ))}
      </div>

      {/* Expanded card modal */}
      <AnimatePresence>
        {expandedCard !== null && (
          <ExpandedViralCard
            card={sampleCards[expandedCard]}
            onClose={() => setExpandedCard(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
