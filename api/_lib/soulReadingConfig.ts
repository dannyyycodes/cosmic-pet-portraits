/**
 * Soul Reading product configuration — single source of truth.
 *
 * The numeric Shopify product ID is sourced from the JSON sidecar created by
 * scripts/shopify-launch/create_soul_reading_product.py
 * (see scripts/shopify-launch/soul_reading_product.json).
 *
 * We hard-code it here rather than re-reading the sidecar at runtime so the
 * webhook handler has zero filesystem touch on the hot path. If the product
 * is ever recreated (e.g. for a new pricing variant), update both files.
 *
 * Keep in sync with:
 *   - scripts/shopify-launch/soul_reading_product.json (sidecar, source)
 *   - scripts/shopify-launch/create_soul_reading_product.py (generator)
 */

/**
 * Numeric Shopify product ID for the Soul Reading SKU.
 * Sourced from soul_reading_product.json -> numeric_product_id.
 */
export const SOUL_READING_PRODUCT_ID = 16176281190749 as const;

/**
 * n8n trigger endpoint for the existing Deno droplet worker pipeline.
 * Falls back to env var if set.
 */
export const N8N_SOUL_READING_WEBHOOK_URL =
  process.env.N8N_SOUL_READING_WEBHOOK_URL ||
  "https://n8n.quantumcorehub.net/webhook/generate-report";

/**
 * The line-item-property keys we read off Soul Reading lines.
 * Matches the cart drawer upsell form (Phase 2, research §3.1).
 */
export const SOUL_READING_PROPERTY_KEYS = {
  petName: ["_pet_name", "Pet Name"],
  petDob: ["_pet_dob", "Pet Date of Birth"],
  petBirthLocation: ["_pet_birth_location", "Pet Birth Location"],
  canvasLineRef: ["_canvas_order_ref", "_canvas_line_id"],
} as const;

/**
 * Property key indicating a canvas line is awaiting post-purchase
 * customisation (TikTok Shop Flow B). When this property is present and
 * empty/missing, the line item is in "needs customisation" state — Phase 7
 * sends the upload-your-photo email.
 */
export const CUSTOMISATION_PROPERTY_KEY = "_pet_photo_url";
