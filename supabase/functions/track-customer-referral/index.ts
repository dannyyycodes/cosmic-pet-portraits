import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralCode, referredEmail, referredReportId } = await req.json();

    console.log("[TRACK-CUSTOMER-REFERRAL] Processing:", { referralCode, referredEmail });

    if (!referralCode || !referredEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if this is an affiliate code first
    const { data: affiliate } = await supabaseClient
      .from("affiliates")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase())
      .single();

    if (affiliate) {
      // This is an affiliate referral, already handled by track-referral
      console.log("[TRACK-CUSTOMER-REFERRAL] This is an affiliate code, skipping");
      return new Response(JSON.stringify({ type: "affiliate", handled: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this is a customer referral code (VIP-XXXX-XXXX format)
    if (!referralCode.startsWith("VIP-")) {
      return new Response(JSON.stringify({ error: "Invalid referral code format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the referrer by their code in email_subscribers
    const { data: referrer } = await supabaseClient
      .from("email_subscribers")
      .select("email, referral_code")
      .eq("referral_code", referralCode)
      .single();

    if (!referrer) {
      console.log("[TRACK-CUSTOMER-REFERRAL] Referrer not found for code:", referralCode);
      return new Response(JSON.stringify({ error: "Referral code not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't allow self-referrals
    if (referrer.email.toLowerCase() === referredEmail.toLowerCase()) {
      console.log("[TRACK-CUSTOMER-REFERRAL] Self-referral attempted");
      return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this person has already been referred
    const { data: existingReferral } = await supabaseClient
      .from("customer_referrals")
      .select("id")
      .eq("referred_email", referredEmail.toLowerCase())
      .single();

    if (existingReferral) {
      console.log("[TRACK-CUSTOMER-REFERRAL] Already referred:", referredEmail);
      return new Response(JSON.stringify({ alreadyReferred: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the referral record
    const { data: newReferral, error: insertError } = await supabaseClient
      .from("customer_referrals")
      .insert({
        referrer_email: referrer.email,
        referrer_code: referralCode,
        referred_email: referredEmail.toLowerCase(),
        referred_report_id: referredReportId || null,
        reward_type: "discount",
        reward_value: 500, // $5 discount
      })
      .select()
      .single();

    if (insertError) {
      console.error("[TRACK-CUSTOMER-REFERRAL] Insert error:", insertError);
      throw insertError;
    }

    console.log("[TRACK-CUSTOMER-REFERRAL] Referral tracked:", newReferral.id);

    return new Response(JSON.stringify({ 
      success: true,
      referralId: newReferral.id,
      discountCents: 500,
      message: "You've earned a $5 discount!",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[TRACK-CUSTOMER-REFERRAL] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
