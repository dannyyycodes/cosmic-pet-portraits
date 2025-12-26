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

    // Call the generate-cosmic-report function with extended timeout
    console.log("[BACKGROUND-GEN] Calling generate-cosmic-report...");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout for background

    try {
      const genResponse = await fetch(`${supabaseUrl}/functions/v1/generate-cosmic-report`, {
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!genResponse.ok) {
        const errorText = await genResponse.text();
        throw new Error(`Generation failed: ${genResponse.status} - ${errorText.substring(0, 200)}`);
      }

      const genData = await genResponse.json();
      console.log("[BACKGROUND-GEN] Report generated successfully for:", reportId);

      // Send confirmation email in background
      sendEmailBackground(supabaseUrl, serviceRoleKey, reportId, report.email, report.pet_name, genData?.report?.sunSign);

      return new Response(JSON.stringify({ success: true, reportId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (genError) {
      clearTimeout(timeoutId);
      const errorMessage = genError instanceof Error ? genError.message : String(genError);
      console.error(`[BACKGROUND-GEN] Generation error (attempt ${attempt}):`, errorMessage);

      // If we have retries left, schedule a retry
      if (attempt < MAX_RETRIES) {
        console.log(`[BACKGROUND-GEN] Scheduling retry ${attempt + 1} for ${reportId}`);
        
        // Update status to retrying
        await supabaseClient
          .from("pet_reports")
          .update({
            report_content: { 
              status: "retrying", 
              attempt: attempt + 1, 
              last_error: errorMessage,
              retry_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString()
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", reportId);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));

        // Retry by calling ourselves
        const retryResponse = await fetch(`${supabaseUrl}/functions/v1/generate-report-background`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ reportId, includesPortrait, attempt: attempt + 1 }),
        });

        return new Response(JSON.stringify({ success: true, retrying: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Max retries reached - mark as failed
        console.error(`[BACKGROUND-GEN] Max retries reached for ${reportId}`);
        
        await supabaseClient
          .from("pet_reports")
          .update({
            report_content: { 
              error: "Report generation failed after multiple attempts. Please contact support.", 
              status: "failed",
              attempts: attempt,
              last_error: errorMessage
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", reportId);

        return new Response(JSON.stringify({ error: "Max retries reached", reportId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    }

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
