/**
 * Soul Reading add-on — shared constants + cart helpers.
 *
 * The Soul Reading is a digital product (`Service` in Shopify), variant
 * `64601427640669`, £40 GBP, fulfilled via the n8n → Droplet 1 worker
 * pipeline after `orders/paid`. It is added to the existing CartItem
 * shape as a special line so it survives the cart-drawer → checkout API
 * trip without forking CartItem into two types.
 *
 * Identification: a CartItem is a Soul Reading when its `productType`
 * sentinel matches `SOUL_READING_PRODUCT_TYPE`. The existing
 * canvas/mug/tote/tee/hoodie machinery ignores it; api/cart/checkout.ts
 * branches on it explicitly.
 *
 * Spec sources:
 *   - vault/01-projects/little-souls/pet-portraits/research-2026-05-04-soul-reading-fulfilment.md §3
 *   - scripts/shopify-launch/soul_reading_product.json (live product)
 *   - vault/01-projects/little-souls/pet-portraits/research-2026-05-04-cart-upsell-ux.md §3
 */
import type { CartItem } from "./cart";

export const SOUL_READING_PRODUCT_ID = 16176281190749 as const;
export const SOUL_READING_PRODUCT_GID = "gid://shopify/Product/16176281190749" as const;
export const SOUL_READING_VARIANT_ID = 64601427640669 as const;
export const SOUL_READING_VARIANT_GID = "gid://shopify/ProductVariant/64601427640669" as const;
export const SOUL_READING_PRICE_MAJOR = 40 as const;
export const SOUL_READING_TITLE = "Soul Reading — Personalised Pet Astrology" as const;
export const SOUL_READING_HANDLE = "soul-reading-personalised-pet-astrology" as const;

/** Sentinel productType — kept distinct from physical SKUs so existing
 *  product/variant lookup tables stay untouched. */
export const SOUL_READING_PRODUCT_TYPE = "soul-reading" as const;

/** Type guard — true when this CartItem is a Soul Reading line. */
export function isSoulReadingItem(item: CartItem): boolean {
  return (
    (item.productType as string) === SOUL_READING_PRODUCT_TYPE ||
    item.variantId === SOUL_READING_VARIANT_ID
  );
}

export interface SoulReadingFormValues {
  petName: string;
  petDob: string;            // ISO YYYY-MM-DD from `<input type="date">`
  petBirthLocation: string;
  /** UUID linking back to one of the canvas line items in the same cart,
   *  or a fresh UUID if no canvas exists at the moment of add. */
  canvasOrderRef: string;
}

/** Build a "Quick add" CartItem — Soul Reading purchase without intake.
 *  Customer gets a magic-link email after payment to fill in pet details at
 *  /reading/intake/<token>. Variant + price are the same as the full-intake
 *  version. The webhook detects empty intake fields, inserts the job with
 *  status='intake_pending' and fires the intake-request email. */
export function buildSoulReadingCartItemQuickAdd(canvasOrderRef: string): CartItem {
  return buildSoulReadingCartItem({
    petName: "",
    petDob: "",
    petBirthLocation: "",
    canvasOrderRef,
  }, /* intakePending */ true);
}

/** Build a CartItem for the Soul Reading line. We piggyback on the
 *  existing CartItem shape so the cart drawer + cart helpers don't need
 *  to know about a second item type. The order-paid webhook + checkout
 *  API read these properties out of the line.
 *
 *  When `intakePending` is true (Quick-add path) pet inputs are empty and
 *  `_intake_pending` is set so checkout.ts skips validation and the webhook
 *  sends the intake-request email instead of the reading-ready email. */
export function buildSoulReadingCartItem(values: SoulReadingFormValues, intakePending = false): CartItem {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // We attach the captured pet inputs as `properties` on the cart item.
  // The CartItem interface doesn't strictly type this, but extending it
  // upstream would force every other line through schema migration; the
  // checkout API + future order-paid webhook both already read property
  // bags off line items, so this is the sanctioned shape.
  const item: CartItem & { properties: Record<string, string> } = {
    id,
    kind: "ai",
    productType: SOUL_READING_PRODUCT_TYPE as unknown as CartItem["productType"],
    sizeKey: "default" as unknown as CartItem["sizeKey"],
    frameColor: undefined,
    variantId: SOUL_READING_VARIANT_ID,
    packId: "soul-reading",
    packName: SOUL_READING_TITLE,
    style: "photographic",
    sourcePhotoUrl: "",
    previewUrl: "/portraits/soul-reading-thumb.svg",
    printMasterUrl: undefined,
    soulEdition: false,
    soulEditionPriceMajor: undefined,
    productLabel: SOUL_READING_TITLE,
    productShortLabel: "Soul Reading",
    sizeLabel: "Digital",
    priceMajor: SOUL_READING_PRICE_MAJOR,
    properties: {
      _pet_name: values.petName,
      _pet_dob: values.petDob,
      _pet_birth_location: values.petBirthLocation,
      _canvas_order_ref: values.canvasOrderRef,
      _line_kind: "soul-reading",
      ...(intakePending ? { _intake_pending: "true" } : {}),
    },
  };

  return item;
}
