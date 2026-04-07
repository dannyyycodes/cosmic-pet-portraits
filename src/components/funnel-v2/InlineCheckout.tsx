import { useState, useEffect, useRef, forwardRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { getReferralCode } from "@/lib/referralTracking";

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -20px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref: ref as React.RefObject<HTMLDivElement>, visible };
}

function useIsInAppBrowser() {
  const [isInApp, setIsInApp] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    setIsInApp(/BytedanceWebview|BytedanceWebkit|musical_ly|TikTok|FBAN|FBAV|Instagram|FB_IAB/i.test(ua));
  }, []);
  return isInApp;
}

const TIERS = [
  {
    id: "basic" as const,
    name: "Soul Reading",
    price: 27,
    features: [
      "Full cosmic personality profile",
      "Emotional blueprint & soul purpose",
      "SoulSpeak chat included",
      "Upload your pet's photo",
      "Weekly horoscope (1st month free)",
    ],
  },
  {
    id: "premium" as const,
    name: "Soul Bond",
    price: 35,
    badge: "Most Chosen",
    features: [
      "Everything in Soul Reading, plus:",
      "Pet & owner compatibility analysis",
      "Your cosmic connection decoded",
      "Custom cosmic portrait",
      "Priority generation",
    ],
  },
];

export const InlineCheckout = forwardRef<HTMLDivElement>((_, forwardedRef) => {
  const [selectedTier, setSelectedTier] = useState<"basic" | "premium">("basic");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { ref: revealRef, visible } = useScrollReveal(0.05);
  const isMobile = useIsMobile();
  const isInApp = useIsInAppBrowser();

  const selectedPrice = TIERS.find((t) => t.id === selectedTier)!.price;

  const handleCheckout = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const refCode = getReferralCode();
      const { data, error: invokeError } = await supabase.functions.invoke("create-checkout", {
        body: {
          quickCheckout: true,
          selectedTier,
          abVariant: "V2",
          includesPortrait: selectedTier === "premium",
          petCount: 1,
          email: email.trim(),
          referralCode: refCode || undefined,
        },
      });

      if (invokeError || !data?.url) {
        throw new Error(invokeError?.message || "No checkout URL returned");
      }

      if (isInApp) {
        window.open(data.url, "_blank", "noopener");
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("[V2 Checkout] Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sectionRef = (node: HTMLDivElement) => {
    (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <section
      ref={sectionRef}
      id="checkout"
      className="relative py-16 md:py-20 px-5"
      style={{
        background: "linear-gradient(to bottom, var(--cream2, #faf4e8), var(--cream, #FFFDF5))",
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-8 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.4rem, 5vw, 2rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              marginBottom: 6,
            }}
          >
            Begin Their Reading
          </h2>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontSize: "0.92rem",
              color: "var(--muted, #958779)",
            }}
          >
            Calculated from today's real planetary positions. 12,000+ delivered. Under 1% refund rate.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TIERS.map((tier, i) => {
            const isSelected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className="relative text-left rounded-xl p-4 transition-all duration-300"
                style={{
                  background: "#fff",
                  border: isSelected ? "2px solid var(--rose, #bf524a)" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: isSelected ? "0 0 0 3px rgba(191,82,74,0.1), 0 4px 20px rgba(0,0,0,0.06)" : "0 1px 8px rgba(0,0,0,0.03)",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(15px)",
                  transitionDelay: `${0.1 + i * 0.08}s`,
                }}
              >
                {tier.badge && (
                  <div
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-white whitespace-nowrap"
                    style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.04em", background: "var(--rose, #bf524a)" }}
                  >
                    {tier.badge}
                  </div>
                )}

                {/* Radio */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                    style={{ borderColor: isSelected ? "var(--rose, #bf524a)" : "var(--sand, #d6c8b6)" }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: "var(--rose, #bf524a)" }} />}
                  </div>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.88rem", color: "var(--ink, #1f1c18)" }}>
                    {tier.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.5rem", color: "var(--ink, #1f1c18)" }}>
                    ${tier.price}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-1.5">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-1.5" style={{ fontSize: "0.74rem", color: "var(--earth, #6e6259)" }}>
                      <svg className="w-3 h-3 mt-0.5 flex-shrink-0 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Email input */}
        <div
          className="mb-4 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)", transitionDelay: "0.3s" }}
        >
          <label
            htmlFor="v2-email"
            className="block mb-1.5"
            style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", fontWeight: 600, color: "var(--earth, #6e6259)" }}
          >
            Your email (we'll send the link here)
          </label>
          <input
            id="v2-email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "1rem",
              color: "var(--ink, #1f1c18)",
              background: "#fff",
              border: error ? "1.5px solid var(--rose, #bf524a)" : "1.5px solid var(--cream3, #f3eadb)",
              minHeight: 48,
            }}
            onFocus={(e) => { if (!error) e.target.style.borderColor = "var(--gold, #c4a265)"; }}
            onBlur={(e) => { if (!error) e.target.style.borderColor = "var(--cream3, #f3eadb)"; }}
          />
          {error && <p className="mt-1" style={{ fontSize: "0.78rem", color: "var(--rose, #bf524a)" }}>{error}</p>}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl text-white font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "1.15rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            background: "var(--rose, #bf524a)",
            boxShadow: "0 4px 24px rgba(191,82,74,0.25)",
            minHeight: 56,
          }}
        >
          {isLoading ? "Taking you to checkout..." : `Reveal Their Soul · $${selectedPrice}`}
        </button>

        {/* Post CTA clarity */}
        <p
          className="text-center mt-2.5"
          style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--muted, #958779)" }}
        >
          No account needed. Tell us about your pet after checkout (60 seconds). Reading revealed instantly.
        </p>

        {/* Trust stack */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-5 mb-6">
          {[
            { icon: "shield", text: "Stripe secured" },
            { icon: "zap", text: "Ready in minutes" },
            { icon: "check", text: "Money back guarantee" },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-1.5" style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--earth, #6e6259)" }}>
              {item.icon === "shield" && (
                <svg className="w-3.5 h-3.5 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {item.icon === "zap" && (
                <svg className="w-3.5 h-3.5 text-[var(--gold,#c4a265)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              {item.icon === "check" && (
                <svg className="w-3.5 h-3.5 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {item.text}
            </span>
          ))}
        </div>

        {/* Multi-pet note */}
        <p
          className="text-center mt-2 mb-4"
          style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--muted, #958779)" }}
        >
          Multiple fur babies? Save up to 30% with multi-pet pricing at checkout.
        </p>

      </div>
    </section>
  );
});

InlineCheckout.displayName = "InlineCheckout";
