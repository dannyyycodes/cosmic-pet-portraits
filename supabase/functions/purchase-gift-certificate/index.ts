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

// Horoscope subscription addons
const HOROSCOPE_ADDONS = {
  none: { cents: 0, name: '' },
  monthly: { cents: 499, name: 'Weekly Cosmic Updates (Monthly)' },
  yearly: { cents: 3999, name: 'Weekly Cosmic Updates (1 Year)' },
} as const;

type GiftTier = keyof typeof GIFT_TIERS;
type HoroscopeAddon = keyof typeof HOROSCOPE_ADDONS;

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

// Pet schema for individual pet tiers with optional recipient
const giftPetSchema = z.object({
  id: z.string(),
  tier: z.enum(["essential", "portrait", "vip"]),
  recipientName: z.string().max(100).optional(),
  recipientEmail: z.string().email().max(255).optional().or(z.literal("")).or(z.null()),
  horoscopeAddon: z.enum(["none", "monthly", "yearly"]).optional().default("none"),
});

// Input validation schema
const giftSchema = z.object({
  purchaserEmail: z.string().email().max(255),
  recipientEmail: z.string().email().max(255).optional().or(z.literal("")).or(z.null()),
  recipientName: z.string().max(100).optional().default(""),
  giftMessage: z.string().max(500).optional().default(""),
  deliveryMethod: z.enum(["email", "link"]).optional().default("email"),
  multiRecipient: z.boolean().optional().default(false),
  // New: array of pets with individual tiers and recipients
  giftPets: z.array(giftPetSchema).min(1).max(10).optional(),
  // Legacy support
  tier: z.enum(["essential", "portrait", "vip"]).optional(),
  petCount: z.number().int().min(1).max(10).optional(),
});

const logStep = (step: string, details?: unknown) => {
  console.log(`[PURCHASE-GIFT] ${step}`, details ? JSON.stringify(details) : '');
};

interface RecipientGroup {
  recipientEmail: string | null;
  recipientName: string;
  pets: { id: string; tier: GiftTier; horoscopeAddon: HoroscopeAddon }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const input = giftSchema.parse(rawInput);
    
    // Determine pets and tiers
    let giftPets: { id: string; tier: GiftTier; horoscopeAddon: HoroscopeAddon; recipientName?: string; recipientEmail?: string | null }[] = [];
    
    if (input.giftPets && input.giftPets.length > 0) {
      // New mix-and-match mode with optional per-pet recipients
      giftPets = input.giftPets.map(p => ({
        ...p,
        horoscopeAddon: (p.horoscopeAddon || 'none') as HoroscopeAddon,
        recipientEmail: p.recipientEmail || null,
      }));
    } else if (input.tier) {
      // Legacy mode: same tier for all pets
      const count = input.petCount || 1;
      giftPets = Array.from({ length: count }, (_, i) => ({
        id: `legacy-${i}`,
        tier: input.tier as GiftTier,
        horoscopeAddon: 'none' as HoroscopeAddon,
      }));
    } else {
      throw new Error("Must provide either giftPets array or tier");
    }
    
    const petCount = giftPets.length;
    const discount = getVolumeDiscount(petCount);
    
    // Calculate total based on individual pet tiers + horoscope addons
    const tierTotal = giftPets.reduce((sum, pet) => sum + GIFT_TIERS[pet.tier].cents, 0);
    const addonTotal = giftPets.reduce((sum, pet) => sum + HOROSCOPE_ADDONS[pet.horoscopeAddon].cents, 0);
    const baseTotal = tierTotal + addonTotal;
    const discountAmount = Math.round(tierTotal * discount); // Only discount tiers, not addons
    const finalTotal = baseTotal - discountAmount;
    
    // Group pets by recipient (for multi-recipient mode)
    const recipientGroups: RecipientGroup[] = [];
    
