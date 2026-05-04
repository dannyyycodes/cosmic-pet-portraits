/**
 * Shopify Admin API helper — server-only.
 *
 * Auth model (per vault credentials note 2026-05-02):
 *   Static shpat_ tokens deprecated. Use Client Credentials grant to exchange
 *   Client ID + Secret for a 24h access token.
 *
 * In-process token cache: each Vercel function instance keeps its token until
 *   ~5 min before expiry. Cold starts re-fetch. Token grant takes ~150-300ms.
 *
 * Required env (already in ~/.codex/global.env, must also be set in Vercel):
 *   SHOPIFY_STORE_DOMAIN     e.g. littlesouls-3.myshopify.com
 *   SHOPIFY_CLIENT_ID
 *   SHOPIFY_CLIENT_SECRET
 *   SHOPIFY_API_VERSION      e.g. 2025-10
 */

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-10";

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

let cached: CachedToken | null = null;

export function shopifyConfigured(): boolean {
  return Boolean(STORE_DOMAIN && CLIENT_ID && CLIENT_SECRET);
}

export async function getAdminToken(): Promise<string> {
  if (!shopifyConfigured()) {
    throw new Error("Shopify env not configured (SHOPIFY_STORE_DOMAIN/CLIENT_ID/CLIENT_SECRET).");
  }

  const now = Date.now();
  if (cached && cached.expiresAtMs > now + 60_000) {
    return cached.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
  });

  const res = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify token grant failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  const ttlSec = data.expires_in ?? 86399;
  cached = {
    accessToken: data.access_token,
    expiresAtMs: now + ttlSec * 1000,
  };
  return cached.accessToken;
}

// ─── Draft orders ──────────────────────────────────────────────────────
export interface DraftOrderLineProperty {
  name: string;
  value: string;
}

/**
 * Two flavours of line item:
 *  - Variant-keyed (preferred): pass `variantId` — Shopify pulls title/price/SKU
 *    from the catalog. Required for Gelato app auto-fulfillment.
 *  - Custom-priced: pass `title` + `price` for one-off items with no SKU
 *    (e.g. Soul Edition add-on, which has no Gelato product behind it).
 */
export interface DraftOrderLineItem {
  variantId?: number;
  title?: string;
  price?: string; // string per Shopify REST contract (e.g. "99.00")
  quantity: number;
  properties?: DraftOrderLineProperty[];
}

export interface DraftOrderInput {
  lineItems: DraftOrderLineItem[];
  /** ISO 4217 e.g. "GBP", "USD". Defaults to store presentment currency. */
  currency?: string;
  /** Optional: pre-fill customer email at checkout. */
  email?: string;
  /** Internal note attached to the draft (visible to merchant only). */
  note?: string;
}

export interface DraftOrderResult {
  id: number;
  invoiceUrl: string;
  name: string; // e.g. "#D1"
  totalPrice: string;
}

export async function createDraftOrder(input: DraftOrderInput): Promise<DraftOrderResult> {
  const token = await getAdminToken();

  const body = {
    draft_order: {
      line_items: input.lineItems.map((li) => {
        if (li.variantId) {
          // Variant-keyed: Shopify resolves title/price/SKU from catalog. This
          // is what the Gelato app needs to recognise the line for fulfillment.
          return {
            variant_id: li.variantId,
            quantity: li.quantity,
            properties: li.properties ?? [],
          };
        }
        // Custom-priced fallback (Soul Edition add-on, etc.)
        return {
          title: li.title,
          price: li.price,
          quantity: li.quantity,
          properties: li.properties ?? [],
        };
      }),
      ...(input.currency ? { presentment_currency: input.currency } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.note ? { note: input.note } : {}),
      // use_customer_default_address omitted — guest checkout flow
    },
  };

  const res = await fetch(
    `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/draft_orders.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify draft_orders.create failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    draft_order: { id: number; invoice_url: string; name: string; total_price: string };
  };
  return {
    id: data.draft_order.id,
    invoiceUrl: data.draft_order.invoice_url,
    name: data.draft_order.name,
    totalPrice: data.draft_order.total_price,
  };
}
