/**
 * SSR-safe cart-id persistence — pattern lifted from nathanmcmullendev/ecommerce-react.
 *
 * Cart lifecycle: cartCreate returns a cart id. We persist it locally so
 * subsequent line-adds reuse the same cart. Shopify cart ids expire after
 * 10 days of inactivity; treat 404 from cartLinesAdd as "create a new cart".
 */
const KEY = "ls.portraits.cartId";

export function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setStoredCartId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* quota / private mode — silent */
  }
}

export function clearStoredCartId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* silent */
  }
}
