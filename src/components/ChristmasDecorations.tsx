import { motion } from 'framer-motion';

export function ChristmasDecorations() {
  return (
    <>
      {/* Christmas Tree - Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="fixed left-0 bottom-0 z-10 pointer-events-none hidden lg:block"
      >
        <div className="relative">
          {/* Tree */}
          <svg width="180" height="280" viewBox="0 0 180 280" className="opacity-80">
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
            <circle cx="55" cy="195" r="5" fill="#32CD32" />
            <circle cx="125" cy="195" r="6" fill="#FF0000" />
            {/* Lights garland */}
            <circle cx="50" cy="110" r="3" fill="#FFFF00" className="animate-pulse" />
            <circle cx="130" cy="115" r="3" fill="#FF00FF" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
            <circle cx="40" cy="165" r="3" fill="#00FF00" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
            <circle cx="140" cy="160" r="3" fill="#FFFF00" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
            
            <defs>
              <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#228B22" />
                <stop offset="100%" stopColor="#006400" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Presents under tree */}
          <div className="absolute bottom-10 left-12 flex gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-sm relative">
              <div className="absolute inset-x-0 top-1/2 h-1 bg-yellow-400 -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-1 bg-yellow-400 -translate-x-1/2" />
            </div>
            <div className="w-6 h-10 bg-blue-500 rounded-sm relative">
              <div className="absolute inset-x-0 top-1/2 h-1 bg-white -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-1 bg-white -translate-x-1/2" />
            </div>
            <div className="w-10 h-6 bg-green-600 rounded-sm relative">
              <div className="absolute inset-x-0 top-1/2 h-1 bg-red-400 -translate-y-1/2" />
              <div className="absolute inset-y-0 left-1/2 w-1 bg-red-400 -translate-x-1/2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Santa on Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="fixed right-4 bottom-4 z-10 pointer-events-none hidden lg:block"
      >
        <div className="text-6xl animate-bounce" style={{ animationDuration: '3s' }}>
          🎅
        </div>
      </motion.div>

      {/* Floating Christmas Elements */}
      <div className="fixed top-32 right-8 z-10 pointer-events-none hidden md:block">
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-4xl"
        >
          🎄
        </motion.div>
      </div>

      <div className="fixed top-48 left-8 z-10 pointer-events-none hidden md:block">
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="text-3xl"
        >
          🎁
        </motion.div>
      </div>

      <div className="fixed top-64 right-16 z-10 pointer-events-none hidden lg:block">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="text-3xl"
        >
          ❄️
        </motion.div>
      </div>

      {/* Holly decoration in corners */}
      <div className="fixed top-20 left-4 z-10 pointer-events-none hidden md:block opacity-70">
        <span className="text-2xl">🎄</span>
      </div>
      <div className="fixed top-20 right-4 z-10 pointer-events-none hidden md:block opacity-70">
        <span className="text-2xl">🎄</span>
      </div>

      {/* Candy canes */}
      <div className="fixed bottom-32 right-8 z-10 pointer-events-none hidden md:block">
        <motion.div
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-4xl"
        >
          🍬
        </motion.div>
      </div>
    </>
  );
}
