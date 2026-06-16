/**
 * Stripe Checkout Session builder for the pawtraits cart.
 *
 * The reason this whole switch exists: Stripe lets us put the ACTUAL artwork
 * preview in each line item box via line_items[].price_data.product_data.images
 * — Shopify draft orders cannot. So the buyer sees their pet's portrait in the
 * Stripe checkout.
 *
 * Used by BOTH entry points:
 *   • api/stripe.ts            action=cart-checkout
 *   • api/cart/checkout.ts     when CHECKOUT_PROVIDER==="stripe"
 *
 * Validation MIRRORS api/cart/checkout.ts (the Shopify path) exactly — consent
 * gates, print-master presence, soul-reading pet inputs / intake_pending. We
 * NEVER trust a client amount: every unit price comes from getUnitAmount().
 *
 * Region pricing: postage is BAKED INTO PRICE per buyer zone (Danny LOCKED
 * 2026-06-16). Zone is resolved from the buyer's country (x-vercel-ip-country,
 * cf-ipcountry fallback) at session-create time. Free shipping is SHOWN.
 *
 * Gift cards are BLOCKED here — Stripe can't mint a redeemable code. Gift-card
 * carts are forced onto the Shopify path by the caller.
 */
import type Stripe from "stripe";
import { getStripe } from "./stripe.js";
import {
  getUnitAmount,
  resolveZone,
  toMinor,
  UnpricedRegionError,
  type Zone,
} from "./checkoutPricing.js";

// Stripe rejects the entire session.create if any metadata VALUE exceeds 500
// chars. Public Supabase getPublicUrl values are short, but library / fal.media
// source URLs and signed legacy print-master URLs can carry long query strings.
// The reconstruction side prefers print_master_path + preview_url short forms,
// so truncating a long *_url metadata value is safe — it is informational only.
const STRIPE_METADATA_MAX = 480;
function clampMeta(value: string): string {
  return value.length > STRIPE_METADATA_MAX ? value.slice(0, STRIPE_METADATA_MAX) : value;
}

// ─── Locked variant map (mirrors api/cart/checkout.ts / productLineup.ts) ──
type ProductTypeKey =
  | "digital" | "canvas" | "framed-canvas" | "gift-card" | "mug" | "tote" | "tee" | "hoodie";

const GIFT_CARD_VARIANT_IDS = new Set<number>([
  64670403428701, 64670403461469, 64670403494237, 64670403527005,
]);

const SOUL_READING_VARIANT_ID = 64601427640669;
const SOUL_READING_PRODUCT_TYPE = "soul-reading";
const SOUL_READING_TITLE = "Soul Reading — Personalised Pet Astrology";

interface VariantDef {
  variantId: number;
  priceMajor: number;
  sizeLabel: string;
}

