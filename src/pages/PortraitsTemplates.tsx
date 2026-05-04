/**
 * /portraits/templates — Tier 0 (no-signup) template flow.
 *
 * Customer journey:
 *   1. Upload pet photo
 *   2. Auto cutout via /api/portraits/cutout (Photoroom)
 *   3. Pick template from 5-tile gallery
 *   4. Live preview (Konva) with drag/zoom/rotate
 *   5. Pick size if product has sizes
 *   6. Add to cart → /api/portraits/composite renders 3000×3000 print master →
 *      same Shopify checkout as AI-gen tier
 *
 * Differs from /portraits in that no AI generation happens, no signup is
 * required, and the resulting product carries the customer's REAL pet photo
 * rather than an AI reinterpretation. This is the social-commerce funnel
 * page (TikTok Shop / IG Shop / FB Shop product feed land here).
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";
import { PortraitsFooter } from "@/components/portraits/PortraitsFooter";
import { PetPhotoUpload } from "@/components/portraits/PetPhotoUpload";
import { CartDrawer } from "@/components/portraits/CartDrawer";
import { TemplatePreview } from "@/components/portraits/templates/TemplatePreview";
import { TEMPLATES, DEFAULT_TRANSFORM, type TemplateDef, type PetTransform } from "@/components/portraits/templates/data";
import { PRODUCTS, resolveVariant, formatPrice, type AnySizeKey } from "@/components/portraits/productLineup";
import { buildCartItem, loadCart, saveCart, type CartItem } from "@/components/portraits/cart";
import { PALETTE } from "@/components/portraits/tokens";
import { savePetPhoto, loadPetPhoto, clearPetPhoto } from "@/components/portraits/photoSharing";

type Step = "upload" | "cutout" | "design" | "added";

export default function PortraitsTemplates() {
  const [photoUrl, setPhotoUrlState] = useState<string | null>(() => loadPetPhoto());
  const setPhotoUrl = (url: string | null) => {
    setPhotoUrlState(url);
    if (url) savePetPhoto(url); else clearPetPhoto();
  };
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [cutoutLoading, setCutoutLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDef | null>(null);
  const [transform, setTransform] = useState<PetTransform>(DEFAULT_TRANSFORM);
  const [sizeKey, setSizeKey] = useState<AnySizeKey | null>(null);
  const [adding, setAdding] = useState(false);

  // Cart wiring
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  useEffect(() => { saveCart(cart); }, [cart]);

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

  // Auto-cutout when photo uploads
  useEffect(() => {
    if (!photoUrl || cutoutUrl || cutoutLoading) return;
    setCutoutLoading(true);
    fetch("/api/portraits?action=cutout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: photoUrl }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "Cutout failed");
        return r.json();
      })
      .then((data: { cutoutUrl: string }) => setCutoutUrl(data.cutoutUrl))
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setCutoutLoading(false));
  }, [photoUrl, cutoutUrl, cutoutLoading]);

  // Reset size when template changes
  useEffect(() => {
    if (!selectedTemplate) {
      setSizeKey(null);
      return;
    }
    const product = PRODUCTS[selectedTemplate.productType];
    setSizeKey(product.defaultSizeKey);
    setTransform(DEFAULT_TRANSFORM);
  }, [selectedTemplate]);

  const step: Step = !photoUrl
    ? "upload"
    : !cutoutUrl
    ? "cutout"
    : "design";

  const product = selectedTemplate ? PRODUCTS[selectedTemplate.productType] : null;
  const variant = selectedTemplate && sizeKey ? resolveVariant(selectedTemplate.productType, sizeKey) : null;

  async function handleAddToCart() {
    if (!selectedTemplate || !variant || !cutoutUrl || !photoUrl) return;
    setAdding(true);
    try {
      const compRes = await fetch("/api/portraits?action=composite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cutoutUrl,
          templateId: selectedTemplate.id,
          transform,
        }),
      });
      if (!compRes.ok) throw new Error((await compRes.json()).error || "Composite failed");
      const { printMasterUrl } = (await compRes.json()) as { printMasterUrl: string };

      const item = buildCartItem({
        kind: "template",
        productType: selectedTemplate.productType,
        sizeKey: sizeKey!,
        packId: selectedTemplate.id,
        packName: selectedTemplate.label,
        style: "photographic",
        sourcePhotoUrl: photoUrl,
        previewUrl: printMasterUrl,
        printMasterUrl,
        soulEdition: false,
        soulEditionPriceMajor: 0,
        variant,
        id: crypto.randomUUID(),
      });
      setCart((c) => [...c, item]);
      toast.success(`${selectedTemplate.label} added`);
      setCartOpen(true);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div style={{ background: PALETTE.cream, minHeight: "100vh" }}>
      <PortraitsNav cartCount={cart.length} onCartOpen={() => setCartOpen(true)} />

      <main className="pt-[88px] pb-24">
        {/* Hero */}
        <section className="px-5 md:px-8" style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="text-center mt-8 mb-12">
            <p
              className="uppercase mb-4"
              style={{ color: PALETTE.muted, letterSpacing: "0.16em", fontSize: 12, fontWeight: 600 }}
            >
              Tier 0 · Print my pet · No signup
            </p>
            <h1
              className="font-serif"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", color: PALETTE.ink, lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Their face. <span style={{ color: PALETTE.rose }}>Beautifully framed.</span>
            </h1>
            <p
              className="mt-4 mx-auto font-cormorant italic"
              style={{ fontSize: 20, color: PALETTE.warm, maxWidth: 560 }}
            >
              Drop a photo. Pick a template. We frame their actual face — clean, gold-ringed, no AI guesswork.
            </p>
            <p className="mt-6">
              <Link
                to="/portraits"
                className="text-[13px] underline-offset-4 hover:underline"
                style={{ color: PALETTE.muted }}
              >
                Want them as a wizard? Try the AI Studio →
              </Link>
            </p>
          </div>

          {/* Step 1: Upload */}
          <div className="mb-10">
            <PetPhotoUpload
              photoUrl={photoUrl}
              onUploaded={setPhotoUrl}
              onReset={() => {
                setPhotoUrl(null);
                setCutoutUrl(null);
                setSelectedTemplate(null);
              }}
            />
          </div>

          {/* Step 2: Cutout loading */}
          <AnimatePresence>
            {step === "cutout" && (
              <motion.div
                key="cutout-loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mb-10"
              >
                <p className="font-cormorant italic" style={{ fontSize: 18, color: PALETTE.warm }}>
                  Cutting them out of the background…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Design */}
          {step === "design" && cutoutUrl && (
            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* Left: template gallery */}
              <div>
                <h2 className="font-serif mb-4" style={{ fontSize: 22, color: PALETTE.ink }}>
                  Pick a template
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className="text-left rounded-lg p-3 transition-all"
                      style={{
                        background: "#fff",
                        border: selectedTemplate?.id === t.id ? `2px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sand}`,
                        boxShadow: selectedTemplate?.id === t.id ? "0 4px 16px rgba(191, 82, 74, 0.18)" : "none",
                      }}
                    >
                      <div
                        className="aspect-square rounded mb-2"
                        style={{
                          background: t.bgColor,
                          border: `1px solid ${PALETTE.sand}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: t.frameColor,
                          fontSize: 12,
                        }}
                      >
                        {/* Placeholder until thumbs ship — show frame shape name */}
                        {t.maskShape}
                      </div>
                      <p className="font-serif text-sm" style={{ color: PALETTE.ink }}>{t.label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: PALETTE.muted }}>
                        {t.tags.join(" · ")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: live preview + buy */}
              <div className="md:sticky md:top-[88px]">
                {selectedTemplate ? (
                  <div>
                    <div className="flex justify-center mb-4">
                      <TemplatePreview
                        template={selectedTemplate}
                        cutoutUrl={cutoutUrl}
                        transform={transform}
                        onChange={setTransform}
                        size={420}
                      />
                    </div>

                    {/* Size picker */}
                    {product?.hasSize && (
                      <div className="mb-4">
                        <p
                          className="uppercase mb-2"
                          style={{ color: PALETTE.muted, fontSize: 11, letterSpacing: "0.12em" }}
                        >
                          Size
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(product.variants).map(([key, v]) => (
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

                    {/* CTA */}
                    <div
                      className="rounded-lg p-4 flex items-center justify-between"
                      style={{ background: "#fff", border: `1px solid ${PALETTE.sand}` }}
                    >
                      <div>
                        <p className="font-serif" style={{ fontSize: 16, color: PALETTE.ink }}>
                          {selectedTemplate.label}
                        </p>
                        <p className="text-xs" style={{ color: PALETTE.muted }}>
                          {variant ? variant.sizeLabel : ""}
                        </p>
                      </div>
                      <button
                        onClick={handleAddToCart}
                        disabled={!variant || adding}
                        className="px-5 py-2.5 rounded-full text-sm font-medium transition-opacity disabled:opacity-50"
                        style={{
                          background: PALETTE.rose,
                          color: "#fff",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {adding ? "Preparing…" : `Add to cart · ${variant ? formatPrice(variant.priceMajor) : ""}`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-lg p-12 text-center"
                    style={{ background: "#fff", border: `1px dashed ${PALETTE.sand}`, color: PALETTE.muted }}
                  >
                    Pick a template to see them framed.
                  </div>
                )}
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
