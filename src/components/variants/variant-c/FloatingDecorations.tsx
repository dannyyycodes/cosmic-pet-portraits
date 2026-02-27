import { motion } from "framer-motion";

const decorations = [
  { emoji: "🐾", x: "8%", y: "15%", size: 28, delay: 0, duration: 8 },
  { emoji: "❤️", x: "85%", y: "10%", size: 22, delay: 1.5, duration: 9 },
  { emoji: "🐾", x: "92%", y: "35%", size: 24, delay: 0.8, duration: 7 },
  { emoji: "❤️", x: "5%", y: "45%", size: 20, delay: 2, duration: 10 },
  { emoji: "🐾", x: "15%", y: "65%", size: 26, delay: 3, duration: 8.5 },
  { emoji: "❤️", x: "88%", y: "60%", size: 18, delay: 1, duration: 9.5 },
  { emoji: "🐾", x: "78%", y: "80%", size: 22, delay: 2.5, duration: 7.5 },
  { emoji: "❤️", x: "12%", y: "85%", size: 24, delay: 0.5, duration: 8 },
  { emoji: "🐾", x: "50%", y: "5%", size: 20, delay: 3.5, duration: 9 },
  { emoji: "❤️", x: "35%", y: "90%", size: 18, delay: 1.8, duration: 10 },
];

export const FloatingDecorations = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {decorations.map((d, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{
            left: d.x,
            top: d.y,
            fontSize: d.size,
            opacity: 0,
          }}
          animate={{
            y: [0, -20, 0, 15, 0],
            rotate: [0, 5, -3, 4, 0],
            opacity: [0.07, 0.12, 0.08, 0.11, 0.07],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {d.emoji}
        </motion.span>
      ))}
    </div>
  );
};