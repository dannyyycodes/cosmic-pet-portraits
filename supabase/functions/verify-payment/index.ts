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
      // SECURITY FIX: Generic error message
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("[VERIFY-PAYMENT] Verifying session:", sessionId, "report:", reportId);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // SECURITY FIX: Generic error - don't reveal config details
      console.error("[VERIFY-PAYMENT] Missing STRIPE_SECRET_KEY configuration");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle dev mode sessions
    if (sessionId.startsWith('dev_test_')) {
      console.log("[VERIFY-PAYMENT] Dev mode - skipping Stripe verification");
      
      // First get the primary report to find the email
      const { data: primaryReport } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (!primaryReport) {
        return new Response(JSON.stringify({ error: "Report not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Find all reports with the same email created within last 10 minutes (multi-pet order)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: allPetReports } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .eq("email", primaryReport.email)
        .gte("created_at", tenMinutesAgo)
        .order("created_at", { ascending: true });

      const reportIds = allPetReports?.map((r: any) => r.id) || [reportId];
      console.log("[VERIFY-PAYMENT] Dev mode - found reports:", reportIds.length);

      // Generate share tokens for each report
      const generateShareToken = () => {
        const bytes = new Uint8Array(12);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      // Update all reports as paid with share tokens
      for (const id of reportIds) {
        const shareToken = generateShareToken();
        await supabaseClient
          .from("pet_reports")
          .update({ 
            payment_status: "paid",
            share_token: shareToken,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);
      }
      
      // Generate reports for each pet
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

      // Fetch ALL updated reports
      const { data: allReports } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .in("id", reportIds)
        .order("created_at", { ascending: true });

      const updatedPrimaryReport = allReports?.find((r: any) => r.id === reportId) || allReports?.[0];

      return new Response(JSON.stringify({ 
        success: true, 
        report: updatedPrimaryReport,
        allReports: allReports || [updatedPrimaryReport],
        reportIds: reportIds
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // For subscription mode, check payment_status OR subscription status
    const isPaid = session.payment_status === "paid" || 
                   (session.mode === "subscription" && session.subscription);
    
    if (!isPaid) {
      console.log("[VERIFY-PAYMENT] Payment not completed:", session.payment_status, "mode:", session.mode);
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
    
    // Check if gift was included
    const includeGift = session.metadata?.include_gift === "true";
    let giftCode: string | null = null;

    // If gift was included, create a gift certificate for the friend
    if (includeGift) {
      // Generate a secure gift code
      const randomBytes = new Uint8Array(8);
      crypto.getRandomValues(randomBytes);
      giftCode = "GIFT-" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 12);
      
      // Get purchaser email from primary report
      const { data: primaryReport } = await supabaseClient
        .from("pet_reports")
        .select("email")
        .eq("id", reportId)
        .single();
      
      if (primaryReport?.email) {
        // Create gift certificate
        const { error: giftError } = await supabaseClient
          .from("gift_certificates")
          .insert({
            code: giftCode,
            amount_cents: 3500, // $35 basic report value
            purchaser_email: primaryReport.email,
            stripe_session_id: sessionId,
          });
        
        if (giftError) {
          console.error("[VERIFY-PAYMENT] Failed to create gift certificate:", giftError);
          giftCode = null;
        } else {
          console.log("[VERIFY-PAYMENT] Gift certificate created:", giftCode);
        }
      }
    }

    // Generate share tokens for each report
    const generateShareToken = () => {
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Update all reports as paid with share tokens
    for (const id of reportIds) {
      const shareToken = generateShareToken();
      await supabaseClient
        .from("pet_reports")
        .update({ 
          payment_status: "paid", 
          stripe_session_id: sessionId,
          share_token: shareToken,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);
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

    // Fetch ALL reports for multi-pet orders
    const { data: allReports } = await supabaseClient
      .from("pet_reports")
      .select("*")
      .in("id", reportIds);

    // Fetch the primary report
    const { data: finalReport } = await supabaseClient
      .from("pet_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    return new Response(JSON.stringify({ 
      success: true, 
      report: finalReport,
      allReports: allReports || [finalReport], // Return all reports for multi-pet
      reportIds: reportIds,
      includeGift,
      giftCode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // SECURITY FIX: Generic error message - log details server-side only
    console.error("[VERIFY-PAYMENT] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
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