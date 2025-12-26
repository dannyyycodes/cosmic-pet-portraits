import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, Sparkles, Eye, Crown, ChevronLeft, ChevronRight, Shield, Flame, Brain, Heart as HeartIcon, X } from 'lucide-react';
import lunaPersian from '@/assets/samples/luna-persian.jpg';
import maxGolden from '@/assets/samples/max-golden.jpg';
import mysticalDreamerCat from '@/assets/archetypes/mystical-dreamer-cat-v2.jpg';
import nobleGuardianDog from '@/assets/archetypes/noble-guardian-dog-v2.jpg';

// Pet showcase data with fun, viral-worthy traits
const petShowcases = [
  {
    name: "Max",
    photo: maxGolden,
    archetypeImage: nobleGuardianDog,
    archetype: "The Noble Guardian",
    archetypeEmoji: "🛡️",
    sunSign: "Leo",
    moonSign: "Cancer",
    element: "Fire",
    elementEmoji: "🔥",
    species: "Golden Retriever",
    vibes: [
      { trait: "Professional Tail Wagger", emoji: "💫", intensity: "Infinite" },
      { trait: "Ball Retrieval Expert", emoji: "🎾", intensity: "Obsessed" },
      { trait: "Unconditional Love Dealer", emoji: "❤️", intensity: "Maximum" },
    ],
    superpower: "Knows when you're sad before you do",
    chaosLevel: "Happy Chaos",
    loveLanguage: "Full Body Wiggles",
    secretTalent: "Snack Detection from 3 Rooms Away",
    rarity: "Legendary",
    power: 93,
  },
  {
    name: "Luna",
    photo: lunaPersian,
    archetypeImage: mysticalDreamerCat,
    archetype: "The Mystical Dreamer",
    archetypeEmoji: "🔮",
    sunSign: "Pisces",
    moonSign: "Scorpio",
    element: "Water",
    elementEmoji: "💧",
    species: "Persian Cat",
    vibes: [
      { trait: "Judges Your Life Choices", emoji: "👀", intensity: "Expert Level" },
      { trait: "3am Zoomies Specialist", emoji: "🌙", intensity: "Legendary" },
      { trait: "Treat Negotiator", emoji: "🍖", intensity: "Master" },
    ],
    superpower: "Can sense when you're about to leave the house",
    chaosLevel: "Controlled Chaos",
    loveLanguage: "Aggressive Head Bonks",
    secretTalent: "Telepathic Guilt Trips",
    rarity: "Ultra Rare",
    power: 86,
  },
];

// Rarity colors
const rarityColors: Record<string, string> = {
  "Common": "from-slate-400 to-slate-500",
  "Uncommon": "from-green-400 to-emerald-500",
  "Rare": "from-blue-400 to-cyan-500",
  "Ultra Rare": "from-violet-400 to-purple-500",
  "Legendary": "from-amber-400 to-orange-500",
  "Mythic": "from-pink-400 to-rose-500",
};

