import { motion } from 'framer-motion';
import { Heart, Sparkles, Star, Zap, Shield, Users } from 'lucide-react';
import { CompatibilityResult } from '@/lib/compatibility';

interface CompatibilityCardProps {
  name1: string;
  name2: string;
  result: CompatibilityResult;
  isPetToOwner?: boolean;
  image1?: string;
  image2?: string;
}

export function CompatibilityCard({
  name1,
  name2,
  result,
  isPetToOwner = false,
  image1,
  image2,
}: CompatibilityCardProps) {
  const getLevelColor = () => {
    if (result.score >= 90) return 'from-pink-500 to-violet-500';
    if (result.score >= 75) return 'from-violet-500 to-blue-500';
    if (result.score >= 60) return 'from-blue-500 to-cyan-500';
    if (result.score >= 45) return 'from-cyan-500 to-teal-500';
    return 'from-orange-500 to-amber-500';
  };

  const getHarmonyIcon = () => {
    switch (result.elementMatch.harmony) {
      case 'Perfect': return <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />;
      case 'Complementary': return <Sparkles className="w-4 h-4 text-violet-400" />;
      case 'Neutral': return <Star className="w-4 h-4 text-blue-400" />;
      default: return <Zap className="w-4 h-4 text-orange-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getLevelColor()} opacity-20 blur-xl`} />
      
      {/* Card content */}
      <div className="relative bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        {/* Header with avatars */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Avatar 1 */}
          <div className="relative">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor()} p-0.5`}>
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                {image1 ? (
                  <img src={image1} alt={name1} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{isPetToOwner ? '👤' : '🐾'}</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 rounded-full text-[10px] font-medium text-white border border-white/20 whitespace-nowrap">
              {name1}
            </div>
          </div>

          {/* Connection indicator */}
          <div className="flex flex-col items-center gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor()} flex items-center justify-center`}
            >
              <span className="text-xl font-bold text-white">{result.score}</span>
            </motion.div>
            <span className="text-[10px] text-white/60">%</span>
          </div>

          {/* Avatar 2 */}
          <div className="relative">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor()} p-0.5`}>
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                {image2 ? (
                  <img src={image2} alt={name2} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐾</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 rounded-full text-[10px] font-medium text-white border border-white/20 whitespace-nowrap">
              {name2}
            </div>
          </div>
        </div>

        {/* Level badge */}
        <div className="text-center mb-4">
          <span className="text-lg">{result.emoji}</span>
          <h3 className={`text-lg font-bold bg-gradient-to-r ${getLevelColor()} bg-clip-text text-transparent`}>
            {result.level}
          </h3>
        </div>

        {/* Summary */}
        <p className="text-sm text-white/80 text-center mb-4 leading-relaxed">
          {result.summary}
        </p>

        {/* Element match */}
        <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-full bg-white/5 border border-white/10 mx-auto w-fit">
          {getHarmonyIcon()}
          <span className="text-xs text-white/70">
            {result.elementMatch.element1} + {result.elementMatch.element2} = {result.elementMatch.harmony} Match
          </span>
        </div>

        {/* Strengths */}
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3" /> Cosmic Strengths
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {result.strengths.map((strength, i) => (
              <span
                key={i}
                className="px-2 py-1 text-[10px] bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-300"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>

        {/* Advice */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
          <p className="text-xs text-white/80 italic">
            💡 {result.advice}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Multi-pet household compatibility overview
interface HouseholdCompatibilityProps {
  pets: Array<{ name: string; image?: string }>;
  compatibilities: Array<{ pet1: string; pet2: string; result: CompatibilityResult }>;
  householdScore: { score: number; level: string; description: string };
}

export function HouseholdCompatibility({
  pets,
  compatibilities,
  householdScore,
}: HouseholdCompatibilityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Overall household score */}
      <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-bold text-white">Household Harmony</h3>
        </div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 mb-3"
        >
          <span className="text-2xl font-bold text-white">{householdScore.score}%</span>
        </motion.div>
        
        <h4 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          {householdScore.level}
        </h4>
        <p className="text-sm text-white/70 mt-1">{householdScore.description}</p>
      </div>

      {/* Individual pairings */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          Pet Pairings
        </h4>
        
        {compatibilities.map((pairing, i) => (
          <CompatibilityCard
            key={i}
            name1={pairing.pet1}
            name2={pairing.pet2}
            result={pairing.result}
            image1={pets.find(p => p.name === pairing.pet1)?.image}
            image2={pets.find(p => p.name === pairing.pet2)?.image}
          />
        ))}
      </div>
    </motion.div>
  );
}
