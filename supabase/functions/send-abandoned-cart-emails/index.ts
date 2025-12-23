import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ABANDONED-CART] ${step}${detailsStr}`);
};

const getAbandonedCartEmailTemplate = (petName: string, intakeUrl: string, unsubscribeUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Outer container with gradient border -->
  <div style="max-width: 600px; margin: 0 auto; padding: 2px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #d946ef 50%, #f59e0b 75%, #6366f1 100%); border-radius: 20px;">
    
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 18px; padding: 48px 32px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%); border-radius: 50px; border: 1px solid rgba(245, 158, 11, 0.3);">
          <span style="font-size: 24px;">✨🐾</span>
        </div>
      </div>

      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center; line-height: 1.3;">
        ${petName}'s Cosmic Journey Awaits
      </h1>
      
      <p style="color: #9ca3af; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
        We noticed you started creating a cosmic profile for <span style="color: #fbbf24; font-weight: 600;">${petName}</span> but didn't complete your reading.
      </p>

      <p style="color: #d1d5db; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
        The stars are still aligned, and ${petName}'s unique astrological reading is waiting to be revealed! 🌟
      </p>

      <!-- Benefits Card -->
      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%); border-radius: 16px; padding: 24px; margin: 0 0 32px 0; border: 1px solid rgba(245, 158, 11, 0.2);">
        <p style="color: #fbbf24; font-size: 13px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          🎁 Complete your order to discover:
        </p>
        <div style="display: block;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 28px; height: 28px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; display: inline-block; text-align: center; line-height: 28px; font-size: 12px; margin-right: 12px;">⭐</span>
            <span style="color: #e5e7eb; font-size: 14px;">${petName}'s unique personality traits</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 28px; height: 28px; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); border-radius: 8px; display: inline-block; text-align: center; line-height: 28px; font-size: 12px; margin-right: 12px;">✨</span>
            <span style="color: #e5e7eb; font-size: 14px;">Hidden talents and cosmic superpowers</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 28px; height: 28px; background: linear-gradient(135deg, #d946ef 0%, #f472b6 100%); border-radius: 8px; display: inline-block; text-align: center; line-height: 28px; font-size: 12px; margin-right: 12px;">💜</span>
            <span style="color: #e5e7eb; font-size: 14px;">Compatibility insights with you</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="width: 28px; height: 28px; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); border-radius: 8px; display: inline-block; text-align: center; line-height: 28px; font-size: 12px; margin-right: 12px;">🎨</span>
            <span style="color: #e5e7eb; font-size: 14px;">Personalized AI-generated portrait</span>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 36px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: #1a1a2e; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 800; font-size: 16px; box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset;">
          Complete ${petName}'s Reading →
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
        Your progress has been saved. Pick up right where you left off!
      </p>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%); margin: 40px 0;"></div>

      <!-- Footer -->
      <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center; line-height: 1.6;">
        You're receiving this because you started a cosmic reading for ${petName}.<br><br>
        <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
      </p>

      <!-- Brand Footer -->
      <div style="text-align: center; margin-top: 24px;">
        <p style="color: #4b5563; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
          AstroPets
        </p>
      </div>

    </div>
  </div>
  
  <div style="height: 20px;"></div>
  
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting abandoned cart email check");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }
    const resend = new Resend(resendApiKey);

    // Find subscribers who:
    // 1. Started intake 24-72 hours ago
    // 2. Haven't completed purchase
    // 3. Haven't received an abandoned cart email in last 24 hours
    // 4. Are still subscribed
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const { data: abandonedCarts, error: fetchError } = await supabaseClient
      .from("email_subscribers")
      .select("*")
      .is("purchase_completed_at", null)
      .not("intake_started_at", "is", null)
      .gte("intake_started_at", seventyTwoHoursAgo.toISOString())
      .lte("intake_started_at", twentyFourHoursAgo.toISOString())
      .eq("is_subscribed", true)
      .or(`last_email_type.is.null,last_email_type.neq.abandoned_cart,last_email_sent_at.lt.${twentyFourHoursAgo.toISOString()}`);

    if (fetchError) {
      logStep("Error fetching abandoned carts", { error: fetchError.message });
      throw fetchError;
    }

    logStep("Found abandoned carts", { count: abandonedCarts?.length || 0 });

    if (!abandonedCarts || abandonedCarts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No abandoned carts to process",
        sent: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscriber of abandonedCarts) {
      try {
        const petName = subscriber.pet_name || "your pet";
        const baseUrl = "https://astropets.cloud";
        const intakeUrl = `${baseUrl}/intake`;
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        
        logStep("Sending abandoned cart email", { email: subscriber.email, petName });

        const emailResponse = await resend.emails.send({
          from: "AstroPets <hello@astropets.cloud>",
          to: [subscriber.email],
          subject: `✨ ${petName}'s cosmic reading is waiting for you!`,
          html: getAbandonedCartEmailTemplate(petName, intakeUrl, unsubscribeUrl),
        });

        logStep("Email sent successfully", { emailId: (emailResponse as any).id });

        // Update subscriber record
        const { error: updateError } = await supabaseClient
          .from("email_subscribers")
          .update({
            last_email_sent_at: new Date().toISOString(),
            last_email_type: "abandoned_cart",
            emails_sent: (subscriber.emails_sent || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscriber.id);

        if (updateError) {
          logStep("Error updating subscriber", { error: updateError.message });
        }

        // Log the campaign
        await supabaseClient.from("email_campaigns").insert({
          subscriber_id: subscriber.id,
          campaign_type: "abandoned_cart",
          subject: `✨ ${petName}'s cosmic reading is waiting for you!`,
          content_preview: `Reminder email for ${petName}`,
          ai_generated: false,
        });

        sentCount++;
      } catch (emailError) {
        const errorMsg = emailError instanceof Error ? emailError.message : String(emailError);
        logStep("Error sending email", { email: subscriber.email, error: errorMsg });
        errors.push(`${subscriber.email}: ${errorMsg}`);
      }
    }

    logStep("Abandoned cart emails complete", { sent: sentCount, errors: errors.length });

    return new Response(JSON.stringify({
      success: true,
      message: `Sent ${sentCount} abandoned cart emails`,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
