/**
 * /api/stripe — single router for the 2 user-facing Stripe actions.
 *
 *   POST /api/stripe?action=checkout   create Checkout Session for sub or pack
 *   POST /api/stripe?action=portal     create Customer Portal session
 *
 * Webhook stays at /api/stripe/webhook (separate file — needs raw body).
 *
 * Single Serverless Function on Vercel — Hobby plan caps at 12.
 * Consolidated 2026-05-04 from api/stripe/{checkout,portal}.ts.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStripe, priceIdForSku } from "./_lib/stripe.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import {
  buildStripeCartSession,
  cartHasGiftCard,
  CheckoutValidationError,
  type CartItemBody as StripeCartItemBody,
  type ConsentBody as StripeConsentBody,
} from "./_lib/stripeCartCheckout.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const action = req.query.action;
  try {
    switch (action) {
      case "checkout":
        return await handleCheckout(req, res);
      case "portal":
        return await handlePortal(req, res);
      case "cart-checkout":
        return await handleCartCheckout(req, res);
      default:
        return res.status(400).json({ error: `Unknown action: ${action}. Valid: checkout|portal|cart-checkout` });
    }
  } catch (err) {
    // Defensive: ALWAYS return JSON so the client's res.json() doesn't choke
    // on Vercel's HTML 500 page. Surface the FULL Stripe error shape — type,
    // code, statusCode — so the client toast tells us exactly which API call
    // failed and why (vs a generic "connection error").
    const e = err as { type?: string; code?: string; statusCode?: number; message?: string; raw?: { message?: string; type?: string; code?: string } };
    const message = e?.message || (err instanceof Error ? err.message : String(err));
    const stripeType = e?.type || e?.raw?.type;
    const stripeCode = e?.code || e?.raw?.code;
    const stripeStatus = e?.statusCode;
    console.error(
      "[api/stripe] unhandled",
      JSON.stringify({ action, message, stripeType, stripeCode, stripeStatus, stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined }),
    );
    if (!res.headersSent) {
      return res.status(500).json({
        error: message || "Stripe request failed",
        type: stripeType,
        code: stripeCode,
        stripeStatus,
      });
    }
  }
}

async function handleCheckout(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Bearer token required" });
  const token = auth.slice("Bearer ".length);

  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });
  const user = userRes.user;

  const { sku, currency } = (req.body ?? {}) as { sku?: string; currency?: string };
  if (!sku) return res.status(400).json({ error: "sku required" });
  if (sku !== "pass" && sku !== "elite" && sku !== "pack") {
    return res.status(400).json({ error: `Unknown sku: ${sku}` });
  }

  // Currency: default to GBP. USD requires the matching STRIPE_PRICE_*_USD
  // env vars to be configured in Vercel — otherwise priceIdForSku returns ""
  // and we 500 with a recognisable message.
  const cur: "GBP" | "USD" = currency === "USD" ? "USD" : "GBP";
  const priceId = priceIdForSku(sku, cur);
  const mode: "subscription" | "payment" = sku === "pack" ? "payment" : "subscription";
  if (!priceId) {
    return res.status(500).json({ error: `Price id not configured for sku=${sku} currency=${cur}` });
  }

  const stripe = getStripe();
  let customerId: string | null = null;
  const { data: existing } = await supabase
    .from("portraits_subscriptions")
    .select("stripe_customer_id")
    .eq("account_id", user.id)
    .limit(1)
    .single();
  customerId = existing?.stripe_customer_id ?? null;

  if (!customerId) {
    const c = await stripe.customers.create({ email: user.email ?? undefined, metadata: { account_id: user.id } });
    customerId = c.id;
  }

  // automatic_tax requires Stripe Tax fully configured (tax registrations,
  // tax-eligible customer addresses). Until that's wired, default OFF — set
  // STRIPE_AUTOMATIC_TAX=1 in Vercel env to flip on. Without this gate,
  // Stripe returns a tax-not-configured 5xx that the SDK retries until it
  // bubbles up as a confusing "connection error" toast.
  const automaticTaxEnabled = process.env.STRIPE_AUTOMATIC_TAX === "1";

  const origin = req.headers.origin ?? "https://littlesouls.app";
  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(automaticTaxEnabled ? { automatic_tax: { enabled: true } } : {}),
    // Both success + cancel land back on the single landing page. /unlimited
    // was deleted 2026-05-05 — TopUpPlans now lives inline at /pawtraits#topup.
    success_url: `${origin}/pawtraits?checkout=success&sku=${sku}#studio`,
    cancel_url:  `${origin}/pawtraits?checkout=cancelled#topup`,
    ...(mode === "subscription" ? { subscription_data: { metadata: { account_id: user.id } } } : {}),
  });

  return res.status(200).json({ url: session.url });
}

// ─── Stripe-checkout-switch: guest pawtraits cart → Checkout Session ──────
// No auth (guest cart). Lives here (not a new api file) to respect the Vercel
// Hobby 12-function cap. Same validation + server-locked pricing as
// api/cart/checkout.ts via the shared buildStripeCartSession builder.
const CART_CHECKOUT_ALLOWED_ORIGINS = new Set([
  "https://www.littlesouls.app",
  "https://littlesouls.app",
]);

async function handleCartCheckout(req: VercelRequest, res: VercelResponse) {
  const body = (req.body ?? {}) as {
    items?: StripeCartItemBody[];
    consent?: StripeConsentBody;
  };
  // GBP-only: the locked price table is GBP. A client `currency` is ignored.
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return res.status(400).json({ error: "items[] required (at least 1)" });
  }
  if (cartHasGiftCard(body.items)) {
    return res.status(400).json({ error: "gift-card carts must use the Shopify checkout" });
  }

  // Empty when no geo header → resolveZone() fails safe to HIGH (never GB),
  // so a stripped header never under-charges a high-ship buyer.
  const country =
    ((req.headers["x-vercel-ip-country"] as string | undefined) ??
      (req.headers["cf-ipcountry"] as string | undefined) ??
      "") || "";

  const headerOrigin = (req.headers.origin as string | undefined) ?? "";
  const origin = CART_CHECKOUT_ALLOWED_ORIGINS.has(headerOrigin)
    ? headerOrigin
    : process.env.CHECKOUT_RETURN_ORIGIN ?? process.env.PUBLIC_SITE_URL ?? "https://www.littlesouls.app";
  const cartId = `paw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    const { url } = await buildStripeCartSession({
      items: body.items,
      consent: body.consent,
      country,
      origin,
      cartId,
    });
    return res.status(200).json({ url, invoiceUrl: url, itemCount: body.items.length });
  } catch (err) {
    if (err instanceof CheckoutValidationError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err; // bubble to the router's catch → JSON 500
  }
}

async function handlePortal(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Bearer token required" });
  const token = auth.slice("Bearer ".length);

  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return res.status(401).json({ error: "Invalid token" });

  const { data: existing } = await supabase
    .from("portraits_subscriptions")
    .select("stripe_customer_id")
    .eq("account_id", userRes.user.id)
    .limit(1)
    .single();
  if (!existing?.stripe_customer_id) return res.status(404).json({ error: "No Stripe customer for this user" });

  const origin = req.headers.origin ?? "https://littlesouls.app";
  const session = await getStripe().billingPortal.sessions.create({
    customer: existing.stripe_customer_id,
    return_url: `${origin}/pawtraits#topup`,
  });

  return res.status(200).json({ url: session.url });
}
