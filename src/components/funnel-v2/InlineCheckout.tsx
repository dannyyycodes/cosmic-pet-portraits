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

        {/* Trust stack — payment methods + security */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-5">
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--earth, #6e6259)" }}>
            <svg className="w-3.5 h-3.5 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            256-bit secured
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--earth, #6e6259)" }}>
            <svg className="w-3.5 h-3.5 text-[var(--gold,#c4a265)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Revealed in minutes
          </span>
          <span className="inline-flex items-center gap-1.5" style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--earth, #6e6259)" }}>
            <svg className="w-3.5 h-3.5 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            100% money back
          </span>
        </div>

        {/* Payment method badges (visual trust) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {[
            { label: "Stripe", text: "Stripe" },
            { label: "Apple Pay", text: " Pay" },
            { label: "Google Pay", text: "G Pay" },
            { label: "Klarna", text: "Klarna" },
            { label: "Visa", text: "VISA" },
            { label: "Mastercard", text: "MC" },
          ].map((m) => (
            <span
              key={m.label}
              className="inline-flex items-center justify-center px-2 py-1 rounded"
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "var(--earth, #6e6259)",
                background: "#fff",
                border: "1px solid var(--cream3, #f3eadb)",
                letterSpacing: "0.02em",
                minWidth: 38,
              }}
              aria-label={m.label}
            >
              {m.text}
            </span>
          ))}
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
