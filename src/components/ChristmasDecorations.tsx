import { motion } from 'framer-motion';

export function ChristmasDecorations() {
  return (
    // Festive footer strip - consolidated festive elements in one clean area
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
    >
      <div className="flex justify-center items-center gap-3 sm:gap-6 py-2 sm:py-3 bg-gradient-to-r from-red-500/20 via-green-500/15 to-red-500/20 backdrop-blur-sm border-t border-red-500/20">
        <motion.span 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-lg sm:text-xl"
        >
          🎄
        </motion.span>
        <span className="text-xs sm:text-sm text-foreground/80 font-medium">
          Holiday Magic in Every Reading
        </span>
        <motion.span 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-lg sm:text-xl"
        >
          🎁
        </motion.span>
        <span className="hidden sm:inline text-xs sm:text-sm text-foreground/60">
          Free gift wrapping
        </span>
        <motion.span 
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="text-lg sm:text-xl"
        >
          🎅
        </motion.span>
      </div>
    </motion.div>
  );
}
