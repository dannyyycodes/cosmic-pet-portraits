/**
 * /pawtraits/studio — Tier 1+ AI Studio (Style × Theme, single full-size portrait).
 *
 * Customer journey:
 *   1. Upload pet photo
 *   2. Pick Style (8 cards) + Theme (8 cards) + optional details
 *   3. Generate → single full-size portrait from /api/portraits/generate
 *   4. Download or pick product surface + size
 *   5. Add to cart → existing Shopify checkout
 *
 * Phase 1B = anonymous free, no auth gate yet (Phase 2 adds the sign-up wall).
 *
 * Distinct from /portraits (legacy 6-pack flow) and /pawtraits/templates (Tier 0).
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";
import { PortraitsFooter } from "@/components/portraits/PortraitsFooter";
import { PetPhotoUpload } from "@/components/portraits/PetPhotoUpload";
import { CartDrawer } from "@/components/portraits/CartDrawer";
import { StyleThemePicker } from "@/components/portraits/styles/StyleThemePicker";
import { VariantGallery, type Variant } from "@/components/portraits/styles/VariantGallery";
import { getStyle, getTheme } from "@/components/portraits/styles/styleTheme";
import { StudioAtmosphere } from "@/components/portraits/studio/StudioAtmosphere";
import { GenerationCanvas } from "@/components/portraits/studio/GenerationCanvas";
import { StudioPlaceholder } from "@/components/portraits/studio/StudioPlaceholder";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/components/portraits/useCredits";
import { savePetPhoto, loadPetPhoto, clearPetPhoto } from "@/components/portraits/photoSharing";
import {
  PRODUCTS,
  PRODUCT_KEYS,
  resolveVariant,
  formatPrice,
  type ProductTypeKey,
  type AnySizeKey,
} from "@/components/portraits/productLineup";
import { buildCartItem, loadCart, saveCart, type CartItem } from "@/components/portraits/cart";
import { PALETTE } from "@/components/portraits/tokens";

export default function PortraitsStudio() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const { balance, tier, loading: creditsLoading, refresh: refreshCredits } = useCredits();
  const [photoUrl, setPhotoUrlState] = useState<string | null>(() => loadPetPhoto());
  const setPhotoUrl = (url: string | null) => {
    setPhotoUrlState(url);
    if (url) savePetPhoto(url); else clearPetPhoto();
  };
  const [styleId, setStyleId] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [addDetails, setAddDetails] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantUrl, setSelectedVariantUrl] = useState<string | null>(null);
  const [aiPaused, setAiPaused] = useState(false);
  // In-flight async generation (fal queue). Drives the polling effect below.
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const [productType, setProductType] = useState<ProductTypeKey>("framed-canvas");
  const [sizeKey, setSizeKey] = useState<AnySizeKey>(PRODUCTS["framed-canvas"].defaultSizeKey);

  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  useEffect(() => { saveCart(cart); }, [cart]);

  // Update size when product changes
  useEffect(() => {
    setSizeKey(PRODUCTS[productType].defaultSizeKey);
  }, [productType]);

  const variant = resolveVariant(productType, sizeKey);
  const canGenerate = !!photoUrl && !!styleId && !!themeId && !generating;
  const canAdd = !!selectedVariantUrl && !!variant && !!photoUrl && !!styleId && !!themeId;

  async function handleGenerate() {
    if (!photoUrl || !styleId || !themeId) return;
    if (!user || !session?.access_token) {
      toast("Sign in to generate your portrait — 3 free attempts on us.", { duration: 2200 });
      setTimeout(() => navigate(`/auth?next=${encodeURIComponent("/pawtraits/studio")}`), 800);
      return;
    }
    setGenerating(true);
    setVariants([]);
    setSelectedVariantUrl(null);
    setAiPaused(false);
    // Submit-only timeout — short, since queue submit is normally <2s.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await fetch("/api/portraits?action=generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ imageUrl: photoUrl, styleId, themeId, addDetails }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error("Out of credits. Subscribe or buy a pack to continue.");
        navigate("/pawtraits#topup");
        setGenerating(false);
        return;
      }
      if (res.status === 503 && data.error === "ai-service-paused") {
        setAiPaused(true);
        toast.error(data.message ?? "Portrait studio paused. Try Templates instead.");
        refreshCredits();
        setGenerating(false);
        return;
      }
      if (res.status === 422 && data?.error === "content_policy_violation") {
        toast.error(data.message ?? "Our moderator flagged this generation — try again.", { duration: 8000 });
        refreshCredits();
        setGenerating(false);
        return;
      }
      // 202 — async submit accepted. Polling effect below drives the rest.
      if (res.status === 202 && data?.job_id) {
        setPendingJobId(data.job_id);
        return; // keep generating=true; polling effect clears it
      }
      // Defensive: legacy synchronous response shape.
      if (!res.ok) throw new Error(data.error || "Generation failed");
      if (data.variants) {
        setVariants(data.variants);
        if (data.variants[0]) setSelectedVariantUrl(data.variants[0].url);
        refreshCredits();
        setGenerating(false);
      }
    } catch (e) {
      const err = e as Error;
      toast.error(err.name === "AbortError" ? "Took too long to submit — please try again." : err.message);
      setGenerating(false);
    } finally {
      clearTimeout(timer);
    }
  }

  // Polling effect — same shape as StudioFlow's. Polls every 2.5s while
  // pendingJobId is set; on completed/failed clears generating + jobId.
  // Cleans up on unmount or when pendingJobId changes.
  useEffect(() => {
    if (!pendingJobId || !session?.access_token) return;
    let attempts = 0;
    const MAX_POLLS = 120;
    const POLL_INTERVAL_MS = 2500;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let pollCtrl: AbortController | null = null;
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      attempts += 1;
      pollCtrl = new AbortController();
      try {
        const r = await fetch(
          `/api/portraits?action=generation_status&job_id=${encodeURIComponent(pendingJobId!)}`,
          {
            headers: { Authorization: `Bearer ${session!.access_token}` },
            signal: pollCtrl.signal,
          },
        );
        const data = await r.json();
        if (cancelled) return;

        if (data.status === 'completed' && Array.isArray(data.variants)) {
          setVariants(data.variants);
          if (data.variants[0]) setSelectedVariantUrl(data.variants[0].url);
          refreshCredits();
          setPendingJobId(null);
          setGenerating(false);
          return;
        }
        if (data.status === 'failed') {
          if (data.error === 'content_policy_violation') {
            toast.error(data.message ?? "Our moderator flagged this generation — try a different name.", { duration: 8000 });
          } else {
            toast.error("Generation failed — your credit was refunded. Please try again.");
          }
          refreshCredits();
          setPendingJobId(null);
          setGenerating(false);
          return;
        }
        if (attempts >= MAX_POLLS) {
          toast.error("Generation is taking longer than expected. Please refresh and try again.");
          setPendingJobId(null);
          setGenerating(false);
          return;
        }
        timeoutHandle = setTimeout(tick, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        if ((err as Error).name === 'AbortError') return;
        if (attempts >= MAX_POLLS) {
          toast.error("Lost connection to the studio. Please refresh and try again.");
          setPendingJobId(null);
          setGenerating(false);
          return;
        }
        timeoutHandle = setTimeout(tick, POLL_INTERVAL_MS);
      }
    }

    timeoutHandle = setTimeout(tick, 1500);

    return () => {
      cancelled = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (pollCtrl) pollCtrl.abort();
    };
  }, [pendingJobId, session?.access_token, refreshCredits, navigate]);

  function handleAdd() {
    if (!selectedVariantUrl || !variant || !photoUrl || !styleId || !themeId) return;
    const style = getStyle(styleId);
    const theme = getTheme(themeId);
    if (!style || !theme) return;
    const item = buildCartItem({
      kind: "ai",
      productType,
      sizeKey,
      packId: `${styleId}__${themeId}`,
      packName: `${style.label} × ${theme.label}`,
      style: "photographic", // legacy field — preserved for back-compat
      sourcePhotoUrl: photoUrl,
      previewUrl: selectedVariantUrl,
      soulEdition: false,
      soulEditionPriceMajor: 40,
      variant,
      id: crypto.randomUUID(),
    });
    setCart((c) => [...c, item]);
    // No toast — opening the cart drawer with the new line item IS the
    // visual confirmation. Toast was redundant noise.
    setCartOpen(true);
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: "GBP", items: cart }),
      });
      const data = await res.json();
      if (!res.ok || !data.invoiceUrl) throw new Error(data.error || "Checkout failed");
      window.location.href = data.invoiceUrl;
    } catch (e) {
      setCheckoutError((e as Error).message);
      setCheckoutBusy(false);
    }
  }

  return (
    <>
    <Helmet>
      <title>Pawtraits Studio — Create Your Custom Pet Portrait in Minutes | Little Souls</title>
      <meta name="description" content="Upload your pet's photo and watch them come to life as a custom painted portrait. Pick a style, generate, refine, download. From watercolor to renaissance — your pet, immortalized." />
      <meta property="og:type" content="article" />
      <meta property="og:title" content="Pawtraits Studio — Create Your Custom Pet Portrait in Minutes | Little Souls" />
      <meta property="og:description" content="Upload your pet's photo and watch them come to life as a custom painted portrait. Pick a style, generate, refine, download. From watercolor to renaissance — your pet, immortalized." />
      <meta property="og:image" content="https://www.littlesouls.app/og/pawtraits-studio.jpg" />
      <meta property="og:url" content="https://littlesouls.app/pawtraits/studio" />
      <meta property="og:site_name" content="Little Souls" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Pawtraits Studio — Create Your Custom Pet Portrait in Minutes | Little Souls" />
      <meta name="twitter:description" content="Upload your pet's photo and watch them come to life as a custom painted portrait. Pick a style, generate, refine, download. From watercolor to renaissance — your pet, immortalized." />
      <meta name="twitter:image" content="https://www.littlesouls.app/og/pawtraits-studio.jpg" />
      <meta property="article:author" content="Little Souls" />
      <meta property="article:section" content="Custom Pet Portraits" />
      <link rel="canonical" href="https://littlesouls.app/pawtraits/studio" />
    </Helmet>
    <div style={{ background: PALETTE.cream, minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <StudioAtmosphere active={generating} />
      <div style={{ position: "relative", zIndex: 1 }}>
      <PortraitsNav cartCount={cart.length} onCartOpen={() => setCartOpen(true)} />

      <main className="pt-[88px] pb-24">
        <section className="px-5 md:px-8" style={{ maxWidth: 1240, margin: "0 auto" }}>
          {/* Hero */}
          <motion.div
            className="text-center mt-8 mb-12"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${PALETTE.sand}`, backdropFilter: "blur(8px)" }}
            >
              <motion.span
                aria-hidden
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: PALETTE.rose, display: "inline-block" }}
              />
              <p
                className="uppercase"
                style={{ color: PALETTE.muted, letterSpacing: "0.18em", fontSize: 11, fontWeight: 700 }}
              >
                AI Studio · 64 styles · full-size pawtrait per generation
              </p>
            </div>
            <h1
              className="font-serif"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", color: PALETTE.ink, lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Your pet,{" "}
              <span style={{ position: "relative", display: "inline-block" }}>
                <span
                  style={{
                    background: `linear-gradient(90deg, ${PALETTE.rose} 0%, ${PALETTE.gold} 50%, ${PALETTE.rose} 100%)`,
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "studio-gradient-pan 6s ease-in-out infinite",
                  }}
                >
                  reimagined.
                </span>
              </span>
            </h1>
            <style>{`@keyframes studio-gradient-pan{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
            <p
              className="mt-4 mx-auto font-cormorant italic"
              style={{ fontSize: 20, color: PALETTE.warm, maxWidth: 560 }}
            >
              Pick a Style, pick a Theme, get a full-size portrait in under 10 seconds. Their face, locked. The world, anything.
            </p>
            <p className="mt-6">
              <Link
                to="/pawtraits/templates"
                className="text-[13px] underline-offset-4 hover:underline"
                style={{ color: PALETTE.muted }}
              >
                Want their actual face on a mug instead? Try Templates →
              </Link>
            </p>

            {/* Credit balance / signup prompt — neutral skeleton while
                auth resolves, so a returning signed-in customer doesn't
                see "3 free portraits — Sign in" flash before re-rendering
                to their balance. */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "#fff", border: `1px solid ${PALETTE.sand}`, color: PALETTE.earth, fontSize: 13, minWidth: 220, justifyContent: 'center' }}
            >
              {(authLoading || (user && creditsLoading && balance == null)) ? (
                <span style={{ color: PALETTE.muted, opacity: 0.4 }} aria-hidden>…</span>
              ) : user ? (
                <>
                  <span><strong style={{ color: PALETTE.ink }}>{balance ?? 0}</strong> credits</span>
                  {tier && <span style={{ color: PALETTE.muted }}>· {tier === "elite" ? "Elite" : "Pass"}</span>}
                  <Link to="/pawtraits#topup" className="ml-2" style={{ color: PALETTE.rose, fontWeight: 600 }}>
                    Top up →
                  </Link>
                </>
              ) : (
                <>
                  <span>3 free portraits with sign-up — then £4.99 for 5 more.</span>
                  <Link to={`/auth?next=${encodeURIComponent("/pawtraits/studio")}`} style={{ color: PALETTE.rose, fontWeight: 600 }}>
                    Sign in →
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Step 1: Upload */}
          <div className="mb-10">
            <PetPhotoUpload
              photoUrl={photoUrl}
              onUploaded={setPhotoUrl}
              onReset={() => {
                setPhotoUrl(null);
                setVariants([]);
                setSelectedVariantUrl(null);
              }}
            />
          </div>

          {/* Step 2 + 3: Style/Theme + Generate */}
          {photoUrl && (
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
              <div>
                <StyleThemePicker
                  styleId={styleId}
                  themeId={themeId}
                  addDetails={addDetails}
                  onStyleChange={setStyleId}
                  onThemeChange={setThemeId}
                  onAddDetailsChange={setAddDetails}
                />
                <motion.button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  whileHover={canGenerate ? { scale: 1.015 } : undefined}
                  whileTap={canGenerate ? { scale: 0.985 } : undefined}
                  className="relative mt-6 w-full px-6 py-3.5 rounded-full text-base font-medium transition-opacity disabled:opacity-50 overflow-hidden"
                  style={{
                    background: `linear-gradient(110deg, ${PALETTE.rose} 0%, ${PALETTE.roseDeep} 50%, ${PALETTE.rose} 100%)`,
                    backgroundSize: "200% 100%",
                    color: "#fff",
                    letterSpacing: "0.04em",
                    boxShadow: canGenerate
                      ? `0 12px 32px -8px ${PALETTE.rose}80, 0 0 0 1px ${PALETTE.rose}30`
                      : "0 4px 14px rgba(191, 82, 74, 0.18)",
                    animation: canGenerate ? "studio-btn-pan 4s ease-in-out infinite" : undefined,
                  }}
                >
                  {/* Ripple shimmer when enabled */}
                  {canGenerate && !generating && (
                    <motion.span
                      aria-hidden
                      initial={{ x: "-120%" }}
                      animate={{ x: "120%" }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        width: "40%",
                        background: "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                      }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {generating ? "Generating your pawtrait…" : "Generate pawtrait →"}
                  </span>
                </motion.button>
                <style>{`@keyframes studio-btn-pan{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}`}</style>
              </div>

              {/* Variant gallery + cart panel */}
              <div className="lg:sticky lg:top-[88px]">
                <AnimatePresence mode="wait">
                  {aiPaused ? (
                    <motion.div
                      key="ai-paused"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg p-8 text-center"
                      style={{ background: "#fff", border: `1px solid ${PALETTE.sand}` }}
                    >
                      <p className="font-serif" style={{ fontSize: 22, color: PALETTE.ink }}>
                        Portrait studio is paused
                      </p>
                      <p className="mt-2 font-cormorant italic" style={{ fontSize: 16, color: PALETTE.warm, lineHeight: 1.45 }}>
                        Our studio is briefly out of credit. Your generation credits weren't charged. Try the Templates flow — your pet's actual face on a beautifully framed product.
                      </p>
                      <Link
                        to="/pawtraits/templates"
                        className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium"
                        style={{ background: PALETTE.rose, color: "#fff", letterSpacing: "0.04em" }}
                      >
                        Try Templates instead →
                      </Link>
                    </motion.div>
                  ) : generating ? (
                    <GenerationCanvas key="loading" />
                  ) : variants.length > 0 ? (
                    <motion.div
                      key="variants"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p
                        className="uppercase mb-3"
                        style={{ color: PALETTE.muted, fontSize: 11, letterSpacing: "0.12em" }}
                      >
                        Pick your favourite for printing
                      </p>
                      <VariantGallery
                        variants={variants}
                        selectedUrl={selectedVariantUrl}
                        onSelect={setSelectedVariantUrl}
                      />

                      {/* Product picker */}
                      <div className="mt-6 space-y-3">
                        <div>
                          <p
                            className="uppercase mb-2"
                            style={{ color: PALETTE.muted, fontSize: 11, letterSpacing: "0.12em" }}
                          >
                            Print on
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {PRODUCT_KEYS.map((key) => (
                              <button
                                key={key}
                                onClick={() => setProductType(key)}
                                className="px-3 py-1.5 rounded-full text-sm"
                                style={{
                                  background: productType === key ? PALETTE.ink : "#fff",
                                  color: productType === key ? "#fff" : PALETTE.ink,
                                  border: `1px solid ${productType === key ? PALETTE.ink : PALETTE.sand}`,
                                }}
                              >
                                {PRODUCTS[key].shortLabel}
                              </button>
                            ))}
                          </div>
                        </div>

                        {PRODUCTS[productType].hasSize && (
                          <div>
                            <p
                              className="uppercase mb-2"
                              style={{ color: PALETTE.muted, fontSize: 11, letterSpacing: "0.12em" }}
                            >
                              Size
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(PRODUCTS[productType].variants).map(([key, v]) => (
                                <button
                                  key={key}
                                  onClick={() => setSizeKey(key as AnySizeKey)}
                                  className="px-3 py-1.5 rounded-full text-sm"
                                  style={{
                                    background: sizeKey === key ? PALETTE.ink : "#fff",
                                    color: sizeKey === key ? "#fff" : PALETTE.ink,
                                    border: `1px solid ${sizeKey === key ? PALETTE.ink : PALETTE.sand}`,
                                  }}
                                >
                                  {v?.sizeLabel} · {formatPrice(v?.priceMajor ?? 0)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={handleAdd}
                        disabled={!canAdd}
                        className="mt-6 w-full px-6 py-3 rounded-full text-base font-medium transition-opacity disabled:opacity-50"
                        style={{
                          background: PALETTE.ink,
                          color: "#fff",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Add to cart · {variant ? formatPrice(variant.priceMajor) : ""}
                      </button>
                    </motion.div>
                  ) : (
                    <StudioPlaceholder hasStyle={!!styleId} hasTheme={!!themeId} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </section>
      </main>

      <PortraitsFooter />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        onRemove={(id) => setCart((c) => c.filter((i) => i.id !== id))}
        onCheckout={handleCheckout}
        checkoutBusy={checkoutBusy}
        checkoutError={checkoutError}
      />
      </div>
    </div>
    </>
  );
}
