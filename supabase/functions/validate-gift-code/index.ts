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
    const { code } = await req.json();
    
    console.log("[VALIDATE-GIFT] Validating code:", code);

    if (!code) {
      throw new Error("Gift code is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("gift_certificates")
      .select("recipient_name, gift_message, amount_cents, is_redeemed")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !data) {
      throw new Error("Invalid gift code");
    }

    if (data.is_redeemed) {
      throw new Error("This gift has already been redeemed");
    }

    // Return only necessary data (no emails)
    return new Response(JSON.stringify({
      valid: true,
      recipientName: data.recipient_name,
      giftMessage: data.gift_message,
      amountCents: data.amount_cents,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[VALIDATE-GIFT] Error:", message);
    return new Response(JSON.stringify({ error: message, valid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});