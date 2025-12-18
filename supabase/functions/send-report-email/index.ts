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
      from: "Cosmic Pet Report <hello@cosmicpetreport.com>",
      to: [email],
      subject: `✨ ${petName}'s Cosmic Portrait is Ready!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🌟</div>
      <h1 style="color: #f5deb3; font-size: 28px; margin: 0 0 8px 0; font-weight: 600;">
        The Stars Have Spoken
      </h1>
      <p style="color: #a0a0b0; font-size: 16px; margin: 0;">
        ${petName}'s cosmic portrait awaits you
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 24px; padding: 32px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 32px;">
      
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%); padding: 12px 24px; border-radius: 100px; margin-bottom: 16px;">
          <span style="color: white; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            ${sunSign || 'Cosmic'} ${sunSign ? '♈' : '✨'}
          </span>
        </div>
        
        <h2 style="color: white; font-size: 24px; margin: 0 0 8px 0;">
          ${petName}'s Soul Revealed
        </h2>
        <p style="color: #a0a0b0; font-size: 14px; margin: 0;">
          Discover their hidden gifts, love language, and cosmic wisdom
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #f5a623 0%, #f5c563 100%); color: #1a1a2e; text-decoration: none; padding: 16px 48px; border-radius: 100px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 32px rgba(245, 166, 35, 0.3);">
          ✨ View ${petName}'s Portrait
        </a>
      </div>
    </div>

    <!-- Features -->
    <div style="display: grid; gap: 16px; margin-bottom: 32px;">
      <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">💫</span>
          <div>
            <div style="color: white; font-weight: 500;">Core Essence</div>
            <div style="color: #a0a0b0; font-size: 13px;">Their true nature revealed</div>
          </div>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">❤️</span>
          <div>
            <div style="color: white; font-weight: 500;">Love Language</div>
            <div style="color: #a0a0b0; font-size: 13px;">How they give & receive love</div>
          </div>
        </div>
      </div>
      <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🔮</span>
          <div>
            <div style="color: white; font-weight: 500;">Cosmic Wisdom</div>
            <div style="color: #a0a0b0; font-size: 13px;">Guidance for deeper bonding</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: #707080; font-size: 13px; margin: 0 0 8px 0;">
        Save this email to access ${petName}'s portrait anytime
      </p>
      <p style="color: #505060; font-size: 12px; margin: 0;">
        The Cosmic Pet Report • Revealing the souls of our furry friends
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
