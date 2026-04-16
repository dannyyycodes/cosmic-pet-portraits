import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function getNextWeekDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

async function sendHoroscopeWelcomeEmail(email: string, petName: string, sunSign: string, reportId: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("[STRIPE-WEBHOOK] No RESEND_API_KEY for welcome email");
    return;
  }
  const resend = new Resend(resendKey);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#faf6f1;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">

  <div style="text-align:center;margin-bottom:36px;">
    <p style="font-size:28px;margin:0 0 8px 0;">&#10024;</p>
    <p style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4a265;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Little Souls</p>
  </div>

  <div style="background:#ffffff;border-radius:16px;border:1px solid #e8ddd0;padding:40px 32px;text-align:center;">
    <p style="font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#c4a265;margin:0 0 16px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      Your Cosmic Connection is Live
    </p>

    <h1 style="color:#3d2f2a;font-size:26px;font-weight:400;margin:0 0 20px 0;line-height:1.3;">
      ${petName}'s weekly horoscope<br>starts this Sunday
    </h1>

    <p style="color:#7a6a60;font-size:15px;line-height:1.8;margin:0 0 28px 0;">
      Every Sunday morning, a personalised cosmic reading for ${petName} will arrive in your inbox &#8212; calculated from their exact birth chart against that week's real planetary transits. Not generic sun sign predictions. Real astrology, written with real love, just for your ${sunSign} soul.
    </p>

    <div style="text-align:left;background:#faf6f1;border-radius:12px;padding:24px 28px;margin:0 0 28px 0;">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4a265;margin:0 0 14px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        Every Week You'll Get
      </p>
      <p style="color:#5a4a42;font-size:14px;line-height:2;margin:0;">
        ${petName}'s cosmic mood forecast for each day<br>
        Their lucky day, power move, and energy peaks<br>
        Hilarious texts and Google searches from ${petName}<br>
        A pet-parent cosmic sync reading<br>
        A weekly affirmation written just for your bond
      </p>
    </div>

    <div style="margin:28px 0;">
      <a href="https://littlesouls.app/soul-chat.html?id=${reportId}" style="display:inline-block;background:#3d2f2a;color:#ffffff;text-decoration:none;padding:16px 44px;border-radius:50px;font-weight:600;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:0.5px;">
        Talk to ${petName}'s Soul
      </a>
    </div>

    <p style="color:#b8a99e;font-size:13px;line-height:1.6;margin:0;">
      While you wait for Sunday, ${petName}'s soul is ready to chat.<br>You've got free SoulSpeak credits waiting.
    </p>
  </div>

  <div style="text-align:center;margin-top:36px;">
    <p style="color:#b8a99e;font-size:12px;line-height:1.7;margin:0 0 8px 0;">
      Your first horoscope arrives this Sunday at 9am UTC.<br>
      Questions? Just reply to this email.
    </p>
    <p style="color:#d4c8bc;font-size:11px;margin:0;letter-spacing:1px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      Little Souls
    </p>
  </div>

