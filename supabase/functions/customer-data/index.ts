import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      console.error("[CUSTOMER-DATA] Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    const [reportsResult, affiliateResult, giftsResult, subscriberResult] = await Promise.all([
      // Pet reports for this user
      supabaseAdmin
        .from("pet_reports")
        .select("id, pet_name, species, breed, birth_date, payment_status, created_at, share_token")
        .or(`email.eq.${email},user_id.eq.${userId}`)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false }),
      
      // Affiliate status (if they're an affiliate)
      supabaseAdmin
        .from("affiliates")
        .select("id, referral_code, total_referrals, total_earnings_cents, pending_balance_cents, status, commission_rate")
        .eq("email", email)
        .maybeSingle(),
      
      // Gift certificates purchased
      supabaseAdmin
        .from("gift_certificates")
        .select("id, code, amount_cents, recipient_name, recipient_email, is_redeemed, created_at")
        .eq("purchaser_email", email)
        .order("created_at", { ascending: false }),
      
      // Email subscription status
      supabaseAdmin
        .from("email_subscribers")
        .select("id, is_subscribed, journey_stage, created_at")
        .eq("email", email)
        .maybeSingle(),
    ]);

    if (reportsResult.error) console.error("[CUSTOMER-DATA] Reports error:", reportsResult.error);
    if (affiliateResult.error) console.error("[CUSTOMER-DATA] Affiliate error:", affiliateResult.error);
    if (giftsResult.error) console.error("[CUSTOMER-DATA] Gifts error:", giftsResult.error);
    if (subscriberResult.error) console.error("[CUSTOMER-DATA] Subscriber error:", subscriberResult.error);

    const response = {
      reports: reportsResult.data || [],
      affiliate: affiliateResult.data,
      gifts: giftsResult.data || [],
      emailPreferences: subscriberResult.data ? {
        isSubscribed: subscriberResult.data.is_subscribed,
        subscribedAt: subscriberResult.data.created_at,
      } : null,
    };

    console.log("[CUSTOMER-DATA] Found:", {
      reports: response.reports.length,
      isAffiliate: !!response.affiliate,
      gifts: response.gifts.length,
      hasEmailPrefs: !!response.emailPreferences,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[CUSTOMER-DATA] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
