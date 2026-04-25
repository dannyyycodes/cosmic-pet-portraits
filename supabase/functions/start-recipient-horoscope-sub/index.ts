// start-recipient-horoscope-sub
//
// Called from /keep-horoscopes/:subscriptionId when a gift recipient
// wants to keep weekly horoscopes after their 28-day free trial ends.
//
// CRITICAL: this function creates a NEW Stripe customer using the
// RECIPIENT's email — it never reuses the gifter's customer record from
// the original /gift purchase. Reusing it would result in the gifter's
// card getting auto-billed for the recipient's subscription, which is
// the exact wrong outcome.
//
// Flow:
//   1. Look up horoscope_subscriptions row by id (the URL token).
//   2. Validate: is_gift = true, no existing stripe_subscription_id,
//      trial_ends_at not null, status = 'active'.
//   3. Stripe customers.list({ email }) — reuse if a customer record
//      with the recipient's email already exists; otherwise create one.
//   4. Stripe checkout.sessions.create with mode 'subscription', the
//      £4.99 monthly horoscope price, and metadata linking the local
//      horoscope_subscriptions row by id.
//   5. Return the checkout URL — the page redirects the recipient to
//      Stripe's hosted checkout.
//   6. stripe-webhook handles checkout.session.completed: looks up the
//      sub by metadata.gift_horoscope_sub_id, updates it with the new
//      stripe_subscription_id + stripe_customer_id, clears trial_ends_at,
//      stamps converted_at + plan='paid'.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app", "http://localhost:8080"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const HOROSCOPE_PRICE = "price_1Sfi1vEFEZSdxrGttpk4iUEa"; // £4.99 / mo

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!supabaseUrl || !serviceKey || !stripeKey) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const body = await req.json().catch(() => ({}));
    const subscriptionId = (body.subscriptionId || "").trim();
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: "Missing subscriptionId" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: sub, error: subError } = await supabase
      .from("horoscope_subscriptions")
      .select("id, email, pet_name, status, is_gift, trial_ends_at, stripe_subscription_id, occasion_mode")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (subError || !sub) {
      return new Response(JSON.stringify({ error: "Subscription not found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (sub.occasion_mode === "memorial") {
      // Hard guard — memorial subs should never have been created in the
      // first place, but if one slips through this is the last line.
      return new Response(JSON.stringify({ error: "Not available for memorial gifts" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!sub.is_gift) {
      return new Response(JSON.stringify({ error: "Not a gift subscription" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (sub.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "Already subscribed", alreadySubscribed: true }), {
        status: 200, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (sub.status !== "active") {
      return new Response(JSON.stringify({ error: "Subscription is not active" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const recipientEmail = (sub.email || "").toLowerCase().trim();
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Missing recipient email" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Find or create a Stripe customer keyed to the RECIPIENT's email.
    // We never reuse a Stripe customer linked to the gifter's session —
    // that would auto-bill the gifter for the recipient's subscription.
    let customerId: string;
    const existing = await stripe.customers.list({ email: recipientEmail, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const created = await stripe.customers.create({
        email: recipientEmail,
        metadata: {
          source: "gift_horoscope_conversion",
          horoscope_subscription_id: sub.id,
        },
      });
      customerId = created.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: HOROSCOPE_PRICE, quantity: 1 }],
      success_url: `https://www.littlesouls.app/keep-horoscopes/${sub.id}?status=success`,
      cancel_url:  `https://www.littlesouls.app/keep-horoscopes/${sub.id}?status=cancelled`,
      subscription_data: {
        metadata: {
          gift_horoscope_sub_id: sub.id,
          recipient_email: recipientEmail,
          pet_name: sub.pet_name || "",
        },
      },
      metadata: {
        gift_horoscope_sub_id: sub.id,
        recipient_email: recipientEmail,
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[start-recipient-horoscope-sub]", e);
    return new Response(JSON.stringify({ error: (e as Error)?.message || "Unknown error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
