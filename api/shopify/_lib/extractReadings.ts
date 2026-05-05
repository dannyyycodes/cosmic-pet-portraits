/**
 * Classify Shopify order line items into:
 *   - soul_reading: a Soul Reading add-on with valid pet inputs
 *   - needs_customisation: a canvas line awaiting post-purchase photo upload
 *     (TikTok Shop Flow B — research-2026-05-04-post-purchase-customisation §1)
 *   - canvas: any other line (handed to the Gelato Shopify connector for fulfilment)
 *
 * Tolerates Shopify's two property shapes:
 *   - REST: properties = [{ name: "_pet_name", value: "Bella" }, ...]
 *   - Liquid/object form: properties = { "_pet_name": "Bella", ... }
 */
import {
  SOUL_READING_PRODUCT_ID,
  SOUL_READING_PROPERTY_KEYS,
  CUSTOMISATION_PROPERTY_KEY,
} from "../../_lib/soulReadingConfig.js";

export type ShopifyLineItemPropertyArray = Array<{ name: string; value: string | null | undefined }>;
export type ShopifyLineItemPropertyObject = Record<string, string | null | undefined>;

export interface ShopifyLineItem {
  id: number | string;
  product_id?: number | string | null;
  variant_id?: number | string | null;
  title?: string | null;
  quantity?: number | null;
  properties?: ShopifyLineItemPropertyArray | ShopifyLineItemPropertyObject | null;
}

export interface ShopifyOrderLike {
  id?: number | string;
  email?: string | null;
  test?: boolean;
  line_items?: ShopifyLineItem[];
}

export interface SoulReadingItem {
  kind: "soul_reading";
  lineItem: ShopifyLineItem;
  lineItemId: number;
  petName: string;
  petDob: string;
  petBirthLocation: string;
  /** True if any required field was missing/blank — we still emit the row so
   *  reconciliation/manual-fix flow can pick it up, but mark it explicitly. */
  hasIncompleteInputs: boolean;
}

export interface NeedsCustomisationItem {
  kind: "needs_customisation";
  lineItem: ShopifyLineItem;
  lineItemId: number;
}

export interface CanvasItem {
  kind: "canvas";
  lineItem: ShopifyLineItem;
  lineItemId: number;
}

export type ClassifiedLineItem = SoulReadingItem | NeedsCustomisationItem | CanvasItem;

// ─── Property accessors ────────────────────────────────────────────────────

function getPropertyValue(
  properties: ShopifyLineItem["properties"],
  candidates: readonly string[],
): string | undefined {
  if (!properties) return undefined;
  if (Array.isArray(properties)) {
    for (const p of properties) {
      if (!p || typeof p.name !== "string") continue;
      if (candidates.includes(p.name)) {
        const v = p.value;
        if (typeof v === "string" && v.length > 0) return v;
      }
    }
    return undefined;
  }
  if (typeof properties === "object") {
    for (const key of candidates) {
      const v = (properties as ShopifyLineItemPropertyObject)[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return undefined;
}

/** True if the property is present in the payload (even if empty/null). */
function hasProperty(properties: ShopifyLineItem["properties"], key: string): boolean {
  if (!properties) return false;
  if (Array.isArray(properties)) {
    return properties.some((p) => p && p.name === key);
  }
  if (typeof properties === "object") {
    return Object.prototype.hasOwnProperty.call(properties, key);
  }
  return false;
}

function getPropertyRaw(properties: ShopifyLineItem["properties"], key: string): string | null | undefined {
  if (!properties) return undefined;
  if (Array.isArray(properties)) {
    for (const p of properties) {
      if (p && p.name === key) return p.value ?? "";
    }
    return undefined;
  }
  if (typeof properties === "object") {
    return (properties as ShopifyLineItemPropertyObject)[key];
  }
  return undefined;
}

// ─── Classifier ────────────────────────────────────────────────────────────

function toNumericId(v: number | string | null | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Walk all line items in the order, classify each. Pure — no side effects.
 */
export function classifyLineItems(order: ShopifyOrderLike): ClassifiedLineItem[] {
  const items = Array.isArray(order.line_items) ? order.line_items : [];
  const out: ClassifiedLineItem[] = [];

  for (const li of items) {
    const lineItemId = toNumericId(li.id);
    if (lineItemId === null) {
      // Defensive: skip lines without a usable numeric id. Idempotency key is
      // composite (event_id, line_item_id) so we cannot persist this line.
      continue;
    }

    const productId = toNumericId(li.product_id ?? null);

    if (productId === SOUL_READING_PRODUCT_ID) {
      const petName = getPropertyValue(li.properties, SOUL_READING_PROPERTY_KEYS.petName) ?? "";
      const petDob = getPropertyValue(li.properties, SOUL_READING_PROPERTY_KEYS.petDob) ?? "";
      const petBirthLocation = getPropertyValue(li.properties, SOUL_READING_PROPERTY_KEYS.petBirthLocation) ?? "";

      // Try to back-fill from the canvas line (research §6.2). If the
      // customer added Soul Reading without a name but pointed at a canvas
      // line via _canvas_order_ref, copy from there.
      let resolvedPetName = petName;
      if (!resolvedPetName) {
        const canvasRef = getPropertyValue(li.properties, SOUL_READING_PROPERTY_KEYS.canvasLineRef);
        if (canvasRef) {
          const canvas = items.find((other) => String(other.id) === canvasRef);
          if (canvas) {
            resolvedPetName = getPropertyValue(canvas.properties, SOUL_READING_PROPERTY_KEYS.petName) ?? "";
          }
        }
      }

      const hasIncompleteInputs = !resolvedPetName || !petDob || !petBirthLocation;

      out.push({
        kind: "soul_reading",
        lineItem: li,
        lineItemId,
        petName: resolvedPetName,
        petDob,
        petBirthLocation,
        hasIncompleteInputs,
      });
      continue;
    }

    // Not a Soul Reading line. Check if it's a canvas line awaiting
    // post-purchase customisation. The Phase 2 cart-drawer captures
    // `_pet_photo_url` on canvas lines — empty string OR missing entirely
    // means TikTok Shop Flow B (post-purchase upload).
    const photoVal = getPropertyRaw(li.properties, CUSTOMISATION_PROPERTY_KEY);
    const photoMissing =
      photoVal === undefined ||
      photoVal === null ||
      (typeof photoVal === "string" && photoVal.trim().length === 0);

    if (photoMissing && hasProperty(li.properties, CUSTOMISATION_PROPERTY_KEY)) {
      // Property explicitly present but empty → TikTok Shop Flow B
      out.push({ kind: "needs_customisation", lineItem: li, lineItemId });
      continue;
    }

    out.push({ kind: "canvas", lineItem: li, lineItemId });
  }

  return out;
}
