import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import lunaImg from "@/assets/samples/luna-persian.jpg";
import maxImg from "@/assets/samples/max-golden.jpg";
import cinnamonImg from "@/assets/samples/cinnamon-rabbit.jpg";
import peanutImg from "@/assets/samples/peanut-hamster.jpg";

const petPhotos = [maxImg, lunaImg, cinnamonImg, peanutImg];

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
      {/* Subtle decorative paw prints */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <svg className="absolute top-[12%] left-[8%] w-8 h-8 rotate-[-15deg]" viewBox="0 0 28 34" fill="currentColor">
          <ellipse cx="14" cy="22" rx="7" ry="9" /><ellipse cx="7" cy="10" rx="4" ry="5" /><ellipse cx="14" cy="6" rx="4" ry="5" /><ellipse cx="21" cy="10" rx="4" ry="5" />
        </svg>
        <svg className="absolute top-[20%] right-[12%] w-6 h-6 rotate-[20deg]" viewBox="0 0 28 34" fill="currentColor">
          <ellipse cx="14" cy="22" rx="7" ry="9" /><ellipse cx="7" cy="10" rx="4" ry="5" /><ellipse cx="14" cy="6" rx="4" ry="5" /><ellipse cx="21" cy="10" rx="4" ry="5" />
        </svg>
        <svg className="absolute bottom-[25%] left-[15%] w-7 h-7 rotate-[180deg]" viewBox="0 0 28 34" fill="currentColor">
          <ellipse cx="14" cy="22" rx="7" ry="9" /><ellipse cx="7" cy="10" rx="4" ry="5" /><ellipse cx="14" cy="6" rx="4" ry="5" /><ellipse cx="21" cy="10" rx="4" ry="5" />
        </svg>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Social proof badge */}
        <div
          className="inline-flex items-center gap-3 mb-6 sm:mb-8 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <div className="flex -space-x-2">
            {petPhotos.map((photo, i) => (
              <img key={i} src={photo} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-[var(--cream,#FFFDF5)] shadow-sm" />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-3.5 h-3.5 text-[var(--gold,#c4a265)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-[var(--muted,#958779)] font-medium" style={{ fontFamily: "Cormorant, Georgia, serif" }}>
              Loved by <strong className="text-[var(--ink,#1f1c18)]">12,000+</strong> pet parents
            </span>
          </div>
        </div>

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

        {/* Subheadline */}
        <p
          className="mt-4 sm:mt-5 mx-auto transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.05rem, 3.8vw, 1.3rem)",
            fontWeight: 400,
            color: "var(--earth, #6e6259)",
            lineHeight: 1.6,
            maxWidth: 440,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
            transitionDelay: "0.35s",
          }}
        >
          {subhead}
        </p>

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

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4">
            {[
              "Ready in minutes",
              "No account needed",
              "Full refund if it's not a match",
            ].map((text, i) => (
              <span key={i} className="flex items-center gap-1" style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--muted, #958779)" }}>
                <svg className="w-3.5 h-3.5 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {text}
              </span>
            ))}
          </div>
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
