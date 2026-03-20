import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const creditTiers = {
  small:  { credits: 300,  price: 799,  name: "SoulSpeak — Continue",  desc: "300 credits of SoulSpeak" },
  medium: { credits: 1000, price: 1999, name: "SoulSpeak — Deep Bond", desc: "1,000 credits of SoulSpeak" },
};

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

    const { orderId, type } = await req.json();
    const baseUrl = req.headers.get("origin") || "https://littlesouls.app";

    // Handle membership subscription
    if (type === "membership") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: "SoulSpeak — Soul Bond",
              description: "40 messages per week, cancel anytime",
            },
            unit_amount: 1299,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        metadata: { orderId, type: "chat_subscription", weekly_credits: "400" },
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
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: tier.name, description: tier.desc },
          unit_amount: tier.price,
        },
        quantity: 1,
      }],
      metadata: { orderId, type: "chat_credits", credits: String(tier.credits) },
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
