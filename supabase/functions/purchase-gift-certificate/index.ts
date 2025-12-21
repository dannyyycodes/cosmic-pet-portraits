import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid gift tiers with base amounts (server-side truth)
const GIFT_TIERS = {
  essential: { cents: 3500, name: 'Essential Cosmic Reading' },
  portrait: { cents: 5000, name: 'Cosmic Portrait Edition' },
  vip: { cents: 12900, name: 'Cosmic VIP Experience' },
} as const;

type GiftTier = keyof typeof GIFT_TIERS;

// Volume discount tiers
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.50;
  if (petCount >= 4) return 0.40;
  if (petCount >= 3) return 0.30;
  if (petCount >= 2) return 0.20;
  return 0;
}

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);

  let code = "GIFT-";
  for (let i = 0; i < 4; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  code += "-";
  for (let i = 4; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

// Pet schema for individual pet tiers
const giftPetSchema = z.object({
  id: z.string(),
  tier: z.enum(["essential", "portrait", "vip"]),
});

// Input validation schema
const giftSchema = z.object({
  purchaserEmail: z.string().email().max(255),
  recipientEmail: z.string().email().max(255).optional().or(z.literal("")).or(z.null()),
  recipientName: z.string().max(100).optional().default(""),
  giftMessage: z.string().max(500).optional().default(""),
  deliveryMethod: z.enum(["email", "link"]).optional().default("email"),
  // New: array of pets with individual tiers
  giftPets: z.array(giftPetSchema).min(1).max(10).optional(),
  // Legacy support
  tier: z.enum(["essential", "portrait", "vip"]).optional(),
  petCount: z.number().int().min(1).max(10).optional(),
});

const logStep = (step: string, details?: unknown) => {
  console.log(`[PURCHASE-GIFT] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const input = giftSchema.parse(rawInput);
    
    // Determine pets and tiers
    let giftPets: { id: string; tier: GiftTier }[] = [];
    
    if (input.giftPets && input.giftPets.length > 0) {
      // New mix-and-match mode
      giftPets = input.giftPets;
    } else if (input.tier) {
      // Legacy mode: same tier for all pets
      const count = input.petCount || 1;
      giftPets = Array.from({ length: count }, (_, i) => ({
        id: `legacy-${i}`,
        tier: input.tier as GiftTier,
      }));
    } else {
      throw new Error("Must provide either giftPets array or tier");
    }
    
    const petCount = giftPets.length;
    const discount = getVolumeDiscount(petCount);
    
    // Calculate total based on individual pet tiers
    const baseTotal = giftPets.reduce((sum, pet) => sum + GIFT_TIERS[pet.tier].cents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const finalTotal = baseTotal - discountAmount;
    
    // Determine the "primary" tier for display (most expensive or most common)
    const tierCounts = giftPets.reduce((acc, pet) => {
      acc[pet.tier] = (acc[pet.tier] || 0) + 1;
      return acc;
    }, {} as Record<GiftTier, number>);
    
    const primaryTier = (Object.entries(tierCounts) as [GiftTier, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    logStep("Starting gift certificate purchase", {
      purchaserEmail: input.purchaserEmail,
      recipientEmail: input.recipientEmail,
      giftPets,
      petCount,
      discount,
      baseTotal,
      finalTotal,
      deliveryMethod: input.deliveryMethod,
    });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Generate unique gift code
    let giftCode = generateGiftCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseClient
        .from("gift_certificates")
        .select("id")
        .eq("code", giftCode)
        .single();

      if (!existing) break;
      giftCode = generateGiftCode();
      attempts++;
    }

    logStep("Generated gift code", { giftCode });

    const origin = req.headers.get("origin") ?? "https://astropets.cloud";
    
    // Build product name based on pets
    const tierSummary = (Object.entries(tierCounts) as [GiftTier, number][])
      .map(([tier, count]) => `${count}x ${GIFT_TIERS[tier].name}`)
      .join(', ');
    
    const productName = petCount === 1 
      ? `Gift Certificate: ${GIFT_TIERS[giftPets[0].tier].name}`
      : `Gift Certificate: ${petCount} Pet Readings`;
    
    const productDescription = input.recipientName 
      ? `Gift for ${input.recipientName} - ${tierSummary}`
      : `AstroPets Cosmic Gift - ${tierSummary}`;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.purchaserEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: productDescription,
              images: ["https://astropets.cloud/og-image.jpg"],
            },
            unit_amount: finalTotal,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/gift-success?code=${giftCode}&delivery=${input.deliveryMethod}`,
      cancel_url: `${origin}/gift`,
      metadata: {
        type: "gift_certificate",
        gift_code: giftCode,
        giftTier: primaryTier, // Primary tier for backwards compat
        petCount: String(petCount),
        discountPercent: String(Math.round(discount * 100)),
        giftPetsJson: JSON.stringify(giftPets), // Store full pet config
        recipientEmail: input.recipientEmail || "",
        recipientName: input.recipientName || "",
        giftMessage: input.giftMessage || "",
        deliveryMethod: input.deliveryMethod,
      },
    });

    logStep("Stripe session created", { sessionId: session.id });

    // Create gift certificate record (pending payment)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: insertError } = await supabaseClient
      .from("gift_certificates")
      .insert({
        code: giftCode,
        purchaser_email: input.purchaserEmail,
        recipient_email: input.recipientEmail || null,
        recipient_name: input.recipientName || null,
        gift_message: input.giftMessage || null,
        amount_cents: finalTotal,
        gift_tier: primaryTier,
        pet_count: petCount,
        stripe_session_id: session.id,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      logStep("Failed to create gift certificate record", insertError);
      throw new Error("Failed to create gift certificate");
    }

    logStep("Gift certificate record created", { giftCode, petCount, primaryTier });

    return new Response(
      JSON.stringify({
        url: session.url,
        giftCode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logStep("Validation error", error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: error.errors.map((e) => e.message).join(", "),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("Error", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});