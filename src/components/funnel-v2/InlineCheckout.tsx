import { useState, useEffect, useRef, forwardRef, type ReactNode, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getReferralCode } from "@/lib/referralTracking";
import { HeartsBackdrop } from "./HeartsBackdrop";

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

type FeatureKind = "plain" | "soulspeak" | "horoscope";

interface Feature {
  label: string;
  kind?: FeatureKind;
}

const TIERS: Array<{
  id: "basic" | "premium";
  name: string;
  price: number;
  badge?: string;
  features: Feature[];
}> = [
  {
    id: "basic",
    name: "Soul Reading",
    price: 27,
    features: [
      { label: "Full cosmic personality profile" },
      { label: "Emotional blueprint & soul purpose" },
      { label: "SoulSpeak chat included", kind: "soulspeak" },
      { label: "Upload your pet's photo" },
      { label: "Weekly horoscope (1st month free)", kind: "horoscope" },
    ],
  },
  {
    id: "premium",
    name: "Soul Bond",
    price: 35,
    badge: "Most Chosen",
    features: [
      { label: "Everything in Soul Reading, plus:" },
      { label: "Pet & owner compatibility analysis" },
      { label: "Your cosmic connection decoded" },
      { label: "Custom cosmic portrait" },
      { label: "Priority generation" },
    ],
  },
];

interface InlineCheckoutProps {
  ctaLabel: string;
  charityId?: string;
  charityBonus?: number;
}

