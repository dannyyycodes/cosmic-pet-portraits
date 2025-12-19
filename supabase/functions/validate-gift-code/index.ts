import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const validateSchema = z.object({
  code: z.string()
    .min(10)
    .max(20)
    .regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid gift code format"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const input = validateSchema.parse(rawInput);
    
    console.log("[VALIDATE-GIFT] Validating code");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await supabase
      .from("gift_certificates")
      .select("recipient_name, gift_message, amount_cents, is_redeemed, expires_at")
      .eq("code", input.code.toUpperCase())
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Invalid gift code", valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (data.is_redeemed) {
      return new Response(JSON.stringify({ error: "This gift has already been redeemed", valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This gift code has expired", valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Determine what tier was gifted based on amount
    // Basic: $35 (3500 cents), Premium: $50 (5000 cents), VIP: $129 (12900 cents)
    let giftedTier = 'basic';
    if (data.amount_cents >= 12900) {
      giftedTier = 'vip';
    } else if (data.amount_cents >= 5000) {
      giftedTier = 'premium';
    }

    // Return only necessary data (no emails)
    return new Response(JSON.stringify({
      valid: true,
      recipientName: data.recipient_name,
      giftMessage: data.gift_message,
      amountCents: data.amount_cents,
      giftedTier,
      includesPortrait: giftedTier === 'premium' || giftedTier === 'vip',
      includesVip: giftedTier === 'vip',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("[VALIDATE-GIFT] Validation error:", error.errors);
      return new Response(JSON.stringify({ error: "Invalid gift code format", valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[VALIDATE-GIFT] Error:", message);
    return new Response(JSON.stringify({ error: "Validation failed", valid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
