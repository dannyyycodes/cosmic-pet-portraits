/**
 * Digital line-item extraction for the orders/paid webhook.
 *
 * Pulls the data needed to call runDigitalFulfillment from a Shopify
 * orders/paid payload:
 *   - printMasterUrl (from line-item property "Print master (Gelato)")
 *   - petName (from "_pet_name")
 *   - previewUrl (from "Preview portrait")
 *
 * Sibling of extractCanvas.ts — same shape, different productType match.
 * Pure, no I/O. The webhook handler decides whether to fire the pipeline.
 */
import { DIGITAL_VARIANT } from "../../../src/components/portraits/gelatoFramedCanvas.js";
import type { ShopifyLineItem } from "./extractReadings.js";
import type { ShopifyOrderWithShipping } from "./extractCanvas.js";

const DIGITAL_VARIANT_ID = String(DIGITAL_VARIANT.variantId);

export interface DigitalFulfillmentInputs {
  lineItemId: number;
  variantId: number;
  /** PRIVATE storage path (post-2026-05-12). When present, fulfilment fetches
   *  via admin client. Takes precedence over printMasterUrl. */
  printMasterPath: string | null;
  printMasterUrl: string | null;
  previewUrl: string | null;
  sourcePhotoUrl: string | null;
  petName: string | null;
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

function toNumericId(v: number | string | null | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Walk the order's line items and pull digital-fulfillment data for any line
 * whose variant_id matches the DIGITAL_VARIANT.
 */
export function extractDigitalFulfillmentLines(
  order: ShopifyOrderWithShipping,
): DigitalFulfillmentInputs[] {
  const items = Array.isArray(order.line_items) ? order.line_items : [];
  const out: DigitalFulfillmentInputs[] = [];

  for (const li of items) {
    const lineItemId = toNumericId(li.id);
    if (lineItemId === null) continue;
    const variantId = toNumericId(li.variant_id ?? null);
    if (variantId === null) continue;
    if (String(variantId) !== DIGITAL_VARIANT_ID) continue;

    const printMasterPath = readProp(li.properties, ["_print_master_path"]);
    const printMasterUrl = readProp(li.properties, ["_print_master_url_legacy", "Print master (Gelato)", "_print_master_url"]);
    const previewUrl = readProp(li.properties, ["Preview portrait", "_preview_url"]);
    const sourcePhotoUrl = readProp(li.properties, ["Source photo", "_source_photo_url"]);
    const petName = readProp(li.properties, ["Pet Name", "_pet_name"]);

    out.push({
      lineItemId,
      variantId,
      printMasterPath,
      printMasterUrl,
      previewUrl,
      sourcePhotoUrl,
      petName,
    });
  }

  return out;
}
