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

const VALUE_ITEMS = [
  { icon: "✨", title: "Full Cosmic Personality Profile", desc: "13 planetary placements decoded. Who they are beneath the fur.", included: true },
  { icon: "💛", title: "Emotional Blueprint", desc: "What soothes them. What stresses them. What they've been trying to tell you.", included: true },
  { icon: "💬", title: "SoulSpeak Chat", desc: "Ask them anything. Hear what they'd actually say back to you.", included: true },
  { icon: "🔮", title: "Soul Purpose & Life Path", desc: "The deeper reason they came into your life.", included: true },
  { icon: "💌", title: "A Letter From Their Soul", desc: "What they would write to you if they could hold a pen.", included: true },
  { icon: "🐾", title: "Archetype, Aura & Crystal Match", desc: "Their soul archetype, energy colour, and cosmic crystal.", included: true },
  { icon: "📅", title: "Weekly Cosmic Horoscope", desc: "Personalised to their chart. First month free.", included: true },
  { icon: "📖", title: "30+ Deeply Personal Sections", desc: "Love language, superpower, hidden fears, dream job, and more.", included: true },
];

interface ProductRevealProps {
  onCtaClick: () => void;
  ctaLabel: string;
}

export const ProductReveal = ({ onCtaClick, ctaLabel }: ProductRevealProps) => {
  const { ref, visible } = useScrollReveal(0.1);
  const isMobile = useIsMobile();

  return (
    <section
      ref={ref}
      className="relative py-12 sm:py-16 md:py-24 px-5 overflow-hidden"
      style={{ background: "var(--cream2, #faf4e8)" }}
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
          What You'll Receive
        </p>
        <h2
          className="text-center mb-4 transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.4rem, 6vw, 2.2rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.15,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
            transitionDelay: "0.1s",
          }}
        >
          A Reading Unlike Anything Else
        </h2>
        <p
          className="text-center mb-10 sm:mb-12 md:mb-16 transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(0.95rem, 3.5vw, 1.1rem)",
            color: "var(--muted, #958779)",
            maxWidth: 440,
            margin: "0 auto",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.15s",
          }}
        >
          Based on their exact birth chart. Calculated from real planetary positions. No two readings are the same.
        </p>

        <div className={`flex ${isMobile ? "flex-col items-center gap-8" : "items-start gap-12"}`}>
          {/* Report mockup with SoulSpeak preview */}
          <div
            className="relative flex-shrink-0 transition-all duration-[1400ms] ease-out"
            style={{
              width: isMobile ? 280 : 320,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.92)",
              transitionDelay: "0.2s",
            }}
          >
            {/* Report card */}
            <div
              className="rounded-xl shadow-2xl overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-3"
                style={{
                  background: "linear-gradient(135deg, var(--cream2, #faf4e8), var(--cream3, #f3eadb))",
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "var(--rose-glow, rgba(191,82,74,0.12))" }}>💛</div>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.85rem", color: "var(--ink, #1f1c18)" }}>
                    Emotional Blueprint
                  </span>
                </div>
              </div>

              {/* Visible teaser */}
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
                  "When you're hurting, they don't ask why. They just
                  come closer. They sense what you're feeling before
                  you've said a word. Their instinct is always to move
                  toward you, never away..."
                </p>

                {/* Blurred/locked content */}
                <div className="relative">
                  <div className="space-y-2.5 select-none" style={{ filter: "blur(4px)" }}>
                    {[85, 70, 92, 60, 78, 88, 55].map((w, i) => (
                      <div key={i} className="h-2 rounded-full" style={{ width: `${w}%`, background: "var(--sand, #d6c8b6)" }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
                    <div className="text-center">
                      <svg className="w-5 h-5 mx-auto mb-1 text-[var(--rose,#bf524a)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.72rem", fontWeight: 600, color: "var(--rose, #bf524a)" }}>
                        Unlock full reading
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SoulSpeak chat preview */}
            <div
              className="mt-4 rounded-xl shadow-lg overflow-hidden"
              style={{
                background: "#fff",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <div className="px-4 py-2.5" style={{ background: "linear-gradient(135deg, var(--cream2, #faf4e8), var(--cream3, #f3eadb))", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">💬</span>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.8rem", color: "var(--ink, #1f1c18)" }}>
                    SoulSpeak
                  </span>
                  <span className="ml-auto text-[0.6rem] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "var(--green-soft, #e8f5ec)", color: "var(--green, #4a8c5c)" }}>
                    INCLUDED
                  </span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="px-3 py-1.5 rounded-2xl rounded-br-sm max-w-[80%]" style={{ background: "var(--rose, #bf524a)", color: "#fff" }}>
                    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.78rem" }}>Why do you steal my socks?</p>
                  </div>
                </div>
                {/* Pet reply */}
                <div className="flex justify-start">
                  <div className="px-3 py-1.5 rounded-2xl rounded-bl-sm max-w-[85%]" style={{ background: "var(--cream3, #f3eadb)" }}>
                    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.78rem", color: "var(--earth, #6e6259)" }}>
                      Because they smell like you and that makes me feel safe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value stack */}
          <div className="flex-1 min-w-0">
            <div className="space-y-3.5">
              {VALUE_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 transition-all duration-[1000ms] ease-out"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(20px)",
                    transitionDelay: `${0.25 + i * 0.06}s`,
                  }}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        style={{
                          fontFamily: '"DM Serif Display", Georgia, serif',
                          fontSize: "0.92rem",
                          color: "var(--ink, #1f1c18)",
                          marginBottom: 1,
                        }}
                      >
                        {item.title}
                      </h3>
                      {item.included && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", color: "var(--muted, #958779)", lineHeight: 1.45 }}>
                      {item.desc}
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
                  minHeight: 52,
                }}
              >
                {ctaLabel}
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <p
                className="mt-3"
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "0.78rem",
                  fontStyle: "italic",
                  color: "var(--muted, #958779)",
                }}
              >
                Full refund if the reading doesn't feel like them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
