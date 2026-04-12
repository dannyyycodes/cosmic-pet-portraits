import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroV2Props {
  onCtaClick: () => void;
  ctaLabel: string;
}

export const HeroV2 = ({ onCtaClick, ctaLabel }: HeroV2Props) => {
  const [visible, setVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative flex flex-col items-center justify-center px-5 pt-8 pb-10 sm:pt-10 sm:pb-12 overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 90% 70% at 50% 40%, var(--cream2, #faf4e8) 0%, var(--cream, #FFFDF5) 65%)",
      }}
    >
      {/* Constellation background — slow-drifting stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          {/* Constellation 1 — top left */}
          <g stroke="var(--gold, #c4a265)" strokeWidth="0.8" opacity="0.16" fill="none">
            <line x1="120" y1="140" x2="180" y2="180" />
            <line x1="180" y1="180" x2="230" y2="150" />
            <line x1="230" y1="150" x2="280" y2="200" />
            <line x1="180" y1="180" x2="210" y2="240" />
          </g>
          {/* Constellation 2 — top right */}
          <g stroke="var(--rose, #bf524a)" strokeWidth="0.8" opacity="0.14" fill="none">
            <line x1="550" y1="120" x2="620" y2="160" />
            <line x1="620" y1="160" x2="680" y2="130" />
            <line x1="620" y1="160" x2="640" y2="220" />
            <line x1="640" y1="220" x2="700" y2="240" />
          </g>
          {/* Constellation 3 — bottom */}
          <g stroke="var(--gold, #c4a265)" strokeWidth="0.8" opacity="0.12" fill="none">
            <line x1="200" y1="600" x2="270" y2="640" />
            <line x1="270" y1="640" x2="330" y2="610" />
            <line x1="330" y1="610" x2="390" y2="650" />
          </g>
          {/* Star dots — scattered */}
          {[
            [120, 140, 1.8], [180, 180, 2.2], [230, 150, 1.5], [280, 200, 2], [210, 240, 1.5],
            [550, 120, 1.8], [620, 160, 2.5], [680, 130, 1.5], [640, 220, 2], [700, 240, 1.8],
            [200, 600, 2], [270, 640, 1.8], [330, 610, 2.2], [390, 650, 1.5],
            [80, 380, 1.3], [420, 80, 1.4], [730, 420, 1.6], [60, 520, 1.2], [760, 560, 1.5],
            [380, 320, 1.2], [500, 420, 1.3], [150, 720, 1.2], [620, 700, 1.4], [440, 180, 1.2],
          ].map(([cx, cy, r], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="var(--gold, #c4a265)"
              opacity={0.35}
              style={{
                animation: `twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </svg>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.55; }
        }
      `}</style>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Main headline */}
        <h1
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: isMobile ? "clamp(2.05rem, 9.5vw, 3.2rem)" : "clamp(2.8rem, 5.5vw, 4.2rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.1,
            letterSpacing: "-0.035em",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transitionDelay: "0.15s",
          }}
        >
          They Give Us Everything
          <br />
          It's Time We Understood Them in Return
        </h1>

        {/* Hero CTA removed — the main checkout CTA lives in InlineCheckout below. */}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-1000"
        style={{
          opacity: visible ? 0.4 : 0,
          transitionDelay: "1.2s",
          animation: visible ? "gentleBounce 2.5s ease-in-out infinite 1.5s" : "none",
        }}
      >
        <svg className="w-5 h-5 text-[var(--muted,#958779)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
        </svg>
      </div>

      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </section>
  );
};
