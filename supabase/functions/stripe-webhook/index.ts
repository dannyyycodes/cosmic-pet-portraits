import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    console.error("[STRIPE-WEBHOOK] Missing STRIPE_SECRET_KEY");
    return new Response(JSON.stringify({ error: "Missing Stripe configuration" }), { status: 500 });
  }

  // SECURITY: Require webhook secret in production
  if (!webhookSecret) {
    console.error("[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET is required for security");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // SECURITY: Always require and verify signature
    if (!signature) {
      console.error("[STRIPE-WEBHOOK] Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), { 
        headers: corsHeaders, 
        status: 401 
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[STRIPE-WEBHOOK] Signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { 
        headers: corsHeaders, 
        status: 401 
      });
    }

    console.log("[STRIPE-WEBHOOK] Verified event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if this is a gift certificate purchase
      if (session.metadata?.type === "gift_certificate") {
        const giftCode = session.metadata.gift_code;
        
        if (!giftCode || typeof giftCode !== 'string' || giftCode.length > 20) {
          console.error("[STRIPE-WEBHOOK] Invalid gift code in metadata");
          return new Response(JSON.stringify({ error: "Invalid gift code" }), { status: 400 });
        }

        console.log("[STRIPE-WEBHOOK] Gift certificate payment completed:", giftCode);

        // Find the gift certificate by code
        const { data: giftCert, error: fetchError } = await supabaseClient
          .from("gift_certificates")
          .select("id")
          .eq("code", giftCode)
          .single();

        if (fetchError || !giftCert) {
          console.error("[STRIPE-WEBHOOK] Gift certificate not found:", giftCode);
          return new Response(JSON.stringify({ error: "Gift certificate not found" }), { status: 404 });
        }

        // Call the email sending function
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
        
        try {
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-gift-certificate-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({ giftCertificateId: giftCert.id }),
            }
          );

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error("[STRIPE-WEBHOOK] Email sending failed:", errorText);
          } else {
            console.log("[STRIPE-WEBHOOK] Gift certificate emails sent successfully");
          }
        } catch (emailError) {
          console.error("[STRIPE-WEBHOOK] Failed to call email function:", emailError);
          // Don't fail the webhook - payment was successful, email is secondary
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[STRIPE-WEBHOOK] Error:", message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
