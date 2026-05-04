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
  });
  return _stripe;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Locked GBP Price IDs. Override per-env via Vercel env vars.
 * Falsy values cause the relevant endpoint to 500 — fail-fast in deploy.
 */
export const PRICES = {
  passMonthly: process.env.STRIPE_PRICE_PASS_GBP ?? "",   // £8.99/mo, +100 credits/period
  eliteMonthly: process.env.STRIPE_PRICE_ELITE_GBP ?? "", // £17.99/mo, +300 credits/period
  pack20: process.env.STRIPE_PRICE_PACK_GBP ?? "",        // £4.99 one-off, +20 credits
} as const;

export type SubTier = "pass" | "elite";
export const TOKENS_PER_PERIOD: Record<SubTier, number> = {
  pass: 100,
  elite: 300,
};
export const PACK_TOKENS = 20;

export function priceIdToTier(priceId: string): SubTier | null {
  if (priceId === PRICES.passMonthly) return "pass";
  if (priceId === PRICES.eliteMonthly) return "elite";
  return null;
}
