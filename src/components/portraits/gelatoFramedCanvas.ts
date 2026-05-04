/**
 * Gelato framed-canvas catalog — 11 sizes × 3 frame colors = 33 SKUs.
 *
 * Source of truth for size labels, prices, and Gelato productUids. Used by:
 *   - productLineup.ts (Shopify variant resolution)
 *   - StudioFlow.tsx (size + frame picker)
 *   - api/cart/checkout.ts (line-item Gelato routing)
 *
 * productUids verified live against Gelato API on 2026-05-04.
 * Pricing locked at competitive tier (matches Crown & Paw / PawFav range).
 *
 * Frame colors share the same retail price (Gelato charges the same regardless
 * of stain). Customer picks size first, then wood tone, no price change.
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
  /** Gelato UnifiedCanvasFormat attribute. */
  gelatoFormat: string;
  /** Frame outer dimensions for context. */
  frameSizeUid: string;
  /** Retail price (GBP, all 3 frame colors share this price). */
  priceGBP: number;
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
    priceGBP: 39, caption: "Desk · shelf · bedside",
  },
  {
    uid: "12x16", label: "12×16″",
    inches: { w: 12, h: 16 }, cm: { w: 30, h: 40 },
    gelatoFormat: "300x400-mm-12x16-inch", frameSizeUid: "352x452-mm-14x18-inch",
    priceGBP: 49, caption: "Entry · gift-friendly",
  },
  {
    uid: "12x18", label: "12×18″",
    inches: { w: 12, h: 18 }, cm: { w: 30, h: 45 },
    gelatoFormat: "300x450-mm-12x18-inch", frameSizeUid: "352x502-mm-14x20-inch",
    priceGBP: 55, caption: "Slim portrait",
  },
  {
    uid: "16x20", label: "16×20″",
    inches: { w: 16, h: 20 }, cm: { w: 40, h: 50 },
    gelatoFormat: "400x500-mm-16x20-inch", frameSizeUid: "452x552-mm-18x22-inch",
    priceGBP: 65, caption: "Hero · main wall feature",
    hero: true,
  },
  {
    uid: "16x24", label: "16×24″",
    inches: { w: 16, h: 24 }, cm: { w: 40, h: 60 },
    gelatoFormat: "400x600-mm-16x24-inch", frameSizeUid: "452x652-mm-18x26-inch",
    priceGBP: 75, caption: "Living room",
  },
  {
    uid: "18x24", label: "18×24″",
    inches: { w: 18, h: 24 }, cm: { w: 45, h: 60 },
    gelatoFormat: "450x600-mm-18x24-inch", frameSizeUid: "502x652-mm-20x26-inch",
    priceGBP: 79, caption: "Statement portrait",
  },
  {
    uid: "20x28", label: "20×28″",
    inches: { w: 20, h: 28 }, cm: { w: 50, h: 70 },
    gelatoFormat: "500x700-mm-20x28-inch", frameSizeUid: "552x752-mm-22x30-inch",
    priceGBP: 89, caption: "Above sofa",
  },
  {
    uid: "20x30", label: "20×30″",
    inches: { w: 20, h: 30 }, cm: { w: 50, h: 75 },
    gelatoFormat: "500x750-mm-20x30-inch", frameSizeUid: "552x802-mm-22x32-inch",
    priceGBP: 95, caption: "Tall statement",
  },
  {
    uid: "24x24", label: "24×24″",
    inches: { w: 24, h: 24 }, cm: { w: 60, h: 60 },
    gelatoFormat: "600x600-mm-24x24-inch", frameSizeUid: "652x652-mm-26x26-inch",
    priceGBP: 95, caption: "Square · gallery wall",
  },
  {
    uid: "24x32", label: "24×32″",
    inches: { w: 24, h: 32 }, cm: { w: 60, h: 80 },
    gelatoFormat: "600x800-mm-24x32-inch", frameSizeUid: "652x852-mm-26x34-inch",
    priceGBP: 109, caption: "Large feature",
  },
  {
    uid: "24x36", label: "24×36″",
    inches: { w: 24, h: 36 }, cm: { w: 60, h: 90 },
    gelatoFormat: "600x900-mm-24x36-inch", frameSizeUid: "652x952-mm-26x38-inch",
    priceGBP: 119, caption: "Bold statement",
  },
];

/**
 * Build the Gelato productUid for a given (size, color). Both the format and
 * frame-size UIDs differ per size, so we look them up from CANVAS_SIZES.
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
