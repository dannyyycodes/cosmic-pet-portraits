import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, Zap, Shield, Sparkles, Flame, Crown } from 'lucide-react';
import mysticalDreamer from '@/assets/archetypes/mystical-dreamer-cat-v2.jpg';
import nobleGuardian from '@/assets/archetypes/noble-guardian-dog-v2.jpg';

interface CardStats {
  vitality: number;
  empathy: number;
  curiosity: number;
  charm: number;
  energy: number;
  mystery: number;
}

interface SampleCardData {
  name: string;
  archetype: string;
  sunSign: string;
  moonSign: string;
  element: string;
  zodiacIcon: string;
  imageUrl: string;
  stats: CardStats;
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
    stats: { vitality: 95, empathy: 88, curiosity: 75, charm: 92, energy: 98, mystery: 70 },
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
    stats: { vitality: 72, empathy: 95, curiosity: 88, charm: 90, energy: 65, mystery: 98 },
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

// Full-size ViralPetCard replica for the showcase
function ShowcaseCard({ card, isExpanded, onToggle }: { card: SampleCardData; isExpanded: boolean; onToggle: () => void }) {
  const colors = elementColors[card.element];
  const totalPower = Math.round((card.stats.vitality + card.stats.empathy + card.stats.curiosity + card.stats.charm + card.stats.energy + card.stats.mystery) / 6);
  
  return (
    <motion.div
      layout
      whileHover={{ scale: isExpanded ? 1 : 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      animate={{ 
        width: isExpanded ? 320 : 156,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
        padding: '3px',
        boxShadow: `0 0 ${isExpanded ? 60 : 30}px ${colors.glow}, 0 ${isExpanded ? 20 : 10}px ${isExpanded ? 60 : 30}px rgba(0,0,0,0.5)`,
      }}
    >
      <div className="relative rounded-xl bg-slate-900 overflow-hidden">
        {/* Badge */}
        <div 
          className="text-center font-bold tracking-widest bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white"
          style={{ 
            padding: isExpanded ? '8px 0' : '4px 0',
            fontSize: isExpanded ? '12px' : '8px',
          }}
        >
          ✨ LEGENDARY ✨
        </div>

        {/* Header with power level */}
        <div 
          className="flex items-center justify-between bg-black/40"
          style={{ padding: isExpanded ? '8px 16px' : '4px 8px' }}
        >
          <div className="flex items-center gap-1">
            <span style={{ fontSize: isExpanded ? '28px' : '16px' }}>{card.zodiacIcon}</span>
            <div>
              <span 
                className="font-bold text-white block"
                style={{ fontSize: isExpanded ? '14px' : '9px' }}
              >
                {card.sunSign}
              </span>
              {isExpanded && (
                <span className="text-[10px] text-white/50">☽ {card.moonSign}</span>
              )}
            </div>
          </div>
          <div 
            className="flex items-center gap-1 rounded-full"
            style={{ 
              backgroundColor: `${colors.from}40`,
              border: `1px solid ${colors.from}60`,
              padding: isExpanded ? '6px 12px' : '2px 6px',
            }}
          >
            <Flame 
              className="text-amber-400" 
              style={{ width: isExpanded ? 16 : 10, height: isExpanded ? 16 : 10 }}
            />
            <span 
              className="font-black text-white"
              style={{ fontSize: isExpanded ? '14px' : '10px' }}
            >
              {totalPower}
            </span>
          </div>
        </div>

        {/* Portrait */}
        <div 
          className="relative mx-auto rounded-xl overflow-hidden border-2 border-white/20"
          style={{ 
            margin: isExpanded ? '8px 12px' : '4px 6px',
            height: isExpanded ? 160 : 80,
          }}
        >
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
          {totalPower >= 75 && (
            <motion.div 
              className="absolute top-1 left-1"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown 
                className="text-amber-400 drop-shadow-lg" 
                style={{ width: isExpanded ? 28 : 16, height: isExpanded ? 28 : 16 }}
              />
            </motion.div>
          )}
          <div 
            className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full text-white font-bold backdrop-blur-md"
            style={{ 
              backgroundColor: `${colors.from}cc`,
              padding: isExpanded ? '4px 10px' : '2px 6px',
              fontSize: isExpanded ? '11px' : '7px',
            }}
          >
            {card.element === 'Fire' ? '🔥' : '💧'} {isExpanded && card.element}
          </div>
        </div>

        {/* Name & archetype */}
        <div className="text-center" style={{ padding: isExpanded ? '0 16px' : '0 6px' }}>
          <h2 
            className="font-black text-white"
            style={{ fontSize: isExpanded ? '24px' : '14px' }}
          >
            {card.name}
          </h2>
          <p 
            className="text-white/60 italic"
            style={{ fontSize: isExpanded ? '14px' : '8px' }}
          >
            {card.archetype}
          </p>
        </div>

        {/* Vibes - trait cards */}
        <div style={{ padding: isExpanded ? '12px 16px' : '6px 6px', display: 'flex', flexDirection: 'column', gap: isExpanded ? 8 : 4 }}>
          {card.vibes.map((vibe, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10"
              style={{ padding: isExpanded ? '8px' : '4px 6px' }}
            >
              <span style={{ fontSize: isExpanded ? '20px' : '12px' }}>{vibe.emoji}</span>
              <div className="min-w-0 flex-1">
                <p 
                  className="font-bold text-white truncate"
                  style={{ fontSize: isExpanded ? '14px' : '8px' }}
                >
                  {vibe.trait}
                </p>
                <p 
                  className="text-white/60"
                  style={{ fontSize: isExpanded ? '10px' : '6px' }}
                >
                  {vibe.intensity}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Special abilities - only when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4 space-y-2"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap hint when not expanded */}
        {!isExpanded && (
          <p className="text-[6px] text-white/40 text-center pb-2">Tap to expand</p>
        )}
      </div>
    </motion.div>
  );
}

export function CosmicCardShowcase() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleToggle = (idx: number) => {
    setExpandedCard(prev => prev === idx ? null : idx);
  };

  return (
    <div className="flex justify-center gap-3 overflow-visible py-2">
      {sampleCards.map((card, idx) => (
        <ShowcaseCard
          key={idx}
          card={card}
          isExpanded={expandedCard === idx}
          onToggle={() => handleToggle(idx)}
        />
      ))}
    </div>
  );
}
