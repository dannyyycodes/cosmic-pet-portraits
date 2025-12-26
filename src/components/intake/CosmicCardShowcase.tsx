import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Heart, Star, Sparkles, Shield } from 'lucide-react';
import mysticalDreamer from '@/assets/archetypes/mystical-dreamer-cat-v2.jpg';
import nobleGuardian from '@/assets/archetypes/noble-guardian-dog-v2.jpg';

interface MiniCardProps {
  name: string;
  archetype: string;
  element: string;
  zodiacIcon: string;
  imageUrl: string;
  stats: { vitality: number; empathy: number; curiosity: number; charm: number; energy: number; mystery: number };
  colors: { primary: string; secondary: string };
  onExpand: () => void;
}

const elementColors: Record<string, { primary: string; secondary: string }> = {
  Water: { primary: '#0EA5E9', secondary: '#BAE6FD' },
  Fire: { primary: '#F97316', secondary: '#FED7AA' },
};

function MiniCard({ name, archetype, element, zodiacIcon, imageUrl, stats, colors, onExpand }: MiniCardProps) {
  const totalHP = Math.round(50 + (stats.vitality + stats.energy) * 0.5);
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={onExpand}
      className="relative w-36 cursor-pointer"
      style={{ aspectRatio: '63/88' }}
    >
      {/* Card border */}
      <div 
        className="absolute inset-0 rounded-lg overflow-hidden shadow-xl"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          padding: '3px',
        }}
      >
        {/* Inner card */}
        <div className="relative h-full rounded-md overflow-hidden" style={{ backgroundColor: colors.secondary }}>
          {/* Header */}
          <div className="flex justify-between items-center px-1.5 py-1">
            <span className="text-[7px] font-bold px-1 py-0.5 rounded text-white" style={{ backgroundColor: colors.primary }}>
              {zodiacIcon} COSMIC
            </span>
            <div className="flex items-center gap-0.5">
              <span className="text-[7px] font-bold" style={{ color: colors.primary }}>HP</span>
              <span className="text-sm font-black" style={{ color: colors.primary }}>{totalHP}</span>
            </div>
          </div>

          {/* Name */}
          <p className="text-[10px] font-bold px-1.5 truncate" style={{ color: colors.primary }}>{name}</p>

          {/* Image */}
          <div className="mx-1.5 mt-1 rounded overflow-hidden border-2" style={{ borderColor: colors.primary }}>
            <img src={imageUrl} alt={name} className="w-full h-16 object-cover" />
          </div>

          {/* Mini stats */}
          <div className="px-1.5 mt-1.5 space-y-0.5">
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" style={{ color: colors.primary }} />
              <div className="flex-1 h-1 bg-white/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${stats.vitality}%`, backgroundColor: colors.primary }} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-2.5 h-2.5" style={{ color: colors.primary }} />
              <div className="flex-1 h-1 bg-white/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${stats.empathy}%`, backgroundColor: colors.primary }} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" style={{ color: colors.primary }} />
              <div className="flex-1 h-1 bg-white/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${stats.charm}%`, backgroundColor: colors.primary }} />
              </div>
            </div>
          </div>

          {/* Archetype */}
          <p className="text-[6px] text-center mt-1 opacity-70 truncate px-1" style={{ color: colors.primary }}>
            {archetype}
          </p>

          {/* Tap hint */}
          <p className="text-[6px] text-center mt-0.5 opacity-50" style={{ color: colors.primary }}>
            Tap to expand
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ExpandedCard({ name, archetype, element, zodiacIcon, imageUrl, stats, colors, onClose }: MiniCardProps & { onClose: () => void }) {
  const totalHP = Math.round(50 + (stats.vitality + stats.energy) * 0.5);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, rotateY: -20 }}
        animate={{ scale: 1, rotateY: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-72"
        style={{ aspectRatio: '63/88' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Card border */}
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            padding: '6px',
          }}
        >
          {/* Holographic overlay */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-10"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)`,
              mixBlendMode: 'overlay',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Inner card */}
          <div className="relative h-full rounded-lg overflow-hidden" style={{ backgroundColor: colors.secondary }}>
            {/* Header */}
            <div className="flex justify-between items-center px-2 py-1.5">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: colors.primary }}>
                {zodiacIcon} COSMIC RARE
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold" style={{ color: colors.primary }}>HP</span>
                <span className="text-2xl font-black" style={{ color: colors.primary }}>{totalHP}</span>
              </div>
            </div>

            {/* Name */}
            <div className="px-2.5 -mt-0.5">
              <h2 className="text-lg font-black" style={{ color: colors.primary }}>{name}</h2>
              <p className="text-[8px] uppercase tracking-wider opacity-60" style={{ color: colors.primary }}>{archetype}</p>
            </div>

            {/* Image */}
            <div className="mx-2.5 mt-2 rounded-lg overflow-hidden border-3" style={{ borderColor: colors.primary, borderWidth: '3px' }}>
              <img src={imageUrl} alt={name} className="w-full h-28 object-cover" />
            </div>

            {/* Stats */}
            <div className="px-3 mt-3 space-y-1.5">
              <StatRow icon={Zap} label="Vitality" value={stats.vitality} color={colors.primary} />
              <StatRow icon={Heart} label="Empathy" value={stats.empathy} color={colors.primary} />
              <StatRow icon={Star} label="Curiosity" value={stats.curiosity} color={colors.primary} />
              <StatRow icon={Sparkles} label="Charm" value={stats.charm} color={colors.primary} />
              <StatRow icon={Zap} label="Energy" value={stats.energy} color={colors.primary} />
              <StatRow icon={Shield} label="Mystery" value={stats.mystery} color={colors.primary} />
            </div>

            {/* Footer */}
            <div className="absolute bottom-2 left-2 right-2 text-[7px] text-center opacity-50" style={{ color: colors.primary }}>
              {element} Type • cosmicpet.report
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatRow({ icon: Icon, label, value, color }: { icon: typeof Zap; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-[9px] uppercase w-12 opacity-70" style={{ color }}>{label}</span>
      <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full rounded-full" 
          style={{ backgroundColor: color }} 
        />
      </div>
      <span className="text-[10px] font-bold w-5 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

// Sample card data
const sampleCards = [
  {
    name: 'Luna',
    archetype: 'Mystical Dreamer',
    element: 'Water',
    zodiacIcon: '♓',
    imageUrl: mysticalDreamer,
    stats: { vitality: 72, empathy: 91, curiosity: 85, charm: 88, energy: 65, mystery: 94 },
  },
  {
    name: 'Max',
    archetype: 'Noble Guardian',
    element: 'Fire',
    zodiacIcon: '♌',
    imageUrl: nobleGuardian,
    stats: { vitality: 89, empathy: 78, curiosity: 70, charm: 82, energy: 92, mystery: 68 },
  },
];

export function CosmicCardShowcase() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <>
      {/* Side by side cards */}
      <div className="flex justify-center gap-3">
        {sampleCards.map((card, idx) => (
          <MiniCard
            key={idx}
            {...card}
            colors={elementColors[card.element]}
            onExpand={() => setExpandedCard(idx)}
          />
        ))}
      </div>

      {/* Expanded card modal */}
      <AnimatePresence>
        {expandedCard !== null && (
          <ExpandedCard
            {...sampleCards[expandedCard]}
            colors={elementColors[sampleCards[expandedCard].element]}
            onExpand={() => {}}
            onClose={() => setExpandedCard(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
