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
          // Stagger the chat messages
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
    <section
      ref={ref}
      className="relative py-14 sm:py-20 md:py-24 px-5 overflow-hidden"
      style={{ background: "var(--cream2, #faf4e8)" }}
    >
      <div className="max-w-[520px] mx-auto">
        {/* ── Headline — names the ache ── */}
        <h2
          className="text-center transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.55rem, 7vw, 2.3rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            marginBottom: 14,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
          }}
        >
          You Love Them.
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>
            But Do You Really Know Them?
          </em>
        </h2>
        <p
          className="text-center transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "clamp(1rem, 3.5vw, 1.12rem)",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            maxWidth: 420,
            margin: "0 auto 44px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.08s",
          }}
        >
          Something brought you together. Their reading finally tells you what.
        </p>

        {/* ── Benefit 1: The Understanding ── */}
        <div
          className="mb-10 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.15s",
          }}
        >
          <h3
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.15rem, 4.5vw, 1.35rem)",
              color: "var(--ink, #1f1c18)",
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            You'll read it and say
            <em style={{ color: "var(--rose, #bf524a)" }}> "that is so them."</em>
          </h3>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.6,
            }}
          >
            Not a generic horoscope. A reading built from the exact moment
            they arrived in this world — their personality, their emotional
            needs, what makes them feel safe, what quietly stresses them out.
            The things you've always sensed but never had words for.
          </p>

          {/* Astronomy credibility — inline */}
          <div
            className="mt-8 rounded-2xl py-8 px-5 sm:px-7 text-center"
            style={{
              background: "linear-gradient(175deg, #1a1a2e 0%, #16213e 40%, #0f1829 100%)",
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(196,162,101,0.08)",
                border: "1px solid rgba(196,162,101,0.2)",
              }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="rgba(196,162,101,0.9)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(196,162,101,0.9)" }}>
                Powered by VSOP87
              </span>
            </div>

            <h3
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.2rem, 5vw, 1.6rem)",
                fontWeight: 400,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: 10,
              }}
            >
              The Same Sky That Shaped You
              <br />
              <span style={{ color: "rgba(196,162,101,0.9)" }}>Shaped Them Too.</span>
            </h3>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.55, maxWidth: 400, margin: "0 auto 20px" }}>
              Every reading is calculated from the exact planetary positions at
              the moment they were born — the same math professional astronomers
              use to map the real night sky.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {[
                { label: "Real Planetary Positions", desc: "Calculated to the minute they were born." },
                { label: "13 Celestial Bodies", desc: "Sun through Pluto, plus Chiron, North Node, and Lilith." },
                { label: "Birth Location Matters", desc: "Where they arrived sets their rising sign." },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg py-3 px-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(196,162,101,0.15)",
                  }}
                >
                  <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.82rem", color: "#fff", marginBottom: 3 }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                { name: "Sun", symbol: "\u2609\uFE0E" },
                { name: "Moon", symbol: "\u263D\uFE0E" },
                { name: "Mercury", symbol: "\u263F\uFE0E" },
                { name: "Venus", symbol: "\u2640\uFE0E" },
                { name: "Mars", symbol: "\u2642\uFE0E" },
                { name: "Jupiter", symbol: "\u2643\uFE0E" },
                { name: "Saturn", symbol: "\u2644\uFE0E" },
                { name: "Uranus", symbol: "\u2645\uFE0E" },
                { name: "Neptune", symbol: "\u2646\uFE0E" },
                { name: "Pluto", symbol: "\u2647\uFE0E" },
                { name: "Chiron", symbol: "\u26B7\uFE0E" },
                { name: "North Node", symbol: "\u260A\uFE0E" },
                { name: "Lilith", symbol: "\u26B8\uFE0E" },
              ].map((p) => (
                <span
                  key={p.name}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.6)",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(196,162,101,0.12)",
                  }}
                >
                  <span style={{ fontFamily: '"DejaVu Sans", "Noto Sans Symbols", system-ui, sans-serif', fontSize: "0.85rem", color: "rgba(196,162,101,0.8)", fontVariantEmoji: "text" as never }}>
                    {p.symbol}
                  </span>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Benefit 2: The Voice — experiential chat demo ── */}
        <div
          className="mb-10 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.25s",
          }}
        >
          <h3
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.15rem, 4.5vw, 1.35rem)",
              color: "var(--ink, #1f1c18)",
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            Ever wondered what they'd say
            <em style={{ color: "var(--rose, #bf524a)" }}> if they could talk?</em>
          </h3>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            Now you don't have to wonder. Ask them anything — why they do
            the weird things they do, how they feel about you, what they
            need.
          </p>

          {/* Chat demo — the experience, not a feature */}
          <div
            ref={chatRef}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="px-5 py-4 sm:px-6 space-y-2.5">
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 1 ? 1 : 0, transform: chatStep >= 1 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.88rem" }}>
                    Why do you always steal my socks?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 2 ? 1 : 0, transform: chatStep >= 2 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.88rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    Because they smell like you. And when you leave,
                    that's the closest thing I have to you being here.
                  </p>
                </div>
              </div>
              <div
                className="flex justify-end transition-all duration-500"
                style={{ opacity: chatStep >= 3 ? 1 : 0, transform: chatStep >= 3 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.88rem" }}>
                    Do you know how much I love you?
                  </p>
                </div>
              </div>
              <div
                className="flex justify-start transition-all duration-500"
                style={{ opacity: chatStep >= 4 ? 1 : 0, transform: chatStep >= 4 ? "translateY(0)" : "translateY(6px)" }}
              >
                <div className="px-4 py-2 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.88rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                    I knew before you did.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grief bridge ── */}
        <div
          className="mb-12 transition-all duration-[1200ms] ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.45s",
          }}
        >
          <p
            className="text-center"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
              color: "var(--muted, #958779)",
              lineHeight: 1.6,
              maxWidth: 400,
              margin: "0 auto",
            }}
          >
            For the one who's no longer here — their story didn't end.
            It's written in the stars. And it's waiting for you.
          </p>
        </div>

        {/* ── CTA ── */}
        <div
          className="text-center transition-all duration-1000"
          style={{
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
          <p
            className="mt-3"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.82rem",
              fontStyle: "italic",
              color: "var(--muted, #958779)",
            }}
          >
            100% refund if it doesn't feel like them. No questions.
          </p>
        </div>
      </div>
    </section>
  );
};
