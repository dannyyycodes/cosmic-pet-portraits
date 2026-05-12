/**
 * Product lineup — single source of truth for the 6 launch surfaces.
 *
 * Drives:
 *   • ExploreRange tile clicks (which product → preselect)
 *   • UploadStudio price + size-picker visibility
 *   • Checkout endpoint variant dispatch
 *   • PortraitPreview product-badge rendering
 *
 * Variant IDs locked 2026-05-03 — see vault/.../launch-sku-spec-2026-05-03.md
 * and api/cart/checkout.ts FRAMED_CANVAS_VARIANTS / VARIANT_BY_PRODUCT.
 *
 * Soul Edition is a special case: it's an *add-on* not a primary product.
 * Picking the Soul Edition tile turns on the inline toggle in the studio
 * for the currently-selected primary surface (default: framed canvas).
 */

export type ProductTypeKey =
  | "digital"         // digital download only (no physical, no shipping)
  | "canvas"          // unframed slim stretched canvas (physical entry)
  | "framed-canvas"   // canvas + slim wood frame (physical upgrade)
  | "gift-card"       // Shopify-native gift card (no print master, recipient details as line-item props)
  | "mug"
  | "tote"
  | "tee"
  | "hoodie";

export type CanvasSizeKey =
  | "8x10" | "12x16" | "12x18" | "16x20" | "16x24" | "18x24"
  | "20x28" | "20x30" | "24x24" | "24x32" | "24x36";
export type FramedSizeKey = CanvasSizeKey;  // same 11 sizes as unframed
export type ApparelSizeKey = "XS" | "S" | "M" | "L" | "XL" | "2XL";
export type AnySizeKey = CanvasSizeKey | ApparelSizeKey | "default";

export interface VariantDef {
  variantId: number;
  priceMajor: number; // GBP retail
  sizeLabel: string;  // human label: "12×16″", "M", "11oz", "Standard"
}

export interface ProductDef {
  key: ProductTypeKey;
  label: string;        // "Framed Canvas"
  shortLabel: string;   // "Canvas"
  hasSize: boolean;
  /** Default size key for first selection (used when user lands without picking a size). */
  defaultSizeKey: AnySizeKey;
  /** Hero size — gets the "most popular" badge in size pickers. */
  heroSizeKey?: AnySizeKey;
  /** Map of size key → variant ID + price. Single-size products use { default: ... }. */
  variants: Partial<Record<AnySizeKey, VariantDef>>;
}

