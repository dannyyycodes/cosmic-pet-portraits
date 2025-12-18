import { motion } from 'framer-motion';
import { Star, Heart, Zap, Shield, Sparkles, Share2, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface CardStats {
  vitality: number; // Based on Sun sign strength
  empathy: number; // Based on Moon sign
  curiosity: number; // Based on Mercury
  charm: number; // Based on Venus
  energy: number; // Based on Mars
  mystery: number; // Based on Lilith
}

interface CosmicPetCardProps {
  petName: string;
  archetype: string;
  sunSign: string;
  moonSign: string;
  element: string;
  zodiacIcon: string;
  stats: CardStats;
  auraColor: string;
  petPortraitUrl?: string;
  onGeneratePortrait?: () => void;
  isGeneratingPortrait?: boolean;
}

const elementGradients: Record<string, string> = {
  Fire: 'from-orange-600 via-red-500 to-yellow-500',
  Earth: 'from-emerald-600 via-green-500 to-lime-400',
  Air: 'from-sky-500 via-indigo-400 to-purple-400',
  Water: 'from-blue-600 via-cyan-500 to-teal-400',
};

const elementBgPatterns: Record<string, string> = {
  Fire: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/40 via-red-900/20 to-transparent',
  Earth: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-green-900/20 to-transparent',
  Air: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-indigo-900/20 to-transparent',
  Water: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-cyan-900/20 to-transparent',
};

const StatBar = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Star; color: string }) => (
  <div className="flex items-center gap-2">
    <Icon className={`w-3.5 h-3.5 ${color}`} />
    <span className="text-[10px] uppercase tracking-wider text-white/70 w-14">{label}</span>
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
        className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
      />
    </div>
    <span className="text-xs font-bold text-white/90 w-6 text-right">{value}</span>
  </div>
);

export function CosmicPetCard({
  petName,
  archetype,
  sunSign,
  moonSign,
  element,
  zodiacIcon,
  stats,
  auraColor,
  petPortraitUrl,
  onGeneratePortrait,
  isGeneratingPortrait,
}: CosmicPetCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Create shareable text
      const shareText = `✨ Meet ${petName}, ${archetype}! ✨

☉ ${sunSign} Sun • ☽ ${moonSign} Moon
🔥 Element: ${element}

Stats:
⚡ Vitality: ${stats.vitality}
💗 Empathy: ${stats.empathy}
🧠 Curiosity: ${stats.curiosity}
✨ Charm: ${stats.charm}
⚡ Energy: ${stats.energy}
🌙 Mystery: ${stats.mystery}

Discover your pet's cosmic soul at cosmicpet.report`;
      
      if (navigator.share) {
        await navigator.share({
          title: `${petName}'s Cosmic Card`,
          text: shareText,
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Card stats copied to clipboard!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('Failed to share');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    toast.info('Screenshot your card to save it!');
  };

  const totalPower = Math.round((stats.vitality + stats.empathy + stats.curiosity + stats.charm + stats.energy + stats.mystery) / 6);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The Card */}
      <motion.div
        ref={cardRef}
        initial={{ rotateY: -10, rotateX: 5 }}
        animate={{ rotateY: 0, rotateX: 0 }}
        whileHover={{ rotateY: 5, rotateX: -2, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="relative w-72 h-[420px] perspective-1000"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card frame */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${elementGradients[element]} p-1 shadow-2xl`}>
          {/* Inner card */}
          <div className={`relative h-full rounded-xl bg-slate-900 overflow-hidden ${elementBgPatterns[element]}`}>
            {/* Holographic overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPgo8L3N2Zz4=')] opacity-30" />

            {/* Top bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-black/30">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{zodiacIcon}</span>
                <span className="text-xs font-bold text-white/80">{sunSign}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10">
                <Sparkles className="w-3 h-3 text-cosmic-gold" />
                <span className="text-xs font-bold text-cosmic-gold">{totalPower}</span>
              </div>
            </div>

            {/* Portrait area */}
            <div className="relative mx-3 mt-2 h-36 rounded-lg overflow-hidden bg-gradient-to-b from-white/5 to-transparent border border-white/10">
              {petPortraitUrl ? (
                <img 
                  src={petPortraitUrl} 
                  alt={petName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-5xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${auraColor}40, ${auraColor}20)`,
                      boxShadow: `0 0 30px ${auraColor}30`
                    }}
                  >
                    {zodiacIcon}
                  </div>
                  {onGeneratePortrait && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onGeneratePortrait}
                      disabled={isGeneratingPortrait}
                      className="text-xs h-7 text-white/60 hover:text-white hover:bg-white/10"
                    >
                      {isGeneratingPortrait ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                          </motion.div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3 mr-1" />
                          Add AI Portrait
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
              
              {/* Aura glow */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{ 
                  background: `radial-gradient(circle at center, ${auraColor}50, transparent 70%)`
                }}
              />
            </div>

            {/* Name and type */}
            <div className="px-3 mt-3 text-center">
              <h2 className="text-xl font-bold text-white tracking-wide">{petName}</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-0.5">{archetype}</p>
            </div>

            {/* Element badge */}
            <div className="flex justify-center mt-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${elementGradients[element]} text-white text-xs font-bold shadow-lg`}>
                <span>{element === 'Fire' ? '🔥' : element === 'Earth' ? '🌿' : element === 'Air' ? '💨' : '💧'}</span>
                {element} Type
              </div>
            </div>

            {/* Stats */}
            <div className="px-4 mt-4 space-y-1.5">
              <StatBar label="Vitality" value={stats.vitality} icon={Zap} color="text-yellow-400" />
              <StatBar label="Empathy" value={stats.empathy} icon={Heart} color="text-pink-400" />
              <StatBar label="Curiosity" value={stats.curiosity} icon={Star} color="text-sky-400" />
              <StatBar label="Charm" value={stats.charm} icon={Sparkles} color="text-purple-400" />
              <StatBar label="Energy" value={stats.energy} icon={Zap} color="text-orange-400" />
              <StatBar label="Mystery" value={stats.mystery} icon={Shield} color="text-indigo-400" />
            </div>

            {/* Footer */}
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[9px] text-white/30">
              <span>☽ {moonSign} Moon</span>
              <span>cosmicpet.report</span>
            </div>
          </div>
        </div>

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
          }}
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={isSharing}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Card
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Save
        </Button>
      </div>

      {/* Viral prompt */}
      <p className="text-center text-xs text-muted-foreground max-w-xs">
        ✨ Share your pet's cosmic card and challenge friends to compare stats!
      </p>
    </div>
  );
}

