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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      console.error("[CANCEL-SUB] Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: "Subscription ID required" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const email = userData.user.email;
    console.log("[CANCEL-SUB] Cancelling subscription:", subscriptionId, "for:", email);

    // Use service role for updates
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the subscription belongs to this user
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from("horoscope_subscriptions")
      .select("id, email, status, stripe_subscription_id")
      .eq("id", subscriptionId)
      .eq("email", email)
      .single();

    if (fetchError || !subscription) {
      console.error("[CANCEL-SUB] Subscription not found:", fetchError);
      return new Response(JSON.stringify({ error: "Subscription not found" }), {
        status: 404,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (subscription.status === "cancelled") {
      return new Response(JSON.stringify({ error: "Subscription already cancelled" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Cancel the Stripe subscription if it exists
    if (subscription.stripe_subscription_id) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
          console.log("[CANCEL-SUB] Stripe subscription cancelled:", subscription.stripe_subscription_id);
        }
      } catch (stripeErr) {
        console.error("[CANCEL-SUB] Stripe cancel error (continuing with DB cancel):", stripeErr);
        // Continue with DB cancellation even if Stripe fails
      }
    }

    // Cancel in database
    const { error: updateError } = await supabaseAdmin
      .from("horoscope_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (updateError) {
      console.error("[CANCEL-SUB] Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to cancel subscription" }), {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log("[CANCEL-SUB] Successfully cancelled:", subscriptionId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[CANCEL-SUB] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
