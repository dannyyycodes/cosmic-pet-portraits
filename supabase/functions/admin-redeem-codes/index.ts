import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function validateAdminToken(
  supabaseUrl: string,
  serviceRoleKey: string,
  token: string | null
): Promise<{ valid: boolean; adminId?: string }> {
  if (!token) return { valid: false };

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !session) return { valid: false };

  const sessionData = session as { admin_id: string; expires_at: string };
  if (new Date(sessionData.expires_at) < new Date()) {
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

  const adminToken = req.headers.get("X-Admin-Token");
  const authResult = await validateAdminToken(supabaseUrl, serviceRoleKey, adminToken);

  if (!authResult.valid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST
    if (action === "list" || !action) {
      const { data: codes, error } = await supabase
        .from("redeem_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ codes }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE
    if (action === "create") {
      const body = await req.json();
      const { code, tier, max_uses, note, expires_at } = body;

      if (!code || !code.trim()) {
        return new Response(JSON.stringify({ error: "Code is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newCode, error } = await supabase
        .from("redeem_codes")
        .insert({
          code: code.trim().toUpperCase(),
          tier: tier || "premium",
          max_uses: max_uses || 1,
          note: note || null,
          expires_at: expires_at || null,
          created_by: "admin",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return new Response(JSON.stringify({ error: "Code already exists" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw error;
      }

      return new Response(JSON.stringify({ code: newCode }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TOGGLE
    if (action === "toggle") {
      const body = await req.json();
      const { id, is_active } = body;

      const { error } = await supabase
        .from("redeem_codes")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE
    if (action === "delete") {
      const body = await req.json();
      const { id } = body;

      const { error } = await supabase
        .from("redeem_codes")
        .delete()
        .eq("id", id);

      if (error) throw error;

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
    console.error("[ADMIN-REDEEM] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
