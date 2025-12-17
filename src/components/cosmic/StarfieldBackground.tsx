import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface StarfieldBackgroundProps {
  intensity?: 'calm' | 'normal' | 'excited';
  interactive?: boolean;
}

export function StarfieldBackground({ intensity = 'normal', interactive = true }: StarfieldBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const starCounts = {
    calm: 50,
    normal: 100,
    excited: 180
  };

  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: starCounts[intensity] }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 4
    }));
  }, [intensity]);

  useEffect(() => {
    if (!interactive || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 20
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Nebula layers */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 1, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-nebula-purple/20 via-transparent to-nebula-blue/15" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </motion.div>

      {/* Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-starlight"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Shooting stars (occasional) */}
      {intensity === 'excited' && (
        <>
          <ShootingStar delay={0} />
          <ShootingStar delay={3} />
          <ShootingStar delay={7} />
        </>
      )}
    </div>
  );
}

function ShootingStar({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-starlight rounded-full"
      style={{
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 30 + 5}%`,
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, 100, 200],
        y: [0, 50, 100],
      }}
      transition={{
        duration: 1.5,
        delay,
        repeat: Infinity,
        repeatDelay: 8 + Math.random() * 5,
        ease: "easeOut"
      }}
    >
      <div className="absolute inset-0 w-20 h-0.5 bg-gradient-to-l from-transparent via-starlight/50 to-starlight -translate-x-full" />
    </motion.div>
  );
}
