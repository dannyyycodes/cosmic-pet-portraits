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

  try {
    const { 
      reportId, 
      selectedProducts, 
      couponId, 
      giftCertificateId,
      isGift,
      recipientName,
      recipientEmail,
      giftMessage,
      totalCents 
    } = await req.json();

    console.log("[CREATE-CHECKOUT] Starting checkout for report:", reportId);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the report to get email
    const { data: report, error: reportError } = await supabaseClient
      .from("pet_reports")
      .select("email, pet_name")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    // Fetch selected products with their Stripe price IDs
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("id, name, price_cents, stripe_price_id")
      .in("id", selectedProducts);

    if (productsError) {
      throw new Error("Failed to fetch products");
    }

    // Build line items
    const lineItems = products.map(product => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
        },
        unit_amount: product.price_cents,
      },
      quantity: 1,
    }));

    // Calculate discounts for metadata
    let discountAmount = 0;
    let couponCode = null;
    let giftCertCode = null;

    if (couponId) {
      const { data: coupon } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("id", couponId)
        .single();
      
      if (coupon) {
        couponCode = coupon.code;
        const subtotal = products.reduce((sum, p) => sum + p.price_cents, 0);
        if (coupon.discount_type === "percentage") {
          discountAmount += Math.round(subtotal * coupon.discount_value / 100);
        } else {
          discountAmount += coupon.discount_value;
        }
      }
    }

    if (giftCertificateId) {
      const { data: giftCert } = await supabaseClient
        .from("gift_certificates")
        .select("*")
        .eq("id", giftCertificateId)
        .single();
      
      if (giftCert) {
        giftCertCode = giftCert.code;
      }
    }

    const origin = req.headers.get("origin") || "https://lovable.dev";

    // If total is 0 (fully covered by gift certificate), skip Stripe
    if (totalCents === 0) {
      console.log("[CREATE-CHECKOUT] Order is free, skipping Stripe");
      
      // Update report as paid
      await supabaseClient
        .from("pet_reports")
        .update({ payment_status: "paid" })
        .eq("id", reportId);

      // Create order items
      for (const product of products) {
        await supabaseClient
          .from("order_items")
          .insert({
            report_id: reportId,
            product_id: product.id,
            price_cents: product.price_cents,
            discount_cents: discountAmount,
            coupon_id: couponId || null,
            gift_certificate_id: giftCertificateId || null,
          });
      }

      return new Response(JSON.stringify({ 
        url: `${origin}/payment-success?session_id=free&report_id=${reportId}` 
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
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&report_id=${reportId}`,
      cancel_url: `${origin}/intake?canceled=true`,
      metadata: {
        report_id: reportId,
        is_gift: isGift ? "true" : "false",
        recipient_name: recipientName || "",
        recipient_email: recipientEmail || "",
        gift_message: giftMessage || "",
        coupon_code: couponCode || "",
        gift_cert_code: giftCertCode || "",
        product_ids: selectedProducts.join(","),
      },
      ...(discountAmount > 0 && {
        discounts: [{
          coupon: await createStripeCoupon(stripe, discountAmount),
        }],
      }),
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

async function createStripeCoupon(stripe: Stripe, amountOff: number): Promise<string> {
  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: "usd",
    duration: "once",
    name: "Applied Discount",
  });
  return coupon.id;
}
