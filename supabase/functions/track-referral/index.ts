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

    logStep("Input validated", { referralCode: input.referralCode, amount: input.amount });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    logStep("Processing referral", { referralCode: input.referralCode, sessionId: input.sessionId, amount: input.amount });

    // Find affiliate by referral code
    const { data: affiliate, error: affError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('referral_code', input.referralCode)
      .eq('status', 'active')
      .single();

    if (affError || !affiliate) {
      logStep("Affiliate not found or inactive", { referralCode: input.referralCode });
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
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logStep("Validation error", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid input",
        details: error.errors.map(e => e.message).join(", ")
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
