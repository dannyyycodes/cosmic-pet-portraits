/**
 * Gelato canvas catalog — UNFRAMED (11 SKUs) + FRAMED (33 SKUs).
 *
 * Source of truth for size labels, prices, and Gelato productUids. Used by:
 *   - productLineup.ts (Shopify variant resolution)
 *   - StudioFlow.tsx (size + frame picker)
 *   - api/cart/checkout.ts (line-item Gelato routing)
 *   - api/shopify/_lib/extractCanvas.ts (fulfilment reverse-mapping)
 *
 * productUids verified live against Gelato API on 2026-05-04 (framed) and
 * 2026-05-12 (unframed). Pricing locked 2026-05-12 against live Gelato
 * wholesale + UK shipping quotes — see vault live-skus-and-margins-2026-05-12.
 *
 * Model: customer picks SIZE first. Then picks FRAME: Unframed (default,
 * entry price) or one of 3 wood tones (+frame upgrade). All 3 frame colors
 * share the same upgrade price within a size (Gelato charges the same
 * regardless of stain).
 */

export type FrameColor = "black" | "dark-wood" | "natural-wood";

export interface FrameColorMeta {
  uid: FrameColor;
  label: string;
  swatchHex: string; // approximation for the UI swatch
}

export const FRAME_COLORS: FrameColorMeta[] = [
  { uid: "black",        label: "Black",       swatchHex: "#1c1c1c" },
  { uid: "natural-wood", label: "Natural Wood", swatchHex: "#c9a878" },
  { uid: "dark-wood",    label: "Dark Brown",   swatchHex: "#5e3a1f" },
];

export interface CanvasSizeMeta {
  /** Internal size key — matches productLineup.ts variant lookup. */
  uid: string;
  /** Display label e.g. "12×16″". */
  label: string;
  /** Inches. */
  inches: { w: number; h: number };
  /** Centimetres. */
  cm: { w: number; h: number };
  /** Gelato UnifiedCanvasFormat attribute (framed product, mm-inch order). */
  gelatoFormat: string;
  /** Frame outer dimensions for context (framed product only). */
  frameSizeUid: string;
  /** ENTRY retail price (GBP) — unframed canvas. Framed total = priceGBP + frameUpgradeGBP. */
  priceGBP: number;
  /** Frame upgrade retail (GBP). Add to priceGBP for framed price. Tiered by size to keep ≥25% margin on the frame addition. */
  frameUpgradeGBP: number;
  /** Customer-facing positioning blurb. */
  caption: string;
  /** Marked as the hero / "Most loved" tier. */
  hero?: boolean;
}

/**
 * Launch catalog — 11 sizes verified available in Gelato framed-canvas.
 * Skipped: 8×12, 12×12 (too cramped vs adjacent sizes).
 */
