import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    console.log("[ADMIN-COUPONS] Token not found in database");
    return { valid: false };
  }

  const sessionData = session as { admin_id: string; expires_at: string };

  if (new Date(sessionData.expires_at) < new Date()) {
    console.log("[ADMIN-COUPONS] Token expired, cleaning up");
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

  // SECURITY: Validate admin token
  const adminToken = req.headers.get("X-Admin-Token");
  const authResult = await validateAdminToken(supabaseUrl, serviceRoleKey, adminToken);
  
  if (!authResult.valid) {
    console.log("[ADMIN-COUPONS] Unauthorized access attempt");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // List all coupons
    if (action === "list" || !action) {
      const { data: coupons, error } = await supabaseClient
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ coupons }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create coupon
    if (action === "create") {
      const body = await req.json();
      const { code, discount_type, discount_value, max_uses, min_purchase_cents, expires_at } = body;

      if (!code || !discount_type || discount_value === undefined) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for duplicate code
      const { data: existing } = await supabaseClient
        .from("coupons")
        .select("id")
        .eq("code", code.toUpperCase())
        .single();

      if (existing) {
        return new Response(JSON.stringify({ error: "Coupon code already exists" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseClient
        .from("coupons")
        .insert({
          code: code.toUpperCase(),
          discount_type,
          discount_value,
          max_uses,
          min_purchase_cents,
          expires_at,
          is_active: true,
          current_uses: 0,
        });

      if (error) throw error;

      console.log("[ADMIN-COUPONS] Created coupon:", code);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update coupon
    if (action === "update") {
      const body = await req.json();
      const { couponId, discount_type, discount_value, max_uses, min_purchase_cents, expires_at, is_active } = body;

      if (!couponId) {
        return new Response(JSON.stringify({ error: "Missing coupon ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: Record<string, unknown> = {};
      if (discount_type !== undefined) updateData.discount_type = discount_type;
      if (discount_value !== undefined) updateData.discount_value = discount_value;
      if (max_uses !== undefined) updateData.max_uses = max_uses;
      if (min_purchase_cents !== undefined) updateData.min_purchase_cents = min_purchase_cents;
      if (expires_at !== undefined) updateData.expires_at = expires_at;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { error } = await supabaseClient
        .from("coupons")
        .update(updateData)
        .eq("id", couponId);

      if (error) throw error;

      console.log("[ADMIN-COUPONS] Updated coupon:", couponId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Toggle coupon status
    if (action === "toggle") {
      const body = await req.json();
      const { couponId, isActive } = body;

      if (!couponId) {
        return new Response(JSON.stringify({ error: "Missing coupon ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseClient
        .from("coupons")
        .update({ is_active: isActive })
        .eq("id", couponId);

      if (error) throw error;

      console.log("[ADMIN-COUPONS] Toggled coupon:", couponId, "to", isActive);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete coupon
    if (action === "delete") {
      const body = await req.json();
      const { couponId } = body;

      if (!couponId) {
        return new Response(JSON.stringify({ error: "Missing coupon ID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabaseClient
        .from("coupons")
        .delete()
        .eq("id", couponId);

      if (error) throw error;

      console.log("[ADMIN-COUPONS] Deleted coupon:", couponId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ADMIN-COUPONS] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
