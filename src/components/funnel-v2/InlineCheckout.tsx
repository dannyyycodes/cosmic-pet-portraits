import { useState, useEffect, useRef, useCallback, forwardRef, type ReactNode, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getReferralCode } from "@/lib/referralTracking";
import { getUtm } from "@/lib/utm";
import { useLocalizedPrice } from "@/hooks/useLocalizedPrice";
import { HeartsBackdrop } from "./HeartsBackdrop";
import { DossierCheckout, REVIEWS } from "./DossierCheckout";
import { PaymentMethodsRow } from "./PaymentMethodsRow";
import { trackSpine } from "@/lib/funnelSpine";

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

type TierDef = {
  id: TierId;
  name: string;
  badge?: string;
  features: Feature[];
};

const TIERS: TierDef[] = [
  {
    id: "basic",
    name: "Soul Reading",
    features: [
      { label: "Included:", kind: "divider" },
      { label: "Full astrological breakdown, 30+ sections (works for any pet)" },
      { label: "How they love, how they learn, how they heal, what they hope for, what they fear, and what makes them feel most themselves" },
      { label: "Their photo becomes part of the reveal" },
      { label: "Yours forever. Revisit anytime, from any device" },
      { label: "Bonus sections, little surprises written just for them", kind: "bonus" },
      { label: "SoulSpeak", kind: "soulspeak" },
      { label: "1 month of weekly horoscopes", kind: "horoscope" },
    ],
  },
  {
    id: "premium",
    name: "Soul Bond",
    badge: "Most Chosen",
    features: [
      { label: "Everything in Soul Reading, plus:", kind: "divider" },
      { label: "Your chart against theirs, where you align, where you challenge each other, and why the universe paired you" },
      { label: "Where your energies meet, mirror, and balance" },
      { label: "The soul-reasons you found each other" },
    ],
  },
  {
    // Memorial Reading — surfaced only on the memorial path as a sole
    // full-card option. Shares Stripe price with Soul Bond so
    // memorialQty bundles into premiumCount at checkout. Horoscope
    // intentionally omitted — memorial readings are backward-looking.
    id: "memorial",
    name: "Memorial Reading",
    badge: "In Loving Memory",
    features: [
      { label: "Included:", kind: "divider" },
      { label: "Dedicated to what made them, them." },
      { label: "What they'd tell you if they could speak today." },
      { label: "Your chart and theirs, side by side. Why the universe chose you for each other." },
      { label: "The lesson they came to bring, and the love they came to give." },
      { label: "The gifts they brought into your life, named and honoured." },
      { label: "What they came to teach you, and what you gave them in return." },
      { label: "The parts of them you still carry." },
      { label: "What they loved about you." },
      { label: "A permanent home for their memory, with you, always." },
      { label: "A place where the conversation never has to end.", kind: "soulspeak" },
      { label: "Signs they might still be sending you, and how to notice." },
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
  /** Which intent the visitor selected. Drives the checkout header copy
   * — new-pet owners see an arrival-framed heading, discover readers
   * see the default, memorial is handled separately by memorialOnly. */
  path?: "new" | "discover" | "memorial";
  /** Optional visual shell for the new readings landing page. Keeps checkout
   *  state + Stripe handoff intact while avoiding the legacy cream sales-card UI.
   *  "dossier" is checkout variant B (Phase 5): one door, Soul Bond as a +bump. */
  visualMode?: "classic" | "cosmic" | "dossier";
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

export const InlineCheckout = forwardRef<HTMLDivElement, InlineCheckoutProps>(({ ctaLabel, charityId: charityIdProp, charityBonus = 0, onSelectedPriceChange, memorialDefaultExpanded = false, memorialOnly = false, path = "discover", visualMode = "classic" }, forwardedRef) => {
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

  // SEED GUARD: memorial only seeds when the Memorial tier can actually
  // RENDER — memorialOnly (any mode) or the classic shell, which carries its
  // own memorial card. Before this guard, a ?memorial=1 arrival on the cosmic
  // shell seeded an invisible 1× Memorial line: an empty "Your reading" panel
  // charging £49 for an item that never appeared on screen. Never again.
  const seedMemorial = memorialIntent && (memorialOnly || visualMode === "classic");

  // Per-tier quantities — users can mix Soul Reading + Soul Bond + Memorial in one order.
  // Default: 1× Soul Reading, 0× Soul Bond, 0× Memorial.
  // Memorial-intent arrivals (with a renderable memorial card) flip the
  // default to 1× Memorial, pill pre-expanded.
  const [basicQty, setBasicQty] = useState<number>(seedMemorial ? 0 : 1);
  const [premiumQty, setPremiumQty] = useState<number>(0);
  // Memorial Reading quantity — shares Stripe price with Soul Bond ($49).
  // Bundled into premiumCount when sent to create-checkout; occasionMode
  // ='memorial' is forwarded only when the cart is purely memorial.
  const [memorialQty, setMemorialQty] = useState<number>(seedMemorial ? 1 : 0);
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
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_type: string; discount_value: number; gift_only?: boolean } | null>(null);
  // Charity selection lives in the checkout card itself (compact brand row near payment badges).
  const [selectedCharity, setSelectedCharity] = useState<"ifaw" | "world-land-trust" | "eden-reforestation">(
    (charityIdProp as "ifaw" | "world-land-trust" | "eden-reforestation") || "ifaw"
  );
  const { ref: revealRef, visible } = useScrollReveal(0.05);
  const isInApp = useIsInAppBrowser();
  const { code: currencyCode, currency, isLocalized, prices, fmt, fmtWhole } = useLocalizedPrice();

  // SoulSpeak row click → open full-screen modal
  const openSoulSpeak = () => setSoulSpeakOpen(true);
  const closeSoulSpeak = () => setSoulSpeakOpen(false);
  const openHoroscope = () => setHoroscopeOpen(true);
  const closeHoroscope = () => setHoroscopeOpen(false);

  // ── Cosmic Wheel handoff ──────────────────────────────────────────
  //
  // SpinWheel.tsx writes the won prize to sessionStorage. On first
  // mount we look for it, prefill the email + reveal the code panel
  // with the code already applied, and re-render the cards with the
  // discount baked into the displayed totals. One read on mount —
  // refreshes don't re-apply (sessionStorage survives the SPA route
  // change but is wiped on tab close, which is the right TTL).
  const wheelPrizeApplied = useRef(false);
  // Extracted so we can run it on mount AND in response to the
  // `ls-wheel-prize` event dispatched by SpinWheel mid-session (the
  // wheel opens AFTER this component is already mounted, so the
  // mount-only read would always miss it without the listener).
  const applyWheelPrize = useCallback(async (
    source: { email?: string; code?: string; expiresAt?: string; prizeLabel?: string } | null,
  ) => {
    if (wheelPrizeApplied.current) return;
    if (!source?.code || !source?.email) return;
    if (source.expiresAt && new Date(source.expiresAt).getTime() < Date.now()) {
      try { sessionStorage.removeItem("ls_wheel_prize"); } catch { /* ignore */ }
      return;
    }
    wheelPrizeApplied.current = true;
    setEmail(source.email);
    setCodeOpen(true);
    setCodeInput(source.code);
    setCodeStatus("checking");
    try {
      const { data: coupons } = await supabase
        .from("coupons")
        .select("id,code,discount_type,discount_value,expires_at,max_uses,current_uses,gift_only")
        .eq("code", source.code)
        .eq("is_active", true)
        .limit(1);
      if (coupons && coupons.length > 0) {
        const c = coupons[0];
        if (c.expires_at && new Date(c.expires_at) < new Date()) {
          setCodeError("This code has expired");
          setCodeStatus("idle");
          return;
        }
        if (c.max_uses && c.current_uses >= c.max_uses) {
          setCodeError("This code has already been used");
          setCodeStatus("idle");
          return;
        }
        if (c.gift_only) {
          // Gift-only wheel prize (25% gift slice). Not applicable to this
          // flow — visitor should use it at /gift for a friend's reading.
          setCodeError("Your gift prize is saved. Use it at /gift to send a reading to a friend.");
          setCodeStatus("idle");
          return;
        }
        setAppliedCoupon(c);
        setCodeStatus("applied");
        trackFunnelEvent("v2_wheel_code_autoapplied", { code: source.code, prizeLabel: source.prizeLabel });
      } else {
        setCodeError("This code is no longer available");
        setCodeStatus("idle");
      }
    } catch (e) {
      console.error("[V2 wheel autofill]", e);
      setCodeStatus("idle");
    }
  }, []);

  useEffect(() => {
    // Mount: email prefill + one-shot read of any pre-existing prize.
    try {
      const fallback = sessionStorage.getItem("ls_wheel_email") || sessionStorage.getItem("ls_chart_email");
      if (fallback && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fallback)) {
        setEmail((current) => current || fallback);
      }
    } catch { /* ignore */ }
    try {
      const raw = sessionStorage.getItem("ls_wheel_prize");
      if (raw) applyWheelPrize(JSON.parse(raw));
    } catch { /* ignore */ }

    // Live: fires the moment SpinWheel reveals a prize in the same session.
    const onWheelPrize = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        email?: string; code?: string; expiresAt?: string; prizeLabel?: string;
      } | undefined;
      if (detail) applyWheelPrize(detail);
    };
    window.addEventListener("ls-wheel-prize", onWheelPrize);
    // Live: fires when the free-reading keep gate is submitted AFTER this
    // component has already mounted (the mount-time fallback above misses it).
    const onChartEmail = (e: Event) => {
      const detail = (e as CustomEvent).detail as { email?: string } | undefined;
      const kept = detail?.email;
      if (kept && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(kept)) {
        setEmail((current) => current || kept);
      }
    };
    window.addEventListener("ls-chart-email", onChartEmail);
    return () => {
      window.removeEventListener("ls-wheel-prize", onWheelPrize);
      window.removeEventListener("ls-chart-email", onChartEmail);
    };
  }, [applyWheelPrize]);

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
  // All amounts in MINOR UNITS (cents/pence) of the user's local currency.
  const basicPrice = prices.basic;
  const premiumPrice = prices.premium;
  const memorialPrice = prices.premium; // shares Soul Bond Stripe price
  const petCount = basicQty + premiumQty + memorialQty;
  const subtotal = basicQty * basicPrice + premiumQty * premiumPrice + memorialQty * memorialPrice;
  const discountRate = getVolumeDiscount(petCount);
  const volumeDiscountAmount = Math.round(subtotal * discountRate);
  const selectedPrice = Math.max(0, subtotal - volumeDiscountAmount);

  // Apply coupon discount on top of the volume discount before display.
  // Fixed-amount coupons (discount_value) are stored in USD cents server-side;
  // we keep the same value here since we live in minor units too.
  const couponDiscountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage" || appliedCoupon.discount_type === "percent"
      ? Math.round(selectedPrice * (appliedCoupon.discount_value / 100))
      : appliedCoupon.discount_value
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
        .select("id,code,discount_type,discount_value,expires_at,max_uses,current_uses,gift_only")
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
        if (coupon.gift_only) {
          setCodeError("This code is for gift purchases. Try it on the /gift page.");
          setCodeStatus("idle");
          return;
        }
        setAppliedCoupon(coupon);
        setCodeStatus("applied");
        trackFunnelEvent("v2_code_applied", { code, type: "coupon" });
        return;
      }
      // 2. Try as free redeem code (e.g. QATEST) — pass the buyer's cart
      // mix AND landing-path occasion intent so redeem-free-code creates
      // placeholder rows with the right occasion_mode per row. Previously
      // skipped occasionMode here, which meant memorial-path QATEST tests
      // landed on "What's the occasion?" intake picker instead of jumping
      // straight into the memorial flow (reported 2026-04-21).
      const redeemShouldForwardMemorial = memorialQty > 0 && basicQty === 0 && premiumQty === 0;
      const redeemOccasionMode: "memorial" | "new" | undefined =
        redeemShouldForwardMemorial ? "memorial"
        : path === "new" ? "new"
        : undefined;
      const { data: redeemData, error: redeemErr } = await supabase.functions.invoke("redeem-free-code", {
        body: {
          code,
          basicCount: basicQty,
          premiumCount: premiumQty,
          // Memorial tier is bundled into premiumCount for pricing but tracked
          // separately so redeem-free-code can stamp occasion='memorial' on
          // the right rows in mixed redemptions.
          memorialCount: memorialQty,
          occasionMode: redeemOccasionMode,
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

  // Pure memorial cart = the ONLY cart whose Stripe session offers Klarna and
  // the other BNPL/wallet methods (no horoscope bundle, so no off-session
  // narrowing to card + link). The payment badge row reads this live so the
  // marks always mirror the session the button would create — see
  // PaymentMethodsRow.tsx for the verified server truth (B10, 2026-07-17).
  const pureMemorialCart = memorialQty > 0 && basicQty === 0 && premiumQty === 0;
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
      const checkoutVariant = (() => {
        try { return localStorage.getItem("ls_checkout_variant"); } catch { return null; }
      })();
      const sessionId = sessionStorage.getItem("analytics_session_id") || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await supabase.from("page_analytics").insert([{
        session_id: sessionId,
        event_type: eventType,
        page_path: "/v2",
        event_data: {
          ...eventData,
          ...getUtm(),
          funnel_v2_variant: funnelV2Variant,
          ...(checkoutVariant ? { checkout_variant: checkoutVariant } : {}),
        } as never,
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

  const setCosmicTierQty = (id: TierId, quantity: number) => {
    const next = Math.max(1, Math.min(MAX_PETS, quantity));
    const nextBasic = id === "basic" ? next : 0;
    const nextPremium = id === "premium" ? next : 0;
    const nextMemorial = id === "memorial" ? next : 0;

    setBasicQty(nextBasic);
    setPremiumQty(nextPremium);
    setMemorialQty(nextMemorial);

    const nextSubtotal =
      nextBasic * basicPrice + nextPremium * premiumPrice + nextMemorial * memorialPrice;
    const nextDiscount = getVolumeDiscount(next);
    onSelectedPriceChange?.(Math.max(0, nextSubtotal * (1 - nextDiscount)));
    trackFunnelEvent("v2_cosmic_tier_qty_changed", { tier: id, qty: next, petCount: next });
  };

  const activateCosmicTier = (id: TierId) => {
    const current = tierQty(id);
    setCosmicTierQty(id, current > 0 ? current : 1);
    trackFunnelEvent("v2_cosmic_tier_selected", { tier: id, qty: Math.max(1, current) });
  };

  const changeCosmicTierQty = (id: TierId, delta: number) => {
    const current = tierQty(id);
    const next = current > 0 ? current + delta : 1;
    if (next < 1) return;
    setCosmicTierQty(id, next);
  };

  // Emit the initial price once on mount so parent CTAs start in sync.
  useEffect(() => {
    onSelectedPriceChange?.(selectedPrice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live intent flips (the threshold fork answers mid-session): when the
  // memorial path arrives after mount, move the cart onto the sole visible
  // Memorial tier; when it leaves and the shell can no longer render a
  // memorial card, fold back to one Soul Reading. The cart never carries a
  // line item the reader cannot see.
  useEffect(() => {
    if (memorialOnly) {
      if (memorialQty === 0) {
        setBasicQty(0);
        setPremiumQty(0);
        setMemorialQty(1);
        onSelectedPriceChange?.(memorialPrice);
      }
    } else if (visualMode !== "classic" && memorialQty > 0) {
      setBasicQty(1);
      setPremiumQty(0);
      setMemorialQty(0);
      onSelectedPriceChange?.(basicPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialOnly]);

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
    // Landing path → occasion_mode. Memorial takes priority (own tier). For
    // non-memorial carts, the landing choice ("new" vs "discover") decides
    // whether the report is written in arrival-bonding voice or established-
    // pet-revelation voice. Gift buyers have their own /gift flow and never
    // hit this code path.
    const occasionMode: "memorial" | "new" | "discover" | undefined =
      shouldForwardMemorial ? "memorial"
      : path === "new" ? "new"
      : undefined;
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
    // Spine: checkout_submit — the last client-side beat before Stripe.
    // Purchase truth stays server-side (webhook); this measures intent at the
    // button. Analytics only.
    trackSpine("checkout_submit", {
      price: selectedPrice,
      currency,
      pet_count: petCount,
      tier: primaryTier,
      occasion_mode: occasionMode || "discover",
    });
    if (memorialQty > 0 && !shouldForwardMemorial) {
      // Visible in prod console so support can trace Memorial intent even when
      // we can't forward it at the cart level yet.
      console.log("[V2 Checkout] memorial in mixed cart — intake will default per-pet", { basicQty, premiumQty, memorialQty });
    }

    // Per-pet weekly-horoscope consent map for the fail-closed webhook. The
    // quick funnel's promise ("1 month of weekly horoscopes, free") applies to
    // every LIVING pet, so we mark every non-memorial row true. Memorial rows
    // are the LAST memorialQty rows of the cart (mirrors the placeholder order
    // create-checkout writes), so they stay false — a living pet is enrolled in
    // the free month, a memorial pet never is. Pure-memorial carts send no map
    // at all because includeHoroscope is false there, so nobody is enrolled.
    // The webhook enrolls ONLY the indices flagged true and never falls back to
    // enroll-all, so this map is what actually delivers the free month.
    const firstMemorialIndex = petCount - memorialQty;
    const petHoroscopes: Record<string, boolean> | undefined = shouldForwardMemorial
      ? undefined
      : Object.fromEntries(
          Array.from({ length: petCount }, (_, i) => [String(i), i < firstMemorialIndex])
        );

    try {
      const refCode = getReferralCode();
      const { data, error: invokeError } = await supabase.functions.invoke("create-checkout", {
        body: {
          quickCheckout: true,
          selectedTier: primaryTier,
          // Per-tier breakdown — backend prices each tier independently, then applies volume discount on the total.
          // Memorial Reading is bundled into premiumCount (same Stripe price as Soul Bond).
          basicCount: basicQty,
          premiumCount: combinedPremiumCount,
          // Memorial rows are the LAST memorialCount placeholders in the cart
          // — create-checkout uses this to stamp occasion_mode='memorial' on
          // exactly those rows while non-memorial pets inherit the cart-level
          // landing occasion. This is what makes mixed carts work end-to-end
          // without a has_memorial workaround.
          memorialCount: memorialQty,
          abVariant: "V2",
          includesPortrait: combinedPremiumCount > 0,
          petCount,
          quickCheckoutEmail: email.trim(),
          referralCode: refCode || undefined,
          charityId: selectedCharity,
          charityBonus: charityBonus || 0,
          // Both living-pet tiers advertise "1 month of weekly horoscopes — free".
          // Pure Memorial carts must NOT get horoscope: forward-looking "what's
          // ahead this week" copy for a pet who has crossed the rainbow bridge
          // would be a serious care failure (also suppresses the horoscope line
          // on the Stripe checkout product description). Webhook already skips
          // the Stripe subscription for memorial rows — this stops the leak at
          // the source so the description reads cleanly too.
          includeHoroscope: !shouldForwardMemorial,
          // Explicit per-pet consent map (living pets = true, memorial = false).
          // create-checkout writes this into the Stripe session metadata as
          // pet_horoscopes; the webhook reads it to provision the free month for
          // exactly these pets. Without it the fail-closed webhook enrolls nobody.
          petHoroscopes,
          // Safety flag for mixed carts (memorial + non-memorial). The webhook
          // uses this to suppress horoscope-sub creation for the ENTIRE session
          // when memorial intent is present — even if individual pet_reports
          // rows ended up stamped 'discover' because the checkout metadata
          // doesn't yet support per-line-item occasion. Without this, a mixed
          // cart would silently enroll the memorial pet in weekly horoscopes.
          hasMemorial: memorialQty > 0,
          couponId: appliedCoupon?.id || undefined,
          // Forward memorial intent so placeholder pet_reports.occasion_mode
          // is pre-set to 'memorial' and PostPurchaseIntake defaults the
          // occasion picker accordingly. Only set when cart is purely memorial.
          occasionMode,
          currency,
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
              ? "linear-gradient(135deg, #8f6de0 0%, #9a7ee6 50%, #8f6de0 100%)"
              : "linear-gradient(135deg, rgba(154,126,230,0.35) 0%, rgba(154,126,230,0.2) 100%)";
            return `${fill} padding-box, ${frame} border-box`;
          })(),
          border: isSelected ? "2px solid transparent" : "1.5px solid transparent",
          boxShadow: isSelected
            ? "0 0 0 3px rgba(154,126,230,0.14), 0 8px 28px rgba(0,0,0,0.08)"
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
            style={{ width: 28, height: 28, background: "rgba(154,126,230,0.14)", color: "var(--ink, #1f1c18)", border: "none", cursor: "pointer" }}
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
              {fmt(tier.id === "basic" ? prices.basic : prices.premium)}
            </span>
            {(tier.id === "basic" || tier.id === "premium" || tier.id === "memorial") && (
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
                {fmt(tier.id === "basic" ? prices.wasBasic : prices.wasPremium)}
              </span>
            )}
          </div>
        </div>

        {/* ── Quantity stepper — add multiples of this tier ── */}
        <div
          className="flex items-center justify-between mb-3 rounded-lg px-2.5 py-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{ background: "rgba(154,126,230,0.08)", border: "1px solid rgba(154,126,230,0.18)" }}
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
          style={{ border: "1px solid rgba(154,126,230,0.14)" }}
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
                  color: isDivider ? "var(--gold, #7c5cd6)" : "var(--earth, #6e6259)",
                  fontWeight: isDivider ? 600 : 700,
                  fontStyle: isDivider ? "italic" : "normal",
                  lineHeight: 1.4,
                  cursor: isPreviewable ? "pointer" : "default",
                  background: isDivider
                    ? "rgba(154,126,230,0.08)"
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
                  const goldBadge = { ...badgeBaseStyle, background: "linear-gradient(135deg, #8f6de0, #7c5cd6)" };
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
                    <span>Bonus sections, little surprises written just for them</span>
                  ) : isHoroscope ? (
                    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        Weekly horoscopes, 1 month included
                        {infoIcon}
                      </span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8a7d72", lineHeight: 1.3 }}>
                        First month free, then {fmt(prices.horoscopeMonthly)}/mo, cancel anytime.
                      </span>
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

  const renderCosmicTier = (tier: (typeof TIERS)[number], intent: "core" | "bond" | "memorial") => {
    const qty = tierQty(tier.id);
    const isSelected = qty > 0;
    const price = tier.id === "basic" ? prices.basic : tier.id === "memorial" ? memorialPrice : prices.premium;
    // Memorial never shows a was-price: no price theatrics near grief.
    const wasPrice = tier.id === "basic" ? prices.wasBasic : tier.id === "premium" ? prices.wasPremium : null;
    const minusDisabled = qty <= 1;
    const atMax = qty >= MAX_PETS;
    // Memorial feature lines reuse the classic Memorial tier copy verbatim.
    const cosmicFeatures = intent === "memorial"
      ? ["What they'd tell you if they could speak today.", "The parts of them you still carry.", "A place where the conversation never has to end."]
      : intent === "core"
        ? ["Birth sky, 30+ sections", "Their emotional blueprint", "SoulSpeak included"]
        : ["Your chart beside theirs", "Where you mirror", "Why you found each other"];

    return (
      <article
        key={tier.id}
        className={`cosmic-tier ${isSelected ? "is-selected" : ""} ${intent === "bond" ? "is-featured" : ""} ${intent === "memorial" ? "is-memorial" : ""}`}
        onClick={() => activateCosmicTier(tier.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activateCosmicTier(tier.id); } }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
      >
        {tier.badge && <span className="cosmic-tier-badge">{tier.badge}</span>}
        <div className="cosmic-tier-head">
          <span className="cosmic-radio" aria-hidden="true" />
          <div>
            <h3>{tier.name}</h3>
            <p>
              {intent === "memorial"
                ? "Dedicated to what made them, them."
                : intent === "core"
                  ? "For the little soul in front of you."
                  : "For the story between the two of you."}
            </p>
          </div>
        </div>

        <div className="cosmic-tier-price">
          <strong>{fmt(price)}</strong>
          {wasPrice != null && <span>{fmt(wasPrice)}</span>}
        </div>

        <ul className="cosmic-feature-list">
          {cosmicFeatures.map((feature) => (
            <li key={`${tier.id}-${feature}`}>
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
                </svg>
              </span>
              <p>{feature}</p>
            </li>
          ))}
        </ul>

        {intent === "memorial" ? (
          /* No "- 1 +" machinery next to grief. A quiet disclosure opens only
             if it is needed, and speaks in the same voice as the card. */
          <details
            className="cosmic-mem-more"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <summary>More than one little soul?</summary>
            <div className="cosmic-mem-more-body">
              <p>One reading for each of them, each written alone.</p>
              <div className="cosmic-mem-more-count">
                <button
                  type="button"
                  disabled={minusDisabled}
                  aria-label="One fewer reading"
                  onClick={(e) => { e.stopPropagation(); changeCosmicTierQty(tier.id, -1); }}
                >
                  &#8722;
                </button>
                <b>{qty} {qty === 1 ? "reading" : "readings"}</b>
                <button
                  type="button"
                  disabled={atMax}
                  aria-label="One more reading"
                  onClick={(e) => { e.stopPropagation(); changeCosmicTierQty(tier.id, 1); }}
                >
                  +
                </button>
              </div>
            </div>
          </details>
        ) : (
          <div className="cosmic-stepper" onClick={(e) => e.stopPropagation()}>
            <span>Readings</span>
            <div>
              <button
                type="button"
                disabled={minusDisabled}
                aria-label={`Remove one ${tier.name}`}
                onClick={(e) => { e.stopPropagation(); changeCosmicTierQty(tier.id, -1); }}
              >
                -
              </button>
              <b>{qty}</b>
              <button
                type="button"
                disabled={atMax}
                aria-label={`Add one ${tier.name}`}
                onClick={(e) => { e.stopPropagation(); changeCosmicTierQty(tier.id, 1); }}
              >
                +
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  if (visualMode === "dossier") {
    // Variant B: one door (Soul Reading), Soul Bond as a +bump that swaps the
    // whole order to the EXISTING premium Stripe price. Single-tier cart:
    // bond=false → basicQty=qty, bond=true → premiumQty=qty. Memorial never
    // renders this mode (CheckoutSection forces the control for memorial intent).
    const dossierBond = premiumQty > 0;
    const dossierQty = Math.max(1, petCount);
    const setDossierState = (nextBond: boolean, nextQty: number) => {
      const q = Math.max(1, Math.min(MAX_PETS, nextQty));
      const b = nextBond ? 0 : q;
      const p = nextBond ? q : 0;
      setBasicQty(b);
      setPremiumQty(p);
      setMemorialQty(0);
      const nextSubtotal = b * basicPrice + p * premiumPrice;
      const rate = getVolumeDiscount(q);
      onSelectedPriceChange?.(Math.max(0, nextSubtotal * (1 - rate)));
    };
    return (
      <section ref={sectionRef} id="checkout" style={{ position: "relative", padding: "0 20px" }}>
        <DossierCheckout
          ctaLabel={ctaLabel}
          fmt={fmt}
          horoscopeMonthly={prices.horoscopeMonthly}
          unitNow={dossierBond ? premiumPrice : basicPrice}
          unitWas={dossierBond ? prices.wasPremium : prices.wasBasic}
          bondDelta={premiumPrice - basicPrice}
          finalPrice={finalPrice + charityBonus * 100}
          discountRate={discountRate}
          isLocalized={isLocalized}
          currencyCode={currencyCode}
          bond={dossierBond}
          qty={dossierQty}
          onBondChange={(on) => setDossierState(on, dossierQty)}
          onQtyChange={(q) => {
            setDossierState(dossierBond, q);
            trackFunnelEvent("v2_dossier_qty_changed", { qty: q, bond: dossierBond });
          }}
          email={email}
          onEmailChange={(v) => { setEmail(v); setError(""); }}
          error={error}
          isLoading={isLoading}
          onCheckout={handleCheckout}
          codeOpen={codeOpen}
          onCodeOpen={() => setCodeOpen(true)}
          codeInput={codeInput}
          onCodeInput={(v) => { setCodeInput(v); setCodeError(""); }}
          codeStatus={codeStatus}
          codeError={codeError}
          appliedCoupon={appliedCoupon}
          onApplyCode={handleApplyCode}
          onRemoveCoupon={removeAppliedCoupon}
          couponDiscountAmount={couponDiscountAmount}
          selectedCharity={selectedCharity}
          onCharityChange={setSelectedCharity}
          onTrack={trackFunnelEvent}
        />
      </section>
    );
  }

  if (visualMode === "cosmic") {
    return (
      <section ref={sectionRef} id="checkout" className={`cosmic-checkout${memorialOnly ? " is-memorial" : ""}`}>
        <style>{`
          .cosmic-checkout {
            position: relative;
            overflow: hidden;
            padding: 0;
            background: transparent;
            color: #ffffff;
            scroll-margin-top: 96px;
          }
          .cosmic-checkout::before {
            content: "";
            position: absolute;
            inset: 0;
            background:
              radial-gradient(ellipse at 76% 6%, rgba(154,126,230,0.16), transparent 34%),
              radial-gradient(ellipse at 12% 96%, rgba(94,70,122,0.22), transparent 38%);
            pointer-events: none;
          }
          .cosmic-checkout-shell {
            position: relative;
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(340px, 0.82fr);
            gap: clamp(18px, 3vw, 30px);
            border: 1px solid rgba(154,126,230,0.38);
            border-top-color: rgba(154,126,230,0.68);
            border-radius: 8px;
            background:
              linear-gradient(110deg, rgba(237,233,247,0.074), rgba(237,233,247,0.032)),
              rgba(13,10,20,0.84);
            box-shadow: inset 0 1px 0 rgba(237,233,247,0.06), 0 28px 90px rgba(0,0,0,0.30);
            padding: clamp(18px, 3.5vw, 36px);
          }
          .cosmic-checkout-copy {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          .cosmic-checkout-kicker,
          .cosmic-mini-label {
            color: #9a7ee6;
            font-family: Lato, system-ui, sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }
          .cosmic-checkout-title {
            max-width: 520px;
            margin: 0;
            color: #ffffff;
            font-family: "Playfair Display", Georgia, serif;
            font-size: clamp(2.25rem, 4.6vw, 3.75rem);
            font-weight: 500;
            line-height: 0.98;
          }
          .cosmic-checkout-body {
            max-width: 600px;
            margin: 0;
            color: #ececf2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 1rem;
            line-height: 1.72;
          }
          .cosmic-tier-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 8px;
          }
          .cosmic-tier {
            position: relative;
            min-height: 330px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            border: 1px solid rgba(237,233,247,0.16);
            border-radius: 10px;
            background:
              radial-gradient(ellipse at 50% 0%, rgba(124,92,214,0.12), transparent 44%),
              linear-gradient(180deg, rgba(28,22,38,0.55), rgba(5,4,7,0.32));
            box-shadow: inset 0 1px 0 rgba(237,233,247,0.05), 0 10px 26px rgba(0,0,0,0.22);
            padding: 22px;
            cursor: pointer;
            transition: transform 260ms cubic-bezier(0.22,0.7,0.2,1), border-color 220ms ease, box-shadow 260ms ease;
          }
          .cosmic-tier:hover {
            border-color: rgba(154,126,230,0.44);
            box-shadow: inset 0 1px 0 rgba(237,233,247,0.06), 0 16px 40px rgba(0,0,0,0.3);
          }
          .cosmic-tier.is-selected {
            border-color: rgba(124,92,214,0.85);
            box-shadow: 0 0 0 1px rgba(124,92,214,0.4), 0 22px 56px rgba(0,0,0,0.34);
          }
          /* Soul Bond — the most-chosen tier is genuinely elevated: a brighter
             lavender-lit surface, a defining light hairline, real lift and shadow. */
          .cosmic-tier.is-featured {
            border-color: rgba(185,165,240,0.58);
            background:
              radial-gradient(ellipse at 50% -10%, rgba(185,165,240,0.16), transparent 46%),
              radial-gradient(ellipse at 50% 4%, rgba(124,92,214,0.2), transparent 52%),
              linear-gradient(180deg, rgba(34,25,44,0.72), rgba(9,7,14,0.5));
            box-shadow: inset 0 1px 0 rgba(185,165,240,0.18), 0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(154,126,230,0.16);
          }
          .cosmic-tier.is-featured.is-selected {
            border-color: rgba(185,165,240,0.85);
            box-shadow: inset 0 1px 0 rgba(185,165,240,0.22), 0 0 0 1px rgba(154,126,230,0.45), 0 26px 64px rgba(0,0,0,0.46);
          }
          @media (min-width: 901px) {
            .cosmic-tier.is-featured { transform: translateY(-10px); }
            .cosmic-tier.is-featured:hover { transform: translateY(-13px); }
          }
          .cosmic-tier-badge {
            position: absolute;
            top: -12px;
            right: 18px;
            border-radius: 999px;
            background: linear-gradient(135deg, #b9a5f0, #9a7ee6);
            color: #1c1330;
            padding: 5px 12px;
            font-family: Lato, system-ui, sans-serif;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            box-shadow: 0 6px 18px rgba(0,0,0,0.4);
          }
          .cosmic-tier-head {
            display: grid;
            grid-template-columns: 22px 1fr;
            gap: 12px;
            align-items: start;
          }
          .cosmic-radio {
            width: 18px;
            height: 18px;
            margin-top: 6px;
            border: 2px solid rgba(124,92,214,0.6);
            border-radius: 999px;
          }
          .cosmic-tier.is-selected .cosmic-radio {
            box-shadow: inset 0 0 0 4px #15101c;
            background: #7c5cd6;
          }
          .cosmic-tier h3 {
            margin: 0;
            color: #ffffff;
            font-family: "Playfair Display", Georgia, serif;
            font-size: 1.62rem;
            line-height: 1.06;
            font-weight: 500;
          }
          .cosmic-tier p {
            margin: 8px 0 0;
            color: #c8c8d2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 0.88rem;
            line-height: 1.48;
          }
          .cosmic-tier-price strong {
            color: #ffffff;
            font-family: "Playfair Display", Georgia, serif;
            font-size: 2.2rem;
            font-weight: 500;
          }
          .cosmic-tier-price span {
            margin-left: 8px;
            color: rgba(207,193,177,0.55);
            text-decoration: line-through;
          }
          .cosmic-feature-list {
            display: grid;
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .cosmic-feature-list li {
            display: grid;
            grid-template-columns: 18px 1fr;
            gap: 10px;
            align-items: start;
            border-top: 0;
            padding-top: 0;
          }
          .cosmic-feature-list li > span {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 20px;
            color: #74c88a;
          }
          .cosmic-tier.is-featured .cosmic-feature-list li > span { color: #86d69b; }
          .cosmic-feature-list p,
          .cosmic-feature-list button {
            margin: 0;
            color: #ececf2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 0.86rem;
            font-weight: 600;
            line-height: 1.45;
          }
          .cosmic-feature-list button {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border: 0;
            background: none;
            padding: 0;
            text-align: left;
            cursor: pointer;
          }
          .cosmic-feature-list small {
            flex-shrink: 0;
            border: 1px solid rgba(154,126,230,0.34);
            border-radius: 999px;
            color: #ffffff;
            padding: 3px 7px;
            font-size: 0.62rem;
            font-weight: 800;
            letter-spacing: 0.07em;
            text-transform: uppercase;
          }
          .cosmic-stepper {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            border: 1px solid rgba(154,126,230,0.26);
            border-radius: 8px;
            background: rgba(5,4,7,0.48);
            padding: 10px 12px;
          }
          .cosmic-included-strip {
            display: grid;
            grid-template-columns: 1fr auto auto;
            gap: 12px;
            align-items: center;
            border: 1px solid rgba(154,126,230,0.26);
            border-radius: 8px;
            background: rgba(5,4,7,0.35);
            padding: 14px;
          }
          .cosmic-included-strip p {
            margin: 0;
            color: #ececf2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 0.86rem;
            line-height: 1.48;
          }
          .cosmic-horo-note {
            grid-column: 1 / -1;
            margin: 2px 0 0;
            color: #c8c8d2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 0.8rem;
            line-height: 1.45;
          }
          .cosmic-preview-link {
            min-height: 36px;
            border: 1px solid rgba(154,126,230,0.36);
            border-radius: 999px;
            background: rgba(154,126,230,0.1);
            color: #ffffff;
            padding: 0 12px;
            font-family: Lato, system-ui, sans-serif;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .cosmic-stepper > span {
            color: #ececf2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 0.82rem;
          }
          .cosmic-stepper div {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .cosmic-stepper button {
            width: 38px;
            height: 38px;
            border: 1px solid rgba(154,126,230,0.38);
            border-radius: 999px;
            background: rgba(237,233,247,0.06);
            color: #ffffff;
            font: 700 18px/1 Lato, system-ui, sans-serif;
          }
          .cosmic-stepper button:disabled {
            opacity: 0.35;
          }
          .cosmic-stepper b {
            min-width: 20px;
            color: #ffffff;
            text-align: center;
            font-family: "Playfair Display", Georgia, serif;
            font-size: 1.2rem;
          }
          /* Memorial header lines speak serif with the rest of the path. */
          .cosmic-mem-kicker { font-family: "Newsreader", Georgia, serif; font-weight: 600; }
          .cosmic-mem-lede { font-family: "Newsreader", Georgia, serif; }
          /* ── Memorial card: the serif brand voice, quiet machinery ────────
             The one £49 door on the memorial path speaks serif like the rest
             of the reading, not interface sans; its marks are violet, never
             traffic-light green; and the stepper is a soft disclosure. */
          .cosmic-tier.is-memorial { cursor: default; }
          .cosmic-tier.is-memorial .cosmic-tier-head p {
            font-family: "Newsreader", Georgia, serif;
            font-style: italic;
            font-size: 1.04rem;
            line-height: 1.5;
            color: #d9d3e6;
          }
          .cosmic-tier.is-memorial .cosmic-feature-list p {
            font-family: "Newsreader", Georgia, serif;
            font-weight: 500;
            font-size: 1rem;
            line-height: 1.5;
            color: #e7e2f2;
          }
          .cosmic-tier.is-memorial .cosmic-feature-list li > span { color: #b9a5f0; }
          .cosmic-mem-more {
            margin-top: auto;
            border-top: 1px solid rgba(154,126,230,0.22);
            padding-top: 6px;
          }
          .cosmic-mem-more summary {
            list-style: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 44px;
            color: #cfc0f4;
            font-family: "Newsreader", Georgia, serif;
            font-style: italic;
            font-size: 1.02rem;
          }
          .cosmic-mem-more summary::-webkit-details-marker { display: none; }
          .cosmic-mem-more summary::after {
            content: "";
            width: 7px;
            height: 7px;
            border-right: 1.4px solid #9b8fd0;
            border-bottom: 1.4px solid #9b8fd0;
            transform: rotate(45deg) translateY(-2px);
            transition: transform 200ms ease;
          }
          .cosmic-mem-more[open] summary::after { transform: rotate(225deg) translateY(-2px); }
          .cosmic-mem-more-body { padding: 4px 0 8px; }
          .cosmic-mem-more-body > p {
            margin: 0 0 12px;
            text-align: center;
            color: #c8c8d2;
            font-family: "Newsreader", Georgia, serif;
            font-style: italic;
            font-size: 1rem;
          }
          .cosmic-mem-more-count {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }
          .cosmic-mem-more-count button {
            width: 44px;
            height: 44px;
            border: 1px solid rgba(154,126,230,0.38);
            border-radius: 999px;
            background: rgba(237,233,247,0.06);
            color: #ffffff;
            font: 500 20px/1 "Newsreader", Georgia, serif;
          }
          .cosmic-mem-more-count button:disabled { opacity: 0.35; }
          .cosmic-mem-more-count b {
            color: #ffffff;
            font-family: "Newsreader", Georgia, serif;
            font-weight: 500;
            font-size: 1.08rem;
          }
          .cosmic-mem-assure {
            margin: 18px auto 0;
            max-width: 420px;
            text-align: center;
            color: #cfc0f4;
            font-family: "Newsreader", Georgia, serif;
            font-style: italic;
            font-size: 1.04rem;
            line-height: 1.6;
          }
          .cosmic-mem-review {
            margin: 18px auto 0;
            max-width: 420px;
            width: 100%;
            padding: 20px 22px;
            border-radius: 12px;
            border: 1px solid rgba(154,126,230,0.28);
            background: linear-gradient(180deg, rgba(28,22,38,0.55), rgba(5,4,7,0.32));
          }
          .cosmic-mem-review-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          }
          .cosmic-mem-review-ph {
            width: 52px;
            height: 52px;
            border-radius: 12px;
            overflow: hidden;
            flex: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          }
          .cosmic-mem-review-ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
          /* Beat the generic payment-chip [role="img"] treatment: the stars
             are quiet marks, not a boxed chip. */
          .cosmic-checkout .cosmic-mem-stars {
            display: flex; gap: 3px;
            min-height: 0 !important; border-radius: 0 !important; box-shadow: none !important;
          }
          /* STAR GOLD — Danny's ONE gold exception (2026-07-16). Review-star
             FILLS + their drop-shadow only; never borders, text, CTAs, or
             engraving. Same recipe as dsr-stargold / ls-star-gold. */
          .cosmic-mem-stars svg { width: 13px; height: 13px; fill: url(#cosmic-mem-stargold); display: block;
            filter: drop-shadow(0 0 4px rgba(196,162,101,0.28)); }
          .cosmic-mem-review blockquote {
            margin: 0;
            color: #d9d3e6;
            font-family: "Newsreader", Georgia, serif;
            font-style: italic;
            font-size: 1rem;
            line-height: 1.62;
          }
          .cosmic-mem-review blockquote::before { content: "\\201C"; }
          .cosmic-mem-review blockquote::after { content: "\\201D"; }
          .cosmic-mem-review figcaption {
            margin-top: 10px;
            color: #9b8fd0;
            font-family: "Newsreader", Georgia, serif;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          @media (prefers-reduced-motion: reduce) {
            .cosmic-mem-more summary::after { transition: none !important; }
          }
          .cosmic-order-panel {
            align-self: start;
            position: sticky;
            top: 80px;
            z-index: 2;
            border: 1px solid rgba(154,126,230,0.5);
            border-top-color: rgba(185,165,240,0.76);
            border-radius: 12px;
            background:
              radial-gradient(ellipse at 50% -8%, rgba(185,165,240,0.2), transparent 42%),
              radial-gradient(ellipse at 50% 2%, rgba(154,126,230,0.12), transparent 60%),
              linear-gradient(180deg, rgba(26,19,32,0.88), rgba(7,5,11,0.8));
            box-shadow: inset 0 1px 0 rgba(185,165,240,0.18), 0 30px 82px rgba(0,0,0,0.52);
            padding: clamp(20px, 2.6vw, 28px);
          }
          .cosmic-order-row,
          .cosmic-total-row {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            border-bottom: 1px solid rgba(237,233,247,0.08);
            padding: 12px 0;
            color: #ececf2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 1rem;
          }
          .cosmic-total-row {
            border-bottom: 0;
            color: #ffffff;
            font-size: 1.05rem;
          }
          .cosmic-total-row strong {
            color: #ffffff;
            font-family: "Playfair Display", Georgia, serif;
            font-size: 1.8rem;
            font-weight: 500;
          }
          .cosmic-code-button {
            width: 100%;
            border: 0;
            background: none;
            color: #9a7ee6;
            padding: 10px 0;
            font-family: Lato, system-ui, sans-serif;
            font-size: 1rem;
            font-weight: 700;
          }
          .cosmic-code-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
            margin: 12px 0;
          }
          .cosmic-order-panel input {
            width: 100%;
            min-height: 48px;
            border: 1px solid rgba(154,126,230,0.38);
            border-radius: 8px;
            background: rgba(5,4,7,0.76);
            color: #ffffff;
            padding: 0 14px;
            font-family: Lato, system-ui, sans-serif;
          }
          .cosmic-order-panel label {
            display: block;
            margin: 14px 0 7px;
            color: #ececf2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 1rem;
            font-weight: 700;
          }
          .cosmic-primary-button,
          .cosmic-apply-button {
            min-height: 50px;
            border: 1px solid #9a7ee6;
            border-radius: 8px;
            background: linear-gradient(180deg, #9a7ee6, #7c5cd6);
            color: #ffffff;
            font-family: Lato, system-ui, sans-serif;
            font-weight: 800;
          }
          .cosmic-primary-button {
            width: 100%;
            margin-top: 14px;
          }
          .cosmic-gift-link {
            display: flex;
            justify-content: center;
            margin-top: 12px;
            color: #ffffff;
            font-family: Lato, system-ui, sans-serif;
            font-size: 1rem;
            text-decoration: none;
          }
          .cosmic-proof {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 18px 0;
          }
          .cosmic-proof span {
            color: #ececf2;
            text-align: center;
            font-family: Lato, system-ui, sans-serif;
            font-size: 1rem;
            line-height: 1.35;
          }
          .cosmic-refund {
            color: #ececf2;
            text-align: center;
            font-family: Cormorant, Georgia, serif;
            font-size: 1.08rem;
            font-style: italic;
            line-height: 1.4;
          }
          /* ── Unified trust band: proof row, guarantee, payment tray, charity ── */
          .cosmic-trust-band {
            margin-top: 20px;
            border-top: 1px solid rgba(154,126,230,0.26);
            padding-top: 18px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .cosmic-trust-band .cosmic-proof { margin: 0; }
          .cosmic-trust-band .cosmic-proof span {
            flex-direction: column;
            gap: 6px;
          }
          .cosmic-trust-band .cosmic-proof span svg { color: #9a7ee6; opacity: 0.92; }
          .cosmic-trust-band .cosmic-refund { margin: 0; }

          /* Payment methods sit in a recessed tray so the white chips read as
             intentional inset tiles, not stickers floating on the dark panel. */
          .cosmic-pay-tray {
            border: 1px solid rgba(154,126,230,0.18);
            border-radius: 12px;
            background: linear-gradient(180deg, rgba(237,233,247,0.05), rgba(5,4,7,0.28));
            padding: 12px 12px 14px;
          }
          .cosmic-checkout .cosmic-pay-tray > div { margin-top: 0; }
          .cosmic-checkout [role="img"] {
            min-height: 34px;
            border-radius: 9px !important;
            box-shadow: 0 4px 13px rgba(0,0,0,0.45);
          }

          /* Charity picker — show the REAL full-colour logos on their white chips
             (the near-black cosmic system needs the light chip so Visa navy /
             IFAW black text / the green marks all stay legible). */
          .cosmic-checkout .flex[role="radiogroup"] button {
            min-width: 108px;
          }
          .cosmic-checkout [role="radio"] {
            height: 42px !important;
            border-radius: 9px !important;
          }
          .cosmic-checkout [role="radio"] img {
            display: block !important;
            max-height: 24px !important;
            max-width: 100px !important;
            object-fit: contain;
          }
          .cosmic-checkout [role="radio"]::after { content: none; }
          .cosmic-charity-wrap { margin-top: 2px; }
          .cosmic-preview-backdrop {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: grid;
            place-items: center;
            background: rgba(5,4,7,0.68);
            padding: 22px;
          }
          .cosmic-preview-panel {
            width: min(520px, 94vw);
            border: 1px solid rgba(154,126,230,0.42);
            border-radius: 8px;
            background:
              radial-gradient(ellipse at 50% 0%, rgba(154,126,230,0.15), transparent 38%),
              linear-gradient(180deg, #17111e, #0d0a14);
            box-shadow: 0 28px 90px rgba(0,0,0,0.48);
            padding: clamp(22px, 4vw, 34px);
          }
          .cosmic-preview-panel h3 {
            margin: 0;
            color: #ffffff;
            font-family: "Playfair Display", Georgia, serif;
            font-size: clamp(2rem, 6vw, 3rem);
            font-weight: 500;
            line-height: 1;
          }
          .cosmic-preview-panel p {
            margin: 16px 0 0;
            color: #ececf2;
            font-family: Lato, system-ui, sans-serif;
            font-size: 1rem;
            line-height: 1.68;
          }
          .cosmic-preview-panel button {
            margin-top: 24px;
            min-height: 46px;
            border: 1px solid rgba(154,126,230,0.44);
            border-radius: 8px;
            background: rgba(154,126,230,0.12);
            color: #ffffff;
            padding: 0 18px;
            font-family: Lato, system-ui, sans-serif;
            font-weight: 800;
          }
          @media (max-width: 900px) {
            .cosmic-checkout-shell {
              grid-template-columns: 1fr;
              padding: 18px;
            }
            .cosmic-tier-grid {
              grid-template-columns: 1fr;
            }
            .cosmic-tier {
              min-height: 0;
            }
            .cosmic-included-strip {
              grid-template-columns: 1fr;
            }
            .cosmic-preview-link {
              width: 100%;
            }
            .cosmic-order-panel {
              position: relative;
              top: auto;
            }
          }
          @media (max-width: 520px) {
            .cosmic-checkout-title {
              font-size: clamp(2.2rem, 13vw, 3.2rem);
            }
            .cosmic-proof {
              grid-template-columns: 1fr;
            }
          }

          /* ── MEMORIAL RE-SKIN (2026-07-16, funnel registers rule) ─────────
             The memorial register re-surfaces the order panel in the funnel's
             structural panel language — the settled DossierCheckout recipe:
             linear-gradient(180deg,#181226,#140f1e) surface + mask-composite
             gradient hairline border. Presentation only; state, copy and
             payment logic untouched. No dossier artifacts here: no seals,
             locks, counts, was-price, or urgency. Static composition at
             rest — nothing below animates, so reduced-motion needs no
             extra override. */
          .cosmic-checkout.is-memorial .cosmic-order-panel {
            border: 0;
            border-radius: 18px;
            background: linear-gradient(180deg, #181226 0%, #140f1e 100%);
            box-shadow: 0 1px 2px rgba(0,0,0,.5), 0 24px 70px rgba(0,0,0,.5);
          }
          .cosmic-checkout.is-memorial .cosmic-order-panel::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1px;
            pointer-events: none;
            background: linear-gradient(165deg, rgba(185,165,240,.55) 0%, rgba(154,126,230,.18) 30%, rgba(139,123,216,.14) 55%, rgba(154,126,230,.60) 100%);
            -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
          }
          /* "IN LOVING MEMORY" leaves its floating pill and is inscribed
             into the tier card's top hairline: centered small caps clipping
             the border on the night-sky ground. No fill, no shadow. */
          .cosmic-tier.is-memorial .cosmic-tier-badge {
            top: 0;
            left: 50%;
            right: auto;
            transform: translate(-50%, -50%);
            border-radius: 0;
            background: #0d0a14;
            color: #b3a7e0;
            padding: 0 12px;
            font-family: "Newsreader", Georgia, serif;
            font-size: 12.5px;
            font-weight: 600;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            box-shadow: none;
            white-space: nowrap;
          }
          /* Single-reading collapse: the "x 1" ledger rows become one quiet
             centered price moment. Same words, restaged. */
          .cosmic-checkout.is-memorial .cosmic-mini-label { text-align: center; }
          .cosmic-mem-price-moment { padding: 14px 0 8px; text-align: center; }
          .cosmic-mem-price-moment .nm {
            margin: 0;
            color: #ececf2;
            font-family: "Fraunces", Georgia, serif;
            font-style: italic;
            font-weight: 500;
            font-size: 20px;
            line-height: 1.3;
          }
          .cosmic-mem-price-moment .amt {
            display: block;
            margin: 6px 0 0;
            color: #ffffff;
            font-family: "Fraunces", Georgia, serif;
            font-weight: 600;
            font-size: 44px;
            line-height: 1.05;
          }
          .cosmic-mem-price-moment .sub {
            display: block;
            margin: 10px 0 0;
            color: #b3a7e0;
            font-family: "Newsreader", Georgia, serif;
            font-size: 12.5px;
            font-weight: 600;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }
          /* Trust marks: whole units on one line each, never mid-label wraps. */
          .cosmic-checkout.is-memorial .cosmic-trust-band .cosmic-proof {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px 18px;
          }
          .cosmic-checkout.is-memorial .cosmic-trust-band .cosmic-proof span {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            white-space: nowrap;
          }
          /* Payment tray balanced 3+3 — no orphan chip. */
          .cosmic-checkout.is-memorial .cosmic-pay-tray > div {
            display: grid;
            grid-template-columns: repeat(3, auto);
            justify-content: center;
            justify-items: center;
            gap: 8px 10px;
          }

          /* ==== TYPE FLOORS - tuned per viewport (2026-07-14) ==== */
          .cosmic-checkout-kicker, .cosmic-mini-label { font-size: 14px; }
          .cosmic-tier-badge { font-size: 14px; }
          .cosmic-checkout-body { font-size: 18px; }
          .cosmic-tier p { font-size: 17px; line-height: 1.5; }
          .cosmic-feature-list button { font-size: 17px; }
          .cosmic-feature-list small { font-size: 14px; }
          .cosmic-included-strip p { font-size: 17px; line-height: 1.5; }
          .cosmic-horo-note { font-size: 15px; }
          .cosmic-preview-link { font-size: 14px; }
          .cosmic-stepper > span { font-size: 14px; }
          .cosmic-tier.is-memorial .cosmic-tier-head p { font-size: 18px; }
          .cosmic-tier.is-memorial .cosmic-feature-list p { font-size: 18px; }
          .cosmic-tier.is-memorial .cosmic-feature-list button { font-size: 18px; }
          .cosmic-primary-button { font-size: 18px; }
          .cosmic-apply-button { font-size: 17px; }
          .cosmic-mem-more summary { font-size: 18px; }
          .cosmic-mem-more-body > p { font-size: 18px; }
          .cosmic-mem-more-count b { font-size: 18px; }
          .cosmic-mem-assure { font-size: 18px; }
          .cosmic-mem-review blockquote { font-size: 18px; }
          .cosmic-order-row, .cosmic-total-row { font-size: 17px; }
          .cosmic-total-row { font-size: 18px; }
          .cosmic-code-button { font-size: 17px; }
          .cosmic-order-panel label { font-size: 17px; }
          .cosmic-gift-link { font-size: 17px; }
          .cosmic-proof span { font-size: 17px; }
          .cosmic-refund { font-size: 18px; }
          .cosmic-preview-panel p { font-size: 18px; }
          @media (min-width: 1280px) {
            .cosmic-checkout-kicker, .cosmic-mini-label, .cosmic-tier-badge, .cosmic-preview-link,
            .cosmic-feature-list small, .cosmic-stepper > span { font-size: 15px; }
            .cosmic-checkout-body { font-size: 19px; }
            .cosmic-tier p, .cosmic-included-strip p { font-size: 17.5px; }
            .cosmic-feature-list button { font-size: 17.5px; }
            .cosmic-tier.is-memorial .cosmic-tier-head p { font-size: 19px; }
            .cosmic-tier.is-memorial .cosmic-feature-list p { font-size: 19px; }
            .cosmic-tier.is-memorial .cosmic-feature-list button { font-size: 19px; }
            .cosmic-primary-button { font-size: 19px; }
            .cosmic-apply-button { font-size: 17.5px; }
            .cosmic-mem-more-body > p, .cosmic-mem-review blockquote { font-size: 19px; }
            .cosmic-mem-assure { font-size: 18.5px; }
            .cosmic-order-row { font-size: 17.5px; }
            .cosmic-total-row { font-size: 18.5px; }
            .cosmic-code-button, .cosmic-order-panel label, .cosmic-gift-link,
            .cosmic-proof span { font-size: 17.5px; }
            .cosmic-refund { font-size: 19px; }
            .cosmic-preview-panel p { font-size: 19px; }
          }
        `}</style>

        {/* STAR GOLD gradient — the one gold exception, star fills only.
            Stops #e8cf8f / #c4a265 / #9a7b4f, anchored on the approved
            email gold #c4a265. Mirrors dsr-stargold in DossierCheckout. */}
        <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="cosmic-mem-stargold" x1="0" y1="0" x2="0.052" y2="1">
              <stop offset="0" stopColor="#e8cf8f" />
              <stop offset=".55" stopColor="#c4a265" />
              <stop offset="1" stopColor="#9a7b4f" />
            </linearGradient>
          </defs>
        </svg>

        <div className="cosmic-checkout-shell">
          <div className="cosmic-checkout-copy">
            {memorialOnly ? (
              /* Memorial path: the classic header strings, verbatim. One
                 tier, no was-price, no multi-pet strip, no urgency. */
              <>
                <p className="cosmic-checkout-kicker cosmic-mem-kicker" style={{ fontStyle: "italic" }}>
                  A Reading for Their Memory
                </p>
                <p
                  className="cosmic-checkout-body cosmic-mem-lede"
                  style={{ fontStyle: "italic", fontSize: "1.02rem", marginTop: 0, opacity: 0.9 }}
                >
                  A keepsake for the space they left, written reverently,
                  to be felt, not skimmed.
                </p>
                <div className="cosmic-tier-grid" style={{ gridTemplateColumns: "1fr", maxWidth: 420, marginInline: "auto", width: "100%" }}>
                  {renderCosmicTier(TIERS.find((t) => t.id === "memorial")!, "memorial")}
                </div>
                <p className="cosmic-mem-assure">
                  No hurry on this. Their sky was set the day they were born,
                  and it will be here whenever you are ready.
                </p>
                <figure className="cosmic-mem-review">
                  <div className="cosmic-mem-review-top">
                    <span className="cosmic-mem-review-ph">
                      <img src={REVIEWS.grief.img} alt={REVIEWS.grief.alt} width={128} height={128} loading="lazy" decoding="async" />
                    </span>
                    <div className="cosmic-mem-stars" role="img" aria-label="Five out of five stars">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <svg key={s} viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <blockquote>{REVIEWS.grief.quote}</blockquote>
                  <figcaption>{REVIEWS.grief.attr}</figcaption>
                </figure>
              </>
            ) : (
              <>
                <p className="cosmic-checkout-kicker">Choose the depth</p>
                <div className="cosmic-tier-grid">
                  {renderCosmicTier(TIERS.find((t) => t.id === "basic")!, "core")}
                  {renderCosmicTier(TIERS.find((t) => t.id === "premium")!, "bond")}
                </div>
                <div className="cosmic-included-strip">
                  <p>
                    Included: their birth chart, their photo, 30+ sections, SoulSpeak,
                    a month of weekly skies, and lifetime access.
                  </p>
                  <button type="button" className="cosmic-preview-link" onClick={openSoulSpeak}>
                    SoulSpeak
                  </button>
                  <button type="button" className="cosmic-preview-link" onClick={openHoroscope}>
                    Horoscope
                  </button>
                  <p className="cosmic-horo-note">
                    First month free, then {fmt(prices.horoscopeMonthly)}/mo, cancel anytime.
                  </p>
                </div>
                <p className="cosmic-checkout-body" style={{ fontSize: "0.9rem", marginTop: 0 }}>
                  {petCount >= 2
                    ? `${Math.round(discountRate * 100)}% multi-pet saving applied for ${petCount} readings.`
                    : "More than one little soul? Add them with the + buttons."}
                </p>
              </>
            )}
          </div>

          <aside className="cosmic-order-panel" aria-label="Order summary">
            <p className="cosmic-mini-label">Your reading</p>
            {memorialOnly && memorialQty === 1 && basicQty === 0 && premiumQty === 0 && discountRate === 0 && !appliedCoupon ? (
              /* Single-reading memorial: the "x 1" ledger rows collapse into
                 one quiet centered price moment — same words, restaged.
                 Multi-pet or coupon carts fall back to the itemised rows. */
              <div className="cosmic-mem-price-moment">
                <p className="nm">Memorial Reading</p>
                <strong className="amt">{fmt(finalPrice + charityBonus * 100)}</strong>
                <span className="sub">Total today</span>
              </div>
            ) : (
              <>
                {basicQty > 0 && (
                  <div className="cosmic-order-row">
                    <span>Soul Reading x {basicQty}</span>
                    <strong>{fmt(basicQty * basicPrice)}</strong>
                  </div>
                )}
                {premiumQty > 0 && (
                  <div className="cosmic-order-row">
                    <span>Soul Bond x {premiumQty}</span>
                    <strong>{fmt(premiumQty * premiumPrice)}</strong>
                  </div>
                )}
                {memorialQty > 0 && (
                  <div className="cosmic-order-row">
                    <span>Memorial Reading x {memorialQty}</span>
                    <strong>{fmt(memorialQty * memorialPrice)}</strong>
                  </div>
                )}
                {discountRate > 0 && (
                  <div className="cosmic-order-row">
                    <span>Multi-pet saving</span>
                    <strong>-{fmt(volumeDiscountAmount)}</strong>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="cosmic-order-row">
                    <span>Code {appliedCoupon.code}</span>
                    <strong>-{fmt(couponDiscountAmount)}</strong>
                  </div>
                )}
                <div className="cosmic-total-row">
                  <span>Total today</span>
                  <strong>{fmt(finalPrice + charityBonus * 100)}</strong>
                </div>
              </>
            )}

            {!codeOpen && !appliedCoupon && (
              <button type="button" className="cosmic-code-button" onClick={() => setCodeOpen(true)}>
                Have a promo or gift code?
              </button>
            )}
            {codeOpen && !appliedCoupon && (
              <div className="cosmic-code-row">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value); setCodeError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCode(); } }}
                  placeholder="Enter code"
                  aria-label="Promo or gift code"
                />
                <button type="button" className="cosmic-apply-button" onClick={handleApplyCode} disabled={codeStatus === "checking" || !codeInput.trim()}>
                  {codeStatus === "checking" ? "Checking" : "Apply"}
                </button>
              </div>
            )}
            {codeError && <p style={{ color: "#ffffff", fontSize: 12, margin: "4px 0 0" }}>{codeError}</p>}

            <label htmlFor="v2-email">Where their reading opens</label>
            <input
              id="v2-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
            />
            {error && <p style={{ color: "#ffffff", fontSize: 16, margin: "6px 0 0" }}>{error}</p>}

            <button type="button" className="cosmic-primary-button" onClick={handleCheckout} disabled={isLoading}>
              {isLoading ? "Opening secure checkout..." : `${ctaLabel} · ${fmt(finalPrice + charityBonus * 100)}`}
            </button>
            {(basicQty + premiumQty) > 0 && (
              <p className="cosmic-horo-note" style={{ textAlign: "center", gridColumn: "auto" }}>
                Weekly horoscopes: first month free, then {fmt(prices.horoscopeMonthly)}/mo, cancel anytime.
              </p>
            )}
            <a href="/gift" className="cosmic-gift-link" onClick={() => trackFunnelEvent("v2_gift_link_clicked", { path })}>
              Or gift this reading
            </a>

            {isLocalized && (
              <p style={{ color: "#c8c8d2", textAlign: "center", fontSize: 17, margin: "10px 0 0" }}>
                Billed in {currencyCode}. Exactly the price shown.
              </p>
            )}

            <div className="cosmic-trust-band">
              <div className="cosmic-proof" aria-label="Checkout reassurance">
                <span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
                  Secure checkout
                </span>
                <span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.6" /><path d="M12 7.4V12l3 2" /></svg>
                  Ready in minutes
                </span>
                <span>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 9.5a8 8 0 0 1 13.6-2.6L20 9" /><path d="M20 4.5V9h-4.5" /><path d="M19.5 14.5a8 8 0 0 1-13.6 2.6L4 15" /><path d="M4 19.5V15h4.5" /></svg>
                  Full refund
                </span>
              </div>
              <p className="cosmic-refund">
                If the reading does not feel like them, we refund every cent.
              </p>
              <div className="cosmic-pay-tray">
                <PaymentMethodsRow klarna={pureMemorialCart} />
              </div>
              <div className="cosmic-charity-wrap">
                <CharityBrandRow selected={selectedCharity} onSelect={setSelectedCharity} />
              </div>
            </div>
          </aside>
        </div>

        {(soulSpeakOpen || horoscopeOpen) && (
          <div
            className="cosmic-preview-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cosmic-preview-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                closeSoulSpeak();
                closeHoroscope();
              }
            }}
          >
            <div className="cosmic-preview-panel">
              <p className="cosmic-mini-label">
                {soulSpeakOpen ? "SoulSpeak preview" : "Weekly horoscope preview"}
              </p>
              <h3 id="cosmic-preview-title">
                {soulSpeakOpen ? "Keep speaking from inside their reading." : "A weekly note from their sky."}
              </h3>
              <p>
                {soulSpeakOpen
                  ? "After the reading opens, SoulSpeak lets you ask from the same world of their chart, personality and bond. It is there for the questions that only make sense between you and them."
                  : "Their weekly horoscope gives the paid reading a living rhythm: what may soothe them, what may stir them, and how to meet their energy with more care."}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeSoulSpeak();
                  closeHoroscope();
                }}
              >
                Close preview
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

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
        {/* Header — route-aware. Memorial: reverent italic + tender
            sub-line. New-pet: arrival-framed heading with a welcoming
            sub-line. Discover (default): the generic "Begin Their
            Reading" brand heading. */}
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
            {memorialOnly
              ? "A Reading for Their Memory"
              : path === "new"
                ? "Meet Their Little Soul"
                : "Begin Their Reading"}
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
              A keepsake for the space they left, written reverently,
              to be felt, not skimmed.
            </p>
          )}
          {!memorialOnly && path === "new" && (
            <p
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(0.98rem, 3vw, 1.1rem)",
                color: "var(--earth, #6e6259)",
                lineHeight: 1.5,
                margin: "0 auto",
                maxWidth: 460,
              }}
            >
              Their first reading. The sky they arrived under,
              read line by line.
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

        {/* Live multi-pet discount confirmation. Only shows once a second
            pet is added; the old "got more pets?" prompt line is gone
            (replaced later by the quiet multi-pet disclosure). Suppressed
            on memorial — a grieving visitor is holding one soul in mind. */}
        {!memorialOnly && petCount >= 2 && (
          <p
            className="text-center mb-5"
            style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", fontWeight: 600, color: "var(--rose, #bf524a)" }}
          >
            {Math.round(discountRate * 100)}% multi-pet discount applied, {petCount} readings · {fmt(selectedPrice)}
          </p>
        )}

        {/* Promo / gift / QATEST code input — single field that handles all three */}
        <div className="mb-3 text-center">
          {!codeOpen && !appliedCoupon && (
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              style={{ background: "none", border: "none", color: "var(--gold, #7c5cd6)", fontFamily: "Cormorant, Georgia, serif", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}
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
            <div
              className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(154,126,230,0.14) 0%, rgba(191,82,74,0.12) 100%)",
                border: "1.5px solid rgba(154,126,230,0.5)",
                boxShadow: "0 2px 10px rgba(154,126,230,0.15)",
                animation: "lsCouponPop 520ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>✨</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "0.98rem", color: "var(--rose, #bf524a)", margin: 0, lineHeight: 1.15, fontWeight: 400 }}>
                    Extra {appliedCoupon.discount_value}% off, stacked
                  </p>
                  <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "0.74rem", color: "var(--gold, #7c5cd6)", margin: "2px 0 0 0", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Code {appliedCoupon.code} · on top of your launch saving
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeAppliedCoupon}
                aria-label="Remove code"
                style={{ background: "none", border: "none", color: "var(--muted, #958779)", cursor: "pointer", fontSize: "1.1rem", padding: "2px 6px", lineHeight: 1 }}
              >×</button>
              <style>{`
                @keyframes lsCouponPop {
                  0%   { opacity: 0; transform: scale(0.85) translateY(-6px); }
                  60%  { opacity: 1; transform: scale(1.04) translateY(0); }
                  100% { opacity: 1; transform: scale(1) translateY(0); }
                }
              `}</style>
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
            onFocus={(e) => { if (!error) e.target.style.borderColor = "var(--gold, #7c5cd6)"; }}
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
            `${ctaLabel} · ${fmt(finalPrice + charityBonus * 100)}`
          )}
        </button>

        {/* Gift-this-reading option — available on every path (new /
            discover / memorial). Links through to /gift so the visitor can
            buy this as a surprise for someone else without having to
            discover the gift page on their own. */}
        <div className="text-center mt-3">
          <a
            href="/gift"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 999,
              background: "rgba(154,126,230,0.10)",
              border: "1px solid rgba(154,126,230,0.35)",
              color: "var(--gold, #7c5cd6)",
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.92rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              textDecoration: "none",
              transition: "all 180ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(154,126,230,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(154,126,230,0.10)"; }}
            onClick={() => trackFunnelEvent("v2_gift_link_clicked", { path })}
          >
            <span role="img" aria-hidden="true">🎁</span>
            Or gift this to someone →
          </a>
        </div>

        {/* Currency note — only shown when display currency is not USD */}
        {isLocalized && (
          <p
            className="text-center mt-2"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "1rem",
              color: "var(--muted, #958779)",
            }}
          >
            Billed in {currencyCode} · exactly the price shown
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
            Includes {fmtWhole(charityBonus)} charity donation
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
        <div className="mb-6"><PaymentMethodsRow klarna={pureMemorialCart} /></div>

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
              style={{ width: 34, height: 34, background: "rgba(154,126,230,0.14)", color: "var(--ink, #1f1c18)" }}
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
                  background: "linear-gradient(135deg, #8f6de0, #7c5cd6)",
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

            <SoulSpeakPreview path={memorialOnly ? "memorial" : path} />

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
          className="horo-backdrop"
        >
          <div className="horo-panel">
            {/* Celestial layers — starfield backdrop + three twinkling points.
                Both sit on z-index 0, under the content on z-index 1. */}
            <span aria-hidden="true" className="horo-starfield" />
            <span aria-hidden="true" className="horo-twinkle horo-twinkle-1" />
            <span aria-hidden="true" className="horo-twinkle horo-twinkle-2" />
            <span aria-hidden="true" className="horo-twinkle horo-twinkle-3" />

            <button
              type="button"
              onClick={closeHoroscope}
              aria-label="Close"
              className="horo-close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="horo-header">
              <span className="horo-badge">
                <svg className="horo-badge-glyph" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="currentColor" />
                </svg>
                Weekly Horoscopes · Free
              </span>

              <h3 id="horoscope-modal-title" className="horo-title">
                Sundays <em>with them.</em>
              </h3>

              <div className="horo-title-rule" aria-hidden="true">
                <span />
                <svg viewBox="0 0 10 10">
                  <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="currentColor" />
                </svg>
                <span />
              </div>
            </div>

            <HoroscopePreview />

            <p className="horo-footer">
              <svg className="horo-footer-glyph" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="currentColor" />
              </svg>
              First month on us. Cancel anytime.
            </p>

            <style>{`
              @keyframes horoBackdropIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes horoPanelIn {
                from { opacity: 0; transform: translateY(18px) scale(0.97); }
                to   { opacity: 1; transform: translateY(0)    scale(1); }
              }
              @keyframes horoTwinkle {
                0%, 100% { opacity: 0.25; transform: scale(0.8); }
                50%      { opacity: 1;    transform: scale(1.25); }
              }

              .horo-backdrop {
                position: fixed;
                inset: 0;
                z-index: 10000;
                background: rgba(20, 18, 16, 0.58);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 5vw;
                animation: horoBackdropIn 0.25s ease;
              }

              .horo-panel {
                position: relative;
                width: min(560px, 96vw);
                max-height: 92vh;
                overflow-y: auto;
                overflow-x: hidden;
                background:
                  radial-gradient(140% 80% at 50% -10%, rgba(196, 162, 101, 0.11) 0%, rgba(196, 162, 101, 0) 60%),
                  radial-gradient(120% 60% at 50% 0%, rgba(170, 148, 196, 0.10) 0%, rgba(170, 148, 196, 0) 55%),
                  #FFFDF5;
                border-radius: 24px;
                padding: clamp(30px, 6vw, 46px) clamp(22px, 5vw, 38px) clamp(26px, 5vw, 36px);
                box-shadow:
                  0 0 0 1px rgba(196, 162, 101, 0.28) inset,
                  0 30px 80px rgba(20, 15, 8, 0.28),
                  0 4px 14px rgba(20, 15, 8, 0.08);
                animation: horoPanelIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
              }

              .horo-starfield {
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 62%;
                pointer-events: none;
                z-index: 0;
                background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='180' viewBox='0 0 260 180'><g fill='rgba(154,126,230,0.55)'><circle cx='22' cy='30' r='0.8'/><circle cx='72' cy='14' r='1.2'/><circle cx='110' cy='46' r='0.9'/><circle cx='168' cy='20' r='0.7'/><circle cx='228' cy='38' r='1'/><circle cx='50' cy='78' r='0.9'/><circle cx='196' cy='90' r='0.8'/><circle cx='16' cy='120' r='0.9'/><circle cx='92' cy='142' r='1.1'/><circle cx='148' cy='116' r='0.8'/><circle cx='244' cy='130' r='0.9'/><circle cx='212' cy='158' r='0.7'/></g><g fill='rgba(154,126,230,0.85)'><path transform='translate(134 62)' d='M4 0 L4.5 3.5 L8 4 L4.5 4.5 L4 8 L3.5 4.5 L0 4 L3.5 3.5 Z'/><path transform='translate(56 152)' d='M4 0 L4.5 3.5 L8 4 L4.5 4.5 L4 8 L3.5 4.5 L0 4 L3.5 3.5 Z'/></g></svg>");
                background-repeat: repeat;
                background-size: 260px 180px;
                -webkit-mask-image: linear-gradient(180deg, #000 0%, rgba(0,0,0,0.55) 65%, transparent 100%);
                        mask-image: linear-gradient(180deg, #000 0%, rgba(0,0,0,0.55) 65%, transparent 100%);
              }

              .horo-twinkle {
                position: absolute;
                width: 3px;
                height: 3px;
                border-radius: 50%;
                background: rgba(212, 178, 107, 0.95);
                box-shadow: 0 0 6px rgba(212, 178, 107, 0.8);
                pointer-events: none;
                z-index: 0;
              }
              .horo-twinkle-1 { top: 38px;  left: 20%;  animation: horoTwinkle 3.2s ease-in-out infinite; }
              .horo-twinkle-2 { top: 92px;  right: 22%; animation: horoTwinkle 4.4s ease-in-out 0.7s infinite; }
              .horo-twinkle-3 { top: 148px; left: 62%;  animation: horoTwinkle 3.8s ease-in-out 1.5s infinite; }

              .horo-close {
                position: absolute;
                top: 14px; right: 14px;
                width: 34px; height: 34px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 9999px;
                background: rgba(196, 162, 101, 0.16);
                color: var(--ink, #1f1c18);
                transition: background 200ms ease, transform 200ms ease;
                z-index: 3;
              }
              .horo-close:hover { background: rgba(196, 162, 101, 0.28); transform: rotate(90deg); }

              .horo-header {
                position: relative;
                z-index: 1;
                text-align: center;
                margin-bottom: clamp(20px, 3.4vw, 26px);
              }

              .horo-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-family: Cormorant, Georgia, serif;
                font-size: 0.64rem;
                font-weight: 700;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                padding: 4px 12px 4px 10px;
                border-radius: 999px;
                background: linear-gradient(135deg, #5aa870, #4a8c5c);
                color: #fff;
                margin-bottom: 16px;
                box-shadow:
                  0 4px 12px rgba(74, 140, 92, 0.22),
                  inset 0 1px 0 rgba(255, 255, 255, 0.24);
              }
              .horo-badge-glyph {
                width: 9px; height: 9px;
                color: #fff;
                filter: drop-shadow(0 0 2px rgba(255,255,255,0.5));
              }

              .horo-title {
                font-family: "DM Serif Display", Georgia, serif;
                font-size: clamp(1.7rem, 6.4vw, 2.3rem);
                color: var(--black, #141210);
                line-height: 1.1;
                letter-spacing: -0.018em;
                margin: 0;
              }
              .horo-title em {
                font-style: italic;
                color: var(--rose, #bf524a);
              }

              .horo-title-rule {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin-top: 14px;
                opacity: 0.9;
              }
              .horo-title-rule span {
                display: block;
                width: clamp(44px, 11vw, 78px);
                height: 1px;
                background: linear-gradient(90deg, rgba(154,126,230,0) 0%, rgba(154,126,230,0.65) 100%);
              }
              .horo-title-rule span:last-child {
                background: linear-gradient(90deg, rgba(154,126,230,0.65) 0%, rgba(154,126,230,0) 100%);
              }
              .horo-title-rule svg {
                width: 10px; height: 10px;
                color: var(--gold, #7c5cd6);
                filter: drop-shadow(0 0 3px rgba(212, 178, 107, 0.55));
              }

              .horo-footer {
                position: relative;
                z-index: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 7px;
                text-align: center;
                margin-top: 22px;
                font-family: Cormorant, Georgia, serif;
                font-style: italic;
                font-size: 0.82rem;
                color: var(--muted, #958779);
              }
              .horo-footer-glyph {
                width: 9px; height: 9px;
                color: var(--gold, #7c5cd6);
              }

              @media (prefers-reduced-motion: reduce) {
                .horo-twinkle { animation: none !important; opacity: 0.85; }
                .horo-close { transition: none !important; }
                .horo-close:hover { transform: none !important; }
              }

              /* ==== TYPE FLOORS (2026-07-14) ==== */
              .horo-badge { font-size: 14px; }
              .horo-footer { font-size: 14px; }
              @media (min-width: 1280px) {
                .horo-badge, .horo-footer { font-size: 15px; }
              }
            `}</style>
          </div>
        </div>
      )}
    </section>
  );
});

InlineCheckout.displayName = "InlineCheckout";

/* ──────── Charity brand row ──────── */
// Stylised wordmark badges for the 3 charities. Uses the same chip
// visual language as the payment-method badges so they sit cleanly in the
// same trust row. Swap the inner <svg>s for the real brand-supplied logo
// assets when Danny has them in /public/charities/.

type CharitySlug = "ifaw" | "world-land-trust" | "eden-reforestation";

const CHARITY_BRAND_META: Record<CharitySlug, { label: string; tagline: string }> = {
  "ifaw": {
    label: "IFAW",
    tagline: "Rescue and rehab for animals in crisis, worldwide.",
  },
  "world-land-trust": {
    label: "World Land Trust",
    tagline: "Protecting wild habitat across the globe.",
  },
  "eden-reforestation": {
    label: "Eden Reforestation",
    tagline: "Planting trees, restoring forests, worldwide.",
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
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontVariantNumeric: "lining-nums",
          color: "var(--gold, #7c5cd6)",
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
          fontSize: "1rem",
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
              {". "}
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
      border: selected ? "2px solid var(--gold, #7c5cd6)" : "1px solid var(--cream3, #f3eadb)",
      boxShadow: selected ? "0 2px 10px var(--charity-glow, rgba(154,126,230,0.2))" : "none",
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

/* ──────── SoulSpeak conversation scripts — one per funnel path ────────
 *
 * Two modes by path:
 *
 *  • discover & new — MYSTERY mode. Only the pet's typing indicator
 *    appears on the wallpaper, pulsing forever. The reader sees that
 *    *something* is being drafted but can't read it. Curiosity + the
 *    composer at the bottom ("Ask them anything…") drives click to
 *    unlock. Mystery converts harder than a revealed punchline here.
 *
 *  • memorial — REVEALED conversation. Grief needs tenderness, not
 *    a tease. We show the "did I hold on too long?" exchange — the
 *    single most common grief thought — and reply using the
 *    continuing-bonds framing (Klass/Silverman). Hero line is
 *    bounded reassurance, never sappy. Follows retention-research
 *    memorial-mode rules (docs/soulspeak-retention-research.md §10).
 */
type SoulSpeakPath = "new" | "discover" | "memorial";
type SoulSpeakMessages = { u1: string; p1: string; u2: string };
type SoulSpeakScript = {
  intro: string;
  // present only for paths we fully reveal (memorial). Absent = mystery.
  messages?: SoulSpeakMessages;
};
const SOUL_SPEAK_SCRIPTS: Record<SoulSpeakPath, SoulSpeakScript> = {
  discover: {
    intro: "They've been trying to tell you something.",
  },
  new: {
    intro: "They've been waiting to say hello.",
  },
  memorial: {
    intro: "The conversation you didn't get to have.",
    messages: {
      u1: "I still look for you in the kitchen.",
      p1: "That's where I came when I heard the cutlery drawer. I thought that drawer had my name on it.",
      u2: "I dropped a spoon last week and cried.",
    },
  },
};

/* Pet name shown in the chat header — one per path. Kept warm and
 * ordinary (not brand-y). Discover / new imply a living pet; memorial
 * implies a remembered one. */
const SOUL_SPEAK_PET_NAME: Record<SoulSpeakPath, string> = {
  discover: "Biscuit",
  new:      "Mochi",
  memorial: "Scout",
};

const SoulSpeakPreview = ({ path = "discover" }: { path?: SoulSpeakPath }) => {
  const script = SOUL_SPEAK_SCRIPTS[path] ?? SOUL_SPEAK_SCRIPTS.discover;
  const petName = SOUL_SPEAK_PET_NAME[path] ?? SOUL_SPEAK_PET_NAME.discover;
  const messages = script.messages;
  const isMystery = !messages;
  // Memorial gets gold "always-with-you" dot; living paths get green
  // "online" dot. Mirrors the real SoulSpeak header treatment.
  const isMemorial = path === "memorial";
  // Typing indicator appears later for memorial (after 3 bubbles, in the
  // pet-reply slot, so the preview reads as "they're about to answer —
  // type to continue"); almost immediately in mystery mode so the reader
  // sees motion from the start.
  const typingDelay = isMystery ? "0.15s" : "2.75s";
  const composerDelay = isMystery ? "0.4s" : "3.4s";

  // Pull a real dog photo from dog.ceo (free, no API key, CORS-enabled)
  // so the preview looks like a genuine screenshot of a live chat rather
  // than a stylised illustration. Fails silently to the sparkle avatar.
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("https://dog.ceo/api/breeds/image/random")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && data.status === "success" && typeof data.message === "string") {
          setPetPhoto(data.message);
        }
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const PetAvatar = ({ size = "small" }: { size?: "small" | "header" }) => {
    const dim = size === "header" ? 44 : 26;
    return (
      <div
        className={size === "header" ? "ss-chat-avatar" : "ss-avatar"}
        aria-hidden="true"
        style={{ width: dim, height: dim }}
      >
        {petPhoto ? (
          <img src={petPhoto} alt="" loading="lazy" />
        ) : (
          <svg viewBox="0 0 10 10" className="ss-avatar-fallback">
            <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="currentColor" />
          </svg>
        )}
      </div>
    );
  };

  return (
  <div className="ss-preview">
    <p className="ss-preview-intro">
      {script.intro}
    </p>

    {/* Chat surface — mirrors the real SoulSpeak channel at
        /soul-chat.html: gold constellations wallpaper at low opacity,
        white pet bubbles, rose-gradient user bubbles. In mystery mode
        (new + discover) we render only the pet's typing indicator,
        pulsing forever — the reader can see something is being drafted
        but not what. Memorial reveals the full exchange. */}
    <div
      className={`ss-chat${isMystery ? " ss-chat-mystery" : ""}`}
      role="log"
      aria-label="SoulSpeak conversation preview"
    >
      <span aria-hidden="true" className="ss-chat-wallpaper" />

      {/* Chat header — dog photo + name + status dot, mirroring the real
          SoulSpeak chat screen at /soul-chat.html so the preview reads
          as a screenshot, not a stylised widget. */}
      <div className="ss-chat-header">
        <PetAvatar size="header" />
        <div className="ss-chat-info">
          <div className="ss-chat-name">{petName}</div>
          <div className={`ss-chat-status${isMemorial ? " is-memorial" : ""}`}>
            <span className="ss-chat-dot" aria-hidden="true" />
            {isMemorial ? "always with you" : "online"}
          </div>
        </div>
      </div>

      {messages && (
        <>
          <div className="ss-msg ss-msg-user" style={{ animationDelay: "0.1s" }}>
            <div className="ss-bubble">{messages.u1}</div>
          </div>

          <div className="ss-msg ss-msg-pet" style={{ animationDelay: "0.85s" }}>
            <PetAvatar />
            <div className="ss-bubble">{messages.p1}</div>
          </div>

          <div className="ss-msg ss-msg-user" style={{ animationDelay: "2.1s" }}>
            <div className="ss-bubble">{messages.u2}</div>
          </div>
        </>
      )}

      <div className="ss-typing" aria-hidden="true" style={{ animationDelay: typingDelay }}>
        <PetAvatar />
        <div className="ss-typing-dots">
          <span /><span /><span />
        </div>
      </div>

      {/* Fake composer — non-interactive. The placeholder invites typing,
          and the live cursor makes the field feel ready to be used. This
          is the conversion lever: a reader who sees it wants to type. */}
      <div className="ss-composer" aria-hidden="true" style={{ animationDelay: composerDelay }}>
        <span className="ss-composer-field">
          Ask them anything<span className="ss-cursor" />
        </span>
        <span className="ss-composer-send" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8z" />
          </svg>
        </span>
      </div>
    </div>

    <style>{`
      .ss-preview {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .ss-preview-intro {
        font-family: Cormorant, Georgia, serif;
        font-size: clamp(0.95rem, 2.9vw, 1.04rem);
        font-weight: 600;
        color: var(--ink, #1f1c18);
        line-height: 1.5;
        text-align: center;
        margin: 0;
      }

      .ss-chat {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: clamp(14px, 3vw, 18px) clamp(10px, 2.5vw, 14px) clamp(12px, 2.5vw, 14px);
        border-radius: 18px;
        overflow: hidden;
        background:
          linear-gradient(180deg, rgba(255, 253, 245, 0.92) 0%, rgba(251, 245, 233, 0.82) 100%);
        box-shadow:
          inset 0 0 0 1px rgba(196, 162, 101, 0.24),
          0 2px 8px rgba(20, 15, 8, 0.05);
      }

      /* Mystery-mode chat — new + discover. Header stays top; typing
         indicator pushes to the bottom so the empty space between
         reads as "something is about to happen". */
      .ss-chat-mystery {
        min-height: clamp(200px, 28vw, 240px);
      }
      .ss-chat-mystery .ss-typing {
        margin-top: auto;
      }

      /* Gold-constellations wallpaper — verbatim pattern from the real
         SoulSpeak channel (public/soul-chat.html, [data-wallpaper=
         "constellations"]), scaled down for the preview tile size. 10%
         opacity matches the real --wallpaper-opacity token. */
      .ss-chat-wallpaper {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.12;
        background-repeat: repeat;
        background-size: 240px 240px;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360'><g stroke='%23c4a265' stroke-width='0.8' fill='none' opacity='0.6'><line x1='40' y1='60' x2='85' y2='85'/><line x1='85' y1='85' x2='130' y2='55'/><line x1='85' y1='85' x2='95' y2='135'/><line x1='210' y1='50' x2='245' y2='90'/><line x1='245' y1='90' x2='290' y2='70'/><line x1='245' y1='90' x2='260' y2='140'/><line x1='60' y1='200' x2='110' y2='220'/><line x1='110' y1='220' x2='140' y2='190'/><line x1='110' y1='220' x2='100' y2='265'/><line x1='200' y1='230' x2='240' y2='265'/><line x1='240' y1='265' x2='290' y2='240'/><line x1='240' y1='265' x2='255' y2='310'/><line x1='40' y1='300' x2='80' y2='320'/><line x1='290' y1='155' x2='320' y2='190'/></g><g fill='%23c4a265'><circle cx='40' cy='60' r='2.2'/><circle cx='85' cy='85' r='2.8'/><circle cx='130' cy='55' r='2'/><circle cx='95' cy='135' r='2'/><circle cx='210' cy='50' r='2'/><circle cx='245' cy='90' r='2.8'/><circle cx='290' cy='70' r='2.2'/><circle cx='260' cy='140' r='2'/><circle cx='60' cy='200' r='2.2'/><circle cx='110' cy='220' r='2.8'/><circle cx='140' cy='190' r='2'/><circle cx='100' cy='265' r='2'/><circle cx='200' cy='230' r='2'/><circle cx='240' cy='265' r='2.8'/><circle cx='290' cy='240' r='2.2'/><circle cx='255' cy='310' r='2'/><circle cx='40' cy='300' r='2'/><circle cx='80' cy='320' r='2.2'/><circle cx='290' cy='155' r='2'/><circle cx='320' cy='190' r='2.2'/><circle cx='170' cy='140' r='1.5'/><circle cx='315' cy='310' r='1.5'/><circle cx='20' cy='170' r='1.5'/><circle cx='340' cy='30' r='1.5'/><circle cx='15' cy='40' r='1.5'/></g></svg>");
        z-index: 0;
      }
      .ss-chat > *:not(.ss-chat-wallpaper) { position: relative; z-index: 1; }

      .ss-msg {
        display: flex;
        max-width: 94%;
        opacity: 0;
        animation: ssMsgIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }
      .ss-msg-user {
        align-self: flex-end;
        max-width: 84%;
      }
      .ss-msg-pet {
        align-self: flex-start;
        align-items: flex-end;
        gap: 7px;
      }

      .ss-avatar {
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(227, 198, 135, 0.9) 0%, rgba(196, 162, 101, 0.95) 70%, rgba(169, 134, 85, 1) 100%);
        border: 1.5px solid var(--cream3, #f3eadb);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(164, 129, 72, 0.22);
      }
      .ss-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .ss-avatar .ss-avatar-fallback {
        width: 10px;
        height: 10px;
        color: #fff8f5;
        filter: drop-shadow(0 0 2px rgba(255, 248, 245, 0.7));
      }

      /* ── Chat header ──────────────────────────────────────────
         Mirrors the real SoulSpeak header at /soul-chat.html:
         large rounded pet photo with gold-tinted ring, pet name
         in DM Serif, status dot (pulsing green for living, soft
         gold glow for memorial). Gives the preview the feel of
         a real chat screenshot. */
      .ss-chat-header {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 2px 4px 10px;
        border-bottom: 1px solid rgba(196, 162, 101, 0.18);
        margin-bottom: 4px;
      }
      .ss-chat-avatar {
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(154,126,230,0.12) 0%, rgba(154,126,230,0.06) 100%);
        border: 2px solid var(--gold, #7c5cd6);
        box-shadow: 0 0 0 3px rgba(196, 162, 101, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .ss-chat-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .ss-chat-avatar .ss-avatar-fallback {
        width: 14px;
        height: 14px;
        color: var(--gold, #7c5cd6);
      }
      .ss-chat-info {
        flex: 1;
        min-width: 0;
        line-height: 1.2;
      }
      .ss-chat-name {
        font-family: "DM Serif Display", Georgia, serif;
        font-size: clamp(1rem, 3.2vw, 1.1rem);
        color: var(--ink, #1f1c18);
        line-height: 1.15;
      }
      .ss-chat-status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 2px;
        font-family: Cormorant, Georgia, serif;
        font-size: 0.74rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--gold, #7c5cd6);
      }
      .ss-chat-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #5aa870;
        box-shadow: 0 0 0 rgba(90, 168, 112, 0);
        animation: ssStatusPulse 2s ease-in-out infinite;
      }
      .ss-chat-status.is-memorial .ss-chat-dot {
        background: var(--gold, #7c5cd6);
        animation: ssStatusGlow 3.4s ease-in-out infinite;
      }
      @keyframes ssStatusPulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.45; }
      }
      @keyframes ssStatusGlow {
        0%, 100% { opacity: 0.9; box-shadow: 0 0 0 rgba(154,126,230,0); }
        50%      { opacity: 1;   box-shadow: 0 0 7px rgba(154,126,230,0.8); }
      }

      .ss-bubble {
        padding: 10px 14px;
        border-radius: 17px;
        font-family: Cormorant, Georgia, serif;
        font-size: clamp(0.92rem, 2.8vw, 0.98rem);
        line-height: 1.5;
        letter-spacing: 0.005em;
        word-wrap: break-word;
      }

      .ss-msg-user .ss-bubble {
        background: linear-gradient(135deg, #bf524a 0%, #a84039 100%);
        color: #fff8f5;
        border-bottom-right-radius: 4px;
        box-shadow:
          0 2px 8px rgba(191, 82, 74, 0.22),
          0 1px 2px rgba(191, 82, 74, 0.12);
      }

      .ss-msg-pet .ss-bubble {
        background: #ffffff;
        color: var(--ink, #1f1c18);
        border: 1px solid var(--cream3, #f3eadb);
        border-bottom-left-radius: 4px;
        box-shadow:
          0 1px 4px rgba(20, 15, 8, 0.04),
          0 0 0 0.5px rgba(196, 162, 101, 0.06);
      }

      /* Typing indicator — same bubble chrome as pet bubbles, gold dots
         with a staggered bounce. Keeps pulsing to tease continuation. */
      .ss-typing {
        display: flex;
        align-items: flex-end;
        gap: 7px;
        align-self: flex-start;
        opacity: 0;
        animation: ssMsgIn 0.4s ease forwards;
      }
      .ss-typing-dots {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 12px 16px;
        background: #ffffff;
        border: 1px solid var(--cream3, #f3eadb);
        border-radius: 16px;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(20, 15, 8, 0.04);
      }
      .ss-typing-dots span {
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--gold, #7c5cd6);
        opacity: 0.35;
        animation: ssTypingBounce 1.4s ease-in-out infinite;
      }
      .ss-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
      .ss-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

      /* Fake composer — appears with the typing indicator */
      .ss-composer {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 8px 8px 16px;
        border-radius: 9999px;
        background: #ffffff;
        border: 1px solid var(--cream3, #f3eadb);
        box-shadow:
          0 2px 8px rgba(20, 15, 8, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
        opacity: 0;
        animation: ssMsgIn 0.5s ease forwards;
      }
      .ss-composer-field {
        flex: 1;
        font-family: Cormorant, Georgia, serif;
        font-style: italic;
        font-size: clamp(0.86rem, 2.6vw, 0.92rem);
        color: var(--muted, #958779);
        letter-spacing: 0.005em;
        display: inline-flex;
        align-items: center;
      }
      .ss-cursor {
        display: inline-block;
        width: 1px;
        height: 0.95em;
        margin-left: 3px;
        background: var(--rose, #bf524a);
        animation: ssCursorBlink 1.1s steps(2) infinite;
      }
      .ss-composer-send {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #bf524a 0%, #a84039 100%);
        color: #fff8f5;
        box-shadow: 0 2px 6px rgba(191, 82, 74, 0.28);
      }

      @keyframes ssMsgIn {
        from { opacity: 0; transform: translateY(10px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0)    scale(1); }
      }
      @keyframes ssTypingBounce {
        0%, 60%, 100% { transform: translateY(0);    opacity: 0.35; }
        30%           { transform: translateY(-3px); opacity: 0.95; }
      }
      @keyframes ssCursorBlink {
        0%, 50%   { opacity: 1; }
        50.01%, 100% { opacity: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .ss-msg, .ss-typing, .ss-composer {
          opacity: 1 !important;
          animation: none !important;
          transform: none !important;
        }
        .ss-typing-dots span { animation: none !important; opacity: 0.5; }
        .ss-cursor { animation: none !important; opacity: 0; }
      }

      /* ==== TYPE FLOORS (2026-07-14) ==== */
      .ss-preview-intro { font-size: 17px; }
      .ss-chat-name { font-size: 17px; }
      .ss-chat-status { font-size: 14px; }
      .ss-bubble { font-size: 17px; }
      .ss-composer-field { font-size: 17px; }
      @media (min-width: 1280px) {
        .ss-preview-intro, .ss-chat-name, .ss-bubble, .ss-composer-field { font-size: 17.5px; }
        .ss-chat-status { font-size: 15px; }
      }
    `}</style>
  </div>
  );
};

const HoroscopePreview = () => (
  <div className="horo-preview">
    <p className="horo-lead">
      A cosmic forecast, written every Sunday, just for them.
    </p>

    <div className="horo-divider" aria-hidden="true">
      <span />
      <svg viewBox="0 0 10 10">
        <path d="M5 0 L5.9 4.1 L10 5 L5.9 5.9 L5 10 L4.1 5.9 L0 5 L4.1 4.1 Z" fill="currentColor" />
      </svg>
      <span />
    </div>

    <p className="horo-body">
      Like a weather forecast, but made of starlight. Each Sunday, you'll see what the week ahead holds for their little soul: the tender days, the stirring ones, the quiet ones. A gentle map of the cosmos moving through their world, so nothing arrives without meaning.
    </p>

    <p className="horo-body">
      Without it, the weeks just <em className="ink">pass</em>. The small shifts, the soft turns, the days that wanted to be noticed, gone by before you saw them. And they only get so many weeks <em className="rose">with you</em>.
    </p>

    <figure className="horo-quote">
      <span aria-hidden="true" className="horo-quote-corner tl" />
      <span aria-hidden="true" className="horo-quote-corner tr" />
      <span aria-hidden="true" className="horo-quote-corner bl" />
      <span aria-hidden="true" className="horo-quote-corner br" />
      <blockquote className="horo-quote-text">
        Knowing their week <br className="hidden sm:block" />is a way of knowing them deeper.
      </blockquote>
    </figure>

    <style>{`
      .horo-preview {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .horo-lead {
        font-family: Cormorant, Georgia, serif;
        font-size: clamp(1.04rem, 3.4vw, 1.18rem);
        font-weight: 600;
        color: var(--ink, #1f1c18);
        line-height: 1.5;
        text-align: center;
        margin: 0;
      }

      .horo-divider {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin: -4px auto 0;
        opacity: 0.8;
      }
      .horo-divider span {
        display: block;
        width: 46px;
        height: 1px;
        background: linear-gradient(90deg, rgba(154,126,230,0) 0%, rgba(154,126,230,0.5) 100%);
      }
      .horo-divider span:last-child {
        background: linear-gradient(90deg, rgba(154,126,230,0.5) 0%, rgba(154,126,230,0) 100%);
      }
      .horo-divider svg {
        width: 8px; height: 8px;
        color: var(--gold, #7c5cd6);
      }

      .horo-body {
        font-family: Cormorant, Georgia, serif;
        font-size: clamp(0.94rem, 2.9vw, 1rem);
        color: var(--earth, #6e6259);
        line-height: 1.75;
        text-align: center;
        margin: 0;
        padding: 0 2px;
      }
      .horo-body em.ink  { color: var(--ink,  #1f1c18); font-style: italic; font-weight: 500; }
      .horo-body em.rose { color: var(--rose, #bf524a); font-style: italic; font-weight: 500; }

      .horo-quote {
        position: relative;
        margin: 6px 0 0;
        padding: clamp(22px, 4.5vw, 30px) clamp(22px, 5vw, 34px);
        border-radius: 16px;
        background:
          radial-gradient(120% 120% at 50% 0%, rgba(154,126,230,0.12) 0%, rgba(154,126,230,0) 70%),
          rgba(255, 251, 240, 0.78);
        box-shadow:
          0 0 0 1px rgba(154,126,230,0.32) inset,
          0 6px 22px rgba(20, 15, 8, 0.06),
          0 1px 2px rgba(20, 15, 8, 0.03);
      }
      .horo-quote-corner {
        position: absolute;
        width: 12px;
        height: 12px;
        border: 1px solid var(--gold, #7c5cd6);
        opacity: 0.55;
      }
      .horo-quote-corner.tl { top: 8px;    left: 8px;    border-right: none; border-bottom: none; border-top-left-radius: 4px; }
      .horo-quote-corner.tr { top: 8px;    right: 8px;   border-left:  none; border-bottom: none; border-top-right-radius: 4px; }
      .horo-quote-corner.bl { bottom: 8px; left: 8px;    border-right: none; border-top:    none; border-bottom-left-radius: 4px; }
      .horo-quote-corner.br { bottom: 8px; right: 8px;   border-left:  none; border-top:    none; border-bottom-right-radius: 4px; }

      .horo-quote-text {
        font-family: Cormorant, Georgia, serif;
        font-style: italic;
        font-size: clamp(1rem, 3.1vw, 1.12rem);
        color: var(--ink, #1f1c18);
        line-height: 1.6;
        text-align: center;
        margin: 0;
        letter-spacing: 0.002em;
      }

      /* ==== TYPE FLOORS (2026-07-14) ==== */
      .horo-lead { font-size: 18px; }
      .horo-body { font-size: 17px; }
      .horo-quote-text { font-size: 18px; }
      @media (min-width: 1280px) {
        .horo-lead, .horo-quote-text { font-size: 19px; }
        .horo-body { font-size: 18px; }
      }
    `}</style>
  </div>
);
