import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      console.error("[CUSTOMER-DATA] Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const email = userData.user.email;
    const userId = userData.user.id;
    console.log("[CUSTOMER-DATA] Fetching data for:", email);

    // Use service role for data access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all data in parallel
    const [reportsResult, affiliateResult, giftsSentResult, giftsReceivedResult, subscriberResult, subscriptionsResult] = await Promise.all([
      // Pet reports for this user
      supabaseAdmin
        .from("pet_reports")
        .select("id, pet_name, species, breed, birth_date, payment_status, created_at, share_token, portrait_url")
        .or(`email.eq.${email},user_id.eq.${userId}`)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false }),

      // Affiliate status (if they're an affiliate)
      supabaseAdmin
        .from("affiliates")
        .select("id, referral_code, total_referrals, total_earnings_cents, pending_balance_cents, status, commission_rate")
        .eq("email", email)
        .maybeSingle(),

      // Gift certificates this user has sent (purchased for others)
      supabaseAdmin
        .from("gift_certificates")
        .select("id, code, amount_cents, recipient_name, recipient_email, is_redeemed, created_at, gift_tier, gift_message")
        .eq("purchaser_email", email)
        .order("created_at", { ascending: false }),

      // Gift certificates this user has received (someone gifted them)
      supabaseAdmin
        .from("gift_certificates")
        .select("id, code, amount_cents, recipient_name, recipient_email, is_redeemed, created_at, gift_tier, gift_message, purchaser_email, purchaser_name")
        .eq("recipient_email", email)
        .order("created_at", { ascending: false }),

      // Email subscription status
      supabaseAdmin
        .from("email_subscribers")
        .select("id, is_subscribed, journey_stage, created_at")
        .eq("email", email)
        .maybeSingle(),

      // Horoscope subscriptions
      supabaseAdmin
        .from("horoscope_subscriptions")
        .select("id, pet_name, status, created_at, cancelled_at, next_send_at, pet_report_id")
        .eq("email", email)
        .order("created_at", { ascending: false }),
    ]);

    if (reportsResult.error) console.error("[CUSTOMER-DATA] Reports error:", reportsResult.error);
    if (affiliateResult.error) console.error("[CUSTOMER-DATA] Affiliate error:", affiliateResult.error);
    if (giftsSentResult.error) console.error("[CUSTOMER-DATA] Gifts-sent error:", giftsSentResult.error);
    if (giftsReceivedResult.error) console.error("[CUSTOMER-DATA] Gifts-received error:", giftsReceivedResult.error);
    if (subscriberResult.error) console.error("[CUSTOMER-DATA] Subscriber error:", subscriberResult.error);
    if (subscriptionsResult.error) console.error("[CUSTOMER-DATA] Subscriptions error:", subscriptionsResult.error);

    const response = {
      reports: reportsResult.data || [],
      affiliate: affiliateResult.data,
      gifts: giftsSentResult.data || [],          // kept for backwards-compatible UI
      giftsSent: giftsSentResult.data || [],
      giftsReceived: giftsReceivedResult.data || [],
      subscriptions: subscriptionsResult.data || [],
      emailPreferences: subscriberResult.data ? {
        isSubscribed: subscriberResult.data.is_subscribed,
        subscribedAt: subscriberResult.data.created_at,
      } : null,
    };

    console.log("[CUSTOMER-DATA] Found:", {
      reports: response.reports.length,
      isAffiliate: !!response.affiliate,
      giftsSent: response.giftsSent.length,
      giftsReceived: response.giftsReceived.length,
      subscriptions: response.subscriptions.length,
      hasEmailPrefs: !!response.emailPreferences,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[CUSTOMER-DATA] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
