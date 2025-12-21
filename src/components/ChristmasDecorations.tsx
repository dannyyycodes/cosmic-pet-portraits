import { motion } from 'framer-motion';

export function ChristmasDecorations() {
  return (
    <>
      {/* Christmas Tree - Left Side - Responsive */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed left-0 bottom-0 z-10 pointer-events-none"
      >
        <div className="relative">
          {/* Tree - smaller on mobile */}
          <svg 
            className="w-24 h-36 sm:w-32 sm:h-48 md:w-44 md:h-64 lg:w-[180px] lg:h-[280px] opacity-70 sm:opacity-80"
            viewBox="0 0 180 280"
          >
            {/* Tree layers */}
            <polygon points="90,20 30,100 150,100" fill="url(#treeGradient)" />
            <polygon points="90,60 20,150 160,150" fill="url(#treeGradient)" />
            <polygon points="90,100 10,210 170,210" fill="url(#treeGradient)" />
            {/* Trunk */}
            <rect x="70" y="210" width="40" height="40" fill="#8B4513" />
            {/* Star */}
            <polygon points="90,10 93,20 104,20 95,27 99,38 90,30 81,38 85,27 76,20 87,20" fill="#FFD700" className="animate-pulse" />
            {/* Ornaments */}
            <circle cx="60" cy="90" r="6" fill="#FF0000" />
            <circle cx="120" cy="85" r="5" fill="#FFD700" />
            <circle cx="45" cy="140" r="7" fill="#00BFFF" />
            <circle cx="135" cy="135" r="6" fill="#FF69B4" />
            <circle cx="70" cy="130" r="5" fill="#32CD32" />
            <circle cx="110" cy="145" r="6" fill="#FF0000" />
            <circle cx="35" cy="190" r="7" fill="#FFD700" />
            <circle cx="90" cy="185" r="6" fill="#00BFFF" />
            <circle cx="145" cy="180" r="7" fill="#FF69B4" />
            {/* Lights */}
            <circle cx="50" cy="110" r="3" fill="#FFFF00" className="animate-pulse" />
            <circle cx="130" cy="115" r="3" fill="#FF00FF" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
            <circle cx="40" cy="165" r="3" fill="#00FF00" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
            
            <defs>
              <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#228B22" />
                <stop offset="100%" stopColor="#006400" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Presents under tree - hidden on smallest screens */}
          <div className="absolute bottom-2 left-3 sm:bottom-4 sm:left-6 md:bottom-8 md:left-10 flex gap-1 sm:gap-2">
            <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-red-500 rounded-sm relative">
              <div className="absolute inset-x-0 top-1/2 h-0.5 sm:h-1 bg-yellow-400 -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-0.5 sm:w-1 bg-yellow-400 -translate-x-1/2" />
            </div>
            <div className="w-3 h-5 sm:w-5 sm:h-8 md:w-6 md:h-10 bg-blue-500 rounded-sm relative hidden sm:block">
              <div className="absolute inset-x-0 top-1/2 h-0.5 sm:h-1 bg-white -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-0.5 sm:w-1 bg-white -translate-x-1/2" />
            </div>
            <div className="w-5 h-3 sm:w-8 sm:h-5 md:w-10 md:h-6 bg-green-600 rounded-sm relative hidden md:block">
              <div className="absolute inset-x-0 top-1/2 h-1 bg-red-400 -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-1 bg-red-400 -translate-x-1/2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Santa on Right Side - Responsive */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="fixed right-2 sm:right-4 bottom-2 sm:bottom-4 z-10 pointer-events-none"
      >
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl animate-bounce" style={{ animationDuration: '3s' }}>
          🎅
        </div>
      </motion.div>

      {/* Corner decorations - smaller on mobile */}
      <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-10 pointer-events-none opacity-60 sm:opacity-70">
        <motion.div
          animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-xl sm:text-2xl md:text-3xl"
        >
          🎄
        </motion.div>
      </div>

      <div className="fixed top-28 sm:top-32 left-2 sm:left-4 z-10 pointer-events-none opacity-60 sm:opacity-70">
        <motion.div
          animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="text-xl sm:text-2xl md:text-3xl"
        >
          🎁
        </motion.div>
      </div>

      {/* Snowflake - desktop only for performance */}
      <div className="fixed top-48 right-12 z-10 pointer-events-none hidden md:block">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="text-2xl lg:text-3xl opacity-60"
        >
          ❄️
        </motion.div>
      </div>

      {/* Candy cane - tablet+ only */}
      <div className="fixed bottom-24 sm:bottom-32 right-4 sm:right-8 z-10 pointer-events-none hidden sm:block">
        <motion.div
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-2xl sm:text-3xl md:text-4xl opacity-70"
        >
          🍬
        </motion.div>
      </div>

      {/* Additional mobile-friendly decorations */}
      <div className="fixed top-40 right-3 z-10 pointer-events-none sm:hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-lg opacity-50"
        >
          ⭐
        </motion.div>
      </div>
    </>
  );
}
