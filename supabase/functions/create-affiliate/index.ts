import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[CREATE-AFFILIATE] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, name, country = 'US' } = await req.json();
    if (!email) throw new Error("Email is required");

    logStep("Creating affiliate account for", { email, name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      country,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        affiliate_name: name || email,
      },
    });

    logStep("Stripe account created", { accountId: account.id });

    // Generate unique referral code
    const referralCode = `${name?.replace(/\s/g, '').toLowerCase().slice(0, 6) || 'ref'}_${Math.random().toString(36).slice(2, 8)}`;

    // Store affiliate in database
    const { data: affiliate, error: dbError } = await supabaseClient
      .from('affiliates')
      .insert({
        email,
        name: name || email,
        stripe_account_id: account.id,
        referral_code: referralCode,
        commission_rate: 0.20, // 20% default commission
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      logStep("Database error", dbError);
      throw new Error("Failed to save affiliate");
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/affiliate/onboarding?refresh=true`,
      return_url: `${origin}/affiliate/dashboard`,
      type: 'account_onboarding',
    });

    logStep("Onboarding link created");

    return new Response(JSON.stringify({
      success: true,
      referralCode,
      onboardingUrl: accountLink.url,
      affiliateId: affiliate.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
