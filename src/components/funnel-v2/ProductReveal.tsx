import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const REPORT_SECTIONS = [
  { icon: "✨", title: "Cosmic Personality Profile", desc: "Their sun sign decoded — who they truly are at their core" },
  { icon: "💛", title: "Emotional Blueprint", desc: "How they process feelings, what soothes them, and what stresses them" },
  { icon: "🔮", title: "Soul Purpose & Life Path", desc: "The deeper reason they came into your life" },
  { icon: "🤝", title: "Owner Compatibility", desc: "How your energies align — and where you balance each other" },
  { icon: "💎", title: "Crystal & Aura Reading", desc: "Their energy signature, lucky elements, and cosmic colours" },
  { icon: "📖", title: "30+ Deeply Personal Sections", desc: "Love language, superpower, hidden fears, daily horoscope & more" },
];

interface ProductRevealProps {
  onCtaClick: () => void;
}

export const ProductReveal = ({ onCtaClick }: ProductRevealProps) => {
  const { ref, visible } = useScrollReveal(0.15);
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 px-5 overflow-hidden"
      style={{
        background: "var(--cream2, #faf4e8)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Section label */}
        <p
          className="text-center mb-3 transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontWeight: 600,
            fontSize: "0.78rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "var(--earth, #6e6259)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          What You'll Discover
        </p>
        <h2
          className="text-center mb-12 md:mb-16 transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.5rem, 6vw, 2.4rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.15,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
            transitionDelay: "0.1s",
          }}
        >
          A Deeply Personal Reading,
          <br />
          Written in the Stars
        </h2>

        <div className={`flex ${isMobile ? "flex-col items-center gap-10" : "items-start gap-12"}`}>
          {/* Report mockup — fanned pages */}
          <div
            className="relative flex-shrink-0 transition-all duration-[1400ms] ease-out"
            style={{
              width: isMobile ? 260 : 300,
              height: isMobile ? 340 : 390,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.92)",
              transitionDelay: "0.2s",
            }}
          >
            {/* Back page (tilted left) */}
            <div
              className="absolute rounded-xl shadow-lg"
              style={{
                width: "85%",
                height: "90%",
                top: "5%",
                left: "0%",
                background: "linear-gradient(135deg, #fff 0%, var(--cream2, #faf4e8) 100%)",
                border: "1px solid rgba(0,0,0,0.06)",
                transform: "rotate(-6deg)",
                zIndex: 1,
              }}
            >
              {/* Blurred lines */}
              <div className="p-5 space-y-3 opacity-40">
                {[75, 90, 60, 85, 70, 55, 80, 65].map((w, i) => (
                  <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: "var(--sand, #d6c8b6)" }} />
                ))}
              </div>
            </div>

            {/* Middle page (tilted right) */}
            <div
              className="absolute rounded-xl shadow-lg"
              style={{
                width: "85%",
                height: "90%",
                top: "2%",
                left: "8%",
                background: "linear-gradient(135deg, #fff 0%, var(--cream2, #faf4e8) 100%)",
                border: "1px solid rgba(0,0,0,0.06)",
                transform: "rotate(3deg)",
                zIndex: 2,
              }}
            >
              <div className="p-5 space-y-3 opacity-30">
                {[80, 65, 90, 50, 75, 85, 60].map((w, i) => (
                  <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: "var(--sand, #d6c8b6)" }} />
                ))}
              </div>
            </div>

            {/* Front page (main) — has visible teaser content */}
            <div
              className="absolute rounded-xl shadow-2xl overflow-hidden"
              style={{
                width: "88%",
                height: "93%",
                top: "0%",
                left: "10%",
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
                zIndex: 3,
              }}
            >
              {/* Header bar */}
              <div
                className="px-5 py-3"
                style={{
                  background: "linear-gradient(135deg, var(--cream2, #faf4e8), var(--cream3, #f3eadb))",
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "var(--rose-glow, rgba(191,82,74,0.12))" }}
                  >
                    💛
                  </div>
                  <span
                    style={{
                      fontFamily: '"DM Serif Display", Georgia, serif',
                      fontSize: "0.85rem",
                      color: "var(--ink, #1f1c18)",
                    }}
                  >
                    Emotional Blueprint
                  </span>
                </div>
              </div>

              {/* Teaser content */}
              <div className="px-5 py-4">
                <p
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontStyle: "italic",
                    fontSize: "0.82rem",
                    color: "var(--earth, #6e6259)",
                    lineHeight: 1.65,
                    marginBottom: 12,
                  }}
                >
                  "Your pet senses tension before you even speak.
                  They carry an almost psychic awareness of your
                  emotional state — and their instinct is always
                  to move closer, not away..."
                </p>

                {/* Blurred content (locked) */}
                <div className="relative">
                  <div className="space-y-2.5 select-none" style={{ filter: "blur(4px)" }}>
                    {[85, 70, 92, 60, 78, 88, 55, 75, 68, 90, 82, 62].map((w, i) => (
                      <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: "var(--sand, #d6c8b6)" }} />
                    ))}
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
                    <div className="text-center">
                      <svg className="w-5 h-5 mx-auto mb-1 text-[var(--rose,#bf524a)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span
                        style={{
                          fontFamily: "Cormorant, Georgia, serif",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "var(--rose, #bf524a)",
                        }}
                      >
                        Unlock full reading
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features list */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4">
              {REPORT_SECTIONS.map((section, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 transition-all duration-[1000ms] ease-out"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(20px)",
                    transitionDelay: `${0.3 + i * 0.08}s`,
                  }}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{section.icon}</span>
                  <div>
                    <h3
                      style={{
                        fontFamily: '"DM Serif Display", Georgia, serif',
                        fontSize: "0.95rem",
                        color: "var(--ink, #1f1c18)",
                        marginBottom: 2,
                      }}
                    >
                      {section.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "Cormorant, Georgia, serif",
                        fontSize: "0.88rem",
                        color: "var(--muted, #958779)",
                        lineHeight: 1.5,
                      }}
                    >
                      {section.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mid-section CTA */}
            <div
              className="mt-8 transition-all duration-1000"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(15px)",
                transitionDelay: "0.7s",
              }}
            >
              <button
                onClick={onCtaClick}
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "var(--rose, #bf524a)",
                  boxShadow: "0 4px 20px rgba(191,82,74,0.2)",
                }}
              >
                Get Their Soul Reading
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
