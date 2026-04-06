import { useRef, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { HeroV2 } from "./HeroV2";
import { EmotionBridge } from "./EmotionBridge";
import { ProductReveal } from "./ProductReveal";
import { CompactReviews } from "./CompactReviews";
import { InlineCheckout } from "./InlineCheckout";

export const FunnelV2 = () => {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentShown, setExitIntentShown] = useState(false);
  const [exitEmail, setExitEmail] = useState("");
  const [exitSubmitted, setExitSubmitted] = useState(false);
  const isMobile = useIsMobile();

  const scrollToCheckout = useCallback(() => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Show sticky CTA after scrolling past the hero
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCta(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Exit intent detection (desktop: mouse leaves viewport top, mobile: back button)
  useEffect(() => {
    if (exitIntentShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !exitIntentShown) {
        setShowExitIntent(true);
        setExitIntentShown(true);
      }
    };

    // Desktop only
    if (!isMobile) {
      document.addEventListener("mouseleave", handleMouseLeave);
      return () => document.removeEventListener("mouseleave", handleMouseLeave);
    }
  }, [exitIntentShown, isMobile]);

  const handleExitSubmit = () => {
    if (!exitEmail.trim() || !exitEmail.includes("@")) return;
    // Store email for future follow-up (could send to Supabase)
    try {
      localStorage.setItem("ls_exit_email", exitEmail.trim());
    } catch {}
    setExitSubmitted(true);
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

      {/* Sections */}
      <div ref={heroRef}>
        <HeroV2 onCtaClick={scrollToCheckout} />
      </div>
      <EmotionBridge />
      <ProductReveal onCtaClick={scrollToCheckout} />
      <CompactReviews />
      <InlineCheckout ref={checkoutRef} />

      {/* FAQ Section */}
      <FAQSection />

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
          Little Souls — Cosmic Pet Portraits
        </p>
      </footer>

      {/* Sticky bottom CTA (appears after scrolling past hero) */}
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
            className="w-full py-3 rounded-full text-white font-bold transition-all duration-200 active:scale-[0.98]"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.95rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "var(--rose, #bf524a)",
              boxShadow: "0 2px 16px rgba(191,82,74,0.2)",
            }}
          >
            Get Their Soul Reading — $27
          </button>
        </div>
      )}

      {/* Exit intent overlay */}
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
            {/* Close */}
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

            {/* Heart icon */}
            <div className="mb-4">
              <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="var(--rose, #bf524a)" opacity={0.8}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {exitSubmitted ? (
              <div>
                <h3
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "1.3rem",
                    color: "var(--black, #141210)",
                    marginBottom: 8,
                  }}
                >
                  Check your inbox!
                </h3>
                <p
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.95rem",
                    color: "var(--earth, #6e6259)",
                  }}
                >
                  Your pet's free mini reading is on the way.
                </p>
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "1.3rem",
                    color: "var(--black, #141210)",
                    marginBottom: 8,
                    lineHeight: 1.2,
                  }}
                >
                  Wait — your pet's reading
                  <br />is almost ready
                </h3>
                <p
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.95rem",
                    color: "var(--earth, #6e6259)",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  Enter your email and we'll send a <strong>free mini cosmic reading</strong> —
                  their sun sign, one personality insight, and today's cosmic forecast.
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

/* ──────── FAQ Section ──────── */

const FAQ_ITEMS = [
  {
    q: "What exactly do I get?",
    a: "A 15+ page personalised cosmic report covering your pet's personality, emotional blueprint, soul purpose, love language, hidden fears, and much more. Premium includes a custom AI portrait and owner compatibility insights. Delivered instantly as a beautiful digital PDF.",
  },
  {
    q: "How is the reading created?",
    a: "We use your pet's birth details and species to generate a deeply personal astrological profile, then our AI crafts a one-of-a-kind reading that's unique to them. No two reports are ever the same.",
  },
  {
    q: "Do I need to know my pet's exact birth time?",
    a: "No! While an exact birth time gives the most detailed reading, we can create a beautiful and accurate report with just their birthday. An approximate time works great too.",
  },
  {
    q: "What if I don't know my pet's birthday?",
    a: "That's okay! You can use an estimated date or adoption date. Many pet parents discover that even approximate dates produce surprisingly accurate readings.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Absolutely. If your reading doesn't make you smile, we'll refund you in full — no questions asked. We're that confident you'll love it.",
  },
  {
    q: "Can I buy this as a gift?",
    a: 'Yes! Tap "Send as a gift" on the checkout section. You\'ll receive a beautiful digital gift card with a redemption code that your recipient can use anytime.',
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="py-14 md:py-18 px-5"
      style={{ background: "var(--cream, #FFFDF5)" }}
    >
      <div className="max-w-xl mx-auto">
        <h2
          className="text-center mb-8"
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: "clamp(1.3rem, 4.5vw, 1.8rem)",
            fontWeight: 400,
            color: "var(--black, #141210)",
          }}
        >
          Questions? We've got answers.
        </h2>

        <div className="space-y-0">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="border-b"
                style={{ borderColor: "var(--cream3, #f3eadb)" }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 py-4 text-left transition-opacity hover:opacity-80"
                >
                  <span
                    style={{
                      fontFamily: '"DM Serif Display", Georgia, serif',
                      fontSize: "0.95rem",
                      color: "var(--ink, #1f1c18)",
                    }}
                  >
                    {item.q}
                  </span>
                  <svg
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-300"
                    style={{
                      color: "var(--muted, #958779)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    maxHeight: isOpen ? 200 : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p
                    className="pb-4"
                    style={{
                      fontFamily: "Cormorant, Georgia, serif",
                      fontSize: "0.9rem",
                      color: "var(--earth, #6e6259)",
                      lineHeight: 1.6,
                    }}
                  >
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
