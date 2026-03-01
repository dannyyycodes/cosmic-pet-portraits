import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getEmailTemplate = (petName: string, reportUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Outer container with gradient border effect -->
  <div style="max-width: 600px; margin: 0 auto; padding: 2px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #d946ef 50%, #f59e0b 75%, #6366f1 100%); border-radius: 20px;">
    
    <!-- Inner container -->
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 18px; padding: 48px 32px;">
      
      <!-- Logo/Header -->
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%); border-radius: 50px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <span style="font-size: 24px;">✨🐾✨</span>
        </div>
      </div>

      <!-- Status Badge -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
          ● Reading Complete
        </span>
      </div>

      <!-- Main Title -->
      <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; text-align: center; line-height: 1.2; background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        ${petName}'s Cosmic Profile is Ready
      </h1>
      
      <p style="color: #9ca3af; font-size: 16px; line-height: 1.7; margin: 0 0 36px 0; text-align: center;">
        We've analyzed the stars and uncovered ${petName}'s unique cosmic blueprint. Discover what makes your companion truly special.
      </p>

      <!-- Feature Cards -->
      <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 24px; margin: 0 0 32px 0; border: 1px solid rgba(255,255,255,0.06);">
        <p style="color: #d1d5db; font-size: 13px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          What You'll Discover
        </p>
        <div style="display: block;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; display: inline-block; text-align: center; line-height: 32px; font-size: 14px; margin-right: 12px;">🌟</span>
            <span style="color: #e5e7eb; font-size: 14px;">Core personality traits & cosmic energy</span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); border-radius: 8px; display: inline-block; text-align: center; line-height: 32px; font-size: 14px; margin-right: 12px;">💜</span>
            <span style="color: #e5e7eb; font-size: 14px;">How ${petName} expresses & receives love</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #d946ef 0%, #f59e0b 100%); border-radius: 8px; display: inline-block; text-align: center; line-height: 32px; font-size: 14px; margin-right: 12px;">🔮</span>
            <span style="color: #e5e7eb; font-size: 14px;">Tips for deeper bonding & understanding</span>
          </div>
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 36px 0;">
        <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f59e0b 100%); color: white; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset;">
          View ${petName}'s Reading →
        </a>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%); margin: 40px 0;"></div>

      <!-- Footer -->
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
        Save this email to access your reading anytime.<br>
        Questions? Simply reply to this message.
      </p>

      <!-- Brand Footer -->
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #4b5563; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
          Little Souls
        </p>
      </div>

    </div>
  </div>
  
  <!-- Spacer for email clients -->
  <div style="height: 20px;"></div>
  
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

    const origin = req.headers.get("origin") || "https://cosmicpetreport.com";
    const reportUrl = `${origin}/report?id=${reportId}`;

    const emailResult = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.co>",
      to: [email],
      subject: `${petName}'s Cosmic Reading is Ready ✨`,
      html: getEmailTemplate(petName, reportUrl),
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
