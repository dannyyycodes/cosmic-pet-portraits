import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const body = await req.json();
    const { 
      sessionId, 
      reportId,
      // Dev mode options passed from frontend
      includeGift: includeGiftFromBody,
      includeHoroscope: includeHoroscopeFromBody,
      selectedTier: selectedTierFromBody,
      includesPortrait: includesPortraitFromBody,
    } = body;
    
    if (!sessionId || !reportId) {
      // SECURITY FIX: Generic error message
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("[VERIFY-PAYMENT] Verifying session:", sessionId, "report:", reportId);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // SECURITY FIX: Generic error - don't reveal config details
      console.error("[VERIFY-PAYMENT] Missing STRIPE_SECRET_KEY configuration");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 503,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // SECURITY: Dev mode bypass disabled - all payments must go through Stripe
    if (sessionId.startsWith('dev_test_')) {
      console.log('[VERIFY-PAYMENT] SECURITY: Blocked dev_test_ payment bypass attempt');
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 403,
      });
    }

        // Handle redeem code sessions (already paid via free code)
    if (sessionId.startsWith('redeem_')) {
      console.log("[VERIFY-PAYMENT] Redeem code session - skipping Stripe verification");

      const { data: redeemReport } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (!redeemReport || redeemReport.payment_status !== 'paid') {
        return new Response(JSON.stringify({ error: "Report not found" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 404,
        });
      }

      // Generate share token if missing
      if (!redeemReport.share_token) {
        const bytes = new Uint8Array(12);
        crypto.getRandomValues(bytes);
        const shareToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        await supabaseClient
          .from("pet_reports")
          .update({ share_token: shareToken, updated_at: new Date().toISOString() })
          .eq("id", reportId);
        redeemReport.share_token = shareToken;
      }

      // Trigger generation if not already done
      const redeemIncludesPortrait = redeemReport.includes_portrait === true;
      if (!redeemReport.report_content) {
        triggerBackgroundGeneration(reportId, redeemIncludesPortrait);
      }

      return new Response(JSON.stringify({
        success: true,
        report: redeemReport,
        allReports: [redeemReport],
        reportIds: [reportId],
        includeGift: false,
        giftCode: null,
        horoscopeEnabled: false,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle gift redemption sessions (already paid via gift certificate)
    if (sessionId.startsWith('gift_')) {
      console.log("[VERIFY-PAYMENT] Gift redemption - skipping Stripe verification");
      
      // For multi-pet gifts, get report_ids from the request body or URL
      const reportIdsFromBody = body.report_ids?.split(',').filter(Boolean) || [reportId];
      const allReportIds = reportIdsFromBody.length > 1 ? reportIdsFromBody : [reportId];
      
      console.log("[VERIFY-PAYMENT] Gift redemption - processing", allReportIds.length, "reports");
      
      // Get the gift certificate to determine per-pet tiers
      const giftCode = sessionId.replace('gift_', '');
      const { data: giftCert } = await supabaseClient
        .from("gift_certificates")
        .select("gift_tier, gift_pets_json")
        .eq("code", giftCode)
        .single();
      
      const giftPetsJson = giftCert?.gift_pets_json as { id: string; tier: string }[] | null;
      const globalTier = giftCert?.gift_tier || 'premium';
      
      // Generate share token helper
      const generateShareToken = () => {
        const bytes = new Uint8Array(12);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      };
      
      // Process each report
      for (let i = 0; i < allReportIds.length; i++) {
        const id = allReportIds[i];
        
        // Determine this pet's tier from gift_pets_json or fallback to global
        const petTier = giftPetsJson?.[i]?.tier || globalTier;
        const includesPortrait = petTier === 'portrait';
        
        console.log(`[VERIFY-PAYMENT] Processing report ${i}:`, { id, petTier, includesPortrait });
        
        // Get the report
        const { data: report } = await supabaseClient
          .from("pet_reports")
          .select("*")
          .eq("id", id)
          .single();

        if (!report) {
          console.log("[VERIFY-PAYMENT] Report not found:", id);
          continue;
        }
        
        // Update report with share token if needed
        if (!report.share_token) {
          const shareToken = generateShareToken();
          await supabaseClient
            .from("pet_reports")
            .update({ 
              share_token: shareToken,
              updated_at: new Date().toISOString()
            })
            .eq("id", id);
        }

        // Generate report if not already generated
        if (!report.report_content) {
          triggerBackgroundGeneration(id, includesPortrait);
        }
      }

      // Fetch ALL updated reports
      const { data: allReports } = await supabaseClient
        .from("pet_reports")
        .select("*")
        .in("id", allReportIds)
        .order("created_at", { ascending: true });
      
      // Check if any pet has horoscope subscription
      const hasAnyPortrait = giftPetsJson
        ? giftPetsJson.some(p => p.tier === 'portrait')
        : (globalTier === 'portrait');

      const primaryReport = allReports?.find((r: any) => r.id === reportId) || allReports?.[0];

      return new Response(JSON.stringify({ 
        success: true, 
        report: primaryReport,
        allReports: allReports || [primaryReport],
        reportIds: allReportIds,
        includeGift: false,
        giftCode: null,
        horoscopeEnabled: hasAnyPortrait,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle PaymentIntent from Express Checkout (Apple Pay / Google Pay)
    if (sessionId.startsWith("pi_")) {
      console.log("[VERIFY-PAYMENT] Handling PaymentIntent:", sessionId);
      const pi = await stripe.paymentIntents.retrieve(sessionId);

      if (pi.status !== "succeeded") {
        return new Response(JSON.stringify({ success: false, status: pi.status }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 200,
        });
      }

      const piEmail = pi.receipt_email || "";
      const piReportIds = pi.metadata?.report_ids?.split(",").filter(Boolean) || [reportId];
      const piIncludesPortrait = pi.metadata?.includes_portrait === "true";

      const generateShareToken = () => {
        const bytes = new Uint8Array(12);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, "0")).join("");
      };

      for (const id of piReportIds) {
        const shareToken = generateShareToken();
        const updateData: Record<string, unknown> = {
          payment_status: "paid",
          stripe_session_id: sessionId,
          share_token: shareToken,
          updated_at: new Date().toISOString(),
        };
        if (piEmail) updateData.email = piEmail.toLowerCase().trim();
        await supabaseClient.from("pet_reports").update(updateData).eq("id", id);
      }

      for (const id of piReportIds) {
        const { data: report } = await supabaseClient.from("pet_reports").select("*").eq("id", id).single();
        if (report && !report.report_content) {
          triggerBackgroundGeneration(id, piIncludesPortrait);
        }
      }

      const { data: allReports } = await supabaseClient.from("pet_reports").select("*").in("id", piReportIds);
      const primaryReport = allReports?.find((r: any) => r.id === reportId) || allReports?.[0];

      return new Response(JSON.stringify({
        success: true,
        report: primaryReport,
        allReports: allReports || [primaryReport],
        reportIds: piReportIds,
        includeGift: false,
        giftCode: null,
        horoscopeEnabled: false,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[VERIFY-PAYMENT] Payment verified as paid");

    // Extract customer email from Stripe session
    const customerEmail = session.customer_details?.email ||
                          session.customer_email || "";

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
      const updateData: Record<string, unknown> = {
          payment_status: "paid",
          stripe_session_id: sessionId,
          share_token: shareToken,
          updated_at: new Date().toISOString(),
        };
        if (customerEmail) {
          updateData.email = customerEmail.toLowerCase().trim();
        }
      await supabaseClient
        .from("pet_reports")
        .update(updateData)
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
        const includesPortrait = session.metadata?.includes_portrait === "true";
        triggerBackgroundGeneration(id, includesPortrait);
      }
    }

    // Create horoscope subscriptions if selected
    const includeHoroscope = session.metadata?.include_horoscope === "true";

    if (includeHoroscope) {
      console.log("[VERIFY-PAYMENT] Creating horoscope subscriptions", { includeHoroscope });
      
      for (const id of reportIds) {
        const { data: petReport } = await supabaseClient
          .from("pet_reports")
          .select("email, pet_name")
          .eq("id", id)
          .single();
        
        if (petReport) {
          // Check if subscription already exists
          const { data: existingSub } = await supabaseClient
            .from("horoscope_subscriptions")
            .select("id")
            .eq("pet_report_id", id)
            .single();
          
          if (!existingSub) {
            const { error: subError } = await supabaseClient
              .from("horoscope_subscriptions")
              .insert({
                email: petReport.email,
                pet_name: petReport.pet_name,
                pet_report_id: id,
                status: "active",
                next_send_at: new Date().toISOString(),
              });
            
            if (subError) {
              console.error("[VERIFY-PAYMENT] Failed to create horoscope subscription:", subError);
            } else {
              console.log("[VERIFY-PAYMENT] Horoscope subscription created for:", petReport.pet_name);
            }
          }
        }
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
      horoscopeEnabled: includeHoroscope,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // SECURITY FIX: Generic error message - log details server-side only
    console.error("[VERIFY-PAYMENT] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// UPDATED: Trigger background report generation with retries
async function triggerBackgroundGeneration(reportId: string, includesPortrait = false) {
  console.log("[VERIFY-PAYMENT] Triggering background generation for:", reportId);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  try {
    // Fire and forget - don't wait for the result
    fetch(`${supabaseUrl}/functions/v1/generate-report-background`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ reportId, includesPortrait, attempt: 1 }),
    }).catch(err => {
      console.error("[VERIFY-PAYMENT] Failed to trigger background generation:", err);
    });

    console.log("[VERIFY-PAYMENT] Background generation triggered for:", reportId);
  } catch (err) {
    console.error("[VERIFY-PAYMENT] Error triggering background generation:", err);
  }
}

// Background portrait generation - runs after main response
async function generatePortraitBackground(
  supabaseUrl: string,
  serviceRoleKey: string,
  reportId: string,
  report: any,
  genData: any,
  supabaseClient: any
) {
  try {
    const portraitResponse = await fetch(
      `${supabaseUrl}/functions/v1/generate-pet-portrait`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          petName: report.pet_name,
          species: report.species || 'pet',
          breed: report.breed || '',
          sunSign: genData?.report?.chartPlacements?.sun?.sign || genData?.report?.sunSign || 'Leo',
          element: genData?.report?.dominantElement || 'Fire',
          archetype: genData?.report?.archetype?.name || 'Cosmic Soul',
          style: 'pokemon',
          petImageUrl: report.pet_photo_url,
          reportId: reportId,
        }),
      }
    );

    if (portraitResponse.ok) {
      const portraitData = await portraitResponse.json();
      if (portraitData.imageUrl) {
        await supabaseClient
          .from("pet_reports")
          .update({ portrait_url: portraitData.imageUrl })
          .eq("id", reportId);
        console.log("[VERIFY-PAYMENT] AI portrait saved for:", reportId);
      }
    } else {
      console.error("[VERIFY-PAYMENT] Portrait generation failed:", await portraitResponse.text());
    }
  } catch (portraitError) {
    console.error("[VERIFY-PAYMENT] Portrait generation error:", portraitError);
  }
}

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
      console.error("[VERIFY-PAYMENT] Email sending failed", {
        status: emailResponse.status,
        body: await emailResponse.text(),
      });
    } else {
      console.log("[VERIFY-PAYMENT] Email sent successfully for:", reportId);
    }
  } catch (err) {
    console.error("[VERIFY-PAYMENT] Error sending email:", err);
  }
}