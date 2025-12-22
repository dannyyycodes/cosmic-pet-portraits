import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

// Validate admin token against the database
async function validateAdminToken(supabaseClient: any, token: string | null): Promise<{ valid: boolean; adminId?: string }> {
  if (!token) {
    return { valid: false };
  }

  try {
    const { data: session, error } = await supabaseClient
      .from('admin_sessions')
      .select('admin_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !session) {
      return { valid: false };
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabaseClient
        .from('admin_sessions')
        .delete()
        .eq('token', token);
      return { valid: false };
    }

    return { valid: true, adminId: session.admin_id };
  } catch (err) {
    console.error('Token validation error:', err);
    return { valid: false };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with service role for admin operations
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate admin token
    const adminToken = req.headers.get("X-Admin-Token");
    const authResult = await validateAdminToken(supabaseClient, adminToken);
    
    if (!authResult.valid) {
      console.log("Admin authentication failed");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    console.log(`Admin data request: action=${action}, adminId=${authResult.adminId}`);

    switch (action) {
      case "dashboard": {
        // Load all dashboard data
        const [reportsResult, subscriptionsResult, affiliatesResult, giftsResult] = await Promise.all([
          supabaseClient
            .from('pet_reports')
            .select('id, pet_name, email, payment_status, created_at, species')
            .order('created_at', { ascending: false }),
          supabaseClient
            .from('horoscope_subscriptions')
            .select('*')
            .order('created_at', { ascending: false }),
          supabaseClient
            .from('affiliates')
            .select('*'),
          supabaseClient
            .from('gift_certificates')
            .select('*'),
        ]);

        if (reportsResult.error) throw reportsResult.error;
        if (subscriptionsResult.error) throw subscriptionsResult.error;
        if (affiliatesResult.error) throw affiliatesResult.error;
        if (giftsResult.error) throw giftsResult.error;

        return new Response(
          JSON.stringify({
            reports: reportsResult.data || [],
            subscriptions: subscriptionsResult.data || [],
            affiliates: affiliatesResult.data || [],
            gifts: giftsResult.data || [],
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "reports": {
        const { data, error } = await supabaseClient
          .from('pet_reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        return new Response(
          JSON.stringify({ reports: data || [] }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "subscriptions": {
        const { data, error } = await supabaseClient
          .from('horoscope_subscriptions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        return new Response(
          JSON.stringify({ subscriptions: data || [] }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "gifts": {
        const { data, error } = await supabaseClient
          .from('gift_certificates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        return new Response(
          JSON.stringify({ gifts: data || [] }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      case "blog": {
        const [postsResult, topicsResult] = await Promise.all([
          supabaseClient
            .from('blog_posts')
            .select('id, title, slug, views, cta_clicks, conversions, is_published, published_at, created_at, category, species')
            .order('created_at', { ascending: false }),
          supabaseClient
            .from('blog_topics')
            .select('id, topic, species, category, is_used')
            .order('priority', { ascending: false }),
        ]);
        
        if (postsResult.error) throw postsResult.error;
        if (topicsResult.error) throw topicsResult.error;

        return new Response(
          JSON.stringify({ posts: postsResult.data || [], topics: topicsResult.data || [] }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }
  } catch (error: any) {
    console.error("Admin data error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
