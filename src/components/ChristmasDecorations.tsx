import { motion } from 'framer-motion';

export function ChristmasDecorations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
    >
      {/* Festive Christmas lights along the top edge */}
      <div className="absolute -top-3 left-0 right-0 flex justify-center gap-4 sm:gap-6">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-3 rounded-full"
            style={{
              backgroundColor: i % 3 === 0 ? 'hsl(0 75% 50%)' : i % 3 === 1 ? 'hsl(145 70% 40%)' : 'hsl(45 90% 55%)',
              boxShadow: i % 3 === 0 
                ? '0 0 8px hsl(0 75% 50%), 0 0 16px hsl(0 75% 50% / 0.5)' 
                : i % 3 === 1 
                ? '0 0 8px hsl(145 70% 40%), 0 0 16px hsl(145 70% 40% / 0.5)' 
                : '0 0 8px hsl(45 90% 55%), 0 0 16px hsl(45 90% 55% / 0.5)',
            }}
            animate={{ 
              opacity: [0.6, 1, 0.6],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      
      {/* Main festive banner */}
      <div 
        className="flex justify-center items-center gap-3 sm:gap-6 py-2.5 sm:py-3 backdrop-blur-md border-t"
        style={{
          background: 'linear-gradient(90deg, hsl(0 75% 45% / 0.35) 0%, hsl(145 70% 35% / 0.3) 25%, hsl(45 90% 55% / 0.25) 50%, hsl(145 70% 35% / 0.3) 75%, hsl(0 75% 45% / 0.35) 100%)',
          borderColor: 'hsl(0 75% 50% / 0.4)',
        }}
      >
        <motion.span 
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-xl sm:text-2xl drop-shadow-lg"
        >
          🎄
        </motion.span>
        <span 
          className="text-xs sm:text-sm font-semibold tracking-wide"
          style={{ 
            background: 'linear-gradient(90deg, hsl(0 80% 60%), hsl(45 100% 65%), hsl(145 70% 50%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px hsl(45 90% 55% / 0.3)',
          }}
        >
          ✨ Holiday Magic in Every Reading ✨
        </span>
        <motion.span 
          animate={{ rotate: [0, 15, -15, 0], y: [0, -2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="text-xl sm:text-2xl drop-shadow-lg"
        >
          🎁
        </motion.span>
        <span 
          className="hidden sm:inline text-xs sm:text-sm font-medium"
          style={{ color: 'hsl(145 65% 55%)' }}
        >
          🎀 Free gift wrapping
        </span>
        <motion.span 
          animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: 0.3 }}
          className="text-xl sm:text-2xl drop-shadow-lg"
        >
          🎅
        </motion.span>
      </div>
    </motion.div>
  );
}
