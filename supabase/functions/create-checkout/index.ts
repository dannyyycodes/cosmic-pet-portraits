import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed pricing tiers - SERVER-SIDE TRUTH
const TIERS = {
  basic: { name: 'Cosmic Pet Reading', priceCents: 3500 },
  premium: { name: 'Cosmic Deluxe', priceCents: 5000 },
  vip: { name: 'Cosmic VIP Experience', priceCents: 12900 },
} as const;

const GIFT_PRICE_CENTS = 1750; // 50% off gift

// Volume discount calculation - SERVER-SIDE
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.50; // 50% off for 5+ pets
  if (petCount >= 4) return 0.40; // 40% off for 4 pets
  if (petCount >= 3) return 0.30; // 30% off for 3 pets
  if (petCount >= 2) return 0.20; // 20% off for 2 pets
  return 0;
}

const HOROSCOPE_MONTHLY_CENTS = 499; // $4.99/month subscription

// Input validation schema
const checkoutSchema = z.object({
  reportIds: z.array(z.string().uuid()).optional(),
  reportId: z.string().uuid().optional(),
  petCount: z.number().int().min(1).max(10).optional().default(1),
  selectedTier: z.enum(['basic', 'premium', 'vip']).optional().default('premium'),
  selectedProducts: z.array(z.string()).optional(),
  couponId: z.string().uuid().nullable().optional(),
  giftCertificateId: z.string().uuid().nullable().optional(),
  isGift: z.boolean().optional().default(false),
  recipientName: z.string().max(100).optional().default(''),
  recipientEmail: z.string().email().max(255).optional().or(z.literal('')).default(''),
  giftMessage: z.string().max(500).optional().default(''),
  totalCents: z.number().optional(), // Ignored - calculated server-side
  includeGiftForFriend: z.boolean().optional().default(false),
  includesPortrait: z.boolean().optional().default(false), // Whether tier includes AI portrait
  referralCode: z.string().max(50).optional(), // Affiliate referral code
  includeHoroscope: z.boolean().optional().default(false), // Weekly horoscope add-on
  giftCode: z.string().max(20).optional(), // Gift code to redeem (e.g., GIFT-XXXX-XXXX)
  petPhotoUrl: z.string().url().max(2048).optional(), // Pet photo for portrait generation
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const input = checkoutSchema.parse(rawInput);

    // Support both single reportId and array of reportIds
    const allReportIds = input.reportIds || (input.reportId ? [input.reportId] : []);
    if (allReportIds.length === 0) {
      throw new Error("At least one report ID is required");
    }
    const primaryReportId = allReportIds[0];

    console.log("[CREATE-CHECKOUT] Starting checkout for reports:", allReportIds, "tier:", input.selectedTier);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[CREATE-CHECKOUT] Missing Stripe configuration");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the primary report to get email
    const { data: report, error: reportError } = await supabaseClient
      .from("pet_reports")
      .select("email, pet_name")
      .eq("id", primaryReportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Sanitize email - remove trailing commas, spaces, and other invalid chars
    const sanitizedEmail = report.email
      .trim()
      .replace(/,+$/, '') // Remove trailing commas
      .replace(/\s+/g, ''); // Remove any whitespace

    // ===== SERVER-SIDE PRICE CALCULATION =====
    const tier = TIERS[input.selectedTier];
    const actualPetCount = allReportIds.length || input.petCount;
    
    // Base price
    const baseTotal = tier.priceCents * actualPetCount;
    
    // Volume discount
    const volumeDiscountRate = getVolumeDiscount(actualPetCount);
    const volumeDiscount = Math.round(baseTotal * volumeDiscountRate);
    
    // Gift add-on
    const giftAmount = input.includeGiftForFriend ? GIFT_PRICE_CENTS : 0;
    
    // Apply coupon discount if provided
    let couponDiscount = 0;
    if (input.couponId) {
      const { data: coupon, error: couponError } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("id", input.couponId)
        .eq("is_active", true)
        .single();
      
      if (!couponError && coupon) {
        // Check expiration
        if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
          // Check usage limits
          if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
            // Check minimum purchase
            const subtotal = baseTotal - volumeDiscount;
            if (!coupon.min_purchase_cents || subtotal >= coupon.min_purchase_cents) {
              if (coupon.discount_type === 'percent') {
                couponDiscount = Math.round(subtotal * (coupon.discount_value / 100));
              } else {
                couponDiscount = coupon.discount_value;
              }
            }
          }
        }
      }
    }
    
    // Apply gift certificate if provided (by ID or by code)
    let giftCertificateDiscount = 0;
    let giftCertificateId: string | null = input.giftCertificateId || null;
    
    // If gift code is provided (from URL), look it up
    if (input.giftCode && !giftCertificateId) {
      const { data: giftByCode, error: codeError } = await supabaseClient
        .from("gift_certificates")
        .select("*")
        .eq("code", input.giftCode.toUpperCase())
        .eq("is_redeemed", false)
        .single();
      
      if (!codeError && giftByCode) {
        // Check expiration
        if (!giftByCode.expires_at || new Date(giftByCode.expires_at) > new Date()) {
          giftCertificateId = giftByCode.id;
          giftCertificateDiscount = giftByCode.amount_cents;
          console.log("[CREATE-CHECKOUT] Gift code applied:", input.giftCode, "value:", giftByCode.amount_cents);
        }
      }
    }
    
    // If gift certificate ID is provided, look it up
    if (giftCertificateId && giftCertificateDiscount === 0) {
      const { data: giftCert, error: giftError } = await supabaseClient
        .from("gift_certificates")
        .select("*")
        .eq("id", giftCertificateId)
        .eq("is_redeemed", false)
        .single();
      
      if (!giftError && giftCert) {
        // Check expiration
        if (!giftCert.expires_at || new Date(giftCert.expires_at) > new Date()) {
          giftCertificateDiscount = giftCert.amount_cents;
        }
      }
    }
    
    // Apply VIP customer referral discount ($5 off if referred by VIP customer)
    let customerReferralDiscount = 0;
    if (input.referralCode && input.referralCode.startsWith("VIP-")) {
      // Check if this referral code exists
      const { data: referrer } = await supabaseClient
        .from("email_subscribers")
        .select("email, referral_code")
        .eq("referral_code", input.referralCode)
        .single();
      
      if (referrer && referrer.email.toLowerCase() !== sanitizedEmail.toLowerCase()) {
        // Check if already referred
        const { data: existingRef } = await supabaseClient
          .from("customer_referrals")
          .select("id")
          .eq("referred_email", sanitizedEmail.toLowerCase())
          .single();
        
        if (!existingRef) {
          customerReferralDiscount = 500; // $5 off
          console.log("[CREATE-CHECKOUT] VIP referral discount applied:", input.referralCode);
        }
      }
    }
    
    // Calculate final total (never negative)
    const calculatedTotal = Math.max(0, 
      baseTotal - volumeDiscount - couponDiscount - giftCertificateDiscount - customerReferralDiscount + giftAmount
    );

    console.log("[CREATE-CHECKOUT] Server-calculated price:", {
      baseTotal,
      volumeDiscount,
      couponDiscount,
      giftCertificateDiscount,
      customerReferralDiscount,
      giftAmount,
      calculatedTotal,
    });

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // If total is 0 (fully covered by gift certificate), skip Stripe
    if (calculatedTotal === 0) {
      console.log("[CREATE-CHECKOUT] Order is free, skipping Stripe");
      
      // Update all reports as paid
      for (const id of allReportIds) {
        await supabaseClient
          .from("pet_reports")
          .update({ payment_status: "paid" })
          .eq("id", id);
      }

      // Mark gift certificate as redeemed
      if (giftCertificateId) {
        await supabaseClient
          .from("gift_certificates")
          .update({ 
            is_redeemed: true, 
            redeemed_at: new Date().toISOString(),
            redeemed_by_report_id: primaryReportId,
          })
          .eq("id", giftCertificateId);
      }

      return new Response(JSON.stringify({ 
        url: `${origin}/payment-success?session_id=free&report_id=${primaryReportId}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build line items
    const mainItemAmount = calculatedTotal - giftAmount;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: actualPetCount > 1 
            ? `${tier.name} × ${actualPetCount} pets`
            : tier.name,
        },
        unit_amount: mainItemAmount,
      },
      quantity: 1,
    }];

    // Add gift reading if selected
    if (input.includeGiftForFriend) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "🎁 Gift Reading for a Friend (50% OFF!)",
            description: "A cosmic pet reading gift certificate",
          },
          unit_amount: GIFT_PRICE_CENTS,
        },
        quantity: 1,
      });
    }

    // Note: Horoscope subscription would require a separate checkout flow
    // For now, we handle one-time payments only to avoid Stripe mode conflicts
    const checkoutMode = "payment";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: sanitizedEmail,
      line_items: lineItems,
      mode: checkoutMode,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&report_id=${primaryReportId}`,
      cancel_url: `${origin}/intake?canceled=true`,
      metadata: {
        report_ids: allReportIds.join(","),
        pet_count: actualPetCount.toString(),
        selected_tier: input.selectedTier,
        include_gift: input.includeGiftForFriend ? "true" : "false",
        includes_portrait: input.includesPortrait ? "true" : "false",
        is_gift: input.isGift ? "true" : "false",
        recipient_name: input.recipientName,
        recipient_email: input.recipientEmail,
        gift_message: input.giftMessage,
        coupon_id: input.couponId || "",
        gift_certificate_id: input.giftCertificateId || "",
        referral_code: input.referralCode || "",
        include_horoscope: input.includeHoroscope ? "true" : "false",
        // VIP tier includes horoscope for free
        vip_horoscope: input.selectedTier === "vip" ? "true" : "false",
        pet_photo_url: input.petPhotoUrl || "",
      },
    });

    console.log("[CREATE-CHECKOUT] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    
    // SECURITY: Handle Zod validation errors - log details server-side only
    if (error instanceof z.ZodError) {
      console.error("[CREATE-CHECKOUT] Validation errors:", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid request parameters"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // SECURITY: Generic error message - never expose internal details
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
