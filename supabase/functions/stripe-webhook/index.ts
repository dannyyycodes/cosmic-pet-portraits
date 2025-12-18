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

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    console.error("[STRIPE-WEBHOOK] Missing STRIPE_SECRET_KEY");
    return new Response(JSON.stringify({ error: "Service unavailable" }), { status: 500 });
  }

  // SECURITY: Require webhook secret in production
  if (!webhookSecret) {
    console.error("[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET is required for security");
    return new Response(JSON.stringify({ error: "Service unavailable" }), { 
      headers: corsHeaders, 
      status: 500 
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // SECURITY: Always require and verify signature
    if (!signature) {
      console.error("[STRIPE-WEBHOOK] Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        headers: corsHeaders, 
        status: 401 
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[STRIPE-WEBHOOK] Signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        headers: corsHeaders, 
        status: 401 
      });
    }

    console.log("[STRIPE-WEBHOOK] Verified event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if this is a gift certificate purchase
      if (session.metadata?.type === "gift_certificate") {
        const giftCode = session.metadata.gift_code;
        
        if (!giftCode || typeof giftCode !== 'string' || giftCode.length > 20) {
          console.error("[STRIPE-WEBHOOK] Invalid gift code in metadata");
          return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
        }

        console.log("[STRIPE-WEBHOOK] Gift certificate payment completed:", giftCode);

        // Find the gift certificate by code
        const { data: giftCert, error: fetchError } = await supabaseClient
          .from("gift_certificates")
          .select("id")
          .eq("code", giftCode)
          .single();

        if (fetchError || !giftCert) {
          console.error("[STRIPE-WEBHOOK] Gift certificate not found:", giftCode);
          return new Response(JSON.stringify({ error: "Resource not found" }), { status: 404 });
        }

        // Call the email sending function
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        try {
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-gift-certificate-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({ giftCertificateId: giftCert.id }),
            }
          );

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error("[STRIPE-WEBHOOK] Email sending failed:", errorText);
          } else {
            console.log("[STRIPE-WEBHOOK] Gift certificate emails sent successfully");
          }
        } catch (emailError) {
          console.error("[STRIPE-WEBHOOK] Failed to call email function:", emailError);
          // Don't fail the webhook - payment was successful, email is secondary
        }
      } else {
        // Handle regular report purchase
        const reportIds = session.metadata?.report_ids?.split(",").filter(Boolean) || [];
        const referralCode = session.metadata?.referral_code;
        const isGift = session.metadata?.is_gift === "true";
        const recipientName = session.metadata?.recipient_name || "";
        const recipientEmail = session.metadata?.recipient_email || "";
        const includesPortrait = session.metadata?.includes_portrait === "true";
        
        if (reportIds.length > 0) {
          console.log("[STRIPE-WEBHOOK] Processing report payment for reports:", reportIds, { isGift, includesPortrait });
          
          // Track referral if present
          if (referralCode) {
            try {
              const supabaseUrl = Deno.env.get("SUPABASE_URL");
              await fetch(`${supabaseUrl}/functions/v1/track-referral`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  referralCode,
                  sessionId: session.id,
                  amount: session.amount_total || 0,
                }),
              });
              console.log("[STRIPE-WEBHOOK] Referral tracked:", referralCode);
            } catch (refErr) {
              console.error("[STRIPE-WEBHOOK] Referral tracking failed:", refErr);
            }
          }
          
          // Update all reports as paid - also set gift mode if applicable
          const updateData: any = { 
            payment_status: "paid", 
            stripe_session_id: session.id,
            updated_at: new Date().toISOString()
          };
          
          // If sending as gift, update occasion_mode so payment-success knows
          if (isGift) {
            updateData.occasion_mode = 'gift';
          }
          
          const { error: updateError } = await supabaseClient
            .from("pet_reports")
            .update(updateData)
            .in("id", reportIds);
          
          if (updateError) {
            console.error("[STRIPE-WEBHOOK] Failed to update reports:", updateError);
          } else {
            console.log("[STRIPE-WEBHOOK] Reports marked as paid:", reportIds);
          }
          
          // Handle coupon usage - manual increment
          const couponId = session.metadata?.coupon_id;
          if (couponId) {
            try {
              const { data: couponData } = await supabaseClient
                .from("coupons")
                .select("current_uses")
                .eq("id", couponId)
                .single();
              
              if (couponData) {
                await supabaseClient
                  .from("coupons")
                  .update({ current_uses: couponData.current_uses + 1 })
                  .eq("id", couponId);
              }
            } catch (couponError) {
              console.error("[STRIPE-WEBHOOK] Failed to update coupon usage:", couponError);
            }
          }
          
          // Handle gift certificate redemption
          const giftCertificateId = session.metadata?.gift_certificate_id;
          if (giftCertificateId) {
            await supabaseClient
              .from("gift_certificates")
              .update({ 
                is_redeemed: true, 
                redeemed_at: new Date().toISOString(),
                redeemed_by_report_id: reportIds[0],
              })
              .eq("id", giftCertificateId);
          }
          
          // Generate reports and send emails for each report
          for (const reportId of reportIds) {
            try {
              // Fetch report data
              const { data: report } = await supabaseClient
                .from("pet_reports")
                .select("*")
                .eq("id", reportId)
                .single();
              
              if (report && !report.report_content) {
                // Build petData
                const petData = {
                  name: report.pet_name,
                  species: report.species,
                  breed: report.breed,
                  gender: report.gender,
                  dateOfBirth: report.birth_date,
                  location: report.birth_location,
                  soulType: report.soul_type,
                  superpower: report.superpower,
                  strangerReaction: report.stranger_reaction,
                };
                
                // Generate report
                const supabaseUrl = Deno.env.get("SUPABASE_URL");
                const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
                
                const genResponse = await fetch(
                  `${supabaseUrl}/functions/v1/generate-cosmic-report`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${serviceRoleKey}`,
                    },
                    body: JSON.stringify({ petData, reportId }),
                  }
                );
                
                if (genResponse.ok) {
                  const genData = await genResponse.json();
                  console.log("[STRIPE-WEBHOOK] Report generated for:", reportId);
                  
                  // Determine email recipient - if gift, send to recipient
                  const emailTo = isGift && recipientEmail ? recipientEmail : report.email;
                  const emailContext = isGift ? { 
                    isGift: true, 
                    recipientName,
                    giftMessage: session.metadata?.gift_message || ""
                  } : {};
                  
                  // Send email
                  await fetch(
                    `${supabaseUrl}/functions/v1/send-report-email`,
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${serviceRoleKey}`,
                      },
                      body: JSON.stringify({
                        reportId,
                        email: emailTo,
                        petName: report.pet_name,
                        sunSign: genData.report?.sunSign,
                        ...emailContext,
                      }),
                    }
                  );
                  console.log("[STRIPE-WEBHOOK] Email sent for:", reportId, "to:", emailTo);
                } else {
                  console.error("[STRIPE-WEBHOOK] Report generation failed for:", reportId);
                }
              }
            } catch (reportError) {
              console.error("[STRIPE-WEBHOOK] Error processing report:", reportId, reportError);
              // Continue with other reports
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[STRIPE-WEBHOOK] Error:", message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
