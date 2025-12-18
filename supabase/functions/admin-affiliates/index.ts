import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to validate admin token against database
async function validateAdminToken(
  supabaseUrl: string,
  serviceRoleKey: string,
  token: string | null
): Promise<{ valid: boolean; adminId?: string }> {
  if (!token) {
    return { valid: false };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !session) {
    console.log("[ADMIN-AFFILIATES] Token not found in database");
    return { valid: false };
  }

  // Type assertion since we know the shape of the data
  const sessionData = session as { admin_id: string; expires_at: string };

  // Check if token has expired
  if (new Date(sessionData.expires_at) < new Date()) {
    console.log("[ADMIN-AFFILIATES] Token expired, cleaning up");
    await supabase.from("admin_sessions").delete().eq("token", token);
    return { valid: false };
  }

  return { valid: true, adminId: sessionData.admin_id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // SECURITY: Validate admin token against database
  const adminToken = req.headers.get("X-Admin-Token");
  const authResult = await validateAdminToken(supabaseUrl, serviceRoleKey, adminToken);
  
  if (!authResult.valid) {
    console.log("[ADMIN-AFFILIATES] Unauthorized access attempt");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  console.log("[ADMIN-AFFILIATES] Authenticated admin:", authResult.adminId);

  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
  
  if (!authResult.valid) {
    console.log("[ADMIN-AFFILIATES] Unauthorized access attempt");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  console.log("[ADMIN-AFFILIATES] Authenticated admin:", authResult.adminId);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // List all affiliates
    if (action === "list" || !action) {
      const { data: affiliates, error } = await supabaseClient
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get referral counts
      const { data: referralCounts } = await supabaseClient
        .from("affiliate_referrals")
        .select("affiliate_id, status");

      const affiliatesWithStats = affiliates?.map(aff => {
        const refs = referralCounts?.filter(r => r.affiliate_id === aff.id) || [];
        return {
          ...aff,
          pending_referrals: refs.filter(r => r.status === "pending").length,
          paid_referrals: refs.filter(r => r.status === "paid").length,
        };
      });

      return new Response(JSON.stringify({ affiliates: affiliatesWithStats }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get affiliate details with referrals
    if (action === "details") {
      const affiliateId = url.searchParams.get("id");
      if (!affiliateId) {
        return new Response(JSON.stringify({ error: "Missing affiliate ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: affiliate } = await supabaseClient
        .from("affiliates")
        .select("*")
        .eq("id", affiliateId)
        .single();

      const { data: referrals } = await supabaseClient
        .from("affiliate_referrals")
        .select("*")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ affiliate, referrals }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update affiliate status
    if (action === "update-status") {
      const body = await req.json();
      const { affiliateId, status } = body;

      if (!affiliateId || !["active", "pending", "inactive"].includes(status)) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseClient
        .from("affiliates")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", affiliateId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update commission rate
    if (action === "update-commission") {
      const body = await req.json();
      const { affiliateId, commissionRate } = body;

      if (!affiliateId || typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1) {
        return new Response(JSON.stringify({ error: "Invalid parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseClient
        .from("affiliates")
        .update({ commission_rate: commissionRate, updated_at: new Date().toISOString() })
        .eq("id", affiliateId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trigger payouts
    if (action === "trigger-payout") {
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");

      const response = await fetch(`${supabaseUrl}/functions/v1/payout-affiliates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: response.ok ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get dashboard stats
    if (action === "stats") {
      const { data: affiliates } = await supabaseClient
        .from("affiliates")
        .select("status, total_earnings_cents, pending_balance_cents");

      const { data: referrals } = await supabaseClient
        .from("affiliate_referrals")
        .select("status, commission_cents, amount_cents");

      const stats = {
        totalAffiliates: affiliates?.length || 0,
        activeAffiliates: affiliates?.filter(a => a.status === "active").length || 0,
        pendingAffiliates: affiliates?.filter(a => a.status === "pending").length || 0,
        totalEarnings: affiliates?.reduce((sum, a) => sum + (a.total_earnings_cents || 0), 0) || 0,
        pendingPayouts: affiliates?.reduce((sum, a) => sum + (a.pending_balance_cents || 0), 0) || 0,
        totalReferrals: referrals?.length || 0,
        totalRevenue: referrals?.reduce((sum, r) => sum + (r.amount_cents || 0), 0) || 0,
      };

      return new Response(JSON.stringify({ stats }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ADMIN-AFFILIATES] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
