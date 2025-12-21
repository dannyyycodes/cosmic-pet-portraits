import { motion } from "framer-motion";

const festivePets = [
  {
    emoji: "🐕",
    accessory: "🎅",
    position: { left: "5%", bottom: "10%" },
    delay: 0,
  },
  {
    emoji: "🐈",
    accessory: "🎄",
    position: { right: "8%", bottom: "15%" },
    delay: 0.3,
  },
  {
    emoji: "🐰",
    accessory: "🎁",
    position: { left: "12%", bottom: "25%" },
    delay: 0.6,
  },
  {
    emoji: "🐹",
    accessory: "⭐",
    position: { right: "15%", bottom: "8%" },
    delay: 0.9,
  },
  {
    emoji: "🦜",
    accessory: "🔔",
    position: { left: "3%", bottom: "40%" },
    delay: 1.2,
  },
  {
    emoji: "🐕‍🦺",
    accessory: "🎀",
    position: { right: "5%", bottom: "35%" },
    delay: 1.5,
  },
];

export const FestivePets = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {festivePets.map((pet, index) => (
        <motion.div
          key={index}
          className="absolute flex flex-col items-center"
          style={pet.position}
          initial={{ opacity: 0, y: 50, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
          }}
          transition={{ 
            delay: pet.delay,
            duration: 0.8,
            ease: "easeOut"
          }}
        >
          {/* Accessory floating above */}
          <motion.span
            className="text-xl md:text-2xl"
            animate={{ 
              y: [-5, 5, -5],
              rotate: [-5, 5, -5]
            }}
            transition={{ 
              duration: 2 + Math.random(),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {pet.accessory}
          </motion.span>
          
          {/* Pet emoji */}
          <motion.span
            className="text-4xl md:text-5xl lg:text-6xl drop-shadow-lg"
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ 
              duration: 3 + Math.random(),
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 0.5
            }}
          >
            {pet.emoji}
          </motion.span>
          
          {/* Festive glow underneath */}
          <motion.div
            className="absolute -bottom-2 w-12 h-3 rounded-full bg-gradient-to-r from-red-500/30 via-green-500/30 to-red-500/30 blur-sm"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [0.9, 1.1, 0.9]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      ))}
      
      {/* Extra floating ornaments */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`ornament-${i}`}
          className="absolute text-2xl md:text-3xl"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.4, 0.8, 0.4],
            scale: [0.8, 1, 0.8],
            y: [0, -20, 0],
            rotate: [-10, 10, -10]
          }}
          transition={{
            delay: 0.5 + i * 0.2,
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {["🐾", "❄️", "✨", "🦴", "🐟", "🥕", "💫", "🎊"][i]}
        </motion.div>
      ))}
    </div>
  );
};