const PRODUCT_VARIANTS: Record<ProductTypeKey, Record<string, VariantDef>> = {
  "digital": {
    default: { variantId: 64669378511197, priceMajor: 19, sizeLabel: "Digital download" },
  },
  "gift-card": {
    default: { variantId: 0, priceMajor: 0, sizeLabel: "Gift card" },
  },
  "canvas": {
    "8x10":  { variantId: 64669306454365, priceMajor: 39,  sizeLabel: "8×10″" },
    "12x16": { variantId: 64669306487133, priceMajor: 49,  sizeLabel: "12×16″" },
    "12x18": { variantId: 64669306519901, priceMajor: 55,  sizeLabel: "12×18″" },
    "16x20": { variantId: 64669306552669, priceMajor: 65,  sizeLabel: "16×20″" },
    "16x24": { variantId: 64669306585437, priceMajor: 75,  sizeLabel: "16×24″" },
    "18x24": { variantId: 64669306618205, priceMajor: 79,  sizeLabel: "18×24″" },
    "20x28": { variantId: 64669306650973, priceMajor: 89,  sizeLabel: "20×28″" },
    "20x30": { variantId: 64669306683741, priceMajor: 95,  sizeLabel: "20×30″" },
    "24x24": { variantId: 64669306716509, priceMajor: 95,  sizeLabel: "24×24″" },
    "24x32": { variantId: 64669306749277, priceMajor: 109, sizeLabel: "24×32″" },
    "24x36": { variantId: 64669306782045, priceMajor: 119, sizeLabel: "24×36″" },
  },
  "framed-canvas": {
    "8x10__black":         { variantId: 64599875256669, priceMajor: 84,  sizeLabel: "8×10″ Black" },
    "8x10__natural-wood":  { variantId: 64599875289437, priceMajor: 84,  sizeLabel: "8×10″ Natural" },
    "8x10__dark-wood":     { variantId: 64599875322205, priceMajor: 84,  sizeLabel: "8×10″ Dark Brown" },
    "12x16__black":        { variantId: 64599875354973, priceMajor: 114, sizeLabel: "12×16″ Black" },
    "12x16__natural-wood": { variantId: 64599875387741, priceMajor: 114, sizeLabel: "12×16″ Natural" },
    "12x16__dark-wood":    { variantId: 64599875420509, priceMajor: 114, sizeLabel: "12×16″ Dark Brown" },
    "12x18__black":        { variantId: 64599875453277, priceMajor: 120, sizeLabel: "12×18″ Black" },
    "12x18__natural-wood": { variantId: 64599875486045, priceMajor: 120, sizeLabel: "12×18″ Natural" },
    "12x18__dark-wood":    { variantId: 64599875518813, priceMajor: 120, sizeLabel: "12×18″ Dark Brown" },
    "16x20__black":        { variantId: 64599875551581, priceMajor: 130, sizeLabel: "16×20″ Black" },
    "16x20__natural-wood": { variantId: 64599875584349, priceMajor: 130, sizeLabel: "16×20″ Natural" },
    "16x20__dark-wood":    { variantId: 64599875617117, priceMajor: 130, sizeLabel: "16×20″ Dark Brown" },
    "16x24__black":        { variantId: 64599875649885, priceMajor: 155, sizeLabel: "16×24″ Black" },
    "16x24__natural-wood": { variantId: 64599875682653, priceMajor: 155, sizeLabel: "16×24″ Natural" },
    "16x24__dark-wood":    { variantId: 64599875715421, priceMajor: 155, sizeLabel: "16×24″ Dark Brown" },
    "18x24__black":        { variantId: 64599875748189, priceMajor: 159, sizeLabel: "18×24″ Black" },
    "18x24__natural-wood": { variantId: 64599875780957, priceMajor: 159, sizeLabel: "18×24″ Natural" },
    "18x24__dark-wood":    { variantId: 64599875813725, priceMajor: 159, sizeLabel: "18×24″ Dark Brown" },
    "20x28__black":        { variantId: 64599875846493, priceMajor: 174, sizeLabel: "20×28″ Black" },
    "20x28__natural-wood": { variantId: 64599875879261, priceMajor: 174, sizeLabel: "20×28″ Natural" },
    "20x28__dark-wood":    { variantId: 64599875912029, priceMajor: 174, sizeLabel: "20×28″ Dark Brown" },
    "20x30__black":        { variantId: 64599875944797, priceMajor: 180, sizeLabel: "20×30″ Black" },
    "20x30__natural-wood": { variantId: 64599875977565, priceMajor: 180, sizeLabel: "20×30″ Natural" },
    "20x30__dark-wood":    { variantId: 64599876010333, priceMajor: 180, sizeLabel: "20×30″ Dark Brown" },
    "24x24__black":        { variantId: 64599876043101, priceMajor: 180, sizeLabel: "24×24″ Black" },
    "24x24__natural-wood": { variantId: 64599876075869, priceMajor: 180, sizeLabel: "24×24″ Natural" },
    "24x24__dark-wood":    { variantId: 64599876108637, priceMajor: 180, sizeLabel: "24×24″ Dark Brown" },
    "24x32__black":        { variantId: 64599876141405, priceMajor: 209, sizeLabel: "24×32″ Black" },
    "24x32__natural-wood": { variantId: 64599876174173, priceMajor: 209, sizeLabel: "24×32″ Natural" },
    "24x32__dark-wood":    { variantId: 64599876206941, priceMajor: 209, sizeLabel: "24×32″ Dark Brown" },
    "24x36__black":        { variantId: 64599876239709, priceMajor: 229, sizeLabel: "24×36″ Black" },
    "24x36__natural-wood": { variantId: 64599876272477, priceMajor: 229, sizeLabel: "24×36″ Natural" },
    "24x36__dark-wood":    { variantId: 64599876305245, priceMajor: 229, sizeLabel: "24×36″ Dark Brown" },
    "8x10":  { variantId: 64592196600157, priceMajor: 39, sizeLabel: "8×10″" },
    "12x16": { variantId: 64592196632925, priceMajor: 49, sizeLabel: "12×16″" },
    "16x20": { variantId: 64592196665693, priceMajor: 65, sizeLabel: "16×20″" },
    "20x30": { variantId: 64592196698461, priceMajor: 99, sizeLabel: "20×30″" },
  },
  mug:    { default: { variantId: 64592196763997, priceMajor: 19, sizeLabel: "11oz" } },
  tote:   { default: { variantId: 64592196796765, priceMajor: 29, sizeLabel: "Standard" } },
  tee: {
    XS: { variantId: 64592196829533, priceMajor: 29, sizeLabel: "XS" },
    S:  { variantId: 64592196862301, priceMajor: 29, sizeLabel: "S" },
    M:  { variantId: 64592196895069, priceMajor: 29, sizeLabel: "M" },
    L:  { variantId: 64592196927837, priceMajor: 29, sizeLabel: "L" },
    XL: { variantId: 64592196960605, priceMajor: 32, sizeLabel: "XL" },
    "2XL": { variantId: 64592196993373, priceMajor: 34, sizeLabel: "2XL" },
  },
  hoodie: {
    XS: { variantId: 64592197026141, priceMajor: 49, sizeLabel: "XS" },
    S:  { variantId: 64592197058909, priceMajor: 49, sizeLabel: "S" },
    M:  { variantId: 64592197091677, priceMajor: 49, sizeLabel: "M" },
    L:  { variantId: 64592197124445, priceMajor: 49, sizeLabel: "L" },
    XL: { variantId: 64592197157213, priceMajor: 52, sizeLabel: "XL" },
    "2XL": { variantId: 64592197189981, priceMajor: 55, sizeLabel: "2XL" },
  },
};

