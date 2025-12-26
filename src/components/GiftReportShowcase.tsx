import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, Sparkles, Eye, Crown, Heart, Zap, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import lunaPersian from '@/assets/samples/luna-persian.jpg';
import maxGolden from '@/assets/samples/max-golden.jpg';

// Pet showcase data
const petShowcases = [
  {
    name: "Luna",
    image: lunaPersian,
    archetype: "The Mystical Dreamer",
    sunSign: "Pisces",
    moonSign: "Scorpio",
    element: "Water",
    elementEmoji: "💧",
    elementColors: { from: 'cyan-500', to: 'violet-500' },
    stats: [
      { label: 'Charm', value: 94, color: 'from-pink-500 to-rose-400', icon: Heart },
      { label: 'Mystery', value: 89, color: 'from-violet-500 to-purple-400', icon: Sparkles },
      { label: 'Energy', value: 76, color: 'from-amber-500 to-yellow-400', icon: Zap },
    ],
    power: 86,
  },
  {
    name: "Max",
    image: maxGolden,
    archetype: "The Loyal Guardian",
    sunSign: "Leo",
    moonSign: "Cancer",
    element: "Fire",
    elementEmoji: "🔥",
    elementColors: { from: 'orange-500', to: 'amber-500' },
    stats: [
      { label: 'Loyalty', value: 98, color: 'from-amber-500 to-yellow-400', icon: Heart },
      { label: 'Energy', value: 92, color: 'from-orange-500 to-red-400', icon: Zap },
      { label: 'Charm', value: 88, color: 'from-pink-500 to-rose-400', icon: Sparkles },
    ],
    power: 93,
  },
];

// Premium cosmic card with real artwork
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
      {/* Outer glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/30 via-pink-500/30 to-amber-500/30 blur-2xl rounded-3xl" />
      
      {/* Card container */}
      <div 
        className="relative w-[280px] rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)',
          padding: '3px',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.4), 0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Inner card */}
        <div className="relative bg-slate-900 rounded-xl overflow-hidden">
          {/* Cosmic background pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.3),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPgo8L3N2Zz4=')] opacity-40" />
          </div>
          
          {/* Animated stars */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${10 + i * 12}%`,
                top: `${5 + (i % 3) * 8}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Header badge */}
          <div className="relative px-4 pt-4 pb-2">
            <motion.div 
              className="flex justify-center"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/40 via-pink-500/40 to-amber-500/40 border border-white/30 text-xs font-bold text-white tracking-wider shadow-lg">
                ✨ COSMIC REVEAL ✨
              </span>
            </motion.div>
          </div>

          {/* Pet portrait with magical frame */}
          <div className="relative mx-4 mt-2">
            <div className="relative aspect-square rounded-xl overflow-hidden">
              {/* Magical frame border */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-400/50 via-pink-400/50 to-amber-400/50 p-[2px]">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900">
                  <img 
                    src={pet.image}
                    alt={`${pet.name} the pet`}
                    className="w-full h-full object-cover"
                  />
                  {/* Aura overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.2),transparent_70%)]" />
                </div>
              </div>
              
              {/* Floating orbs */}
              <motion.div
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                animate={{ 
                  y: [0, -4, 0],
                  boxShadow: ['0 0 15px rgba(251, 191, 36, 0.4)', '0 0 25px rgba(251, 191, 36, 0.7)', '0 0 15px rgba(251, 191, 36, 0.4)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sun className="w-4 h-4 text-white" />
              </motion.div>
              
              <motion.div
                className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg"
                animate={{ 
                  y: [0, -3, 0],
                  boxShadow: ['0 0 12px rgba(203, 213, 225, 0.3)', '0 0 20px rgba(203, 213, 225, 0.6)', '0 0 12px rgba(203, 213, 225, 0.3)']
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              >
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              </motion.div>
            </div>
          </div>

          {/* Pet info */}
          <div className="relative px-4 pt-4 pb-2 text-center">
            <motion.h3 
              className="text-2xl font-bold text-white tracking-wide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {pet.name}
            </motion.h3>
            <motion.div 
              className="flex items-center justify-center gap-2 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span className="text-xs uppercase tracking-[0.2em] text-violet-300 font-medium">
                {pet.archetype}
              </span>
              <Crown className="w-3 h-3 text-amber-400" />
            </motion.div>
          </div>

          {/* Cosmic signs */}
          <div className="relative flex justify-center gap-3 px-4 py-2">
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-amber-400 text-sm">☉</span>
              <span className="text-white/90 text-xs font-medium">{pet.sunSign}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-400/20 to-slate-500/20 border border-slate-400/30"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-slate-300 text-sm">☽</span>
              <span className="text-white/90 text-xs font-medium">{pet.moonSign}</span>
            </motion.div>
          </div>

          {/* Stats with beautiful bars */}
          <div className="relative px-4 py-3 space-y-2">
            {pet.stats.map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <stat.icon className="w-3.5 h-3.5 text-white/60" />
                <span className="text-[10px] uppercase tracking-wider text-white/60 w-14">{stat.label}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-bold text-white/90 w-6 text-right">{stat.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Element badge */}
          <div className="relative flex justify-center pb-3">
            <motion.div 
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-${pet.elementColors.from}/30 to-${pet.elementColors.to}/30 border border-${pet.elementColors.from}/30`}
              animate={{ 
                boxShadow: ['0 0 15px rgba(139, 92, 246, 0.2)', '0 0 25px rgba(139, 92, 246, 0.4)', '0 0 15px rgba(139, 92, 246, 0.2)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-lg">{pet.elementEmoji}</span>
              <span className="text-sm font-bold text-white">{pet.element} Element</span>
            </motion.div>
          </div>

          {/* Power score footer */}
          <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-900/50 via-pink-900/30 to-violet-900/50 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs text-white/70">Cosmic Power</span>
            </div>
            <motion.div 
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-3 h-3 text-white" />
              <span className="text-sm font-bold text-white">{pet.power}</span>
            </motion.div>
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
          href={pet.image}
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

      {/* Visual Preview with Pet Navigation */}
      <div className="flex justify-center items-center gap-4 mb-10">
        {/* Left arrow */}
        <motion.button
          onClick={prevPet}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <AnimatePresence mode="wait">
          {activeView === 0 ? (
            <motion.div
              key={`card-${petIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <PremiumCosmicCard petIndex={petIndex} />
            </motion.div>
          ) : (
            <motion.div
              key={`chart-${petIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <PremiumBirthChart petIndex={petIndex} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right arrow */}
        <motion.button
          onClick={nextPet}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Pet indicator dots */}
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