export const PRODUCTS: Record<ProductTypeKey, ProductDef> = {
  // Digital download — instant delivery via email + Supabase signed URL.
  // No physical, no shipping. Highest margin SKU (~97% net after fal.ai + email).
  // Created 2026-05-12. Shopify product id 16190069670237.
  "digital": {
    key: "digital",
    label: "Digital Download",
    shortLabel: "Digital",
    hasSize: false,
    defaultSizeKey: "default",
    variants: {
      default: { variantId: 64669378511197, priceMajor: 19, sizeLabel: "Digital download" },
    },
  },
  // Gift card — Shopify-native; auto-generates code + emails recipient on payment.
  // Multi-variant single product, 4 denominations. Variant IDs filled in by
  // scripts/shopify-launch/create_gift_card_product.py. The "default" entry here
  // is just to satisfy the ProductDef shape — checkout uses the real variant ID
  // from the cart item directly (per-denomination).
  "gift-card": {
    key: "gift-card",
    label: "Gift Card",
    shortLabel: "Gift card",
    hasSize: false,
    defaultSizeKey: "default",
    variants: {
      default: { variantId: 0, priceMajor: 19, sizeLabel: "Gift card" },
    },
  },
  // Entry physical product — unframed slim stretched canvas. "From £39 (frame +£X)".
  // Pricing locked 2026-05-12 against live Gelato wholesale audit
  // (~50% margin per size including UK ship + Stripe + 3% returns).
  "canvas": {
    key: "canvas",
    label: "Canvas",
    shortLabel: "Canvas",
    hasSize: true,
    defaultSizeKey: "16x20",
    heroSizeKey: "16x20",
    variants: {
      "8x10":  { variantId: 64669306454365, priceMajor: 39, sizeLabel: "8×10″" },
      "12x16": { variantId: 64669306487133, priceMajor: 49, sizeLabel: "12×16″" },
      "12x18": { variantId: 64669306519901, priceMajor: 55, sizeLabel: "12×18″" },
      "16x20": { variantId: 64669306552669, priceMajor: 65, sizeLabel: "16×20″" },
      "16x24": { variantId: 64669306585437, priceMajor: 75, sizeLabel: "16×24″" },
      "18x24": { variantId: 64669306618205, priceMajor: 79, sizeLabel: "18×24″" },
      "20x28": { variantId: 64669306650973, priceMajor: 89, sizeLabel: "20×28″" },
      "20x30": { variantId: 64669306683741, priceMajor: 95, sizeLabel: "20×30″" },
      "24x24": { variantId: 64669306716509, priceMajor: 95, sizeLabel: "24×24″" },
      "24x32": { variantId: 64669306749277, priceMajor: 109, sizeLabel: "24×32″" },
      "24x36": { variantId: 64669306782045, priceMajor: 119, sizeLabel: "24×36″" },
    },
  },
  // Frame upgrade — same canvas + slim wood frame. Total = unframed + frame upgrade.
  // Reprice 2026-05-12: tiered frame upgrade (≥25% margin on the frame cost).
  // Variant IDs are the existing v2 product (handle: cosmic-pet-portrait-framed-canvas-v2).
  // Re-mapped here to the 11 lead sizes; framedCanvas.ts holds the full 33-variant map.
  "framed-canvas": {
    key: "framed-canvas",
    label: "Framed Canvas",
    shortLabel: "Framed Canvas",
    hasSize: true,
    defaultSizeKey: "16x20",
    heroSizeKey: "16x20",
    // Default to the natural-wood variant per size — UI lets the customer pick a different frame color.
    variants: {
      "8x10":  { variantId: 64599875289437, priceMajor: 84,  sizeLabel: "8×10″" },
      "12x16": { variantId: 64599875387741, priceMajor: 114, sizeLabel: "12×16″" },
      "12x18": { variantId: 64599875486045, priceMajor: 120, sizeLabel: "12×18″" },
      "16x20": { variantId: 64599875584349, priceMajor: 130, sizeLabel: "16×20″" },
      "16x24": { variantId: 64599875682653, priceMajor: 155, sizeLabel: "16×24″" },
      "18x24": { variantId: 64599875780957, priceMajor: 159, sizeLabel: "18×24″" },
      "20x28": { variantId: 64599875879261, priceMajor: 174, sizeLabel: "20×28″" },
      "20x30": { variantId: 64599875977565, priceMajor: 180, sizeLabel: "20×30″" },
      "24x24": { variantId: 64599876075869, priceMajor: 180, sizeLabel: "24×24″" },
      "24x32": { variantId: 64599876174173, priceMajor: 209, sizeLabel: "24×32″" },
      "24x36": { variantId: 64599876272477, priceMajor: 229, sizeLabel: "24×36″" },
    },
  },
  mug: {
    key: "mug",
    label: "Ceramic Mug",
    shortLabel: "Mug",
    hasSize: false,
    defaultSizeKey: "default",
    variants: {
      default: { variantId: 64592196763997, priceMajor: 19, sizeLabel: "11oz" },
    },
  },
  tote: {
    key: "tote",
    label: "Tote Bag",
    shortLabel: "Tote",
    hasSize: false,
    defaultSizeKey: "default",
    variants: {
      default: { variantId: 64592196796765, priceMajor: 29, sizeLabel: "Standard" },
    },
  },
  tee: {
    key: "tee",
    label: "Unisex Tee",
    shortLabel: "Tee",
    hasSize: true,
    defaultSizeKey: "M",
    heroSizeKey: "M",
    variants: {
      XS:  { variantId: 64592196829533, priceMajor: 29, sizeLabel: "XS" },
      S:   { variantId: 64592196862301, priceMajor: 29, sizeLabel: "S" },
      M:   { variantId: 64592196895069, priceMajor: 29, sizeLabel: "M" },
      L:   { variantId: 64592196927837, priceMajor: 29, sizeLabel: "L" },
      XL:  { variantId: 64592196960605, priceMajor: 32, sizeLabel: "XL" },
      "2XL": { variantId: 64592196993373, priceMajor: 34, sizeLabel: "2XL" },
    },
  },
  hoodie: {
    key: "hoodie",
    label: "Unisex Hoodie",
    shortLabel: "Hoodie",
    hasSize: true,
    defaultSizeKey: "M",
    heroSizeKey: "M",
    variants: {
      XS:  { variantId: 64592197026141, priceMajor: 49, sizeLabel: "XS" },
      S:   { variantId: 64592197058909, priceMajor: 49, sizeLabel: "S" },
      M:   { variantId: 64592197091677, priceMajor: 49, sizeLabel: "M" },
      L:   { variantId: 64592197124445, priceMajor: 49, sizeLabel: "L" },
      XL:  { variantId: 64592197157213, priceMajor: 52, sizeLabel: "XL" },
      "2XL": { variantId: 64592197189981, priceMajor: 55, sizeLabel: "2XL" },
    },
  },
};

export const PRODUCT_KEYS = Object.keys(PRODUCTS) as ProductTypeKey[];

/** Resolve variant for a given product + size selection. */
export function resolveVariant(
  productType: ProductTypeKey,
  sizeKey: AnySizeKey,
): VariantDef | null {
  const product = PRODUCTS[productType];
  if (!product) return null;
  const v = product.variants[sizeKey] ?? product.variants[product.defaultSizeKey];
  return v ?? null;
}

/** Currency formatting (GBP only for now — USD presentment Phase 2). */
export function formatPrice(major: number): string {
  return `£${major}`;
}