const PRODUCT_LABELS: Record<ProductTypeKey, string> = {
  "digital":       "Cosmic Pet Portrait — Digital Download",
  "canvas":        "Cosmic Pet Portrait — Canvas",
  "framed-canvas": "Cosmic Pet Portrait — Framed Canvas",
  "gift-card":     "Cosmic Pet Portrait — Gift Card",
  mug:             "Cosmic Pet Portrait — Ceramic Mug",
  tote:            "Cosmic Pet Portrait — Tote Bag",
  tee:             "Cosmic Pet Portrait — Unisex Tee",
  hoodie:          "Cosmic Pet Portrait — Unisex Hoodie",
};

// Indexed-access type aliases. The stripe@22 esm re-export only surfaces the
// top-level SessionCreateParams type (not its sub-namespaces), so we derive the
// LineItem + AllowedCountry types from the param shape itself.
type SessionCreateParams = Stripe.Checkout.SessionCreateParams;
type AllowedCountry =
  NonNullable<SessionCreateParams["shipping_address_collection"]>["allowed_countries"][number];

// Worldwide allowed-countries. Stripe needs an enumerated ISO list (no "all"
// token). This is the full set Stripe accepts for shipping_address_collection.
// ⚠ OPEN ITEM: trim to the exact set we will actually fulfil before launch.
const WORLDWIDE: AllowedCountry[] = [
  "GB", "US", "CA", "AU", "NZ", "IE", "DE", "FR", "NL", "BE", "LU", "AT", "IT",
  "ES", "PT", "DK", "SE", "FI", "NO", "PL", "CZ", "SK", "SI", "HR", "HU", "RO",
  "BG", "GR", "EE", "LV", "LT", "CY", "MT", "CH", "IS", "JP", "SG", "HK", "KR",
  "AE", "IL", "MX", "BR", "ZA", "IN",
];

// ─── Body shapes (mirror api/cart/checkout.ts CartItemBody/CheckoutBody) ──
export interface CartItemBody {
  kind?: "ai" | "template";
  productType: ProductTypeKey | "soul-reading";
  sizeKey: string;
  frameColor?: "black" | "natural-wood" | "dark-wood";
  packId: string;
  packName: string;
  style?: "photographic" | "illustrated";
  sourcePhotoUrl: string;
  previewUrl: string;
  printMasterUrl?: string;
  printMasterPath?: string;
  soulEdition?: boolean;
  variantId?: number;
  properties?: Record<string, string>;
}

