/**
 * /portraits — Cosmic Pet Portraits landing page (cinematic editorial rebuild)
 *
 * Composition order (top → bottom):
 *   1. PortraitsHero       — 3-layer cinematic, rotating master portrait
 *   2. TrustStrip          — 3 metrics, hairline-divided cream band
 *   3. CharacterPacks      — 6 archetype cards, scroll-into-view stagger
 *   4. HowItWorks          — 3-step ribbon
 *   5. FrameSizes          — 4-tier price ladder with gold seal on £99 tier
 *   6. UploadStudio        — drop / character / size / live preview / checkout
 *   7. SoulEditionUpsell   — gold-hairline ceremonial card
 *   8. ReviewsCarousel     — testimonial scroll-snap, money-line typography
 *   9. InTheWildGallery    — 9-frame placeholder mosaic
 *  10. PortraitsFAQ        — 6 objection accordions
 *  11. PortraitsFooter     — newsletter capture + page links
 *
 * Pricing locked: vault/01-projects/little-souls/pet-portraits/pricing-ladder-2026-05-02.md
 * Build plan:     vault/01-projects/little-souls/pet-portraits/build-plan-2026-05-02.md
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";
import { checkAndStoreReferralFromURL } from "@/lib/referralTracking";

import "@/components/portraits/portraits.css";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";
import { PortraitsBackdrop } from "@/components/portraits/PortraitsBackdrop";
import { PetPhotoUpload } from "@/components/portraits/PetPhotoUpload";
import { TEMPLATES } from "@/components/portraits/templates/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MasterPortraitPlaceholder } from "@/components/portraits/MasterPortraitPlaceholder";
import { PortraitsHero } from "@/components/portraits/PortraitsHero";
import { TrustStrip } from "@/components/portraits/TrustStrip";
import { CharacterPacks, CHARACTER_PACKS } from "@/components/portraits/CharacterPacks";
import { ExploreRange, type RangeTileId } from "@/components/portraits/ExploreRange";
import {
  PRODUCTS,
  PRODUCT_KEYS,
  resolveVariant,
  type ProductTypeKey,
  type AnySizeKey,
} from "@/components/portraits/productLineup";
import { CartDrawer } from "@/components/portraits/CartDrawer";
import { savePetPhoto, loadPetPhoto, clearPetPhoto } from "@/components/portraits/photoSharing";
import {
  type CartItem,
  buildCartItem,
  loadCart,
  saveCart,
  cartCount as countCart,
} from "@/components/portraits/cart";
import { HowItWorks } from "@/components/portraits/HowItWorks";
import { FrameSizes, PRICING, SIZE_KEYS } from "@/components/portraits/FrameSizes";
import type { Currency, SizeKey } from "@/components/portraits/FrameSizes";
import { ReviewsCarousel } from "@/components/portraits/ReviewsCarousel";
import { PortraitsFAQ } from "@/components/portraits/PortraitsFAQ";
import { PortraitsFooter } from "@/components/portraits/PortraitsFooter";
import {
  PALETTE,
  display,
  cormorantItalic,
  eyebrow,
  tabularPrice,
  EASE,
} from "@/components/portraits/tokens";

// ─────────────────────────────────────────────────────────────────────────────
// UploadStudio — the working state machine.
//   State: photo → pack → size → preview status → checkout status
//   Inlined here because it owns shared state with the page actions.
// ─────────────────────────────────────────────────────────────────────────────

type PreviewStatus = "idle" | "generating" | "ready" | "error";
type CheckoutStatus = "idle" | "creating" | "redirecting" | "error";
type StyleOption = "photographic" | "illustrated";
type AddStatus = "idle" | "added";

interface UploadStudioProps {
  currency: Currency;
  uploadRef: React.RefObject<HTMLDivElement>;
  productType: ProductTypeKey;
  initialPackId: string | null;
  initialSoulEdition?: boolean;
  onPackChange?: (id: string | null) => void;
  onProductChange?: (p: ProductTypeKey) => void;
  onAddToCart: (item: CartItem) => void;
}

function UploadStudio({
  currency,
  uploadRef,
  productType,
  initialPackId,
  initialSoulEdition,
  onPackChange,
  onProductChange,
  onAddToCart,
}: UploadStudioProps) {
  const product = PRODUCTS[productType];

  // Map each product type to its default template (clean-masked design).
  const productToTemplateId: Record<ProductTypeKey, string> = {
    "framed-canvas": "vignette-canvas",
    "mug": "circle-mug",
    "tote": "hex-tote",
    "tee": "badge-tee",
    "hoodie": "crest-hoodie",
  };
  const template = TEMPLATES.find((t) => t.id === productToTemplateId[productType])
    ?? TEMPLATES[0];

  const [photoUrl, setPhotoUrlState] = useState<string | null>(() => loadPetPhoto());
  const setPhotoUrl = (url: string | null) => {
    setPhotoUrlState(url);
    if (url) savePetPhoto(url); else clearPetPhoto();
  };
  const [sizeKey, setSizeKey] = useState<AnySizeKey>(product.defaultSizeKey);
  const [withSoulEdition, setWithSoulEdition] = useState<boolean>(!!initialSoulEdition);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [cutoutStatus, setCutoutStatus] = useState<"idle" | "cutting" | "ready" | "error">("idle");
  const [adding, setAdding] = useState(false);
  const [addStatus, setAddStatus] = useState<AddStatus>("idle");
  // Mockup cache: photoreal product render from Printful. Keyed by the design
  // URL we actually sent (cutoutUrl preferred, photoUrl fallback when bg-remove
  // failed). Switching products = new key = new render.
  const [mockupCache, setMockupCache] = useState<Record<string, string>>({});
  const designForMockup = cutoutUrl ?? photoUrl;
  const mockupKey = `${productType}|${designForMockup ?? ""}`;
  const mockupUrl = designForMockup ? mockupCache[mockupKey] ?? null : null;

  // Soul Edition is only relevant when the primary product is the framed canvas.
  // For other surfaces we hide the toggle and force-off.
  const soulEditionAvailable = productType === "framed-canvas";
  const effectiveSoulEdition = soulEditionAvailable && withSoulEdition;

  const variant = resolveVariant(productType, sizeKey)
    ?? resolveVariant(productType, product.defaultSizeKey)!;
  const soul = PRICING[currency].soulEdition;
  const totalMajor = variant.priceMajor + (effectiveSoulEdition ? soul.retail : 0);
  const totalLabel = currency === "GBP" ? `£${totalMajor}` : `$${totalMajor}`;

  // Reset size when product type changes.
  useEffect(() => {
    setSizeKey(product.defaultSizeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType]);

  // Sync soul-edition flag when ExploreRange tile turns it on
  useEffect(() => {
    if (initialSoulEdition !== undefined) setWithSoulEdition(!!initialSoulEdition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSoulEdition]);

  // Server-side bg-removal via Photoroom — clean cutout of the pet face,
  // then composited onto the clean Printful blank base via Sharp. Two-step:
  //   1. POST /api/portraits?action=cutout  (Photoroom $0.02/call)
  //   2. POST /api/portraits?action=mockup  (Sharp composite onto blank)
  // Total ~2-3s. The cutout layer ensures the pet face is alone on the mug,
  // not a rectangular photo with background.
  async function fireCutout(imageUrl: string) {
    setCutoutStatus("cutting");
    setCutoutUrl(null);
    try {
      const res = await fetch("/api/portraits?action=cutout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.cutoutUrl) throw new Error(data.error || "cutout-failed");
      setCutoutUrl(data.cutoutUrl);
      setCutoutStatus("ready");
    } catch (err) {
      console.warn("[cutout] falling back to raw photo:", err);
      // Fallback: use the raw photo as design. Mockup still renders, just with
      // the photo's background visible. Better than empty preview.
      setCutoutUrl(imageUrl);
      setCutoutStatus("ready");
    }
  }

  const handlePhotoUploaded = (url: string) => {
    setPhotoUrl(url);
    void fireCutout(url);
  };

  // Live mockup: composite the cutout onto the clean Printful blank via Sharp.
  // ~500ms. Cached per (product × cutout) so switching products is instant.
  useEffect(() => {
    if (!cutoutUrl || cutoutStatus !== "ready") return;
    const key = `${productType}|${cutoutUrl}`;
    if (mockupCache[key]) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/portraits?action=mockup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ designUrl: cutoutUrl, productType }),
        });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setMockupCache((prev) => ({ ...prev, [key]: url }));
      } catch {
        /* silent — fallback render shows photo on cream backdrop */
      }
    })();

    return () => { cancelled = true; };
  }, [cutoutUrl, cutoutStatus, productType, mockupCache]);

  const handleResetPhoto = () => {
    setPhotoUrl(null);
    setCutoutUrl(null);
    setCutoutStatus("idle");
  };

  async function handleAddToCart() {
    if (!photoUrl || !cutoutUrl || cutoutStatus !== "ready" || adding) return;
    setAdding(true);
    try {
      const compRes = await fetch("/api/portraits?action=composite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cutoutUrl, templateId: template.id }),
      });
      const data = await compRes.json();
      if (!compRes.ok || !data.printMasterUrl) throw new Error(data.error || "Composite failed");

      const item = buildCartItem({
        kind: "template",
        productType,
        sizeKey,
        packId: template.id,
        packName: `${template.label} · ${product.label}`,
        style: "photographic",
        sourcePhotoUrl: photoUrl,
        previewUrl: data.printMasterUrl,
        printMasterUrl: data.printMasterUrl,
        soulEdition: effectiveSoulEdition,
        soulEditionPriceMajor: soul.retail,
        variant,
        id: crypto.randomUUID(),
      });
      onAddToCart(item);
      setAddStatus("added");
      // Brief confirmation pulse, then back to idle so they can configure another.
      window.setTimeout(() => setAddStatus("idle"), 2200);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <section
      ref={uploadRef}
      id="upload"
      className="relative px-6 md:px-10"
      style={{
        background: PALETTE.cream2,
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "clamp(96px, 12vh, 160px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="upload-heading"
    >
      <div className="mx-auto" style={{ maxWidth: "1180px" }}>
        <div className="max-w-[760px]">
          <p style={eyebrow(PALETTE.earthMuted)}>The studio</p>
          <h2
            id="upload-heading"
            style={{ ...display("clamp(32px, 4.4vw, 52px)"), color: PALETTE.ink, marginTop: "16px" }}
          >
            Drop their photo. <span style={{ color: PALETTE.rose }}>See the proof.</span>{" "}
            Pay only when it's right.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-12 items-start">
          {/* ─── Configurator column (no numbered steps — compact sections) ─── */}
          <div className="lg:col-span-7">
            {/* ── Surface switcher ─ always-visible, lets customer change
                product without scrolling back up to ExploreRange ─────── */}
            <SectionLabel className="!mb-3">Print on</SectionLabel>
            <ProductTypeSwitcher
              value={productType}
              onChange={(p) => onProductChange?.(p)}
            />

            {/* ── 2. SIZE — only when product has sizes (canvas, tee, hoodie). ── */}
            {product.hasSize && (
              <>
                <Divider />
                <SectionLabel>{product.shortLabel} size</SectionLabel>
              </>
            )}

            {product.hasSize && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(product.variants) as AnySizeKey[]).map((key) => {
                  const v = product.variants[key]!;
                  const active = sizeKey === key;
                  const isHero = product.heroSizeKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSizeKey(key)}
                      aria-pressed={active}
                      className="rounded-sm px-3 py-3 transition-colors text-left relative"
                      style={{
                        background: active ? PALETTE.ink : PALETTE.cream,
                        color: active ? PALETTE.cream : PALETTE.ink,
                        border: active
                          ? `1px solid ${PALETTE.ink}`
                          : isHero
                            ? `1px solid ${PALETTE.gold}`
                            : `1px solid ${PALETTE.sand}`,
                      }}
                    >
                      {isHero && !active && (
                        <span
                          aria-label="Most popular"
                          className="absolute -top-2 right-2 px-2 py-0.5 rounded-full"
                          style={{
                            background: PALETTE.gold,
                            color: PALETTE.cream,
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          Hero
                        </span>
                      )}
                      <p
                        style={{
                          fontFamily: 'Asap, system-ui, sans-serif',
                          fontSize: "15px",
                          fontWeight: 600,
                          letterSpacing: "-0.005em",
                        }}
                      >
                        {v.sizeLabel}
                      </p>
                      <p
                        style={{
                          marginTop: "2px",
                          fontSize: "12.5px",
                          fontVariantNumeric: "tabular-nums",
                          opacity: active ? 0.85 : 0.65,
                        }}
                      >
                        £{v.priceMajor}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── 3. PHOTO ──────────────────────────────────────────── */}
            <Divider />
            <SectionLabel>Their photo</SectionLabel>
            <PetPhotoUpload
              photoUrl={photoUrl}
              onUploaded={handlePhotoUploaded}
              onReset={handleResetPhoto}
            />

            {/* Soul Edition — quiet checkbox row, only when canvas */}
            {soulEditionAvailable && (
              <button
                type="button"
                onClick={() => setWithSoulEdition((v) => !v)}
                aria-pressed={withSoulEdition}
                className="mt-3 w-full flex items-center gap-3 text-left rounded-sm transition-colors px-3 py-2.5"
                style={{
                  background: withSoulEdition ? "rgba(196, 162, 101, 0.10)" : "transparent",
                  border: `1px solid ${withSoulEdition ? PALETTE.gold : PALETTE.sand}`,
                }}
              >
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center rounded-sm transition-colors flex-shrink-0"
                  style={{
                    width: "18px",
                    height: "18px",
                    border: `1.5px solid ${withSoulEdition ? PALETTE.gold : PALETTE.earthMuted}`,
                    background: withSoulEdition ? PALETTE.gold : "transparent",
                    color: PALETTE.cream,
                    fontSize: "11px",
                    lineHeight: 1,
                  }}
                >
                  {withSoulEdition ? "✓" : ""}
                </span>
                <span style={{ fontFamily: 'Assistant, system-ui, sans-serif', fontSize: "13.5px", color: PALETTE.ink, fontWeight: 500 }}>
                  Add the Soul Edition · their bound natal chart reading
                </span>
                <span style={{ marginLeft: "auto", fontFamily: 'Asap, system-ui, sans-serif', fontSize: "13.5px", fontWeight: 700, color: withSoulEdition ? PALETTE.goldDeep : PALETTE.earthMuted, fontVariantNumeric: "tabular-nums" }}>
                  +£{soul.retail}
                </span>
              </button>
            )}

            {/* ── 5. ADD TO CART ────────────────────────────────────── */}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={cutoutStatus !== "ready" || adding}
                className="w-full px-8 py-4 rounded-full transition-all hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{
                  background: addStatus === "added" ? PALETTE.ink : PALETTE.rose,
                  color: PALETTE.cream,
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  boxShadow: cutoutStatus === "ready" ? "0 18px 48px rgba(191, 82, 74, 0.28)" : "none",
                }}
              >
                {addStatus === "added" ? (
                  <span>✓ Added — configure another below</span>
                ) : adding ? (
                  <span>Preparing print master…</span>
                ) : (
                  <>
                    <span>Add to cart</span>
                    <span style={{ opacity: 0.7, fontWeight: 500 }}>·</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{totalLabel}</span>
                  </>
                )}
              </button>

              {/* Soft helper line */}
              <p
                className="mt-3 text-center"
                style={{ fontSize: "13px", color: PALETTE.earthMuted, minHeight: "1.4em" }}
              >
                {addStatus === "added"
                  ? "Switch product or size above to add another item, or open the cart to checkout."
                  : cutoutStatus === "cutting"
                    ? "Cutting their face out of the background…"
                    : cutoutStatus === "ready"
                      ? `Drag, zoom, rotate to fit. Then add to cart.`
                      : cutoutStatus === "error"
                        ? "Cutout failed — try another photo (face-on, well-lit)."
                        : !photoUrl
                          ? `Drop their photo to see them on the ${product.shortLabel.toLowerCase()}.`
                          : "Their face on the product · pay only when it feels right"}
              </p>
            </div>
          </div>

          {/* ─── Live preview column (sticky on desktop) ─────────── */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <p style={{ ...eyebrow(PALETTE.earthMuted), marginBottom: "14px" }}>Live preview · {product.label}</p>
              <div
                className="relative rounded-sm p-4"
                style={{
                  background: PALETTE.cream,
                  border: `1px solid ${PALETTE.sand}`,
                  boxShadow: "0 24px 48px rgba(20, 18, 16, 0.05)",
                }}
              >
                {/* Photoreal Printful mockup if ready; otherwise rendering /
                    cutting / idle states. Mockup shows regardless of whether
                    bg-remove succeeded — Printful prints the raw photo if no
                    cutout exists. */}
                {mockupUrl ? (
                  <div className="flex justify-center">
                    <img
                      src={mockupUrl}
                      alt={`Your pet on a ${product.label}`}
                      className="rounded-sm"
                      style={{ maxWidth: "100%", height: "auto", maxHeight: "480px" }}
                    />
                  </div>
                ) : designForMockup ? (
                  <div
                    className="rounded-sm flex flex-col items-center justify-center relative px-6"
                    style={{
                      aspectRatio: "1/1",
                      background: `radial-gradient(ellipse at center, #FFFDF5 0%, ${PALETTE.cream2} 80%)`,
                      border: `1px solid ${PALETTE.sand}`,
                    }}
                  >
                    <img
                      src={cutoutUrl ?? photoUrl ?? undefined}
                      alt="Your pet"
                      style={{ maxWidth: "70%", maxHeight: "60%", objectFit: "contain", borderRadius: "4px" }}
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 rounded-full border-2 mt-4"
                      style={{ borderColor: PALETTE.rose, borderTopColor: "transparent" }}
                    />
                    <p className="mt-3" style={{ ...cormorantItalic("15px"), color: PALETTE.earth }}>
                      Rendering on the {product.shortLabel.toLowerCase()}…
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-sm flex flex-col items-center justify-center text-center px-6"
                    style={{
                      aspectRatio: "1/1",
                      background: PALETTE.cream2,
                      border: `1px dashed ${PALETTE.sand}`,
                    }}
                  >
                    <p style={{ ...cormorantItalic("16px"), color: PALETTE.earthMuted }}>
                      Drop their photo and we'll show them on a real {product.shortLabel.toLowerCase()}.
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {cutoutStatus === "ready" && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: EASE.out }}
                      style={{
                        ...cormorantItalic("16px"),
                        color: PALETTE.earth,
                        textAlign: "center",
                        marginTop: "14px",
                      }}
                    >
                      {product.label} · {variant.sizeLabel}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <p
                className="mt-4 text-center"
                style={{ fontSize: "12.5px", color: PALETTE.earthMuted, letterSpacing: "0.04em" }}
              >
                Drag · pinch to zoom · rotate to fit
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Compact section label — replaces big numbered StepBlock. */
function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`mb-4 ${className ?? ""}`}
      style={{
        fontFamily: 'Assistant, system-ui, sans-serif',
        fontSize: "11.5px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontWeight: 700,
        color: PALETTE.earthMuted,
      }}
    >
      {children}
    </p>
  );
}

/** Hairline divider between configurator sections. */
function Divider() {
  return (
    <div
      aria-hidden
      style={{
        height: "1px",
        background: PALETTE.sand,
        margin: "32px 0",
      }}
    />
  );
}

/** Slim segmented surface switcher — sits at top of configurator. Always
 *  visible so customer can pivot from canvas → mug → tee without losing
 *  their photo / character / style choices. */
function ProductTypeSwitcher({
  value,
  onChange,
}: {
  value: ProductTypeKey;
  onChange: (p: ProductTypeKey) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Print on"
      className="flex gap-1.5 rounded-full ls-snap-x overflow-x-auto"
      style={{
        background: PALETTE.cream,
        border: `1px solid ${PALETTE.sand}`,
        padding: "4px",
        width: "fit-content",
        maxWidth: "100%",
      }}
    >
      {PRODUCT_KEYS.map((key) => {
        const product = PRODUCTS[key];
        const active = value === key;
        const v = product.variants[product.defaultSizeKey]!;
        const priceLabel = product.hasSize ? `from £${v.priceMajor}` : `£${v.priceMajor}`;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            role="radio"
            aria-checked={active}
            className="rounded-full transition-all ls-snap-item flex-shrink-0"
            style={{
              background: active ? PALETTE.ink : "transparent",
              color: active ? PALETTE.cream : PALETTE.earth,
              fontFamily: 'Assistant, system-ui, sans-serif',
              padding: "8px 16px",
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "-0.005em" }}>
              {product.shortLabel}
            </span>
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 500,
                opacity: active ? 0.8 : 0.6,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {priceLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Inline style toggle pills (Photographic / Illustrated). */
function StylePills({
  value,
  onChange,
  disabled,
}: {
  value: StyleOption;
  onChange: (v: StyleOption) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Render style"
      className="inline-flex rounded-full overflow-hidden"
      style={{
        background: PALETTE.cream,
        border: `1px solid ${PALETTE.sand}`,
        padding: "3px",
      }}
    >
      {(["photographic", "illustrated"] as StyleOption[]).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            disabled={disabled}
            role="radio"
            aria-checked={active}
            className="rounded-full transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: active ? PALETTE.ink : "transparent",
              color: active ? PALETTE.cream : PALETTE.earth,
              fontFamily: 'Assistant, system-ui, sans-serif',
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              padding: "6px 14px",
              textTransform: "uppercase",
            }}
          >
            {opt === "photographic" ? "Photo" : "Illustrated"}
          </button>
        );
      })}
    </div>
  );
}

// Original StepBlock kept for reference — not currently rendered.
// (left in case we revert to the numbered-steps pattern later.)
function _StepBlock({
  index,
  label,
  active,
  dimmed,
  children,
}: {
  index: string;
  label: string;
  active?: boolean;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ opacity: dimmed ? 0.55 : 1, transition: "opacity 400ms ease" }}>
      <div className="flex items-baseline gap-3 mb-4">
        <span
          style={{
            fontFamily: 'Asap, system-ui, sans-serif',
            fontSize: "20px",
            fontWeight: 500,
            color: active ? PALETTE.rose : PALETTE.earthMuted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {index}
        </span>
        <span
          style={{
            fontSize: "11.5px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: active ? PALETTE.rose : PALETTE.earthMuted,
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page orchestrator
// ─────────────────────────────────────────────────────────────────────────────

const Portraits = () => {
  usePageAnalytics("/portraits");

  // Phase 2: detect via IP geolocation + persist to localStorage
  const currency: Currency = "GBP";

  const [presetPack, setPresetPack] = useState<string | null>(null);
  const [productType, setProductType] = useState<ProductTypeKey>("framed-canvas");
  const [presetSoulEdition, setPresetSoulEdition] = useState<boolean>(false);
  const uploadRef = useRef<HTMLDivElement>(null);

  // ─── Cart state — accumulates configured portraits across surfaces ──
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Hydrate cart from localStorage on first mount
  useEffect(() => {
    setCart(loadCart());
  }, []);
  // Persist on change
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    // Briefly open the cart so the customer sees the item land
    setCartOpen(true);
    window.setTimeout(() => setCartOpen(false), 1800);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((it) => it.id !== id));
  };

  const handleCheckoutAll = async () => {
    if (cart.length === 0) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          items: cart,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.invoiceUrl) throw new Error(data.error || "Checkout failed");
      window.location.href = data.invoiceUrl;
    } catch (err) {
      setCheckoutError((err as Error).message);
      setCheckoutBusy(false);
    }
  };

  useEffect(() => {
    checkAndStoreReferralFromURL();
  }, []);

  // Buttery smooth-scroll for the cinematic register. syncTouch:false keeps
  // mobile native momentum (parallax-skill rule). Cleanup tears it down on
  // route change so other pages aren't affected.
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      smoothWheel: true,
      syncTouch: false,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePickPack = (packId: string) => {
    setPresetPack(packId);
    setTimeout(scrollToUpload, 80);
  };

  const handlePickSize = (_size: SizeKey) => {
    // FrameSizes section is canvas-only, so any size click implies switching
    // primary product to framed canvas. UploadStudio's own size picker takes
    // it from there.
    setProductType("framed-canvas");
    setTimeout(scrollToUpload, 80);
  };

  const handleRangeTile = (id: RangeTileId) => {
    if (id === "soul-edition") {
      // Soul Edition is an add-on, not a product swap. Force product back to
      // framed-canvas and turn the toggle on.
      setProductType("framed-canvas");
      setPresetSoulEdition(true);
    } else {
      setProductType(id);
      setPresetSoulEdition(false);
    }
    setTimeout(scrollToUpload, 80);
  };

  return (
    <main
      data-portraits-page
      className="min-h-screen relative"
      style={{ background: "transparent" }}
    >
      <PortraitsBackdrop />
      <PortraitsNav cartCount={countCart(cart)} onCartOpen={() => setCartOpen(true)} />
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckoutAll}
        checkoutBusy={checkoutBusy}
        checkoutError={checkoutError}
      />
      {/* nav is fixed-position 62px tall — push hero below */}
      <div style={{ height: "62px" }} aria-hidden />
      <div style={{ position: "relative", zIndex: 1 }}>
      <PortraitsHero onBegin={scrollToUpload} />
      <TrustStrip />
      <ExploreRange
        onTileClick={handleRangeTile}
        activeId={presetSoulEdition ? "soul-edition" : productType}
      />
      <CharacterPacks onPickPack={handlePickPack} />
      <HowItWorks />
      <UploadStudio
        currency={currency}
        uploadRef={uploadRef}
        productType={productType}
        initialPackId={presetPack}
        initialSoulEdition={presetSoulEdition}
        onPackChange={setPresetPack}
        onProductChange={setProductType}
        onAddToCart={handleAddToCart}
      />
      <ReviewsCarousel />
      <div id="faq" />
      <PortraitsFAQ />
      <PortraitsFooter />
      </div>
    </main>
  );
};

export default Portraits;
