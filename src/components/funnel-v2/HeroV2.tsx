import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeroV2Props {
  onCtaClick: () => void;
  headlineLine1: string;
  headlineLine2: string;
  subhead: string;
  ctaLabel: string;
}

export const HeroV2 = ({ onCtaClick, headlineLine1, headlineLine2, subhead, ctaLabel }: HeroV2Props) => {
  const [visible, setVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative min-h-[calc(100svh-34px)] flex flex-col items-center justify-center px-5 pt-10 pb-12 sm:py-16 overflow-hidden"
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
        {/* Main headline — curiosity gap */}
        <h1
          className="transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: isMobile ? "clamp(2.05rem, 9.5vw, 3.2rem)" : "clamp(2.8rem, 5.5vw, 4.2rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transitionDelay: "0.15s",
          }}
        >
          {headlineLine1}
          <br />
          <em>{headlineLine2}</em>
        </h1>

        {/* Subheadline with bolded power phrases */}
        <p
          className="mt-4 sm:mt-5 mx-auto transition-all duration-[1200ms] ease-out hero-subhead"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.05rem, 3.8vw, 1.3rem)",
            fontWeight: 400,
            color: "var(--earth, #6e6259)",
            lineHeight: 1.6,
            maxWidth: 460,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
            transitionDelay: "0.35s",
          }}
          dangerouslySetInnerHTML={{ __html: subhead }}
        />
        <style>{`
          .hero-subhead b {
            font-style: normal;
            font-weight: 600;
            color: var(--ink, #1f1c18);
          }
        `}</style>

        {/* CTA Button */}
        <div
          className="mt-7 sm:mt-10 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.55s",
          }}
        >
          <button
            onClick={onCtaClick}
            className="group relative inline-flex items-center gap-2 px-8 sm:px-10 py-4 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "var(--rose, #bf524a)",
              boxShadow: "0 4px 24px rgba(191,82,74,0.25)",
              minHeight: 56,
            }}
          >
            {ctaLabel}
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

        </div>
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
