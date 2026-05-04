/**
 * SplitWords — split text into per-word motion spans for stagger reveals.
 *
 * Each word gets its own motion.span. Reveals on viewport-enter with Y-offset
 * + opacity stagger. Common high-end editorial-motion pattern.
 *
 * Reduced-motion: disables transforms, all words fade in together.
 *
 * Usage:
 *   <h1><SplitWords text="Your pet, as the main character." /></h1>
 *   <h2>
 *     <SplitWords text="Six character worlds." />{" "}
 *     <SplitWords text="One pet." className="text-rose" delay={0.4} />
 *   </h2>
 */
import { motion, useReducedMotion } from "framer-motion";

interface SplitWordsProps {
  text: string;
  /** Per-word stagger seconds (default 0.06). */
  stagger?: number;
  /** Initial delay before first word (default 0). */
  delay?: number;
  /** Y-offset start in px (default 18). */
  yFrom?: number;
  /** Optional className applied to each word span. */
  className?: string;
  /** Optional inline style applied to each word span. */
  style?: React.CSSProperties;
}

export function SplitWords({
  text,
  stagger = 0.06,
  delay = 0,
  yFrom = 18,
  className,
  style,
}: SplitWordsProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span style={{ display: "inline" }}>
      {words.map((w, idx) => (
        <motion.span
          key={`${w}-${idx}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: yFrom }}
          whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{
            duration: 0.7,
            delay: delay + idx * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={className}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            ...style,
          }}
        >
          {w}
          {idx < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}
