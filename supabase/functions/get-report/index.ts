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
    
    console.log("[GET-REPORT] Fetching report:", { reportId, giftCode });

    if (!reportId && !giftCode) {
      throw new Error("Either reportId or giftCode is required");
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
        throw new Error("Gift certificate not found or not yet redeemed");
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
      throw new Error("Report not found");
    }

    if (!report.report_content) {
      throw new Error("Report is still being generated");
    }

    if (report.payment_status !== "paid") {
      throw new Error("This report has not been purchased yet");
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
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[GET-REPORT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});