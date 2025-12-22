import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - flexible to support various gift code formats
const validateSchema = z.object({
  code: z.string()
    .min(8)
    .max(30)
    .regex(/^GIFT-[A-Z0-9-]+$/, "Invalid gift code format"),
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
      .select("recipient_name, gift_message, amount_cents, is_redeemed, expires_at, gift_tier, pet_count, gift_pets_json")
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

    // Use stored gift_tier if available, otherwise derive from amount
    let giftedTier = data.gift_tier;
    if (!giftedTier) {
      // Fallback for old gift certificates without tier column
      if (data.amount_cents >= 12900) {
        giftedTier = 'vip';
      } else if (data.amount_cents >= 5000) {
        giftedTier = 'portrait';
      } else {
        giftedTier = 'essential';
      }
    }

    // Parse per-pet tier info if available
    const giftPetsJson = data.gift_pets_json as { id: string; tier: string; horoscopeAddon?: string }[] | null;
    
    // Determine which pets have portrait tier
    let portraitPetIndices: number[] = [];
    let horoscopePetIndices: number[] = [];
    if (giftPetsJson && Array.isArray(giftPetsJson)) {
      portraitPetIndices = giftPetsJson
        .map((pet, idx) => (pet.tier === 'portrait' || pet.tier === 'vip') ? idx : -1)
        .filter(idx => idx !== -1);
      
      // Check for horoscope addons (separate from tier)
      horoscopePetIndices = giftPetsJson
        .map((pet, idx) => (pet.horoscopeAddon && pet.horoscopeAddon !== 'none') ? idx : -1)
        .filter(idx => idx !== -1);
    }
    
    // Check if ANY pet has portrait/VIP tier
    const hasAnyPortrait = giftPetsJson 
      ? giftPetsJson.some(pet => pet.tier === 'portrait' || pet.tier === 'vip')
      : (giftedTier === 'portrait' || giftedTier === 'vip');
    
    // Check if ANY pet has horoscope addon (from tier OR explicit addon purchase)
    const hasAnyHoroscope = hasAnyPortrait || horoscopePetIndices.length > 0;

    // Return only necessary data (no emails)
    return new Response(JSON.stringify({
      valid: true,
      recipientName: data.recipient_name,
      giftMessage: data.gift_message,
      amountCents: data.amount_cents,
      giftTier: giftedTier,
      giftedTier, // Keep for backward compatibility
      petCount: data.pet_count || 1,
      giftPets: giftPetsJson, // Per-pet tier info
      portraitPetIndices, // Which pets get portraits
      horoscopePetIndices, // Which pets get horoscope addons
      includesPortrait: hasAnyPortrait,
      includesVip: giftedTier === 'vip' || (giftPetsJson?.some(p => p.tier === 'vip') ?? false),
      includesWeeklyHoroscope: hasAnyHoroscope,
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
