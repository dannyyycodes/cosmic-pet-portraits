import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[TRACK-REFERRAL] ${step}`, details ? JSON.stringify(details) : '');
};

// Input validation schema
const referralSchema = z.object({
  referralCode: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, "Invalid referral code format"),
  sessionId: z.string().min(10).max(255),
  amount: z.number().int().min(1).max(100000000), // Max $1M in cents
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate input
    const rawInput = await req.json();
    const input = referralSchema.parse(rawInput);

    logStep("Input validated", { hasReferralCode: true, hasSessionId: true });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Missing Stripe configuration");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // SECURITY: Verify the Stripe session is actually paid
    try {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      
      if (session.payment_status !== 'paid') {
        logStep("Session not paid", { status: session.payment_status });
        return new Response(JSON.stringify({ 
          success: false, 
          reason: 'Payment not completed' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } catch (stripeError) {
      logStep("Invalid Stripe session");
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Invalid session' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // SECURITY: Check if this session was already tracked (prevent double-dipping)
    const { data: existingReferral } = await supabaseClient
      .from('affiliate_referrals')
      .select('id')
      .eq('stripe_session_id', input.sessionId)
      .single();

    if (existingReferral) {
      logStep("Session already tracked");
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'Already tracked' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Processing referral");

    // Find affiliate by referral code
    const { data: affiliate, error: affError } = await supabaseClient
      .from('affiliates')
      .select('id, commission_rate')
      .eq('referral_code', input.referralCode)
      .eq('status', 'active')
      .single();

    if (affError || !affiliate) {
      logStep("Affiliate not found or inactive");
      return new Response(JSON.stringify({ success: false, reason: 'Invalid referral code' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate commission
    const commissionAmount = Math.round(input.amount * affiliate.commission_rate);

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
        stripe_session_id: input.sessionId,
        amount_cents: input.amount,
        commission_cents: commissionAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (refError) {
      logStep("Failed to record referral");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // SECURITY FIX: Use atomic increment to prevent race conditions
    const { error: updateError } = await supabaseClient.rpc(
      'increment_affiliate_stats',
      {
        p_affiliate_id: affiliate.id,
        p_commission_cents: commissionAmount
      }
    );

    if (updateError) {
      logStep("Failed to update affiliate stats (atomic)", updateError);
      // Note: referral was already recorded, so we don't fail the whole request
    }

    logStep("Referral tracked successfully");

    return new Response(JSON.stringify({
      success: true,
      referralId: referral.id,
      commission: commissionAmount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logStep("Validation error");
      return new Response(JSON.stringify({ 
        error: "Invalid request"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("ERROR");
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});