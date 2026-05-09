/**
 * Currency detection + formatting for the Stripe credits funnel.
 *
 * Single source of truth for what currency a customer pays in. Detection
 * cascade:
 *   1. Manual override cookie `ls.currency` (set by user-clicked toggle).
 *   2. Server-detected via /api/currency-detect (reads Vercel's
 *      x-vercel-ip-country header).
 *   3. Fallback to GBP.
 *
 * Why a cookie + a fetch (not just localStorage): cookies survive private
 * browsing better than localStorage on Safari, and the override is small
 * (3 chars). The server fetch is one-shot per page load, cached.
 *
 * The corresponding backend Stripe price IDs live in api/_lib/stripe.ts
 * (priceIdForSku(sku, currency)). The display amounts here MUST stay in
 * sync with the Stripe dashboard — change Stripe first, then this file.
 */

export type Currency = "GBP" | "USD";

export const CURRENCY_LABEL: Record<Currency, string> = {
  GBP: "GBP",
  USD: "USD",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  GBP: "£",
  USD: "$",
};

// Display prices per sku × currency. KEEP IN SYNC with Stripe dashboard
// + api/_lib/stripe.ts. Values are major units (not cents/pence).
export const SKU_DISPLAY_PRICE: Record<"pack" | "pass" | "elite", Record<Currency, number>> = {
  pack:  { GBP: 4.99,  USD: 5.99 },
  pass:  { GBP: 8.99,  USD: 11.99 },
  elite: { GBP: 17.99, USD: 22.99 },
};

const COOKIE_NAME = "ls.currency";
const COOKIE_MAX_AGE_DAYS = 365;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 86400 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function isCurrency(s: string | null | undefined): s is Currency {
  return s === "GBP" || s === "USD";
}

/** Read the manual override (if user clicked the GBP/USD toggle). */
export function getManualCurrencyOverride(): Currency | null {
  const raw = readCookie(COOKIE_NAME);
  return isCurrency(raw) ? raw : null;
}

/** Set + persist the manual override. Reload caller to apply. */
export function setManualCurrencyOverride(currency: Currency): void {
  writeCookie(COOKIE_NAME, currency, COOKIE_MAX_AGE_DAYS);
}

/** Clear the manual override (re-enable auto-detect). */
export function clearManualCurrencyOverride(): void {
  writeCookie(COOKIE_NAME, "", -1);
}

/**
 * Resolve currency for the current visitor. Always returns a value:
 *   1. Manual override cookie (instant, no network)
 *   2. Server-detected via /api/currency-detect (one fetch)
 *   3. Fallback to GBP if anything fails
 *
 * Caller should call once per page mount (in useEffect) and cache the
 * result in component state.
 */
export async function detectCurrency(): Promise<{ currency: Currency; source: "manual" | "geo" | "fallback"; country?: string }> {
  const manual = getManualCurrencyOverride();
  if (manual) return { currency: manual, source: "manual" };

  try {
    const r = await fetch("/api/currency-detect", { credentials: "omit" });
    if (r.ok) {
      const data = (await r.json()) as { currency?: string; country?: string };
      if (isCurrency(data.currency)) {
        return { currency: data.currency, source: "geo", country: data.country };
      }
    }
  } catch {
    /* network blip — fall through to GBP */
  }
  return { currency: "GBP", source: "fallback" };
}

/** Format a major-unit amount as "£8.99" / "$11.99". */
export function formatPrice(amount: number, currency: Currency): string {
  return `${CURRENCY_SYMBOL[currency]}${amount.toFixed(2)}`;
}
