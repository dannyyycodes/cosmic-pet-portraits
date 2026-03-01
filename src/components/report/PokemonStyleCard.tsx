import { motion } from 'framer-motion';
import { Star, Heart, Zap, Shield, Sparkles, Download, Share2, Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { OccasionMode } from '@/lib/occasionMode';

interface CardStats {
  vitality: number;
  empathy: number;
  curiosity: number;
  charm: number;
  energy: number;
  mystery: number;
}

interface PokemonStyleCardProps {
  petName: string;
  archetype: string;
  sunSign: string;
  moonSign: string;
  element: string;
  zodiacIcon: string;
  stats: CardStats;
  auraColor: string;
  petPortraitUrl?: string;
  shareUrl?: string;
  occasionMode?: OccasionMode;
  species?: string;
}

// Cosmic card type colors based on element
const elementTypeColors: Record<string, { primary: string; secondary: string; text: string }> = {
  Fire: { primary: '#F97316', secondary: '#FED7AA', text: '#7C2D12' },
  Earth: { primary: '#22C55E', secondary: '#BBF7D0', text: '#14532D' },
  Air: { primary: '#A855F7', secondary: '#E9D5FF', text: '#581C87' },
  Water: { primary: '#0EA5E9', secondary: '#BAE6FD', text: '#0C4A6E' },
};

// Occasion-specific themes for cosmic collector cards
const occasionThemes: Record<OccasionMode, {
  cardType: string;
  specialAbility: string;
  abilityDescription: string;
  attackName: string;
  attackDescription: string;
  attackDamage: string;
  weaknessType: string;
  resistanceType: string;
  flavorText: string;
  holoType: 'rainbow' | 'gold' | 'silver' | 'prismatic';
  badge: string;
}> = {
  discover: {
    cardType: 'COSMIC',
    specialAbility: 'Celestial Bond',
    abilityDescription: 'Once per turn, you may look at the top card of your deck.',
    attackName: 'Zodiac Blast',
    attackDescription: 'This attack does 20 more damage for each Energy attached.',
    attackDamage: '80+',
    weaknessType: 'Dark',
    resistanceType: 'Psychic',
    flavorText: 'A mystical creature whose soul is written in the stars.',
    holoType: 'rainbow',
    badge: '✨ COSMIC RARE ✨',
  },
  birthday: {
    cardType: 'CELEBRATION',
    specialAbility: 'Party Mode',
    abilityDescription: 'All your Pokémon get +10 HP until your next turn!',
    attackName: 'Birthday Bash',
    attackDescription: 'Flip a coin. If heads, your opponent cannot attack next turn.',
    attackDamage: '100',
    weaknessType: 'Sleep',
    resistanceType: 'Sadness',
    flavorText: 'Born to party! This legendary creature only appears on special days.',
    holoType: 'gold',
    badge: '🎂 BIRTHDAY LEGEND 🎂',
  },
  memorial: {
    cardType: 'GUARDIAN',
    specialAbility: 'Eternal Watch',
    abilityDescription: 'This Pokémon cannot be knocked out. It remains as a guiding light.',
    attackName: 'Heavenly Embrace',
    attackDescription: 'Heal 30 damage from each of your Benched Pokémon.',
    attackDamage: '∞',
    weaknessType: 'None',
    resistanceType: 'All',
    flavorText: 'Forever in our hearts, watching over us from the stars above.',
    holoType: 'silver',
    badge: '👼 ETERNAL SPIRIT 👼',
  },
  gift: {
    cardType: 'GIFT',
    specialAbility: 'Surprise Package',
    abilityDescription: 'When you play this card, draw 3 cards!',
    attackName: 'Joy Burst',
    attackDescription: 'This attack does 30 damage times the number of friends you have.',
    attackDamage: '90',
    weaknessType: 'Boredom',
    resistanceType: 'Loneliness',
    flavorText: 'The perfect gift that keeps on giving. Spreads happiness wherever it goes.',
    holoType: 'prismatic',
    badge: '🎁 GIFT EDITION 🎁',
  },
};

// Generate fun/honourable moves based on stats
const generateMoves = (stats: CardStats, petName: string, occasionMode: OccasionMode) => {
  const theme = occasionThemes[occasionMode];
  const highestStat = Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  
  const statMoves: Record<string, { name: string; energyCost: number; damage: string; effect: string }> = {
    vitality: { name: 'Power Surge', energyCost: 2, damage: '60', effect: 'Heal 20 HP after attack' },
    empathy: { name: 'Heart Connection', energyCost: 1, damage: '30', effect: 'Draw a card' },
    curiosity: { name: 'Investigate', energyCost: 1, damage: '20', effect: 'Look at opponent\'s hand' },
    charm: { name: 'Dazzling Smile', energyCost: 2, damage: '50', effect: 'Opponent is confused' },
    energy: { name: 'Hyper Dash', energyCost: 3, damage: '90', effect: 'Can\'t attack next turn' },
    mystery: { name: 'Shadow Veil', energyCost: 2, damage: '40', effect: 'Become untargetable' },
  };

  return {
    ability: theme.specialAbility,
    abilityDesc: theme.abilityDescription,
    attack1: statMoves[highestStat],
    attack2: {
      name: theme.attackName,
      energyCost: 3,
      damage: theme.attackDamage,
      effect: theme.attackDescription,
    },
  };
};

export function PokemonStyleCard({
  petName,
  archetype,
  sunSign,
  moonSign,
  element,
  zodiacIcon,
  stats,
  auraColor,
  petPortraitUrl,
  shareUrl,
  occasionMode = 'discover',
  species = 'pet',
}: PokemonStyleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);

  const theme = occasionThemes[occasionMode];
  const colors = elementTypeColors[element] || elementTypeColors.Fire;
  const totalHP = Math.round(50 + (stats.vitality + stats.energy) * 0.5);
  const moves = generateMoves(stats, petName, occasionMode);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (!cardRef.current) throw new Error('Card element not found');
      
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${petName.toLowerCase().replace(/\s+/g, '-')}-cosmic-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Cosmic card downloaded! 🎴');
    } catch (error) {
      console.error('Error exporting card:', error);
      toast.error('Failed to download. Try again!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    const text = occasionMode === 'memorial'
      ? `👼 ${petName} - Guardian Angel Card 👼\n\n"${theme.flavorText}"\n\n🌟 HP: ∞ | Type: ${element}\n✨ Ability: ${moves.ability}\n\n#CosmicCard #ForeverLoved #RainbowBridge\n\n${shareUrl || 'littlesouls.co'}`
      : occasionMode === 'birthday'
        ? `🎂 ${petName}'s BIRTHDAY CARD! 🎂\n\n"${theme.flavorText}"\n\n💪 HP: ${totalHP} | Type: ${element}\n🎉 Special Move: ${moves.attack2.name}!\n\n#CosmicCard #PetBirthday #LegendaryPet\n\n${shareUrl || 'littlesouls.co'}`
        : `✨ Check out ${petName}'s Cosmic Card! ✨\n\n💪 HP: ${totalHP} | Type: ${element}\n⚡ ${moves.attack1.name}: ${moves.attack1.damage} DMG\n🔥 ${moves.attack2.name}: ${moves.attack2.damage} DMG\n\n#CosmicCard #CosmicPets #PetCard\n\n${shareUrl || 'littlesouls.co'}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${petName}'s Cosmic Card`, text, url: shareUrl || 'https://littlesouls.co' });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success('Caption copied!');
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Caption copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isMemorial = occasionMode === 'memorial';
  const isBirthday = occasionMode === 'birthday';

  // Holographic gradient based on mouse position
  const holoGradient = {
    rainbow: `linear-gradient(${135 + mousePosition.x * 90}deg, 
      rgba(255,0,0,0.3) 0%, 
      rgba(255,165,0,0.3) 14%, 
      rgba(255,255,0,0.3) 28%, 
      rgba(0,255,0,0.3) 42%, 
      rgba(0,255,255,0.3) 56%, 
      rgba(0,0,255,0.3) 70%, 
      rgba(238,130,238,0.3) 84%, 
      rgba(255,0,0,0.3) 100%)`,
    gold: `linear-gradient(${135 + mousePosition.x * 90}deg, 
      rgba(255,215,0,0.4) 0%, 
      rgba(255,255,200,0.5) 50%, 
      rgba(255,215,0,0.4) 100%)`,
    silver: `linear-gradient(${135 + mousePosition.x * 90}deg, 
      rgba(192,192,192,0.4) 0%, 
      rgba(255,255,255,0.6) 30%,
      rgba(220,220,255,0.5) 50%,
      rgba(255,255,255,0.6) 70%,
      rgba(192,192,192,0.4) 100%)`,
    prismatic: `linear-gradient(${135 + mousePosition.x * 90}deg, 
      rgba(255,100,100,0.3) 0%, 
      rgba(100,255,100,0.3) 33%, 
      rgba(100,100,255,0.3) 66%, 
      rgba(255,100,100,0.3) 100%)`,
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The Cosmic Collector Card */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        initial={{ scale: 0.9, opacity: 0, rotateY: -15 }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          rotateY: 0,
          rotateX: isHovering ? (mousePosition.y - 0.5) * -10 : 0,
          rotateZ: isHovering ? (mousePosition.x - 0.5) * 5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="relative w-80 rounded-xl overflow-hidden"
        style={{
          aspectRatio: '63/88',
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        {/* Card outer border with element color */}
        <div 
          className="absolute inset-0 rounded-xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            padding: '8px',
          }}
        >
          {/* Holographic overlay */}
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-30 opacity-60"
            style={{
              background: holoGradient[theme.holoType],
              mixBlendMode: 'overlay',
            }}
            animate={{
              opacity: isHovering ? 0.8 : 0.4,
            }}
          />

          {/* Sparkle effects for holo */}
          {isHovering && (
            <div className="absolute inset-0 pointer-events-none z-40">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          )}

          {/* Inner card content */}
          <div 
            className="relative rounded-lg overflow-hidden h-full"
            style={{ backgroundColor: colors.secondary }}
          >
            {/* Stage/Type badge */}
            <div className="flex justify-between items-start p-2">
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                {theme.cardType} {zodiacIcon}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: colors.text }}>HP</span>
                <span className="text-2xl font-black" style={{ color: colors.text }}>
                  {isMemorial ? '∞' : totalHP}
                </span>
                <span className="text-xl">{element === 'Fire' ? '🔥' : element === 'Earth' ? '🌿' : element === 'Air' ? '💨' : '💧'}</span>
              </div>
            </div>

            {/* Pokemon Name */}
            <div className="px-3 -mt-1">
              <h2 
                className="text-xl font-black tracking-tight"
                style={{ color: colors.text }}
              >
                {petName}
              </h2>
              <p className="text-[9px] uppercase tracking-wider opacity-70" style={{ color: colors.text }}>
                {archetype} • {sunSign} Sun
              </p>
            </div>

            {/* Portrait Frame */}
            <div className="mx-3 mt-2 relative">
              <div 
                className="rounded-lg overflow-hidden border-4"
                style={{ 
                  borderColor: colors.primary,
                  boxShadow: `inset 0 0 20px ${colors.primary}40`,
                }}
              >
                <div className="h-32 relative overflow-hidden">
                  {petPortraitUrl ? (
                    <img 
                      src={petPortraitUrl} 
                      alt={petName}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-6xl"
                      style={{ 
                        background: `radial-gradient(circle, ${colors.primary}40, ${colors.secondary})`,
                      }}
                    >
                      {zodiacIcon}
                    </div>
                  )}
                  
                  {/* Occasion overlay effects */}
                  {isMemorial && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent"
                      animate={{ opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  )}
                  {isBirthday && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent" />
                      {[...Array(5)].map((_, i) => (
                        <motion.span
                          key={i}
                          className="absolute text-lg"
                          style={{ left: `${10 + i * 20}%`, top: '10%' }}
                          animate={{ 
                            y: [-5, 10, -5],
                            opacity: [0, 1, 0],
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        >
                          {['🎉', '✨', '🎂', '🎈', '⭐'][i]}
                        </motion.span>
                      ))}
                    </>
                  )}

                  {/* Crown for high power */}
                  {totalHP >= 80 && !isMemorial && (
                    <motion.div 
                      className="absolute top-1 left-1"
                      animate={{ rotate: [-5, 5, -5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="w-6 h-6 text-amber-400 drop-shadow-lg" />
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Sub info under portrait */}
              <div 
                className="text-[8px] text-center py-1 font-medium"
                style={{ color: colors.text }}
              >
                {species.charAt(0).toUpperCase() + species.slice(1)} Pokémon • HT: Mystical • WT: Cosmic
              </div>
            </div>

            {/* Ability */}
            <div className="mx-3 mt-1 p-2 rounded bg-white/50 border" style={{ borderColor: colors.primary }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span 
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  ABILITY
                </span>
                <span className="text-[10px] font-bold" style={{ color: colors.text }}>{moves.ability}</span>
              </div>
              <p className="text-[8px] leading-tight" style={{ color: colors.text }}>
                {moves.abilityDesc}
              </p>
            </div>

            {/* Attacks */}
            <div className="mx-3 mt-1.5 space-y-1">
              {/* Attack 1 */}
              <div className="flex items-center gap-2 p-1.5 rounded bg-white/30">
                <div className="flex gap-0.5">
                  {[...Array(moves.attack1.energyCost)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px]"
                      style={{ borderColor: colors.primary, backgroundColor: colors.primary + '40' }}
                    >
                      ⚡
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold flex-1" style={{ color: colors.text }}>
                  {moves.attack1.name}
                </span>
                <span className="text-sm font-black" style={{ color: colors.text }}>{moves.attack1.damage}</span>
              </div>
              
              {/* Attack 2 (Signature) */}
              <div className="flex items-center gap-2 p-1.5 rounded bg-white/30">
                <div className="flex gap-0.5">
                  {[...Array(moves.attack2.energyCost)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px]"
                      style={{ borderColor: colors.primary, backgroundColor: colors.primary + '40' }}
                    >
                      ⚡
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold block" style={{ color: colors.text }}>
                    {moves.attack2.name}
                  </span>
                  <span className="text-[7px] opacity-70" style={{ color: colors.text }}>
                    {moves.attack2.effect}
                  </span>
                </div>
                <span className="text-sm font-black" style={{ color: colors.text }}>{moves.attack2.damage}</span>
              </div>
            </div>

            {/* Weakness / Resistance / Retreat */}
            <div className="mx-3 mt-2 flex justify-between text-[8px]" style={{ color: colors.text }}>
              <div className="text-center">
                <div className="font-bold mb-0.5">weakness</div>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="w-4 h-4 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px]">🌙</span>
                  <span className="font-bold">×2</span>
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold mb-0.5">resistance</div>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">🔮</span>
                  <span className="font-bold">-30</span>
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold mb-0.5">retreat cost</div>
                <div className="flex gap-0.5 justify-center">
                  {[...Array(Math.min(3, Math.ceil(stats.energy / 30)))].map((_, i) => (
                    <div 
                      key={i}
                      className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Flavor Text */}
            <div className="mx-3 mt-2 p-2 border-t" style={{ borderColor: colors.text + '30' }}>
              <p className="text-[7px] italic text-center leading-tight" style={{ color: colors.text }}>
                "{theme.flavorText}"
              </p>
            </div>

            {/* Footer */}
            <div 
              className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-3 py-1 text-[6px]"
              style={{ backgroundColor: colors.primary + '20', color: colors.text }}
            >
              <span>Illus. Little Souls AI</span>
              <span className="font-bold">{theme.badge}</span>
              <span>littlesouls.co</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share Actions */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleShare}
            className="flex-1 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Share Card'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          ✨ Hover over the card to see holographic effects!
        </p>
      </div>
    </div>
  );
}

export { calculateCardStats } from './CosmicPetCard';
