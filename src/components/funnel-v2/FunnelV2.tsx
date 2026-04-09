import { useRef, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useFunnelV2Variant } from "@/hooks/useFunnelV2Variant";
import { HeroV2 } from "./HeroV2";
import { EmotionBridge } from "./EmotionBridge";
import { ProductReveal } from "./ProductReveal";
import { TransformationStories } from "./TransformationStories";
import { CompactReviews } from "./CompactReviews";
import { InlineCheckout } from "./InlineCheckout";
import { AstrologyCredibility } from "./AstrologyCredibility";
import { HowItWorks } from "./HowItWorks";
import { LiveActivityToast } from "./LiveActivityToast";
import { GoldDivider } from "./GoldDivider";

/**
 * V2 copy variants — A (control) / B (test).
 * Tested: hero headline, hero subhead, primary CTA, checkout subheader.
 * Tracked via usePageAnalytics (funnel_v2_variant field on every event).
 */
/**
 * Copy variants use a simple inline-HTML convention for typographic
 * emphasis: wrap power phrases in <b>…</b> and HeroV2 renders them
 * via dangerouslySetInnerHTML so skimmers catch the bolded path.
 */
const COPY = {
  A: {
    heroLine1: "There's a Reason",
    heroLine2: "They Chose You.",
    heroSub:
      "A deeply personal cosmic reading that reveals <b>who they really are</b>, what they feel, and <b>the words they've always wanted to say</b>.",
    ctaPrimary: "Reveal Their Soul",
    checkoutSub:
      "Read what they'd say. Know what they mean. <b>Love them with the full story.</b>",
  },
  B: {
    heroLine1: "Before Them,",
    heroLine2: "You Didn't Know Love Could Look Like This.",
    heroSub:
      "The deeply personal cosmic reading that <b>shows you who they really are</b>, and finally lets them <b>speak in their own words</b>.",
    ctaPrimary: "Begin Their Reading",
    checkoutSub:
      "Finally hear them in their own words. <b>Understand the little soul you've been loving all along.</b>",
  },
} as const;

export const FunnelV2 = () => {
  const { variant } = useFunnelV2Variant();
  const copy = COPY[variant];
  const checkoutRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const [exitEmail, setExitEmail] = useState("");
  const [exitSubmitted, setExitSubmitted] = useState(false);
  const [showScrollNudge, setShowScrollNudge] = useState(false);
  const [scrollNudgeDismissed, setScrollNudgeDismissed] = useState(false);
  const isMobile = useIsMobile();

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

      {/* Gift banner — fixed at top */}
      <a
        href="/gift"
        className="fixed top-0 left-0 right-0 flex items-center justify-center gap-2 py-2 px-4 text-white transition-colors duration-300 hover:opacity-90"
        style={{
          zIndex: 1000,
          background: "var(--rose, #bf524a)",
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "0.82rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textDecoration: "none",
        }}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <span style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}>
          Know a pet parent who'd love this? Send as a gift
        </span>
        <span className="transition-transform duration-300">→</span>
      </a>

      {/* Sections — padded for fixed banner */}
      <div ref={heroRef} style={{ paddingTop: 34 }}>
        <HeroV2
          onCtaClick={scrollToCheckout}
          headlineLine1={copy.heroLine1}
          headlineLine2={copy.heroLine2}
          subhead={copy.heroSub}
          ctaLabel={copy.ctaPrimary}
        />
      </div>
      <EmotionBridge />
      <div className="py-4" style={{ background: "var(--cream, #FFFDF5)" }}>
        <GoldDivider />
      </div>
      <ProductReveal onCtaClick={scrollToCheckout} ctaLabel={copy.ctaPrimary} />
      <TransformationStories />
      <CompactReviews />
      <InlineCheckout
        ref={checkoutRef}
        ctaLabel={copy.ctaPrimary}
        subheader={copy.checkoutSub}
      />

      {/* Below checkout: objection-handlers for hesitators */}
      <div className="py-4" style={{ background: "var(--cream, #FFFDF5)" }}>
        <GoldDivider />
      </div>
      <AstrologyCredibility />
      <HowItWorks />
      <FAQSection />

      {/* Final emotional CTA */}
      <FinalCTA onCtaClick={scrollToCheckout} ctaLabel={copy.ctaPrimary} />

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
            {copy.ctaPrimary} · From $27
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
    q: "What exactly do I receive?",
    a: "A deeply personal cosmic reading with 30+ sections covering personality, emotional blueprint, soul purpose, love language, hidden fears, and more. Plus SoulSpeak chat where you can ask your pet anything and hear what they'd say. Revealed through a cinematic experience the moment it's ready.",
  },
  {
    q: "Do I need my pet's exact birthday?",
    a: "No. A birthday is ideal, but an estimated date or adoption date works well too. Birth time is optional. Even approximate dates produce readings our customers call 'scarily accurate.'",
  },
  {
    q: "What's the difference between Soul Reading and Soul Bond?",
    a: "Soul Reading ($27) gives you the full cosmic portrait plus SoulSpeak chat. Soul Bond ($35) adds a deep compatibility analysis between you and your pet, plus a custom cosmic portrait.",
  },
  {
    q: "What if it's not accurate?",
    a: "Full refund, no questions asked. We've delivered 12,000+ readings and our refund rate is under 1%. But if yours doesn't resonate, you don't pay.",
  },
  {
    q: "Can I get a reading for a pet who's passed away?",
    a: "Yes. Every reading includes a memorial mode for pets who've crossed the rainbow bridge. The reading is written to honour their memory, and SoulSpeak lets you hear their voice one more time.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-10 sm:py-14 md:py-18 px-5" style={{ background: "var(--cream, #FFFDF5)" }}>
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

const FinalCTA = ({ onCtaClick, ctaLabel }: { onCtaClick: () => void; ctaLabel: string }) => (
  <section
    className="py-12 sm:py-16 md:py-20 px-5 text-center"
    style={{ background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8))" }}
  >
    <div className="max-w-lg mx-auto">
      {/* Emotional close */}
      <p
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontSize: "clamp(1.4rem, 6vw, 2rem)",
          color: "var(--black, #141210)",
          lineHeight: 1.2,
          marginBottom: 10,
        }}
      >
        They can't tell you who they are.
      </p>
      <p
        style={{
          fontFamily: '"DM Serif Display", Georgia, serif',
          fontStyle: "italic",
          fontSize: "clamp(1.4rem, 6vw, 2rem)",
          color: "var(--rose, #bf524a)",
          lineHeight: 1.2,
          marginBottom: 22,
        }}
      >
        But the stars can.
      </p>

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

      <p className="mt-4" style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", fontStyle: "italic", color: "var(--muted, #958779)" }}>
        Also available in memorial mode for pets who've crossed the rainbow bridge.
      </p>
    </div>
  </section>
);
