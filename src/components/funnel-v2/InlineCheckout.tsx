import { useState, useEffect, useRef, forwardRef, type ReactNode, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getReferralCode } from "@/lib/referralTracking";
import { useLocalizedPrice } from "@/hooks/useLocalizedPrice";
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


type FeatureKind = "plain" | "soulspeak" | "divider" | "bonus" | "horoscope";

interface Feature {
  label: string;
  kind?: FeatureKind;
}

type TierId = "basic" | "premium" | "memorial";

const TIERS: Array<{
  id: TierId;
  name: string;
  price: number;
  wasPrice?: number;
  badge?: string;
  features: Feature[];
}> = [
  {
    id: "basic",
    name: "Soul Reading",
    price: 29,
    wasPrice: 49,
    features: [
      { label: "Included:", kind: "divider" },
      { label: "Full astrological breakdown — 30+ sections (works for any pet)" },
      { label: "How they love, how they learn, how they heal, what they hope for, what they fear — and what makes them feel most themselves" },
      { label: "Their photo becomes part of the reveal" },
      { label: "Yours forever — revisit anytime, from any device" },
      { label: "Bonus sections — little surprises written just for them", kind: "bonus" },
      { label: "SoulSpeak", kind: "soulspeak" },
      { label: "1 month of weekly horoscopes", kind: "horoscope" },
    ],
  },
  {
    id: "premium",
    name: "Soul Bond",
    price: 49,
    wasPrice: 79,
    badge: "Most Chosen",
    features: [
      { label: "Everything in Soul Reading, plus:", kind: "divider" },
      { label: "Your chart against theirs — where you align, where you challenge each other, and why the universe paired you" },
      { label: "Where your energies meet, mirror, and balance" },
      { label: "The soul-reasons you found each other" },
    ],
  },
  {
    // Memorial Reading — surfaced only on the memorial path as a sole
    // full-card option. Shares Stripe price with Soul Bond ($49) so
    // memorialQty bundles into premiumCount at checkout. Horoscope
    // intentionally omitted — memorial readings are backward-looking.
    id: "memorial",
    name: "Memorial Reading",
    price: 49,
    wasPrice: 79,
    badge: "In Loving Memory",
    features: [
      { label: "Included:", kind: "divider" },
      { label: "Dedicated to what made them, them." },
      { label: "What they'd tell you if they could speak today." },
      { label: "Your chart and theirs, side by side — why the universe chose you for each other." },
      { label: "The lesson they came to bring, and the love they came to give." },
      { label: "The gifts they brought into your life — named and honoured." },
      { label: "What they came to teach you, and what you gave them in return." },
      { label: "The parts of them you still carry." },
      { label: "What they loved about you." },
      { label: "A permanent home for their memory — with you, always." },
      { label: "A place where the conversation never has to end.", kind: "soulspeak" },
      { label: "Signs they might still be sending you — and how to notice." },
    ],
  },
];

interface InlineCheckoutProps {
  ctaLabel: string;
  charityId?: string;
  charityBonus?: number;
  /** Fired whenever the user changes tier so the parent (FunnelV2) can keep
   *  sticky + final CTAs in sync with the currently-chosen price. */
  onSelectedPriceChange?: (price: number) => void;
  /** When true (e.g. user chose the Memorial path in the picker), the
   *  Memorial tier pill starts expanded and memorialQty seeds to 1. Only
   *  the initial render is affected — once the user interacts, their
   *  collapse/expand state wins. Works alongside ?memorial=1 /
   *  ?occasion=memorial URL intent. */
  memorialDefaultExpanded?: boolean;
  /** When true (memorial path), the Soul Reading + Soul Bond tier grid
   *  is hidden entirely and the Memorial tier is rendered as the sole
   *  full-width card. No pill, no toggle — a grieving reader should not
   *  have two unrelated options competing for their attention. */
  memorialOnly?: boolean;
}

// Volume discount mirrors create-checkout server-side rates for per-pet bundles.
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.30;
  if (petCount >= 4) return 0.25;
  if (petCount >= 3) return 0.20;
  if (petCount >= 2) return 0.15;
  return 0;
}

const MAX_PETS = 10;

