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
  <div className="text-center">
    {/* Gold rule */}
    <div className="mx-auto mb-8" style={{ width: 50, height: 1, background: "var(--gold, #c4a265)", opacity: 0.35 }} />

    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted, #958779)", marginBottom: 14 }}>
      Real Astronomy. Not Guesswork.
    </p>
    <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.25rem, 5vw, 1.65rem)", fontWeight: 400, color: "var(--ink, #1f1c18)", lineHeight: 1.25, marginBottom: 10 }}>
      Every reading is calculated from the
      <br />
      exact sky the moment they were born
    </h3>
    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "clamp(0.92rem, 3.2vw, 1rem)", color: "var(--earth, #6e6259)", lineHeight: 1.55, maxWidth: 420, margin: "0 auto 28px" }}>
      Using VSOP87 — the same planetary model used by NASA and professional observatories worldwide.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
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
          className="rounded-xl py-5 px-4"
          style={{
            background: "#FFFDF5",
            border: "1px solid rgba(196,162,101,0.18)",
          }}
        >
          <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.88rem", color: "var(--ink, #1f1c18)", lineHeight: 1.25, marginBottom: 8 }}>
            {item.h}
          </p>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
            {item.d}
          </p>
        </div>
      ))}
    </div>

    {/* Planet row */}
    <div className="flex flex-wrap justify-center gap-1.5 mb-6">
      {[
        ["Sun","\u2609\uFE0E"],["Moon","\u263D\uFE0E"],["Mercury","\u263F\uFE0E"],["Venus","\u2640\uFE0E"],
        ["Mars","\u2642\uFE0E"],["Jupiter","\u2643\uFE0E"],["Saturn","\u2644\uFE0E"],["Uranus","\u2645\uFE0E"],
        ["Neptune","\u2646\uFE0E"],["Pluto","\u2647\uFE0E"],["Chiron","\u26B7\uFE0E"],["Node","\u260A\uFE0E"],["Lilith","\u26B8\uFE0E"],
      ].map(([name, sym]) => (
        <span
          key={name}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
          style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.72rem", fontWeight: 600, color: "var(--earth, #6e6259)", background: "#FFFDF5", border: "1px solid var(--cream3, #f3eadb)" }}
        >
          <span style={{ fontFamily: '"DejaVu Sans", "Noto Sans Symbols", system-ui', fontSize: "0.85rem", color: "var(--gold, #c4a265)", fontVariantEmoji: "text" as never }}>{sym}</span>
          {name}
        </span>
      ))}
    </div>

    <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted, #958779)", opacity: 0.55 }}>
      VSOP87 &nbsp;&middot;&nbsp; JPL HORIZONS &nbsp;&middot;&nbsp; IAU STANDARDS &nbsp;&middot;&nbsp; ASTRONOMIA ENGINE
    </p>

    {/* Gold rule */}
    <div className="mx-auto mt-8" style={{ width: 50, height: 1, background: "var(--gold, #c4a265)", opacity: 0.35 }} />
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

      {/* ── Block 2: The Benefits ── editorial typography, animated gold hairlines ── */}
      <div
        className="relative overflow-hidden px-5 py-20 sm:py-24 md:py-28"
        style={{
          background: "linear-gradient(180deg, var(--cream, #FFFDF5) 0%, #faf4e8 100%)",
        }}
      >
        {/* Subtle ornamental star — drawn once, low opacity, no JS animation */}
        <svg
          className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none benefits-star"
          width="18" height="18" viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8z"
            fill="var(--gold, #c4a265)"
            opacity="0.35"
          />
        </svg>

        <div className="relative max-w-[560px] mx-auto">
          {/* Eyebrow */}
          <p
            className={`text-center benefits-fade ${visible ? "is-in" : ""}`}
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--gold, #c4a265)",
              marginBottom: 20,
              animationDelay: "0.05s",
            }}
          >
            &mdash; &nbsp;The Promise&nbsp; &mdash;
          </p>

          {/* Headline — typographic hierarchy in three tiers */}
          <h2
            className="text-center"
            style={{
              marginBottom: 48,
              lineHeight: 1.02,
            }}
          >
            <span
              className={`benefits-line benefits-line-1 ${visible ? "is-in" : ""}`}
              style={{
                display: "block",
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 6.5vw, 2.3rem)",
                fontWeight: 400,
                color: "var(--ink, #1f1c18)",
                letterSpacing: "-0.02em",
              }}
            >
              Everything Changes
            </span>
            <span
              className={`benefits-line benefits-line-2 ${visible ? "is-in" : ""}`}
              style={{
                display: "block",
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(1rem, 3.8vw, 1.25rem)",
                fontWeight: 400,
                color: "var(--muted, #958779)",
                letterSpacing: "0.02em",
                margin: "6px 0 10px",
              }}
            >
              when you
            </span>
            <span
              className={`benefits-line benefits-line-3 ${visible ? "is-in" : ""}`}
              style={{
                display: "block",
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontStyle: "italic",
                fontSize: "clamp(2.2rem, 9vw, 3.4rem)",
                fontWeight: 400,
                color: "var(--rose, #bf524a)",
                letterSpacing: "-0.03em",
                lineHeight: 1.04,
              }}
            >
              Truly Know Them.
            </span>
          </h2>

          {/* Animated gold hairline — draws in from center */}
          <div className="flex justify-center mb-12" aria-hidden="true">
            <div
              className={`benefits-hairline ${visible ? "is-in" : ""}`}
              style={{
                height: 1,
                background: "var(--gold, #c4a265)",
                opacity: 0.5,
              }}
            />
          </div>

          {/* Bullets — Roman numeral markers, animated gold connector, typographic reveal */}
          <ol
            className="flex flex-col gap-10 sm:gap-12"
            style={{ listStyle: "none", padding: 0, margin: "0 auto", maxWidth: 500 }}
          >
            {[
              { roman: "I", text: "Love them in the way they actually feel it." },
              { roman: "II", text: "Know what they need — without guessing, without wondering." },
            ].map((item, i) => (
              <li
                key={i}
                className={`benefits-bullet ${visible ? "is-in" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 18,
                  animationDelay: `${0.5 + i * 0.25}s`,
                }}
              >
                {/* Roman numeral — faded gold, editorial feel */}
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "clamp(1rem, 3vw, 1.15rem)",
                    fontStyle: "italic",
                    color: "var(--gold, #c4a265)",
                    opacity: 0.75,
                    minWidth: 24,
                    paddingTop: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  {item.roman}
                </span>

                {/* Gold connector hairline — grows in from numeral to text */}
                <span
                  aria-hidden="true"
                  className={`benefits-connector ${visible ? "is-in" : ""}`}
                  style={{
                    alignSelf: "center",
                    marginTop: 2,
                    height: 1,
                    background: "var(--gold, #c4a265)",
                    opacity: 0.4,
                    animationDelay: `${0.6 + i * 0.25}s`,
                  }}
                />

                {/* Bullet text */}
                <p
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "clamp(1.1rem, 4.2vw, 1.4rem)",
                    color: "var(--ink, #1f1c18)",
                    lineHeight: 1.35,
                    fontWeight: 400,
                    flex: 1,
                  }}
                >
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* All animations are pure CSS — no JS raf, no dependencies, GPU-friendly */}
        <style>{`
          .benefits-fade {
            opacity: 0;
            transform: translateY(6px);
          }
          .benefits-fade.is-in {
            animation: benefitsFadeUp 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .benefits-line {
            opacity: 0;
            transform: translateY(14px);
          }
          .benefits-line.is-in {
            animation: benefitsFadeUp 950ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          .benefits-line-1.is-in { animation-delay: 0.12s; }
          .benefits-line-2.is-in { animation-delay: 0.24s; }
          .benefits-line-3.is-in { animation-delay: 0.34s; }

          .benefits-hairline {
            width: 0;
          }
          .benefits-hairline.is-in {
            animation: benefitsLineGrow 900ms cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
          }

          .benefits-bullet {
            opacity: 0;
            transform: translateY(10px);
          }
          .benefits-bullet.is-in {
            animation: benefitsFadeUp 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .benefits-connector {
            width: 0;
            display: inline-block;
          }
          .benefits-connector.is-in {
            animation: benefitsConnectorGrow 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          @keyframes benefitsFadeUp {
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes benefitsLineGrow {
            to { width: 64px; }
          }
          @keyframes benefitsConnectorGrow {
            to { width: 18px; }
          }

          @keyframes benefitsStarBreathe {
            0%, 100% { opacity: 0.35; transform: translateX(-50%) scale(1); }
            50% { opacity: 0.55; transform: translateX(-50%) scale(1.08); }
          }
          .benefits-star {
            animation: benefitsStarBreathe 5s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .benefits-fade, .benefits-line, .benefits-hairline,
            .benefits-bullet, .benefits-connector, .benefits-star {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
              width: auto !important;
            }
            .benefits-hairline { width: 64px !important; }
            .benefits-connector { width: 18px !important; }
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

      {/* ── CTA ── */}
      <div
        className="px-5 py-12 sm:py-16 text-center transition-all duration-1000"
        style={{
          background: "var(--cream2, #faf4e8)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(15px)",
          transitionDelay: "0.5s",
        }}
      >
        <button
          onClick={onCtaClick}
          className="group inline-flex items-center gap-2 px-8 sm:px-10 py-4 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "1.05rem",
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
    </section>
  );
};
