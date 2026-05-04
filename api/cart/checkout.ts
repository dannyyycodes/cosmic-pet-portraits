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
type ProductTypeKey = "framed-canvas" | "mug" | "tote" | "tee" | "hoodie";

interface VariantDef {
  variantId: number;
  priceMajor: number;
  sizeLabel: string;
}

const PRODUCT_VARIANTS: Record<ProductTypeKey, Record<string, VariantDef>> = {
  "framed-canvas": {
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
  "framed-canvas": "Cosmic Pet Portrait — Framed Canvas",
  mug:             "Cosmic Pet Portrait — Ceramic Mug",
  tote:            "Cosmic Pet Portrait — Tote Bag",
  tee:             "Cosmic Pet Portrait — Unisex Tee",
  hoodie:          "Cosmic Pet Portrait — Unisex Hoodie",
};

interface CartItemBody {
  /** Tier 0 (template) vs Tier 1+ (AI gen). Defaults "ai". */
  kind?: "ai" | "template";
  productType: ProductTypeKey;
  sizeKey: string;
  packId: string;
  packName: string;
  style?: "photographic" | "illustrated";
  sourcePhotoUrl: string;
  previewUrl: string;
  /** Template-only: 3000×3000 print master URL for Gelato. */
  printMasterUrl?: string;
  soulEdition?: boolean;
  soulEditionPriceMajor?: number;
}

interface CheckoutBody {
  currency?: "GBP" | "USD";
  items?: CartItemBody[];
}

const VALID_CURRENCIES = new Set(["GBP", "USD"]);

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

  // ─── Build line items ──────────────────────────────────────────────────
  const lineItems: DraftOrderLineItem[] = [];
  const noteSummary: string[] = [];
  let soulEditionCount = 0;

  for (let i = 0; i < b.items.length; i++) {
    const it = b.items[i];

    // Per-item validation
    if (!it.productType || !PRODUCT_VARIANTS[it.productType])
      return res.status(400).json({ error: `items[${i}].productType invalid` });
    if (!it.packId || typeof it.packId !== "string")
      return res.status(400).json({ error: `items[${i}].packId required` });
    if (!it.packName || typeof it.packName !== "string")
      return res.status(400).json({ error: `items[${i}].packName required` });
    if (!it.previewUrl || typeof it.previewUrl !== "string")
      return res.status(400).json({ error: `items[${i}].previewUrl required` });
    if (!it.sourcePhotoUrl || typeof it.sourcePhotoUrl !== "string")
      return res.status(400).json({ error: `items[${i}].sourcePhotoUrl required` });

    const sizeKey = it.sizeKey ?? "default";
    const variant = PRODUCT_VARIANTS[it.productType][sizeKey];
    if (!variant) {
      const validSizes = Object.keys(PRODUCT_VARIANTS[it.productType]).join(", ");
      return res.status(400).json({
        error: `items[${i}]: unknown size '${sizeKey}' for product '${it.productType}'. Valid: ${validSizes}`,
      });
    }

    const styleLabel = it.style === "illustrated" ? "Illustrated" : "Photographic";
    const isTemplate = it.kind === "template";

    const properties = [
      { name: "Product", value: PRODUCT_LABELS[it.productType] },
      { name: isTemplate ? "Template" : "Character pack", value: it.packName },
      ...(isTemplate ? [] : [{ name: "Style", value: styleLabel }]),
      { name: isTemplate ? "Template id" : "Pack id", value: it.packId },
      { name: "Source photo", value: it.sourcePhotoUrl },
      { name: "Preview portrait", value: it.previewUrl },
      ...(isTemplate && it.printMasterUrl
        ? [{ name: "Print master (Gelato)", value: it.printMasterUrl }]
        : []),
    ];

    lineItems.push({
      variantId: variant.variantId,
      quantity: 1,
      properties,
    });

    noteSummary.push(`${PRODUCT_LABELS[it.productType]} (${variant.sizeLabel}) · ${it.packName}`);

    // Soul Edition add-on — only valid on framed-canvas items
    if (
      it.productType === "framed-canvas" &&
      it.soulEdition &&
      typeof it.soulEditionPriceMajor === "number" &&
      it.soulEditionPriceMajor > 0
    ) {
      soulEditionCount++;
      lineItems.push({
        title: `Soul Edition — natal chart reading + bound book — for ${it.packName} portrait`,
        price: it.soulEditionPriceMajor.toFixed(2),
        quantity: 1,
        properties: [
          { name: "Linked portrait pack", value: it.packName },
          { name: "Linked portrait size", value: variant.sizeLabel },
          { name: "Linked source photo", value: it.sourcePhotoUrl },
        ],
      });
    }
  }

  // ─── Create draft order ────────────────────────────────────────────────
  try {
    const draft = await createDraftOrder({
      lineItems,
      currency: b.currency,
      note:
        noteSummary.join(" • ") +
        (soulEditionCount > 0 ? ` • +${soulEditionCount} Soul Edition${soulEditionCount === 1 ? "" : "s"}` : ""),
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
