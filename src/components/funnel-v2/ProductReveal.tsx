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

/* ──────── Hand-drawn line-art icons (match the Astral Fauna palette) ──────── */

const IconStars = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="2.4" />
  </svg>
);

const IconHeartPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.5 10.8c0 5.2-8.5 10.2-8.5 10.2s-8.5-5-8.5-10.2a4.8 4.8 0 018.5-3.1 4.8 4.8 0 018.5 3.1z" />
    <path d="M3.5 12.5h3.2l1.6-2.5 2.2 5 1.6-3.2h5.7" />
  </svg>
);

const IconSpeechPaw = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H13l-3.8 3.4V16H6.5A2.5 2.5 0 014 13.5v-7z" />
    <circle cx="9" cy="9.6" r="0.9" />
    <circle cx="12" cy="8.6" r="0.9" />
    <circle cx="15" cy="9.6" r="0.9" />
    <path d="M10 12.4c.5.8 1.2 1.2 2 1.2s1.5-.4 2-1.2" />
  </svg>
);

const IconCompass = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21" />
    <path d="M8.8 15.2l2.2-6 4.2 4.2-6 2.2z" />
  </svg>
);

const IconEnvelope = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3.5 7.5l8.5 6.3 8.5-6.3" />
    <path d="M7.5 14.2l-3.5 4.3M16.5 14.2l3.5 4.3" />
  </svg>
);

const IconCrystal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5l5.5 5-5.5 14-5.5-14 5.5-5z" />
    <path d="M6.5 7.5h11M12 2.5v19" />
  </svg>
);

const IconMoonCycle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.5 13.5A8.5 8.5 0 1110.5 3.5a6.5 6.5 0 0010 10z" />
    <circle cx="17.2" cy="6.8" r="0.9" />
    <circle cx="20.2" cy="10" r="0.7" />
  </svg>
);

const IconBookStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.5A1.5 1.5 0 015.5 4H11v15H5.5A1.5 1.5 0 014 17.5v-12zM20 5.5A1.5 1.5 0 0018.5 4H13v15h5.5a1.5 1.5 0 001.5-1.5v-12z" />
    <path d="M15.5 9l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.2.7.2-1.4-1-1 1.4-.2.6-1.3z" />
  </svg>
);

// Benefits-first — what the reader gains, not what the product contains.
const VALUE_ITEMS = [
  {
    Icon: IconStars,
    title: "Finally Understand Why They Do What They Do",
    desc: "The quirks that used to puzzle you will suddenly make perfect sense.",
  },
  {
    Icon: IconHeartPulse,
    title: "Know Exactly How to Comfort Them",
    desc: "What soothes them on their worst days, and the signals you've been missing.",
  },
  {
    Icon: IconSpeechPaw,
    title: "Hear What They've Been Trying to Tell You",
    desc: "Ask them anything through SoulSpeak. Their answers will stop you in your tracks.",
  },
  {
    Icon: IconCompass,
    title: "Discover Why You Found Each Other",
    desc: "The reason your paths crossed — and what they came here to teach you.",
  },
  {
    Icon: IconEnvelope,
    title: "Read the Words They'd Write to You",
    desc: "A letter from their soul. You'll read it once and carry it with you forever.",
  },
  {
    Icon: IconCrystal,
    title: "See Their Soul Like No One Else Has",
    desc: "Their archetype, their aura colour, the crystal that holds their frequency.",
  },
  {
    Icon: IconMoonCycle,
    title: "Know What's Coming for Them Each Week",
    desc: "A personal forecast from their chart, delivered weekly. First month free.",
  },
  {
    Icon: IconBookStar,
    title: "Answer Every Question You've Ever Had",
    desc: "30+ deeply personal sections. Their love language, hidden depths, and everything in between.",
  },
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
        {/* Section label — brand voice */}
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
          What You'll Finally Understand
        </p>
        <h2
          className="text-center mb-4 transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.6rem, 6.4vw, 2.4rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
            transitionDelay: "0.1s",
          }}
        >
          What Changes When You
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>Truly Know Them.</em>
        </h2>
        <p
          className="text-center mb-10 sm:mb-12 md:mb-16 transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(0.98rem, 3.3vw, 1.08rem)",
            color: "var(--muted, #958779)",
            maxWidth: 500,
            margin: "0 auto",
            lineHeight: 1.6,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.15s",
          }}
        >
          Every reading is calculated from the exact moment they arrived in this world.
          No two souls are ever the same.
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
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(191,82,74,0.1)", color: "var(--rose, #bf524a)" }}
                    aria-hidden="true"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.5 10.8c0 5.2-8.5 10.2-8.5 10.2s-8.5-5-8.5-10.2a4.8 4.8 0 018.5-3.1 4.8 4.8 0 018.5 3.1z" />
                    </svg>
                  </div>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.85rem", color: "var(--ink, #1f1c18)" }}>
                    Emotional Blueprint
                  </span>
                </div>
              </div>

              {/* Visible teaser — universal, no species behaviour */}
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
                  "They know what you're feeling before you've said a
                  word. They've always known when you need them most,
                  long before you've understood it yourself. It isn't
                  a trick. It's a language..."
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H13l-3.8 3.4V16H6.5A2.5 2.5 0 014 13.5v-7z" />
                  </svg>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.8rem", color: "var(--ink, #1f1c18)" }}>
                    SoulSpeak
                  </span>
                  <span className="ml-auto text-[0.58rem] px-1.5 py-0.5 rounded-full font-semibold tracking-wider" style={{ background: "rgba(74,140,92,0.1)", color: "var(--green, #4a8c5c)" }}>
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
            <div className="space-y-4">
              {VALUE_ITEMS.map((item, i) => {
                const Icon = item.Icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 transition-all duration-[1000ms] ease-out"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateX(0)" : "translateX(20px)",
                      transitionDelay: `${0.25 + i * 0.06}s`,
                    }}
                  >
                    {/* Hand-drawn SVG icon in a soft rose circle */}
                    <div
                      className="flex-shrink-0 flex items-center justify-center rounded-full"
                      style={{
                        width: 38,
                        height: 38,
                        background: "rgba(191,82,74,0.06)",
                        border: "1px solid rgba(191,82,74,0.14)",
                        color: "var(--rose, #bf524a)",
                      }}
                      aria-hidden="true"
                    >
                      <div style={{ width: 20, height: 20 }}>
                        <Icon />
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3
                        style={{
                          fontFamily: '"DM Serif Display", Georgia, serif',
                          fontSize: "0.98rem",
                          color: "var(--ink, #1f1c18)",
                          marginBottom: 2,
                          lineHeight: 1.2,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.88rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
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
