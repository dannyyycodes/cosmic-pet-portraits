import { motion } from 'framer-motion';
import { Star, Heart, Zap, Shield, Sparkles, Download, Share2, Check, PartyPopper, Flame, Crown, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { OccasionMode } from '@/lib/occasionMode';
import { StoryCardExport } from './StoryCardExport';

interface CardStats {
  vitality: number;
  empathy: number;
  curiosity: number;
  charm: number;
  energy: number;
  mystery: number;
}

interface ViralPetCardProps {
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

// Occasion-based themes
const occasionThemes: Record<OccasionMode, {
  gradient: { from: string; to: string; glow: string };
  badge: string;
  tagline: (name: string) => string;
  viralCta: string;
  hashtags: string[];
  viralPhrases: string[];
  border: string;
}> = {
  discover: {
    gradient: { from: '#8b5cf6', to: '#ec4899', glow: 'rgba(139, 92, 246, 0.5)' },
    badge: '✨ COSMIC REVEAL ✨',
    tagline: (name) => `${name}'s True Cosmic Identity`,
    viralCta: '🔥 Who has the highest cosmic power?',
    hashtags: ['#CosmicPets', '#PetAstrology', '#FurBaby'],
    viralPhrases: [
      'Main character energy: ACTIVATED',
      'This pet understood the assignment',
      'Tell me this isn\'t the most iconic pet',
      'POV: Your pet is spiritually superior',
    ],
    border: 'from-violet-500 via-fuchsia-500 to-pink-500',
  },
  birthday: {
    gradient: { from: '#f59e0b', to: '#ef4444', glow: 'rgba(245, 158, 11, 0.6)' },
    badge: '🎂 BIRTHDAY LEGEND 🎂',
    tagline: (name) => `${name} is Having a MOMENT`,
    viralCta: '🎉 Drop a 🎂 for this birthday icon!',
    hashtags: ['#PetBirthday', '#BirthdayBoy', '#BirthdayGirl', '#TreatDay'],
    viralPhrases: [
      'It\'s giving birthday royalty',
      'Another year of being iconic',
      'The protagonist of today',
      'Main event energy fr fr',
      'Born to slay, aging gracefully',
    ],
    border: 'from-amber-400 via-orange-500 to-red-500',
  },
  memorial: {
    gradient: { from: '#6366f1', to: '#0ea5e9', glow: 'rgba(99, 102, 241, 0.4)' },
    badge: '🌟 FOREVER IN THE STARS 🌟',
    tagline: (name) => `${name}'s Eternal Light`,
    viralCta: '💫 Share to keep their light shining',
    hashtags: ['#RainbowBridge', '#ForeverLoved', '#PetMemorial', '#GoodestAngel'],
    viralPhrases: [
      'Some souls are too beautiful for just one lifetime',
      'Now watching over us from the stars',
      'The best friend we were blessed to know',
      'Forever our guardian angel',
      'The pawprints they left on our hearts are eternal',
    ],
    border: 'from-indigo-400 via-blue-400 to-cyan-400',
  },
  gift: {
    gradient: { from: '#10b981', to: '#8b5cf6', glow: 'rgba(16, 185, 129, 0.5)' },
    badge: '🎁 COSMIC GIFT 🎁',
    tagline: (name) => `A Gift for ${name}'s Human`,
    viralCta: '✨ Tag someone who needs this for their pet!',
    hashtags: ['#PetGift', '#BestGiftEver', '#PetParent', '#CosmicPets'],
    viralPhrases: [
      'The gift that hits different',
      'When you get your pet the gift they deserve',
      'Peak gift-giving behavior',
      'POV: You\'re the best pet parent ever',
    ],
    border: 'from-emerald-400 via-teal-400 to-violet-500',
  },
};

const elementGradients: Record<string, { from: string; to: string; glow: string }> = {
  Fire: { from: '#f97316', to: '#eab308', glow: 'rgba(249, 115, 22, 0.5)' },
  Earth: { from: '#22c55e', to: '#84cc16', glow: 'rgba(34, 197, 94, 0.5)' },
  Air: { from: '#3b82f6', to: '#a855f7', glow: 'rgba(59, 130, 246, 0.5)' },
  Water: { from: '#06b6d4', to: '#8b5cf6', glow: 'rgba(6, 182, 212, 0.5)' },
};

// Funny/engaging captions based on stats
const getViralCaption = (stats: CardStats, occasionMode: OccasionMode, petName: string): string => {
  const theme = occasionThemes[occasionMode];
  const randomPhrase = theme.viralPhrases[Math.floor(Math.random() * theme.viralPhrases.length)];
  
  if (occasionMode === 'memorial') {
    return randomPhrase;
  }
  
  // Fun stat-based captions for other occasions
  const highestStat = Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b);
  const statCaptions: Record<string, string[]> = {
    vitality: [`${petName} woke up and chose violence (energy)`, `Certified zoomies professional`],
    empathy: [`The emotional support we all need`, `Will sense your sadness from 3 rooms away`],
    curiosity: [`${petName}: "What's that?" (x500 daily)`, `Professional investigator of sounds`],
    charm: [`Could commit crimes and get away with it`, `The face that launched 1000 treats`],
    energy: [`Running on pure chaos energy`, `Battery: 100% ALWAYS`],
    mystery: [`Keeper of forbidden knowledge`, `Knows things. Won't tell.`],
  };
  
  const statCaption = statCaptions[highestStat[0]]?.[Math.floor(Math.random() * 2)] || randomPhrase;
  
  return occasionMode === 'birthday' 
    ? `🎂 ${petName} is ${Math.floor(Math.random() * 8) + 1} and still the main character 🎂`
    : statCaption;
};

const StatBar = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Star; color: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon className="w-3 h-3" style={{ color }} />
    <span className="text-[9px] uppercase tracking-wider text-white/60 w-12">{label}</span>
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
      />
    </div>
    <span className="text-[10px] font-bold text-white w-5 text-right">{value}</span>
  </div>
);

