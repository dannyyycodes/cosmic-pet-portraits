import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, Heart, Zap, Sparkles, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

// Sample data for the showcase
const samplePet = {
  name: "Luna",
  breed: "Persian Cat",
  sunSign: "Pisces",
  moonSign: "Scorpio",
  element: "Water",
  zodiacIcon: "♓",
  archetype: "The Mystical Dreamer",
};

const zodiacData = [
  { name: 'Aries', symbol: '♈', startDegree: 0, element: 'Fire' },
  { name: 'Taurus', symbol: '♉', startDegree: 30, element: 'Earth' },
  { name: 'Gemini', symbol: '♊', startDegree: 60, element: 'Air' },
  { name: 'Cancer', symbol: '♋', startDegree: 90, element: 'Water' },
  { name: 'Leo', symbol: '♌', startDegree: 120, element: 'Fire' },
  { name: 'Virgo', symbol: '♍', startDegree: 150, element: 'Earth' },
  { name: 'Libra', symbol: '♎', startDegree: 180, element: 'Air' },
  { name: 'Scorpio', symbol: '♏', startDegree: 210, element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', startDegree: 240, element: 'Fire' },
  { name: 'Capricorn', symbol: '♑', startDegree: 270, element: 'Earth' },
  { name: 'Aquarius', symbol: '♒', startDegree: 300, element: 'Air' },
  { name: 'Pisces', symbol: '♓', startDegree: 330, element: 'Water' },
];

const elementColors: Record<string, string> = {
  Fire: '#ef4444',
  Earth: '#22c55e',
  Air: '#3b82f6',
  Water: '#8b5cf6',
};

const planets = [
  { symbol: '☉', color: '#fbbf24', degree: 340 },
  { symbol: '☽', color: '#e2e8f0', degree: 220 },
  { symbol: '♀', color: '#ec4899', degree: 15 },
  { symbol: '♂', color: '#ef4444', degree: 95 },
  { symbol: '♃', color: '#f97316', degree: 175 },
];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((180 - angleInDegrees) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy - radius * Math.sin(angleInRadians),
  };
}

