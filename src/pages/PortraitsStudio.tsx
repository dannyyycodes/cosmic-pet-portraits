/**
 * /portraits/studio — Tier 1+ AI Studio (Style × Theme + 4 variants).
 *
 * Customer journey:
 *   1. Upload pet photo
 *   2. Pick Style (8 cards) + Theme (8 cards) + optional details
 *   3. Generate → 4 variants come back from /api/portraits/generate
 *   4. Pick favourite variant
 *   5. Pick product surface + size
 *   6. Add to cart → existing Shopify checkout
 *
 * Phase 1B = anonymous free, no auth gate yet (Phase 2 adds Turnstile + sign-up wall).
 *
 * Distinct from /portraits (legacy 6-pack flow) and /portraits/templates (Tier 0).
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";
import { PortraitsFooter } from "@/components/portraits/PortraitsFooter";
import { PetPhotoUpload } from "@/components/portraits/PetPhotoUpload";
import { CartDrawer } from "@/components/portraits/CartDrawer";
import { StyleThemePicker } from "@/components/portraits/styles/StyleThemePicker";
import { VariantGallery, type Variant } from "@/components/portraits/styles/VariantGallery";
import { getStyle, getTheme } from "@/components/portraits/styles/styleTheme";
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
  const { user, session } = useAuth();
  const { balance, tier, refresh: refreshCredits } = useCredits();
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
      toast("Sign in to generate your AI portrait — 1 free portrait on us.", { duration: 2200 });
      setTimeout(() => navigate(`/auth?next=${encodeURIComponent("/portraits/studio")}`), 800);
      return;
    }
    setGenerating(true);
    setVariants([]);
    setSelectedVariantUrl(null);
    setAiPaused(false);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
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
        navigate("/unlimited");
        return;
      }
      if (res.status === 503 && data.error === "ai-service-paused") {
        setAiPaused(true);
        toast.error(data.message ?? "AI service paused. Try Templates instead.");
        refreshCredits();
        return;
      }
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setVariants(data.variants);
      if (data.variants[0]) setSelectedVariantUrl(data.variants[0].url);
      refreshCredits();
    } catch (e) {
      const err = e as Error;
      toast.error(err.name === "AbortError" ? "Generation timed out after 60s. Try again." : err.message);
    } finally {
      clearTimeout(timer);
      setGenerating(false);
    }
  }

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
    toast.success(`${style.label} × ${theme.label} added`);
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
    <div style={{ background: PALETTE.cream, minHeight: "100vh" }}>
      <PortraitsNav cartCount={cart.length} onCartOpen={() => setCartOpen(true)} />

      <main className="pt-[88px] pb-24">
        <section className="px-5 md:px-8" style={{ maxWidth: 1240, margin: "0 auto" }}>
          {/* Hero */}
          <div className="text-center mt-8 mb-12">
            <p
              className="uppercase mb-4"
              style={{ color: PALETTE.muted, letterSpacing: "0.16em", fontSize: 12, fontWeight: 600 }}
            >
              AI Studio · 64 styles · 4 variants per portrait
            </p>
            <h1
              className="font-serif"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", color: PALETTE.ink, lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Your pet, <span style={{ color: PALETTE.rose }}>reimagined.</span>
            </h1>
            <p
              className="mt-4 mx-auto font-cormorant italic"
              style={{ fontSize: 20, color: PALETTE.warm, maxWidth: 560 }}
            >
              Pick a Style, pick a Theme, get 4 portraits in under 10 seconds. Their face, locked. The world, anything.
            </p>
            <p className="mt-6">
              <Link
                to="/portraits/templates"
                className="text-[13px] underline-offset-4 hover:underline"
                style={{ color: PALETTE.muted }}
              >
                Want their actual face on a mug instead? Try Templates →
              </Link>
            </p>

            {/* Credit balance / signup prompt */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: "#fff", border: `1px solid ${PALETTE.sand}`, color: PALETTE.earth, fontSize: 13 }}
            >
              {user ? (
                <>
                  <span><strong style={{ color: PALETTE.ink }}>{balance ?? "…"}</strong> credits</span>
                  {tier && <span style={{ color: PALETTE.muted }}>· {tier === "elite" ? "Elite" : "Pass"}</span>}
                  <Link to="/unlimited" className="ml-2" style={{ color: PALETTE.rose, fontWeight: 600 }}>
                    Top up →
                  </Link>
                </>
              ) : (
                <>
                  <span>1 portrait free with sign-up.</span>
                  <Link to={`/auth?next=${encodeURIComponent("/portraits/studio")}`} style={{ color: PALETTE.rose, fontWeight: 600 }}>
                    Sign in →
                  </Link>
                </>
              )}
            </div>
          </div>

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
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="mt-6 w-full px-6 py-3 rounded-full text-base font-medium transition-opacity disabled:opacity-50"
                  style={{
                    background: PALETTE.rose,
                    color: "#fff",
                    letterSpacing: "0.04em",
                    boxShadow: "0 6px 18px rgba(191, 82, 74, 0.3)",
                  }}
                >
                  {generating ? "Generating 4 variants…" : "Generate 4 variants →"}
                </button>
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
                        AI service is paused
                      </p>
                      <p className="mt-2 font-cormorant italic" style={{ fontSize: 16, color: PALETTE.warm, lineHeight: 1.45 }}>
                        Our AI is briefly out of credit. Your generation credits weren't charged. Try the Templates flow — your pet's actual face on a beautifully framed product, no AI required.
                      </p>
                      <Link
                        to="/portraits/templates"
                        className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium"
                        style={{ background: PALETTE.rose, color: "#fff", letterSpacing: "0.04em" }}
                      >
                        Try Templates instead →
                      </Link>
                    </motion.div>
                  ) : generating ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg p-12 text-center"
                      style={{ background: "#fff", border: `1px solid ${PALETTE.sand}` }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 mx-auto rounded-full border-2"
                        style={{ borderColor: PALETTE.rose, borderTopColor: "transparent" }}
                      />
                      <p className="mt-4 font-cormorant italic" style={{ fontSize: 18, color: PALETTE.warm }}>
                        Painting their portrait in 4 ways…
                      </p>
                      <p className="mt-1 text-xs" style={{ color: PALETTE.muted }}>
                        ~10 seconds
                      </p>
                    </motion.div>
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
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg p-12 text-center"
                      style={{ background: "#fff", border: `1px dashed ${PALETTE.sand}`, color: PALETTE.muted }}
                    >
                      Pick a Style + Theme, then hit generate.
                    </motion.div>
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
  );
}
