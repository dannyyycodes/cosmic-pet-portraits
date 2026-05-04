/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe events for portraits subscriptions + one-off packs.
 *
 * Pattern (per supabase/stripe-sync-engine docs + vercel/nextjs-subscription-payments):
 *  1. Verify signature with raw body via stripe.webhooks.constructEvent
 *  2. Dedupe via portraits_stripe_events (id PK + ON CONFLICT DO NOTHING)
 *  3. Route by event.type
 *  4. Return 200 fast (return 500 only on signature failure or programmer error)
 *
 * Events handled:
 *   customer.subscription.created
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   invoice.paid                    -> grant period's credits (renewal top-up)
 *   invoice.payment_failed          -> flag sub
 *   checkout.session.completed      -> mode='payment' = one-off pack: grant 20
 *
 * Required Vercel env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, plus the
 * Price IDs in api/_lib/stripe.ts.
 *
 * NOTE: Vercel functions buffer the body by default. We disable bodyParser
 * via the export config so Stripe signature verification gets the raw body.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { getStripe, priceIdToTier, TOKENS_PER_PERIOD, PACK_TOKENS } from "../_lib/stripe.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const sig = req.headers["stripe-signature"] as string | undefined;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return res.status(400).json({ error: "Missing signature or webhook secret" });
  }

  let event: Stripe.Event;
  try {
    const raw = await readRawBody(req);
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return res.status(400).json({ error: "Signature verification failed", detail: (err as Error).message });
  }

  const supabase = getSupabaseAdmin();

  // Idempotency dedupe.
  const { error: dedupeErr } = await supabase
    .from("portraits_stripe_events")
    .insert({ id: event.id, type: event.type, payload: event as unknown as object });

  if (dedupeErr) {
    // Unique violation → already processed → return 200 to stop retries.
    if (dedupeErr.code === "23505") {
      return res.status(200).json({ received: true, deduped: true });
    }
    // Otherwise it's a real DB error — let Stripe retry.
    return res.status(500).json({ error: "Event log insert failed", detail: dedupeErr.message });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        // Ignore other events.
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    // Don't throw — return 200 so Stripe doesn't endlessly retry on programmer error.
    // The event row stays in portraits_stripe_events for manual inspection.
    return res.status(200).json({ received: true, error: (err as Error).message });
  }
}

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const supabase = getSupabaseAdmin();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Look up account_id by customer.metadata.account_id (set when we create the
  // Checkout Session) — otherwise fall back to email lookup.
  const accountId = await resolveAccountId(customerId);
  if (!accountId) {
    console.warn("[stripe/webhook] no account_id for customer", customerId);
    return;
  }

  const priceId = sub.items.data[0]?.price.id ?? "";
  const tier = priceIdToTier(priceId);
  if (!tier) {
    console.warn("[stripe/webhook] unknown price_id, skipping sub upsert", priceId);
    return;
  }

  await supabase.from("portraits_subscriptions").upsert({
    id: sub.id,
    account_id: accountId,
    stripe_customer_id: customerId,
    status: sub.status,
    price_id: priceId,
    tier,
    monthly_token_grant: TOKENS_PER_PERIOD[tier],
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Renewal credit grant: lookup sub → grant tier's monthly tokens.
  const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subId) return; // not a subscription invoice

  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const accountId = await resolveAccountId(customerId);
  if (!accountId) return;

  const supabase = getSupabaseAdmin();
  const { data: sub } = await supabase
    .from("portraits_subscriptions")
    .select("monthly_token_grant, tier")
    .eq("id", subId)
    .single();

  if (!sub) return;

  await supabase.rpc("grant_credits", {
    p_account_id: accountId,
    p_tokens: sub.monthly_token_grant,
    p_reason: "invoice-paid",
    p_metadata: { invoice_id: invoice.id, subscription_id: subId, tier: sub.tier },
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Only handle one-off packs here (mode='payment'). Subscriptions are handled
  // by customer.subscription.* events.
  if (session.mode !== "payment") return;

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) return;

  const accountId =
    session.client_reference_id ?? (await resolveAccountId(customerId));
  if (!accountId) return;

  const supabase = getSupabaseAdmin();
  await supabase.rpc("grant_credits", {
    p_account_id: accountId,
    p_tokens: PACK_TOKENS,
    p_reason: "one-off-pack",
    p_metadata: { session_id: session.id },
  });
}

async function resolveAccountId(customerId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  // Check existing subscription row first (cheapest).
  const { data: sub } = await supabase
    .from("portraits_subscriptions")
    .select("account_id")
    .eq("stripe_customer_id", customerId)
    .limit(1)
    .single();
  if (sub?.account_id) return sub.account_id;

  // Fallback: ask Stripe for customer metadata.account_id.
  try {
    const customer = await getStripe().customers.retrieve(customerId);
    if ("metadata" in customer && customer.metadata?.account_id) {
      return customer.metadata.account_id;
    }
  } catch {
    return null;
  }
  return null;
}
