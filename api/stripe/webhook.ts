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
 *   customer.subscription.created/updated/deleted -> upsert portraits_subscriptions
 *   invoice.paid                    -> grant period's credits (renewal top-up)
 *   invoice.payment_failed          -> flip portraits_subscriptions.status='past_due'
 *   payment_intent.payment_failed   -> log (one-off pack pre-checkout failure)
 *   charge.refunded                 -> log (manual credit-clawback by ops)
 *   charge.dispute.created          -> error-log (page ops; respond w/in 7d)
 *   checkout.session.completed      -> credit pack OR pawtrait touchpoint schedule
 *
 * Required Vercel env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, plus the
 * Price IDs in api/_lib/stripe.ts.
 *
 * NOTE: Vercel functions buffer the body by default. We disable bodyParser
 * via the export config so Stripe signature verification gets the raw body.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type Stripe from "stripe";
import { getStripe, priceIdToTier, TOKENS_PER_PERIOD, DOWNLOAD_CREDITS_PER_PERIOD, PACK_TOKENS } from "../_lib/stripe.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { capiPurchase } from "../_lib/metaCapi.js";

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

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        // Fire Meta CAPI Purchase (no-op if META_PIXEL_ID/META_CAPI_TOKEN unset).
        // Wrapped in try/catch so a CAPI failure never causes Stripe to retry the webhook.
        try {
          const amount = session.amount_total ?? 0;
          if (amount > 0) {
            const result = await capiPurchase({
              eventId: session.id,
              eventTimeUnix: typeof session.created === "number" ? session.created : undefined,
              eventSourceUrl: (session.metadata?.event_source_url as string | undefined) ?? "https://www.littlesouls.app/pawtraits",
              value: amount / 100,
              currency: (session.currency ?? "gbp").toUpperCase(),
              user: {
                email: session.customer_details?.email ?? session.customer_email ?? undefined,
                phone: session.customer_details?.phone ?? undefined,
                firstName: session.customer_details?.name?.split(" ")[0],
                lastName: session.customer_details?.name?.split(" ").slice(1).join(" "),
                city: session.customer_details?.address?.city ?? undefined,
                country: session.customer_details?.address?.country ?? undefined,
                clientIpAddress: (session.metadata?.client_ip_address as string | undefined) ?? undefined,
                clientUserAgent: (session.metadata?.client_user_agent as string | undefined) ?? undefined,
                fbp: (session.metadata?.fbp as string | undefined) ?? undefined,
                fbc: (session.metadata?.fbc as string | undefined) ?? undefined,
              },
            });
            if (!result.ok) {
              console.warn("[stripe/webhook] CAPI purchase did not send:", result.error);
            }
          }
        } catch (capiErr) {
          console.warn("[stripe/webhook] CAPI purchase threw (non-fatal):", capiErr);
        }
        break;
      }

      default:
        // Ignore other events.
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    // Return 500 so Stripe retries (up to ~72h via exponential backoff). The
    // previous "return 200 to prevent endless retries on programmer error"
    // was the wrong trade-off: it meant a transient DB blip during a
    // subscription credit grant was lost forever — customer paid, no credits.
    // Programmer errors will surface as repeated 500s in the Stripe dashboard
    // event log instead of silent data loss.
    console.error("[stripe/webhook] handler error — returning 500 so Stripe retries:", {
      eventId: event.id,
      eventType: event.type,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined,
    });
    // Roll back the dedup row so the retry actually re-runs the handler.
    // (Otherwise the dedup catch above would 200 the next attempt.)
    try {
      await supabase.from("portraits_stripe_events").delete().eq("id", event.id);
    } catch {
      /* swallow — better to leave the dedup row than fail the response */
    }
    return res.status(500).json({
      error: "handler_failed",
      detail: err instanceof Error ? err.message : String(err),
    });
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

  const period = sub as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  await supabase.from("portraits_subscriptions").upsert({
    id: sub.id,
    account_id: accountId,
    stripe_customer_id: customerId,
    status: sub.status,
    price_id: priceId,
    tier,
    monthly_token_grant: TOKENS_PER_PERIOD[tier],
    monthly_download_credit_grant: DOWNLOAD_CREDITS_PER_PERIOD[tier],
    current_period_start: new Date((period.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    current_period_end: new Date((period.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  });
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const sub = (invoice as Stripe.Invoice & { subscription?: string | { id?: string } | null }).subscription;
  return typeof sub === "string" ? sub : sub?.id ?? null;
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Renewal credit grant: lookup sub → grant tier's monthly tokens.
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return; // not a subscription invoice

  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const accountId = await resolveAccountId(customerId);
  if (!accountId) return;

  const supabase = getSupabaseAdmin();

  // ── Per-invoice idempotency belt-and-braces ────────────────────────
  // Event-id dedupe (portraits_stripe_events) is the first line of
  // defense, but we DELETE that dedupe row on uncaught handler failure
  // so Stripe will retry. If grant_credits succeeded but a later step
  // in the same handler failed, the retry would double-grant. Check
  // portraits_credit_transactions (append-only audit) for an existing
  // grant carrying this exact invoice_id in its metadata.
  if (invoice.id) {
    const { data: priorGrant } = await supabase
      .from("portraits_credit_transactions")
      .select("id")
      .eq("account_id", accountId)
      .eq("reason", "invoice-paid")
      .eq("metadata->>invoice_id", invoice.id)
      .limit(1);
    if (priorGrant && priorGrant.length > 0) {
      console.log(
        "[stripe/webhook] invoice.paid — already granted for this invoice, skipping",
        JSON.stringify({ invoiceId: invoice.id, accountId }),
      );
      return;
    }
  }

  const { data: sub } = await supabase
    .from("portraits_subscriptions")
    .select("monthly_token_grant, monthly_download_credit_grant, tier")
    .eq("id", subId)
    .single();

  if (!sub) return;

  // Generation tokens — existing behaviour.
  await supabase.rpc("grant_credits", {
    p_account_id: accountId,
    p_tokens: sub.monthly_token_grant,
    p_reason: "invoice-paid",
    p_metadata: { invoice_id: invoice.id, subscription_id: subId, tier: sub.tier },
  });

  // Download credits — new 2026-05-12 benefit. Pass=3/mo, Elite=999/mo. Separate
  // function call so the audit log distinguishes generation tokens from downloads.
  // Skipped if grant is 0 (defensive — old rows / future tier configurations).
  const dlGrant = (sub as { monthly_download_credit_grant?: number }).monthly_download_credit_grant ?? 0;
  if (dlGrant > 0) {
    await supabase.rpc("grant_download_credits", {
      p_account_id: accountId,
      p_amount: dlGrant,
      p_reason: "invoice-paid",
      p_metadata: { invoice_id: invoice.id, subscription_id: subId, tier: sub.tier },
    });
  }
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

// ─── Failure / refund / dispute handlers (added 2026-05-09) ────────────────
//
// These four handlers were missing — the webhook silently no-op'd on
// payment failures, refunds, and chargebacks. Customer paid, card later
// declined, and we kept granting credits / printing canvas / shipping with
// no alert. Now we flip subscription status, log loud, and (for disputes)
// emit a high-severity console.error so Vercel log alerts catch it.

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) {
    console.warn("[stripe/webhook] invoice.payment_failed without subscription id", invoice.id);
    return;
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("portraits_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("id", subId);
  if (error) {
    // Bubble up — caller's catch returns 500 so Stripe retries.
    throw new Error(`portraits_subscriptions past_due update failed: ${error.message}`);
  }
  console.warn(
    "[stripe/webhook] invoice.payment_failed → past_due",
    JSON.stringify({
      invoiceId: invoice.id,
      subscriptionId: subId,
      attempt: invoice.attempt_count ?? 1,
      nextAttempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
    }),
  );
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  // One-off pack purchases use mode='payment'. A failed PI here means a
  // pack-buy attempt failed before checkout completed. No state to roll
  // back (no row was written for an incomplete checkout) — just log loud.
  console.warn(
    "[stripe/webhook] payment_intent.payment_failed",
    JSON.stringify({
      paymentIntentId: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      lastError: pi.last_payment_error?.message ?? null,
      lastErrorCode: pi.last_payment_error?.code ?? null,
      customer: typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
    }),
  );
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Refund triage: log so ops can spot it. We do NOT auto-claw-back credits
  // because (a) tokens may already be spent on generated portraits, (b) for
  // canvas refunds the tokens path is decoupled. Manual intervention from
  // ops via Supabase admin if a refund warrants a credit clawback.
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id ?? null;
  console.warn(
    "[stripe/webhook] charge.refunded — manual review required",
    JSON.stringify({
      chargeId: charge.id,
      paymentIntentId: charge.payment_intent,
      amount: charge.amount_refunded,
      currency: charge.currency,
      customer: customerId,
      reason: charge.refunds?.data[0]?.reason ?? null,
    }),
  );
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  // Chargebacks are EXPENSIVE ($15+ fee even if we win) and time-bounded
  // (typically 7 days to respond). Log loud so Vercel log alerts page ops.
  // No auto-action — disputes need human evidence-gathering response.
  const customerId =
    typeof dispute.charge === "string"
      ? null
      : (dispute.charge as Stripe.Charge | null)?.customer ?? null;
  console.error(
    "[stripe/webhook] CHARGE.DISPUTE.CREATED — respond within 7 days",
    JSON.stringify({
      disputeId: dispute.id,
      chargeId: typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      customer: typeof customerId === "string" ? customerId : customerId?.id ?? null,
      evidenceDueBy: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
    }),
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
