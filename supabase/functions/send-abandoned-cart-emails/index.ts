import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
<body style="margin: 0; padding: 0; background-color: #faf6f1; font-family: Georgia, 'Times New Roman', serif;">

  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 24px; margin: 0 0 6px 0;">🐾</p>
      <p style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <!-- Content Card -->
    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 36px 28px;">

      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        You were so close.
      </p>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        You got pretty far setting up ${petName}'s reading, and everything you entered is still saved. No starting over, no re-entering anything.
      </p>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        We'll look at the exact moment ${petName} was born and create something you'll want to keep forever — a full portrait of their personality, the way they love, their hidden quirks, and the cosmic reason they ended up with <em>you</em>.
      </p>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        Most people tell us it's almost eerie how accurate it is.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Finish ${petName}'s Reading
        </a>
      </div>

      <p style="color: #b8a99e; font-size: 13px; text-align: center; margin: 0;">
        Takes about 2 minutes to finish. Your progress is saved.
      </p>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #d4c8bc; font-size: 11px; margin: 0 0 8px 0; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #b8a99e; font-size: 11px; text-decoration: underline; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Unsubscribe</a>
      </p>
    </div>

  </div>

</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscriber of abandonedCarts) {
      try {
        const petName = subscriber.pet_name || "your pet";
        const baseUrl = "https://littlesouls.app";
        const intakeUrl = `${baseUrl}/intake`;
        const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        
        logStep("Sending abandoned cart email", { email: subscriber.email, petName });

        const emailResponse = await resend.emails.send({
          from: "Little Souls <hello@littlesouls.app>",
          to: [subscriber.email],
          subject: `${petName}'s reading is still waiting for you`,
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
          subject: `${petName}'s reading is still waiting for you`,
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
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
