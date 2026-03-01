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
  basic: { name: 'Little Souls Reading', priceCents: 3500 },
  premium: { name: 'Little Souls Reading + Portrait', priceCents: 5000 },
} as const;

// Gift tiers - 50% off all tiers for friends
const GIFT_TIERS = {
  basic: { priceCents: 1750, name: 'Gift: Little Souls Reading' },
  premium: { priceCents: 2500, name: 'Gift: Little Souls Reading + Portrait' },
} as const;

// Volume discount calculation - SERVER-SIDE (must match frontend)
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.50;
  if (petCount >= 4) return 0.40;
  if (petCount >= 3) return 0.30;
  if (petCount >= 2) return 0.20;
  return 0;
}

const HOROSCOPE_MONTHLY_CENTS = 0; // Free at checkout — Stripe subscription created in webhook with 30-day trial
const HARDCOVER_PRICE_CENTS = 9900; // $99.00 — includes reading + portrait + book

// Variant C pricing
const VARIANT_C_PRICES: Record<string, number> = {
  basic: 2700,
  premium: 3500,
};
const PORTRAIT_PRICE_CENTS = 800; // $8.00

// Input validation schema
const checkoutSchema = z.object({
  reportIds: z.array(z.string().uuid()).optional(),
  reportId: z.string().uuid().optional(),
  petCount: z.number().int().min(1).max(10).optional().default(1),
  selectedTier: z.enum(['basic', 'premium']).optional().default('premium'),
  selectedProducts: z.array(z.string()).optional(),
  couponId: z.string().uuid().nullable().optional(),
  giftCertificateId: z.string().uuid().nullable().optional(),
  isGift: z.boolean().optional().default(false),
  recipientName: z.string().max(100).optional().default(''),
  recipientEmail: z.string().email().max(255).optional().or(z.literal('')).default(''),
  giftMessage: z.string().max(500).optional().default(''),
  totalCents: z.number().optional(),
  includeGiftForFriend: z.boolean().optional().default(false),
  giftTierForFriend: z.enum(['basic', 'premium']).optional().default('basic'),
  includesPortrait: z.boolean().optional().default(false),
  includesBook: z.boolean().optional().default(false),
  referralCode: z.string().max(50).optional(),
  includeHoroscope: z.boolean().optional().default(false),
  giftCode: z.string().max(20).optional(),
  petPhotoUrl: z.string().url().max(2048).optional(),
  petTiers: z.record(z.string(), z.enum(['basic', 'premium'])).optional(),
  petPhotos: z.record(z.string(), z.object({
    url: z.string().url().max(2048),
    processingMode: z.string().optional(),
  })).optional(),
  petHoroscopes: z.record(z.string(), z.boolean()).optional(),
  quickCheckout: z.boolean().optional().default(false),
  abVariant: z.string().max(5).optional(),
  occasionMode: z.string().max(20).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInput = await req.json();
    const input = checkoutSchema.parse(rawInput);

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

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // ========== QUICK CHECKOUT MODE (Variant C) ==========
    if (input.quickCheckout) {
      const tierKey = input.selectedTier || 'premium';
      const petCount = input.petCount || 1;
      let includesPortrait = input.includesPortrait || tierKey === 'premium';
      const includesBook = input.includesBook || false;
      const occasionMode = input.occasionMode || 'discover';

      // Hardcover always includes portrait
      if (includesBook) {
        includesPortrait = true;
      }

      // Calculate price server-side
      if (includesBook) {
        // Hardcover: $99 per pet — includes reading + portrait + book
        var totalAmount = HARDCOVER_PRICE_CENTS * petCount;
      } else {
        const basePriceCents = VARIANT_C_PRICES[tierKey] || VARIANT_C_PRICES.basic;
        const perPetPrice = tierKey === 'basic' && includesPortrait
          ? VARIANT_C_PRICES.basic + PORTRAIT_PRICE_CENTS
          : basePriceCents;
        const readingTotal = perPetPrice * petCount;
        const discountRate = getVolumeDiscount(petCount);
        const discountAmount = Math.round(readingTotal * discountRate);
        var totalAmount = readingTotal - discountAmount;
      }

      // Create placeholder report(s)
      const reportIds: string[] = [];
      for (let i = 0; i < petCount; i++) {
        const { data: placeholderReport, error: insertError } = await supabaseClient
          .from("pet_reports")
          .insert({
            email: "pending@checkout.temp",
            pet_name: "Pending",
            species: "pending",
            payment_status: "pending",
            occasion_mode: occasionMode,
            includes_book: includesBook,
          })
          .select("id")
          .single();

        if (insertError || !placeholderReport) {
          console.error("[CREATE-CHECKOUT] Failed to create placeholder report:", insertError);
          throw new Error("Failed to create report record");
        }
        reportIds.push(placeholderReport.id);
      }

      const primaryReportId = reportIds[0];
      console.log("[CREATE-CHECKOUT] Quick checkout — reports:", reportIds, "tier:", tierKey, "total:", totalAmount, "book:", includesBook);

      // If total is $0 (shouldn't normally happen for quick checkout, but handle it)
      if (totalAmount <= 0) {
        console.log("[CREATE-CHECKOUT] Quick checkout free order — skipping Stripe");
        for (const id of reportIds) {
          await supabaseClient
            .from("pet_reports")
            .update({
              payment_status: "paid",
              includes_book: includesBook,
              includes_portrait: includesPortrait,
            })
            .eq("id", id);

          const creditAmount = includesBook ? 50 : 15;
          await supabaseClient
            .from("chat_credits")
            .upsert({
              report_id: id,
              email: "pending@checkout.temp",
              credits_remaining: creditAmount,
              plan: "free_coupon",
            }, { onConflict: "report_id" });
        }

        return new Response(JSON.stringify({
          free: true,
          reportId: primaryReportId,
          reportIds,
          url: `${origin}/payment-success?session_id=free&report_id=${primaryReportId}&free=true&quick=true`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Build line items
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      if (includesBook) {
        // HARDCOVER: Single line item at $99 per pet — includes reading + portrait
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: petCount > 1 ? `${petCount}× The Little Souls Book` : 'The Little Souls Book',
              description: 'Hardcover book + digital reading + AI portrait',
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        });
      } else {
        // DIGITAL ONLY: Reading ± portrait
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: petCount > 1
                ? `${petCount}× Little Souls Reading${includesPortrait ? ' + Portrait' : ''}`
                : `Little Souls Reading${includesPortrait ? ' + Portrait' : ''}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&report_id=${primaryReportId}&quick=true`,
        cancel_url: `${origin}/checkout?tier=${tierKey}`,
        metadata: {
          report_ids: reportIds.join(","),
          pet_count: petCount.toString(),
          selected_tier: tierKey,
          quick_checkout: "true",
          ab_variant: input.abVariant || "C",
          includes_portrait: includesPortrait ? "true" : "false",
          includes_book: includesBook ? "true" : "false",
          occasion_mode: occasionMode,
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ========== STANDARD CHECKOUT MODE ==========
    const allReportIds = input.reportIds || (input.reportId ? [input.reportId] : []);
    if (allReportIds.length === 0) {
      throw new Error("At least one report ID is required");
    }
    const primaryReportId = allReportIds[0];

    console.log("[CREATE-CHECKOUT] Starting checkout for reports:", allReportIds, "tier:", input.selectedTier);

    const { data: report, error: reportError } = await supabaseClient
      .from("pet_reports")
      .select("email, pet_name")
      .eq("id", primaryReportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    const sanitizedEmail = report.email
      .trim()
      .replace(/,+$/, '')
      .replace(/\s+/g, '');

    // ===== SERVER-SIDE PRICE CALCULATION =====
    const petTiers = input.petTiers || {};
    const petHoroscopes = input.petHoroscopes || {};
    const actualPetCount = allReportIds.length || input.petCount;
    
    const { data: allReports } = await supabaseClient
      .from("pet_reports")
      .select("id, occasion_mode")
      .in("id", allReportIds);
    
    const reportOccasionMap = new Map(allReports?.map(r => [r.id, r.occasion_mode]) || []);
    
    let baseTotal = 0;
    for (let i = 0; i < actualPetCount; i++) {
      const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
      const tier = TIERS[tierKey as keyof typeof TIERS] || TIERS.premium;
      baseTotal += tier.priceCents;
    }
    
    const volumeDiscountRate = getVolumeDiscount(actualPetCount);
    const volumeDiscount = Math.round(baseTotal * volumeDiscountRate);
    
    let horoscopeCost = 0;
    let horoscopePetCount = 0;
    for (let i = 0; i < actualPetCount; i++) {
      const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
      const reportId = allReportIds[i];
      const occasionMode = reportId ? reportOccasionMap.get(reportId) : null;
      const isMemorial = occasionMode === 'memorial';
      const hasHoroscope = petHoroscopes[String(i)] || false;

      if (!isMemorial && hasHoroscope) {
        horoscopeCost += HOROSCOPE_MONTHLY_CENTS;
        horoscopePetCount++;
      }
    }
    
    const giftTier = input.giftTierForFriend || 'basic';
    const giftAmount = input.includeGiftForFriend ? GIFT_TIERS[giftTier].priceCents : 0;
    
    let couponDiscount = 0;
    if (input.couponId) {
      const { data: coupon, error: couponError } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("id", input.couponId)
        .eq("is_active", true)
        .single();
      
      if (!couponError && coupon) {
        if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
          if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
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
    
    let giftCertificateDiscount = 0;
    let giftCertificateId: string | null = input.giftCertificateId || null;
    
    if (input.giftCode && !giftCertificateId) {
      const { data: giftByCode, error: codeError } = await supabaseClient
        .from("gift_certificates")
        .select("*")
        .eq("code", input.giftCode.toUpperCase())
        .eq("is_redeemed", false)
        .single();
      
      if (!codeError && giftByCode) {
        if (!giftByCode.expires_at || new Date(giftByCode.expires_at) > new Date()) {
          giftCertificateId = giftByCode.id;
          giftCertificateDiscount = giftByCode.amount_cents;
        }
      }
    }
    
    if (giftCertificateId && giftCertificateDiscount === 0) {
      const { data: giftCert, error: giftError } = await supabaseClient
        .from("gift_certificates")
        .select("*")
        .eq("id", giftCertificateId)
        .eq("is_redeemed", false)
        .single();
      
      if (!giftError && giftCert) {
        if (!giftCert.expires_at || new Date(giftCert.expires_at) > new Date()) {
          giftCertificateDiscount = giftCert.amount_cents;
        }
      }
    }
    
    let customerReferralDiscount = 0;
    if (input.referralCode && input.referralCode.startsWith("REF-")) {
      const { data: referrer } = await supabaseClient
        .from("email_subscribers")
        .select("email, referral_code")
        .eq("referral_code", input.referralCode)
        .single();
      
      if (referrer && referrer.email.toLowerCase() !== sanitizedEmail.toLowerCase()) {
        const { data: existingRef } = await supabaseClient
          .from("customer_referrals")
          .select("id")
          .eq("referred_email", sanitizedEmail.toLowerCase())
          .single();
        
        if (!existingRef) {
          customerReferralDiscount = 500;
        }
      }
    }
    
    // Book upsell for standard checkout
    const bookAmount = input.includesBook ? HARDCOVER_PRICE_CENTS : 0;

    const calculatedTotal = Math.max(0, 
      baseTotal - volumeDiscount - couponDiscount - giftCertificateDiscount - customerReferralDiscount + giftAmount + horoscopeCost + bookAmount
    );

    console.log("[CREATE-CHECKOUT] Server-calculated price:", {
      baseTotal,
      volumeDiscount,
      horoscopeCost,
      couponDiscount,
      giftCertificateDiscount,
      customerReferralDiscount,
      giftAmount,
      bookAmount,
      calculatedTotal,
    });

    if (calculatedTotal === 0) {
      console.log("[CREATE-CHECKOUT] Free order detected — skipping Stripe");

      for (let i = 0; i < allReportIds.length; i++) {
        const id = allReportIds[i];
        const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
        const tierIncludesPortrait = tierKey === 'premium' || input.includesBook;
        const petPhoto = input.petPhotos?.[String(i)];

        const updateData: Record<string, unknown> = {
          payment_status: "paid",
          includes_book: input.includesBook || false,
          includes_portrait: tierIncludesPortrait,
        };
        if (tierIncludesPortrait && petPhoto?.url) {
          updateData.pet_photo_url = petPhoto.url;
        }
        await supabaseClient
          .from("pet_reports")
          .update(updateData)
          .eq("id", id);

        // Set SoulSpeak credits
        const creditAmount = input.includesBook ? 50 : 15;
        await supabaseClient
          .from("chat_credits")
          .upsert({
            report_id: id,
            email: sanitizedEmail,
            credits_remaining: creditAmount,
            plan: "free_coupon",
          }, { onConflict: "report_id" });
      }

      // Increment coupon usage
      if (input.couponId) {
        const { data: couponData } = await supabaseClient
          .from("coupons")
          .select("current_uses")
          .eq("id", input.couponId)
          .single();
        if (couponData) {
          await supabaseClient
            .from("coupons")
            .update({ current_uses: couponData.current_uses + 1 })
            .eq("id", input.couponId);
        }
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
        free: true,
        reportId: primaryReportId,
        reportIds: allReportIds,
        url: `${origin}/payment-success?session_id=free&report_id=${primaryReportId}&free=true`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build line items
    const mainItemAmount = calculatedTotal - giftAmount - horoscopeCost - bookAmount;
    
    const tierCounts = { basic: 0, premium: 0 };
    for (let i = 0; i < actualPetCount; i++) {
      const tierKey = (petTiers[String(i)] || input.selectedTier || 'premium') as keyof typeof tierCounts;
      tierCounts[tierKey]++;
    }
    
    const orderDesc = Object.entries(tierCounts)
      .filter(([_, count]) => count > 0)
      .map(([tier, count]) => `${count}× ${TIERS[tier as keyof typeof TIERS].name}`)
      .join(' + ');
    
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: actualPetCount > 1 
            ? `Little Souls Readings (${actualPetCount} pets)`
            : TIERS[input.selectedTier].name,
          description: actualPetCount > 1 ? orderDesc : undefined,
        },
        unit_amount: mainItemAmount,
      },
      quantity: 1,
    }];

    if (horoscopeCost > 0 && horoscopePetCount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: horoscopePetCount > 1 
              ? `🌙 Weekly Horoscopes - ${horoscopePetCount} pets (1st month)`
              : '🌙 Weekly Horoscope Subscription (1st month)',
            description: 'Personalized cosmic guidance delivered weekly. $4.99/month - cancel anytime.',
          },
          unit_amount: horoscopeCost,
        },
        quantity: 1,
      });
    }

    if (input.includeGiftForFriend) {
      const giftTierSelected = input.giftTierForFriend || 'basic';
      const giftInfo = GIFT_TIERS[giftTierSelected];
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `🎁 ${giftInfo.name} (50% OFF!)`,
            description: "A cosmic pet reading gift certificate",
          },
          unit_amount: giftInfo.priceCents,
        },
        quantity: 1,
      });
    }

    // Book line item
    if (input.includesBook) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: 'The Little Souls Book',
            description: 'Hardcover book + digital reading + AI portrait',
          },
          unit_amount: HARDCOVER_PRICE_CENTS,
        },
        quantity: 1,
      });
    }

    const checkoutMode = "payment";

    const anyPetHasPortrait = Object.values(petTiers).some(t => t === 'premium') ||
      input.selectedTier === 'premium' || input.includesBook;

    try {
      for (let i = 0; i < allReportIds.length; i++) {
        const id = allReportIds[i];
        const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
        const needsPhoto = tierKey === 'premium' || input.includesBook;
        const petPhoto = input.petPhotos?.[String(i)];

        if (needsPhoto && petPhoto?.url) {
          await supabaseClient
            .from('pet_reports')
            .update({ pet_photo_url: petPhoto.url })
            .eq('id', id);
        }
      }
    } catch (err) {
      console.error('[CREATE-CHECKOUT] Failed to persist pet photos:', err);
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: sanitizedEmail,
      line_items: lineItems,
      mode: checkoutMode,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&report_id=${primaryReportId}`,
      cancel_url: `${origin}/intake?checkout=true`,
      metadata: {
        report_ids: allReportIds.join(","),
        pet_count: actualPetCount.toString(),
        selected_tier: input.selectedTier,
        pet_tiers: JSON.stringify(petTiers),
        pet_photos: JSON.stringify(input.petPhotos || {}),
        include_gift: input.includeGiftForFriend ? "true" : "false",
        gift_tier_for_friend: input.includeGiftForFriend ? (input.giftTierForFriend || 'basic') : "",
        includes_portrait: anyPetHasPortrait ? "true" : "false",
        includes_book: input.includesBook ? "true" : "false",
        is_gift: input.isGift ? "true" : "false",
        recipient_name: input.recipientName,
        recipient_email: input.recipientEmail,
        gift_message: input.giftMessage,
        coupon_id: input.couponId || "",
        gift_certificate_id: input.giftCertificateId || "",
        referral_code: input.referralCode || "",
        include_horoscope: (horoscopePetCount > 0 || input.includeHoroscope) ? "true" : "false",
        horoscope_pet_count: horoscopePetCount.toString(),
        pet_horoscopes: JSON.stringify(petHoroscopes),
        pet_photo_url: input.petPhotoUrl || "",
        ab_variant: input.abVariant || "",
      },
    });

    console.log("[CREATE-CHECKOUT] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("[CREATE-CHECKOUT] Validation errors:", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid request parameters"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
