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

/* ── VSOP Credibility — woven into the page, not a separate block ── */
const VsopCredibility = () => (
  <div className="mt-10 mb-2">
    {/* Placeholder — section removed for redesign */}
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

          {/* Astronomy credibility — ?vsop=a|b|c to preview variants */}
          <VsopCredibility />
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
        </div>
      </div>
    </section>
  );
};
