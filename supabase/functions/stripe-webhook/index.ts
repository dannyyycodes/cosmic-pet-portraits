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
      // Use constructEventAsync for Deno compatibility (SubtleCryptoProvider requires async)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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
      
      // Check if this is a horoscope subscription
      if (session.metadata?.type === "horoscope_subscription") {
        const { petReportId, petName, email, plan } = session.metadata;
        
        console.log("[STRIPE-WEBHOOK] Horoscope subscription completed:", { email, petName, plan });
        
        // Create the subscription record in database
        const { error: subError } = await supabaseClient
          .from("horoscope_subscriptions")
          .insert({
            email,
            pet_name: petName,
            pet_report_id: petReportId,
            status: "active",
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            next_send_at: new Date().toISOString(), // Send first one immediately
          });
        
        if (subError) {
          console.error("[STRIPE-WEBHOOK] Failed to create horoscope subscription:", subError);
        } else {
          console.log("[STRIPE-WEBHOOK] Horoscope subscription created successfully");
          
          // Trigger immediate first horoscope generation
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          
          try {
            await fetch(`${supabaseUrl}/functions/v1/generate-weekly-horoscopes`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceRoleKey}`,
              },
            });
            console.log("[STRIPE-WEBHOOK] Triggered first horoscope generation");
          } catch (triggerError) {
            console.error("[STRIPE-WEBHOOK] Failed to trigger horoscope:", triggerError);
          }
        }
      }
      // Check if this is a chat credit purchase
      else if (session.metadata?.type === "chat_credits") {
        const credits = parseInt(session.metadata.credits) || 100;
        const orderId = session.metadata.orderId;

        console.log("[STRIPE-WEBHOOK] Chat credits purchased:", { orderId, credits });

        // Add credits via RPC
        const { error: rpcError } = await supabaseClient.rpc("increment_chat_credits", {
          p_order_id: orderId,
          p_amount: credits,
        });

        if (rpcError) {
          console.error("[STRIPE-WEBHOOK] Failed to increment chat credits:", rpcError);
        } else {
          console.log("[STRIPE-WEBHOOK] Chat credits added:", credits, "for order:", orderId);
        }
      }
      // Check if this is a chat subscription purchase
      else if (session.metadata?.type === "chat_subscription") {
        const orderId = session.metadata.orderId;

        console.log("[STRIPE-WEBHOOK] Chat subscription purchased for order:", orderId);

        const { error: subError } = await supabaseClient
          .from("chat_credits")
          .upsert({
            order_id: orderId,
            is_unlimited: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "order_id" });

        if (subError) {
          console.error("[STRIPE-WEBHOOK] Failed to set unlimited chat:", subError);
        } else {
          console.log("[STRIPE-WEBHOOK] Unlimited chat enabled for order:", orderId);
        }
      }
      // Check if this is a gift certificate purchase
      else if (session.metadata?.type === "gift_certificate") {
        const giftCode = session.metadata.gift_code;
        
        // SECURITY: Strict gift code format validation (matches GIFT-XXXX-XXXX format)
        const GIFT_CODE_PATTERN = /^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!giftCode || typeof giftCode !== 'string' || !GIFT_CODE_PATTERN.test(giftCode)) {
          console.error("[STRIPE-WEBHOOK] Invalid gift code format in metadata:", giftCode);
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
        
        // SECURITY: Validate referral code format
        const REFERRAL_CODE_PATTERN = /^[A-Z0-9_-]{3,50}$/i;
        const rawReferralCode = session.metadata?.referral_code;
        const referralCode = rawReferralCode && REFERRAL_CODE_PATTERN.test(rawReferralCode) ? rawReferralCode : null;
        
        const isGift = session.metadata?.is_gift === "true";
        
        // SECURITY: Validate recipient email format
        const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const rawRecipientEmail = session.metadata?.recipient_email || "";
        const recipientEmail = EMAIL_PATTERN.test(rawRecipientEmail) ? rawRecipientEmail : "";
        
        // SECURITY: Sanitize recipient name (max 100 chars, no special chars)
        const rawRecipientName = session.metadata?.recipient_name || "";
        const recipientName = rawRecipientName.slice(0, 100).replace(/[<>\"'&]/g, '');
        
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
          
          // Handle gift add-on - create a gift certificate for friend
          const includeGift = session.metadata?.include_gift === "true";
          if (includeGift && session.customer_email) {
            const giftTierForFriend = session.metadata?.gift_tier_for_friend || 'basic';
            
            // Map tier to amount and tier name
            const giftTierMap: Record<string, { cents: number; tier: string }> = {
              basic: { cents: 3500, tier: 'essential' },
              premium: { cents: 5000, tier: 'portrait' },
              vip: { cents: 12900, tier: 'vip' },
            };
            const giftInfo = giftTierMap[giftTierForFriend] || giftTierMap.basic;
            
            // Generate unique gift code
            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            const randomBytes = new Uint8Array(8);
            crypto.getRandomValues(randomBytes);
            let giftCode = "GIFT-";
            for (let i = 0; i < 4; i++) {
              giftCode += chars[randomBytes[i] % chars.length];
            }
            giftCode += "-";
            for (let i = 4; i < 8; i++) {
              giftCode += chars[randomBytes[i] % chars.length];
            }
            
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            
            const { error: giftInsertError } = await supabaseClient
              .from("gift_certificates")
              .insert({
                code: giftCode,
                purchaser_email: session.customer_email,
                recipient_email: null, // Purchaser will share the code manually
                recipient_name: null,
                gift_message: null,
                amount_cents: giftInfo.cents,
                gift_tier: giftInfo.tier,
                stripe_session_id: session.id,
                expires_at: expiresAt.toISOString(),
              });
            
            if (giftInsertError) {
              console.error("[STRIPE-WEBHOOK] Failed to create gift certificate:", giftInsertError);
            } else {
              console.log("[STRIPE-WEBHOOK] Gift certificate created:", giftCode, giftInfo.tier);
              
              // Send gift certificate email to purchaser
              try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL");
                const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
                
                // Get the gift certificate ID for the email function
                const { data: newGift } = await supabaseClient
                  .from("gift_certificates")
                  .select("id")
                  .eq("code", giftCode)
                  .single();
                
                if (newGift) {
                  await fetch(`${supabaseUrl}/functions/v1/send-gift-certificate-email`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${serviceRoleKey}`,
                    },
                    body: JSON.stringify({ giftCertificateId: newGift.id }),
                  });
                  console.log("[STRIPE-WEBHOOK] Gift certificate email sent to:", session.customer_email);
                }
              } catch (emailErr) {
                console.error("[STRIPE-WEBHOOK] Failed to send gift email:", emailErr);
              }
            }
          }
          
          // Generate reports and send emails for each report
          for (const reportId of reportIds) {
            try {
              // Fetch report data including pet photo URL
              const { data: report } = await supabaseClient
                .from("pet_reports")
                .select("*, pet_photo_url")
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
                  
                   // Portrait AI temporarily disabled — we use the uploaded photo directly on the card now.
                   // (pet_photo_url is stored on the report and used in the frontend.)
                  
                  // Create horoscope subscription if VIP tier or horoscope add-on purchased
                  const includeHoroscope = session.metadata?.include_horoscope === "true";
                  const isVipTier = session.metadata?.vip_horoscope === "true" || session.metadata?.selected_tier === "vip";
                  
                  // Check per-pet tiers for VIP
                  let petTiers: Record<string, string> = {};
                  try {
                    petTiers = JSON.parse(session.metadata?.pet_tiers || "{}");
                  } catch { /* ignore parse errors */ }
                  
                  const petIndex = reportIds.indexOf(reportId);
                  const thisPetIsVip = petTiers[String(petIndex)] === "vip" || isVipTier;
                  const thisPetGetsHoroscope = thisPetIsVip || includeHoroscope;
                  
                  if (thisPetGetsHoroscope && report.email) {
                    console.log("[STRIPE-WEBHOOK] Creating horoscope subscription for:", reportId, { thisPetIsVip, includeHoroscope });
                    
                    // Check if subscription already exists
                    const { data: existingSub } = await supabaseClient
                      .from("horoscope_subscriptions")
                      .select("id")
                      .eq("email", report.email)
                      .eq("pet_report_id", reportId)
                      .maybeSingle();
                    
                    if (!existingSub) {
                      // Calculate next Monday for first horoscope
                      const nextMonday = new Date();
                      nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
                      nextMonday.setHours(9, 0, 0, 0);
                      
                      const { error: subError } = await supabaseClient
                        .from("horoscope_subscriptions")
                        .insert({
                          email: report.email,
                          pet_name: report.pet_name,
                          pet_report_id: reportId,
                          status: "active",
                          next_send_at: nextMonday.toISOString(),
                        });
                      
                      if (subError) {
                        console.error("[STRIPE-WEBHOOK] Failed to create horoscope subscription:", subError);
                      } else {
                        console.log("[STRIPE-WEBHOOK] Horoscope subscription created for:", report.email, report.pet_name);
                      }
                    } else {
                      console.log("[STRIPE-WEBHOOK] Horoscope subscription already exists for:", reportId);
                    }
                  }
                  
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
                  
                  // Track purchase for email marketing (non-gift only)
                  if (!isGift && report.email) {
                    const selectedTier = session.metadata?.selected_tier || (includesPortrait ? 'premium' : 'basic');
                    try {
                      await fetch(`${supabaseUrl}/functions/v1/track-subscriber`, {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${serviceRoleKey}`,
                        },
                        body: JSON.stringify({
                          email: report.email,
                          event: 'purchase_completed',
                          petName: report.pet_name,
                          tier: selectedTier,
                        }),
                      });
                      console.log("[STRIPE-WEBHOOK] Purchase tracked for email marketing:", report.email);
                      
                      // Send VIP welcome email if VIP tier
                      if (selectedTier === 'vip') {
                        console.log("[STRIPE-WEBHOOK] Sending VIP welcome email for:", reportId);
                        
                        // Get latest report data with portrait
                        const { data: latestReport } = await supabaseClient
                          .from("pet_reports")
                          .select("portrait_url")
                          .eq("id", reportId)
                          .single();
                        
                        await fetch(`${supabaseUrl}/functions/v1/send-vip-email`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${serviceRoleKey}`,
                          },
                          body: JSON.stringify({
                            reportId,
                            email: report.email,
                            petName: report.pet_name,
                            sunSign: genData.report?.chartPlacements?.sun?.sign || genData.report?.sunSign,
                            portraitUrl: latestReport?.portrait_url || null,
                          }),
                        });
                        console.log("[STRIPE-WEBHOOK] VIP welcome email sent for:", reportId);
                      }
                    } catch (trackError) {
                      console.error("[STRIPE-WEBHOOK] Failed to track/send VIP email:", trackError);
                    }
                  }
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
    
    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      
      if (event.type === "customer.subscription.deleted" || subscription.status === "canceled") {
        console.log("[STRIPE-WEBHOOK] Subscription cancelled:", subscription.id);
        
        // Update horoscope subscription status
        const { error: updateError } = await supabaseClient
          .from("horoscope_subscriptions")
          .update({ 
            status: "cancelled",
            cancelled_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subscription.id);
        
        if (updateError) {
          console.error("[STRIPE-WEBHOOK] Failed to update subscription status:", updateError);
        } else {
          console.log("[STRIPE-WEBHOOK] Horoscope subscription marked as cancelled");
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
