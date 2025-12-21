import { motion } from "framer-motion";

const festivePets = [
  {
    emoji: "🐕",
    accessory: "🎅",
    position: { left: "2%", bottom: "5%" },
  },
  {
    emoji: "🐈",
    accessory: "🎄",
    position: { right: "2%", bottom: "5%" },
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
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: index * 0.5, duration: 1 }}
        >
          <motion.span
            className="text-lg mb-1"
            animate={{ y: [-2, 2, -2], rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {pet.accessory}
          </motion.span>
          <motion.span
            className="text-4xl opacity-80"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {pet.emoji}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
};
