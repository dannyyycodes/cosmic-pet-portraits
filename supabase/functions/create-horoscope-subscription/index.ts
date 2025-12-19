import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pricing options
const PRICES = {
  monthly: "price_1Sfi1vEFEZSdxrGttpk4iUEa", // $4.99/month
  yearly: "price_1SgAP6EFEZSdxrGtiHMgxqx2",   // $39.99/year (33% off)
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, petReportId, petName, plan = "monthly" } = await req.json();
    
    if (!email || !petReportId || !petName) {
      throw new Error("Missing required fields: email, petReportId, petName");
    }

    console.log("[HOROSCOPE-SUB] Creating subscription for:", { email, petName, petReportId, plan });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
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
    
    // Create checkout session for subscription with 7-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
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
      },
    });

    console.log("[HOROSCOPE-SUB] Created checkout session:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[HOROSCOPE-SUB] Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
