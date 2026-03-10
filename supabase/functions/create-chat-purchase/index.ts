import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const creditTiers = {
  small:  { credits: 60,   price: 499,   name: "SoulSpeak — Keep Talking",       desc: "30 more messages with your pet's soul" },
  medium: { credits: 150,  price: 999,   name: "SoulSpeak — Talk All Week",      desc: "75 heartfelt conversations" },
  large:  { credits: 400,  price: 1999,  name: "SoulSpeak — Always Connected",   desc: "200 messages — talk whenever your heart needs to" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, type } = await req.json();
    const baseUrl = req.headers.get("origin") || "https://littlesouls.co";

    const tier = creditTiers[type as keyof typeof creditTiers];
    if (!tier) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
