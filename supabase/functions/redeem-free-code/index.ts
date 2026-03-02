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

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { code, email, petName, species, occasionMode } = await req.json();

    if (!code || !code.trim()) {
      return new Response(JSON.stringify({ error: "Please enter a redeem code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    console.log("[REDEEM] Validating code:", normalizedCode);

    // Look up the code
    const { data: redeemCode, error: lookupError } = await supabase
      .from("redeem_codes")
      .select("*")
      .eq("code", normalizedCode)
      .single();

    if (lookupError || !redeemCode) {
      console.log("[REDEEM] Code not found:", normalizedCode);
      return new Response(JSON.stringify({ error: "Invalid redeem code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if active
    if (!redeemCode.is_active) {
      return new Response(JSON.stringify({ error: "This code has been deactivated" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (redeemCode.expires_at && new Date(redeemCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This code has expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check usage limit
    if (redeemCode.max_uses && redeemCode.current_uses >= redeemCode.max_uses) {
      return new Response(JSON.stringify({ error: "This code has reached its usage limit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = redeemCode.tier || "premium";
    const includesPortrait = tier === "premium" || tier === "hardcover";
    const includesBook = tier === "hardcover";

    // Create the report with payment_status = 'paid'
    const { data: report, error: insertError } = await supabase
      .from("pet_reports")
      .insert({
        email: email || "pending@redeem.littlesouls.co",
        pet_name: petName || "Pending",
        species: species || "pending",
        payment_status: "paid",
        occasion_mode: occasionMode || "discover",
        includes_book: includesBook,
        includes_portrait: includesPortrait,
        redeem_code: normalizedCode,
      })
      .select("id")
      .single();

    if (insertError || !report) {
      console.error("[REDEEM] Failed to create report:", insertError);
      throw new Error("Failed to create report");
    }

    console.log("[REDEEM] Report created:", report.id, "tier:", tier);

    // Set SoulSpeak credits
    const creditAmount = includesBook ? 50 : 15;
    await supabase
      .from("chat_credits")
      .insert({
        report_id: report.id,
        email: email || "pending@redeem.littlesouls.co",
        credits_remaining: creditAmount,
        plan: "redeemed",
        order_id: report.id,
      });

    // Increment usage count
    await supabase
      .from("redeem_codes")
      .update({ current_uses: redeemCode.current_uses + 1 })
      .eq("id", redeemCode.id);

    console.log("[REDEEM] Code redeemed successfully:", normalizedCode);

    return new Response(JSON.stringify({
      success: true,
      reportId: report.id,
      tier,
      includesPortrait,
      includesBook,
      creditAmount,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[REDEEM] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to redeem code" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
