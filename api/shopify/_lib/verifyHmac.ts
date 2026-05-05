/**
 * Shopify webhook HMAC verification.
 *
 * Per https://shopify.dev/docs/apps/build/webhooks/subscribe/https:
 *  - Header: X-Shopify-Hmac-Sha256 (base64-encoded)
 *  - Algorithm: HMAC-SHA256
 *  - Secret: the webhook signing secret (env: SHOPIFY_WEBHOOK_SECRET).
 *    For per-subscription webhooks created via webhookSubscriptionCreate this
 *    is the secret value returned at creation time. For app-managed webhooks
 *    it's the app's API client secret. We use the dedicated env var either way.
 *  - Body: must be the RAW request bytes — verify BEFORE JSON.parse.
 *  - Comparison: constant-time via crypto.timingSafeEqual.
 */
import crypto from "node:crypto";
import type { VercelRequest } from "@vercel/node";

/**
 * Read the raw body bytes from a Vercel Node-runtime request.
 * REQUIRES the calling route to set `export const config = { api: { bodyParser: false } }`.
 */
export async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Constant-time HMAC verification. Returns true iff the header HMAC matches
 * the computed digest of the raw body using the configured secret.
 * Returns false on any error (length mismatch, missing header, etc.) so the
 * caller can simply branch on the boolean.
 */
export function verifyShopifyHmac(rawBody: Buffer, headerHmac: string | undefined, secret: string | undefined): boolean {
  if (!headerHmac || !secret) return false;
  let computed: string;
  try {
    computed = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  } catch {
    return false;
  }
  const a = Buffer.from(headerHmac, "utf8");
  const b = Buffer.from(computed, "utf8");
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
