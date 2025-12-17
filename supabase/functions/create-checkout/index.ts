import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed pricing tiers
const TIERS = {
  basic: {
    name: 'Cosmic Pet Report',
    priceCents: 3500,
  },
  premium: {
    name: 'Premium Cosmic Report',
    priceCents: 5000,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      reportIds,  // Array of report IDs
      reportId,   // Legacy single report ID
      petCount = 1,
      selectedTier = 'basic',
      selectedProducts,
      couponId, 
      giftCertificateId,
      isGift,
      recipientName,
      recipientEmail,
      giftMessage,
      totalCents,
      includeGiftForFriend = false,
    } = await req.json();

    // Support both single reportId and array of reportIds
    const allReportIds = reportIds || (reportId ? [reportId] : []);
    const primaryReportId = allReportIds[0];

    console.log("[CREATE-CHECKOUT] Starting checkout for reports:", allReportIds, "tier:", selectedTier, "includeGift:", includeGiftForFriend);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the primary report to get email and pet name
    const { data: report, error: reportError } = await supabaseClient
      .from("pet_reports")
      .select("email, pet_name")
      .eq("id", primaryReportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Get tier pricing
    const tier = TIERS[selectedTier as keyof typeof TIERS] || TIERS.basic;
    const actualPetCount = allReportIds.length || petCount;
    
    // Build line items based on tier and pet count
    const lineItems: any[] = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: actualPetCount > 1 
            ? `${tier.name} × ${actualPetCount} pets`
            : tier.name,
        },
        unit_amount: totalCents - (includeGiftForFriend ? 3500 : 0), // Subtract gift if included (handled separately)
      },
      quantity: 1,
    }];

    // Add gift reading if selected
    if (includeGiftForFriend) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "🎁 Gift Reading for a Friend",
            description: "A cosmic pet reading gift certificate",
          },
          unit_amount: 3500, // $35
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // If total is 0 (fully covered by gift certificate), skip Stripe
    if (totalCents === 0) {
      console.log("[CREATE-CHECKOUT] Order is free, skipping Stripe");
      
      // Update all reports as paid
      for (const id of allReportIds) {
        await supabaseClient
          .from("pet_reports")
          .update({ payment_status: "paid" })
          .eq("id", id);
      }

      return new Response(JSON.stringify({ 
        url: `${origin}/payment-success?session_id=free&report_id=${primaryReportId}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: report.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&report_id=${primaryReportId}`,
      cancel_url: `${origin}/intake?canceled=true`,
      metadata: {
        report_ids: allReportIds.join(","),
        pet_count: actualPetCount.toString(),
        selected_tier: selectedTier,
        include_gift: includeGiftForFriend ? "true" : "false",
        is_gift: isGift ? "true" : "false",
        recipient_name: recipientName || "",
        recipient_email: recipientEmail || "",
        gift_message: giftMessage || "",
      },
    });

    console.log("[CREATE-CHECKOUT] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
