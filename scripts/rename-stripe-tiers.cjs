/**
 * Rename Stripe products to match the UI tier labels.
 *
 * Usage:
 *   node scripts/rename-stripe-tiers.cjs
 *
 * Loads .env.local via dotenv, resolves each Price ID -> Product,
 * shows current product name, updates to target if different.
 * Renaming is non-destructive: existing subs pick up the new name on
 * next invoice.
 */
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env.production") });
require("dotenv").config({ path: require("path").resolve(process.cwd(), ".env.local") });
const Stripe = require("stripe");

const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) {
  console.error("STRIPE_SECRET_KEY missing. Run with --env-file=.env.local");
  process.exit(1);
}
const stripe = Stripe(SECRET);

const TARGETS = [
  { priceEnv: "STRIPE_PRICE_PACK_GBP",  name: "Pack of 5", desc: "5 full-size pawtraits, one-off." },
  { priceEnv: "STRIPE_PRICE_PASS_GBP",  name: "Pass",      desc: "25 pawtraits per month." },
  { priceEnv: "STRIPE_PRICE_ELITE_GBP", name: "Enthusiast", desc: "75 pawtraits per month for the seriously obsessed." },
];

(async () => {
  for (const t of TARGETS) {
    const priceId = process.env[t.priceEnv];
    if (!priceId) { console.log("- " + t.priceEnv + " not set, skipping"); continue; }

    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product);
    const currentName = product.name;
    const currentDesc = product.description || "";

    const nameChange = currentName !== t.name;
    const descChange = currentDesc !== t.desc;

    if (!nameChange && !descChange) {
      console.log("OK " + product.id + " '" + currentName + "' (no change)");
      continue;
    }

    const updates = {};
    if (nameChange) updates.name = t.name;
    if (descChange) updates.description = t.desc;

    await stripe.products.update(product.id, updates);
    console.log("UPDATED " + product.id);
    if (nameChange) console.log("  name: '" + currentName + "' -> '" + t.name + "'");
    if (descChange) console.log("  desc: '" + currentDesc + "' -> '" + t.desc + "'");
  }
})().catch(e => { console.error(e.message); process.exit(1); });
