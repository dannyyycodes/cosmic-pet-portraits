/**
 * Stripe SDK singleton + Price ID map.
 *
 * Set Price IDs in GBP from day one — Stripe Customer is currency-locked
 * after first invoice. Configure on Stripe Dashboard, then paste the IDs
 * here (or pull from env at deploy time, recommended below).
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY env not configured");
  _stripe = new Stripe(key, {
    apiVersion: "2024-11-20.acacia" as Stripe.LatestApiVersion,
    typescript: true,
    // Vercel cold-starts can stretch the first network round-trip; bumping
    // the per-call timeout + adding a couple of automatic retries makes the
    // checkout-session create resilient instead of throwing
    // StripeConnectionError after a transient hiccup.
    timeout: 30_000,
    maxNetworkRetries: 2,
  });
  return _stripe;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Locked Price IDs. One per (tier × currency) combination — Stripe Customer
 * is currency-locked after first invoice, so a US buyer subscribing on the
 * GBP price would either fail or settle in GBP with a surprise FX rate.
 *
 * Override per-env via Vercel env vars. Missing IDs cause the relevant
 * endpoint to 500 — fail-fast in deploy.
 *
 * The legacy aliases (`passMonthly`, `eliteMonthly`, `pack20`) point at the
 * GBP IDs for backwards-compat with callers that haven't been updated.
 * Prefer priceIdForSku(sku, currency) in new code.
 */
export const PRICES = {
  // GBP
  passMonthlyGbp: process.env.STRIPE_PRICE_PASS_GBP ?? "",   // £8.99/mo,  +25 credits/period
  eliteMonthlyGbp: process.env.STRIPE_PRICE_ELITE_GBP ?? "", // £17.99/mo, +75 credits/period
  pack20Gbp: process.env.STRIPE_PRICE_PACK_GBP ?? "",        // £4.99 one-off, +5 credits

  // USD — set in Vercel env once Stripe has the matching prices created.
  passMonthlyUsd: process.env.STRIPE_PRICE_PASS_USD ?? "",
  eliteMonthlyUsd: process.env.STRIPE_PRICE_ELITE_USD ?? "",
  pack20Usd: process.env.STRIPE_PRICE_PACK_USD ?? "",

  // Legacy GBP aliases — deprecated, prefer the *Gbp variants above.
  passMonthly: process.env.STRIPE_PRICE_PASS_GBP ?? "",
  eliteMonthly: process.env.STRIPE_PRICE_ELITE_GBP ?? "",
  pack20: process.env.STRIPE_PRICE_PACK_GBP ?? "",
} as const;

export type SubTier = "pass" | "elite";
export type SubSku = "pass" | "elite" | "pack";
export type Currency = "GBP" | "USD";

// 1 token = 1 generation (one full-size portrait). Locked 2026-05-06.
// Per-period grants give the same generation count as advertised in TopUpPlans.
export const TOKENS_PER_PERIOD: Record<SubTier, number> = {
  pass: 25,
  elite: 75,
};
export const PACK_TOKENS = 5;

/**
 * Resolve the Stripe price ID for a (sku, currency) pair. Currency falls
 * back to GBP if not provided. Returns "" if the env var isn't set so the
 * caller can produce a clean 500 with a recognisable message.
 */
export function priceIdForSku(sku: SubSku, currency: Currency = "GBP"): string {
  if (currency === "USD") {
    if (sku === "pass") return PRICES.passMonthlyUsd;
    if (sku === "elite") return PRICES.eliteMonthlyUsd;
    return PRICES.pack20Usd;
  }
  if (sku === "pass") return PRICES.passMonthlyGbp;
  if (sku === "elite") return PRICES.eliteMonthlyGbp;
  return PRICES.pack20Gbp;
}

export function priceIdToTier(priceId: string): SubTier | null {
  if (priceId === PRICES.passMonthlyGbp || priceId === PRICES.passMonthlyUsd) return "pass";
  if (priceId === PRICES.eliteMonthlyGbp || priceId === PRICES.eliteMonthlyUsd) return "elite";
  return null;
}
