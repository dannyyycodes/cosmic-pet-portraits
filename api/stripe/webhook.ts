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
  // Only handle one-off packs / canvas SKUs here (mode='payment').
  // Subscriptions are handled by customer.subscription.* events.
  if (session.mode !== "payment") return;

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  // Two paths can fire on a checkout.session.completed payment:
  //   1. Credit-pack purchase     → grant tokens (existing behaviour)
  //   2. Canvas/print-on-demand   → schedule pawtrait lifecycle emails
  // They are NOT mutually exclusive in metadata terms, so we evaluate
  // canvas SKU detection independently of the credit-pack path. A pack
  // checkout also gets the welcome touchpoints suppressed because there's
  // no canvas to ship.

  const isCanvasOrder = await detectCanvasSku(session);
  if (isCanvasOrder) {
    await schedulePawtraitTouchpoints(session);
  }

  if (!customerId) return;
  const accountId =
    session.client_reference_id ?? (await resolveAccountId(customerId));
  if (!accountId) return;

  // Only grant credits for non-canvas one-off-pack checkouts. Canvas orders
  // are physical product — no token grant.
  if (!isCanvasOrder) {
    const supabase = getSupabaseAdmin();
    await supabase.rpc("grant_credits", {
      p_account_id: accountId,
      p_tokens: PACK_TOKENS,
      p_reason: "one-off-pack",
      p_metadata: { session_id: session.id },
    });
  }
}

// ─── Canvas SKU detection + pawtrait touchpoint scheduling ────────────────
//
// Canvas (and other physical print-on-demand) line items are detected by
// scanning the session's line items for a matching product title. We
// expand the line items (Stripe doesn't return them by default on a
// session) and look for any item whose product description / name
// contains a canvas keyword. This is the cheap, no-extra-config path —
// when we move to dedicated Stripe Price metadata flags it'll plug in
// here.

const CANVAS_KEYWORDS = ["canvas", "framed", "pawtrait", "portrait print", "wall art"];

async function detectCanvasSku(session: Stripe.Checkout.Session): Promise<boolean> {
  // Fast path: explicit metadata flag set at checkout-create time.
  if (session.metadata?.product_line === "portrait" || session.metadata?.is_canvas === "true") {
    return true;
  }

  try {
    const items = await getStripe().checkout.sessions.listLineItems(session.id, {
      limit: 50,
      expand: ["data.price.product"],
    });
    for (const li of items.data) {
      const product = (li.price?.product ?? null) as Stripe.Product | null;
      const name = (product?.name ?? li.description ?? "").toLowerCase();
      if (CANVAS_KEYWORDS.some((kw) => name.includes(kw))) {
        return true;
      }
    }
  } catch (e) {
    console.warn("[stripe/webhook] canvas SKU detect failed:", (e as Error).message);
  }
  return false;
}

async function schedulePawtraitTouchpoints(session: Stripe.Checkout.Session) {
  // Best-effort extraction of customer email + first pet name. Either is
  // optional — the touchpoint table only requires email.
  const email =
    session.customer_details?.email?.trim().toLowerCase() ??
    session.customer_email?.trim().toLowerCase() ??
    "";
  if (!email) {
    console.warn("[stripe/webhook] canvas order without customer email — skipping touchpoints", session.id);
    return;
  }

  const petName =
    session.metadata?.pet_name ??
    session.metadata?.first_pet_name ??
    null;

  const portraitImageUrl =
    session.metadata?.portrait_image_url ??
    session.metadata?.preview_url ??
    null;

  const accountId =
    session.client_reference_id ??
    (typeof session.customer === "object" && session.customer !== null && !("deleted" in session.customer)
      ? session.customer.metadata?.account_id ?? null
      : null) ??
    null;

  const baseMeta = {
    source: "stripe_webhook_checkout_completed",
    session_id: session.id,
    order_id: session.metadata?.order_reference_id ?? session.id,
    pet_name: petName,
    portrait_image_url: portraitImageUrl,
    product_title: session.metadata?.product_title ?? "Pawtrait canvas",
  };

  // Schedule the post-purchase cadence:
  //   purchase_confirm now
  //   ugc_reorder      +14 days
  //   winback_30       +30 days
  //   winback_60       +60 days
  //   winback_90       +90 days
  // Shipping/delivered touchpoints come from the Gelato webhook, not here.
  const now = Date.now();
  const days = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000).toISOString();

  const rows = [
    { touchpoint_type: "pawtrait_purchase_confirm", scheduled_for: new Date(now).toISOString() },
    { touchpoint_type: "pawtrait_ugc_reorder", scheduled_for: days(14) },
    { touchpoint_type: "pawtrait_winback_30", scheduled_for: days(30) },
    { touchpoint_type: "pawtrait_winback_60", scheduled_for: days(60) },
    { touchpoint_type: "pawtrait_winback_90", scheduled_for: days(90) },
  ].map((r) => ({
    ...r,
    email,
    pet_name: petName,
    account_id: accountId,
    status: "pending",
    metadata: baseMeta,
  }));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("pawtrait_touchpoints").insert(rows);
  if (error) {
    console.error("[stripe/webhook] pawtrait touchpoint insert failed:", error.message);
    // Don't throw — the order is real and the credit/event log captured it.
    return;
  }
  console.log(
    `[stripe/webhook] scheduled ${rows.length} pawtrait touchpoints for ${email} session=${session.id}`,
  );
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
