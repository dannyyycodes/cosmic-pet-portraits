import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizeCurrency } from "../_shared/pricing.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Stripe Price IDs — multi-currency is handled via currency_options on each
// Price (set once via scripts/stripe-horoscope-multi-currency.ts). Passing
// `currency: "gbp"` in the session tells Stripe to use the GBP option.
const PRICES = {
  monthly: "price_1Sfi1vEFEZSdxrGttpk4iUEa", // $4.99/mo + currency_options
  yearly: "price_1SgAP6EFEZSdxrGtiHMgxqx2",   // $39.99/yr + currency_options
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { email, petReportId, petName, plan = "monthly", currency: rawCurrency } = await req.json();

    if (!email || !petReportId || !petName) {
      throw new Error("Missing required fields: email, petReportId, petName");
    }

    const currency = normalizeCurrency(rawCurrency);
    console.log("[HOROSCOPE-SUB] Creating subscription for:", { email, petName, petReportId, plan, currency });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[HOROSCOPE-SUB] Found existing customer:", customerId);
    } else {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      console.log("[HOROSCOPE-SUB] Created new customer:", customerId);
    }

    const priceId = plan === "yearly" ? PRICES.yearly : PRICES.monthly;

    // Create checkout session for subscription with FIRST MONTH FREE
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      currency,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30, // First month FREE
        metadata: {
          petReportId,
          petName,
          email,
        },
      },
      success_url: `${req.headers.get("origin")}/horoscope-success?session_id={CHECKOUT_SESSION_ID}&pet=${encodeURIComponent(petName)}`,
      cancel_url: `${req.headers.get("origin")}/view-report?reportId=${petReportId}`,
      metadata: {
        petReportId,
        petName,
        email,
        type: "horoscope_subscription",
        plan,
        currency,
      },
    });

    console.log("[HOROSCOPE-SUB] Created checkout session:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[HOROSCOPE-SUB] Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
