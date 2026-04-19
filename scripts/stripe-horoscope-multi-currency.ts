/**
 * One-shot script — add currency_options to the two horoscope Stripe Prices
 * so Stripe honours `currency: "gbp"` (etc.) in subscription Checkout Sessions.
 *
 * Usage:
 *   export STRIPE_SECRET_KEY=sk_live_...
 *   deno run --allow-net --allow-env scripts/stripe-horoscope-multi-currency.ts
 *
 * Safe to re-run — Stripe merges new currency_options into the existing Price.
 * Prices stay in sync with src/lib/pricing.ts.
 */

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
if (!STRIPE_KEY) {
  console.error("Missing STRIPE_SECRET_KEY env var");
  Deno.exit(1);
}

const MONTHLY_PRICE_ID = "price_1Sfi1vEFEZSdxrGttpk4iUEa"; // existing USD $4.99/mo
const YEARLY_PRICE_ID  = "price_1SgAP6EFEZSdxrGtiHMgxqx2"; // existing USD $39.99/yr

// Minor-unit amounts — MIRROR of src/lib/pricing.ts
const MONTHLY = { gbp: 499, eur: 599, aud: 899, cad: 799, nzd: 999 };
const YEARLY  = { gbp: 3999, eur: 4799, aud: 7999, cad: 6999, nzd: 7999 };

async function addCurrencyOptions(priceId: string, opts: Record<string, number>) {
  const body = new URLSearchParams();
  for (const [cur, amount] of Object.entries(opts)) {
    body.set(`currency_options[${cur}][unit_amount]`, String(amount));
  }

  const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe ${res.status}: ${err}`);
  }
  const json = await res.json();
  console.log(`  ✓ ${priceId}`);
  console.log(`    currency_options:`, Object.keys(json.currency_options || {}));
}

console.log("Adding currency_options to horoscope prices…");
console.log(`Monthly → ${MONTHLY_PRICE_ID}`);
await addCurrencyOptions(MONTHLY_PRICE_ID, MONTHLY);
console.log(`Yearly  → ${YEARLY_PRICE_ID}`);
await addCurrencyOptions(YEARLY_PRICE_ID, YEARLY);

console.log("\nDone. Stripe will now honour `currency` in subscription Checkout Sessions.");