export function ViralPetCard({
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
}: ViralPetCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [viralCaption] = useState(() => getViralCaption(stats, occasionMode, petName));

  const theme = occasionThemes[occasionMode];
  const colors = occasionMode === 'memorial' || occasionMode === 'birthday' 
    ? theme.gradient 
    : elementGradients[element] || elementGradients.Fire;
  
  const totalPower = Math.round((stats.vitality + stats.empathy + stats.curiosity + stats.charm + stats.energy + stats.mystery) / 6);

  // Pre-generate card image for faster sharing
  useEffect(() => {
    const generateCardImage = async () => {
      if (!cardRef.current) return;
      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#0a0a1f',
          scale: 2,
          useCORS: true,
          logging: false,
        });
        setCardImage(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Error pre-generating card:', err);
      }
    };
    
    const timer = setTimeout(generateCardImage, 1000);
    return () => clearTimeout(timer);
  }, [petName, stats, petPortraitUrl, occasionMode]);

  const handleDownload = async (format: 'square' | 'story' = 'square') => {
    setIsExporting(true);
    
    try {
      const targetRef = format === 'story' ? storyRef.current : cardRef.current;
      if (!targetRef) {
        throw new Error('Card element not found');
      }

      const canvas = await html2canvas(targetRef, {
        backgroundColor: '#0a0a1f',
        scale: 3, // High resolution for crisp output
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${petName.toLowerCase().replace(/\s+/g, '-')}-cosmic-${format === 'story' ? 'story' : 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success(
        format === 'story' 
          ? '📱 Story downloaded! Perfect for TikTok, Reels & Shorts' 
          : '✨ Card downloaded! Share it everywhere'
      );
    } catch (error) {
      console.error('Error exporting card:', error);
      toast.error('Failed to download. Try again!');
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    const hashtags = theme.hashtags.join(' ');
    
    if (occasionMode === 'memorial') {
      return `🌟 ${petName} - Forever in the Stars 🌟\n\n${viralCaption}\n\n${zodiacIcon} ${sunSign} • ☽ ${moonSign} Moon\n💫 Element: ${element}\n\n${hashtags}\n\n${shareUrl || 'astropets.cloud'}`;
    }
    
    if (occasionMode === 'birthday') {
      return `🎂 HAPPY BIRTHDAY ${petName.toUpperCase()}! 🎂\n\n${viralCaption}\n\n☉ ${sunSign} Sun • ☽ ${moonSign} Moon\n🔥 Cosmic Power: ${totalPower}/100\n\n${hashtags}\n\n${shareUrl || 'astropets.cloud'}`;
    }
    
    return `✨ ${viralCaption} ✨\n\nMeet ${petName}, ${archetype}\n☉ ${sunSign} • ☽ ${moonSign}\n🔥 Power Level: ${totalPower}\n\nGet your pet's cosmic card 👇\n${hashtags}\n\n${shareUrl || 'astropets.cloud'}`;
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'tiktok' | 'instagram' | 'native') => {
    const text = getShareText();
    const url = shareUrl || 'https://astropets.cloud';
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'tiktok' || platform === 'instagram') {
      await handleDownload('story');
      toast.info(`Card downloaded! Open ${platform === 'tiktok' ? 'TikTok' : 'Instagram'} and share from your gallery 📱`, {
        duration: 5000,
        action: {
          label: 'Copy Caption',
          onClick: () => {
            navigator.clipboard.writeText(text);
            toast.success('Caption copied!');
          }
        }
      });
    } else if (platform === 'native') {
      if (navigator.share) {
        try {
          const shareData: ShareData = {
            title: occasionMode === 'memorial' 
              ? `${petName}'s Memorial` 
              : occasionMode === 'birthday' 
                ? `${petName}'s Birthday Card` 
                : `${petName}'s Cosmic Card`,
            text: text,
            url: url,
          };
          
          if (cardImage && navigator.canShare) {
            const response = await fetch(cardImage);
            const blob = await response.blob();
            const file = new File([blob], `${petName}-cosmic-card.png`, { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
              shareData.files = [file];
            }
          }
          
          await navigator.share(shareData);
          toast.success('Shared successfully!');
        } catch (error) {
          if ((error as Error).name !== 'AbortError') {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Caption copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
          }
        }
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Caption copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const isMemorial = occasionMode === 'memorial';
  const isBirthday = occasionMode === 'birthday';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hidden Story Card for 9:16 export - positioned off-screen */}
      <div className="fixed -left-[9999px] -top-[9999px]" aria-hidden="true">
        <StoryCardExport
          ref={storyRef}
          petName={petName}
          archetype={archetype}
          sunSign={sunSign}
          moonSign={moonSign}
          element={element}
          zodiacIcon={zodiacIcon}
          stats={stats}
          auraColor={auraColor}
          petPortraitUrl={petPortraitUrl}
          occasionMode={occasionMode}
          viralCaption={viralCaption}
        />
      </div>
      
      {/* The Card - Optimized for Social (works as 1:1 for feed posts) */}
      <motion.div
        ref={cardRef}
        initial={{ scale: 0.9, opacity: 0, rotateY: -10 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="relative w-80 rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          padding: '3px',
          boxShadow: `0 0 60px ${colors.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Animated sparkle overlay for birthday */}
        {isBirthday && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  y: [-10, -30],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                style={{
                  left: `${15 + i * 15}%`,
                  top: '10%',
                }}
              >
                {['🎉', '✨', '🎂', '🎈', '⭐', '🎊'][i]}
              </motion.div>
            ))}
          </div>
        )}

        {/* Inner card */}
        <div className="relative rounded-xl bg-slate-900 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
            {isMemorial && (
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 to-transparent"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            )}
          </div>

          {/* Occasion Badge */}
          <div 
            className={`text-center py-2 text-xs font-bold tracking-widest bg-gradient-to-r ${theme.border}`}
            style={{ color: 'white' }}
          >
            {theme.badge}
          </div>

          {/* Top bar with zodiac and power */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/40">
            <div className="flex items-center gap-2">
              <motion.span 
                className="text-3xl"
                animate={isBirthday ? { 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 0.5, repeat: isBirthday ? Infinity : 0, repeatDelay: 2 }}
              >
                {zodiacIcon}
              </motion.span>
              <div>
                <span className="text-sm font-bold text-white">{sunSign}</span>
                <span className="text-[10px] text-white/50 ml-1">SUN</span>
              </div>
            </div>
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{ 
                background: `linear-gradient(135deg, ${colors.from}30, ${colors.to}30)`,
                borderColor: `${colors.from}50`,
              }}
              animate={isBirthday ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {isBirthday ? (
                <PartyPopper className="w-4 h-4 text-amber-400" />
              ) : isMemorial ? (
                <Star className="w-4 h-4 text-indigo-300" />
              ) : (
                <Flame className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-sm font-black text-white">{totalPower}</span>
            </motion.div>
          </div>

          {/* Portrait area */}
          <div className="relative mx-3 mt-2 h-48 rounded-xl overflow-hidden border-2 border-white/20">
            {petPortraitUrl ? (
              <img 
                src={petPortraitUrl} 
                alt={petName}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div 
                className="flex items-center justify-center h-full text-7xl"
                style={{ 
                  background: `radial-gradient(circle at center, ${auraColor}40, ${auraColor}10, transparent)`,
                }}
              >
                {zodiacIcon}
              </div>
            )}
            
            {/* Occasion-specific overlays */}
            {isMemorial && (
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-transparent to-transparent" />
            )}
            {isBirthday && (
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent to-transparent" />
            )}
            
            {/* Element badge */}
            <div 
              className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-bold backdrop-blur-md"
              style={{ backgroundColor: `${colors.from}cc` }}
            >
              {element === 'Fire' ? '🔥' : element === 'Earth' ? '🌿' : element === 'Air' ? '💨' : '💧'}
              {element}
            </div>

            {/* Crown for high power */}
            {totalPower >= 75 && !isMemorial && (
              <motion.div 
                className="absolute top-2 left-2"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-8 h-8 text-amber-400 drop-shadow-lg" />
              </motion.div>
            )}

            {/* Halo for memorial */}
            {isMemorial && (
              <motion.div 
                className="absolute top-2 left-1/2 -translate-x-1/2"
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1, 0.95] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-3xl">👼</span>
              </motion.div>
            )}
          </div>

          {/* Name and tagline */}
          <div className="px-4 pt-4 pb-2 text-center">
            <motion.h2 
              className="text-2xl font-black text-white tracking-wide"
              animate={isBirthday ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {petName}
            </motion.h2>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60 mt-1">{archetype}</p>
          </div>

          {/* Viral Caption */}
          <div className="mx-4 mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-white/90 text-center font-medium italic">
              "{viralCaption}"
            </p>
          </div>

          {/* Moon sign */}
          <div className="flex justify-center mb-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
              <span className="text-lg">☽</span> {moonSign} Moon
            </div>
          </div>

          {/* Stats Grid */}
          <div className="px-4 pb-4 space-y-1.5">
            <StatBar label="Vitality" value={stats.vitality} icon={Zap} color="#facc15" />
            <StatBar label="Empathy" value={stats.empathy} icon={Heart} color="#f472b6" />
            <StatBar label="Curiosity" value={stats.curiosity} icon={Star} color="#38bdf8" />
            <StatBar label="Charm" value={stats.charm} icon={Sparkles} color="#c084fc" />
            <StatBar label="Energy" value={stats.energy} icon={Zap} color="#fb923c" />
            <StatBar label="Mystery" value={stats.mystery} icon={Shield} color="#818cf8" />
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-black/40 flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/50">astropets.cloud</span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-white/40" />
              <span className="text-[10px] font-medium text-white/50">
                {isMemorial ? 'Forever Loved' : isBirthday ? 'Birthday Legend' : 'Cosmic Pet Card'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share Actions - Optimized for Viral Sharing */}
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        {/* Primary Share Button */}
        <Button
          onClick={() => handleShare('native')}
          className={`w-full gap-2 text-white font-bold text-lg py-6 ${
            isMemorial 
              ? 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600' 
              : isBirthday
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                : 'bg-gradient-to-r from-nebula-pink to-nebula-purple hover:opacity-90'
          }`}
          size="lg"
        >
          {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          {copied ? 'Caption Copied!' : isMemorial ? 'Share Their Light' : 'Share This Card'}
        </Button>

        {/* Platform Buttons - TikTok First! */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('tiktok')}
            className="flex-col gap-1 h-auto py-3 border-gray-600 hover:bg-gray-800 hover:border-gray-500"
          >
            <Music className="w-5 h-5 text-white" />
            <span className="text-[10px] text-gray-400">TikTok</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('instagram')}
            className="flex-col gap-1 h-auto py-3 border-pink-500/30 hover:bg-pink-500/10 hover:border-pink-500/50"
          >
            <span className="text-lg">📸</span>
            <span className="text-[10px] text-pink-400">Reels</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('twitter')}
            className="flex-col gap-1 h-auto py-3 border-sky-500/30 hover:bg-sky-500/10 hover:border-sky-500/50"
          >
            <span className="text-lg">𝕏</span>
            <span className="text-[10px] text-sky-400">Post</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('facebook')}
            className="flex-col gap-1 h-auto py-3 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
          >
            <span className="text-lg">📘</span>
            <span className="text-[10px] text-blue-400">Share</span>
          </Button>
        </div>

        {/* Download Options */}
        <div className="flex gap-2 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload('square')}
            disabled={isExporting}
            className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4" />
            Feed Post
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDownload('story')}
            disabled={isExporting}
            className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4" />
            Story/Reel
          </Button>
        </div>

        {/* Viral CTA */}
        <div className="text-center space-y-2 pt-2">
          <p className="text-sm font-bold text-foreground">
            {theme.viralCta}
          </p>
          <p className="text-xs text-muted-foreground">
            {theme.hashtags.slice(0, 3).join(' • ')}
          </p>
        </div>
      </div>
    </div>
  );
}

// Export the stats calculator
export { calculateCardStats } from './CosmicPetCard';
