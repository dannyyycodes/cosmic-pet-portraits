import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { reportId, giftCode } = await req.json();
    
    console.log("[GET-REPORT] Fetching report:", { reportId, hasGiftCode: !!giftCode });

    if (!reportId && !giftCode) {
      console.log("[GET-REPORT] Missing required parameters");
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let targetReportId = reportId;

    // If using gift code, find the associated report
    if (giftCode) {
      const { data: giftCert, error: giftError } = await supabase
        .from("gift_certificates")
        .select("redeemed_by_report_id")
        .eq("code", giftCode.toUpperCase())
        .single();

      if (giftError || !giftCert?.redeemed_by_report_id) {
        // SECURITY FIX: Generic error - don't reveal if gift code exists
        console.log("[GET-REPORT] Gift certificate lookup failed:", giftCode);
        return new Response(JSON.stringify({ error: "Report not available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      targetReportId = giftCert.redeemed_by_report_id;
    }

    // Fetch the report
    const { data: report, error: fetchError } = await supabase
      .from("pet_reports")
      .select("id, pet_name, report_content, payment_status, species, breed")
      .eq("id", targetReportId)
      .single();

    if (fetchError || !report) {
      console.log("[GET-REPORT] Report not found:", targetReportId);
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // SECURITY FIX: Generic error for all access issues - don't reveal report state
    if (!report.report_content) {
      console.log("[GET-REPORT] Report content not yet generated:", targetReportId);
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (report.payment_status !== "paid") {
      console.log("[GET-REPORT] Report not paid:", targetReportId, report.payment_status);
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Return only safe data (no email)
    return new Response(JSON.stringify({
      petName: report.pet_name,
      report: report.report_content,
      species: report.species,
      breed: report.breed,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // SECURITY FIX: Generic error message - log details server-side only
    console.error("[GET-REPORT] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});