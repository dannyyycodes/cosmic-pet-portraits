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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth header to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create client with user's token to get their info
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const userEmail = user.email;
    if (!userEmail) {
      throw new Error("User has no email");
    }

    // Use service role to update reports
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Find all reports with this email that don't have a user_id
    const { data: reports, error: fetchError } = await supabaseAdmin
      .from("pet_reports")
      .select("id, pet_name")
      .eq("email", userEmail)
      .is("user_id", null);

    if (fetchError) {
      console.error("Error fetching reports:", fetchError);
      throw fetchError;
    }

    if (!reports || reports.length === 0) {
      return new Response(
        JSON.stringify({ linked: 0, message: "No unlinked reports found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link all reports to this user
    const reportIds = reports.map(r => r.id);
    const { error: updateError } = await supabaseAdmin
      .from("pet_reports")
      .update({ user_id: user.id })
      .in("id", reportIds);

    if (updateError) {
      console.error("Error linking reports:", updateError);
      throw updateError;
    }

    const petNames = reports.map(r => r.pet_name).join(", ");
    console.log(`Linked ${reports.length} reports to user ${user.id}: ${petNames}`);

    return new Response(
      JSON.stringify({ 
        linked: reports.length, 
        petNames,
        message: `Successfully linked ${reports.length} report(s) to your account` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in link-user-reports:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
