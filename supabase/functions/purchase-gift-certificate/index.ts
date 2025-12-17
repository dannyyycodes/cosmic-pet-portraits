import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GIFT-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      purchaserEmail,
      recipientEmail,
      recipientName,
      giftMessage,
      amountCents 
    } = await req.json();

    console.log("[PURCHASE-GIFT] Starting gift certificate purchase", { 
      purchaserEmail, 
      recipientEmail, 
      amountCents 
    });

    if (!purchaserEmail || !amountCents) {
      throw new Error("Missing required fields: purchaserEmail and amountCents");
    }

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
      customer_email: purchaserEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Cosmic Pet Report Gift Certificate',
              description: recipientName 
                ? `Gift for ${recipientName}` 
                : 'A magical gift for a pet lover',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/gift-success?code=${giftCode}`,
      cancel_url: `${req.headers.get("origin")}/gift-canceled`,
      metadata: {
        type: 'gift_certificate',
        gift_code: giftCode,
        recipient_email: recipientEmail || '',
        recipient_name: recipientName || '',
        gift_message: giftMessage || '',
      },
    });

    // Create pending gift certificate record
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Valid for 1 year

    const { error: insertError } = await supabaseClient
      .from('gift_certificates')
      .insert({
        code: giftCode,
        purchaser_email: purchaserEmail,
        recipient_email: recipientEmail || null,
        recipient_name: recipientName || null,
        gift_message: giftMessage || null,
        amount_cents: amountCents,
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
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PURCHASE-GIFT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
