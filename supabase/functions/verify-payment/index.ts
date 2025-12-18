import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, reportId } = await req.json();
    
    if (!sessionId || !reportId) {
      throw new Error("Missing sessionId or reportId");
    }

    console.log("[VERIFY-PAYMENT] Verifying session:", sessionId, "report:", reportId);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle dev mode sessions
    if (sessionId.startsWith('dev_test_')) {
      console.log("[VERIFY-PAYMENT] Dev mode - skipping Stripe verification");
      
      // Update report as paid
      await supabaseClient
        .from("pet_reports")
        .update({ 
          payment_status: "paid",
          updated_at: new Date().toISOString()
        })
        .eq("id", reportId);
      
      // Generate report if needed
      const { data: report } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (report && !report.report_content) {
        await generateReport(report, reportId, supabaseClient);
      }

      // Fetch updated report
      const { data: updatedReport } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      return new Response(JSON.stringify({ 
        success: true, 
        report: updatedReport 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      console.log("[VERIFY-PAYMENT] Payment not completed:", session.payment_status);
      return new Response(JSON.stringify({ 
        success: false, 
        status: session.payment_status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[VERIFY-PAYMENT] Payment verified as paid");

    // Get report IDs from session metadata
    const reportIds = session.metadata?.report_ids?.split(",").filter(Boolean) || [reportId];

    // Update all reports as paid
    const { error: updateError } = await supabaseClient
      .from("pet_reports")
      .update({ 
        payment_status: "paid", 
        stripe_session_id: sessionId,
        updated_at: new Date().toISOString()
      })
      .in("id", reportIds);

    if (updateError) {
      console.error("[VERIFY-PAYMENT] Failed to update reports:", updateError);
    }

    // Generate reports for each
    for (const id of reportIds) {
      const { data: report } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .eq("id", id)
        .single();

      if (report && !report.report_content) {
        await generateReport(report, id, supabaseClient);
      }
    }

    // Fetch the primary report
    const { data: finalReport } = await supabaseClient
      .from("pet_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    return new Response(JSON.stringify({ 
      success: true, 
      report: finalReport 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[VERIFY-PAYMENT] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function generateReport(report: any, reportId: string, supabaseClient: any) {
  console.log("[VERIFY-PAYMENT] Generating report for:", reportId);

  const petData = {
    name: report.pet_name,
    species: report.species,
    breed: report.breed ?? '',
    gender: report.gender,
    dateOfBirth: report.birth_date,
    location: report.birth_location ?? '',
    soulType: report.soul_type ?? '',
    superpower: report.superpower ?? '',
    strangerReaction: report.stranger_reaction ?? '',
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  try {
    const genResponse = await fetch(`${supabaseUrl}/functions/v1/generate-cosmic-report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ petData, reportId }),
    });

    const genText = await genResponse.text();
    let genData: any = null;
    try {
      genData = genText ? JSON.parse(genText) : null;
    } catch {
      // ignore parse errors
    }

    if (!genResponse.ok) {
      console.error("[VERIFY-PAYMENT] Report generation failed", {
        status: genResponse.status,
        body: genText,
      });
      return;
    }

    console.log("[VERIFY-PAYMENT] Report generated successfully");

    // Send email (best-effort)
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-report-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        reportId,
        email: report.email,
        petName: report.pet_name,
        sunSign: genData?.report?.sunSign,
      }),
    });

    if (!emailResponse.ok) {
      console.error("[VERIFY-PAYMENT] Email sending failed", {
        status: emailResponse.status,
        body: await emailResponse.text(),
      });
    }
  } catch (err) {
    console.error("[VERIFY-PAYMENT] Error generating report:", err);
  }
}
