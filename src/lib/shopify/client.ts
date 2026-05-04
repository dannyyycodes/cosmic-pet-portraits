/**
 * Shopify Storefront API client — customer-facing cart + checkout for /portraits.
 *
 * Build plan locked 2026-05-02:
 *   vault/01-projects/little-souls/pet-portraits/build-plan-2026-05-02.md
 *
 * Auth model: this is the public Storefront API, NOT the Admin API.
 *   - Admin API (Client ID/Secret + 24h token) is used server-side for product sync, file uploads, order pull.
 *   - Storefront API uses a long-lived publicAccessToken safe to ship in the browser bundle.
 *
 * NOT YET CONFIGURED: VITE_SHOPIFY_STOREFRONT_TOKEN must be created in
 * Shopify Admin → Apps → Cosmic Pet Portraits Backend → Configuration → Storefront API access.
 * Once minted, drop into .env as VITE_SHOPIFY_STOREFRONT_TOKEN. Domain is already known.
 */
import { createStorefrontApiClient } from "@shopify/storefront-api-client";

const STORE_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN || "littlesouls-3.myshopify.com";
const PUBLIC_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || "";
const API_VERSION = import.meta.env.VITE_SHOPIFY_API_VERSION || "2025-10";

export const shopify = createStorefrontApiClient({
  storeDomain: STORE_DOMAIN,
  apiVersion: API_VERSION,
  publicAccessToken: PUBLIC_TOKEN,
});

export const SHOPIFY_CONFIGURED = Boolean(PUBLIC_TOKEN);

// ─── Types ──────────────────────────────────────────────────────────────
export interface CartLineAttribute {
  key: string;
  value: string;
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes?: CartLineAttribute[];
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { totalAmount: { amount: string; currencyCode: string } };
}

// ─── Mutations ──────────────────────────────────────────────────────────
const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost { totalAmount { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost { totalAmount { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

// ─── Public API ─────────────────────────────────────────────────────────
export async function createCart(lines: CartLineInput[]): Promise<ShopifyCart> {
  if (!SHOPIFY_CONFIGURED) {
    throw new Error("Shopify Storefront token not configured. Set VITE_SHOPIFY_STOREFRONT_TOKEN.");
  }
  const { data, errors } = await shopify.request<{
    cartCreate: { cart: ShopifyCart; userErrors: Array<{ field: string[]; message: string }> };
  }>(CART_CREATE, { variables: { input: { lines } } });

  if (errors) throw new Error(`Shopify cartCreate failed: ${JSON.stringify(errors)}`);
  const userErrors = data?.cartCreate.userErrors ?? [];
  if (userErrors.length) throw new Error(`cartCreate userErrors: ${userErrors.map((e) => e.message).join(", ")}`);
  return data!.cartCreate.cart;
}

export async function addLines(cartId: string, lines: CartLineInput[]): Promise<ShopifyCart> {
  const { data, errors } = await shopify.request<{
    cartLinesAdd: { cart: ShopifyCart; userErrors: Array<{ field: string[]; message: string }> };
  }>(CART_LINES_ADD, { variables: { cartId, lines } });

  if (errors) throw new Error(`Shopify cartLinesAdd failed: ${JSON.stringify(errors)}`);
  const userErrors = data?.cartLinesAdd.userErrors ?? [];
  if (userErrors.length) throw new Error(`cartLinesAdd userErrors: ${userErrors.map((e) => e.message).join(", ")}`);
  return data!.cartLinesAdd.cart;
}
