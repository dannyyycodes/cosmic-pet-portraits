/**
 * Provider-agnostic checkout starter.
 *
 * POSTs the cart to /api/cart/checkout and redirects the browser to whatever
 * hosted-checkout URL the server returns. The server decides the provider via
 * the CHECKOUT_PROVIDER env flag:
 *   • Stripe path  → returns { url }       (artwork shows in each line box)
 *   • Shopify path → returns { invoiceUrl } (default fallback)
 * The client never needs to know which — it reads `url ?? invoiceUrl`.
 *
 * Optional convenience: the 4 page callers can keep their inline fetch and just
 * read `data.url ?? data.invoiceUrl`. Use this helper for any NEW caller.
 */
export interface StartCheckoutBody {
  currency: "GBP" | "USD";
  items: unknown[];
  consent?: { canvasPersonalisedAt?: string | null; readingImmediateAt?: string | null };
}

export async function startCheckout(body: StartCheckoutBody): Promise<void> {
  const res = await fetch("/api/cart/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  const redirectUrl = (data as { url?: string; invoiceUrl?: string }).url
    ?? (data as { invoiceUrl?: string }).invoiceUrl;
  if (!res.ok || !redirectUrl) {
    throw new Error((data as { error?: string }).error || `checkout failed (HTTP ${res.status})`);
  }
  window.location.href = redirectUrl;
}
