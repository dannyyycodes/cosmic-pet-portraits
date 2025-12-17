import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[TRACK-REFERRAL] ${step}`, details ? JSON.stringify(details) : '');
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

    const { referralCode, sessionId, amount } = await req.json();
    
    if (!referralCode || !sessionId || !amount) {
      throw new Error("Missing required fields: referralCode, sessionId, amount");
    }

    logStep("Processing referral", { referralCode, sessionId, amount });

    // Find affiliate by referral code
    const { data: affiliate, error: affError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('status', 'active')
      .single();

    if (affError || !affiliate) {
      logStep("Affiliate not found or inactive", { referralCode });
      return new Response(JSON.stringify({ success: false, reason: 'Invalid referral code' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate commission
    const commissionAmount = Math.round(amount * affiliate.commission_rate);

    logStep("Commission calculated", { 
      affiliateId: affiliate.id, 
      rate: affiliate.commission_rate, 
      commission: commissionAmount 
    });

    // Record the referral
    const { data: referral, error: refError } = await supabaseClient
      .from('affiliate_referrals')
      .insert({
        affiliate_id: affiliate.id,
        stripe_session_id: sessionId,
        amount_cents: amount,
        commission_cents: commissionAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (refError) {
      logStep("Failed to record referral", refError);
      throw new Error("Failed to record referral");
    }

    // Update affiliate stats
    await supabaseClient
      .from('affiliates')
      .update({
        total_referrals: affiliate.total_referrals + 1,
        total_earnings_cents: affiliate.total_earnings_cents + commissionAmount,
      })
      .eq('id', affiliate.id);

    logStep("Referral tracked successfully", { referralId: referral.id });

    return new Response(JSON.stringify({
      success: true,
      referralId: referral.id,
      commission: commissionAmount,
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
