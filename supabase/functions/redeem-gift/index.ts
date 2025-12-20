import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const redeemSchema = z.object({
  giftCode: z.string()
    .min(10)
    .max(20)
    .regex(/^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invalid gift code format"),
  reportId: z.string().uuid(),
  petPhotoUrl: z.string().url().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInput = await req.json();
    const input = redeemSchema.parse(rawInput);
    
    console.log("[REDEEM-GIFT] Attempting to redeem gift code for report:", input.reportId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Start a "transaction" - first check if gift is valid and not redeemed
    const { data: gift, error: giftError } = await supabase
      .from("gift_certificates")
      .select("*")
      .eq("code", input.giftCode.toUpperCase())
      .single();

    if (giftError || !gift) {
      console.log("[REDEEM-GIFT] Gift code not found:", input.giftCode);
      return new Response(JSON.stringify({ 
        error: "Invalid gift code",
        success: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if already redeemed
    if (gift.is_redeemed) {
      console.log("[REDEEM-GIFT] Gift already redeemed:", input.giftCode);
      return new Response(JSON.stringify({ 
        error: "This gift has already been redeemed",
        success: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check expiration
    if (gift.expires_at && new Date(gift.expires_at) < new Date()) {
      console.log("[REDEEM-GIFT] Gift expired:", input.giftCode);
      return new Response(JSON.stringify({ 
        error: "This gift code has expired",
        success: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Mark gift as redeemed IMMEDIATELY (prevent race conditions)
    const { error: updateError } = await supabase
      .from("gift_certificates")
      .update({ 
        is_redeemed: true, 
        redeemed_at: new Date().toISOString(),
        redeemed_by_report_id: input.reportId,
      })
      .eq("id", gift.id)
      .eq("is_redeemed", false); // Double-check it wasn't redeemed in a race

    if (updateError) {
      console.error("[REDEEM-GIFT] Failed to mark gift as redeemed:", updateError);
      return new Response(JSON.stringify({ 
        error: "Failed to redeem gift. Please try again.",
        success: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Update the report as paid and save pet photo URL if provided
    const updateData: any = { 
      payment_status: "paid",
      stripe_session_id: `gift_${gift.code}`,
    };
    
    if (input.petPhotoUrl) {
      updateData.pet_photo_url = input.petPhotoUrl;
    }
    
    const { error: reportError } = await supabase
      .from("pet_reports")
      .update(updateData)
      .eq("id", input.reportId);

    if (reportError) {
      console.error("[REDEEM-GIFT] Failed to update report:", reportError);
      // Note: Gift is already marked as redeemed - support may need to help
      return new Response(JSON.stringify({ 
        error: "Gift redeemed but report update failed. Please contact support.",
        success: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Use the stored gift_tier if available, otherwise derive from amount
    let giftedTier = gift.gift_tier;
    if (!giftedTier) {
      // Fallback for old gift certificates without tier
      if (gift.amount_cents >= 12900) {
        giftedTier = 'vip';
      } else if (gift.amount_cents >= 5000) {
        giftedTier = 'portrait';
      } else {
        giftedTier = 'essential';
      }
    }

    // For Portrait and VIP tiers, auto-enroll in weekly horoscope
    const includesWeeklyHoroscope = giftedTier === 'portrait' || giftedTier === 'vip';
    if (includesWeeklyHoroscope) {
      // Get the pet report to get name and email
      const { data: report } = await supabase
        .from("pet_reports")
        .select("pet_name, email")
        .eq("id", input.reportId)
        .single();

      if (report) {
        // Calculate next Monday for first horoscope
        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
        nextMonday.setHours(9, 0, 0, 0);

        const { error: subError } = await supabase
          .from("horoscope_subscriptions")
          .insert({
            email: report.email,
            pet_name: report.pet_name,
            pet_report_id: input.reportId,
            status: "active",
            next_send_at: nextMonday.toISOString(),
          });

        if (subError) {
          console.error("[REDEEM-GIFT] Failed to create horoscope subscription:", subError);
          // Non-fatal - continue with redemption
        } else {
          console.log("[REDEEM-GIFT] Auto-enrolled in weekly horoscope:", report.email);
        }
      }
    }

    console.log("[REDEEM-GIFT] Gift successfully redeemed:", {
      giftCode: input.giftCode,
      reportId: input.reportId,
      giftedTier,
      amountCents: gift.amount_cents,
      includesWeeklyHoroscope,
    });

    return new Response(JSON.stringify({
      success: true,
      reportId: input.reportId,
      giftedTier,
      giftTier: giftedTier, // Explicit tier name for frontend
      recipientName: gift.recipient_name,
      giftMessage: gift.gift_message,
      includesVip: giftedTier === 'vip',
      includesPortrait: giftedTier === 'portrait' || giftedTier === 'vip',
      includesWeeklyHoroscope,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[REDEEM-GIFT] Validation error:", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid request format",
        success: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[REDEEM-GIFT] Error:", message);
    return new Response(JSON.stringify({ 
      error: "Failed to redeem gift",
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
