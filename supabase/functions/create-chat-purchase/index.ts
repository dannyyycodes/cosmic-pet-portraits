import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { normalizeCurrency } from "../_shared/pricing.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// SoulSpeak prices — same minor-unit amount across currencies (e.g. £7.99,
// €7.99, $7.99). If we later want psych-pricing per region, add per-currency
// tables here mirroring PRICING in _shared/pricing.ts.
const creditTiers = {
  small:  { credits: 750,  price: 799,  name: "SoulSpeak — Top Up",    desc: "750 credits of SoulSpeak" },
  medium: { credits: 2500, price: 1999, name: "SoulSpeak — Deep Talk", desc: "2,500 credits of SoulSpeak" },
};
const MEMBERSHIP_PRICE = 1299;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { orderId, type, currency: rawCurrency } = await req.json();
    const baseUrl = req.headers.get("origin") || "https://littlesouls.app";
    const currency = normalizeCurrency(rawCurrency);

    // Handle membership subscription
    if (type === "membership") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        currency,
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: "SoulSpeak — Soul Bond",
              description: "1,000 credits (~20 messages) per week, cancel anytime",
            },
            unit_amount: MEMBERSHIP_PRICE,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        metadata: { orderId, type: "chat_subscription", weekly_credits: "1000", currency },
        success_url: `${baseUrl}/soul-chat.html?id=${orderId}&purchased=credits`,
        cancel_url: `${baseUrl}/soul-chat.html?id=${orderId}`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Handle one-time credit purchases
    const tier = creditTiers[type as keyof typeof creditTiers];
    if (!tier) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency,
      line_items: [{
        price_data: {
          currency,
          product_data: { name: tier.name, description: tier.desc },
          unit_amount: tier.price,
        },
        quantity: 1,
      }],
      metadata: { orderId, type: "chat_credits", credits: String(tier.credits), currency },
      success_url: `${baseUrl}/soul-chat.html?id=${orderId}&purchased=credits`,
      cancel_url: `${baseUrl}/soul-chat.html?id=${orderId}`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat purchase error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
