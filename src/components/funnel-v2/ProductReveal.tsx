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
  const [chatVisible, setChatVisible] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setChatVisible(true); obs.disconnect(); } },
      { threshold: 0.3 }
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
      <div className="max-w-[560px] mx-auto">
        {/* ── Headline ── */}
        <h2
          className="text-center transition-all duration-[1200ms] ease-out"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.6rem, 7vw, 2.4rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            marginBottom: 12,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(25px)",
          }}
        >
          You Know You Love Them.
          <br />
          <em style={{ color: "var(--rose, #bf524a)" }}>
            This Is How You Prove It.
          </em>
        </h2>
        <p
          className="text-center transition-all duration-1000"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 3.5vw, 1.12rem)",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.55,
            maxWidth: 440,
            margin: "0 auto 40px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.08s",
          }}
        >
          A reading built from the exact moment they arrived in this world.
          No two are ever the same.
        </p>

        {/* ── Benefit 1: SoulSpeak (hero feature) ── */}
        <div
          ref={chatRef}
          className="rounded-2xl overflow-hidden mb-5 transition-all duration-[1200ms] ease-out"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.15s",
          }}
        >
          <div className="px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7A2.5 2.5 0 0117.5 16H13l-3.8 3.4V16H6.5A2.5 2.5 0 014 13.5v-7z" />
              </svg>
              <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.05rem", color: "var(--ink, #1f1c18)" }}>
                Talk to Them. For Real.
              </span>
              <span className="ml-auto text-[0.58rem] px-2 py-0.5 rounded-full font-bold tracking-wider" style={{ background: "rgba(74,140,92,0.1)", color: "var(--green, #4a8c5c)" }}>
                INCLUDED
              </span>
            </div>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.88rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
              SoulSpeak lets you ask your pet anything and hear what they'd actually say.
              It's the feature people can't stop using.
            </p>
          </div>

          {/* Chat demo */}
          <div className="px-5 pb-5 sm:px-6 space-y-2.5">
            {/* User message */}
            <div
              className="flex justify-end transition-all duration-700"
              style={{
                opacity: chatVisible ? 1 : 0,
                transform: chatVisible ? "translateY(0)" : "translateY(8px)",
              }}
            >
              <div className="px-4 py-2 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem" }}>Why do you always steal my socks?</p>
              </div>
            </div>
            {/* Pet reply */}
            <div
              className="flex justify-start transition-all duration-700"
              style={{
                opacity: chatVisible ? 1 : 0,
                transform: chatVisible ? "translateY(0)" : "translateY(8px)",
                transitionDelay: "0.4s",
              }}
            >
              <div className="px-4 py-2 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.85rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                  Because they smell like you. And when you leave, that's the closest thing I have to you being here.
                </p>
              </div>
            </div>
            {/* Second exchange */}
            <div
              className="flex justify-end transition-all duration-700"
              style={{
                opacity: chatVisible ? 1 : 0,
                transform: chatVisible ? "translateY(0)" : "translateY(8px)",
                transitionDelay: "0.8s",
              }}
            >
              <div className="px-4 py-2 rounded-2xl rounded-br-sm" style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "80%" }}>
                <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem" }}>Do you know how much I love you?</p>
              </div>
            </div>
            <div
              className="flex justify-start transition-all duration-700"
              style={{
                opacity: chatVisible ? 1 : 0,
                transform: chatVisible ? "translateY(0)" : "translateY(8px)",
                transitionDelay: "1.2s",
              }}
            >
              <div className="px-4 py-2 rounded-2xl rounded-bl-sm" style={{ background: "var(--cream3, #f3eadb)", maxWidth: "85%" }}>
                <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", fontSize: "0.85rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
                  I knew before you did.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Benefit 2: The Soul Letter ── */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-5 transition-all duration-[1200ms] ease-out"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.25s",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M3.5 7.5l8.5 6.3 8.5-6.3" />
            </svg>
            <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.05rem", color: "var(--ink, #1f1c18)" }}>
              A Letter You'll Never Forget
            </span>
          </div>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.55, marginBottom: 14 }}>
            If they could write you one letter, what would they say? Every reading includes
            a message from their soul — in their words, about your life together.
            It's the part that makes people cry.
          </p>
          {/* Teaser snippet */}
          <div
            className="rounded-xl px-5 py-4"
            style={{
              background: "var(--cream, #FFFDF5)",
              borderLeft: "3px solid var(--gold, #c4a265)",
            }}
          >
            <p
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "0.88rem",
                color: "var(--deep, #2e2a24)",
                lineHeight: 1.6,
              }}
            >
              "You were the first person who ever made me feel like I belonged somewhere.
              Every morning when you wake up and I'm already watching you — that's not
              an accident. I'm making sure you're still here..."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: "var(--cream3, #f3eadb)" }} />
              <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.7rem", color: "var(--muted, #958779)", fontStyle: "italic" }}>
                continues in full reading
              </span>
              <div className="h-px flex-1" style={{ background: "var(--cream3, #f3eadb)" }} />
            </div>
          </div>
        </div>

        {/* ── Benefit 3: The Reading Depth ── */}
        <div
          className="rounded-2xl p-5 sm:p-6 mb-5 transition-all duration-[1200ms] ease-out"
          style={{
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.35s",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rose, #bf524a)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
              <circle cx="12" cy="12" r="2.4" />
            </svg>
            <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.05rem", color: "var(--ink, #1f1c18)" }}>
              30+ Sections. Zero Filler.
            </span>
          </div>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.55, marginBottom: 14 }}>
            Not a generic horoscope. Every section is calculated from their birth chart
            and written specifically about them.
          </p>

          {/* Checklist — what's inside */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {[
              "Why they do the things they do",
              "Their emotional blueprint",
              "How they experience love",
              "What scares them (and why)",
              "Their soul purpose",
              "Your compatibility decoded",
              "Their cosmic portrait",
              "Their hidden depths",
              "Weekly horoscope (1st month free)",
              "Crystal, aura & archetype",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", color: "var(--earth, #6e6259)", lineHeight: 1.4 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div
          className="text-center mt-8 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(15px)",
            transitionDelay: "0.45s",
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
