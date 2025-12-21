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

// Volume discount tiers (must match frontend)
const VOLUME_DISCOUNTS = [
  { minPets: 1, discount: 0 },
  { minPets: 2, discount: 20 },
  { minPets: 3, discount: 30 },
  { minPets: 4, discount: 40 },
  { minPets: 5, discount: 50 },
];

function getVolumeDiscount(petCount: number): number {
  for (let i = VOLUME_DISCOUNTS.length - 1; i >= 0; i--) {
    if (petCount >= VOLUME_DISCOUNTS[i].minPets) {
      return VOLUME_DISCOUNTS[i].discount;
    }
  }
  return 0;
}

function calculateGiftPrice(tier: GiftTier, petCount: number): { baseTotal: number; discountAmount: number; finalTotal: number } {
  const basePrice = GIFT_TIERS[tier].cents;
  const baseTotal = basePrice * petCount;
  const discountPercent = getVolumeDiscount(petCount);
  const discountAmount = Math.round(baseTotal * (discountPercent / 100));
  const finalTotal = baseTotal - discountAmount;
  return { baseTotal, discountAmount, finalTotal };
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

// Input validation schema
const giftSchema = z.object({
  purchaserEmail: z.string().email().max(255),
  recipientEmail: z.string().email().max(255).optional().or(z.literal("")).or(z.null()),
  recipientName: z.string().max(100).optional().default(""),
  giftMessage: z.string().max(500).optional().default(""),
  tier: z.enum(["essential", "portrait", "vip"]),
  petCount: z.number().int().min(1).max(10).default(1),
  deliveryMethod: z.enum(["email", "link"]).optional().default("email"),
  // Legacy support for old amountCents field
  amountCents: z.number().int().optional(),
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
    
    // Determine tier from input (support legacy amountCents)
    let tier: GiftTier = input.tier;
    if (!tier && input.amountCents) {
      if (input.amountCents >= 12900) tier = 'vip';
      else if (input.amountCents >= 5000) tier = 'portrait';
      else tier = 'essential';
    }
    
    const petCount = input.petCount || 1;
    const pricing = calculateGiftPrice(tier, petCount);

    logStep("Starting gift certificate purchase", {
      purchaserEmail: input.purchaserEmail,
      recipientEmail: input.recipientEmail,
      tier,
      petCount,
      pricing,
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
    const tierInfo = GIFT_TIERS[tier];
    
    // Build product name with pet count
    const productName = petCount === 1 
      ? `Gift Certificate: ${tierInfo.name}`
      : `Gift Certificate: ${tierInfo.name} (${petCount} pets)`;
    
    const productDescription = input.recipientName 
      ? `Gift for ${input.recipientName}${petCount > 1 ? ` - ${petCount} pet readings` : ''}`
      : `AstroPets Cosmic Pet Report Gift${petCount > 1 ? ` - ${petCount} pet readings` : ''}`;

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
            unit_amount: pricing.finalTotal,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/gift-success?code=${giftCode}&delivery=${input.deliveryMethod}`,
      cancel_url: `${origin}/gift`,
      metadata: {
        type: "gift_certificate",
        gift_code: giftCode,
        giftTier: tier,
        petCount: String(petCount),
        discountPercent: String(getVolumeDiscount(petCount)),
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
        amount_cents: pricing.finalTotal,
        gift_tier: tier,
        pet_count: petCount,
        stripe_session_id: session.id,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      logStep("Failed to create gift certificate record", insertError);
      throw new Error("Failed to create gift certificate");
    }

    logStep("Gift certificate record created", { giftCode, tier, petCount });

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
