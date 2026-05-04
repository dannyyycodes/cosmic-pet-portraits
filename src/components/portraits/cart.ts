/**
 * Cart types + helpers for the /portraits flow.
 *
 * One cart item = one fully-configured portrait on one surface. The same
 * customer can configure multiple items (e.g. their dog as Wizard School on a
 * 12×16 framed canvas + the same dog as Galaxy Smuggler on a Mug) before
 * checking out — single Shopify draft order with N line items.
 *
 * Soul Edition is NOT a separate cart item. It's a flag on a framed-canvas
 * cart item that adds £40 + a separate Shopify line item at checkout time
 * (because Soul Edition has no Gelato SKU — fulfilled by us).
 */
import type { ProductTypeKey, AnySizeKey, VariantDef } from "./productLineup";
import { PRODUCTS } from "./productLineup";

export type StyleOption = "photographic" | "illustrated";
export type CartItemKind = "ai" | "template";

export interface CartItem {
  /** Local uuid — used for remove/update operations. */
  id: string;
  /** Tier 0 (template) vs Tier 1+ (AI gen). Defaults "ai" for backwards-compat. */
  kind: CartItemKind;
  // Product config:
  productType: ProductTypeKey;
  sizeKey: AnySizeKey;
  /** Framed canvas only — frame wood-tone (Black / Natural / Dark Brown). */
  frameColor?: "black" | "natural-wood" | "dark-wood";
  variantId: number;
  // Portrait config:
  packId: string;                  // ai: scene id ("wizard-school") | template: template id ("circle-mug")
  packName: string;
  style: StyleOption;              // ai only — templates default "photographic"
  sourcePhotoUrl: string;
  previewUrl: string;              // small thumb for cart drawer
  /** Template-only: 3000×3000 print master URL for Gelato fulfilment. */
  printMasterUrl?: string;
  // Add-on:
  soulEdition: boolean;            // canvas-only
  soulEditionPriceMajor?: number;  // 40 (GBP) when active
  // Display + persistence:
  productLabel: string;            // "Cosmic Pet Portrait — Framed Canvas"
  productShortLabel: string;       // "Canvas"
  sizeLabel: string;               // "12×16″" / "M" / "11oz" / "Standard"
  priceMajor: number;              // base variant price
}

/** Sum of base + soul-edition for a single item. */
export function itemTotalMajor(item: CartItem): number {
  return item.priceMajor + (item.soulEdition ? (item.soulEditionPriceMajor ?? 0) : 0);
}

/** Cart subtotal in major units (£). */
export function cartSubtotalMajor(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + itemTotalMajor(it), 0);
}

/** Item count (cart badge). */
export function cartCount(items: CartItem[]): number {
  return items.length;
}

/** Build a fresh CartItem from configurator state. Caller passes a uuid maker
 *  so this stays pure (no side-effects). */
export function buildCartItem(input: {
  productType: ProductTypeKey;
  sizeKey: AnySizeKey;
  packId: string;
  packName: string;
  style: StyleOption;
  sourcePhotoUrl: string;
  previewUrl: string;
  soulEdition: boolean;
  soulEditionPriceMajor: number; // pass even if soulEdition=false; gets ignored
  variant: VariantDef;
  id: string;
  /** Optional — defaults to "ai". */
  kind?: CartItemKind;
  /** Required when kind="template". */
  printMasterUrl?: string;
  /** Optional — framed canvas frame wood-tone. */
  frameColor?: "black" | "natural-wood" | "dark-wood";
}): CartItem {
  const product = PRODUCTS[input.productType];
  return {
    id: input.id,
    kind: input.kind ?? "ai",
    productType: input.productType,
    sizeKey: input.sizeKey,
    frameColor: input.frameColor,
    variantId: input.variant.variantId,
    packId: input.packId,
    packName: input.packName,
    style: input.style,
    sourcePhotoUrl: input.sourcePhotoUrl,
    previewUrl: input.previewUrl,
    printMasterUrl: input.printMasterUrl,
    soulEdition: input.productType === "framed-canvas" && input.soulEdition,
    soulEditionPriceMajor: input.soulEdition ? input.soulEditionPriceMajor : undefined,
    productLabel: `Cosmic Pet Portrait — ${product.label}`,
    productShortLabel: product.shortLabel,
    sizeLabel: input.variant.sizeLabel,
    priceMajor: input.variant.priceMajor,
  };
}

/** localStorage persistence so the cart survives accidental refreshes. */
const STORAGE_KEY = "ls.portraits.cart.v1";

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode — silent */
  }
}
