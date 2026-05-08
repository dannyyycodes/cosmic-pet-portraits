/**
 * Canvas line-item extraction for the orders/paid webhook.
 *
 * Pulls the data needed to call runPrintPipeline (Phase 9) directly from
 * a Shopify orders/paid payload:
 *   - sizeKey + frameColor (resolved from variant_id via a reverse map of the
 *     v2 catalog in src/components/portraits/gelatoFramedCanvas.ts)
 *   - source image url (line-item property "Source photo" or "Print master
 *     (Gelato)" if present)
 *   - shipping address (order.shipping_address — Shopify REST shape)
 *
 * Pure, no I/O. The webhook handler decides what to do with the result
 * (insert print_orders row, fire pipeline, etc).
 */
import {
  CANVAS_SIZES,
  FRAME_COLORS,
  FRAMED_CANVAS_V2_VARIANTS,
  type FrameColor,
} from "../../../src/components/portraits/gelatoFramedCanvas.js";
import type { GelatoAddress } from "../../_lib/printPipeline.js";
import type { ShopifyLineItem } from "./extractReadings.js";

// ─── Shopify shapes (REST orders/paid subset) ──────────────────────────────

export interface ShopifyShippingAddress {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  province_code?: string | null;
  country?: string | null;
  country_code?: string | null;
  zip?: string | null;
  phone?: string | null;
}

export interface ShopifyOrderWithShipping {
  id?: number | string;
  email?: string | null;
  shipping_address?: ShopifyShippingAddress | null;
  customer?: { email?: string | null; first_name?: string | null; last_name?: string | null } | null;
  line_items?: ShopifyLineItem[];
  test?: boolean;
}

// ─── Reverse maps ──────────────────────────────────────────────────────────
// Compute once at module load so each webhook invocation does an O(1) lookup.

interface VariantToCanvas {
  sizeKey: string;
  frameColor: FrameColor;
  sku: string;
  sizeLabel: string;
}

const VARIANT_ID_TO_CANVAS: Map<string, VariantToCanvas> = (() => {
  const m = new Map<string, VariantToCanvas>();
  for (const [key, v] of Object.entries(FRAMED_CANVAS_V2_VARIANTS)) {
    const [sizeKey, frameColor] = key.split("__");
    if (!sizeKey || !frameColor) continue;
    if (!FRAME_COLORS.find((c) => c.uid === frameColor)) continue;
    const size = CANVAS_SIZES.find((s) => s.uid === sizeKey);
    if (!size) continue;
    m.set(String(v.variantId), {
      sizeKey,
      frameColor: frameColor as FrameColor,
      sku: `${sizeKey}__${frameColor}`,
      sizeLabel: size.label,
    });
  }
  return m;
})();

// Legacy v1 variants (no frame color choice — assume black).
const LEGACY_V1_VARIANT_IDS: Map<string, VariantToCanvas> = new Map([
  ["64592196600157", { sizeKey: "8x10",  frameColor: "black", sku: "8x10__black",  sizeLabel: "8×10″" }],
  ["64592196632925", { sizeKey: "12x16", frameColor: "black", sku: "12x16__black", sizeLabel: "12×16″" }],
  ["64592196665693", { sizeKey: "16x20", frameColor: "black", sku: "16x20__black", sizeLabel: "16×20″" }],
  ["64592196698461", { sizeKey: "20x30", frameColor: "black", sku: "20x30__black", sizeLabel: "20×30″" }],
]);

export function variantIdToCanvas(variantId: number | string | null | undefined): VariantToCanvas | null {
  if (variantId === null || variantId === undefined) return null;
  const key = String(variantId);
  return VARIANT_ID_TO_CANVAS.get(key) ?? LEGACY_V1_VARIANT_IDS.get(key) ?? null;
}

// ─── Canvas line-item extraction ───────────────────────────────────────────

export interface CanvasFulfillmentInputs {
  lineItemId: number;
  variantId: number | null;
  sizeKey: string;
  frameColor: FrameColor;
  sku: string;
  sizeLabel: string;
  /** Best image URL for the print master. Prefers the explicit print master,
   *  falls back to the source photo, then preview. */
  sourceImageUrl: string | null;
  printMasterUrl: string | null;
  previewUrl: string | null;
  sourcePhotoUrl: string | null;
  petName: string | null;
  /** True if this line is the post-purchase TikTok Shop flow — the customer
   *  hasn't uploaded a photo yet, so we should NOT submit to Gelato. */
  needsCustomisation: boolean;
}