export const CANVAS_SIZES: CanvasSizeMeta[] = [
  {
    uid: "8x10",  label: "8×10″",
    inches: { w: 8, h: 10 }, cm: { w: 20, h: 25 },
    gelatoFormat: "200x250-mm-8x10-inch", frameSizeUid: "252x302-mm-10x12-inch",
    priceGBP: 39, frameUpgradeGBP: 45, caption: "Desk · shelf · bedside",
  },
  {
    uid: "12x16", label: "12×16″",
    inches: { w: 12, h: 16 }, cm: { w: 30, h: 40 },
    gelatoFormat: "300x400-mm-12x16-inch", frameSizeUid: "352x452-mm-14x18-inch",
    priceGBP: 49, frameUpgradeGBP: 65, caption: "Entry · gift-friendly",
  },
  {
    uid: "12x18", label: "12×18″",
    inches: { w: 12, h: 18 }, cm: { w: 30, h: 45 },
    gelatoFormat: "300x450-mm-12x18-inch", frameSizeUid: "352x502-mm-14x20-inch",
    priceGBP: 55, frameUpgradeGBP: 65, caption: "Slim pawtrait",
  },
  {
    uid: "16x20", label: "16×20″",
    inches: { w: 16, h: 20 }, cm: { w: 40, h: 50 },
    gelatoFormat: "400x500-mm-16x20-inch", frameSizeUid: "452x552-mm-18x22-inch",
    priceGBP: 65, frameUpgradeGBP: 65, caption: "Hero · main wall feature",
    hero: true,
  },
  {
    uid: "16x24", label: "16×24″",
    inches: { w: 16, h: 24 }, cm: { w: 40, h: 60 },
    gelatoFormat: "400x600-mm-16x24-inch", frameSizeUid: "452x652-mm-18x26-inch",
    priceGBP: 75, frameUpgradeGBP: 80, caption: "Living room",
  },
  {
    uid: "18x24", label: "18×24″",
    inches: { w: 18, h: 24 }, cm: { w: 45, h: 60 },
    gelatoFormat: "450x600-mm-18x24-inch", frameSizeUid: "502x652-mm-20x26-inch",
    priceGBP: 79, frameUpgradeGBP: 80, caption: "Statement pawtrait",
  },
  {
    uid: "20x28", label: "20×28″",
    inches: { w: 20, h: 28 }, cm: { w: 50, h: 70 },
    gelatoFormat: "500x700-mm-20x28-inch", frameSizeUid: "552x752-mm-22x30-inch",
    priceGBP: 89, frameUpgradeGBP: 85, caption: "Above sofa",
  },
  {
    uid: "20x30", label: "20×30″",
    inches: { w: 20, h: 30 }, cm: { w: 50, h: 75 },
    gelatoFormat: "500x750-mm-20x30-inch", frameSizeUid: "552x802-mm-22x32-inch",
    priceGBP: 95, frameUpgradeGBP: 85, caption: "Tall statement",
  },
  {
    uid: "24x24", label: "24×24″",
    inches: { w: 24, h: 24 }, cm: { w: 60, h: 60 },
    gelatoFormat: "600x600-mm-24x24-inch", frameSizeUid: "652x652-mm-26x26-inch",
    priceGBP: 95, frameUpgradeGBP: 85, caption: "Square · gallery wall",
  },
  {
    uid: "24x32", label: "24×32″",
    inches: { w: 24, h: 32 }, cm: { w: 60, h: 80 },
    gelatoFormat: "600x800-mm-24x32-inch", frameSizeUid: "652x852-mm-26x34-inch",
    priceGBP: 109, frameUpgradeGBP: 100, caption: "Large feature",
  },
  {
    uid: "24x36", label: "24×36″",
    inches: { w: 24, h: 36 }, cm: { w: 60, h: 90 },
    gelatoFormat: "600x900-mm-24x36-inch", frameSizeUid: "652x952-mm-26x38-inch",
    priceGBP: 119, frameUpgradeGBP: 110, caption: "Bold statement",
  },
];

/** Convenience map: `${sizeUid}` → entry (unframed) retail price in GBP. */
export const UNFRAMED_PRICE_GBP: Record<string, number> = Object.fromEntries(
  CANVAS_SIZES.map((s) => [s.uid, s.priceGBP])
);

/** Convenience map: `${sizeUid}` → frame upgrade retail in GBP. */
export const FRAME_UPGRADE_GBP: Record<string, number> = Object.fromEntries(
  CANVAS_SIZES.map((s) => [s.uid, s.frameUpgradeGBP])
);

/** Convenience: framed total = unframed + frame upgrade. */
export function framedRetailGBP(sizeUid: string): number | null {
  const s = CANVAS_SIZES.find((x) => x.uid === sizeUid);
  return s ? s.priceGBP + s.frameUpgradeGBP : null;
}

/**
 * Build the Gelato productUid for a given (size, color) FRAMED canvas. Both the
 * format and frame-size UIDs differ per size, so we look them up from CANVAS_SIZES.
 */
export function gelatoProductUid(sizeUid: string, color: FrameColor): string | null {
  const size = CANVAS_SIZES.find((s) => s.uid === sizeUid);
  if (!size) return null;
  return [
    "framed_canvas_geo_simplified",
    size.gelatoFormat,
    color,
    size.frameSizeUid,
    "wood-fsc-slim",
    "ver",
    "wood",
    "w14xt42-mm",
    "canvas",
    "4-0",
  ].join("_");
}

/**
 * Build the Gelato productUid for the UNFRAMED slim canvas (single SKU per size).
 * UID pattern (inch-mm order, opposite of framed): `canvas_{8x10-inch-200x250-mm}_canvas_wood-fsc-slim_4-0_ver`.
 * Verified live against Gelato API 2026-05-12 (UK/GBP).
 */
export function gelatoUnframedProductUid(sizeUid: string): string | null {
  const size = CANVAS_SIZES.find((s) => s.uid === sizeUid);
  if (!size) return null;
  // Framed format is "200x250-mm-8x10-inch" (mm-inch). Unframed is "8x10-inch-200x250-mm" (inch-mm). Reorder the two halves.
  const parts = size.gelatoFormat.split("-mm-");
  if (parts.length !== 2) return null;
  const mmPart = `${parts[0]}-mm`;
  const inchPart = `${parts[1]}`;
  const unframedFormat = `${inchPart}-${mmPart}`;
  return `canvas_${unframedFormat}_canvas_wood-fsc-slim_4-0_ver`;
}