</div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: "Little Souls <noreply@littlesouls.app>",
      to: [email],
      subject: `${petName}'s weekly cosmic updates start this Sunday ✨`,
      html,
    });
    const resendError = (result as any)?.error;
    if (resendError) {
      console.error("[STRIPE-WEBHOOK] Welcome email Resend error:", resendError);
    } else {
      console.log("[STRIPE-WEBHOOK] Horoscope welcome email sent to:", email);
    }
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] Welcome email send error:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
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
      headers: getCorsHeaders(req), 
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
        headers: getCorsHeaders(req), 
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
        headers: getCorsHeaders(req), 
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

          // Send welcome email
          await sendHoroscopeWelcomeEmail(email, petName, plan || "cosmic", petReportId);

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

        // Add credits via RPC (upsert — will create row if missing)
        const { error: rpcError } = await supabaseClient.rpc("increment_chat_credits", {
          p_order_id: orderId,
          p_amount: credits,
        });

        if (rpcError) {
          console.error("[STRIPE-WEBHOOK] Failed to increment chat credits:", rpcError);
          await supabaseClient.from("webhook_failures").insert({
            source: "stripe-webhook",
            event_type: "chat_credits_topup",
            stripe_session_id: session.id,
            order_id: orderId,
            details: { credits, error: rpcError, amount_paid: session.amount_total },
          });
        } else {
          // Defensive check: confirm credits actually landed
          const { data: confirmRow } = await supabaseClient
            .from("chat_credits")
            .select("credits_total_purchased")
            .eq("order_id", orderId)
            .maybeSingle();
          if (!confirmRow) {
            console.error("[STRIPE-WEBHOOK] Credits RPC succeeded but row missing:", orderId);
            await supabaseClient.from("webhook_failures").insert({
              source: "stripe-webhook",
              event_type: "chat_credits_topup_no_row",
              stripe_session_id: session.id,
              order_id: orderId,
              details: { credits, amount_paid: session.amount_total },
            });
          } else {
            console.log("[STRIPE-WEBHOOK] Chat credits added:", credits, "for order:", orderId);
          }
        }
      }
      // Check if this is a chat subscription (Soul Bond membership)
      else if (session.metadata?.type === "chat_subscription") {
        const orderId = session.metadata.orderId;
        const weeklyCredits = parseInt(session.metadata.weekly_credits) || 1000;

        console.log("[STRIPE-WEBHOOK] Chat membership purchased:", { orderId, weeklyCredits });

        // Add initial weekly credits + store subscription info
        const { error: subError } = await supabaseClient
          .from("chat_credits")
          .upsert({
            order_id: orderId,
            is_unlimited: false,
            stripe_subscription_id: session.subscription as string,
            weekly_credits: weeklyCredits,
            next_credit_refresh: getNextWeekDate(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "order_id" });

        if (subError) {
          console.error("[STRIPE-WEBHOOK] Failed to set chat membership:", subError);
          await supabaseClient.from("webhook_failures").insert({
            source: "stripe-webhook",
            event_type: "chat_subscription_upsert",
            stripe_session_id: session.id,
            order_id: orderId,
            details: { weeklyCredits, subscription: session.subscription, error: subError },
          });
        } else {
          console.log("[STRIPE-WEBHOOK] Chat membership created for order:", orderId);
          // Add first week's credits
          const { error: initError } = await supabaseClient.rpc("increment_chat_credits", {
            p_order_id: orderId,
            p_amount: weeklyCredits,
          });
          if (initError) {
            console.error("[STRIPE-WEBHOOK] Membership initial credits failed:", initError);
            await supabaseClient.from("webhook_failures").insert({
              source: "stripe-webhook",
              event_type: "chat_subscription_initial_credits",
              stripe_session_id: session.id,
              order_id: orderId,
              details: { weeklyCredits, error: initError },
            });
          } else {
            console.log("[STRIPE-WEBHOOK] Initial credits added:", weeklyCredits);
          }
        }
      }
      // Cross-pet compatibility upsell — buyer paid for a compatibility
      // reading comparing two of their existing pet reports.
      else if (session.metadata?.type === "pet_compatibility") {
        const aId = session.metadata?.pet_report_a_id;
        const bId = session.metadata?.pet_report_b_id;
        const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!aId || !bId || !UUID_PATTERN.test(aId) || !UUID_PATTERN.test(bId) || aId === bId) {
          console.error("[STRIPE-WEBHOOK] Invalid compatibility ids in metadata");
          return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
        }
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        try {
          const triggerResp = await fetch(`${supabaseUrl}/functions/v1/generate-pet-compatibility`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceRoleKey}` },
            body: JSON.stringify({ petReportAId: aId, petReportBId: bId, stripeSessionId: session.id }),
          });
          console.log("[STRIPE-WEBHOOK] Compatibility generation triggered:", triggerResp.status);
        } catch (err) {
          console.error("[STRIPE-WEBHOOK] Compatibility trigger failed:", err);
        }
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }
      // Check if this is a gift certificate purchase
      else if (session.metadata?.type === "gift_certificate") {
        const giftCode = session.metadata.primary_gift_code || session.metadata.gift_code;
        
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
          
          // Idempotency check: skip if already processed this session
          const { data: alreadyProcessed } = await supabaseClient
            .from("pet_reports")
            .select("id")
            .eq("stripe_session_id", session.id)
            .eq("payment_status", "paid")
            .limit(1);

          if (alreadyProcessed && alreadyProcessed.length > 0) {
            console.log("[STRIPE-WEBHOOK] Already processed session:", session.id, "— skipping");
            return new Response(JSON.stringify({ received: true, skipped: true }), { status: 200, headers: { "Content-Type": "application/json" } });
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

          // ────────────────────────────────────────────────────────────
          // Charity donation ledger — 10% of net-paid + any bonus add-on.
          // One row per session (UNIQUE stripe_session_id enforces idempotency).
          // ────────────────────────────────────────────────────────────
          try {
            const charityIdMeta = session.metadata?.charity_id;
            if (charityIdMeta) {
              const CHARITY_NAMES: Record<string, string> = {
                "ifaw": "International Fund for Animal Welfare",
                "world-land-trust": "World Land Trust",
                "eden-reforestation": "Eden Reforestation Projects",
              };
              const charityName = CHARITY_NAMES[charityIdMeta] || charityIdMeta;

              const amountTotalCents = session.amount_total ?? 0;
              const charityBonusDollars = parseInt(session.metadata?.charity_bonus || "0", 10) || 0;
              const donationBonusCents = Math.max(0, charityBonusDollars * 100);
              const orderAmountCents = Math.max(0, amountTotalCents - donationBonusCents);
              const donationBaseCents = Math.round(orderAmountCents * 0.10);

              const { error: donationError } = await supabaseClient
                .from("charity_donations")
                .insert({
                  stripe_session_id: session.id,
                  stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
                  charity_id: charityIdMeta,
                  charity_name: charityName,
                  order_amount_cents: orderAmountCents,
                  donation_base_cents: donationBaseCents,
                  donation_bonus_cents: donationBonusCents,
                  currency: session.currency || "usd",
                  customer_email: session.customer_details?.email || session.customer_email || null,
                  status: "pending",
                });

              if (donationError) {
                // Unique violation = already recorded (idempotent replay). Anything else = log.
                if (donationError.code === "23505") {
                  console.log("[STRIPE-WEBHOOK] Donation already recorded for session:", session.id);
                } else {
                  console.error("[STRIPE-WEBHOOK] Donation insert failed:", donationError);
                }
              } else {
                console.log("[STRIPE-WEBHOOK] Donation recorded:", {
                  session: session.id,
                  charity: charityIdMeta,
                  base_cents: donationBaseCents,
                  bonus_cents: donationBonusCents,
                });
              }
            }
          } catch (donationErr) {
            console.error("[STRIPE-WEBHOOK] Donation recording threw:", donationErr);
            // Never fail the webhook over donation bookkeeping — the order is real.
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
            
            // Map tier to amount and tier name (must match GIFT_TIERS in create-checkout)
            const giftTierMap: Record<string, { cents: number; tier: string }> = {
              basic: { cents: 1350, tier: 'basic' },
              premium: { cents: 1750, tier: 'premium' },
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
                  
                  // Create horoscope subscription only when explicitly opted in — hardcover does NOT get free horoscopes.
                  // Memorial pets are excluded — weekly "what's ahead" emails for a pet who has
                  // crossed the rainbow bridge would be a serious care failure.
                  const includeHoroscope = session.metadata?.include_horoscope === "true";
                  const isMemorial = report.occasion_mode === "memorial";
                  const thisPetGetsHoroscope = includeHoroscope && !isMemorial;
                  if (isMemorial && includeHoroscope) {
                    console.log("[STRIPE-WEBHOOK] Skipping horoscope subscription for memorial pet:", reportId, report.pet_name);
                  }

                  if (thisPetGetsHoroscope && report.email) {
                    console.log("[STRIPE-WEBHOOK] Creating horoscope subscription for:", reportId, { includeHoroscope });

                    // Check if subscription already exists
                    const { data: existingSub } = await supabaseClient
                      .from("horoscope_subscriptions")
                      .select("id")
                      .eq("email", report.email)
                      .eq("pet_report_id", reportId)
                      .maybeSingle();

                    if (!existingSub) {
                      // Calculate next Sunday 9am UTC for first horoscope
                      const nextSunday = new Date();
                      const daysUntilSunday = (7 - nextSunday.getDay()) % 7 || 7;
                      nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
                      nextSunday.setHours(9, 0, 0, 0);

                      // Determine occasion mode from report
                      const petOccasionMode = report.occasion_mode || "discover";

                      const plan = "trial";

                      // Create Stripe recurring subscription with 30-day free trial
                      let stripeSubId: string | null = null;
                      if (session.customer) {
                        try {
                          const stripeSub = await stripe.subscriptions.create({
                            customer: session.customer as string,
                            items: [{ price: "price_1Sfi1vEFEZSdxrGttpk4iUEa" }],
                            trial_period_days: 30,
                            metadata: {
                              pet_name: report.pet_name,
                              pet_report_id: reportId,
                            },
                          });
                          stripeSubId = stripeSub.id;
                          console.log("[STRIPE-WEBHOOK] Stripe horoscope subscription created:", stripeSubId);
                        } catch (stripeSubError: any) {
                          console.error("[STRIPE-WEBHOOK] Failed to create Stripe horoscope subscription:", stripeSubError?.message);
                        }
                      }

                      // SoulSpeak credits for horoscope subscribers
                      await supabaseClient
                        .from("chat_credits")
                        .upsert({
                          report_id: reportId,
                          email: report.email,
                          credits_remaining: 80,
                          plan: "free",
                        }, { onConflict: "report_id" });

                      const { error: subError } = await supabaseClient
                        .from("horoscope_subscriptions")
                        .insert({
                          email: report.email,
                          pet_name: report.pet_name,
                          pet_report_id: reportId,
                          status: "active",
                          next_send_at: nextSunday.toISOString(),
                          plan,
                          occasion_mode: petOccasionMode,
                          ...(stripeSubId ? { stripe_subscription_id: stripeSubId } : {}),
                        });

                      if (subError) {
                        console.error("[STRIPE-WEBHOOK] Failed to create horoscope subscription:", subError);
                      } else {
                        console.log("[STRIPE-WEBHOOK] Horoscope subscription created for:", report.email, report.pet_name, { plan, occasionMode: petOccasionMode });

                        // Send horoscope welcome email
                        await sendHoroscopeWelcomeEmail(report.email, report.pet_name, genData?.report?.sunSign || 'cosmic', reportId);
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
                        sunSign: genData?.report?.sunSign,
                        petPhotoUrl: report.pet_photo_url,
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
                      
                    } catch (trackError) {
                      console.error("[STRIPE-WEBHOOK] Failed to track purchase:", trackError);
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

          // ── Hardcover fulfillment ──────────────────────────────────────────
          // Fires once per order after all reports are generated.
          // Saves shipping address and triggers the n8n PDF→Lulu→Gelato pipeline.
          const isBookOrder = session.metadata?.includes_book === "true";
          if (isBookOrder) {
            const shippingDetails = session.shipping_details;
            if (shippingDetails?.address) {
              const shippingAddress = {
                name: shippingDetails.name || session.customer_details?.name || "",
                line1: shippingDetails.address.line1 || "",
                line2: shippingDetails.address.line2 || null,
                city: shippingDetails.address.city || "",
                state: shippingDetails.address.state || null,
                postal_code: shippingDetails.address.postal_code || "",
                country: shippingDetails.address.country || "",
                phone: session.customer_details?.phone || null,
              };

              // Persist to pet_reports
              const { error: addrError } = await supabaseClient
                .from("pet_reports")
                .update({ shipping_address: shippingAddress, fulfillment_status: "pending" })
                .in("id", reportIds);

              if (addrError) {
                console.error("[STRIPE-WEBHOOK] Failed to save shipping address:", addrError);
              } else {
                console.log("[STRIPE-WEBHOOK] Shipping address saved for reports:", reportIds);
              }

              // Fire n8n fulfillment webhook (non-blocking)
              const n8nFulfillmentUrl = Deno.env.get("N8N_HARDCOVER_FULFILLMENT_WEBHOOK");
              if (n8nFulfillmentUrl) {
                try {
                  await fetch(n8nFulfillmentUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      report_id: reportIds[0],
                      report_ids: reportIds,
                      customer_email: session.customer_details?.email || "",
                      shipping_address: shippingAddress,
                      stripe_session_id: session.id,
                      pet_count: reportIds.length,
                    }),
                  });
                  console.log("[STRIPE-WEBHOOK] Hardcover fulfillment webhook fired:", reportIds[0]);
                } catch (n8nError) {
                  console.error("[STRIPE-WEBHOOK] Failed to fire fulfillment webhook:", n8nError);
                  // Non-fatal — fulfillment can be re-triggered from Supabase
                }
              } else {
                console.warn("[STRIPE-WEBHOOK] N8N_HARDCOVER_FULFILLMENT_WEBHOOK not configured");
              }
            } else {
              console.warn("[STRIPE-WEBHOOK] Hardcover order missing shipping address:", session.id);
            }
          }
          // ─────────────────────────────────────────────────────────────────

        }
      }
    }
    
    // ─── REFUND HANDLING ──────────────────────────────────────────────────
    // Runs on `charge.refunded` (full/partial) and on `charge.dispute.created`
    // so a chargeback reaches the same code path. Flips payment_status on all
    // pet_reports tied to this Stripe session, cancels any horoscope subs
    // linked to them (both locally + in Stripe), and marks any generated
    // compatibility readings as cancelled so the buyer sees them grey out.
    if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const chargeObj = event.data.object as Stripe.Charge | Stripe.Dispute;
      const chargeId = "charge" in chargeObj
        ? (chargeObj as Stripe.Dispute).charge as string
        : (chargeObj as Stripe.Charge).id;
      console.log("[STRIPE-WEBHOOK] Refund/dispute received for charge:", chargeId);

      try {
        // Walk charge → payment_intent → checkout_session so we can find
        // which reports were paid for.
        const charge = "charge" in chargeObj
          ? await stripe.charges.retrieve(chargeId)
          : (chargeObj as Stripe.Charge);
        const piId = typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

        let refundedReportIds: string[] = [];
        let refundedSessionMetadata: Record<string, string> | null = null;

        if (piId) {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 5 });
          for (const s of sessions.data) {
            const ids = (s.metadata?.report_ids || "").split(",").filter(Boolean);
            refundedReportIds.push(...ids);
            if (s.metadata) refundedSessionMetadata = s.metadata as Record<string, string>;
          }
          // Payment-intent-style orders also store report_ids on the PI metadata.
          if (refundedReportIds.length === 0) {
            const pi = await stripe.paymentIntents.retrieve(piId);
            const ids = (pi.metadata?.report_ids || "").split(",").filter(Boolean);
            refundedReportIds.push(...ids);
            if (pi.metadata) refundedSessionMetadata = pi.metadata as Record<string, string>;
          }
        }

        // Compatibility upsell refund — metadata carries pair ids.
        if (refundedSessionMetadata?.type === "pet_compatibility") {
          const compatAId = refundedSessionMetadata.pet_report_a_id;
          const compatBId = refundedSessionMetadata.pet_report_b_id;
          if (compatAId && compatBId) {
            const [aId, bId] = compatAId < compatBId ? [compatAId, compatBId] : [compatBId, compatAId];
            await supabaseClient
              .from("pet_compatibilities")
              .update({ status: "failed", error_message: "Refunded" })
              .eq("pet_report_a_id", aId)
              .eq("pet_report_b_id", bId);
            console.log("[STRIPE-WEBHOOK] Compatibility marked refunded:", aId, bId);
          }
        }

        if (refundedReportIds.length > 0) {
          // Flip payment_status AND wipe report_content so a refunded buyer
          // can't keep the reading after getting their money back. get-report
          // also blocks access on payment_status != "paid" but we want the
          // data gone in case any code path fails to check status.
          await supabaseClient
            .from("pet_reports")
            .update({ payment_status: "refunded", report_content: null })
            .in("id", refundedReportIds);
          console.log("[STRIPE-WEBHOOK] Reports marked refunded + content wiped:", refundedReportIds);

          // Cancel any horoscope subscriptions tied to these reports — both in
          // our DB and in Stripe (distinct subscription, not the one refunded).
          const { data: horoscopeSubs } = await supabaseClient
            .from("horoscope_subscriptions")
            .select("id, stripe_subscription_id")
            .in("pet_report_id", refundedReportIds)
            .eq("status", "active");
          for (const sub of horoscopeSubs ?? []) {
            if (sub.stripe_subscription_id) {
              try { await stripe.subscriptions.cancel(sub.stripe_subscription_id); } catch (e) {
                console.warn("[STRIPE-WEBHOOK] Stripe sub cancel failed (non-fatal):", e);
              }
            }
            await supabaseClient
              .from("horoscope_subscriptions")
              .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
              .eq("id", sub.id);
          }

          // Mark compatibility readings that used either refunded report as failed.
          await supabaseClient
            .from("pet_compatibilities")
            .update({ status: "failed", error_message: "Source report refunded" })
            .or(refundedReportIds.map(id => `pet_report_a_id.eq.${id},pet_report_b_id.eq.${id}`).join(","));
        }

        return new Response(JSON.stringify({ received: true, refunded: refundedReportIds }), { status: 200 });
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Refund handler error:", err);
        return new Response(JSON.stringify({ error: "refund handler failed" }), { status: 500 });
      }
    }

    // Handle Express Checkout PaymentIntent (safety-net — frontend verify-payment handles primary flow)
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.metadata?.quick_checkout === "true") {
        console.log("[STRIPE-WEBHOOK] Express Checkout PI succeeded:", pi.id);
        const piReportIds = pi.metadata?.report_ids?.split(",").filter(Boolean) || [];
        const piEmail = pi.receipt_email || "";

        if (piReportIds.length > 0) {
          // Idempotency: skip if any report already marked paid from this PI
          const { data: alreadyPaid } = await supabaseClient
            .from("pet_reports")
            .select("id")
            .eq("stripe_session_id", pi.id)
            .eq("payment_status", "paid")
            .limit(1);

          if (alreadyPaid && alreadyPaid.length > 0) {
            console.log("[STRIPE-WEBHOOK] PI already processed:", pi.id, "— skipping");
          } else {
            for (const reportId of piReportIds) {
              try {
                const shareToken = (() => {
                  const bytes = new Uint8Array(12);
                  crypto.getRandomValues(bytes);
                  return Array.from(bytes).map((b: number) => b.toString(16).padStart(2, "0")).join("");
                })();
                await supabaseClient
                  .from("pet_reports")
                  .update({
                    payment_status: "paid",
                    stripe_session_id: pi.id,
                    share_token: shareToken,
                    ...(piEmail ? { email: piEmail.toLowerCase().trim() } : {}),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", reportId)
                  .eq("payment_status", "pending");
              } catch (err) {
                console.error("[STRIPE-WEBHOOK] Failed to mark PI report as paid:", reportId, err);
              }
            }
            console.log("[STRIPE-WEBHOOK] Express Checkout reports marked paid:", piReportIds);
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
          console.error("[STRIPE-WEBHOOK] Failed to update horoscope subscription status:", updateError);
        } else {
          console.log("[STRIPE-WEBHOOK] Horoscope subscription marked as cancelled");
        }

        // Also cancel any chat membership with this subscription
        const { error: chatSubError } = await supabaseClient
          .from("chat_credits")
          .update({
            stripe_subscription_id: null,
            weekly_credits: 0,
            next_credit_refresh: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (!chatSubError) {
          console.log("[STRIPE-WEBHOOK] Chat membership cancelled for subscription:", subscription.id);
        }
      }
    }

    // Handle recurring invoice payment (monthly membership renewal → add weekly credits)
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as any;
      // Only process recurring invoices (not the first one which is handled by checkout.session.completed)
      if (invoice.billing_reason === "subscription_cycle") {
        const subscriptionId = invoice.subscription;
        console.log("[STRIPE-WEBHOOK] Recurring invoice paid for subscription:", subscriptionId);

        // Find the chat_credits row with this subscription
        const { data: chatCredit } = await supabaseClient
          .from("chat_credits")
          .select("order_id, weekly_credits")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();

        if (chatCredit) {
          // Add first week's credits for the new billing period
          const { error: renewError } = await supabaseClient.rpc("increment_chat_credits", {
            p_order_id: chatCredit.order_id,
            p_amount: chatCredit.weekly_credits || 1000,
          });
          if (renewError) {
            console.error("[STRIPE-WEBHOOK] Monthly renewal credits failed:", renewError);
            await supabaseClient.from("webhook_failures").insert({
              source: "stripe-webhook",
              event_type: "chat_subscription_renewal",
              stripe_session_id: invoice.id,
              order_id: chatCredit.order_id,
              details: { subscription: subscriptionId, weekly_credits: chatCredit.weekly_credits, error: renewError },
            });
          } else {
            // Reset next refresh date
            await supabaseClient
              .from("chat_credits")
              .update({ next_credit_refresh: getNextWeekDate(), updated_at: new Date().toISOString() })
              .eq("order_id", chatCredit.order_id);
            console.log("[STRIPE-WEBHOOK] Monthly credits renewed for:", chatCredit.order_id);
          }
        } else {
          // Invoice paid but no matching chat_credits row — race or orphan
          console.error("[STRIPE-WEBHOOK] Renewal invoice with no chat_credits row:", subscriptionId);
          await supabaseClient.from("webhook_failures").insert({
            source: "stripe-webhook",
            event_type: "chat_subscription_renewal_orphan",
            stripe_session_id: invoice.id,
            details: { subscription: subscriptionId, amount_paid: invoice.amount_paid },
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[STRIPE-WEBHOOK] Error:", message);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
