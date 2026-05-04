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
import { getStripe, PRICES } from "./_lib/stripe.js";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const action = req.query.action;
  switch (action) {
    case "checkout":
      return handleCheckout(req, res);
    case "portal":
      return handlePortal(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}. Valid: checkout|portal` });
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

  const { sku } = (req.body ?? {}) as { sku?: string };
  if (!sku) return res.status(400).json({ error: "sku required" });

  let priceId: string; let mode: "subscription" | "payment";
  if (sku === "pass")  { priceId = PRICES.passMonthly;  mode = "subscription"; }
  else if (sku === "elite") { priceId = PRICES.eliteMonthly; mode = "subscription"; }
  else if (sku === "pack")  { priceId = PRICES.pack20;       mode = "payment"; }
  else return res.status(400).json({ error: `Unknown sku: ${sku}` });
  if (!priceId) return res.status(500).json({ error: `Price id not configured for sku ${sku}` });

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

  const origin = req.headers.origin ?? "https://littlesouls.app";
  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    automatic_tax: { enabled: true },
    success_url: `${origin}/portraits/studio?checkout=success&sku=${sku}`,
    cancel_url:  `${origin}/unlimited?checkout=cancelled`,
    ...(mode === "subscription" ? { subscription_data: { metadata: { account_id: user.id } } } : {}),
  });

  return res.status(200).json({ url: session.url });
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
    return_url: `${origin}/portraits/studio`,
  });

  return res.status(200).json({ url: session.url });
}