/**
 * Returns all 33 (size × frame color) combos — used by the variant-creation
 * script to generate Shopify variants with the correct gelato.product_uid
 * metafield per combo.
 */
export function allCatalogCombos(): Array<{
  sizeUid: string;
  size: CanvasSizeMeta;
  color: FrameColor;
  productUid: string;
  sku: string;
}> {
  const out = [];
  for (const size of CANVAS_SIZES) {
    for (const color of FRAME_COLORS) {
      const productUid = gelatoProductUid(size.uid, color.uid);
      if (!productUid) continue;
      const skuColor = color.uid === "black" ? "BLK" : color.uid === "dark-wood" ? "DRK" : "NAT";
      const skuSize = size.uid.toUpperCase().replace("X", "X");
      out.push({
        sizeUid: size.uid,
        size,
        color: color.uid,
        productUid,
        sku: `LS-FC-${skuSize}-${skuColor}`,
      });
    }
  }
  return out;
}

/**
 * FRAMED Shopify variant map — variantIds locked 2026-05-04, **prices repriced
 * 2026-05-12** to `unframed + frame upgrade` (profitable post Gelato API audit).
 *
 * Product handle: cosmic-pet-portrait-framed-canvas-v2 (id 16175767519581).
 * Variants created by scripts/shopify-launch/extend_framed_canvas.py.
 * Prices in Shopify itself were updated by scripts/shopify-launch/reprice_framed_canvas_v2.py.
 *
 * Key format: `${sizeUid}__${frameColorUid}`.
 */
export const FRAMED_CANVAS_V2_VARIANTS: Record<string, { variantId: number; priceMajor: number }> = {
  "8x10__black":          { variantId: 64599875256669, priceMajor: 84 },
  "8x10__natural-wood":   { variantId: 64599875289437, priceMajor: 84 },
  "8x10__dark-wood":      { variantId: 64599875322205, priceMajor: 84 },
  "12x16__black":         { variantId: 64599875354973, priceMajor: 114 },
  "12x16__natural-wood":  { variantId: 64599875387741, priceMajor: 114 },
  "12x16__dark-wood":     { variantId: 64599875420509, priceMajor: 114 },
  "12x18__black":         { variantId: 64599875453277, priceMajor: 120 },
  "12x18__natural-wood":  { variantId: 64599875486045, priceMajor: 120 },
  "12x18__dark-wood":     { variantId: 64599875518813, priceMajor: 120 },
  "16x20__black":         { variantId: 64599875551581, priceMajor: 130 },
  "16x20__natural-wood":  { variantId: 64599875584349, priceMajor: 130 },
  "16x20__dark-wood":     { variantId: 64599875617117, priceMajor: 130 },
  "16x24__black":         { variantId: 64599875649885, priceMajor: 155 },
  "16x24__natural-wood":  { variantId: 64599875682653, priceMajor: 155 },
  "16x24__dark-wood":     { variantId: 64599875715421, priceMajor: 155 },
  "18x24__black":         { variantId: 64599875748189, priceMajor: 159 },
  "18x24__natural-wood":  { variantId: 64599875780957, priceMajor: 159 },
  "18x24__dark-wood":     { variantId: 64599875813725, priceMajor: 159 },
  "20x28__black":         { variantId: 64599875846493, priceMajor: 174 },
  "20x28__natural-wood":  { variantId: 64599875879261, priceMajor: 174 },
  "20x28__dark-wood":     { variantId: 64599875912029, priceMajor: 174 },
  "20x30__black":         { variantId: 64599875944797, priceMajor: 180 },
  "20x30__natural-wood":  { variantId: 64599875977565, priceMajor: 180 },
  "20x30__dark-wood":     { variantId: 64599876010333, priceMajor: 180 },
  "24x24__black":         { variantId: 64599876043101, priceMajor: 180 },
  "24x24__natural-wood":  { variantId: 64599876075869, priceMajor: 180 },
  "24x24__dark-wood":     { variantId: 64599876108637, priceMajor: 180 },
  "24x32__black":         { variantId: 64599876141405, priceMajor: 209 },
  "24x32__natural-wood":  { variantId: 64599876174173, priceMajor: 209 },
  "24x32__dark-wood":     { variantId: 64599876206941, priceMajor: 209 },
  "24x36__black":         { variantId: 64599876239709, priceMajor: 229 },
  "24x36__natural-wood":  { variantId: 64599876272477, priceMajor: 229 },
  "24x36__dark-wood":     { variantId: 64599876305245, priceMajor: 229 },
};