export const InlineCheckout = forwardRef<HTMLDivElement, InlineCheckoutProps>(({ ctaLabel, charityId: charityIdProp, charityBonus = 0 }, forwardedRef) => {
  const [selectedTier, setSelectedTier] = useState<"basic" | "premium">("basic");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Expanded feature preview — keyed as `${tierId}:${kind}` so only one can be open at a time.
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  // Charity selection lives in the checkout card itself (compact brand row near payment badges).
  const [selectedCharity, setSelectedCharity] = useState<"ifaw" | "world-land-trust" | "eden-reforestation">(
    (charityIdProp as "ifaw" | "world-land-trust" | "eden-reforestation") || "ifaw"
  );
  const { ref: revealRef, visible } = useScrollReveal(0.05);
  const isInApp = useIsInAppBrowser();

  const toggleFeature = (tierId: string, kind: FeatureKind) => {
    const key = `${tierId}:${kind}`;
    setExpandedFeature((curr) => (curr === key ? null : key));
  };

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
    trackFunnelEvent("v2_checkout_clicked", { tier: selectedTier, price: selectedPrice, isInApp, charityId: selectedCharity, charityBonus });

    try {
      const refCode = getReferralCode();
      const { data, error: invokeError } = await supabase.functions.invoke("create-checkout", {
        body: {
          quickCheckout: true,
          selectedTier,
          abVariant: "V2",
          includesPortrait: selectedTier === "premium",
          petCount: 1,
          quickCheckoutEmail: email.trim(),
          referralCode: refCode || undefined,
          charityId: selectedCharity,
          charityBonus: charityBonus || 0,
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
      className="relative overflow-hidden py-12 sm:py-16 md:py-20 px-5"
      style={{
        background: "var(--cream, #FFFDF5)",
      }}
    >
      <HeartsBackdrop />
      <div
        className="relative max-w-xl mx-auto"
        style={{
          zIndex: 1,
          padding: "clamp(28px, 5vw, 44px) clamp(22px, 4.5vw, 40px)",
          background: "rgba(255, 253, 245, 0.78)",
          border: "1px solid rgba(196, 162, 101, 0.22)",
          borderRadius: 18,
          boxShadow: [
            "0 4px 24px rgba(0, 0, 0, 0.04)",
            "0 1px 2px rgba(196, 162, 101, 0.08)",
            "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          ].join(", "),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          overflow: "hidden",
        }}
      >
        {/* Gold inner-glow sheen at top edge — matches the benefit cards */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(180deg, rgba(212, 178, 107, 0.14) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
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
                aria-label={`Select ${tier.name}`}
                className="relative text-left rounded-xl p-3.5 sm:p-4 transition-all duration-300 active:scale-[0.99]"
                style={{
                  // Tier-tinted fill behind a gold-gradient frame.
                  // Basic = pure cream. Premium = subtle gold-tinted cream.
                  background: (() => {
                    const fill = tier.id === "premium"
                      ? "linear-gradient(180deg, #fbf4e4 0%, #FFFDF5 100%)"
                      : "#FFFDF5";
                    const frame = isSelected
                      ? "linear-gradient(135deg, #d4b26b 0%, #bf524a 50%, #d4b26b 100%)"
                      : "linear-gradient(135deg, rgba(196,162,101,0.35) 0%, rgba(212,178,107,0.2) 100%)";
                    return `${fill} padding-box, ${frame} border-box`;
                  })(),
                  border: isSelected ? "2px solid transparent" : "1.5px solid transparent",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(196,162,101,0.14), 0 6px 22px rgba(0,0,0,0.07)"
                    : "0 1px 10px rgba(0,0,0,0.04)",
                  opacity: visible ? 1 : 0,
                  transform: visible ? (isSelected ? "translateY(-2px)" : "translateY(0)") : "translateY(15px)",
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

                {/* Features — alternating zebra rows for easier scanning */}
                <ul className="rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ border: "1px solid rgba(196,162,101,0.12)" }}>
                  {tier.features.map((feature, fi) => {
                    const expandable = feature.kind === "soulspeak" || feature.kind === "horoscope";
                    const key = expandable ? `${tier.id}:${feature.kind}` : null;
                    const isExpanded = key !== null && expandedFeature === key;
                    return (
                      <li
                        key={fi}
                        className="text-left px-2 py-1.5"
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--earth, #6e6259)",
                          lineHeight: 1.35,
                          background: fi % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(246,241,230,0.55)",
                        }}
                      >
                        <div className="flex items-start gap-1.5">
                          <svg className="w-3 h-3 mt-0.5 flex-shrink-0 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {expandable ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleFeature(tier.id, feature.kind as FeatureKind);
                              }}
                              aria-expanded={isExpanded}
                              className="flex-1 flex items-center justify-between gap-1 text-left transition-opacity hover:opacity-80 focus:outline-none focus-visible:underline"
                              style={{ minHeight: 22 }}
                            >
                              <span className="flex items-center gap-1.5 flex-wrap">
                                <span>{feature.label}</span>
                                {feature.kind === "soulspeak" && (
                                  <span
                                    style={{
                                      fontFamily: "Cormorant, Georgia, serif",
                                      fontSize: "0.58rem",
                                      fontWeight: 700,
                                      letterSpacing: "0.1em",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      background: "linear-gradient(135deg, #d4b26b, #c4a265)",
                                      color: "#fff",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    New
                                  </span>
                                )}
                              </span>
                              <svg
                                className="w-3 h-3 flex-shrink-0 transition-transform duration-200"
                                style={{ color: "var(--muted, #958779)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                aria-hidden="true"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          ) : (
                            <span className="flex-1">{feature.label}</span>
                          )}
                        </div>

                        {expandable && isExpanded && (
                          <div
                            className="mt-2 ml-4 rounded-lg p-3"
                            style={{
                              background: "rgba(255, 253, 245, 0.7)",
                              border: "1px solid var(--cream3, #f3eadb)",
                              animation: "featurePreviewIn 0.25s ease",
                            }}
                          >
                            {feature.kind === "soulspeak" && <SoulSpeakPreview />}
                            {feature.kind === "horoscope" && <HoroscopePreview />}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </button>
            );
          })}
        </div>
        <style>{`
          @keyframes featurePreviewIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

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
            `${ctaLabel} · $${selectedPrice + charityBonus}`
          )}
        </button>

        {/* Charity donation line */}
        {charityBonus > 0 && (
          <p
            className="text-center mt-2.5"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.82rem",
              color: "var(--green, #4a8c5c)",
              fontWeight: 600,
            }}
          >
            Includes ${charityBonus} charity donation
          </p>
        )}

        {/* Risk reversal — trust-level anchor, sized up for skim hierarchy */}
        <p
          className="text-center mt-4"
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "clamp(0.98rem, 3.2vw, 1.08rem)",
            fontStyle: "italic",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.5,
            maxWidth: 440,
            margin: "16px auto 0",
          }}
        >
          If the reading doesn't feel like <em>them</em>,{" "}
          <strong style={{ color: "var(--ink, #1f1c18)", fontWeight: 600, fontStyle: "normal" }}>
            we refund every cent.
          </strong>
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
        <div className="mb-6"><PaymentBrandLogos /></div>

        {/* Charity brand row */}
        <CharityBrandRow selected={selectedCharity} onSelect={setSelectedCharity} />

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

/* ──────── Real brand logos — canonical SVG paths from simple-icons ────────
 * All paths sourced from simple-icons/simple-icons (MIT) — the canonical
 * open-source brand mark repository. Each mark uses the brand's official
 * hex color. Mastercard uses the classic red/yellow circle mark instead
 * of the simple-icons single-colour version for brand recognition.
 */

const BRAND_CARD_STYLE: CSSProperties = {
  height: 30,
  background: "#fff",
  border: "1px solid var(--cream3, #f3eadb)",
  borderRadius: 5,
};

const BadgeWrap = ({
  children,
  label,
  width = 52,
  bg = "#fff",
}: {
  children: ReactNode;
  label: string;
  width?: number;
  bg?: string;
}) => (
  <div
    aria-label={label}
    role="img"
    className="flex items-center justify-center"
    style={{ ...BRAND_CARD_STYLE, width, background: bg, padding: "0 6px" }}
  >
    {children}
  </div>
);

/* Stripe — #635BFF (official purple) */
const StripeLogo = () => (
  <BadgeWrap label="Stripe" width={54}>
    <svg viewBox="0 0 24 24" width="38" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#635BFF"
        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
      />
    </svg>
  </BadgeWrap>
);

/* Apple Pay — simple-icons canonical mark (includes Apple + Pay) */
const ApplePayLogo = () => (
  <BadgeWrap label="Apple Pay" width={62}>
    <svg viewBox="0 0 24 24" width="50" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#000"
        d="M2.15 4.318a42.16 42.16 0 0 0-.454.003c-.15.005-.303.013-.452.04a1.44 1.44 0 0 0-1.06.772c-.07.138-.114.278-.14.43-.028.148-.037.3-.04.45A10.2 10.2 0 0 0 0 6.222v11.557c0 .07.002.138.003.207.004.15.013.303.04.452.027.15.072.291.142.429a1.436 1.436 0 0 0 .63.63c.138.07.278.115.43.142.148.027.3.036.45.04l.208.003h20.194l.207-.003c.15-.004.303-.013.452-.04.15-.027.291-.071.428-.141a1.432 1.432 0 0 0 .631-.631c.07-.138.115-.278.141-.43.027-.148.036-.3.04-.45.002-.07.003-.138.003-.208l.001-.246V6.221c0-.07-.002-.138-.004-.207a2.995 2.995 0 0 0-.04-.452 1.446 1.446 0 0 0-1.2-1.201 3.022 3.022 0 0 0-.452-.04 10.448 10.448 0 0 0-.453-.003zm0 .512h19.942c.066 0 .131.002.197.003.115.004.25.01.375.032.109.02.2.05.287.094a.927.927 0 0 1 .407.407.997.997 0 0 1 .094.288c.022.123.028.258.031.374.002.065.003.13.003.197v11.552c0 .065 0 .13-.003.196-.003.115-.009.25-.032.375a.927.927 0 0 1-.5.693 1.002 1.002 0 0 1-.286.094 2.598 2.598 0 0 1-.373.032l-.2.003H1.906c-.066 0-.133-.002-.196-.003a2.61 2.61 0 0 1-.375-.032c-.109-.02-.2-.05-.288-.094a.918.918 0 0 1-.406-.407 1.006 1.006 0 0 1-.094-.288 2.531 2.531 0 0 1-.032-.373 9.588 9.588 0 0 1-.002-.197V6.224c0-.065 0-.131.002-.197.004-.114.01-.248.032-.375.02-.108.05-.199.094-.287a.925.925 0 0 1 .407-.406 1.03 1.03 0 0 1 .287-.094c.125-.022.26-.029.375-.032.065-.002.131-.002.196-.003zm4.71 3.7c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955zm2.207.42v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979zm-3.154.3c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002zm8.204.397c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm1.94.072l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z"
      />
    </svg>
  </BadgeWrap>
);

/* Google Pay — simple-icons canonical mark (includes G + Pay) */
const GooglePayLogo = () => (
  <BadgeWrap label="Google Pay" width={62}>
    <svg viewBox="0 0 24 24" width="50" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#3C4043"
        d="M3.963 7.235A3.963 3.963 0 00.422 9.419a3.963 3.963 0 000 3.559 3.963 3.963 0 003.541 2.184c1.07 0 1.97-.352 2.627-.957.748-.69 1.18-1.71 1.18-2.916a4.722 4.722 0 00-.07-.806H3.964v1.526h2.14a1.835 1.835 0 01-.79 1.205c-.356.241-.814.379-1.35.379-1.034 0-1.911-.697-2.225-1.636a2.375 2.375 0 010-1.517c.314-.94 1.191-1.636 2.225-1.636a2.152 2.152 0 011.52.594l1.132-1.13a3.808 3.808 0 00-2.652-1.033zm6.501.55v6.9h.886V11.89h1.465c.603 0 1.11-.196 1.522-.588a1.911 1.911 0 00.635-1.464 1.92 1.92 0 00-.635-1.456 2.125 2.125 0 00-1.522-.598zm2.427.85a1.156 1.156 0 01.823.365 1.176 1.176 0 010 1.686 1.171 1.171 0 01-.877.357H11.35V8.635h1.487a1.156 1.156 0 01.054 0zm4.124 1.175c-.842 0-1.477.308-1.907.925l.781.491c.288-.417.68-.626 1.175-.626a1.255 1.255 0 01.856.323 1.009 1.009 0 01.366.785v.202c-.34-.193-.774-.289-1.3-.289-.617 0-1.11.145-1.479.434-.37.288-.554.677-.554 1.165a1.476 1.476 0 00.525 1.156c.35.308.785.463 1.305.463.61 0 1.098-.27 1.465-.81h.038v.655h.848v-2.909c0-.61-.19-1.09-.568-1.44-.38-.35-.896-.525-1.551-.525zm2.263.154l1.946 4.422-1.098 2.38h.915L24 9.963h-.965l-1.368 3.391h-.02l-1.406-3.39zm-2.146 2.368c.494 0 .88.11 1.156.33 0 .372-.147.696-.44.973a1.413 1.413 0 01-.997.414 1.081 1.081 0 01-.69-.232.708.708 0 01-.293-.578c0-.257.12-.47.363-.647.24-.173.54-.26.9-.26z"
      />
    </svg>
  </BadgeWrap>
);

/* Klarna — pink #FFB3C7 background with canonical K mark */
const KlarnaLogo = () => (
  <BadgeWrap label="Klarna" width={54} bg="#FFB3C7">
    <svg viewBox="0 0 24 24" width="38" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#0F0F0F"
        d="M4.592 2v20H0V2h4.592zm11.46 0c0 4.194-1.583 8.105-4.415 11.068l-.278.283L17.702 22h-5.668l-6.893-9.4 1.779-1.332c2.858-2.14 4.535-5.378 4.637-8.924L11.562 2h4.49zM21.5 17a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"
      />
    </svg>
  </BadgeWrap>
);

/* Visa — canonical wordmark, #1A1F71 */
const VisaLogo = () => (
  <BadgeWrap label="Visa" width={54}>
    <svg viewBox="0 0 24 24" width="40" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fill="#1A1F71"
        d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"
      />
    </svg>
  </BadgeWrap>
);

/* Mastercard — classic two-circle brand mark, official red/yellow/orange */
const MastercardLogo = () => (
  <BadgeWrap label="Mastercard" width={50}>
    <svg viewBox="0 0 32 20" width="32" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="10" r="7" fill="#EB001B" />
      <circle cx="20" cy="10" r="7" fill="#F79E1B" />
      <path
        d="M16 4.8a7 7 0 010 10.4 7 7 0 010-10.4z"
        fill="#FF5F00"
      />
    </svg>
  </BadgeWrap>
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

/* ──────── Charity brand row ──────── */
// Stylised wordmark badges for the 3 charities. Uses the same BadgeWrap
// visual language as the payment-method badges so they sit cleanly in the
// same trust row. Swap the inner <svg>s for the real brand-supplied logo
// assets when Danny has them in /public/charities/.

type CharitySlug = "ifaw" | "world-land-trust" | "eden-reforestation";

const CHARITY_BRAND_META: Record<CharitySlug, { label: string; tagline: string }> = {
  "ifaw": { label: "IFAW", tagline: "animal rescue, worldwide" },
  "world-land-trust": { label: "World Land Trust", tagline: "protecting wild habitat" },
  "eden-reforestation": { label: "Eden Reforestation", tagline: "trees, plus local jobs" },
};

const CharityBrandRow = ({
  selected,
  onSelect,
}: {
  selected: CharitySlug;
  onSelect: (id: CharitySlug) => void;
}) => {
  const meta = CHARITY_BRAND_META[selected];
  return (
    <div>
      <p
        className="text-center mb-2"
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--gold, #c4a265)",
        }}
      >
        10% of all sales go to
      </p>
      <div className="flex flex-wrap justify-center items-center gap-2" role="radiogroup" aria-label="Choose a charity">
        <CharityBadgeButton id="ifaw" selected={selected === "ifaw"} onSelect={onSelect}>
          <IFAWMark />
        </CharityBadgeButton>
        <CharityBadgeButton id="world-land-trust" selected={selected === "world-land-trust"} onSelect={onSelect}>
          <WorldLandTrustMark />
        </CharityBadgeButton>
        <CharityBadgeButton id="eden-reforestation" selected={selected === "eden-reforestation"} onSelect={onSelect}>
          <EdenReforestationMark />
        </CharityBadgeButton>
      </div>
      <p
        className="text-center mt-2"
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "0.72rem",
          fontStyle: "italic",
          color: "var(--muted, #958779)",
        }}
      >
        {meta.label} — {meta.tagline}
      </p>
    </div>
  );
};

const CharityBadgeButton = ({
  id,
  selected,
  onSelect,
  children,
}: {
  id: CharitySlug;
  selected: boolean;
  onSelect: (id: CharitySlug) => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    aria-label={CHARITY_BRAND_META[id].label}
    onClick={() => onSelect(id)}
    className="flex items-center justify-center transition-all duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
    style={{
      height: 36,
      minWidth: 96,
      padding: "0 10px",
      background: "#fff",
      borderRadius: 6,
      border: selected ? "2px solid var(--gold, #c4a265)" : "1px solid var(--cream3, #f3eadb)",
      boxShadow: selected ? "0 2px 10px rgba(196,162,101,0.2)" : "none",
    }}
  >
    {children}
  </button>
);

/* Placeholder wordmarks — replace with brand-supplied SVG assets when available.
 * Kept as inline SVG <text> so they share the payment-badge visual weight
 * and don't require a separate asset request per page load. */

const CharityLogoImg = ({ src, alt }: { src: string; alt: string }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    decoding="async"
    style={{
      maxHeight: 22,
      maxWidth: 100,
      objectFit: "contain",
      display: "block",
    }}
  />
);

const IFAWMark = () => <CharityLogoImg src="/charities/ifaw.png" alt="IFAW" />;
const WorldLandTrustMark = () => <CharityLogoImg src="/charities/worldlandtrust.jpg" alt="World Land Trust" />;
const EdenReforestationMark = () => <CharityLogoImg src="/charities/eden.png" alt="Eden Reforestation" />;

/* ──────── Feature preview subcomponents ──────── */

const SoulSpeakPreview = () => (
  <div className="space-y-2">
    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "var(--ink, #1f1c18)",
      }}
    >
      Have the conversation you've always wished you could have.
    </p>
    <div className="flex justify-end">
      <div
        className="px-3 py-1.5 rounded-xl rounded-br-sm"
        style={{ background: "var(--rose, #bf524a)", color: "#fff", maxWidth: "85%" }}
      >
        <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.74rem", lineHeight: 1.4 }}>
          Why do you always steal my socks?
        </p>
      </div>
    </div>
    <div className="flex justify-start">
      <div
        className="px-3 py-1.5 rounded-xl rounded-bl-sm"
        style={{ background: "var(--cream3, #f3eadb)", maxWidth: "90%" }}
      >
        <p
          style={{
            fontFamily: "Cormorant, Georgia, serif",
            fontStyle: "italic",
            fontSize: "0.74rem",
            color: "var(--earth, #6e6259)",
            lineHeight: 1.4,
          }}
        >
          Because they smell like you. And when you leave, that's the closest thing I have to you being here.
        </p>
      </div>
    </div>
    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontStyle: "italic",
        fontSize: "0.7rem",
        color: "var(--muted, #958779)",
        textAlign: "center",
      }}
    >
      Ask them anything. Hear what they'd say.
    </p>
  </div>
);

const HoroscopePreview = () => (
  <div className="space-y-1.5">
    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontSize: "0.78rem",
        fontWeight: 600,
        color: "var(--ink, #1f1c18)",
      }}
    >
      One month of weekly horoscopes — free.
    </p>
    <ul className="space-y-1" style={{ fontSize: "0.72rem", color: "var(--earth, #6e6259)", lineHeight: 1.5 }}>
      <li className="flex items-start gap-1.5">
        <span style={{ color: "var(--gold, #c4a265)" }}>✦</span>
        <span>Their cosmic mood for each day of the week</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span style={{ color: "var(--gold, #c4a265)" }}>✦</span>
        <span>Lucky day, power move, and energy peaks</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span style={{ color: "var(--gold, #c4a265)" }}>✦</span>
        <span>A pet-parent cosmic sync reading</span>
      </li>
      <li className="flex items-start gap-1.5">
        <span style={{ color: "var(--gold, #c4a265)" }}>✦</span>
        <span>Weekly affirmation written for your bond</span>
      </li>
    </ul>
    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontStyle: "italic",
        fontSize: "0.68rem",
        color: "var(--muted, #958779)",
        textAlign: "center",
      }}
    >
      Cancel anytime — first month is on us.
    </p>
  </div>
);