// Mini Birth Chart Wheel Component
function MiniBirthChart() {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 85;
  const innerRadius = 60;

  return (
    <motion.svg 
      viewBox={`0 0 ${size} ${size}`} 
      className="w-full h-full"
      initial={{ rotate: -30, opacity: 0 }}
      animate={{ rotate: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    >
      <defs>
        <radialGradient id="chartGlow">
          <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <circle cx={cx} cy={cy} r={outerRadius + 5} fill="rgba(0,0,0,0.6)" />
      <circle cx={cx} cy={cy} r={30} fill="url(#chartGlow)" />

      {/* Zodiac segments */}
      {zodiacData.map((zodiac, i) => {
        const startAngle = zodiac.startDegree;
        const midAngle = startAngle + 15;
        const symbolPos = polarToCartesian(cx, cy, innerRadius + 12, midAngle);
        
        return (
          <g key={zodiac.name}>
            <circle
              cx={cx}
              cy={cy}
              r={outerRadius}
              fill="none"
              stroke={`${elementColors[zodiac.element]}33`}
              strokeWidth="25"
              strokeDasharray={`${(Math.PI * outerRadius * 2) / 12} ${(Math.PI * outerRadius * 2) * 11 / 12}`}
              strokeDashoffset={-(Math.PI * outerRadius * 2 * i) / 12}
              transform={`rotate(${-90 + 15} ${cx} ${cy})`}
            />
            <text
              x={symbolPos.x}
              y={symbolPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={elementColors[zodiac.element]}
              fontSize="10"
              fontWeight="bold"
            >
              {zodiac.symbol}
            </text>
          </g>
        );
      })}

      {/* Inner circles */}
      <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={40} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="3 3" />

      {/* Planets */}
      {planets.map((planet, i) => {
        const pos = polarToCartesian(cx, cy, 45, planet.degree);
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={9}
              fill="rgba(0,0,0,0.8)"
              stroke={planet.color}
              strokeWidth="1.5"
              filter="url(#glow)"
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={planet.color}
              fontSize="8"
              fontWeight="bold"
            >
              {planet.symbol}
            </text>
          </motion.g>
        );
      })}

      {/* Center text */}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" className="uppercase">
        Luna's
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(139, 92, 246, 1)" fontSize="6" fontWeight="bold">
        Birth Chart
      </text>
    </motion.svg>
  );
}

// Mini Cosmic Card Component
function MiniCosmicCard() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative w-full aspect-[3/4] rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
        padding: '2px',
      }}
    >
      <div className="relative w-full h-full rounded-xl bg-slate-900 overflow-hidden p-3">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(139,92,246,0.3),transparent_60%)]" />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header badge */}
          <div className="text-center mb-2">
            <span className="inline-block px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/30 to-pink-500/30 border border-white/20 text-[8px] font-bold text-white/90">
              ✨ COSMIC REVEAL ✨
            </span>
          </div>

          {/* Pet avatar */}
          <div className="flex justify-center mb-2">
            <motion.div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ 
                background: 'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(236,72,153,0.5))',
                boxShadow: '0 0 30px rgba(139,92,246,0.5)'
              }}
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(139,92,246,0.4)',
                  '0 0 40px rgba(139,92,246,0.6)',
                  '0 0 20px rgba(139,92,246,0.4)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🐱
            </motion.div>
          </div>

          {/* Name & archetype */}
          <div className="text-center mb-2">
            <h4 className="text-sm font-bold text-white">{samplePet.name}</h4>
            <p className="text-[9px] text-violet-300">{samplePet.archetype}</p>
          </div>

          {/* Signs */}
          <div className="flex justify-center gap-2 mb-2">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[8px]">
              <span className="text-yellow-400">☉</span>
              <span className="text-white/80">{samplePet.sunSign}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[8px]">
              <span className="text-slate-300">☽</span>
              <span className="text-white/80">{samplePet.moonSign}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-1">
            {[
              { label: 'Charm', value: 92, color: '#ec4899' },
              { label: 'Mystery', value: 88, color: '#8b5cf6' },
              { label: 'Empathy', value: 85, color: '#06b6d4' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-[8px] text-white/60 w-10">{stat.label}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: stat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.value}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </div>
                <span className="text-[8px] text-white/80 w-5">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-auto pt-1">
            <div className="inline-flex items-center gap-1 text-[8px] text-amber-400">
              <Zap className="w-2.5 h-2.5" />
              <span>Power: 88</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Report excerpt cards
const excerpts = [
  {
    title: "Personality Deep Dive",
    icon: "🌟",
    text: "Luna's Pisces Venus explains the 3am zoomies. She's not crazy — she's cosmically activated when you're trying to sleep.",
    highlight: "Also, she judges your life choices. A lot."
  },
  {
    title: "Soul Connection",
    icon: "💫",
    text: "You two share a rare Moon-Neptune aspect. This explains why she always knows when you need comfort.",
    highlight: "Your bond was written in the stars."
  },
  {
    title: "Hidden Talents",
    icon: "✨",
    text: "With Mars in her 5th house, Luna has untapped performance energy. She could have been a cat influencer.",
    highlight: "She chose you instead."
  },
];

export function GiftReportShowcase() {
  const [activeView, setActiveView] = useState(0);
  const [excerptIndex, setExcerptIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setExcerptIndex((prev) => (prev + 1) % excerpts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const views = [
    { label: "Birth Chart", icon: "🌌" },
    { label: "Cosmic Card", icon: "✨" },
  ];

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 via-card/60 to-pink-500/10 border border-violet-500/20 space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">Sneak Peek</span>
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground">
          What's Inside Their Report
        </h3>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        {views.map((view, i) => (
          <button
            key={i}
            onClick={() => setActiveView(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeView === i
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            <span>{view.icon}</span>
            <span>{view.label}</span>
          </button>
        ))}
      </div>

      {/* Visual Preview */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeView === 0 ? (
            <motion.div
              key="chart"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="aspect-square max-w-[200px] mx-auto"
            >
              <MiniBirthChart />
            </motion.div>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-[160px] mx-auto"
            >
              <MiniCosmicCard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rotating Excerpts */}
      <div className="relative bg-card/60 rounded-xl p-4 border border-border/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={excerptIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-lg">{excerpts[excerptIndex].icon}</span>
              <span className="text-xs font-semibold text-foreground">{excerpts[excerptIndex].title}</span>
            </div>
            <p className="text-sm text-muted-foreground italic mb-2">
              "{excerpts[excerptIndex].text}"
            </p>
            <p className="text-sm text-violet-400 font-medium">
              ✨ {excerpts[excerptIndex].highlight}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {excerpts.map((_, i) => (
            <button
              key={i}
              onClick={() => setExcerptIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === excerptIndex ? 'bg-violet-400 w-4' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: "📊", label: "Full Chart" },
          { icon: "🎴", label: "Share Card" },
          { icon: "📖", label: "30+ Pages" },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="p-2 rounded-lg bg-white/5 border border-border/20"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-xl">{item.icon}</span>
            <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
