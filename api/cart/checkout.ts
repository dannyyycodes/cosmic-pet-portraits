/**
 * POST /api/cart/checkout
 *
 * Creates a single Shopify draft order containing all configured cart items
 * and returns the Shopify-hosted invoice URL. Frontend redirects there for
 * payment.
 *
 * Architecture (live as of 2026-05-03):
 *   • Each portrait line item is variant-keyed (real Shopify variant ID) so
 *     the Gelato Shopify app reads `gelato.product_uid` metafield and routes
 *     fulfillment to the right print partner automatically.
 *   • Soul Edition add-ons (only on framed-canvas items) become extra
 *     custom-priced line items linked to their parent via property tag.
 *   • Portrait config (character pack, style, source photo, preview URL)
 *     attaches as line-item properties so it survives into the order.
 *
 * Variant ID map MIRRORS src/components/portraits/productLineup.ts.
 * Keep both in sync if SKUs ever change (re-run scripts/shopify-launch).
 *
 * Body:
 *   {
 *     currency: "GBP" | "USD",
 *     items: CartItem[]
 *   }
 *
 * Returns: { invoiceUrl, draftOrderId, name }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createDraftOrder, shopifyConfigured, type DraftOrderLineItem } from "../_lib/shopifyAdmin.js";

// ─── Locked variant map (mirrors productLineup.ts) ─────────────────────
type ProductTypeKey = "digital" | "canvas" | "framed-canvas" | "gift-card" | "mug" | "tote" | "tee" | "hoodie";

// Gift card variant IDs (mirrors GIFT_CARD_VARIANTS in gelatoFramedCanvas.ts).
// Created live 2026-05-12 — Shopify product id 16190208770397.
const GIFT_CARD_VARIANT_IDS = new Set<number>([
  64670403428701, // £19 — covers 1 digital download
  64670403461469, // £39 — covers 8x10 unframed canvas
  64670403494237, // £79 — covers 18x24 unframed canvas
  64670403527005, // £129 — covers framed canvas
]);

// ─── Soul Reading constants (mirrors src/components/portraits/soulReading.ts) ──
const SOUL_READING_VARIANT_ID = 64601427640669;
const SOUL_READING_PRODUCT_TYPE = "soul-reading";
const SOUL_EDITION_PRICE_GBP = 40;
// Gift-card post-purchase upsell promo. The client may signal it wants the
// upsell discount, but the percentage is SERVER-controlled and clamped to
// this ceiling — a client can never choose its own (the C1 exploit was an
// arbitrary/100% client value). Mirrors PostPurchaseGiftUpsell DISCOUNT_PCT.
const GIFT_UPSELL_MAX_DISCOUNT_PCT = 20;
const CANONICAL_RETURN_ORIGIN = "https://www.littlesouls.app";
const ALLOWED_RETURN_ORIGINS = new Set([
  CANONICAL_RETURN_ORIGIN,
  "https://littlesouls.app",
]);
const SOUL_READING_TITLE = "Soul Reading — Personalised Pet Astrology";

interface VariantDef {
  variantId: number;
  priceMajor: number;
  sizeLabel: string;
}

const PRODUCT_VARIANTS: Record<ProductTypeKey, Record<string, VariantDef>> = {
  // ── Digital download (handle: cosmic-pet-portrait-digital) — 1 SKU ──
  // Instant email + signed URL delivery. No physical, no shipping. Created 2026-05-12.
  // ~97% margin (£0.10 fal.ai + Resend + Supabase ≈ £0.50 total cost on £19 retail).
  "digital": {
    default: { variantId: 64669378511197, priceMajor: 19, sizeLabel: "Digital download" },
  },
  // ── Gift card (handle: cosmic-pet-portrait-gift-card) — N denominations ──
  // Variants resolved by EXACT variantId from the cart item (each denom = its own variant).
  // Stub map below keeps the typescript shape consistent — real validation
  // happens in the gift-card branch below which doesn't dispatch via PRODUCT_VARIANTS.
  "gift-card": {
    default: { variantId: 0, priceMajor: 0, sizeLabel: "Gift card" },
  },
  // ── Unframed canvas (handle: cosmic-pet-portrait-canvas) — 11 SKUs ──
  // Entry physical product. One variant per size, no frame option. Created 2026-05-12.
  // Pricing locked against live Gelato wholesale (~50% margin including ship).
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
  // ── Framed canvas v2 (handle: cosmic-pet-portrait-framed-canvas-v2) — 33 SKUs ──
  // 11 sizes × 3 frame colors. Composite key: `${size}__${color}`. Frame upgrade
  // tiered per size to keep ≥25% margin on the frame addition (price = unframed
  // + frame upgrade). Repriced 2026-05-12 from launch loss-leader prices.
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
    // ── Legacy 4 variants on the old framed product (handle: cosmic-pet-portrait-framed-canvas) ──
    // Kept so any in-flight cart from before the v2 migration still resolves.
    // Prices NOT updated — these were never officially relaunched after the
    // 2026-05-04 v2 cutover; included only for old cart resolution.
    "8x10":  { variantId: 64592196600157, priceMajor: 39, sizeLabel: "8×10″" },
    "12x16": { variantId: 64592196632925, priceMajor: 49, sizeLabel: "12×16″" },
    "16x20": { variantId: 64592196665693, priceMajor: 65, sizeLabel: "16×20″" },
    "20x30": { variantId: 64592196698461, priceMajor: 99, sizeLabel: "20×30″" },
  },
  mug: {
    default: { variantId: 64592196763997, priceMajor: 19, sizeLabel: "11oz" },
  },
  tote: {
    default: { variantId: 64592196796765, priceMajor: 29, sizeLabel: "Standard" },
  },
  tee: {
    XS:    { variantId: 64592196829533, priceMajor: 29, sizeLabel: "XS" },
    S:     { variantId: 64592196862301, priceMajor: 29, sizeLabel: "S" },
    M:     { variantId: 64592196895069, priceMajor: 29, sizeLabel: "M" },
    L:     { variantId: 64592196927837, priceMajor: 29, sizeLabel: "L" },
    XL:    { variantId: 64592196960605, priceMajor: 32, sizeLabel: "XL" },
    "2XL": { variantId: 64592196993373, priceMajor: 34, sizeLabel: "2XL" },
  },
  hoodie: {
    XS:    { variantId: 64592197026141, priceMajor: 49, sizeLabel: "XS" },
    S:     { variantId: 64592197058909, priceMajor: 49, sizeLabel: "S" },
    M:     { variantId: 64592197091677, priceMajor: 49, sizeLabel: "M" },
    L:     { variantId: 64592197124445, priceMajor: 49, sizeLabel: "L" },
    XL:    { variantId: 64592197157213, priceMajor: 52, sizeLabel: "XL" },
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

interface CartItemBody {
  /** Tier 0 (template) vs Tier 1+ (AI gen). Defaults "ai". */
  kind?: "ai" | "template";
  productType: ProductTypeKey | "soul-reading";
  sizeKey: string;
  /** Framed canvas only — wood-tone (Black / Natural Wood / Dark Brown). */
  frameColor?: "black" | "natural-wood" | "dark-wood";
  packId: string;
  packName: string;
  style?: "photographic" | "illustrated";
  sourcePhotoUrl: string;
  previewUrl: string;
  /** @deprecated 2026-05-12 — printMasterPath is the new secure field. URL kept
   *  for legacy carts that loaded the old SPA bundle before the security fix. */
  printMasterUrl?: string;
  /** PRIVATE storage path for the print master. Format "<folder>/<uuid>.png" in
   *  the pet-photos-private bucket. Customer cannot fetch — fulfilment uses
   *  admin client. Replaces printMasterUrl post-2026-05-12. */
  printMasterPath?: string;
  soulEdition?: boolean;
  /** Soul Reading line: variantId pre-set, properties carry pet inputs. */
  variantId?: number;
  properties?: Record<string, string>;
}

