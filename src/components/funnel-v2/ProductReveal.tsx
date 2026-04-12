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

      {/* ── Block 2: The Benefits ── two editorial statements, no headline ── */}
      <div
        className="relative overflow-hidden px-5 py-20 sm:py-24 md:py-28"
        style={{
          background: "linear-gradient(180deg, var(--cream, #FFFDF5) 0%, #faf4e8 100%)",
        }}
      >
        <div className="relative max-w-[620px] mx-auto">
          {(() => {
            const items = [
              { lead: "Love them", rest: "in the way they actually feel it." },
              { lead: "Know what they need", rest: " — without guessing, without wondering." },
            ] as const;
            return (
              <>
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={`benefit-card ${visible ? "is-in" : ""}`}
                    style={{
                      animationDelay: `${0.12 + i * 0.28}s`,
                      marginBottom: i < items.length - 1 ? "clamp(28px, 6vw, 48px)" : 0,
                    }}
                  >
                    {/* Floating ornamental flourish */}
                    <div className="flex justify-center" aria-hidden="true">
                      <svg
                        width="44"
                        height="12"
                        viewBox="0 0 44 12"
                        className="benefit-flourish"
                        style={{ animationDelay: `${0.18 + i * 0.28}s` }}
                      >
                        <line x1="0" y1="6" x2="16" y2="6" stroke="var(--gold, #c4a265)" strokeWidth="0.8" opacity="0.5" />
                        <path d="M22 1.5l1.3 3.2L26.5 6l-3.2 1.3L22 10.5l-1.3-3.2L17.5 6l3.2-1.3z" fill="var(--gold, #c4a265)" opacity="0.85" />
                        <line x1="28" y1="6" x2="44" y2="6" stroke="var(--gold, #c4a265)" strokeWidth="0.8" opacity="0.5" />
                      </svg>
                    </div>

                    {/* Statement */}
                    <p
                      className="text-center"
                      style={{
                        marginTop: 18,
                        marginBottom: 0,
                        fontFamily: '"DM Serif Display", Georgia, serif',
                        fontSize: "clamp(1.3rem, 5.2vw, 1.85rem)",
                        color: "var(--ink, #1f1c18)",
                        lineHeight: 1.3,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      <span
                        className="benefit-lead"
                        style={{
                          fontStyle: "italic",
                          color: "var(--rose, #bf524a)",
                          fontWeight: 400,
                          marginRight: 2,
                        }}
                      >
                        {item.lead}
                      </span>
                      <span style={{ color: "var(--ink, #1f1c18)", fontWeight: 400 }}>
                        {item.rest}
                      </span>
                    </p>
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {/* Pure-CSS animations. Transform + opacity only, GPU-friendly. */}
        <style>{`
          .benefit-card {
            opacity: 0;
            transform: translateY(18px);
            will-change: opacity, transform;
          }
          .benefit-card.is-in {
            animation: benefitCardIn 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .benefit-flourish {
            opacity: 0;
            transform: scaleX(0.6);
            transform-origin: center;
          }
          .benefit-card.is-in .benefit-flourish {
            animation: benefitFlourishIn 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }

          .benefit-lead {
            position: relative;
            display: inline-block;
            background-image: linear-gradient(120deg,
              rgba(191,82,74,0.22) 0%,
              rgba(196,162,101,0.22) 50%,
              rgba(191,82,74,0.22) 100%);
            background-repeat: no-repeat;
            background-position: 0 88%;
            background-size: 0% 22%;
            transition: none;
          }
          .benefit-card.is-in .benefit-lead {
            animation: benefitLeadUnderline 1200ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
            animation-delay: inherit;
          }

          @keyframes benefitCardIn {
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes benefitFlourishIn {
            to { opacity: 1; transform: scaleX(1); }
          }
          @keyframes benefitLeadUnderline {
            0% { background-size: 0% 22%; }
            100% { background-size: 100% 22%; }
          }

          @media (prefers-reduced-motion: reduce) {
            .benefit-card, .benefit-flourish, .benefit-lead {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
            .benefit-lead { background-size: 100% 22% !important; }
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
