import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const origin = req.headers.get("origin") || "https://cosmicpetreport.com";
    const reportUrl = `${origin}/report?id=${reportId}`;

    const emailResponse = await resend.emails.send({
      from: "AstroPets <hello@astropets.cloud>",
      to: [email],
      subject: `${petName}'s Cosmic Reading is Ready`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
    
    <p style="color: #a0a0b0; font-size: 14px; margin: 0 0 32px 0; text-align: center;">
      Your pet's reading is complete
    </p>

    <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 16px 0; text-align: center; line-height: 1.3;">
      ${petName}'s cosmic profile is ready to explore
    </h1>
    
    <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
      We've mapped out ${petName}'s personality traits, hidden gifts, and what makes them truly special.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49a6c 100%); color: #1a1a2e; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 15px;">
        View ${petName}'s Reading
      </a>
    </div>

    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: #e0e0e0; font-size: 14px; font-weight: 500; margin: 0 0 16px 0;">
        What you'll discover:
      </p>
      <ul style="color: #a0a0b0; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Their core personality and what drives them</li>
        <li>How they show and receive love</li>
        <li>Tips for deeper bonding based on their nature</li>
      </ul>
    </div>

    <p style="color: #707080; font-size: 13px; margin: 32px 0 0 0; text-align: center; line-height: 1.6;">
      Save this email to access the reading anytime.<br>
      Questions? Just reply to this email.
    </p>

    <div style="border-top: 1px solid rgba(255,255,255,0.08); margin-top: 40px; padding-top: 24px; text-align: center;">
      <p style="color: #505060; font-size: 12px; margin: 0;">
        AstroPets
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });

    console.log("[SEND-REPORT-EMAIL] Email sent successfully");

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
