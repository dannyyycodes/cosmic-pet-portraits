import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      console.error("Missing or invalid email");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Processing unsubscribe for:", email);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update subscriber to unsubscribed
    const { data, error } = await supabase
      .from("email_subscribers")
      .update({
        is_subscribed: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase().trim())
      .select();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to unsubscribe" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (!data || data.length === 0) {
      // Email not found, but we don't want to reveal this
      console.log("Email not found in subscribers:", email);
    } else {
      console.log("Successfully unsubscribed:", email);
    }

    // Also cancel any horoscope subscriptions for this email so "cancel
    // anytime from any email" is actually true. Flipping the marketing
    // subscriber flag alone left the recurring horoscope billing running.
    // Mirrors cancel-subscription: cancel in Stripe first, then flip DB status.
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: horoscopeSubs } = await supabase
        .from("horoscope_subscriptions")
        .select("id, stripe_subscription_id")
        .eq("email", normalizedEmail)
        .neq("status", "cancelled");

      if (horoscopeSubs && horoscopeSubs.length > 0) {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

        for (const sub of horoscopeSubs) {
          if (stripe && sub.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(sub.stripe_subscription_id);
              console.log("[UNSUBSCRIBE] Stripe horoscope sub cancelled:", sub.stripe_subscription_id);
            } catch (stripeErr) {
              console.error("[UNSUBSCRIBE] Stripe cancel error (continuing with DB cancel):", stripeErr);
            }
          }
        }

        const { error: horoscopeCancelError } = await supabase
          .from("horoscope_subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("email", normalizedEmail)
          .neq("status", "cancelled");

        if (horoscopeCancelError) {
          console.error("[UNSUBSCRIBE] Failed to cancel horoscope subscriptions:", horoscopeCancelError);
        } else {
          console.log("[UNSUBSCRIBE] Horoscope subscriptions cancelled for:", normalizedEmail);
        }
      }
    } catch (horoscopeErr) {
      console.error("[UNSUBSCRIBE] Horoscope cancellation threw:", horoscopeErr);
      // Non-fatal — the marketing unsubscribe already succeeded.
    }

    // Always return success to not reveal if email exists
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
