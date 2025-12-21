import { motion } from "framer-motion";

const festivePets = [
  {
    emoji: "🐕",
    accessory: "🎅",
    glow: "hsl(0 75% 50%)", // Christmas red glow
    position: { left: "3%", bottom: "8%" },
  },
  {
    emoji: "🐈",
    accessory: "🎄",
    glow: "hsl(145 70% 40%)", // Christmas green glow
    position: { right: "3%", bottom: "8%" },
  },
];

export const FestivePets = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden hidden md:block">
      {festivePets.map((pet, index) => (
        <motion.div
          key={index}
          className="absolute flex flex-col items-center"
          style={pet.position}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 0.85, y: 0 }}
          transition={{ delay: index * 0.5, duration: 1 }}
        >
          {/* Festive glow behind pet */}
          <motion.div
            className="absolute -inset-4 rounded-full blur-xl"
            style={{ backgroundColor: pet.glow, opacity: 0.2 }}
            animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.span
            className="text-xl mb-1 relative z-10"
            animate={{ y: [-3, 3, -3], rotate: [-8, 8, -8] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ filter: `drop-shadow(0 0 8px ${pet.glow})` }}
          >
            {pet.accessory}
          </motion.span>
          <motion.span
            className="text-5xl relative z-10"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
          >
            {pet.emoji}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
};