export const InlineCheckout = forwardRef<HTMLDivElement, InlineCheckoutProps>(({ ctaLabel, charityId: charityIdProp, charityBonus = 0, onSelectedPriceChange, memorialDefaultExpanded = false, memorialOnly = false }, forwardedRef) => {
  // Detect memorial-intent URL params up-front so the cart + pill open to the
  // right state. Supported signals: ?occasion=memorial or ?memorial=1. Also
  // covers the case where a user clicks a memorial-specific CTA that routes
  // them here with the flag. Falls back to cosmic default otherwise.
  // The `memorialDefaultExpanded` prop (set by the FunnelV2 PathPicker when
  // path=memorial) is OR'd in so the same seed logic applies to picker
  // arrivals — only on the initial render.
  const memorialIntent = memorialDefaultExpanded || (typeof window !== "undefined" && (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("occasion") === "memorial" || params.get("memorial") === "1";
    } catch {
      return false;
    }
  })());

  // Per-tier quantities — users can mix Soul Reading + Soul Bond + Memorial in one order.
  // Default: 1× Soul Reading, 0× Soul Bond, 0× Memorial.
  // Memorial-intent arrivals flip the default to 1× Memorial, pill pre-expanded.
  const [basicQty, setBasicQty] = useState<number>(memorialIntent ? 0 : 1);
  const [premiumQty, setPremiumQty] = useState<number>(0);
  // Memorial Reading quantity — shares Stripe price with Soul Bond ($49).
  // Bundled into premiumCount when sent to create-checkout; occasionMode
  // ='memorial' is forwarded only when the cart is purely memorial.
  const [memorialQty, setMemorialQty] = useState<number>(memorialIntent ? 1 : 0);
  // Memorial pill expansion — collapsed by default, expands into a full
  // tier card identical in format to Soul Reading / Soul Bond when clicked.
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // SoulSpeak full-screen preview modal. Opens from any tier's SoulSpeak row.
  const [soulSpeakOpen, setSoulSpeakOpen] = useState(false);
  // Horoscope preview modal. Opens from any tier's horoscope row.
  const [horoscopeOpen, setHoroscopeOpen] = useState(false);
  // Promo / gift / redeem code state — single input that handles all three
  // (mirrors the old static checkout.html flow: try coupons table, then redeem-free-code).
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "applied">("idle");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_type: string; discount_value: number } | null>(null);
  // Charity selection lives in the checkout card itself (compact brand row near payment badges).
  const [selectedCharity, setSelectedCharity] = useState<"ifaw" | "world-land-trust" | "eden-reforestation">(
    (charityIdProp as "ifaw" | "world-land-trust" | "eden-reforestation") || "ifaw"
  );
  const { ref: revealRef, visible } = useScrollReveal(0.05);
  const isInApp = useIsInAppBrowser();
  const { fmtUsd, code: currencyCode, isLocalized } = useLocalizedPrice();

  // SoulSpeak row click → open full-screen modal
  const openSoulSpeak = () => setSoulSpeakOpen(true);
  const closeSoulSpeak = () => setSoulSpeakOpen(false);
  const openHoroscope = () => setHoroscopeOpen(true);
  const closeHoroscope = () => setHoroscopeOpen(false);

  // Lock body scroll while any preview modal is open
  useEffect(() => {
    const anyOpen = soulSpeakOpen || horoscopeOpen;
    if (!anyOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSoulSpeak();
        closeHoroscope();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [soulSpeakOpen, horoscopeOpen]);

  // Derived totals — recomputed on every render from per-tier qty state.
  const basicPrice = TIERS.find((t) => t.id === "basic")!.price;
  const premiumPrice = TIERS.find((t) => t.id === "premium")!.price;
  const memorialPrice = TIERS.find((t) => t.id === "memorial")!.price;
  const petCount = basicQty + premiumQty + memorialQty;
  const subtotal = basicQty * basicPrice + premiumQty * premiumPrice + memorialQty * memorialPrice;
  const discountRate = getVolumeDiscount(petCount);
  const volumeDiscountAmount = Math.round(subtotal * discountRate * 100) / 100;
  const selectedPrice = Math.max(0, subtotal - volumeDiscountAmount);

  // Apply coupon discount on top of the volume discount before display.
  const couponDiscountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage" || appliedCoupon.discount_type === "percent"
      ? Math.round(selectedPrice * (appliedCoupon.discount_value / 100) * 100) / 100
      : appliedCoupon.discount_value / 100
    : 0;
  const finalPrice = Math.max(0, selectedPrice - couponDiscountAmount);

  const handleApplyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setCodeError("");
    setCodeStatus("checking");
    try {
      // 1. Try as discount coupon first
      const { data: coupons } = await supabase
        .from("coupons")
        .select("id,code,discount_type,discount_value,expires_at,max_uses,current_uses")
        .eq("code", code)
        .eq("is_active", true)
        .limit(1);
      if (coupons && coupons.length > 0) {
        const coupon = coupons[0];
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          setCodeError("This code has expired");
          setCodeStatus("idle");
          return;
        }
        if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
          setCodeError("This code has reached its limit");
          setCodeStatus("idle");
          return;
        }
        setAppliedCoupon(coupon);
        setCodeStatus("applied");
        trackFunnelEvent("v2_code_applied", { code, type: "coupon" });
        return;
      }
      // 2. Try as free redeem code (e.g. QATEST) — pass the buyer's cart
      // mix so the redeem flow creates the matching N reports and routes
      // through the real multi-pet intake instead of a single-pet shortcut.
      const { data: redeemData, error: redeemErr } = await supabase.functions.invoke("redeem-free-code", {
        body: {
          code,
          basicCount: basicQty,
          premiumCount: premiumQty,
          email: email.trim() || undefined,
        },
      });
      if (!redeemErr && redeemData?.success && redeemData?.reportId) {
        trackFunnelEvent("v2_code_applied", { code, type: "redeem", petCount: redeemData?.petCount ?? 1 });
        const ids: string[] = Array.isArray(redeemData?.reportIds) && redeemData.reportIds.length > 0
          ? redeemData.reportIds
          : [redeemData.reportId];
        const primary = ids[0];
        // When the redeem created multiple reports, pass the full list so
        // PaymentSuccess can see the whole cart and route them through
        // MultiPetIntakeFlow in order.
        const qs = new URLSearchParams({
          session_id: `redeem_${primary}`,
          report_id: primary,
          quick: "true",
        });
        if (ids.length > 1) qs.set("report_ids", ids.join(","));
        window.location.href = `/payment-success?${qs.toString()}`;
        return;
      }
      setCodeError("Invalid code. Please check and try again.");
      setCodeStatus("idle");
    } catch (e) {
      console.error("[V2 promo code]", e);
      setCodeError("Something went wrong. Please try again.");
      setCodeStatus("idle");
    }
  };

  const removeAppliedCoupon = () => {
    setAppliedCoupon(null);
    setCodeInput("");
    setCodeStatus("idle");
  };

  const tierQty = (id: TierId) =>
    id === "basic" ? basicQty : id === "premium" ? premiumQty : memorialQty;
  const setTierQty = (id: TierId, n: number) => {
    if (id === "basic") setBasicQty(n);
    else if (id === "premium") setPremiumQty(n);
    else setMemorialQty(n);
  };

  const changeTierQty = (id: TierId, delta: number) => {
    const current = tierQty(id);
    // Sum of the other two tiers' quantities.
    const others =
      (id === "basic" ? 0 : basicQty) +
      (id === "premium" ? 0 : premiumQty) +
      (id === "memorial" ? 0 : memorialQty);
    const next = Math.max(0, current + delta);
    const totalAfter = next + others;
    if (totalAfter > MAX_PETS) return;
    if (totalAfter === 0) return; // keep at least 1 pet selected
    setTierQty(id, next);
    const nextBasic = id === "basic" ? next : basicQty;
    const nextPremium = id === "premium" ? next : premiumQty;
    const nextMemorial = id === "memorial" ? next : memorialQty;
    const nextSubtotal =
      nextBasic * basicPrice + nextPremium * premiumPrice + nextMemorial * memorialPrice;
    const nextDiscount = getVolumeDiscount(totalAfter);
    onSelectedPriceChange?.(Math.max(0, nextSubtotal * (1 - nextDiscount)));
    trackFunnelEvent("v2_tier_qty_changed", { tier: id, qty: next, petCount: totalAfter });
  };

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

  // Card click — if tier qty is 0, bump to 1 (acts like the old "select" UX).
  // The +/- stepper buttons inside the card stop propagation so they don't fire this.
  const handleCardActivate = (tier: TierId) => {
    if (tierQty(tier) === 0) {
      changeTierQty(tier, 1);
    }
    trackFunnelEvent("v2_tier_selected", { tier, qty: tierQty(tier) });
  };

  // Emit the initial price once on mount so parent CTAs start in sync.
  useEffect(() => {
    onSelectedPriceChange?.(selectedPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep parent CTAs in sync as quantities change.
  useEffect(() => {
    onSelectedPriceChange?.(selectedPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrice]);

  const handleCheckout = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email");
      trackFunnelEvent("v2_checkout_error", { reason: "invalid_email" });
      return;
    }
    if (petCount === 0) {
      setError("Please add at least one reading.");
      return;
    }
    setError("");
    setIsLoading(true);
    // Memorial Reading shares the Soul Bond Stripe price ($49), so we bundle
    // memorialQty into premiumCount when posting to create-checkout. The
    // server has no distinct Memorial SKU — it just reads basicCount +
    // premiumCount. The user-facing distinction lives in post-purchase intake.
    const combinedPremiumCount = premiumQty + memorialQty;
    // Primary tier reflects what dominates the order — used for analytics + back-compat metadata only.
    const primaryTier: "basic" | "premium" = combinedPremiumCount > 0 && basicQty === 0 ? "premium" : "basic";
    // Memorial intent gets forwarded to the server as `occasionMode`. The
    // server today applies a single occasion_mode to every placeholder report
    // in the order. That's correct for pure Memorial carts (basicQty === 0,
    // premiumQty === 0, memorialQty > 0) — the common memorial path. For
    // mixed carts (Memorial + Soul Reading or Memorial + Soul Bond) we
    // suppress the flag and let PostPurchaseIntake's per-pet occasion picker
    // handle it — otherwise we'd stamp memorial on every placeholder.
    // TODO: wire per-line-item occasion_mode through checkout session metadata
    // so mixed Memorial + Soul Reading / Soul Bond carts can signal Memorial
    // on just the memorial placeholders.
    const shouldForwardMemorial = memorialQty > 0 && basicQty === 0 && premiumQty === 0;
    const occasionMode = shouldForwardMemorial ? "memorial" : undefined;
    trackFunnelEvent("v2_checkout_clicked", {
      tier: primaryTier,
      basicQty,
      premiumQty,
      memorialQty,
      petCount,
      price: selectedPrice,
      isInApp,
      charityId: selectedCharity,
      charityBonus,
      occasionMode: occasionMode || "discover",
    });
    if (memorialQty > 0 && !shouldForwardMemorial) {
      // Visible in prod console so support can trace Memorial intent even when
      // we can't forward it at the cart level yet.
      console.log("[V2 Checkout] memorial in mixed cart — intake will default per-pet", { basicQty, premiumQty, memorialQty });
    }

    try {
      const refCode = getReferralCode();
      const { data, error: invokeError } = await supabase.functions.invoke("create-checkout", {
        body: {
          quickCheckout: true,
          selectedTier: primaryTier,
          // Per-tier breakdown — backend prices each tier independently, then applies volume discount on the total.
          // Memorial Reading is bundled into premiumCount (same $49 Stripe price).
          basicCount: basicQty,
          premiumCount: combinedPremiumCount,
          abVariant: "V2",
          includesPortrait: combinedPremiumCount > 0,
          petCount,
          quickCheckoutEmail: email.trim(),
          referralCode: refCode || undefined,
          charityId: selectedCharity,
          charityBonus: charityBonus || 0,
          // Both tiers advertise "1 month of weekly horoscopes — included free",
          // so always flag it. Webhook uses this to create the trialing Stripe
          // subscription (price_1Sfi1v…) with trial_period_days: 30.
          includeHoroscope: true,
          couponId: appliedCoupon?.id || undefined,
          // Forward memorial intent so placeholder pet_reports.occasion_mode
          // is pre-set to 'memorial' and PostPurchaseIntake defaults the
          // occasion picker accordingly. Only set when cart is purely memorial.
          occasionMode,
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

  // Render a single tier card — reused for basic, premium, and the expanded
  // memorial pill. Kept as an inner function so closure state (quantities,
  // modal openers, helpers, visible flag) is available without prop drilling.
  const renderTierCard = (
    tier: (typeof TIERS)[number],
    i: number,
    opts?: { showCloseButton?: boolean; onClose?: () => void }
  ) => {
    const qty = tierQty(tier.id);
    const isSelected = qty > 0;
    const atMax = petCount >= MAX_PETS;
    const minusDisabled = qty === 0 || (petCount === 1 && qty === 1);
    // Elevated treatment — soft gold gradient fill — is applied to the
    // Soul Bond ($49 premium) card in the two-tier layout, and to the
    // Memorial card on the memorial-only route so the sole option still
    // feels considered rather than flat.
    const isElevated = tier.id === "premium" || tier.id === "memorial";
    const displayName = tier.name;
    const displayBadge = tier.badge;
    const displayFeatures = tier.features;
    return (
      <div
        key={tier.id}
        role="button"
        tabIndex={0}
        onClick={() => handleCardActivate(tier.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCardActivate(tier.id); } }}
        aria-pressed={isSelected}
        aria-label={`${displayName} — ${qty} selected`}
        className="relative text-left rounded-2xl p-4 sm:p-5 active:scale-[0.995] min-w-0 h-full flex flex-col cursor-pointer"
        style={{
          background: (() => {
            const fill = isElevated
              ? "linear-gradient(180deg, #fbf4e4 0%, #FFFDF5 100%)"
              : "#FFFDF5";
            const frame = isSelected
              ? "linear-gradient(135deg, #d4b26b 0%, #bf524a 50%, #d4b26b 100%)"
              : "linear-gradient(135deg, rgba(196,162,101,0.35) 0%, rgba(212,178,107,0.2) 100%)";
            return `${fill} padding-box, ${frame} border-box`;
          })(),
          border: isSelected ? "2px solid transparent" : "1.5px solid transparent",
          boxShadow: isSelected
            ? "0 0 0 3px rgba(196,162,101,0.14), 0 8px 28px rgba(0,0,0,0.08)"
            : "0 2px 14px rgba(0,0,0,0.04)",
          opacity: visible ? 1 : 0,
          transform: visible ? (isSelected ? "translateY(-2px)" : "translateY(0)") : "translateY(15px)",
          transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.3s ease, opacity 0.6s ease",
          transitionDelay: `${0.1 + i * 0.08}s`,
        }}
      >
        {displayBadge && (
          <div
            className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full text-white whitespace-nowrap"
            style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.04em", background: "var(--rose, #bf524a)" }}
          >
            {displayBadge}
          </div>
        )}

        {opts?.showCloseButton && opts.onClose && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); opts.onClose!(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); opts.onClose!(); } }}
            aria-label="Collapse Memorial Reading details"
            className="absolute top-2.5 right-2.5 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ width: 28, height: 28, background: "rgba(196,162,101,0.14)", color: "var(--ink, #1f1c18)", border: "none", cursor: "pointer" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header — stacked so long names + prices never crowd each other */}
        <div className="mb-3.5">
          <div className="flex items-center gap-2 min-w-0 mb-1.5">
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
              style={{ borderColor: isSelected ? "var(--rose, #bf524a)" : "var(--sand, #d6c8b6)" }}
            >
              {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--rose, #bf524a)" }} />}
            </div>
            <span
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.05rem, 3vw, 1.3rem)",
                color: "var(--ink, #1f1c18)",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              style={{
                fontFamily: '"DM Serif Display", Georgia, serif',
                fontSize: "clamp(1.6rem, 4.5vw, 2rem)",
                color: "var(--black, #141210)",
                lineHeight: 1,
              }}
            >
              {fmtUsd(tier.price)}
            </span>
            {tier.wasPrice && (
              <span
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(0.9rem, 2.4vw, 1.05rem)",
                  color: "var(--muted, #958779)",
                  lineHeight: 1,
                  textDecoration: "line-through",
                  textDecorationColor: "rgba(191,82,74,0.55)",
                  textDecorationThickness: "1.5px",
                }}
              >
                {fmtUsd(tier.wasPrice)}
              </span>
            )}
          </div>
        </div>

        {/* ── Quantity stepper — add multiples of this tier ── */}
        <div
          className="flex items-center justify-between mb-3 rounded-lg px-2.5 py-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{ background: "rgba(196,162,101,0.08)", border: "1px solid rgba(196,162,101,0.18)" }}
        >
          <span style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.78rem", fontWeight: 600, color: "var(--earth, #6e6259)" }}>
            How many?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); changeTierQty(tier.id, -1); }}
              disabled={minusDisabled}
              aria-label={`Remove one ${displayName}`}
              className="rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                width: 44, height: 44, minWidth: 44, minHeight: 44,
                border: "1.5px solid var(--sand, #d6c8b6)", background: "#fff",
                color: "var(--earth, #6e6259)", fontFamily: "Cormorant, Georgia, serif",
                fontSize: "1.25rem", lineHeight: 1, cursor: minusDisabled ? "not-allowed" : "pointer",
              }}
            >−</button>
            <span
              aria-live="polite"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "1.1rem", color: "var(--ink, #1f1c18)", minWidth: 18, textAlign: "center" }}
            >{qty}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); changeTierQty(tier.id, 1); }}
              disabled={atMax}
              aria-label={`Add one ${displayName}`}
              className="rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                width: 44, height: 44, minWidth: 44, minHeight: 44,
                border: "1.5px solid var(--sand, #d6c8b6)", background: "#fff",
                color: "var(--earth, #6e6259)", fontFamily: "Cormorant, Georgia, serif",
                fontSize: "1.25rem", lineHeight: 1, cursor: atMax ? "not-allowed" : "pointer",
              }}
            >+</button>
          </div>
        </div>

        {/* Features — top-aligned so both cards' feature lists start at
            the same vertical point on desktop side-by-side view */}
        <div className="flex-1 flex items-start">
        <ul
          className="rounded-lg overflow-hidden w-full"
          style={{ border: "1px solid rgba(196,162,101,0.14)" }}
        >
          {displayFeatures.map((feature, fi) => {
            const isDivider = feature.kind === "divider";
            const isSoulSpeak = feature.kind === "soulspeak";
            const isBonus = feature.kind === "bonus";
            const isHoroscope = feature.kind === "horoscope";
            const isPreviewable = isSoulSpeak || isHoroscope;
            const handlePreviewActivate = (e: React.SyntheticEvent) => {
              e.stopPropagation();
              e.preventDefault();
              if (isSoulSpeak) openSoulSpeak();
              else if (isHoroscope) openHoroscope();
            };
            return (
              <li
                key={fi}
                className="text-left px-2.5 sm:px-3 py-2"
                onClick={isPreviewable ? handlePreviewActivate : undefined}
                onKeyDown={isPreviewable ? (e) => { if (e.key === "Enter" || e.key === " ") handlePreviewActivate(e); } : undefined}
                role={isPreviewable ? "button" : undefined}
                tabIndex={isPreviewable ? 0 : undefined}
                aria-label={isSoulSpeak ? "Preview SoulSpeak" : isHoroscope ? "Preview weekly horoscopes" : undefined}
                style={{
                  fontSize: "0.8rem",
                  color: isDivider ? "var(--gold, #c4a265)" : "var(--earth, #6e6259)",
                  fontWeight: isDivider ? 600 : 700,
                  fontStyle: isDivider ? "italic" : "normal",
                  lineHeight: 1.4,
                  cursor: isPreviewable ? "pointer" : "default",
                  background: isDivider
                    ? "rgba(196,162,101,0.08)"
                    : fi % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(246,241,230,0.55)",
                  transition: isPreviewable ? "background 0.2s ease" : undefined,
                }}
              >
                {(() => {
                  const badgeBaseStyle: CSSProperties = {
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    padding: "2px 7px",
                    borderRadius: 4,
                    color: "#fff",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                  };
                  const goldBadge = { ...badgeBaseStyle, background: "linear-gradient(135deg, #d4b26b, #c4a265)" };
                  const greenBadge = { ...badgeBaseStyle, background: "linear-gradient(135deg, #5aa870, #4a8c5c)" };
                  const badgeInner = isSoulSpeak
                    ? <span style={goldBadge}>New</span>
                    : isBonus
                    ? <span style={goldBadge}>Bonus</span>
                    : isHoroscope
                    ? <span style={greenBadge}>Free</span>
                    : null;
                  const badge = badgeInner ? (
                    <span style={{ width: 72, flexShrink: 0, display: "inline-flex", justifyContent: "flex-start" }}>
                      {badgeInner}
                    </span>
                  ) : null;
                  const infoIcon = (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#958779"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ flexShrink: 0 }}
                    >
                      <title>Tap to preview</title>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  );
                  const labelNode = isSoulSpeak ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {feature.label}
                      {infoIcon}
                    </span>
                  ) : isBonus ? (
                    <span>Bonus sections — little surprises written just for them</span>
                  ) : isHoroscope ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      Weekly horoscopes — 1 month included
                      {infoIcon}
                    </span>
                  ) : (
                    <span>{feature.label}</span>
                  );
                  return (
                    <div className="flex items-center gap-2">
                      {!isDivider && (
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--green,#4a8c5c)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="flex-1 min-w-0">{labelNode}</span>
                      {badge}
                    </div>
                  );
                })()}
              </li>
            );
          })}
        </ul>
        </div>
      </div>
    );
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
      {/* Respect prefers-reduced-motion on the memorial-pill expansion */}
      <style>{`
        @keyframes lsMemorialExpandIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        [data-ls-memorial-expanded] {
          animation: lsMemorialExpandIn 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          [data-ls-memorial-expanded] { animation: none !important; }
        }
      `}</style>
      <HeartsBackdrop />
      <div
        className="relative max-w-xl sm:max-w-2xl mx-auto"
        style={{
          zIndex: 1,
          padding: "clamp(24px, 4.5vw, 40px) clamp(18px, 4vw, 36px)",
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
        {/* Header — route-aware. Memorial visitors see a reverent,
            singular title instead of the generic "Begin Their Reading".
            A tender sub-line then meets them before any pricing. */}
        <div
          className="text-center mb-7 sm:mb-8 transition-all duration-1000"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.5rem, 5.5vw, 2rem)",
              fontWeight: 400,
              fontStyle: memorialOnly ? "italic" : "normal",
              color: "var(--black, #141210)",
              marginBottom: 8,
              lineHeight: 1.15,
            }}
          >
            {memorialOnly ? "A Reading for Their Memory" : "Begin Their Reading"}
          </h2>
          {memorialOnly && (
            <p
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(0.98rem, 3vw, 1.1rem)",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.5,
                margin: "0 auto",
                maxWidth: 440,
              }}
            >
              A keepsake for the space they left &mdash; written reverently,
              to be felt, not skimmed.
            </p>
          )}
        </div>

        {memorialOnly ? (
          /* Memorial-only route: render the Memorial tier as a single
             card sized to match one column of the regular two-tier grid
             (~340px) and centred. Keeps the visual language consistent
             — same chrome, same chip scale — without stretching the
             card to the full container width, which would make it read
             as a banner rather than a product card. */
          <div data-ls-memorial-expanded="" className="mb-3 mx-auto w-full" style={{ maxWidth: 340 }}>
            {renderTierCard(TIERS.find((t) => t.id === "memorial")!, 0)}
          </div>
        ) : (
          /* Non-memorial routes (new / discover): Soul Reading + Soul
             Bond only. The Memorial tier is intentionally absent —
             grieving visitors reach it via the "I've lost my pet"
             intent pill above, never as a pricing option bolted onto
             the discovery funnel. */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 items-stretch">
            {TIERS.filter((t) => t.id === "basic" || t.id === "premium").map((tier, i) =>
              renderTierCard(tier, i)
            )}
          </div>
        )}

        {/* Live multi-pet discount hint. Suppressed on memorial — a
            grieving visitor is holding one soul in mind, and prompting
            "got more pets?" is tonally wrong. */}
        {!memorialOnly && (
          <p
            className="text-center mb-5"
            style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", fontWeight: 600, color: petCount >= 2 ? "var(--rose, #bf524a)" : "var(--muted, #958779)" }}
          >
            {petCount >= 2 ? (
              <>🎉 {Math.round(discountRate * 100)}% multi-pet discount applied — {petCount} readings · {fmtUsd(selectedPrice)}</>
            ) : (
              <>🐾 Got more pets? Use the + buttons above — save up to 30% on 2 or more</>
            )}
          </p>
        )}

        {/* Promo / gift / QATEST code input — single field that handles all three */}
        <div className="mb-3 text-center">
          {!codeOpen && !appliedCoupon && (
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              style={{ background: "none", border: "none", color: "var(--gold, #c4a265)", fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
            >
              Have a promo or gift code?
            </button>
          )}
          {codeOpen && !appliedCoupon && (
            <div className="flex gap-2 items-stretch">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCode(); } }}
                placeholder="Enter code"
                aria-label="Promo or gift code"
                className="flex-1 px-3 py-2.5 rounded-lg outline-none uppercase"
                style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: 16, color: "var(--ink, #1f1c18)", background: "#fff", border: codeError ? "1.5px solid var(--rose, #bf524a)" : "1.5px solid var(--cream3, #f3eadb)", minHeight: 44 }}
              />
              <button
                type="button"
                onClick={handleApplyCode}
                disabled={codeStatus === "checking" || !codeInput.trim()}
                style={{ padding: "0 18px", background: "var(--rose, #bf524a)", color: "#fff", border: "none", borderRadius: 10, fontFamily: "Cormorant, Georgia, serif", fontWeight: 700, fontSize: "0.92rem", cursor: codeStatus === "checking" ? "wait" : "pointer", whiteSpace: "nowrap", minHeight: 44 }}
              >
                {codeStatus === "checking" ? "Checking…" : "Apply"}
              </button>
            </div>
          )}
          {appliedCoupon && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(74,140,92,0.1)", border: "1px solid rgba(74,140,92,0.3)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--green, #4a8c5c)", fontWeight: 600 }}>
                ✓ {appliedCoupon.code} — {appliedCoupon.discount_value}% off applied
              </span>
              <button type="button" onClick={removeAppliedCoupon} aria-label="Remove code" style={{ background: "none", border: "none", color: "var(--green, #4a8c5c)", cursor: "pointer", fontSize: "1rem" }}>×</button>
            </div>
          )}
          {codeError && <p className="mt-1.5" style={{ fontSize: "0.78rem", color: "var(--rose, #bf524a)" }}>{codeError}</p>}
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
            Your email (so you can return to their reading anytime)
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
            `${ctaLabel} · ${fmtUsd(finalPrice + charityBonus)}`
          )}
        </button>

        {/* Currency note — only shown when display currency is not USD */}
        {isLocalized && (
          <p
            className="text-center mt-2"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.75rem",
              color: "var(--muted, #958779)",
            }}
          >
            Shown in {currencyCode} · billed in USD at today's rate
          </p>
        )}

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
            Includes {fmtUsd(charityBonus)} charity donation
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

      </div>

      {/* ── Full-screen SoulSpeak modal — opens from the SoulSpeak row ── */}
      {soulSpeakOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="soulspeak-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeSoulSpeak(); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(20, 18, 16, 0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "5vw",
            animation: "soulSpeakBackdropIn 0.25s ease",
          }}
        >
          <div
            className="relative"
            style={{
              width: "min(560px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--cream, #FFFDF5)",
              borderRadius: 20,
              padding: "clamp(24px, 5vw, 40px) clamp(22px, 5vw, 38px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              animation: "soulSpeakPanelIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <button
              type="button"
              onClick={closeSoulSpeak}
              aria-label="Close"
              className="absolute top-3 right-3 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ width: 34, height: 34, background: "rgba(196,162,101,0.14)", color: "var(--ink, #1f1c18)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-5">
              <span
                style={{
                  display: "inline-block",
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #d4b26b, #c4a265)",
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                SoulSpeak · New
              </span>
              <h3
                id="soulspeak-modal-title"
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.4rem, 5.5vw, 1.9rem)",
                  color: "var(--black, #141210)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.015em",
                  margin: 0,
                }}
              >
                Ever wondered what they'd
                <br />
                <em style={{ color: "var(--rose, #bf524a)" }}>say if they could?</em>
              </h3>
            </div>

            <SoulSpeakPreview />

            <p
              className="text-center mt-5"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "0.82rem",
                color: "var(--muted, #958779)",
              }}
            >
              SoulSpeak is included with every reading.
            </p>
          </div>

          <style>{`
            @keyframes soulSpeakBackdropIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes soulSpeakPanelIn {
              from { opacity: 0; transform: translateY(18px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)    scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* ── Horoscope preview modal — opens from the horoscope row ── */}
      {horoscopeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="horoscope-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeHoroscope(); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(20, 18, 16, 0.55)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "5vw",
            animation: "soulSpeakBackdropIn 0.25s ease",
          }}
        >
          <div
            className="relative"
            style={{
              width: "min(560px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--cream, #FFFDF5)",
              borderRadius: 20,
              padding: "clamp(24px, 5vw, 40px) clamp(22px, 5vw, 38px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              animation: "soulSpeakPanelIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <button
              type="button"
              onClick={closeHoroscope}
              aria-label="Close"
              className="absolute top-3 right-3 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ width: 34, height: 34, background: "rgba(196,162,101,0.14)", color: "var(--ink, #1f1c18)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-5">
              <span
                style={{
                  display: "inline-block",
                  fontFamily: "Cormorant, Georgia, serif",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #5aa870, #4a8c5c)",
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                Weekly Horoscopes · Free
              </span>
              <h3
                id="horoscope-modal-title"
                style={{
                  fontFamily: '"DM Serif Display", Georgia, serif',
                  fontSize: "clamp(1.5rem, 6vw, 2rem)",
                  color: "var(--black, #141210)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.015em",
                  margin: 0,
                }}
              >
                Sundays <em style={{ color: "var(--rose, #bf524a)" }}>with them.</em>
              </h3>
            </div>

            <HoroscopePreview />

            <p
              className="text-center mt-6"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "0.8rem",
                color: "var(--muted, #958779)",
              }}
            >
              First month on us. Cancel anytime.
            </p>
          </div>
        </div>
      )}
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
  "ifaw": {
    label: "IFAW",
    tagline: "rescue and rehab for animals in crisis, worldwide.",
  },
  "world-land-trust": {
    label: "World Land Trust",
    tagline: "protecting wild habitat across the globe.",
  },
  "eden-reforestation": {
    label: "Eden Reforestation",
    tagline: "planting trees and restoring forests worldwide.",
  },
};

const CHARITY_ORDER: CharitySlug[] = ["ifaw", "world-land-trust", "eden-reforestation"];

const CharityBrandRow = ({
  selected,
  onSelect,
}: {
  selected: CharitySlug;
  onSelect: (id: CharitySlug) => void;
}) => {
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
          fontVariantNumeric: "lining-nums",
          color: "var(--gold, #c4a265)",
        }}
      >
        10% of your reading goes to
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
      <ul
        className="mt-3 space-y-0.5 text-center"
        style={{
          listStyle: "none",
          padding: 0,
          margin: "12px 0 0",
          fontFamily: "Cormorant, Georgia, serif",
          fontStyle: "italic",
          fontSize: "0.72rem",
          color: "var(--muted, #958779)",
          lineHeight: 1.5,
        }}
      >
        {CHARITY_ORDER.map((id) => {
          const meta = CHARITY_BRAND_META[id];
          const isSelected = selected === id;
          return (
            <li
              key={id}
              style={{
                color: isSelected ? "var(--earth, #6e6259)" : "var(--muted, #958779)",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              <span style={{ fontStyle: "normal", fontWeight: 600 }}>{meta.label}</span>
              {" — "}
              {meta.tagline}
            </li>
          );
        })}
      </ul>
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
  <div className="space-y-5">
    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontSize: "1.05rem",
        fontWeight: 600,
        color: "var(--ink, #1f1c18)",
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      A cosmic forecast — written every Sunday, just for them.
    </p>

    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontSize: "0.95rem",
        color: "var(--earth, #6e6259)",
        lineHeight: 1.75,
        textAlign: "center",
        padding: "0 4px",
      }}
    >
      Like a weather forecast — but made of starlight. Each Sunday, you'll see what the week ahead holds for their little soul: the tender days, the stirring ones, the quiet ones. A gentle map of the cosmos moving through their world — so nothing arrives without meaning.
    </p>

    <p
      style={{
        fontFamily: "Cormorant, Georgia, serif",
        fontSize: "0.92rem",
        color: "var(--earth, #6e6259)",
        lineHeight: 1.7,
        textAlign: "center",
        padding: "0 4px",
      }}
    >
      Without it, the weeks just <em style={{ color: "var(--ink, #1f1c18)" }}>pass</em>. The small shifts, the soft turns, the days that wanted to be noticed — gone by before you saw them. And they only get so many weeks <em style={{ color: "var(--rose, #bf524a)" }}>with you</em>.
    </p>

    <div
      style={{
        textAlign: "center",
        padding: "18px 22px",
        borderRadius: 14,
        background: "rgba(196,162,101,0.08)",
      }}
    >
      <p
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontStyle: "italic",
          fontSize: "0.95rem",
          color: "var(--ink, #1f1c18)",
          lineHeight: 1.6,
        }}
      >
        Knowing their week <br className="hidden sm:block" />is a way of knowing them deeper.
      </p>
    </div>
  </div>
);
