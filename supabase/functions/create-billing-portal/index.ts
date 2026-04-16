// Creates a Stripe Billing Portal session for the signed-in user so they can
// update their payment method, download receipts, and view invoices without
// us having to ship bespoke UI for each.
//
// The customer is looked up by email across the Stripe account. If no customer
// exists yet (user never checked out, or all prior sessions were guest-mode
// with different emails), we return 404 and the client shows a friendly
// "contact support" fallback instead of creating an empty portal.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const corsJson = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Billing not configured" }), { status: 500, headers: corsJson });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), { status: 401, headers: corsJson });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsJson });
    }

    const email = userData.user.email;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-09-30.clover" as Stripe.LatestApiVersion });

    // Find the Stripe customer by email. If more than one exists (a buyer who
    // was registered as a guest twice), prefer the most recently created.
    const customers = await stripe.customers.list({ email, limit: 10 });
    const customer = customers.data.sort((a, b) => b.created - a.created)[0];

    if (!customer) {
      return new Response(
        JSON.stringify({ error: "no_customer", message: "We couldn't find a billing profile for this email yet." }),
        { status: 404, headers: corsJson },
      );
    }

    const returnUrl = `${ALLOWED_ORIGINS[1]}/account?tab=settings`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: corsJson });
  } catch (err: any) {
    console.error("[CREATE-BILLING-PORTAL] Error:", err?.message || err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsJson });
  }
});
