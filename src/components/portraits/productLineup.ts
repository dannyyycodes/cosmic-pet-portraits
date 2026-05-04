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
  | "framed-canvas"
  | "mug"
  | "tote"
  | "tee"
  | "hoodie";

export type FramedSizeKey = "8x10" | "12x16" | "16x20" | "20x30";
export type ApparelSizeKey = "XS" | "S" | "M" | "L" | "XL" | "2XL";
export type AnySizeKey = FramedSizeKey | ApparelSizeKey | "default";

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
  "framed-canvas": {
    key: "framed-canvas",
    label: "Framed Canvas",
    shortLabel: "Canvas",
    hasSize: true,
    defaultSizeKey: "12x16",
    heroSizeKey: "12x16",
    variants: {
      "8x10":  { variantId: 64592196600157, priceMajor: 69,  sizeLabel: "8×10″" },
      "12x16": { variantId: 64592196632925, priceMajor: 99,  sizeLabel: "12×16″" },
      "16x20": { variantId: 64592196665693, priceMajor: 149, sizeLabel: "16×20″" },
      "20x30": { variantId: 64592196698461, priceMajor: 199, sizeLabel: "20×30″" },
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