/**
 * UNFRAMED Shopify variant map — created 2026-05-12 by create_unframed_canvas.py.
 * Product handle: cosmic-pet-portrait-canvas (id 16190044897629).
 * One variant per size, no frame option. Gelato app routes via
 * `gelato.product_uid` metafield (`canvas_{format}_canvas_wood-fsc-slim_4-0_ver`).
 *
 * Key format: `${sizeUid}`.
 */
export const UNFRAMED_CANVAS_VARIANTS: Record<string, { variantId: number; priceMajor: number }> = {
  "8x10":  { variantId: 64669306454365, priceMajor: 39 },
  "12x16": { variantId: 64669306487133, priceMajor: 49 },
  "12x18": { variantId: 64669306519901, priceMajor: 55 },
  "16x20": { variantId: 64669306552669, priceMajor: 65 },
  "16x24": { variantId: 64669306585437, priceMajor: 75 },
  "18x24": { variantId: 64669306618205, priceMajor: 79 },
  "20x28": { variantId: 64669306650973, priceMajor: 89 },
  "20x30": { variantId: 64669306683741, priceMajor: 95 },
  "24x24": { variantId: 64669306716509, priceMajor: 95 },
  "24x32": { variantId: 64669306749277, priceMajor: 109 },
  "24x36": { variantId: 64669306782045, priceMajor: 119 },
};

export function resolveFramedCanvasVariant(
  sizeUid: string,
  color: FrameColor,
): { variantId: number; priceMajor: number; sizeLabel: string; gelatoUid: string } | null {
  const v = FRAMED_CANVAS_V2_VARIANTS[`${sizeUid}__${color}`];
  if (!v) return null;
  const size = CANVAS_SIZES.find((s) => s.uid === sizeUid);
  if (!size) return null;
  const gelatoUid = gelatoProductUid(sizeUid, color);
  if (!gelatoUid) return null;
  return { variantId: v.variantId, priceMajor: v.priceMajor, sizeLabel: size.label, gelatoUid };
}

export function resolveUnframedCanvasVariant(
  sizeUid: string,
): { variantId: number; priceMajor: number; sizeLabel: string; gelatoUid: string } | null {
  const v = UNFRAMED_CANVAS_VARIANTS[sizeUid];
  if (!v || v.variantId === 0) return null;
  const size = CANVAS_SIZES.find((s) => s.uid === sizeUid);
  if (!size) return null;
  const gelatoUid = gelatoUnframedProductUid(sizeUid);
  if (!gelatoUid) return null;
  return { variantId: v.variantId, priceMajor: v.priceMajor, sizeLabel: size.label, gelatoUid };
}

/**
 * DIGITAL download — single Shopify variant, no Gelato, no shipping.
 * Created 2026-05-12 in Shopify (handle: cosmic-pet-portrait-digital, id 16190069670237).
 * Customer pays £19, receives the 3000×3000 print master via email (Resend) +
 * a 30-day Supabase storage download link. Fulfilled by api/_lib/digitalFulfillment.ts.
 *
 * Highest-margin SKU in the catalog (~97% — only fal.ai render cost £0.10 + Resend + Supabase).
 */
export const DIGITAL_VARIANT = {
  variantId: 64669378511197,
  priceMajor: 19,
  sizeLabel: "Digital download",
};

export function resolveDigitalVariant(): { variantId: number; priceMajor: number; sizeLabel: string } {
  return DIGITAL_VARIANT;
}

/**
 * Gift card variants — created 2026-05-12 (run scripts/shopify-launch/create_gift_card_product.py).
 * Customer picks an amount, adds to cart with recipient name/email/message as line-item
 * properties. Shopify auto-generates the code on payment and emails the recipient.
 * Recipient redeems at checkout like a discount code (built-in).
 *
 * Variant IDs are 0 until the migration script runs; paste real IDs from
 * scripts/shopify-launch/created_gift_card_product.json after running.
 */
export const GIFT_CARD_VARIANTS: Record<number, { variantId: number; priceMajor: number }> = {
  19:  { variantId: 0, priceMajor: 19 },
  39:  { variantId: 0, priceMajor: 39 },
  79:  { variantId: 0, priceMajor: 79 },
  129: { variantId: 0, priceMajor: 129 },
};

export const GIFT_CARD_DENOMINATIONS_GBP: readonly number[] = [19, 39, 79, 129] as const;
