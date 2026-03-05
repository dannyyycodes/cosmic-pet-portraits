import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, includesPortrait = false, attempt = 1 } = await req.json();

    if (!reportId) {
      console.error("[BACKGROUND-GEN] Missing reportId");
      return new Response(JSON.stringify({ error: "Missing reportId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`[BACKGROUND-GEN] Starting generation for ${reportId}, attempt ${attempt}/${MAX_RETRIES}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the report data
    const { data: report, error: fetchError } = await supabaseClient
      .from("pet_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      console.error("[BACKGROUND-GEN] Report not found:", reportId, fetchError);
      return new Response(JSON.stringify({ error: "Report not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Skip if already has report content (and no error)
    if (report.report_content && !report.report_content.error) {
      console.log("[BACKGROUND-GEN] Report already generated:", reportId);
      return new Response(JSON.stringify({ success: true, already_generated: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Mark as generating
    await supabaseClient
      .from("pet_reports")
      .update({
        report_content: { status: "generating", attempt, started_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    // Prepare pet data for report generation
    const petData = {
      name: report.pet_name,
      species: report.species,
      breed: report.breed ?? '',
      gender: report.gender,
      dateOfBirth: report.birth_date,
      birthTime: report.birth_time ?? '',
      location: report.birth_location ?? '',
      soulType: report.soul_type ?? '',
      superpower: report.superpower ?? '',
      strangerReaction: report.stranger_reaction ?? '',
    };

    // Fire and forget - generate-cosmic-report saves directly to DB
    console.log("[BACKGROUND-GEN] Firing generate-cosmic-report for:", reportId);

    fetch(`${supabaseUrl}/functions/v1/generate-cosmic-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        petData,
        reportId,
        language: report.language || 'en',
        occasionMode: report.occasion_mode || 'discover',
      }),
    }).catch(err => console.error("[BACKGROUND-GEN] Fire-and-forget error:", err));

    // Don't wait - return immediately. The worker saves to DB when done.
    // The frontend polls get-report until content appears.
    console.log("[BACKGROUND-GEN] Generation fired for:", reportId);

    // Send confirmation email in background (will arrive after report is ready)
    sendEmailBackground(supabaseUrl, serviceRoleKey, reportId, report.email, report.pet_name);

    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[BACKGROUND-GEN] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Background email sending
async function sendEmailBackground(
  supabaseUrl: string,
  serviceRoleKey: string,
  reportId: string,
  email: string,
  petName: string,
  sunSign?: string
) {
  try {
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-report-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        reportId,
        email,
        petName,
        sunSign,
      }),
    });

    if (!emailResponse.ok) {
      console.error("[BACKGROUND-GEN] Email sending failed:", await emailResponse.text());
    } else {
      console.log("[BACKGROUND-GEN] Email sent successfully for:", reportId);
    }
  } catch (err) {
    console.error("[BACKGROUND-GEN] Error sending email:", err);
  }
}
