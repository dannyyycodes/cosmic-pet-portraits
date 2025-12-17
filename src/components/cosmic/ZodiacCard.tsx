import { motion } from 'framer-motion';
import { Share2, Download } from 'lucide-react';
import { CosmicButton } from './CosmicButton';
import { useRef } from 'react';

interface ZodiacCardProps {
  petName: string;
  sunSign: string;
  archetype: string;
  element: string;
  coreEssence: string;
  species: string;
}

const zodiacEmojis: Record<string, string> = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓'
};

const elementColors: Record<string, string> = {
  'Fire': 'from-orange-500 via-red-500 to-yellow-500',
  'Earth': 'from-emerald-600 via-green-500 to-lime-400',
  'Air': 'from-sky-400 via-cyan-300 to-blue-300',
  'Water': 'from-blue-600 via-indigo-500 to-purple-500'
};

export function ZodiacCard({ petName, sunSign, archetype, element, coreEssence, species }: ZodiacCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const shareText = `✨ ${petName}'s Cosmic Portrait ✨\n\n${zodiacEmojis[sunSign] || '⭐'} ${sunSign} ${element}\n🌟 ${archetype}\n\n"${coreEssence}"\n\nDiscover your pet's cosmic destiny at Astro Paws!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${petName}'s Cosmic Portrait`,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative w-full max-w-sm mx-auto"
      initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, type: 'spring' }}
    >
      {/* Card container */}
      <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-accent/50 via-primary/30 to-accent/50">
        <div className="relative bg-card rounded-[22px] p-6 overflow-hidden">
          
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${elementColors[element] || 'from-purple-500 to-pink-500'} opacity-10`}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 10, repeat: Infinity }}
            />
            
            {/* Floating orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl"
              animate={{
                x: [0, 20, 0],
                y: [0, -10, 0]
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-accent/20 rounded-full blur-3xl"
              animate={{
                x: [0, -15, 0],
                y: [0, 15, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-4">
            {/* Zodiac symbol */}
            <motion.div
              className="text-6xl"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {zodiacEmojis[sunSign] || '⭐'}
            </motion.div>
            
            {/* Pet name */}
            <h2 className="text-2xl font-serif text-gradient-gold">{petName}</h2>
            
            {/* Sign & Element */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-primary/20 rounded-full text-primary">
                {sunSign}
              </span>
              <span className="px-3 py-1 bg-accent/20 rounded-full text-accent">
                {element}
              </span>
            </div>
            
            {/* Archetype */}
            <p className="text-lg font-serif text-foreground/90">{archetype}</p>
            
            {/* Divider */}
            <div className="w-16 h-0.5 mx-auto bg-gradient-to-r from-transparent via-accent to-transparent" />
            
            {/* Core essence */}
            <p className="text-sm text-muted-foreground italic leading-relaxed px-2">
              "{coreEssence}"
            </p>
            
            {/* Stars decoration */}
            <div className="flex justify-center gap-1 pt-2">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  className="text-accent text-xs"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                >
                  ✦
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Share buttons */}
      <motion.div
        className="flex justify-center gap-3 mt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <CosmicButton variant="secondary" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4" />
          Share
        </CosmicButton>
      </motion.div>
    </motion.div>
  );
}
