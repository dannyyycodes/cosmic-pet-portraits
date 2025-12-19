import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid gift amounts (server-side truth)
const VALID_AMOUNTS = [3500, 5000, 12900]; // $35, $50, $129

function generateGiftCode(): string {
  // Use cryptographically secure random values
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  
  let code = 'GIFT-';
  for (let i = 0; i < 4; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  code += '-';
  for (let i = 4; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

// Input validation schema
const giftSchema = z.object({
  purchaserEmail: z.string().email().max(255),
  recipientEmail: z.string().email().max(255).optional().or(z.literal('')).or(z.null()),
  recipientName: z.string().max(100).optional().default(''),
  giftMessage: z.string().max(500).optional().default(''),
  amountCents: z.number().int().refine(a => VALID_AMOUNTS.includes(a), "Invalid gift amount"),
  deliveryMethod: z.enum(['email', 'link']).optional().default('email'),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const input = giftSchema.parse(rawInput);

    console.log("[PURCHASE-GIFT] Starting gift certificate purchase", { 
      purchaserEmail: input.purchaserEmail, 
      recipientEmail: input.recipientEmail, 
      amountCents: input.amountCents 
    });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate unique gift code
    let giftCode = generateGiftCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseClient
        .from('gift_certificates')
        .select('id')
        .eq('code', giftCode)
        .single();
      
      if (!existing) break;
      giftCode = generateGiftCode();
      attempts++;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: input.purchaserEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Cosmic Pet Report Gift Certificate',
              description: input.recipientName 
                ? `Gift for ${input.recipientName}` 
                : 'A magical gift for a pet lover',
            },
            unit_amount: input.amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/gift-success?code=${giftCode}&delivery=${input.deliveryMethod}`,
      cancel_url: `${req.headers.get("origin")}/gift`,
      metadata: {
        type: 'gift_certificate',
        gift_code: giftCode,
        recipient_email: input.recipientEmail || '',
        recipient_name: input.recipientName,
        gift_message: input.giftMessage,
      },
    });

    // Create pending gift certificate record
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: insertError } = await supabaseClient
      .from('gift_certificates')
      .insert({
        code: giftCode,
        purchaser_email: input.purchaserEmail,
        recipient_email: input.recipientEmail || null,
        recipient_name: input.recipientName || null,
        gift_message: input.giftMessage || null,
        amount_cents: input.amountCents,
        stripe_session_id: session.id,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[PURCHASE-GIFT] Failed to create gift certificate record", insertError);
      throw new Error("Failed to create gift certificate");
    }

    console.log("[PURCHASE-GIFT] Gift certificate created", { giftCode, sessionId: session.id });

    return new Response(JSON.stringify({ 
      url: session.url,
      giftCode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("[PURCHASE-GIFT] Validation error:", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid input",
        details: error.errors.map(e => e.message).join(", ")
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PURCHASE-GIFT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
