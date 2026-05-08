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
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO (codex hot-zone — left for follow-up after the design pass settles):
 * These items live in files currently being edited by codex; cannot touch
 * them in this branch. Pick up after merge.
 *
 *   1. Portraits.tsx — debounce `handleAddToCart` and `handleCheckoutAll`
 *      (search for those handler names; double-click protection so a
 *      jittery click doesn't add the same item twice or kick off two
 *      Stripe checkouts).
 *
 *   2. Portraits.tsx — debounce the mockup `useEffect` (the one that
 *      regenerates the previewUrl/mockup on size or frameColor change).
 *      Currently fires on every keystroke / slider tick — coalesce with a
 *      ~250ms debounce so we don't hammer the mockup endpoint.
 *
 *   3. StudioFlow.tsx — add a max-retries-per-session counter for the
 *      printMaster regeneration path. After N (suggest 3) failures in one
 *      session, surface a hard-fail toast + disable retry button instead
 *      of letting it loop forever and burn credits.
 * ─────────────────────────────────────────────────────────────────────────
 */
import type { ProductTypeKey, AnySizeKey, VariantDef } from "./productLineup";
import { PRODUCTS } from "./productLineup";
import { toast } from "sonner";

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
  /** Shopify line-item properties — underscore-prefixed keys are hidden from
   *  customer-facing displays. Used for pet-name pre-fill into the Soul
   *  Reading upsell + post-purchase customisation flows. */
  properties?: Record<string, string>;
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
  /** Optional — Shopify line-item properties (e.g. `_pet_name`). */
  properties?: Record<string, string>;
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
    properties: input.properties,
  };
}

/** localStorage persistence so the cart survives accidental refreshes.
 *
 * If localStorage is unavailable (Safari Private Mode, quota exceeded,
 * sandboxed iframe), we fall back to a module-level in-memory store so the
 * cart still works for the lifetime of the tab. A single one-shot toast
 * lets the user know their cart won't persist across sessions. */
const STORAGE_KEY = "ls.portraits.cart.v1";
const TOAST_FLAG_KEY = "ls.portraits.cart.fallback-toast.v1";

/** Module-level fallback when localStorage writes fail. Lives for the
 *  lifetime of the JS context (i.e. until tab/page reload). */
let memoryCart: CartItem[] | null = null;

function isQuotaError(e: unknown): boolean {
  if (typeof DOMException !== "undefined" && e instanceof DOMException) {
    // Code 22 = QUOTA_EXCEEDED_ERR (Chromium / Firefox)
    // Code 1014 = NS_ERROR_DOM_QUOTA_REACHED (legacy Firefox)
    return (
      e.code === 22 ||
      e.code === 1014 ||
      e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED"
    );
  }
  return false;
}

function notifyFallbackOnce(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(TOAST_FLAG_KEY)) return;
    window.sessionStorage.setItem(TOAST_FLAG_KEY, "1");
  } catch {
    // sessionStorage also blocked — best-effort; just don't spam the toast.
    return;
  }
  // Sacred-copy compliant: no "AI", no "report", no "we'll email you".
  toast("Saved in this tab only — clear browser space to keep across sessions");
}

/** Dedupe cart items by id (memory takes precedence; falls back to storage). */
function mergeCartSources(memory: CartItem[] | null, storage: CartItem[]): CartItem[] {
  if (!memory || memory.length === 0) return storage;
  const seen = new Set<string>();
  const out: CartItem[] = [];
  for (const it of memory) {
    if (it && typeof it.id === "string" && !seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  for (const it of storage) {
    if (it && typeof it.id === "string" && !seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  }
  return out;
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  let stored: CartItem[] = [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) stored = parsed as CartItem[];
    }
  } catch {
    // Read failed (private mode, corrupt JSON) — fall through with stored=[].
  }
  return mergeCartSources(memoryCart, stored);
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Successful write — clear any stale memory fallback so we don't
    // double-count items on next read.
    memoryCart = null;
  } catch (e) {
    // Quota exceeded or private-mode: keep cart alive in-memory for the tab.
    memoryCart = items.slice();
    if (isQuotaError(e)) {
      notifyFallbackOnce();
    } else {
      // Unknown error — still surface the same fallback notice so the user
      // knows their cart isn't persisted.
      notifyFallbackOnce();
    }
  }
}