    if (input.multiRecipient) {
      // Group by recipient email
      const groupMap = new Map<string, RecipientGroup>();
      
      for (const pet of giftPets) {
        const email = pet.recipientEmail?.toLowerCase().trim() || '';
        const key = email || `__no_email_${pet.id}__`;
        
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            recipientEmail: email || null,
            recipientName: pet.recipientName || '',
            pets: [],
          });
        }
        
        const group = groupMap.get(key)!;
        group.pets.push({ id: pet.id, tier: pet.tier, horoscopeAddon: pet.horoscopeAddon });
        // Update name if provided
        if (pet.recipientName && !group.recipientName) {
          group.recipientName = pet.recipientName;
        }
      }
      
      recipientGroups.push(...groupMap.values());
    } else {
      // Single recipient mode - all pets go to one person
      recipientGroups.push({
        recipientEmail: input.recipientEmail || null,
        recipientName: input.recipientName || '',
        pets: giftPets.map(p => ({ id: p.id, tier: p.tier, horoscopeAddon: p.horoscopeAddon })),
      });
    }

    logStep("Starting gift certificate purchase", {
      purchaserEmail: input.purchaserEmail,
      multiRecipient: input.multiRecipient,
      recipientGroups: recipientGroups.length,
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

    // Generate unique gift codes for each recipient group
    const giftCodes: string[] = [];
    
    for (let i = 0; i < recipientGroups.length; i++) {
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
      giftCodes.push(giftCode);
    }

    const primaryGiftCode = giftCodes[0];
    logStep("Generated gift codes", { giftCodes, primary: primaryGiftCode });

    const origin = req.headers.get("origin") ?? "https://astropets.cloud";
    
    // Build product description
    const tierCounts = giftPets.reduce((acc, pet) => {
      acc[pet.tier] = (acc[pet.tier] || 0) + 1;
      return acc;
    }, {} as Record<GiftTier, number>);
    
    const tierSummary = (Object.entries(tierCounts) as [GiftTier, number][])
      .map(([tier, count]) => `${count}x ${GIFT_TIERS[tier].name}`)
      .join(', ');
    
    const productName = petCount === 1 
      ? `Gift Certificate: ${GIFT_TIERS[giftPets[0].tier].name}`
      : recipientGroups.length > 1
        ? `Gift Certificates: ${petCount} Readings for ${recipientGroups.length} Recipients`
        : `Gift Certificate: ${petCount} Pet Readings`;
    
    const productDescription = recipientGroups.length > 1
      ? `AstroPets Cosmic Gifts for ${recipientGroups.length} recipients - ${tierSummary}`
      : input.recipientName 
        ? `Gift for ${input.recipientName} - ${tierSummary}`
        : `AstroPets Cosmic Gift - ${tierSummary}`;

    // Build line items - main gift + any horoscope addons
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    // Main gift certificate (with tier discount applied)
    const giftAmount = tierTotal - discountAmount;
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: productName,
          description: productDescription,
          images: ["https://astropets.cloud/og-image.jpg"],
        },
        unit_amount: giftAmount,
      },
      quantity: 1,
    });
    
    // Add horoscope addon line items (no discount on these)
    const addonCounts = giftPets.reduce((acc, pet) => {
      if (pet.horoscopeAddon !== 'none') {
        acc[pet.horoscopeAddon] = (acc[pet.horoscopeAddon] || 0) + 1;
      }
      return acc;
    }, {} as Record<HoroscopeAddon, number>);
    
    for (const [addon, count] of Object.entries(addonCounts) as [HoroscopeAddon, number][]) {
      if (addon === 'none') continue;
      const addonInfo = HOROSCOPE_ADDONS[addon];
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Gift Add-on: ${addonInfo.name}`,
            description: addon === 'yearly' 
              ? 'A full year of weekly cosmic guidance for their pet'
              : 'Monthly subscription to weekly cosmic guidance',
          },
          unit_amount: addonInfo.cents * count,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.purchaserEmail,
      line_items: lineItems,
      success_url: `${origin}/gift-success?code=${primaryGiftCode}&delivery=${input.deliveryMethod}&count=${recipientGroups.length}`,
      cancel_url: `${origin}/gift`,
      metadata: {
        type: "gift_certificate",
        gift_codes: giftCodes.join(','),
        primary_gift_code: primaryGiftCode,
        recipient_count: String(recipientGroups.length),
        petCount: String(petCount),
        discountPercent: String(Math.round(discount * 100)),
        multiRecipient: String(input.multiRecipient),
        giftMessage: input.giftMessage || "",
        deliveryMethod: input.deliveryMethod,
        horoscopeAddons: JSON.stringify(addonCounts),
        // Store full config for webhook
        recipientGroupsJson: JSON.stringify(recipientGroups.map((group, idx) => ({
          ...group,
          giftCode: giftCodes[idx],
        }))),
      },
    });

    logStep("Stripe session created", { sessionId: session.id });

    // Create gift certificate records (pending payment) - one per recipient group
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    for (let i = 0; i < recipientGroups.length; i++) {
      const group = recipientGroups[i];
      const code = giftCodes[i];
      
      // Calculate amount for this group
      const groupTotal = group.pets.reduce((sum, pet) => sum + GIFT_TIERS[pet.tier].cents, 0);
      const groupDiscount = Math.round(groupTotal * discount);
      const groupFinal = groupTotal - groupDiscount;
      
      // Determine primary tier for this group
      const groupTierCounts = group.pets.reduce((acc, pet) => {
        acc[pet.tier] = (acc[pet.tier] || 0) + 1;
        return acc;
      }, {} as Record<GiftTier, number>);
      
      const primaryTier = (Object.entries(groupTierCounts) as [GiftTier, number][])
        .sort((a, b) => b[1] - a[1])[0][0];

      const { error: insertError } = await supabaseClient
        .from("gift_certificates")
        .insert({
          code,
          purchaser_email: input.purchaserEmail,
          recipient_email: group.recipientEmail || null,
          recipient_name: group.recipientName || null,
          gift_message: input.giftMessage || null,
          amount_cents: groupFinal,
          gift_tier: primaryTier,
          pet_count: group.pets.length,
          gift_pets_json: group.pets,
          stripe_session_id: session.id,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        logStep("Failed to create gift certificate record", { code, error: insertError });
        throw new Error("Failed to create gift certificate");
      }

      logStep("Gift certificate record created", { 
        code, 
        petCount: group.pets.length, 
        primaryTier,
        recipientEmail: group.recipientEmail,
      });
    }

    return new Response(
      JSON.stringify({
        url: session.url,
        giftCode: primaryGiftCode,
        giftCodes,
        recipientCount: recipientGroups.length,
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
