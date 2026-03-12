import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const creditTiers = {
  small:  { credits: 30,   price: 799,   name: "SoulSpeak — Continue",           desc: "15 more messages with your pet's soul" },
  medium: { credits: 80,   price: 1499,  name: "SoulSpeak — Deep Bond",          desc: "40 heartfelt conversations" },
  large:  { credits: 200,  price: 2499,  name: "SoulSpeak — Soul Bond",          desc: "100 messages — go as deep as your heart needs" },
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
