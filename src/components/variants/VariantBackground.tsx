import { useABTest } from "@/hooks/useABTest";

export const VariantBackground = () => {
  const { isVariantC } = useABTest();

  if (isVariantC) {
    return (
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(35 33% 98%) 0%, hsl(30 30% 96%) 50%, hsl(35 33% 98%) 100%)',
          }}
        />
      </div>
    );
  }

  // Variant A/B: Cosmic starfield
  return (
    <div className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(220,35%,8%)] via-[hsl(220,35%,6%)] to-[hsl(220,35%,4%)]" />
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 20% 30%, hsl(280 50% 30% / 0.5), transparent 60%)',
          animation: 'cosmic-breathe 12s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 75% 70%, hsl(220 60% 35% / 0.4), transparent 50%)',
          animation: 'cosmic-breathe 15s ease-in-out infinite reverse',
        }}
      />
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, hsl(25 80% 50% / 0.15), transparent 60%)',
          animation: 'cosmic-breathe 18s ease-in-out infinite',
        }}
      />
      {[...Array(typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 60)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-starlight"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.2,
            animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite, star-float ${Math.random() * 20 + 15}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};