function readProp(props: ShopifyLineItem["properties"], names: string[]): string | null {
  if (!props) return null;
  if (Array.isArray(props)) {
    for (const p of props) {
      if (!p || typeof p.name !== "string") continue;
      if (names.includes(p.name)) {
        const v = p.value;
        if (typeof v === "string" && v.length > 0) return v;
      }
    }
    return null;
  }
  if (typeof props === "object") {
    for (const n of names) {
      const v = (props as Record<string, string | null | undefined>)[n];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return null;
}

function hasPropertyKey(props: ShopifyLineItem["properties"], key: string): boolean {
  if (!props) return false;
  if (Array.isArray(props)) {
    return props.some((p) => p && p.name === key);
  }
  if (typeof props === "object") {
    return Object.prototype.hasOwnProperty.call(props, key);
  }
  return false;
}

function getPropRaw(props: ShopifyLineItem["properties"], key: string): string | null | undefined {
  if (!props) return undefined;
  if (Array.isArray(props)) {
    for (const p of props) {
      if (p && p.name === key) return p.value ?? "";
    }
    return undefined;
  }
  if (typeof props === "object") {
    return (props as Record<string, string | null | undefined>)[key];
  }
  return undefined;
}

const CUSTOMISATION_PROPERTY_KEY = "_pet_photo_url";

function toNumericId(v: number | string | null | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Walk the order's line items and pull the canvas-fulfillment-relevant data
 * for any line whose variant_id matches a known framed-canvas SKU.
 */
export function extractCanvasFulfillmentLines(
  order: ShopifyOrderWithShipping,
): CanvasFulfillmentInputs[] {
  const items = Array.isArray(order.line_items) ? order.line_items : [];
  const out: CanvasFulfillmentInputs[] = [];

  for (const li of items) {
    const lineItemId = toNumericId(li.id);
    if (lineItemId === null) continue;
    const variantId = toNumericId(li.variant_id ?? null);
    if (variantId === null) continue;

    const canvas = variantIdToCanvas(variantId);
    if (!canvas) continue; // not a framed-canvas variant

    // TikTok Shop Flow B detection — same heuristic as classifyLineItems.
    const photoVal = getPropRaw(li.properties, CUSTOMISATION_PROPERTY_KEY);
    const photoMissing =
      photoVal === undefined ||
      photoVal === null ||
      (typeof photoVal === "string" && photoVal.trim().length === 0);
    const needsCustomisation = photoMissing && hasPropertyKey(li.properties, CUSTOMISATION_PROPERTY_KEY);

    const printMasterUrl = readProp(li.properties, ["Print master (Gelato)", "_print_master_url"]);
    const sourcePhotoUrl = readProp(li.properties, ["Source photo", "_source_photo_url"]);
    const previewUrl = readProp(li.properties, ["Preview portrait", "_preview_url"]);
    const petName = readProp(li.properties, ["Pet Name", "_pet_name"]);

    // Prefer explicit print master, then source photo, then preview. The
    // pipeline will run AuraSR 4× regardless — its job is to upscale.
    const sourceImageUrl = printMasterUrl ?? sourcePhotoUrl ?? previewUrl ?? null;

    out.push({
      lineItemId,
      variantId,
      sizeKey: canvas.sizeKey,
      frameColor: canvas.frameColor,
      sku: canvas.sku,
      sizeLabel: canvas.sizeLabel,
      sourceImageUrl,
      printMasterUrl,
      previewUrl,
      sourcePhotoUrl,
      petName,
      needsCustomisation,
    });
  }

  return out;
}

// ─── Map Shopify → Gelato address ──────────────────────────────────────────

export function shopifyAddressToGelato(args: {
  address: ShopifyShippingAddress | null | undefined;
  email: string;
}): GelatoAddress | { ok: false; missing: string[] } {
  const a = args.address ?? {};
  const missing: string[] = [];
  const firstName = (a.first_name ?? "").trim();
  const lastName = (a.last_name ?? "").trim();
  const addressLine1 = (a.address1 ?? "").trim();
  const city = (a.city ?? "").trim();
  const postCode = (a.zip ?? "").trim();
  const country = (a.country_code ?? "").trim().toUpperCase();
  const email = (args.email ?? "").trim();

  if (!firstName) missing.push("first_name");
  if (!lastName) missing.push("last_name");
  if (!addressLine1) missing.push("address1");
  if (!city) missing.push("city");
  if (!postCode) missing.push("zip");
  if (!country) missing.push("country_code");
  if (!email) missing.push("email");

  if (missing.length > 0) return { ok: false, missing };

  return {
    firstName,
    lastName,
    ...(a.company ? { companyName: a.company.trim() } : {}),
    addressLine1,
    ...(a.address2 ? { addressLine2: a.address2.trim() } : {}),
    city,
    postCode,
    ...(a.province ? { state: a.province.trim() } : {}),
    country,
    email,
    ...(a.phone ? { phone: a.phone.trim() } : {}),
  };
}
