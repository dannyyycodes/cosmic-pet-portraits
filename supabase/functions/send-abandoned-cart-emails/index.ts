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
        const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://cosmicpetreport.com";
        
        logStep("Sending abandoned cart email", { email: subscriber.email, petName });

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Don't Leave ${petName} Behind! ✨</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f0a1f 0%, #1a1035 50%, #0d0820 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #ffd700; font-size: 28px; margin: 0; text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);">
        ✨ ${petName}'s Cosmic Journey Awaits ✨
      </h1>
    </div>
    
    <!-- Main Content -->
    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 30px; border: 1px solid rgba(255, 215, 0, 0.2);">
      <p style="color: #e8e0ff; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        We noticed you started creating a cosmic profile for <strong style="color: #ffd700;">${petName}</strong> but didn't complete your order.
      </p>
      
      <p style="color: #e8e0ff; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        The stars are still aligned, and ${petName}'s unique astrological reading is waiting to be revealed! 🌟
      </p>
      
      <div style="background: rgba(255, 215, 0, 0.1); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #ffd700;">
        <p style="color: #ffd700; font-size: 14px; margin: 0; font-weight: 600;">
          🎁 Complete your order in the next 24 hours and discover:
        </p>
        <ul style="color: #e8e0ff; font-size: 14px; margin: 15px 0 0 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">${petName}'s unique personality traits written in the stars</li>
          <li style="margin-bottom: 8px;">Hidden talents and cosmic superpowers</li>
          <li style="margin-bottom: 8px;">Compatibility insights with their human</li>
          <li style="margin-bottom: 8px;">Personalized AI-generated portrait</li>
        </ul>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/intake" style="display: inline-block; background: linear-gradient(135deg, #ffd700, #ffb800); color: #1a1035; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);">
          Complete ${petName}'s Reading →
        </a>
      </div>
      
      <p style="color: #a89ec7; font-size: 14px; line-height: 1.6; text-align: center;">
        Your progress has been saved. Pick up right where you left off!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="color: #6b5b95; font-size: 12px; margin: 0;">
        You're receiving this because you started a cosmic reading for ${petName}.
        <br><br>
        <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color: #a89ec7; text-decoration: underline;">
          Unsubscribe from these emails
        </a>
      </p>
    </div>
  </div>
</body>
</html>
        `;

        const emailResponse = await resend.emails.send({
          from: "Cosmic Pet Report <hello@cosmicpetreport.com>",
          to: [subscriber.email],
          subject: `✨ ${petName}'s cosmic reading is waiting for you!`,
          html: emailHtml,
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
