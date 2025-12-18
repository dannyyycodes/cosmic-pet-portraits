import { motion } from 'framer-motion';
import { Share2, Download, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface SocialShareCardProps {
  petName: string;
  sunSign: string;
  moonSign: string;
  element: string;
  archetype: string;
  luckyNumber?: string;
}

const elementGradients: Record<string, string> = {
  Fire: 'from-orange-500 via-red-500 to-rose-600',
  Earth: 'from-emerald-500 via-green-600 to-teal-600',
  Air: 'from-sky-400 via-blue-500 to-indigo-600',
  Water: 'from-blue-400 via-purple-500 to-violet-600',
};

const zodiacEmojis: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

export function SocialShareCard({ petName, sunSign, moonSign, element, archetype, luckyNumber }: SocialShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const gradient = elementGradients[element] || elementGradients.Water;
  const sunEmoji = zodiacEmojis[sunSign] || '✨';
  const moonEmoji = zodiacEmojis[moonSign] || '☽';

  const downloadAsImage = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `${petName.toLowerCase().replace(/\s+/g, '-')}-cosmic-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Card saved! Ready to share ✨');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToTwitter = () => {
    const text = `✨ ${petName} is a ${sunSign} Sun with ${element} energy! Their cosmic archetype: ${archetype} 🐾\n\nDiscover your pet's cosmic destiny at cosmicpaws.com`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyShareText = async () => {
    const text = `✨ ${petName}'s Cosmic Profile ✨\n\n☉ Sun: ${sunSign}\n☽ Moon: ${moonSign}\n✦ Element: ${element}\n👑 Archetype: ${archetype}\n\nDiscover your pet's cosmic destiny!`;
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      {/* The shareable card */}
      <div
        ref={cardRef}
        className={`relative w-80 h-80 rounded-2xl bg-gradient-to-br ${gradient} p-1 overflow-hidden`}
      >
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="relative w-full h-full bg-black/60 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center text-center">
          {/* Decorative border */}
          <div className="absolute inset-2 border border-white/20 rounded-lg pointer-events-none" />
          
          {/* Title */}
          <p className="text-white/60 text-xs uppercase tracking-[0.3em] mb-2">Cosmic Pet Profile</p>
          
          {/* Pet Name */}
          <h2 className="text-3xl font-bold text-white mb-1">{petName}</h2>
          
          {/* Archetype */}
          <p className="text-primary text-sm font-medium mb-6">{archetype}</p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-2xl mb-1">{sunEmoji}</p>
              <p className="text-white/60 text-xs">Sun Sign</p>
              <p className="text-white font-semibold">{sunSign}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-2xl mb-1">{moonEmoji}</p>
              <p className="text-white/60 text-xs">Moon Sign</p>
              <p className="text-white font-semibold">{moonSign}</p>
            </div>
          </div>
          
          {/* Element Badge */}
          <div className="mt-4 px-4 py-2 bg-white/10 rounded-full">
            <span className="text-white text-sm">✦ {element} Dominant</span>
          </div>
          
          {/* Watermark */}
          <p className="absolute bottom-3 text-white/30 text-xs">cosmicpaws.com</p>
        </div>
      </div>

      {/* Share Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          onClick={downloadAsImage}
          disabled={isGenerating}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {isGenerating ? 'Saving...' : 'Save Image'}
        </Button>
        <Button
          onClick={shareToTwitter}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Twitter className="w-4 h-4" />
          Share
        </Button>
        <Button
          onClick={copyShareText}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Copy Text
        </Button>
      </div>
    </div>
  );
}
