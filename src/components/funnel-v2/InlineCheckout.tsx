import { useState, useEffect, useRef, forwardRef } from "react";
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

interface InlineCheckoutProps {
  ctaLabel: string;
  subheader: string;
}

export const InlineCheckout = forwardRef<HTMLDivElement, InlineCheckoutProps>(({ ctaLabel, subheader }, forwardedRef) => {
  const [selectedTier, setSelectedTier] = useState<"basic" | "premium">("basic");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { ref: revealRef, visible } = useScrollReveal(0.05);
  const isInApp = useIsInAppBrowser();

  const selectedPrice = TIERS.find((t) => t.id === selectedTier)!.price;

  const trackFunnelEvent = async (eventType: string, eventData: Record<string, unknown>) => {
    try {
      const funnelV2Variant = (() => {
        try { return localStorage.getItem("funnel_v2_variant"); } catch { return null; }
      })();
      const sessionId = sessionStorage.getItem("analytics_session_id") || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await supabase.from("page_analytics").insert([{
        session_id: sessionId,
        event_type: eventType,
        page_path: "/v2",
        event_data: { ...eventData, funnel_v2_variant: funnelV2Variant } as never,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
      }]);
    } catch (e) {
      console.warn("[V2 analytics] tracking failed", e);
    }
  };

  const handleTierChange = (tier: "basic" | "premium") => {
    setSelectedTier(tier);
    trackFunnelEvent("v2_tier_selected", { tier, price: TIERS.find((t) => t.id === tier)?.price });
  };

  const handleCheckout = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email");
      trackFunnelEvent("v2_checkout_error", { reason: "invalid_email" });
      return;
    }
    setError("");
    setIsLoading(true);
    trackFunnelEvent("v2_checkout_clicked", { tier: selectedTier, price: selectedPrice, isInApp });

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
      className="relative py-12 sm:py-16 md:py-20 px-5"
      style={{
        background: "linear-gradient(to bottom, var(--cream2, #faf4e8), var(--cream, #FFFDF5))",
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-7 sm:mb-8 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.5rem, 5.5vw, 2rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              marginBottom: 8,
              lineHeight: 1.15,
            }}
          >
            Begin Their Reading
          </h2>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(0.95rem, 3.2vw, 1.02rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.5,
              maxWidth: 420,
              margin: "0 auto",
            }}
          >
            {subheader}
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6">
          {TIERS.map((tier, i) => {
            const isSelected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => handleTierChange(tier.id)}
                aria-pressed={isSelected}
                aria-label={`Select ${tier.name} — $${tier.price}`}
                className="relative text-left rounded-xl p-3.5 sm:p-4 transition-all duration-300 active:scale-[0.99]"
                style={{
                  background: "#fff",
                  border: isSelected ? "2px solid var(--rose, #bf524a)" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: isSelected ? "0 0 0 3px rgba(191,82,74,0.1), 0 4px 20px rgba(0,0,0,0.06)" : "0 1px 8px rgba(0,0,0,0.03)",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(15px)",
                  transitionDelay: `${0.1 + i * 0.08}s`,
                  minHeight: 180,
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
                <div className="flex items-center gap-2 mb-2.5">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                    style={{ borderColor: isSelected ? "var(--rose, #bf524a)" : "var(--sand, #d6c8b6)" }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: "var(--rose, #bf524a)" }} />}
                  </div>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.92rem", color: "var(--ink, #1f1c18)" }}>
                    {tier.name}
                  </span>
                </div>

                {/* Price — larger anchor */}
                <div className="mb-3 flex items-baseline gap-1">
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.85rem", color: "var(--ink, #1f1c18)", lineHeight: 1 }}>
                    ${tier.price}
                  </span>
                  <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.68rem", color: "var(--muted, #958779)", fontWeight: 500 }}>
                    one-time
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-1.5">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-1.5" style={{ fontSize: "0.78rem", color: "var(--earth, #6e6259)", lineHeight: 1.35 }}>
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

        {/* In-app browser hint */}
        {isInApp && (
          <div
            className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{
              background: "rgba(196,162,101,0.08)",
              border: "1px solid rgba(196,162,101,0.2)",
            }}
          >
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--gold,#c4a265)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.78rem", color: "var(--earth, #6e6259)", lineHeight: 1.4 }}>
              We'll open secure Stripe checkout in your browser for payment.
            </p>
          </div>
        )}

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
          className="w-full py-4 rounded-2xl text-white font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "1.15rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            background: "var(--rose, #bf524a)",
            boxShadow: "0 4px 24px rgba(191,82,74,0.25)",
            minHeight: 58,
          }}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2.5">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Taking you to secure checkout…
            </span>
          ) : (
            `${ctaLabel} · $${selectedPrice}`
          )}
        </button>

        {/* Risk reversal */}
        <p
          className="text-center mt-3"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "0.85rem",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.5,
          }}
        >
          If the reading doesn't feel like <em>them</em>, we refund every cent.
          <br className="hidden sm:inline" />
          <span className="sm:hidden"> </span>
          12,847 readings. Under 1% refunded.
        </p>

        {/* Post CTA clarity */}
        <p
          className="text-center mt-3"
          style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.8rem", color: "var(--muted, #958779)" }}
        >
          No account needed. Tell us about your pet right after checkout (60 seconds).
        </p>

        {/* Trust row — elegant hand-drawn line icons */}
        <div className="flex items-center justify-center gap-5 sm:gap-7 mt-5">
          {[
            {
              label: "Secure checkout",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="10.5" width="14" height="9" rx="1.5" />
                  <path d="M8 10.5V7a4 4 0 018 0v3.5" />
                </svg>
              ),
            },
            {
              label: "Ready in minutes",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              ),
            },
            {
              label: "Full refund guarantee",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.5 10.8c0 5.2-8.5 10.2-8.5 10.2s-8.5-5-8.5-10.2a4.8 4.8 0 018.5-3.1 4.8 4.8 0 018.5 3.1z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center mb-1.5"
                style={{
                  width: 34,
                  height: 34,
                  color: "var(--rose, #bf524a)",
                }}
                aria-hidden="true"
              >
                <div style={{ width: 22, height: 22 }}>{item.icon}</div>
              </div>
              <span
                style={{
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "var(--earth, #6e6259)",
                  letterSpacing: "0.02em",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Payment method line — single elegant sentence, no broken badges */}
        <div
          className="flex items-center justify-center gap-2 mt-5"
          style={{ opacity: 0.75 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted, #958779)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18" />
          </svg>
          <p
            className="text-center"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.76rem",
              color: "var(--muted, #958779)",
              letterSpacing: "0.01em",
            }}
          >
            Apple Pay · Google Pay · Klarna · every major card — secured by Stripe
          </p>
        </div>

        {/* Multi-pet note */}
        <p
          className="text-center mt-5 mb-2"
          style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.82rem", color: "var(--muted, #958779)" }}
        >
          Multiple fur babies? Save up to 30% with multi-pet pricing at checkout.
        </p>

      </div>
    </section>
  );
});

InlineCheckout.displayName = "InlineCheckout";
