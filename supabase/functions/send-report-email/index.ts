import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getEmailTemplate = (petName: string, reportUrl: string, sunSign?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf6f1; font-family: Georgia, 'Times New Roman', serif;">

  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 36px;">
      <p style="font-size: 28px; margin: 0 0 8px 0;">🐾</p>
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 40px 32px; text-align: center;">

      <p style="font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Your Reading is Ready
      </p>

      <h1 style="color: #3d2f2a; font-size: 28px; font-weight: 400; margin: 0 0 20px 0; line-height: 1.3; font-family: Georgia, 'Times New Roman', serif;">
        ${petName}'s soul has a story.<br>We wrote it down for you.
      </h1>

      <p style="color: #7a6a60; font-size: 15px; line-height: 1.8; margin: 0 0 32px 0;">
        We looked at the exact moment ${petName} came into this world${sunSign ? ` as a ${sunSign}` : ''}, and something beautiful emerged. A full portrait of who they really are — their personality, their quirks, the way they love you, and all the little things that make them, <em>them</em>.
      </p>

      <!-- What's inside -->
      <div style="text-align: left; background: #faf6f1; border-radius: 12px; padding: 24px 28px; margin: 0 0 32px 0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Inside ${petName}'s Reading
        </p>
        <p style="color: #5a4a42; font-size: 14px; line-height: 2; margin: 0;">
          Their full birth chart and what it means<br>
          Why they do that one thing you always wonder about<br>
          How they show love (and how they need it back)<br>
          Their cosmic playlist, dream job, and secret inner world<br>
          A letter from their soul to yours
        </p>
      </div>

      <!-- CTA Button -->
      <div style="margin: 32px 0;">
        <a href="${reportUrl}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 16px 44px; border-radius: 50px; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.5px;">
          Read ${petName}'s Report
        </a>
      </div>

      <p style="color: #b8a99e; font-size: 13px; line-height: 1.6; margin: 0;">
        This link is yours forever. Come back to it whenever you need a reminder of the little soul who chose you.
      </p>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 36px;">
      <p style="color: #b8a99e; font-size: 12px; line-height: 1.7; margin: 0 0 8px 0;">
        Save this email — it's your permanent link to ${petName}'s reading.<br>
        Questions? Just reply to this email. We read every one.
      </p>
      <p style="color: #d4c8bc; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

  </div>

</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Require service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
    console.error("[SEND-REPORT-EMAIL] Unauthorized request - missing or invalid authorization");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { reportId, email, petName, sunSign } = await req.json();
    
    console.log("[SEND-REPORT-EMAIL] Sending email for report:", reportId?.substring(0, 8));

    if (!email || !reportId) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportUrl = `https://littlesouls.co/report?id=${reportId}`;

    const emailResult = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.co>",
      to: [email],
      subject: `${petName}'s Cosmic Reading is Ready ✨`,
      html: getEmailTemplate(petName, reportUrl, sunSign),
    });

    const resendError = (emailResult as any)?.error;
    if (resendError) {
      console.error("[SEND-REPORT-EMAIL] Resend error:", resendError);
      return new Response(JSON.stringify({ error: "Email delivery failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[SEND-REPORT-EMAIL] Email accepted by provider", {
      reportId: reportId?.substring(0, 8),
      to: email,
      id: (emailResult as any)?.id,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[SEND-REPORT-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
