import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - flexible to support various gift code formats
const redeemSchema = z.object({
  giftCode: z.string()
    .min(8)
    .max(30)
    .regex(/^GIFT-[A-Z0-9-]+$/, "Invalid gift code format"),
  reportId: z.string().uuid(), // Primary report ID (backwards compat)
  reportIds: z.array(z.string().uuid()).optional(), // All report IDs for multi-pet gifts
  petPhotoUrl: z.string().url().optional(),
  petPhotoUrls: z.record(z.string().url()).optional(), // Map of reportId -> photoUrl for multi-pet
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInput = await req.json();
    const input = redeemSchema.parse(rawInput);
    
    // Support both single reportId and array of reportIds
    const allReportIds = input.reportIds || [input.reportId];
    const primaryReportId = allReportIds[0];
    
    console.log("[REDEEM-GIFT] Attempting to redeem gift code for", allReportIds.length, "reports:", allReportIds);

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

    // Validate pet count matches gift pet count
    const giftPetCount = gift.pet_count || 1;
    if (allReportIds.length > giftPetCount) {
      console.log("[REDEEM-GIFT] Too many reports for gift:", allReportIds.length, "vs", giftPetCount);
      return new Response(JSON.stringify({ 
        error: `This gift covers ${giftPetCount} pet${giftPetCount > 1 ? 's' : ''}, but ${allReportIds.length} were submitted`,
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
        redeemed_by_report_id: primaryReportId,
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

    // Update ALL reports as paid
    console.log("[REDEEM-GIFT] Marking", allReportIds.length, "reports as paid");
    
    for (let i = 0; i < allReportIds.length; i++) {
      const reportId = allReportIds[i];
      const updateData: any = { 
        payment_status: "paid",
        stripe_session_id: `gift_${gift.code}`,
      };
      
      // Apply photo URL for each pet if provided
      if (input.petPhotoUrls && input.petPhotoUrls[reportId]) {
        updateData.pet_photo_url = input.petPhotoUrls[reportId];
      } else if (i === 0 && input.petPhotoUrl) {
        // Fallback: apply single photo to first pet for backwards compat
        updateData.pet_photo_url = input.petPhotoUrl;
      }
      
      const { error: reportError } = await supabase
        .from("pet_reports")
        .update(updateData)
        .eq("id", reportId);

      if (reportError) {
        console.error("[REDEEM-GIFT] Failed to update report:", reportId, reportError);
        // Continue with other reports, don't fail the whole redemption
      } else {
        console.log("[REDEEM-GIFT] Report marked as paid:", reportId);
      }
    }

    // Use the stored gift_tier if available, otherwise derive from amount
    let giftedTier = gift.gift_tier;
    if (!giftedTier) {
      // Fallback for old gift certificates without tier
      if (gift.amount_cents >= 5000) {
        giftedTier = 'portrait';
      } else {
        giftedTier = 'essential';
      }
    }

    // Parse per-pet tier info from gift_pets_json
    const giftPetsJson = gift.gift_pets_json as { id: string; tier: string; horoscopeAddon?: string }[] | null;
    
    // Determine which pet indices have portrait tier
    const portraitPetIndices = new Set<number>();
    // Determine which pet indices have horoscope addons (separate from tier!)
    const horoscopePetIndices = new Set<number>();

    if (giftPetsJson && Array.isArray(giftPetsJson)) {
      giftPetsJson.forEach((pet, idx) => {
        if (pet.tier === 'portrait') {
          portraitPetIndices.add(idx);
        }
        // Check for explicit horoscope addon (monthly or yearly)
        if (pet.horoscopeAddon && pet.horoscopeAddon !== 'none') {
          horoscopePetIndices.add(idx);
          console.log(`[REDEEM-GIFT] Pet ${idx} has horoscope addon:`, pet.horoscopeAddon);
        }
      });
    }
    
    // For legacy gifts without per-pet info, use global tier
    const legacyIncludesPortrait = giftedTier === 'portrait';
    const hasAnyPortrait = portraitPetIndices.size > 0 || legacyIncludesPortrait;
    const hasAnyHoroscope = horoscopePetIndices.size > 0 || legacyIncludesPortrait;
    
    console.log("[REDEEM-GIFT] Per-pet tier info:", {
      giftPetsJson,
      portraitPetIndices: Array.from(portraitPetIndices),
      horoscopePetIndices: Array.from(horoscopePetIndices),
      legacyIncludesPortrait,
      hasAnyPortrait,
      hasAnyHoroscope,
    });
    
    // Process ALL pet reports for horoscopes and portraits
    for (let i = 0; i < allReportIds.length; i++) {
      const reportId = allReportIds[i];
      
      // Determine if THIS pet gets portrait based on per-pet tier
      const petTier = giftPetsJson?.[i]?.tier || giftedTier;
      const petHoroscopeAddon = giftPetsJson?.[i]?.horoscopeAddon || 'none';
      const thisPetIncludesPortrait = petTier === 'portrait';
      // Horoscope: either from portrait tier OR from explicit addon purchase
      const thisPetIncludesHoroscope = petTier === 'portrait' || (petHoroscopeAddon !== 'none');
      
      console.log(`[REDEEM-GIFT] Processing report ${i}:`, { reportId, petTier, petHoroscopeAddon, thisPetIncludesPortrait, thisPetIncludesHoroscope });
      
      const { data: report } = await supabase
        .from("pet_reports")
        .select("pet_name, email, species, breed, pet_photo_url, report_content")
        .eq("id", reportId)
        .single();

      if (!report) {
        console.log("[REDEEM-GIFT] Report not found:", reportId);
        continue;
      }

      // For Portrait tier, auto-enroll in weekly horoscope (only once per email/report)
      if (thisPetIncludesHoroscope) {
        // Check if subscription already exists for this email
        const { data: existingSub } = await supabase
          .from("horoscope_subscriptions")
          .select("id")
          .eq("email", report.email)
          .eq("pet_report_id", reportId)
          .single();

        if (!existingSub) {
          // Calculate next Monday for first horoscope
          const nextMonday = new Date();
          nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
          nextMonday.setHours(9, 0, 0, 0);

          const { error: subError } = await supabase
            .from("horoscope_subscriptions")
            .insert({
              email: report.email,
              pet_name: report.pet_name,
              pet_report_id: reportId,
              status: "active",
              next_send_at: nextMonday.toISOString(),
            });

          if (subError) {
            console.error("[REDEEM-GIFT] Failed to create horoscope subscription for:", reportId, subError);
          } else {
            console.log("[REDEEM-GIFT] Auto-enrolled in weekly horoscope:", report.email, report.pet_name);
          }
        }
      }
      
      // Portrait tier: ensure the uploaded photo URL is saved so card can display it
      // (No AI generation — we use the exact uploaded photo on the card.)
      if (thisPetIncludesPortrait) {
        const photoUrl = (input.petPhotoUrls && input.petPhotoUrls[reportId]) || 
                         (reportId === primaryReportId ? input.petPhotoUrl : null) || 
                         report.pet_photo_url;
        if (!photoUrl) {
          console.log("[REDEEM-GIFT] Pet", i, "has portrait tier but no photo uploaded");
        }
      }
    }

    console.log("[REDEEM-GIFT] Gift successfully redeemed:", {
      giftCode: input.giftCode,
      reportIds: allReportIds,
      petCount: allReportIds.length,
      giftedTier,
      amountCents: gift.amount_cents,
      hasAnyPortrait,
      portraitPetIndices: Array.from(portraitPetIndices),
    });

    return new Response(JSON.stringify({
      success: true,
      reportId: primaryReportId,
      reportIds: allReportIds,
      petCount: allReportIds.length,
      giftedTier,
      giftTier: giftedTier, // Explicit tier name for frontend
      recipientName: gift.recipient_name,
      giftMessage: gift.gift_message,
      includesPortrait: hasAnyPortrait,
      includesWeeklyHoroscope: hasAnyHoroscope,
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
