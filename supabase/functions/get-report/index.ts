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
    const { reportId, giftCode, email, shareToken } = await req.json();
    
    console.log("[GET-REPORT] Fetching report:", { reportId, hasGiftCode: !!giftCode, hasEmail: !!email, hasShareToken: !!shareToken });

    if (!reportId && !giftCode && !shareToken) {
      console.log("[GET-REPORT] Missing required parameters");
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // SECURITY: Validate input formats
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const GIFT_CODE_PATTERN = /^[A-Z0-9]{8,20}$/i;
    const SHARE_TOKEN_PATTERN = /^[a-zA-Z0-9]{16,32}$/;

    if (reportId && !UUID_PATTERN.test(reportId)) {
      console.log("[GET-REPORT] Invalid report ID format");
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (giftCode && !GIFT_CODE_PATTERN.test(giftCode)) {
      console.log("[GET-REPORT] Invalid gift code format");
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (shareToken && !SHARE_TOKEN_PATTERN.test(shareToken)) {
      console.log("[GET-REPORT] Invalid share token format");
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
    let isPublicAccess = false;

    // If using share token, find the report (public access - no email required)
    if (shareToken) {
      const { data: tokenReport, error: tokenError } = await supabase
        .from("pet_reports")
        .select("id")
        .eq("share_token", shareToken)
        .single();

      if (tokenError || !tokenReport) {
        console.log("[GET-REPORT] Share token lookup failed:", shareToken);
        return new Response(JSON.stringify({ error: "Report not available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      targetReportId = tokenReport.id;
      isPublicAccess = true;
    }

    // If using gift code, find the associated report
    if (giftCode) {
      const { data: giftCert, error: giftError } = await supabase
        .from("gift_certificates")
        .select("redeemed_by_report_id")
        .eq("code", giftCode.toUpperCase())
        .single();

      if (giftError || !giftCert?.redeemed_by_report_id) {
        console.log("[GET-REPORT] Gift certificate lookup failed:", giftCode);
        return new Response(JSON.stringify({ error: "Report not available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      targetReportId = giftCert.redeemed_by_report_id;
      isPublicAccess = true; // Gift code also provides public access
    }

    // Fetch the report - include email for verification and share_token
    const { data: report, error: fetchError } = await supabase
      .from("pet_reports")
      .select("id, pet_name, report_content, payment_status, species, breed, email, share_token")
      .eq("id", targetReportId)
      .single();

    if (fetchError || !report) {
      console.log("[GET-REPORT] Report not found:", targetReportId);
      return new Response(JSON.stringify({ error: "Report not available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // SECURITY: Verify email ownership if accessing by reportId (not share token or gift code)
    if (reportId && !isPublicAccess) {
      if (!email || !EMAIL_PATTERN.test(email)) {
        console.log("[GET-REPORT] Email verification required for report access");
        return new Response(JSON.stringify({ error: "Email verification required" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
      
      if (email.toLowerCase().trim() !== report.email.toLowerCase().trim()) {
        console.log("[GET-REPORT] Email mismatch for report:", targetReportId);
        return new Response(JSON.stringify({ error: "Report not available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        });
      }
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

    // Return only safe data (no email, include share token for owners)
    return new Response(JSON.stringify({
      petName: report.pet_name,
      report: report.report_content,
      species: report.species,
      breed: report.breed,
      reportId: report.id,
      shareToken: report.share_token, // Include for owner to share
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