// Premium cosmic card - collectible style with fun traits
function PremiumCosmicCard({ petIndex = 0 }: { petIndex?: number }) {
  const pet = petShowcases[petIndex];
  
  return (
    <motion.div
      key={pet.name}
      initial={{ scale: 0.9, opacity: 0, rotateY: -15 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      exit={{ scale: 0.9, opacity: 0, rotateY: 15 }}
      transition={{ type: 'spring', stiffness: 80, delay: 0.2 }}
      className="relative"
      style={{ perspective: '1000px' }}
    >
      {/* Outer glow based on rarity */}
      <div className={`absolute -inset-4 bg-gradient-to-r ${rarityColors[pet.rarity]} blur-2xl rounded-3xl opacity-40`} />
      
      {/* Card container */}
      <div 
        className="relative w-[300px] rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #1a1a2e, #16213e)`,
          padding: '3px',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.3), 0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Holographic border */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${rarityColors[pet.rarity]} opacity-80`} />
        
        {/* Inner card */}
        <div className="relative bg-slate-900 rounded-xl overflow-hidden m-[2px]">
          {/* Top bar with rarity */}
          <div className="relative flex items-center justify-between px-3 py-2 bg-black/40">
            <div className="flex items-center gap-2">
              <span className="text-xl">{pet.archetypeEmoji}</span>
              <span className={`text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${rarityColors[pet.rarity]} bg-clip-text text-transparent`}>
                {pet.rarity}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-amber-400">{pet.power}</span>
            </div>
          </div>

          {/* Archetype artwork - collectible style */}
          <div className="relative mx-3 mt-2">
            <div className="relative aspect-square rounded-xl overflow-hidden">
              {/* Gradient frame */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${rarityColors[pet.rarity]} p-[2px]`}>
                <div className="w-full h-full rounded-lg overflow-hidden bg-slate-900 relative">
                  <img 
                    src={pet.archetypeImage}
                    alt={`${pet.name} - ${pet.archetype}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  {/* Holographic shimmer effect */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </div>
              </div>
              
              {/* Element badge */}
              <motion.div
                className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/70 border-2 border-white/20 flex items-center justify-center text-xl backdrop-blur-sm"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {pet.elementEmoji}
              </motion.div>
              
              {/* Signs at bottom */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
                <div className="px-2 py-1 rounded-full bg-black/70 backdrop-blur text-[10px] font-medium text-white/90 border border-white/10">
                  ☉ {pet.sunSign}
                </div>
                <div className="px-2 py-1 rounded-full bg-black/70 backdrop-blur text-[10px] font-medium text-white/90 border border-white/10">
                  ☽ {pet.moonSign}
                </div>
              </div>
            </div>
          </div>

          {/* Name & Archetype */}
          <div className="relative px-4 pt-3 pb-1 text-center">
            <h3 className="text-2xl font-bold text-white tracking-wide">{pet.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <Crown className="w-3 h-3 text-amber-400" />
              <span className={`text-xs uppercase tracking-[0.15em] font-bold bg-gradient-to-r ${rarityColors[pet.rarity]} bg-clip-text text-transparent`}>
                {pet.archetype}
              </span>
              <Crown className="w-3 h-3 text-amber-400" />
            </div>
          </div>

          {/* Fun Personality Vibes */}
          <div className="px-3 py-2 space-y-1.5">
            {pet.vibes.map((vibe, i) => (
              <motion.div
                key={vibe.trait}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{vibe.emoji}</span>
                  <span className="text-xs font-medium text-white/90">{vibe.trait}</span>
                </div>
                <span className="text-[10px] font-bold text-violet-400 uppercase">{vibe.intensity}</span>
              </motion.div>
            ))}
          </div>

          {/* Superpower & Secret */}
          <div className="px-3 pb-2 grid grid-cols-2 gap-2">
            <motion.div 
              className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 text-center"
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-xs text-violet-300 block mb-0.5">⚡ Superpower</span>
              <span className="text-[10px] text-white/80 leading-tight block">{pet.superpower}</span>
            </motion.div>
            <motion.div 
              className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center"
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-xs text-amber-300 block mb-0.5">🤫 Secret Talent</span>
              <span className="text-[10px] text-white/80 leading-tight block">{pet.secretTalent}</span>
            </motion.div>
          </div>

          {/* Love Language & Chaos Level */}
          <div className="px-3 pb-3 flex gap-2 text-center">
            <div className="flex-1 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <span className="text-[10px] text-pink-300">💕 {pet.loveLanguage}</span>
            </div>
            <div className="flex-1 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <span className="text-[10px] text-orange-300">🌀 {pet.chaosLevel}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-t border-white/10">
            <span className="text-[9px] text-white/40">COSMIC PET COLLECTION</span>
            <div className="flex items-center gap-1 text-[9px] text-white/40">
              <Sparkles className="w-2.5 h-2.5" />
              <span>#{String(petIndex + 1).padStart(4, '0')}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
        }}
        animate={{ x: ['-200%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      />
    </motion.div>
  );
}

// Premium birth chart wheel
function PremiumBirthChart({ petIndex = 0 }: { petIndex?: number }) {
  const pet = petShowcases[petIndex];
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 115;
  const innerRadius = 75;
  
  const zodiacData = [
    { name: 'Aries', symbol: '♈', color: '#ef4444' },
    { name: 'Taurus', symbol: '♉', color: '#22c55e' },
    { name: 'Gemini', symbol: '♊', color: '#3b82f6' },
    { name: 'Cancer', symbol: '♋', color: '#8b5cf6' },
    { name: 'Leo', symbol: '♌', color: '#f59e0b' },
    { name: 'Virgo', symbol: '♍', color: '#84cc16' },
    { name: 'Libra', symbol: '♎', color: '#ec4899' },
    { name: 'Scorpio', symbol: '♏', color: '#7c3aed' },
    { name: 'Sagittarius', symbol: '♐', color: '#f97316' },
    { name: 'Capricorn', symbol: '♑', color: '#059669' },
    { name: 'Aquarius', symbol: '♒', color: '#0ea5e9' },
    { name: 'Pisces', symbol: '♓', color: '#a855f7' },
  ];
  
  const planets = [
    { symbol: '☉', name: 'Sun', color: '#fbbf24', degree: 340 },
    { symbol: '☽', name: 'Moon', color: '#cbd5e1', degree: 220 },
    { symbol: '♀', name: 'Venus', color: '#ec4899', degree: 15 },
    { symbol: '♂', name: 'Mars', color: '#ef4444', degree: 95 },
    { symbol: '♃', name: 'Jupiter', color: '#f97316', degree: 175 },
  ];

  const polarToCartesian = (radius: number, angleInDegrees: number) => {
    const angleInRadians = ((180 - angleInDegrees) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy - radius * Math.sin(angleInRadians),
    };
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotate: -30 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="relative"
    >
      {/* Outer glow */}
      <div className="absolute -inset-6 bg-gradient-to-r from-violet-500/20 via-pink-500/20 to-amber-500/20 blur-2xl rounded-full" />
      
      <svg viewBox={`0 0 ${size} ${size}`} className="w-[260px] h-[260px]">
        <defs>
          <radialGradient id="premiumChartGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.5)" />
            <stop offset="70%" stopColor="rgba(139, 92, 246, 0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="premiumGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Background glow */}
        <circle cx={cx} cy={cy} r={outerRadius + 10} fill="rgba(0,0,0,0.8)" />
        <circle cx={cx} cy={cy} r={outerRadius - 5} fill="url(#premiumChartGlow)" />

        {/* Outer ring */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={outerRadius} 
          fill="none" 
          stroke="url(#ringGradient)" 
          strokeWidth="2"
          opacity="0.6"
        />
        
        {/* Zodiac segments */}
        {zodiacData.map((zodiac, i) => {
          const startAngle = i * 30;
          const midAngle = startAngle + 15;
          const symbolPos = polarToCartesian(innerRadius + 20, midAngle);
          
          return (
            <g key={zodiac.name}>
              <circle
                cx={cx}
                cy={cy}
                r={outerRadius - 15}
                fill="none"
                stroke={`${zodiac.color}40`}
                strokeWidth="28"
                strokeDasharray={`${(Math.PI * (outerRadius - 15) * 2) / 12 - 2} 2`}
                strokeDashoffset={-(Math.PI * (outerRadius - 15) * 2 * i) / 12}
                transform={`rotate(${-90 + 15} ${cx} ${cy})`}
              />
              <motion.text
                x={symbolPos.x}
                y={symbolPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={zodiac.color}
                fontSize="14"
                fontWeight="bold"
                filter="url(#premiumGlow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                {zodiac.symbol}
              </motion.text>
            </g>
          );
        })}

        {/* Inner decorative circles */}
        <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={50} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="4 4" />
        <circle cx={cx} cy={cy} r={35} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* Planets */}
        {planets.map((planet, i) => {
          const pos = polarToCartesian(55, planet.degree);
          return (
            <motion.g
              key={planet.name}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.15, type: 'spring' }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={12}
                fill="rgba(0,0,0,0.9)"
                stroke={planet.color}
                strokeWidth="2"
                filter="url(#premiumGlow)"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={planet.color}
                fontSize="12"
                fontWeight="bold"
              >
                {planet.symbol}
              </text>
            </motion.g>
          );
        })}

        {/* Center with pet image */}
        <clipPath id="centerClip">
          <circle cx={cx} cy={cy} r="28" />
        </clipPath>
        <circle cx={cx} cy={cy} r="30" fill="rgba(0,0,0,0.8)" stroke="url(#ringGradient)" strokeWidth="2" />
        <image
          href={pet.photo}
          x={cx - 28}
          y={cy - 28}
          width="56"
          height="56"
          clipPath="url(#centerClip)"
          preserveAspectRatio="xMidYMid slice"
        />
      </svg>
      
      {/* Label */}
      <motion.div 
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/30 to-pink-500/30 border border-white/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">{pet.name}'s Birth Chart</span>
      </motion.div>
    </motion.div>
  );
}

// Report excerpt cards
const excerpts = [
  {
    title: "Personality Deep Dive",
    icon: "🌟",
    text: "Luna's Pisces Venus explains the 3am zoomies. She's not chaotic — she's cosmically activated when you're trying to sleep.",
    highlight: "Also, she absolutely judges your life choices. A lot."
  },
  {
    title: "Soul Connection",
    icon: "💫",
    text: "You two share a rare Moon-Neptune aspect. This explains why she always knows when you need comfort.",
    highlight: "Your bond was literally written in the stars."
  },
  {
    title: "Hidden Talents",
    icon: "✨",
    text: "With Mars in her 5th house, Luna has untapped performance energy. She could have been a viral cat influencer.",
    highlight: "She chose you instead. You're welcome."
  },
];

export function GiftReportShowcase() {
  const [activeView, setActiveView] = useState(0);
  const [excerptIndex, setExcerptIndex] = useState(0);
  const [petIndex, setPetIndex] = useState(0);
  const [expandedPetIndex, setExpandedPetIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setExcerptIndex((prev) => (prev + 1) % excerpts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const views = [
    { label: "Cosmic Card", icon: "✨" },
    { label: "Birth Chart", icon: "🌌" },
  ];

  const nextPet = () => setPetIndex((prev) => (prev + 1) % petShowcases.length);
  const prevPet = () => setPetIndex((prev) => (prev - 1 + petShowcases.length) % petShowcases.length);

  return (
    <div className="py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div 
          className="inline-flex items-center gap-2 mb-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Eye className="w-5 h-5 text-violet-400" />
          <span className="text-sm font-medium text-violet-400 uppercase tracking-widest">Exclusive Preview</span>
        </motion.div>
        <motion.h3 
          className="font-display font-bold text-2xl md:text-3xl text-foreground mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          What's Inside Their Report
        </motion.h3>
        <motion.p 
          className="text-muted-foreground text-sm max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Every report is personalized with beautiful cosmic art, deep insights, and shareable cards
        </motion.p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-3 mb-8">
        {views.map((view, i) => (
          <motion.button
            key={i}
            onClick={() => setActiveView(i)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeView === i
                ? 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white border border-violet-400/40 shadow-lg shadow-violet-500/20'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg">{view.icon}</span>
            <span>{view.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Visual Preview */}
      {activeView === 0 ? (
        <>
          {/* Side-by-side Cosmic Cards */}
          <div className="flex justify-center items-start gap-3 sm:gap-5 mb-6 py-4">
            {petShowcases.map((pet, i) => {
              // Keep both cards fully visible on mobile: no overlap, minimal tilt.
              const rotationClass = i === 0 ? "rotate-0 md:-rotate-[2deg]" : "rotate-0 md:rotate-[2deg]";

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setExpandedPetIndex(i)}
                  className="relative shrink-0 w-[148px] h-[320px] sm:w-[162px] sm:h-[350px] md:w-[180px] md:h-[390px] overflow-visible focus:outline-none transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:z-20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`Open ${pet.name}'s cosmic card`}
                >
                  <div className={`origin-top ${rotationClass} scale-[0.48] sm:scale-[0.54] md:scale-[0.6]`}>
                    <PremiumCosmicCard petIndex={i} />
                  </div>
                </button>
              );
            })}
          </div>
          
          <p className="text-center text-xs text-muted-foreground mb-4">Tap a card to expand</p>

          {/* Expanded modal */}
          <AnimatePresence>
            {expandedPetIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm"
                onClick={() => setExpandedPetIndex(null)}
              >
                <motion.div
                  initial={{ scale: 0.92, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.92, y: 10 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedPetIndex(null)}
                    className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <PremiumCosmicCard petIndex={expandedPetIndex} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <>
          {/* Birth Chart view keeps pet navigation */}
          <div className="flex justify-center items-center gap-4 mb-10">
            <motion.button
              onClick={prevPet}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            <AnimatePresence mode="wait">
              <motion.div
                key={`chart-${petIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <PremiumBirthChart petIndex={petIndex} />
              </motion.div>
            </AnimatePresence>

            <motion.button
              onClick={nextPet}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {petShowcases.map((pet, i) => (
              <button
                key={i}
                onClick={() => setPetIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === petIndex ? 'bg-gradient-to-r from-violet-400 to-pink-400 w-8' : 'bg-white/20 w-2 hover:bg-white/30'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Rotating Excerpts */}
      <motion.div 
        className="max-w-lg mx-auto bg-gradient-to-br from-card/80 to-card/40 rounded-2xl p-6 border border-violet-500/20 shadow-xl shadow-violet-500/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={excerptIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">{excerpts[excerptIndex].icon}</span>
              <span className="text-sm font-bold text-foreground uppercase tracking-wide">{excerpts[excerptIndex].title}</span>
            </div>
            <p className="text-base text-muted-foreground italic mb-3 leading-relaxed">
              "{excerpts[excerptIndex].text}"
            </p>
            <p className="text-sm font-medium bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              ✨ {excerpts[excerptIndex].highlight}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {excerpts.map((_, i) => (
            <button
              key={i}
              onClick={() => setExcerptIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === excerptIndex ? 'bg-gradient-to-r from-violet-400 to-pink-400 w-6' : 'bg-white/20 w-2 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mt-8">
        {[
          { icon: "🔮", label: "Full Birth Chart", desc: "Personalized wheel" },
          { icon: "🎴", label: "Shareable Card", desc: "Social-ready design" },
          { icon: "📖", label: "30+ Page Report", desc: "Deep cosmic insights" },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            whileHover={{ scale: 1.05, borderColor: 'rgba(139, 92, 246, 0.3)' }}
          >
            <span className="text-2xl">{item.icon}</span>
            <p className="text-xs font-bold text-foreground mt-2">{item.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}