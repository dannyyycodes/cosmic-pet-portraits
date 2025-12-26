import { motion } from 'framer-motion';
import mysticalDreamer from '@/assets/archetypes/mystical-dreamer-cat-v2.jpg';
import nobleGuardian from '@/assets/archetypes/noble-guardian-dog-v2.jpg';

export function CosmicCardShowcase() {
  return (
    <div className="relative w-full max-w-xs mx-auto h-48 mb-4">
      {/* Left card - Dog (rotated left, slightly behind) */}
      <motion.div
        initial={{ opacity: 0, x: -20, rotate: -15 }}
        animate={{ opacity: 1, x: 0, rotate: -12 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute left-4 top-2 w-32 h-44 rounded-xl overflow-hidden shadow-2xl shadow-nebula-purple/30 border-2 border-cosmic-gold/30 z-10"
        style={{ transformOrigin: 'bottom center' }}
      >
        <img 
          src={nobleGuardian} 
          alt="Noble Guardian Dog" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-2">
          <p className="text-[10px] font-bold text-cosmic-gold text-center">Noble Guardian</p>
        </div>
      </motion.div>

      {/* Right card - Cat (rotated right, in front) */}
      <motion.div
        initial={{ opacity: 0, x: 20, rotate: 15 }}
        animate={{ opacity: 1, x: 0, rotate: 8 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute right-4 top-0 w-32 h-44 rounded-xl overflow-hidden shadow-2xl shadow-nebula-pink/30 border-2 border-nebula-purple/50 z-20"
        style={{ transformOrigin: 'bottom center' }}
      >
        <img 
          src={mysticalDreamer} 
          alt="Mystical Dreamer Cat" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-2">
          <p className="text-[10px] font-bold text-nebula-purple text-center">Mystical Dreamer</p>
        </div>
      </motion.div>

      {/* Sparkle effect */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-radial from-cosmic-gold/20 to-transparent rounded-full blur-xl z-0"
      />
    </div>
  );
}
