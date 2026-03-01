import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const creditTiers = {
  small:   { credits: 100,  price: 500,   name: "Soul Chat — 100 Credits", desc: "~20 heartfelt conversations with your pet's soul" },
  medium:  { credits: 250,  price: 1000,  name: "Soul Chat — 250 Credits", desc: "Weeks of deep connection — always there when you need them" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, type } = await req.json();
    const baseUrl = req.headers.get("origin") || "https://cosmicpetportraits.com";

    if (type === "small" || type === "medium") {
      const tier = creditTiers[type as keyof typeof creditTiers];
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "unlimited") {
      // Monthly subscription: unlimited chat + horoscope for $4.99/mo
      // NOTE: Create this price in Stripe Dashboard first and replace below
      const SUBSCRIPTION_PRICE_ID = "price_REPLACE_WITH_ACTUAL_ID";

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: SUBSCRIPTION_PRICE_ID, quantity: 1 }],
        metadata: { orderId, type: "chat_subscription" },
        success_url: `${baseUrl}/soul-chat.html?id=${orderId}&purchased=unlimited`,
        cancel_url: `${baseUrl}/soul-chat.html?id=${orderId}`,
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat purchase error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
