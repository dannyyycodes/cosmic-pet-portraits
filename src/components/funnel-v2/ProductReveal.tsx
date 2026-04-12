import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── VSOP Credibility — warm authority ── */
const VsopCredibility = () => (
  <div className="relative text-center overflow-hidden vsop-section">
    {/* Decorative orbit backdrop — pure SVG, very low opacity, gently rotating */}
    <svg
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none vsop-orbit"
      width="640" height="640" viewBox="0 0 640 640"
      aria-hidden="true"
      style={{ maxWidth: "110%", height: "auto", opacity: 0.35 }}
    >
      <defs>
        <radialGradient id="vsop-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c4a265" stopOpacity="0.12" />
          <stop offset="70%" stopColor="#c4a265" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="320" cy="320" r="280" fill="url(#vsop-glow)" />
      <circle cx="320" cy="320" r="140" stroke="#c4a265" strokeWidth="0.6" strokeDasharray="2 6" fill="none" opacity="0.5" />
      <circle cx="320" cy="320" r="200" stroke="#c4a265" strokeWidth="0.6" strokeDasharray="3 9" fill="none" opacity="0.4" />
      <circle cx="320" cy="320" r="260" stroke="#c4a265" strokeWidth="0.5" strokeDasharray="2 12" fill="none" opacity="0.3" />
      {/* Traveling planet dots */}
      <circle cx="460" cy="320" r="3" fill="#c4a265" opacity="0.8" />
      <circle cx="320" cy="120" r="2.5" fill="#bf524a" opacity="0.7" />
      <circle cx="180" cy="420" r="2.5" fill="#c4a265" opacity="0.6" />
    </svg>

    <div className="relative">
      {/* Ornamental rule with centered diamond */}
      <div className="flex items-center justify-center gap-2 mb-6" aria-hidden="true">
        <div style={{ width: 36, height: 1, background: "linear-gradient(90deg, transparent, #c4a265)", opacity: 0.7 }} />
        <svg width="10" height="10" viewBox="0 0 10 10" className="vsop-diamond">
          <path d="M5 0l2 5-2 5-2-5z" fill="#c4a265" opacity="0.85" />
        </svg>
        <div style={{ width: 36, height: 1, background: "linear-gradient(270deg, transparent, #c4a265)", opacity: 0.7 }} />
      </div>

      {/* Section title — bold black */}
      <p
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.25rem, 5vw, 1.6rem)",
          fontWeight: 400,
          color: "var(--black, #141210)",
          letterSpacing: "-0.01em",
          marginBottom: 16,
        }}
      >
        Real Astronomy. Not Guesswork.
      </p>
      <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "clamp(0.92rem, 3.2vw, 1rem)", color: "var(--earth, #6e6259)", lineHeight: 1.55, maxWidth: 440, margin: "0 auto 28px" }}>
        Using{" "}
        <span style={{ color: "var(--gold, #c4a265)", fontWeight: 700, letterSpacing: "0.03em" }}>VSOP87</span>
        {" — the same planetary model used by "}
        <span style={{ color: "var(--ink, #1f1c18)", fontWeight: 700 }}>NASA</span>
        {" and professional observatories worldwide."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {[
          {
            h: "Not a personality quiz. Real coordinates.",
            d: "13 celestial bodies, rising sign, elemental balance, and house placements — all calculated to the exact minute.",
          },
          {
            h: "The same math NASA uses to track planets.",
            d: "VSOP87, developed at the Bureau des Longitudes in Paris. The global standard for planetary position calculation.",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="relative rounded-xl py-5 px-5 text-left"
            style={{
              background: "linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)",
              border: "1px solid rgba(196,162,101,0.28)",
              boxShadow: "0 2px 16px rgba(196,162,101,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.95rem", color: "var(--ink, #1f1c18)", lineHeight: 1.3, marginBottom: 8 }}>
              {item.h}
            </p>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--earth, #6e6259)", lineHeight: 1.55 }}>
              {item.d}
            </p>
          </div>
        ))}
      </div>

      {/* Eyebrow above glyph row */}
      <p
        className="mb-3"
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--gold, #c4a265)",
          opacity: 0.85,
        }}
      >
        The thirteen bodies we read
      </p>

      {/* Planet row — gold gradient glyphs on rich pills */}
      <div className="flex flex-wrap justify-center gap-1.5 mb-8">
        {[
          ["Sun","\u2609\uFE0E"],["Moon","\u263D\uFE0E"],["Mercury","\u263F\uFE0E"],["Venus","\u2640\uFE0E"],
          ["Mars","\u2642\uFE0E"],["Jupiter","\u2643\uFE0E"],["Saturn","\u2644\uFE0E"],["Uranus","\u2645\uFE0E"],
          ["Neptune","\u2646\uFE0E"],["Pluto","\u2647\uFE0E"],["Chiron","\u26B7\uFE0E"],["Node","\u260A\uFE0E"],["Lilith","\u26B8\uFE0E"],
        ].map(([name, sym], i) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full vsop-glyph-pill"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--ink, #1f1c18)",
              background: "linear-gradient(180deg, #FFFDF5 0%, #faf4e8 100%)",
              border: "1px solid rgba(196,162,101,0.32)",
              boxShadow: "0 1px 4px rgba(196,162,101,0.1)",
              animationDelay: `${i * 120}ms`,
            }}
          >
            <span
              style={{
                fontFamily: '"DejaVu Sans", "Noto Sans Symbols", system-ui',
                fontSize: "0.95rem",
                fontVariantEmoji: "text" as never,
                background: "linear-gradient(135deg, #d4b26b, #c4a265 50%, #bf524a)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1,
              }}
            >
              {sym}
            </span>
            {name}
          </span>
        ))}
      </div>

      {/* Standards row with gold diamond separators */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {["VSOP87", "JPL HORIZONS", "IAU STANDARDS", "ASTRONOMIA ENGINE"].map((label, i) => (
          <span key={label} className="inline-flex items-center gap-2">
            {i > 0 && (
              <svg width="4" height="4" viewBox="0 0 4 4" aria-hidden="true">
                <path d="M2 0l1 2-1 2-1-2z" fill="#c4a265" opacity="0.65" />
              </svg>
            )}
            <span
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.64rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--earth, #6e6259)",
              }}
            >
              {label}
            </span>
          </span>
        ))}
      </div>

      {/* Ornamental rule with centered diamond */}
      <div className="flex items-center justify-center gap-2 mt-8" aria-hidden="true">
        <div style={{ width: 36, height: 1, background: "linear-gradient(90deg, transparent, #c4a265)", opacity: 0.7 }} />
        <svg width="10" height="10" viewBox="0 0 10 10" className="vsop-diamond">
          <path d="M5 0l2 5-2 5-2-5z" fill="#c4a265" opacity="0.85" />
        </svg>
        <div style={{ width: 36, height: 1, background: "linear-gradient(270deg, transparent, #c4a265)", opacity: 0.7 }} />
      </div>
    </div>

    <style>{`
      @keyframes vsopOrbitSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
      @keyframes vsopDiamondPulse {
        0%, 100% { opacity: 0.85; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.12); }
      }
      @keyframes vsopGlyphTwinkle {
        0%, 92%, 100% { transform: translateY(0); }
        95% { transform: translateY(-1.5px); }
      }
      .vsop-orbit { animation: vsopOrbitSpin 180s linear infinite; will-change: transform; }
      .vsop-diamond { animation: vsopDiamondPulse 3.5s ease-in-out infinite; transform-origin: center; }
      .vsop-glyph-pill {
        animation: vsopGlyphTwinkle 4.5s ease-in-out infinite;
        animation-delay: inherit;
        will-change: transform;
      }
      @media (prefers-reduced-motion: reduce) {
        .vsop-orbit, .vsop-diamond, .vsop-glyph-pill { animation: none !important; }
      }
    `}</style>
  </div>
);

