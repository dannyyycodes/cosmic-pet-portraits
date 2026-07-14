import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const getVipEmailTemplate = (petName: string, reportUrl: string, accountUrl: string, customerReferralCode: string, portraitUrl?: string) => {
  // Violet celestial palette (matches the shipped funnel + nurture emails)
  const mist = '#f3f0fb', card = '#ffffff', panel = '#f6f3fd', ink = '#241a3d', body = '#4a4363',
        muted = '#6b6488', violet = '#6a55c0', soft = '#b9a5f0', cta = '#5a3ec8', line = '#e9e2f7';
  const SIG = 'https://www.littlesouls.app/grace-signature.png';
  const benefit = (title: string, sub: string) => `
    <tr>
      <td style="padding:9px 0; vertical-align:top; width:26px;"><span style="color:${violet}; font-size:16px; line-height:1.3;">&bull;</span></td>
      <td style="padding:9px 0; vertical-align:top;">
        <span style="color:${ink}; font-size:14px; font-weight:600; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">${title}</span>
        <span style="color:${muted}; font-size:13px; display:block; line-height:1.5;">${sub}</span>
      </td>
    </tr>`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${mist}; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">

    <div style="background: ${card}; border-radius: 18px; border: 1px solid ${line}; padding: 40px 30px; box-shadow: 0 10px 34px rgba(90,62,200,0.08);">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 26px;">
        <p style="font-size: 12px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase; color: ${violet}; margin: 0 0 14px 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">Little Souls</p>
        <div style="display:inline-block; padding:7px 22px; background:${panel}; border:1px solid ${line}; border-radius:999px;">
          <span style="color:${violet}; font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">VIP Member</span>
        </div>
      </div>

      <h1 style="color: ${ink}; font-size: 30px; font-weight: 400; margin: 0 0 16px 0; text-align: center; line-height: 1.25; font-family: Georgia, 'Times New Roman', serif;">
        Welcome to VIP.
      </h1>

      <p style="color: ${body}; font-size: 16px; line-height: 1.75; margin: 0 0 30px 0; text-align: center;">
        You went further for ${petName} than most people ever do for anyone. <strong style="color:${ink};">That kind of love deserves the full picture.</strong>
      </p>

      <!-- Benefits -->
      <div style="background: ${panel}; border-radius: 14px; padding: 24px 26px; margin: 0 0 30px 0; border: 1px solid ${line};">
        <p style="color: ${violet}; font-size: 11px; font-weight: 700; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 2px; text-align: center; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
          Everything that is yours now
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${benefit(`${petName}'s full soul reading`, 'Their complete birth chart, decoded in depth')}
          ${benefit(`A cosmic portrait of ${petName}`, 'Their soul, rendered as art')}
          ${benefit('Weekly stars, every Monday', `${petName}'s forecast, written to their chart`)}
          ${benefit('Referral rewards', 'Share the reading, and you both receive')}
        </table>
      </div>

      ${portraitUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: ${muted}; font-size: 12px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">${petName}'s cosmic portrait is ready</p>
        <div style="display: inline-block; padding: 4px; background: linear-gradient(135deg, ${soft} 0%, ${violet} 100%); border-radius: 18px;">
          <img src="${portraitUrl}" alt="${petName}'s cosmic portrait" style="max-width: 260px; border-radius: 14px; display: block;">
        </div>
      </div>
      ` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${reportUrl}" style="display: inline-block; background: ${cta}; color: #ffffff; text-decoration: none; padding: 16px 46px; border-radius: 999px; font-weight: 600; font-size: 15px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing:0.4px; box-shadow: 0 6px 20px rgba(90,62,200,0.28);">
          Open ${petName}'s reading
        </a>
      </div>

      <!-- Referral -->
      <div style="background: ${panel}; border-radius: 14px; padding: 24px; margin: 30px 0 8px; text-align: center; border: 1px solid ${line};">
        <p style="color: ${violet}; font-size: 11px; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 2px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">Your referral code</p>
        <p style="color: ${muted}; font-size: 13px; margin: 0 0 16px 0;">Share it with someone who loves their companion the way you love ${petName}. You both receive.</p>
        <div style="display: inline-block; background: ${card}; border-radius: 10px; padding: 13px 26px; border: 1px solid ${soft};">
          <span style="color: ${ink}; font-size: 20px; font-weight: 700; letter-spacing: 3px; font-family: 'SF Mono', Monaco, Consolas, monospace;">${customerReferralCode}</span>
        </div>
        <p style="color: ${muted}; font-size: 11px; margin: 14px 0 0 0;">littlesouls.app/ref/${customerReferralCode}</p>
      </div>

      <!-- Divider -->
      <div style="width: 44px; height: 1px; background: linear-gradient(90deg, transparent, ${soft}, transparent); margin: 26px auto 20px;"></div>

      <p style="color: ${muted}; font-size: 13px; margin: 0 0 26px; text-align: center; line-height: 1.6;">
        Everything lives in your <a href="${accountUrl}" style="color: ${violet}; text-decoration: none; font-weight:600;">account</a>, ready whenever you are.
      </p>

      <!-- Grace sign-off -->
      <div style="text-align:center;">
        <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-style: italic; color: ${body}; margin: 0 0 8px;">With love,</p>
        <img src="${SIG}" alt="Grace" width="118" style="display:inline-block; width:118px; height:auto; margin: 0 0 3px;">
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: ${muted}; margin: 0;">Grace &middot; Little Souls</p>
      </div>

    </div>

    <div style="text-align: center; margin-top: 22px;">
      <p style="color: ${soft}; font-size: 10px; margin: 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

  </div>
</body>
</html>
`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  // SECURITY: Require service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
    console.error("[VIP-EMAIL] Unauthorized request");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const { reportId, email, petName, sunSign, portraitUrl, referralCode } = await req.json();
    
    console.log("[VIP-EMAIL] Sending VIP welcome for:", petName);

    if (!email || !reportId || !petName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const origin = "https://littlesouls.app";
    const reportUrl = `${origin}/report?id=${reportId}`;
    const accountUrl = `${origin}/account`;
    
    // Generate a unique referral code for the customer if they don't have one
    let customerReferralCode = referralCode;
    if (!customerReferralCode) {
      customerReferralCode = `VIP-${petName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Save to email_subscribers for tracking
      await supabaseClient
        .from("email_subscribers")
        .upsert({
          email,
          referral_code: customerReferralCode,
          tier_purchased: 'vip',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
    }

    const emailResponse = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: `Welcome to VIP, ${petName}'s human`,
      html: getVipEmailTemplate(petName, reportUrl, accountUrl, customerReferralCode, portraitUrl),
    });

    console.log("[VIP-EMAIL] VIP welcome email sent successfully");

    return new Response(JSON.stringify({ success: true, referralCode: customerReferralCode }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[VIP-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
