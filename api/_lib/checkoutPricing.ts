/**
 * Server-locked pawtraits retail, region-zoned. Prices NEVER come from client.
 *
 * FX live 2026-06-16 00:02 UTC. 45% gross floor after Gelato print+std-ship +
 * Stripe fee (1.5%+£0.20) vs worst country per zone.
 *
 * Strategy (Danny LOCKED 2026-06-16):
 *   • Ship worldwide. FREE shipping SHOWN at checkout (no postage line).
 *   • Postage BAKED INTO PRICE: low-cost zones GB/EU/US keep current GBP
 *     prices; high-ship regions (Canada, Australia, France, rest-of-world)
 *     get a region-specific uplift so margin stays ≥ ~45%.
 *   • VAT: seller NOT VAT-registered → tax_behavior inclusive, Stripe Tax OFF.
 *
 * Only the 5 unframed + 4 framed sizes with LIVE Gelato cost data are
 * zone-uplifted. All other sizes have NO live cost data → fall back to the
 * GB/EU base (`basePriceMajor` from PRODUCT_VARIANTS.priceMajor) and MUST be
 * quoted before HIGH/US uplift.
 *
 * Source data: vault/projects/little-souls/checkout/
 *   gelato-landed-costs-by-region-2026-06-16.md
 *   shipping-pricing-strategy-2026-06-16.md
 */

export type Zone = "GB" | "EU" | "US" | "HIGH";

const EU_COUNTRIES = new Set<string>([
  // standard EU (DE-priced shipping). FR intentionally EXCLUDED → HIGH.
  "DE", "IE", "NL", "BE", "LU", "AT", "IT", "ES", "PT", "DK", "SE", "FI", "PL", "CZ",
  "SK", "SI", "HR", "HU", "RO", "BG", "GR", "EE", "LV", "LT", "CY", "MT",
]);

export function resolveZone(countryRaw: string | null | undefined): Zone {
  const c = (countryRaw ?? "").toUpperCase().trim();
  // FAIL-SAFE: when the geo header is missing/unknown we deliberately resolve to
  // HIGH (the most expensive zone), NOT GB. Resolving an unknown buyer to GB
  // would under-charge a genuine high-ship (CA/AU/etc.) order and sell at a
  // loss. Stripe still collects the real shipping address after pricing, so the
  // worst case is an over-quote we can refund, never a loss.
  if (c === "") return "HIGH";
  if (c === "GB") return "GB";
  if (c === "US") return "US";
  if (EU_COUNTRIES.has(c)) return "EU";
  return "HIGH"; // CA, AU, FR, rest-of-world → HIGH
}

const REGION_PRICES: Record<Zone, Record<string, { unframed: number; framed: number }>> = {
  GB: {
    "8x10":  { unframed: 39,  framed: 84 },
    "12x16": { unframed: 49,  framed: 114 },
    "16x20": { unframed: 65,  framed: 130 },
    "20x30": { unframed: 95,  framed: 180 },
    "24x36": { unframed: 119, framed: 229 },
  },
  EU: {
    "8x10":  { unframed: 39,  framed: 84 },
    "12x16": { unframed: 49,  framed: 114 },
    "16x20": { unframed: 65,  framed: 130 },
    "20x30": { unframed: 95,  framed: 180 },
    "24x36": { unframed: 119, framed: 229 },
  },
  US: {
    "8x10":  { unframed: 39,  framed: 84 },
    "12x16": { unframed: 54,  framed: 114 },
    "16x20": { unframed: 65,  framed: 130 },
    "20x30": { unframed: 100, framed: 180 },
    "24x36": { unframed: 119, framed: 229 },
  },
  HIGH: {
    "8x10":  { unframed: 39,  framed: 99 },
    "12x16": { unframed: 69,  framed: 114 },
    "16x20": { unframed: 85,  framed: 130 },
    "20x30": { unframed: 115, framed: 180 },
    "24x36": { unframed: 144, framed: 229 },
  },
};

// Digital + soul-reading lines are NOT physical → no zone uplift, flat GBP.
const DIGITAL_GBP = 19;
const SOUL_EDITION_GBP = 40;
// Confirmed £40 from Shopify variant 64601427640669 (src/components/portraits/
// soulReading.ts SOUL_READING_PRICE_MAJOR). Spec placeholder of 0 superseded.
export const SOUL_READING_GBP = 40;

export type PawProductType =
  | "canvas" | "framed-canvas" | "digital" | "soul-reading" | "soul-edition";

/**
 * Thrown when a physical size has NO live Gelato cost data AND the buyer is in a
 * high-ship zone (HIGH/US). We refuse to fall back to the GB/EU base price in
 * those zones because the uncovered postage uplift could push margin below the
 * 45% floor (potential sale-at-a-loss). Callers map this to an HTTP 400.
 *
 * GB/EU buyers are unaffected — base price is correct for them.
 */
export class UnpricedRegionError extends Error {
  status = 400 as const;
  constructor(public readonly sizeKey: string, public readonly zone: Zone) {
    super(
      `Size '${sizeKey}' is not yet available for shipping to your region. ` +
        `Please choose a different size or contact us.`,
    );
    this.name = "UnpricedRegionError";
  }
}

/**
 * Server-locked unit price (major units, GBP). The client value is NEVER
 * consulted — this is the single source of truth for pawtraits retail.
 *
 * @param basePriceMajor PRODUCT_VARIANTS[productKey][lookupKey].priceMajor —
 *        the legacy GB/EU base, used as the fallback for sizes lacking live
 *        Gelato cost data (so they are NOT zone-uplifted, never crash).
 */
export function getUnitAmount(
  productType: PawProductType,
  sizeKey: string,
  _frameColor: string | null | undefined,
  zone: Zone,
  basePriceMajor: number,
): number {
  if (productType === "digital") return DIGITAL_GBP;
  if (productType === "soul-edition") return SOUL_EDITION_GBP;
  if (productType === "soul-reading") return SOUL_READING_GBP;
  const framed = productType === "framed-canvas";
  const row = REGION_PRICES[zone]?.[sizeKey];
  if (row) return framed ? row.framed : row.unframed;
  // No live Gelato cost data for this size. GB/EU are safe on the legacy base
  // (already profitable). HIGH/US are NOT — the uncovered postage uplift can
  // sink margin below the 45% floor → refuse rather than sell at a loss.
  if (zone === "HIGH" || zone === "US") {
    throw new UnpricedRegionError(sizeKey, zone);
  }
  return basePriceMajor; // GB/EU only → legacy base, not zone-uplifted
}

export function toMinor(major: number): number {
  return Math.round(major * 100);
}