// Helper function to calculate stats from report data
export function calculateCardStats(report: any): CardStats {
  const getSignStrength = (sign: string): number => {
    const strengths: Record<string, number> = {
      Aries: 85, Taurus: 70, Gemini: 75, Cancer: 65,
      Leo: 90, Virgo: 72, Libra: 68, Scorpio: 88,
      Sagittarius: 82, Capricorn: 78, Aquarius: 76, Pisces: 62
    };
    return strengths[sign] || 70;
  };

  const getEmotionalDepth = (moonSign: string): number => {
    const depths: Record<string, number> = {
      Cancer: 95, Pisces: 92, Scorpio: 90, Taurus: 75,
      Virgo: 70, Capricorn: 65, Leo: 72, Libra: 78,
      Aries: 60, Gemini: 68, Sagittarius: 65, Aquarius: 62
    };
    return depths[moonSign] || 70;
  };

  const sunSign = report.chartPlacements?.sun?.sign || report.sunSign || 'Leo';
  const moonSign = report.chartPlacements?.moon?.sign || 'Cancer';
  const mercurySign = report.chartPlacements?.mercury?.sign || sunSign;
  const venusSign = report.chartPlacements?.venus?.sign || sunSign;
  const marsSign = report.chartPlacements?.mars?.sign || sunSign;
  const lilithSign = report.chartPlacements?.lilith?.sign || sunSign;

  // Add some randomness but keep it consistent with the pet's name
  const nameHash = (report.petName || 'Pet').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const variance = (seed: number) => ((nameHash * seed) % 15) - 7;

  return {
    vitality: Math.min(99, Math.max(40, getSignStrength(sunSign) + variance(1))),
    empathy: Math.min(99, Math.max(40, getEmotionalDepth(moonSign) + variance(2))),
    curiosity: Math.min(99, Math.max(40, getSignStrength(mercurySign) + variance(3))),
    charm: Math.min(99, Math.max(40, getEmotionalDepth(venusSign) + variance(4))),
    energy: Math.min(99, Math.max(40, getSignStrength(marsSign) + variance(5))),
    mystery: Math.min(99, Math.max(40, (getSignStrength(lilithSign) + getEmotionalDepth(lilithSign)) / 2 + variance(6))),
  };
}

