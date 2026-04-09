import { useState, useEffect, useRef, forwardRef, type ReactNode } from "react";
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

        {/* Real payment brand logos — legit trust row */}
        <PaymentBrandLogos />
        <p
          className="text-center mt-2"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "0.72rem",
            color: "var(--muted, #958779)",
            letterSpacing: "0.02em",
          }}
        >
          Secure checkout powered by Stripe
        </p>

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

/* ──────── Real brand logos (inline SVG) ────────
 * Used on merchant sites to indicate payment support. Simplified
 * wordmarks/marks rendered in each brand's official hex.
 */

const BadgeWrap = ({ children, label, width = 52 }: { children: ReactNode; label: string; width?: number }) => (
  <div
    aria-label={label}
    role="img"
    className="flex items-center justify-center"
    style={{
      width,
      height: 30,
      background: "#fff",
      border: "1px solid var(--cream3, #f3eadb)",
      borderRadius: 5,
      padding: "0 6px",
    }}
  >
    {children}
  </div>
);

const StripeLogo = () => (
  <BadgeWrap label="Stripe" width={56}>
    <svg viewBox="0 0 60 25" width="40" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#635BFF"
        d="M59.5 14.3c0-4.2-2-7.5-5.9-7.5-3.9 0-6.3 3.3-6.3 7.5 0 5 2.8 7.5 6.8 7.5 2 0 3.5-.4 4.6-1.1v-3.3c-1.1.6-2.4 1-4.1 1-1.6 0-3-.6-3.2-2.5h8.1c0-.2.1-1.1.1-1.6zm-8.2-1.5c0-1.8 1.1-2.6 2.1-2.6 1 0 2 .8 2 2.6h-4.1zM42.6 6.8c-1.6 0-2.7.8-3.3 1.3l-.2-1.1h-3.7v19.1l4.2-.9.01-4.6c.6.4 1.5 1 3 1 3 0 5.8-2.4 5.8-7.6 0-4.8-2.8-7.2-5.8-7.2zm-1 11.4c-1 0-1.6-.4-2-.8l0-6.4c.5-.4 1.1-.8 2-.8 1.5 0 2.6 1.7 2.6 4 0 2.3-1.1 4-2.6 4zM28.5 5.8l4.2-.9V1.5l-4.2.9v3.4zM28.5 7.1h4.2v14.4h-4.2V7.1zM24 8.3l-.3-1.2h-3.6v14.4h4.2V11.7c1-1.3 2.6-1 3.2-.9V7.1c-.6-.2-2.5-.6-3.5 1.2zM15.8 3.5l-4.1.9-.1 13.5c0 2.5 1.9 4.3 4.3 4.3 1.4 0 2.4-.3 3-.6v-3.4c-.6.2-3.1 1-3.1-1.5V10.7h3.1V7.1h-3.1l.1-3.6zM4.2 11.2c0-.7.6-1 1.5-1 1.3 0 3 .4 4.3 1.1v-4c-1.4-.6-2.9-.8-4.3-.8C2.2 6.6 0 8.4 0 11.4c0 4.8 6.5 4 6.5 6 0 .7-.7 1-1.7 1-1.4 0-3.3-.6-4.8-1.4v4c1.6.7 3.3 1 4.8 1 3.6 0 5.9-1.8 5.9-4.7 0-5.2-6.5-4.2-6.5-6.1z"
      />
    </svg>
  </BadgeWrap>
);

const VisaLogo = () => (
  <BadgeWrap label="Visa">
    <svg viewBox="0 0 48 16" width="40" height="14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text
        x="24"
        y="13"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="900"
        fontStyle="italic"
        fill="#1A1F71"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  </BadgeWrap>
);

const MastercardLogo = () => (
  <BadgeWrap label="Mastercard">
    <svg viewBox="0 0 40 25" width="34" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="15" cy="12.5" r="9.5" fill="#EB001B" />
      <circle cx="25" cy="12.5" r="9.5" fill="#F79E1B" />
      <path
        d="M20 5.4a9.5 9.5 0 010 14.2 9.5 9.5 0 010-14.2z"
        fill="#FF5F00"
      />
    </svg>
  </BadgeWrap>
);

const AppleIconPath =
  "M17.05 20.28c-.98.95-2.05.88-3.08.41-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM13 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z";

const ApplePayLogo = () => (
  <BadgeWrap label="Apple Pay" width={58}>
    <svg viewBox="0 0 50 22" width="44" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d={AppleIconPath} fill="#000" transform="translate(1, 1.5) scale(0.72)" />
      <text
        x="16"
        y="15"
        fontFamily="-apple-system, system-ui, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="#000"
      >
        Pay
      </text>
    </svg>
  </BadgeWrap>
);

const GooglePayLogo = () => (
  <BadgeWrap label="Google Pay" width={62}>
    <svg viewBox="0 0 60 22" width="48" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Google "G" multi-color */}
      <path fill="#4285F4" d="M11.8 11.3v2.5h3.5c-.1.8-.6 1.5-1.3 2-.7.5-1.6.8-2.7.8-2.2 0-4-1.8-4-4 0-2.2 1.8-4 4-4 1 0 1.9.4 2.6 1l1.8-1.8C14.5 6.7 13.2 6.2 11.8 6.2c-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2c1.8 0 3.3-.6 4.4-1.8 1.1-1.1 1.5-2.7 1.5-4 0-.4 0-.8-.1-1.1h-5.8z" />
      <path fill="#34A853" d="M6.2 14.6l-.6 1.2 1.3.7c.6-.8 1-1.8 1.2-2.9l-1.9.1c-.1.3-.1.6 0 .9z" />
      <path fill="#FBBC04" d="M5.6 10.6c.2-1.1.6-2 1.3-2.8l-1.7-1.3c-.9 1-1.5 2.2-1.7 3.5l2.1.6z" />
      <path fill="#EA4335" d="M11.8 6.2c1.4 0 2.7.5 3.6 1.5l1.6-1.6C15.5 4.7 13.8 4 11.8 4 9.2 4 6.9 5.5 5.8 7.8l1.7 1.3c.5-1.8 2.2-2.9 4.3-2.9z" />
      {/* Pay wordmark */}
      <text
        x="20"
        y="15"
        fontFamily="Roboto, -apple-system, system-ui, sans-serif"
        fontSize="11"
        fontWeight="600"
        fill="#5F6368"
      >
        Pay
      </text>
    </svg>
  </BadgeWrap>
);

const KlarnaLogo = () => (
  <div
    aria-label="Klarna"
    role="img"
    className="flex items-center justify-center"
    style={{
      width: 56,
      height: 30,
      background: "#FFA8CD",
      borderRadius: 5,
    }}
  >
    <svg viewBox="0 0 60 20" width="44" height="16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text
        x="30"
        y="14"
        fontFamily="-apple-system, system-ui, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="800"
        fill="#0F0F0F"
        textAnchor="middle"
        letterSpacing="-0.1"
      >
        Klarna.
      </text>
    </svg>
  </div>
);

const PaymentBrandLogos = () => (
  <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
    <StripeLogo />
    <ApplePayLogo />
    <GooglePayLogo />
    <KlarnaLogo />
    <VisaLogo />
    <MastercardLogo />
  </div>
);
