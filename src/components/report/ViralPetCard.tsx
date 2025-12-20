import { motion } from 'framer-motion';
import { Star, Heart, Zap, Shield, Sparkles, Download, Twitter, Facebook, Instagram, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

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
}

const elementGradients: Record<string, { from: string; to: string; glow: string }> = {
  Fire: { from: '#f97316', to: '#eab308', glow: 'rgba(249, 115, 22, 0.5)' },
  Earth: { from: '#22c55e', to: '#84cc16', glow: 'rgba(34, 197, 94, 0.5)' },
  Air: { from: '#3b82f6', to: '#a855f7', glow: 'rgba(59, 130, 246, 0.5)' },
  Water: { from: '#06b6d4', to: '#8b5cf6', glow: 'rgba(6, 182, 212, 0.5)' },
};

const StatBar = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Star; color: string }) => (
  <div className="flex items-center gap-1.5">
    <Icon className="w-3 h-3" style={{ color }} />
    <span className="text-[9px] uppercase tracking-wider text-white/60 w-12">{label}</span>
    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
    <span className="text-[10px] font-bold text-white/80 w-5 text-right">{value}</span>
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
}: ViralPetCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);

  const colors = elementGradients[element] || elementGradients.Fire;
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
    
    // Generate after a short delay to ensure render
    const timer = setTimeout(generateCardImage, 1000);
    return () => clearTimeout(timer);
  }, [petName, stats, petPortraitUrl]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a1f',
        scale: 3, // High resolution
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${petName.toLowerCase().replace(/\s+/g, '-')}-cosmic-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Card downloaded! Share it everywhere ✨');
    } catch (error) {
      console.error('Error exporting card:', error);
      toast.error('Failed to download card');
    } finally {
      setIsExporting(false);
    }
  };

  const getShareText = () => {
    return `✨ Meet ${petName}, ${archetype}! ✨\n\n☉ ${sunSign} Sun • ☽ ${moonSign} Moon\n🔥 Element: ${element} | Power: ${totalPower}\n\nDiscover your pet's cosmic soul 🌟\n${shareUrl || 'https://astropets.cloud'}`;
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'instagram' | 'native') => {
    const text = getShareText();
    const url = shareUrl || 'https://astropets.cloud';
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'instagram') {
      // Instagram doesn't have direct sharing, so download and prompt
      await handleDownload();
      toast.info('Card downloaded! Open Instagram and share from your camera roll 📸');
    } else if (platform === 'native') {
      if (navigator.share) {
        try {
          const shareData: ShareData = {
            title: `${petName}'s Cosmic Card`,
            text: text,
            url: url,
          };
          
          // Try to share with image if available
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
            // Fallback to clipboard
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
          }
        }
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* The Card - Optimized for Social Media (1:1.4 aspect ratio like trading cards) */}
      <motion.div
        ref={cardRef}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="relative w-80 rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          padding: '3px',
          boxShadow: `0 0 40px ${colors.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Inner card */}
        <div className="relative rounded-xl bg-slate-900 overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
          </div>

          {/* Top bar with zodiac */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/40">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{zodiacIcon}</span>
              <div>
                <span className="text-xs font-bold text-white/90">{sunSign}</span>
                <span className="text-[10px] text-white/50 ml-1">SUN</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">{totalPower}</span>
            </div>
          </div>

          {/* Portrait area */}
          <div className="relative mx-3 mt-2 h-44 rounded-lg overflow-hidden border border-white/10">
            {petPortraitUrl ? (
              <img 
                src={petPortraitUrl} 
                alt={petName}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div 
                className="flex items-center justify-center h-full text-6xl"
                style={{ 
                  background: `radial-gradient(circle at center, ${auraColor}40, ${auraColor}10, transparent)`,
                }}
              >
                {zodiacIcon}
              </div>
            )}
            
            {/* Aura overlay */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{ 
                background: `radial-gradient(ellipse at bottom, ${colors.from}30, transparent 60%)`
              }}
            />
            
            {/* Element badge */}
            <div 
              className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-bold backdrop-blur-sm"
              style={{ backgroundColor: `${colors.from}90` }}
            >
              {element === 'Fire' ? '🔥' : element === 'Earth' ? '🌿' : element === 'Air' ? '💨' : '💧'}
              {element}
            </div>
          </div>

          {/* Name and archetype */}
          <div className="px-4 pt-3 pb-1 text-center">
            <h2 className="text-xl font-bold text-white tracking-wide">{petName}</h2>
            <p className="text-[11px] uppercase tracking-[0.15em] text-white/50">{archetype}</p>
          </div>

          {/* Moon sign badge */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px]">
              <span>☽</span> {moonSign} Moon
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 pb-3 space-y-1">
            <StatBar label="Vitality" value={stats.vitality} icon={Zap} color="#facc15" />
            <StatBar label="Empathy" value={stats.empathy} icon={Heart} color="#f472b6" />
            <StatBar label="Curiosity" value={stats.curiosity} icon={Star} color="#38bdf8" />
            <StatBar label="Charm" value={stats.charm} icon={Sparkles} color="#c084fc" />
            <StatBar label="Energy" value={stats.energy} icon={Zap} color="#fb923c" />
            <StatBar label="Mystery" value={stats.mystery} icon={Shield} color="#818cf8" />
          </div>

          {/* Footer with branding */}
          <div className="px-4 py-2 bg-black/30 flex items-center justify-between">
            <span className="text-[9px] text-white/40">astropets.cloud</span>
            <span className="text-[9px] text-white/40">✨ Cosmic Pet Report</span>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        {/* Primary Share Button */}
        <Button
          onClick={() => handleShare('native')}
          className="w-full gap-2 bg-gradient-to-r from-nebula-pink to-nebula-purple hover:opacity-90"
          size="lg"
        >
          {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Share My Card'}
        </Button>

        {/* Social Platform Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('twitter')}
            className="gap-2 border-sky-500/30 hover:bg-sky-500/10 hover:border-sky-500/50"
          >
            <Twitter className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Twitter</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('facebook')}
            className="gap-2 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
          >
            <Facebook className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Facebook</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('instagram')}
            className="gap-2 border-pink-500/30 hover:bg-pink-500/10 hover:border-pink-500/50"
          >
            <Instagram className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Instagram</span>
          </Button>
        </div>

        {/* Download Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={isExporting}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting...' : 'Download HD Image'}
        </Button>
      </div>

      {/* Viral CTA */}
      <div className="text-center space-y-2 max-w-xs">
        <p className="text-sm font-medium text-foreground">
          🔥 Challenge your friends!
        </p>
        <p className="text-xs text-muted-foreground">
          Whose pet has the highest cosmic power? Share and compare stats with #CosmicPets
        </p>
      </div>
    </div>
  );
}

// Export the stats calculator
export { calculateCardStats } from './CosmicPetCard';