export interface ConsentBody {
  canvasPersonalisedAt?: string | null;
  readingImmediateAt?: string | null;
}

export interface BuildStripeCartSessionInput {
  items: CartItemBody[];
  // GBP-only. The locked price table is GBP and there is no USD price data, so
  // a `currency` input would be accepted-then-ignored (charged GBP amounts under
  // a USD label). Removed to keep the contract honest. Re-add WITH per-currency
  // price tables if true multi-currency is ever needed.
  consent?: ConsentBody;
  /** Buyer country (ISO-2) from x-vercel-ip-country / cf-ipcountry. Defaults GB. */
  country?: string | null;
  /** Request origin for success/cancel URLs (e.g. https://www.littlesouls.app). */
  origin: string;
  /** Opaque cart reference for client_reference_id + session metadata. */
  cartId: string;
}

/** Thrown for any validation failure → caller maps to HTTP 400 with .message. */
export class CheckoutValidationError extends Error {
  status = 400 as const;
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

/** True if a cart contains any gift-card line — those NEVER go through Stripe. */
export function cartHasGiftCard(items: CartItemBody[] | undefined): boolean {
  if (!Array.isArray(items)) return false;
  return items.some(
    (it) =>
      it?.productType === "gift-card" ||
      (typeof it?.variantId === "number" && GIFT_CARD_VARIANT_IDS.has(it.variantId)),
  );
}

function isPresentConsentTimestamp(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

type LineItem = NonNullable<SessionCreateParams["line_items"]>[number];

/**
 * Validate the cart (mirrors the Shopify path) and build a Stripe Checkout
 * Session. Returns the hosted-checkout URL. Throws CheckoutValidationError on
 * a 400-class problem; other errors bubble (caller 500s).
 */
export async function buildStripeCartSession(
  input: BuildStripeCartSessionInput,
): Promise<{ url: string }> {
  const { items, consent, origin, cartId } = input;
  const zone: Zone = resolveZone(input.country);

  // Server-locked price, GBP minor units. Maps the pricing module's
  // UnpricedRegionError (size has no live cost data in a high-ship zone) to a
  // 400-class CheckoutValidationError so callers handle it uniformly.
  const lockedMinor = (
    productType: Parameters<typeof getUnitAmount>[0],
    sizeKey: string,
    frameColor: string | null | undefined,
    base: number,
  ): number => {
    try {
      return toMinor(getUnitAmount(productType, sizeKey, frameColor, zone, base));
    } catch (e) {
      if (e instanceof UnpricedRegionError) {
        throw new CheckoutValidationError(e.message);
      }
      throw e;
    }
  };

  if (!Array.isArray(items) || items.length === 0) {
    throw new CheckoutValidationError("items[] required (at least 1)");
  }
  if (items.length > 20) {
    throw new CheckoutValidationError("max 20 items per order");
  }
  if (cartHasGiftCard(items)) {
    // Defensive — the caller should have routed gift carts to Shopify.
    throw new CheckoutValidationError("gift-card carts are not supported on the Stripe path");
  }

  // ── Consent gates (same as Shopify path) — 400 BEFORE any session create ──
  let requiresCanvasConsent = false;
  let requiresReadingConsent = false;
  for (const it of items) {
    if (it.productType === "canvas" || it.productType === "framed-canvas") {
      requiresCanvasConsent = true;
    }
    if (
      it.productType === SOUL_READING_PRODUCT_TYPE ||
      (typeof it.variantId === "number" && it.variantId === SOUL_READING_VARIANT_ID)
    ) {
      requiresReadingConsent = true;
    }
  }
  if (requiresCanvasConsent && !isPresentConsentTimestamp(consent?.canvasPersonalisedAt)) {
    throw new CheckoutValidationError(
      "consent.canvasPersonalisedAt required for personalised canvas items",
    );
  }
  if (requiresReadingConsent && !isPresentConsentTimestamp(consent?.readingImmediateAt)) {
    throw new CheckoutValidationError(
      "consent.readingImmediateAt required for immediate Soul Reading delivery",
    );
  }

  const lineItems: LineItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    // ── Soul Reading line ────────────────────────────────────────────────
    if (
      it.productType === SOUL_READING_PRODUCT_TYPE ||
      (typeof it.variantId === "number" && it.variantId === SOUL_READING_VARIANT_ID)
    ) {
      const props = it.properties ?? {};
      const petName = (props._pet_name ?? "").toString().trim();
      const petDob = (props._pet_dob ?? "").toString().trim();
      const petLoc = (props._pet_birth_location ?? "").toString().trim();
      const intakePending = (props._intake_pending ?? "").toString().trim() === "true";
      if (!intakePending) {
        if (!petName) throw new CheckoutValidationError(`items[${i}]: _pet_name required for Soul Reading`);
        if (!petDob) throw new CheckoutValidationError(`items[${i}]: _pet_dob required for Soul Reading`);
        if (!petLoc) throw new CheckoutValidationError(`items[${i}]: _pet_birth_location required for Soul Reading`);
      }
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: lockedMinor("soul-reading", "", null, 40),
          tax_behavior: "inclusive",
          product_data: {
            name: SOUL_READING_TITLE,
            description: petName || "(intake pending)",
            metadata: {
              line_kind: "soul-reading",
              product_type: "soul-reading",
              pet_name: petName,
              pet_dob: petDob,
              pet_birth_location: petLoc,
              canvas_order_ref: (props._canvas_order_ref ?? "").toString(),
              intake_pending: intakePending ? "true" : "",
              ls_line_index: String(i),
            },
          },
        },
      });
      continue;
    }

    // ── Per-item validation (mirrors Shopify path) ────────────────────────
    if (!it.productType || !PRODUCT_VARIANTS[it.productType as ProductTypeKey]) {
      throw new CheckoutValidationError(`items[${i}].productType invalid`);
    }
    if (!it.packId || typeof it.packId !== "string") {
      throw new CheckoutValidationError(`items[${i}].packId required`);
    }
    if (!it.packName || typeof it.packName !== "string") {
      throw new CheckoutValidationError(`items[${i}].packName required`);
    }
    if (!it.previewUrl || typeof it.previewUrl !== "string") {
      throw new CheckoutValidationError(`items[${i}].previewUrl required`);
    }
    // product_data.images requires a PUBLIC https URL. A relative / data: /
    // http: previewUrl would make Stripe reject the whole session create →
    // customer can't pay. Guard the scheme before it reaches images[].
    if (!/^https:\/\//i.test(it.previewUrl)) {
      throw new CheckoutValidationError(
        `items[${i}].previewUrl must be a public https URL (got non-https)`,
      );
    }
    if (!it.sourcePhotoUrl || typeof it.sourcePhotoUrl !== "string") {
      throw new CheckoutValidationError(`items[${i}].sourcePhotoUrl required`);
    }

    const productKey = it.productType as ProductTypeKey;
    const baseSizeKey = it.sizeKey ?? "default";
    const lookupKey =
      productKey === "framed-canvas" && it.frameColor
        ? `${baseSizeKey}__${it.frameColor}`
        : baseSizeKey;
    if (productKey === "canvas" && it.frameColor) {
      console.warn(`[stripe-cart] dropping frameColor='${it.frameColor}' on unframed canvas item (stale cart)`);
    }
    const variant =
      PRODUCT_VARIANTS[productKey][lookupKey] ?? PRODUCT_VARIANTS[productKey][baseSizeKey];
    if (!variant) {
      const validSizes = Object.keys(PRODUCT_VARIANTS[productKey]).join(", ");
      throw new CheckoutValidationError(
        `items[${i}]: unknown size '${lookupKey}' for product '${productKey}'. Valid: ${validSizes}`,
      );
    }

    const styleLabel = it.style === "illustrated" ? "Illustrated" : "Photographic";
    const hasPrintMaster = !!(it.printMasterPath || it.printMasterUrl);
    if ((productKey === "canvas" || productKey === "framed-canvas") && !hasPrintMaster) {
      throw new CheckoutValidationError(
        `items[${i}]: ${productKey} missing print master. Cannot create order without print-ready artwork. Re-run print-master prep in cart.`,
      );
    }
    if (productKey === "digital" && !hasPrintMaster) {
      throw new CheckoutValidationError(
        `items[${i}]: digital download missing print master. The print master is the product — cannot create order without it. Re-run print-master prep in cart.`,
      );
    }

    const petName = (it.properties?._pet_name ?? "").toString().trim();

    if (productKey === "digital") {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: lockedMinor("digital", "digital", null, variant.priceMajor),
          tax_behavior: "inclusive",
          product_data: {
            name: PRODUCT_LABELS["digital"],
            description: `${variant.sizeLabel} · ${it.packName}`,
            images: [it.previewUrl],
            metadata: {
              line_kind: "digital",
              product_type: "digital",
              size_key: "digital",
              frame_color: "",
              sku: "digital",
              pet_name: petName,
              preview_url: clampMeta(it.previewUrl),
              source_photo_url: clampMeta(it.sourcePhotoUrl),
              print_master_path: clampMeta(it.printMasterPath ?? ""),
              print_master_url_legacy: clampMeta(it.printMasterUrl ?? ""),
              pack_id: it.packId,
              pack_name: it.packName,
              style: styleLabel,
              kind: it.kind ?? "ai",
              ls_line_index: String(i),
            },
          },
        },
      });
      continue;
    }

    // ── Canvas / framed-canvas (artwork shows in the line box) ─────────────
    const pawProductType = productKey === "framed-canvas" ? "framed-canvas" : "canvas";
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: lockedMinor(pawProductType, it.sizeKey, it.frameColor, variant.priceMajor),
        tax_behavior: "inclusive",
        product_data: {
          name: PRODUCT_LABELS[productKey],
          description: `${variant.sizeLabel} · ${it.packName}`,
          images: [it.previewUrl],
          metadata: {
            line_kind: "canvas",
            product_type: productKey,
            size_key: it.sizeKey,
            frame_color: it.frameColor ?? "",
            sku: String(variant.variantId),
            pet_name: petName,
            preview_url: clampMeta(it.previewUrl),
            source_photo_url: clampMeta(it.sourcePhotoUrl),
            print_master_path: clampMeta(it.printMasterPath ?? ""),
            print_master_url_legacy: clampMeta(it.printMasterUrl ?? ""),
            pack_id: it.packId,
            pack_name: it.packName,
            style: styleLabel,
            kind: it.kind ?? "ai",
            ls_line_index: String(i),
          },
        },
      },
    });

    // ── Soul Edition add-on — only on framed-canvas (price LOCKED, client ignored)
    if (productKey === "framed-canvas" && it.soulEdition) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: lockedMinor("soul-edition", "", null, 40),
          tax_behavior: "inclusive",
          product_data: {
            name: `Soul Edition — natal chart reading + bound book — for ${it.packName} portrait`,
            metadata: {
              line_kind: "soul-edition",
              product_type: "soul-edition",
              linked_pack: it.packName,
              linked_size: variant.sizeLabel,
              linked_source_photo: clampMeta(it.sourcePhotoUrl),
              ls_line_index: String(i),
            },
          },
        },
      });
    }
  }

  // ── Session-level metadata ───────────────────────────────────────────────
  const sessionMetadata: Record<string, string> = {
    product_line: "portrait", // makes detectCanvasSku fast-path true
    checkout_provider: "stripe",
    cart_id: cartId,
    region_zone: zone,
    ip_country: (input.country ?? "").toUpperCase(),
    cart_item_count: String(items.length),
    ...(isPresentConsentTimestamp(consent?.canvasPersonalisedAt)
      ? { consent_canvas_personalised_at: consent!.canvasPersonalisedAt! }
      : {}),
    ...(isPresentConsentTimestamp(consent?.readingImmediateAt)
      ? { consent_reading_immediate_at: consent!.readingImmediateAt! }
      : {}),
  };

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: WORLDWIDE },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "gbp" },
          display_name: "Free shipping",
        },
      },
    ],
    // automatic_payment_methods default → Apple/Google Pay automatic.
    // automatic_tax intentionally OFF (seller not VAT-registered, inclusive).
    client_reference_id: cartId.slice(0, 200),
    metadata: sessionMetadata,
    success_url: `${origin}/pawtraits/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pawtraits?checkout=cancelled#topup`,
  });

  if (!session.url) {
    throw new Error("Stripe session created without a url");
  }
  return { url: session.url };
}
