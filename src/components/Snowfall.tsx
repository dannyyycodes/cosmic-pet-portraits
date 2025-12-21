import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function Snowfall() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    // Performance optimized: fewer on mobile, more on desktop
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 20 : 40;
    
    for (let i = 0; i < count; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        size: isMobile ? Math.random() * 2 + 2 : Math.random() * 3 + 2,
        duration: Math.random() * 10 + 15, // Slower = smoother
        delay: Math.random() * 10,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-white/90"
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
            boxShadow: '0 0 3px rgba(255,255,255,0.5)',
          }}
        />
      ))}
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-20px) translateX(0);
          }
          25% {
            transform: translateY(25vh) translateX(5px);
          }
          50% {
            transform: translateY(50vh) translateX(-5px);
          }
          75% {
            transform: translateY(75vh) translateX(5px);
          }
          100% {
            transform: translateY(105vh) translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