interface ProductRevealProps {
  onCtaClick: () => void;
  ctaLabel: string;
}

export const ProductReveal = ({ onCtaClick, ctaLabel }: ProductRevealProps) => {
  const { ref, visible } = useScrollReveal(0.08);
  const [chatStep, setChatStep] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          obs.disconnect();
          setChatStep(1);
          setTimeout(() => setChatStep(2), 600);
          setTimeout(() => setChatStep(3), 1400);
          setTimeout(() => setChatStep(4), 2100);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden">

      {/* ── Block 1: The Science ── clean cream (Real Astronomy first, per spec) */}
      <div
        className="px-5 py-14 sm:py-20 transition-all duration-[1200ms] ease-out"
        style={{
          background: "#f8f3ea",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "0.1s",
        }}
      >
        <div className="max-w-[520px] mx-auto">
          <VsopCredibility />
        </div>
      </div>

      {/* ── Block 2: The Benefits ── four-pillar editorial grid ── */}
      <div
        className="relative overflow-hidden px-5 py-16 sm:py-20 md:py-24"
        style={{
          background: "linear-gradient(180deg, var(--cream, #FFFDF5) 0%, #faf4e8 100%)",
        }}
      >
        <div className="relative max-w-[720px] mx-auto">
          {/* Eyebrow */}
          <p
            className={`text-center benefit-eyebrow ${visible ? "is-in" : ""}`}
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--gold, #c4a265)",
              marginBottom: 36,
            }}
          >
            When you truly know them
          </p>

          {/* Four-pillar grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {[
              { roman: "I", text: "Love them in the way they actually feel it." },
              { roman: "II", text: "Know what they need — without guessing, without wondering." },
              { roman: "III", text: "Finally put words to the bond you've always felt." },
              { roman: "IV", text: "Know them the way they've always known you." },
            ].map((item, i) => (
              <div
                key={i}
                className={`benefit-pillar ${visible ? "is-in" : ""}`}
                style={{
                  animationDelay: `${0.2 + i * 0.14}s`,
                  position: "relative",
                  padding: "22px 22px 24px",
                  borderRadius: 14,
                  background: "linear-gradient(180deg, rgba(255,253,245,0.85) 0%, rgba(250,244,232,0.6) 100%)",
                  border: "1px solid rgba(196,162,101,0.22)",
                  boxShadow: "0 2px 18px rgba(196,162,101,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                {/* Roman numeral drop-cap */}
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 18,
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontStyle: "italic",
                    fontSize: "1.3rem",
                    background: "linear-gradient(135deg, #d4b26b, #c4a265)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    opacity: 0.8,
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.roman}
                </span>

                {/* Small gold hairline */}
                <div
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 1,
                    background: "var(--gold, #c4a265)",
                    opacity: 0.7,
                    marginBottom: 14,
                  }}
                />

                {/* Statement */}
                <p
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "clamp(1.08rem, 3.6vw, 1.22rem)",
                    color: "var(--ink, #1f1c18)",
                    lineHeight: 1.35,
                    letterSpacing: "-0.01em",
                    margin: 0,
                  }}
                >
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pure-CSS animations. Transform + opacity only. */}
        <style>{`
          .benefit-eyebrow, .benefit-pillar {
            opacity: 0;
            transform: translateY(14px);
            will-change: opacity, transform;
          }
          .benefit-eyebrow.is-in {
            animation: benefitReveal 900ms cubic-bezier(0.22, 1, 0.36, 1) 0.05s forwards;
          }
          .benefit-pillar.is-in {
            animation: benefitReveal 1000ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes benefitReveal {
            to { opacity: 1; transform: translateY(0); }
          }

          @media (prefers-reduced-motion: reduce) {
            .benefit-eyebrow, .benefit-pillar {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
        `}</style>
      </div>

      {/* ── SoulSpeak section removed — moved into pricing card tap-to-expand preview ── */}
      {false && (
      <div
        className="px-5 py-14 sm:py-18 transition-all duration-[1200ms] ease-out"
        style={{
          background: "linear-gradient(180deg, #f0e8da 0%, #ede4d4 50%, #f0e8da 100%)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transitionDelay: "0.25s",
        }}
      >
        <div className="max-w-[520px] mx-auto">
          <div className="text-center mb-6">
            {/* SoulSpeak badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(191,82,74,0.06)",
                border: "1px solid rgba(191,82,74,0.12)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H13l-3.8 3.4V16H6.5A2.5 2.5 0 014 13.5v-7z" />
              </svg>
              <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rose, #bf524a)" }}>
                SoulSpeak — Included
              </span>
            </div>

            <h3
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.3rem, 5.5vw, 1.7rem)",
                color: "var(--ink, #1f1c18)",
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              Have the conversation you've
              <br />
              <em style={{ color: "var(--rose, #bf524a)" }}>always wished you could have</em>
            </h3>
            <p
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.6,
                maxWidth: 400,
                margin: "0 auto",
              }}
            >
              Ask them anything — why they do
              the weird things they do, how they feel about you, what they
              need.
            </p>
          </div>

          {/* Chat demo */}
          <div
            ref={chatRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <div className="px-5 py-5 sm:px-6 space-y-3">
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 1 ? 1 : 0, transform: chatStep >= 1 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem" }}>
                    Why do you always steal my socks?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 2 ? 1 : 0, transform: chatStep >= 2 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    Because they smell like you. And when you leave,
                    that's the closest thing I have to you being here.
                  </p>
                </div>
              </div>
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 3 ? 1 : 0, transform: chatStep >= 3 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem" }}>
                    Do you know how much I love you?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 4 ? 1 : 0, transform: chatStep >= 4 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    I knew before you did.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ProductReveal CTA removed — the main checkout CTA lives in InlineCheckout below. */}
    </section>
  );
};