interface ConsentBody {
  canvasPersonalisedAt?: string | null;
  readingImmediateAt?: string | null;
}

interface CheckoutBody {
  currency?: "GBP" | "USD";
  items?: CartItemBody[];
  /** Optional CCR consent timestamps captured from CartConsents. */
  consent?: ConsentBody;
}

const VALID_CURRENCIES = new Set(["GBP", "USD"]);

// NOTE (C1): we do NOT 400 a checkout merely because the body carries
// `appliedDiscountPct` / `soulEditionPriceMajor`. The legit frontend ALWAYS
// includes `soulEditionPriceMajor` (even as `undefined`) via buildCartItem,
// and the post-purchase gift upsell legitimately sends `appliedDiscountPct`.
// Hard-rejecting on presence broke every real checkout. Instead the server
// simply IGNORES those client values: Soul Edition is priced from
// SOUL_EDITION_PRICE_GBP, and the gift discount is server-clamped to
// GIFT_UPSELL_MAX_DISCOUNT_PCT. The exploit (arbitrary/100% off, free £40
// add-on) is closed at the build step, not by rejecting the request.

function isPresentConsentTimestamp(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function configuredReturnOrigin(): string {
  const raw = process.env.CHECKOUT_RETURN_ORIGIN ?? process.env.PUBLIC_SITE_URL ?? CANONICAL_RETURN_ORIGIN;
  try {
    const origin = new URL(raw).origin;
    return ALLOWED_RETURN_ORIGINS.has(origin) ? origin : CANONICAL_RETURN_ORIGIN;
  } catch {
    return CANONICAL_RETURN_ORIGIN;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!shopifyConfigured()) {
    return res.status(500).json({ error: "Shopify Admin env not configured." });
  }

  const b = (req.body ?? {}) as CheckoutBody;

  // ─── Validate ──────────────────────────────────────────────────────────
  if (!b.currency || !VALID_CURRENCIES.has(b.currency))
    return res.status(400).json({ error: "currency must be GBP or USD" });
  if (!Array.isArray(b.items) || b.items.length === 0)
    return res.status(400).json({ error: "items[] required (at least 1)" });
  if (b.items.length > 20)
    return res.status(400).json({ error: "max 20 items per order" });

  let requiresCanvasConsent = false;
  let requiresReadingConsent = false;
  for (let i = 0; i < b.items.length; i++) {
    const it = b.items[i];
    // C1: client-supplied price/discount fields are intentionally ignored
    // (not rejected) — see the NOTE above. Pricing is enforced at build.
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
  if (requiresCanvasConsent && !isPresentConsentTimestamp(b.consent?.canvasPersonalisedAt)) {
    return res.status(400).json({ error: "consent.canvasPersonalisedAt required for personalised canvas items" });
  }
  if (requiresReadingConsent && !isPresentConsentTimestamp(b.consent?.readingImmediateAt)) {
    return res.status(400).json({ error: "consent.readingImmediateAt required for immediate Soul Reading delivery" });
  }

  // ─── Build line items ──────────────────────────────────────────────────
  const lineItems: DraftOrderLineItem[] = [];
  const noteSummary: string[] = [];
  let soulEditionCount = 0;

  let soulReadingCount = 0;
  for (let i = 0; i < b.items.length; i++) {
    const it = b.items[i];

    // ── Soul Reading line — digital service, fixed variant, pet inputs as
    //    line-item properties. Branched early so the canvas/POD validators
    //    don't reject it.
    if (
      it.productType === SOUL_READING_PRODUCT_TYPE ||
      (typeof it.variantId === "number" && it.variantId === SOUL_READING_VARIANT_ID)
    ) {
      const props = it.properties ?? {};
      const petName = (props._pet_name ?? "").toString().trim();
      const petDob = (props._pet_dob ?? "").toString().trim();
      const petLoc = (props._pet_birth_location ?? "").toString().trim();
      // 2026-05-12: when customer chose "Quick add (fill in later)", the
      // intake form is skipped at cart and we collect details post-payment
      // via the /reading/intake/<token> magic link instead. Skip the pre-
      // checkout validators when this flag is set — the webhook handler
      // detects empty inputs and fires the intake-request email.
      const intakePending = (props._intake_pending ?? "").toString().trim() === "true";
      if (!intakePending) {
        if (!petName)
          return res.status(400).json({ error: `items[${i}]: _pet_name required for Soul Reading` });
        if (!petDob)
          return res.status(400).json({ error: `items[${i}]: _pet_dob required for Soul Reading` });
        if (!petLoc)
          return res.status(400).json({ error: `items[${i}]: _pet_birth_location required for Soul Reading` });
      }

      lineItems.push({
        variantId: SOUL_READING_VARIANT_ID,
        quantity: 1,
        properties: [
          { name: "Pet Name", value: petName },
          { name: "Pet Date of Birth", value: petDob },
          { name: "Pet Birth Location", value: petLoc },
          { name: "_canvas_order_ref", value: (props._canvas_order_ref ?? "").toString() },
          { name: "_line_kind", value: "soul-reading" },
          ...(intakePending ? [{ name: "_intake_pending", value: "true" }] : []),
        ],
      });
      noteSummary.push(`${SOUL_READING_TITLE} · ${petName || "(intake pending)"}`);
      soulReadingCount++;
      continue;
    }

    // ── Gift card line — Shopify-native gift card. No print master, no preview,
    //    no source photo. Just variant_id + recipient details as line-item
    //    properties (Shopify auto-emails recipient + auto-generates the code).
    //    Branched early so the canvas/POD validators don't reject the empty fields.
    if (it.productType === "gift-card" || (typeof it.variantId === "number" && GIFT_CARD_VARIANT_IDS.has(it.variantId))) {
      if (!it.variantId || typeof it.variantId !== "number") {
        return res.status(400).json({ error: `items[${i}]: gift-card requires variantId` });
      }
      const props = it.properties ?? {};
      const recipientName = (props.recipient_name ?? "").toString().trim();
      const recipientEmail = (props.recipient_email ?? "").toString().trim();
      const giftMessage = (props.message ?? "").toString().trim();
      if (!recipientName) {
        return res.status(400).json({ error: `items[${i}]: gift-card requires properties.recipient_name` });
      }
      if (!recipientEmail || !/^\S+@\S+\.\S+$/.test(recipientEmail)) {
        return res.status(400).json({ error: `items[${i}]: gift-card requires a valid properties.recipient_email` });
      }

      const giftLine: DraftOrderLineItem = {
        variantId: it.variantId,
        quantity: 1,
        properties: [
          { name: "recipient_name", value: recipientName },
          { name: "recipient_email", value: recipientEmail },
          ...(giftMessage ? [{ name: "message", value: giftMessage }] : []),
          // Hidden audit trail — useful for analytics on which gift channel converts.
          { name: "_line_kind", value: "gift-card" },
        ],
      };
      // Server-controlled gift upsell discount. We read the client's
      // `appliedDiscountPct` only as a HINT that the upsell flow ran, then
      // clamp hard to GIFT_UPSELL_MAX_DISCOUNT_PCT server-side. A client can
      // never get more than the real promo (closes the arbitrary/100%-off
      // C1 exploit) while the legit 20%-off post-purchase upsell still works.
      const reqPctRaw = Number((it as unknown as Record<string, unknown>).appliedDiscountPct);
      const giftDiscountPct =
        Number.isFinite(reqPctRaw) && reqPctRaw > 0
          ? Math.min(reqPctRaw, GIFT_UPSELL_MAX_DISCOUNT_PCT)
          : 0;
      if (giftDiscountPct > 0) {
        giftLine.appliedDiscount = {
          description: `${giftDiscountPct}% off — Little Souls upsell`,
          valueType: "percentage",
          value: giftDiscountPct.toFixed(2),
        };
        giftLine.properties.push({ name: "_discount_pct", value: String(giftDiscountPct) });
      }
      lineItems.push(giftLine);
      noteSummary.push(`Gift card · ${recipientName} <${recipientEmail}>`);
      continue;
    }

    // Per-item validation
    if (!it.productType || !PRODUCT_VARIANTS[it.productType as ProductTypeKey])
      return res.status(400).json({ error: `items[${i}].productType invalid` });
    if (!it.packId || typeof it.packId !== "string")
      return res.status(400).json({ error: `items[${i}].packId required` });
    if (!it.packName || typeof it.packName !== "string")
      return res.status(400).json({ error: `items[${i}].packName required` });
    if (!it.previewUrl || typeof it.previewUrl !== "string")
      return res.status(400).json({ error: `items[${i}].previewUrl required` });
    if (!it.sourcePhotoUrl || typeof it.sourcePhotoUrl !== "string")
      return res.status(400).json({ error: `items[${i}].sourcePhotoUrl required` });

    const productKey = it.productType as ProductTypeKey;
    // Framed canvas: when frameColor is provided, look up by composite key
    // `${sizeKey}__${frameColor}` (v2 product). Falls back to plain sizeKey
    // for legacy carts created before v2 migration.
    // Unframed canvas: always plain sizeKey (no frame option).
    const baseSizeKey = it.sizeKey ?? "default";
    const lookupKey =
      productKey === "framed-canvas" && it.frameColor
        ? `${baseSizeKey}__${it.frameColor}`
        : baseSizeKey;
    // Defensive: stale cart with frameColor on an unframed canvas item — silently drop frame.
    if (productKey === "canvas" && it.frameColor) {
      console.warn(`[checkout] dropping frameColor='${it.frameColor}' on unframed canvas item (stale cart)`);
    }
    const variant = PRODUCT_VARIANTS[productKey][lookupKey]
      ?? PRODUCT_VARIANTS[productKey][baseSizeKey];
    if (!variant) {
      const validSizes = Object.keys(PRODUCT_VARIANTS[productKey]).join(", ");
      return res.status(400).json({
        error: `items[${i}]: unknown size '${lookupKey}' for product '${productKey}'. Valid: ${validSizes}`,
      });
    }

    const styleLabel = it.style === "illustrated" ? "Illustrated" : "Photographic";
    const isTemplate = it.kind === "template";

    // Template canvas/framed-canvas items REQUIRE a print master (path or URL).
    // Without it, Shopify webhook → extractCanvas falls back to previewUrl (1024px),
    // AuraSR upscales the low-res source, and the customer gets a muddy canvas.
    // Reject at checkout-create time so the customer never gets charged for a
    // degraded print. (AI items have their own guard via the printMaster regen
    // step in StudioFlow.handleAdd, which hard-stops cart-add on failure.)
    const hasPrintMaster = !!(it.printMasterPath || it.printMasterUrl);
    if ((productKey === "canvas" || productKey === "framed-canvas") && !hasPrintMaster) {
      return res.status(400).json({
        error: `items[${i}]: ${productKey} missing print master. Cannot create order without print-ready artwork. Re-run print-master prep in cart.`,
      });
    }
    // Digital download: ALWAYS requires print master (AI or template) — the
    // print master IS the deliverable. No fallback path; reject at checkout.
    if (productKey === "digital" && !hasPrintMaster) {
      return res.status(400).json({
        error: `items[${i}]: digital download missing print master. The print master is the product — cannot create order without it. Re-run print-master prep in cart.`,
      });
    }

    // ALL underscore-prefixed → Shopify HIDES these from the customer at
    // checkout + on the order page (they were showing raw URLs / "Pack id" /
    // "Source photo" which looked broken). They stay in the order data for
    // fulfilment + admin. (Danny 2026-06-01)
    const properties = [
      { name: "_Product", value: PRODUCT_LABELS[productKey] },
      { name: isTemplate ? "_Template" : "_Character pack", value: it.packName },
      ...(isTemplate ? [] : [{ name: "_Style", value: styleLabel }]),
      { name: isTemplate ? "_Template id" : "_Pack id", value: it.packId },
      { name: "_Source photo", value: it.sourcePhotoUrl },
      { name: "_Preview portrait", value: it.previewUrl },
      // Print master — UNDERSCORE-prefixed property is HIDDEN from the customer
      // order page (Shopify convention). New secure path goes here; URL kept as
      // legacy fallback for in-flight carts. Both never visible to customer.
      ...(it.printMasterPath
        ? [{ name: "_print_master_path", value: it.printMasterPath }]
        : []),
      ...(it.printMasterUrl
        ? [{ name: "_print_master_url_legacy", value: it.printMasterUrl }]
        : []),
    ];

    lineItems.push({
      variantId: variant.variantId,
      quantity: 1,
      properties,
    });

    noteSummary.push(`${PRODUCT_LABELS[productKey]} (${variant.sizeLabel}) · ${it.packName}`);

    // Soul Edition add-on — only valid on framed-canvas items
    if (
      productKey === "framed-canvas" &&
      it.soulEdition
    ) {
      soulEditionCount++;
      lineItems.push({
        title: `Soul Edition — natal chart reading + bound book — for ${it.packName} portrait`,
        price: SOUL_EDITION_PRICE_GBP.toFixed(2),
        quantity: 1,
        properties: [
          { name: "Linked portrait pack", value: it.packName },
          { name: "Linked portrait size", value: variant.sizeLabel },
          { name: "Linked source photo", value: it.sourcePhotoUrl },
        ],
      });
    }
  }

  // ─── Build CCR consent metafields (Phase 2 launch plan §6) ─────────────
  // Each ticked checkbox lands here as a UTC timestamp metafield. These
  // become discoverable on the order via Admin GraphQL `order.metafields`
  // and on REST as `note_attributes`. Never overwrite if missing — absence
  // of a metafield preserves the legal record (consent never given).
  const metafields = [];
  const noteAttributes: { name: string; value: string }[] = [];
  if (b.consent?.canvasPersonalisedAt) {
    metafields.push({
      namespace: "consent",
      key: "canvas_personalised_at",
      value: b.consent.canvasPersonalisedAt,
      type: "date_time",
    });
    noteAttributes.push({
      name: "Consent — canvas personalised (CCR Reg 28(1)(b))",
      value: b.consent.canvasPersonalisedAt,
    });
  }
  if (b.consent?.readingImmediateAt) {
    metafields.push({
      namespace: "consent",
      key: "reading_immediate_at",
      value: b.consent.readingImmediateAt,
      type: "date_time",
    });
    noteAttributes.push({
      name: "Consent — Soul Reading immediate delivery (CCR Reg 37)",
      value: b.consent.readingImmediateAt,
    });
  }

  // ─── Create draft order ────────────────────────────────────────────────
  try {
    const noteParts = [noteSummary.join(" • ")];
    if (soulEditionCount > 0) {
      noteParts.push(
        `+${soulEditionCount} Soul Edition${soulEditionCount === 1 ? "" : "s"}`,
      );
    }
    if (soulReadingCount > 0) {
      noteParts.push(
        `+${soulReadingCount} Soul Reading${soulReadingCount === 1 ? "" : "s"}`,
      );
    }

    // Post-payment redirect — Shopify lands the customer back on our thank-you
    // page (which renders the post-purchase gift upsell). Falls back to Shopify's
    // default order-status page if return_url isn't set on this draft.
    const returnUrl = `${configuredReturnOrigin()}/pawtraits/thanks`;

    const draft = await createDraftOrder({
      lineItems,
      currency: b.currency,
      note: noteParts.filter(Boolean).join(" • "),
      returnUrl,
      ...(metafields.length > 0 ? { metafields } : {}),
      ...(noteAttributes.length > 0 ? { noteAttributes } : {}),
    });

    return res.status(200).json({
      invoiceUrl: draft.invoiceUrl,
      draftOrderId: draft.id,
      name: draft.name,
      itemCount: b.items.length,
    });
  } catch (err) {
    console.error("[/api/cart/checkout]", err);
    return res.status(500).json({ error: "Checkout creation failed", detail: (err as Error).message });
  }
}
