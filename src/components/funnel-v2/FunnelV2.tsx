import { useRef, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalizedPrice } from "@/hooks/useLocalizedPrice";
import { supabase } from "@/integrations/supabase/client";
import { ProductReveal } from "./ProductReveal";
import { CompactReviews } from "./CompactReviews";
import { InlineCheckout } from "./InlineCheckout";
import { LiveActivityToast } from "./LiveActivityToast";
import { GoldDivider } from "./GoldDivider";
import { GriefSection } from "./GriefSection";

/**
 * V2 COPY — single universal set. A/B test retired, 100% of traffic
 * sees this copy.
 */
const COPY = {
  ctaPrimary: "Begin Their Reading",
} as const;

export const FunnelV2 = () => {
  const copy = COPY;
  const checkoutRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const [exitEmail, setExitEmail] = useState("");
  const [exitSubmitted, setExitSubmitted] = useState(false);
  const [showScrollNudge, setShowScrollNudge] = useState(false);
  const [scrollNudgeDismissed, setScrollNudgeDismissed] = useState(false);
  const [charityId, setCharityId] = useState("ifaw");
  const [charityBonus, setCharityBonus] = useState(0);
  // Mirrors the tier price chosen inside <InlineCheckout/> so the sticky
  // bottom CTA and the FinalCTA display the right number.
  const [selectedPrice, setSelectedPrice] = useState(29);
  const isMobile = useIsMobile();
  const { fmtUsd } = useLocalizedPrice();

  const scrollToCheckout = useCallback(() => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Show sticky CTA after scrolling past the hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollPct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setShowStickyCta(window.scrollY > window.innerHeight * 0.7);

      // Mobile scroll nudge at ~60% depth
      if (isMobile && scrollPct > 0.55 && scrollPct < 0.75 && !scrollNudgeDismissed && !showScrollNudge) {
        setShowScrollNudge(true);
        setTimeout(() => { setShowScrollNudge(false); setScrollNudgeDismissed(true); }, 5000);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, scrollNudgeDismissed, showScrollNudge]);

  // Exit intent — desktop only
  useEffect(() => {
    if (exitIntentShown || isMobile) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShowExitIntent(true);
        setExitIntentShown(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [exitIntentShown, isMobile]);

  const handleExitSubmit = async () => {
    if (!exitEmail.trim() || !exitEmail.includes("@")) return;
    setExitSubmitted(true);

    try {
      await supabase.from("email_leads").insert({
        email: exitEmail.trim().toLowerCase(),
        source: "v2_exit_intent",
        created_at: new Date().toISOString(),
      });
    } catch {
      try { localStorage.setItem("ls_exit_email", exitEmail.trim()); } catch {}
    }

    setTimeout(() => setShowExitIntent(false), 2500);
  };

  return (
    <div className="bg-[var(--cream,#FFFDF5)]">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9999,
          opacity: 0.03,
          mixBlendMode: "multiply",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: 256,
        }}
      />

      {/* Sections — padded for fixed navbar (gift banner + nav bar) + a breathing gap before reviews */}
      <div ref={heroRef} style={{ paddingTop: 104 }}>
        <CompactReviews row={1} />
      </div>
      <CompactReviews row={2} />
      <div className="py-4" style={{ background: "var(--cream, #FFFDF5)" }}>
        <GoldDivider />
      </div>
      <ProductReveal onCtaClick={scrollToCheckout} ctaLabel={copy.ctaPrimary} />

      <GriefSection onCtaClick={scrollToCheckout} />

      <InlineCheckout
        ref={checkoutRef}
        ctaLabel={copy.ctaPrimary}
        charityId={charityId}
        charityBonus={charityBonus}
        onSelectedPriceChange={setSelectedPrice}
      />

      <div className="py-4" style={{ background: "var(--cream, #FFFDF5)" }}>
        <GoldDivider />
      </div>
      <FAQSection />

      {/* Final emotional CTA */}
      <FinalCTA onCtaClick={scrollToCheckout} ctaLabel={copy.ctaPrimary} priceLabel={fmtUsd(selectedPrice + charityBonus)} />

      {/* Floating momentum signal */}
      <LiveActivityToast />

      {/* Footer */}
      <footer
        className="text-center py-10 px-4"
        style={{
          borderTop: "1px solid var(--cream3, #f3eadb)",
          paddingBottom: showStickyCta && isMobile ? 80 : 40,
        }}
      >
        <div className="flex flex-wrap justify-center gap-4 text-[0.82rem]">
          {[
            { href: "/terms", label: "Terms" },
            { href: "/privacy", label: "Privacy" },
            { href: "/contact", label: "Contact" },
            { href: "/blog", label: "Blog" },
            { href: "/become-affiliate", label: "Affiliates" },
            { href: "/find-report", label: "Find My Report" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ color: "var(--muted, #958779)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink, #1f1c18)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted, #958779)")}
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="mt-4" style={{ fontSize: "0.75rem", color: "var(--faded, #bfb2a3)" }}>
          Little Souls
        </p>
      </footer>

      {/* Sticky bottom CTA (mobile, appears after hero) */}
      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 transition-all duration-300"
          style={{
            zIndex: 50,
            background: "rgba(255,253,245,0.97)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderTop: "1px solid var(--cream3, #f3eadb)",
            padding: "10px 16px",
            paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
            transform: showStickyCta ? "translateY(0)" : "translateY(100%)",
            opacity: showStickyCta ? 1 : 0,
          }}
        >
          <button
            onClick={scrollToCheckout}
            className="w-full py-3.5 rounded-full text-white font-bold transition-all duration-200 active:scale-[0.98]"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.95rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "var(--rose, #bf524a)",
              boxShadow: "0 2px 16px rgba(191,82,74,0.2)",
              minHeight: 52,
            }}
          >
            {copy.ctaPrimary} · {fmtUsd(selectedPrice + charityBonus)}
          </button>
        </div>
      )}

      {/* Mobile scroll nudge */}
      {showScrollNudge && isMobile && (
        <div
          className="fixed top-4 left-4 right-4 rounded-xl p-3 text-center shadow-lg"
          style={{
            zIndex: 60,
            background: "rgba(255,253,245,0.97)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--cream3, #f3eadb)",
            animation: "nudgeSlideDown 0.4s ease-out",
          }}
          onClick={() => { scrollToCheckout(); setShowScrollNudge(false); setScrollNudgeDismissed(true); }}
        >
          <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.88rem", color: "var(--ink, #1f1c18)", marginBottom: 2 }}>
            Their reading is waiting
          </p>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.78rem", color: "var(--rose, #bf524a)", fontWeight: 600 }}>
            Tap to reveal their cosmic soul
          </p>
        </div>
      )}

      <style>{`
        @keyframes nudgeSlideDown {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Exit intent overlay — desktop only */}
      {showExitIntent && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 10000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowExitIntent(false); }}
        >
          <div
            className="relative max-w-sm w-full rounded-2xl p-6 text-center"
            style={{
              background: "var(--cream, #FFFDF5)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              animation: "exitSlideUp 0.4s ease-out",
            }}
          >
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full transition-opacity hover:opacity-70"
              style={{ color: "var(--muted, #958779)" }}
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-4">
              <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="var(--rose, #bf524a)" opacity={0.8}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {exitSubmitted ? (
              <div>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.3rem", color: "var(--black, #141210)", marginBottom: 8 }}>
                  Check your inbox!
                </h3>
                <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.95rem", color: "var(--earth, #6e6259)" }}>
                  Your pet's free mini reading is on the way.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.3rem", color: "var(--black, #141210)", marginBottom: 8, lineHeight: 1.2 }}>
                  Before you go...
                </h3>
                <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.95rem", color: "var(--earth, #6e6259)", lineHeight: 1.6, marginBottom: 16 }}>
                  Enter your email and we'll send a <strong>free mini cosmic reading</strong> with
                  their sun sign personality and today's forecast.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={exitEmail}
                    onChange={(e) => setExitEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleExitSubmit(); }}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl outline-none"
                    style={{
                      fontFamily: "Cormorant, Georgia, serif",
                      fontSize: "0.95rem",
                      border: "1.5px solid var(--cream3, #f3eadb)",
                      color: "var(--ink, #1f1c18)",
                      minHeight: 48,
                    }}
                  />
                  <button
                    onClick={handleExitSubmit}
                    className="px-5 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                    style={{
                      fontFamily: "Cormorant, Georgia, serif",
                      fontWeight: 700,
                      background: "var(--rose, #bf524a)",
                      whiteSpace: "nowrap",
                      minHeight: 48,
                    }}
                  >
                    Send it
                  </button>
                </div>
                <p className="mt-3" style={{ fontSize: "0.72rem", color: "var(--faded, #bfb2a3)" }}>
                  No spam. Unsubscribe anytime.
                </p>
              </>
            )}
          </div>

          <style>{`
            @keyframes exitSlideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

/* ──────── FAQ ──────── */

const FAQ_ITEMS = [
  {
    q: "What's inside the reading?",
    a: "Honestly — more than you'd expect. A full cosmic portrait with 30+ sections: their personality, emotional blueprint, soul purpose, love language, hidden fears, the things they wish you knew. Plus SoulSpeak, where you can ask them literally anything and hear what they'd say back. And tucked inside each reading are a handful of little surprises we don't advertise — small, strange, oddly specific things we've made just for them. Some will make you laugh. Some will make you tear up.",
  },
  {
    q: "How does it arrive?",
    a: "Not in your inbox — that would be too ordinary. Your reading unfolds through a private cinematic reveal, a slow and emotional unveiling made to be felt, not skimmed. You'll verify your email first (so only you can open it), and if you create a free account you can come back anytime, from any device. It's yours forever.",
  },
  {
    q: "Do I need their exact birthday?",
    a: "At the very least, we need their day of birth. If you don't know it exactly, an estimated date or adoption date works too — we'll still give you a beautiful reading, it just won't be quite as precise. Birth time is optional and just makes it sharper. The more accurate the date, the more accurate the stars.",
  },
  {
    q: "Soul Reading or Soul Bond?",
    a: "Both are gorgeous. Soul Reading gives you the full cosmic portrait plus SoulSpeak. Soul Bond layers on top: a deep compatibility analysis between you two, your cosmic connection decoded, and priority generation. Go Soul Bond if you want to understand the why of you and them, together.",
  },
  {
    q: "What if it doesn't feel accurate?",
    a: "We'd want to know. If the reading doesn't resonate with you, reach out — reply to any email from us or use the contact form — and we'll make it right. Every reading has our name on it, and we treat them that way.",
  },
  {
    q: "Can I get a reading for a pet who's passed away?",
    a: "Yes. Little Souls has a dedicated memorial reading — a separate, grief-aware product for pets who are no longer at your side. It's written reverently, never playfully, and SoulSpeak lets you hear their voice once more.",
  },
  {
    q: "I have more than one pet — how does that work?",
    a: "Beautifully. Add as many as you like at checkout and the price eases as you go — 15% off for two, 20% for three, 25% for four, 30% for five or more. Each pet gets their own careful reading, but the experience ties together: one gentle intake flow, one Cosmic Household weekly digest (one Sunday email covering everyone), shared SoulSpeak credits your pets can all draw from, and — once you've unlocked two readings — you can pair any two of them for a cross-pet bond reading that shows how they move through the world together.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-10 sm:py-14 md:py-18 px-5 scroll-mt-24" style={{ background: "var(--cream, #FFFDF5)" }}>
      <div className="max-w-xl mx-auto">
        <h2
          className="text-center mb-7"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.35rem, 5vw, 1.8rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
          }}
        >
          Common Questions
        </h2>

        <div className="space-y-0">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border-b" style={{ borderColor: "var(--cream3, #f3eadb)" }}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 py-4 text-left transition-opacity hover:opacity-80"
                >
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.95rem", color: "var(--ink, #1f1c18)" }}>
                    {item.q}
                  </span>
                  <svg
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                    style={{ color: "var(--muted, #958779)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isOpen ? 200 : 0, opacity: isOpen ? 1 : 0 }}>
                  <p className="pb-4" style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.9rem", color: "var(--earth, #6e6259)", lineHeight: 1.6 }}>
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ──────── Final CTA ──────── */

const FinalCTA = ({ onCtaClick, ctaLabel, priceLabel }: { onCtaClick: () => void; ctaLabel: string; priceLabel: string }) => (
  <section
    className="py-14 sm:py-20 md:py-24 px-5 text-center"
    style={{ background: "var(--cream, #FFFDF5)" }}
  >
    <div className="max-w-lg mx-auto">
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
        {ctaLabel} · {priceLabel}
        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  </section>
);
