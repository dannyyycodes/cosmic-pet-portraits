import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Violet celestial palette (matches the shipped funnel + nurture emails):
// Background: #f3f0fb (mist)  |  Card bg: #ffffff  |  Border: #e9e2f7 (line)
// Heading: #241a3d (ink)  |  Body: #4a4363  |  Muted: #6b6488
// Panel: #f6f3fd  |  Accent: #6a55c0 (violet)  |  Soft: #b9a5f0
// CTA button: #5a3ec8 (deep violet)  |  Signature: Grace (hosted violet asset)

const getEmailTemplate = (petName: string, reportUrl: string, sunSign?: string, petPhotoUrl?: string, reportId?: string) => {
  const soulSpeakUrl = reportId ? `https://littlesouls.app/soul-chat?id=${reportId}` : '';
  // Violet celestial palette (matches the shipped funnel + nurture emails)
  const mist = '#f3f0fb', card = '#ffffff', panel = '#f6f3fd', ink = '#241a3d', body = '#4a4363',
        muted = '#6b6488', violet = '#6a55c0', soft = '#b9a5f0', cta = '#5a3ec8', line = '#e9e2f7';
  const SIG = 'https://content.littlesouls.app/viral-pet-media/grace-signature.png';
  const dot = `<span style="color:${violet};">&bull;</span>`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${mist}; font-family: Georgia, 'Times New Roman', serif;">

  <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header / Brand logo -->
    <div style="text-align: center; margin-bottom: 22px;">
      <a href="https://www.littlesouls.app" style="text-decoration: none; display: inline-block;">
        <img src="https://content.littlesouls.app/viral-pet-media/little-souls-logo-email.png" alt="Little Souls" width="200" style="display: block; width: 200px; height: auto; margin: 0 auto 12px; border: 0; outline: none;" />
      </a>
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase; color: ${violet}; margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: ${card}; border-radius: 18px; border: 1px solid ${line}; padding: 40px 28px; text-align: center; box-shadow: 0 10px 34px rgba(90,62,200,0.08);">

      <!-- Pet Photo Circle -->
      ${petPhotoUrl ? `
      <div style="margin: 0 auto 24px; width: 120px; height: 120px;">
        <img src="${petPhotoUrl}" alt="${petName}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid ${soft}; box-shadow: 0 0 0 6px rgba(167,139,250,0.14), 0 8px 24px rgba(90,62,200,0.15);" />
      </div>
      ` : ''}

      <p style="font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: ${violet}; margin: 0 0 14px 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
        ${sunSign ? `A ${sunSign} Soul` : 'Something quiet and rare'}
      </p>

      <h1 style="color: ${ink}; font-size: 26px; font-weight: 400; margin: 0 0 20px 0; line-height: 1.35; font-family: Georgia, 'Times New Roman', serif;">
        Thank you for trusting us<br>to read ${petName}'s soul.
      </h1>

      <p style="color: ${body}; font-size: 15px; line-height: 1.8; margin: 0 0 12px 0;">
        The fact that you are here means something. It means ${petName} is loved deeply enough that someone wanted to understand them on a soul level. <strong style="color:${ink};">That is a rare kind of love.</strong>
      </p>

      <p style="color: ${body}; font-size: 15px; line-height: 1.8; margin: 0 0 12px 0;">
        We took the exact moment ${petName} arrived in this world${sunSign ? `, born under the ${sunSign} sky` : ''}, and read it the way an astrologer reads a birth chart. What came back moved us. We hope it moves you too.
      </p>

      <p style="color: ${body}; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        This reading was made with real care. Not only for ${petName}, but for the bond the two of you share. Because that bond is written in the stars.
      </p>

      <!-- What awaits -->
      <div style="text-align: left; background: ${panel}; border-radius: 14px; padding: 24px 26px; margin: 0 0 28px 0; border: 1px solid ${line};">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${violet}; margin: 0 0 14px 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
          What is waiting inside
        </p>
        <p style="color: ${body}; font-size: 14px; line-height: 2.1; margin: 0;">
          ${dot} ${petName}'s complete birth chart, decoded with care<br>
          ${dot} How ${petName} loves you, and what they need to feel it back<br>
          ${dot} The cosmic reason behind every quirk you adore<br>
          ${dot} Their dream playlist, secret dating profile, and hidden talents<br>
          ${dot} A letter written from ${petName}'s soul to yours
        </p>
      </div>

      <!-- CTA Button -->
      <div style="margin: 28px 0;">
        <a href="${reportUrl}" style="display: inline-block; background: ${cta}; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 999px; font-weight: 600; font-size: 15px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: 0.4px; box-shadow: 0 6px 20px rgba(90,62,200,0.28);">
          Open ${petName}'s reading
        </a>
      </div>

      <p style="color: ${muted}; font-size: 14px; line-height: 1.7; margin: 0 0 20px 0; font-style: italic;">
        &ldquo;Some souls choose us before we are ready to understand why.<br>${petName} chose you. The stars know exactly why.&rdquo;
      </p>

      <!-- Mini Guide -->
      <div style="text-align: left; background: ${panel}; border-radius: 14px; padding: 20px 24px; margin: 24px 0; border: 1px solid ${line};">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${violet}; margin: 0 0 10px 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
          How to sit with ${petName}'s reading
        </p>
        <p style="color: ${body}; font-size: 13px; line-height: 2; margin: 0;">
          ${dot} Read it out loud to ${petName}. They answer the energy<br>
          ${dot} Screenshot the parts that feel most like them, and share<br>
          ${dot} Save the soul letter at the end for when you need it most<br>
          ${dot} Come back in a few weeks. You notice new things each time
        </p>
      </div>

      ${soulSpeakUrl ? `
      <!-- SoulSpeak -->
      <div style="text-align: center; background: ${panel}; border-radius: 14px; padding: 20px; border: 1px solid ${line}; margin: 0 0 20px 0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${violet}; margin: 0 0 6px 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
          SoulSpeak
        </p>
        <p style="color: ${body}; font-size: 14px; margin: 0 0 14px; line-height: 1.6;">
          Talk to ${petName}'s soul. Ask them anything.
        </p>
        <a href="${soulSpeakUrl}" style="display: inline-block; background: ${ink}; color: #fff; text-decoration: none; padding: 11px 30px; border-radius: 999px; font-size: 13px; font-weight: 600; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
          Open SoulSpeak
        </a>
      </div>
      ` : ''}

      <!-- Gift Code -->
      <div style="text-align: center; background: ${panel}; border-radius: 14px; padding: 18px; border: 1px solid ${line}; margin: 0 0 20px 0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${violet}; margin: 0 0 6px 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
          Gift a reading to someone you love &middot; 30% off
        </p>
        <p style="color: ${ink}; font-size: 20px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace;">
          GIFTLOVE30
        </p>
      </div>

      <!-- Divider -->
      <div style="width: 44px; height: 1px; background: linear-gradient(90deg, transparent, ${soft}, transparent); margin: 22px auto;"></div>

      <p style="color: ${muted}; font-size: 13px; line-height: 1.6; margin: 0;">
        This link is yours to keep, a small piece of ${petName}'s soul. Save it, return to it, share it with anyone who loves ${petName} the way you do.
      </p>

      <!-- Grace sign-off -->
      <div style="margin-top: 30px;">
        <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-style: italic; color: ${body}; margin: 0 0 8px;">With love and gratitude,</p>
        <img src="${SIG}" alt="Grace" width="120" style="display:inline-block; width:120px; height:auto; margin: 0 0 3px;">
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: ${muted}; margin: 0;">Grace &middot; Little Souls</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 26px;">
      <p style="color: ${muted}; font-size: 13px; line-height: 1.7; margin: 0;">
        I would love to hear how ${petName}'s reading made you feel.<br>
        Just reply to this email. A real person reads every one.
      </p>
      <p style="color: ${soft}; font-size: 10px; margin: 14px 0 0 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
        littlesouls.app
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

  // SECURITY: Require service role or bridge secret authorization
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const bridgeSecret = Deno.env.get("N8N_BRIDGE_SECRET") || "";

  const isServiceRole = serviceRoleKey && authHeader.includes(serviceRoleKey);
  const isBridgeAuth = bridgeSecret && authHeader.includes(bridgeSecret);

  if (!isServiceRole && !isBridgeAuth) {
    console.error("[SEND-REPORT-EMAIL] Unauthorized request - missing or invalid authorization");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    const { reportId, email, petName, sunSign, petPhotoUrl } = await req.json() as {
      reportId: string; email: string; petName: string; sunSign?: string; petPhotoUrl?: string;
    };

    console.log("[SEND-REPORT-EMAIL] Sending email for report:", reportId?.substring(0, 8));

    if (!email || !reportId) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Ensure shareToken exists so the email link bypasses email verification.
    // Also pull pet_photo_url so the email can show their photo even when the
    // caller did not pass it (the drip / recovery paths often only have the id).
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const { data: reportRow } = await fetch(
      `${supabaseUrl}/rest/v1/pet_reports?id=eq.${reportId}&select=share_token,pet_photo_url`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } }
    ).then(r => r.json()).then(rows => ({ data: rows?.[0] }));

    // Caller-supplied photo wins; otherwise fall back to the stored one.
    const photoForEmail = petPhotoUrl || reportRow?.pet_photo_url || undefined;

    let shareToken = reportRow?.share_token;
    if (!shareToken) {
      shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      await fetch(`${supabaseUrl}/rest/v1/pet_reports?id=eq.${reportId}`, {
        method: "PATCH",
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ share_token: shareToken }),
      });
    }

    const reportUrl = `https://littlesouls.app/report?id=${reportId}&token=${shareToken}`;

    const emailResult = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: `${petName}'s reading is ready to open`,
      html: getEmailTemplate(petName, reportUrl, sunSign, photoForEmail, reportId),
    });

    const resendError = (emailResult as any)?.error;
    if (resendError) {
      console.error("[SEND-REPORT-EMAIL] Resend error:", JSON.stringify(resendError));
      console.error("[SEND-REPORT-EMAIL] Full response:", JSON.stringify(emailResult));
      return new Response(JSON.stringify({ error: "Email delivery failed", detail: resendError }), {
        status: 502,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    console.log("[SEND-REPORT-EMAIL] Email accepted by provider", {
      reportId: reportId?.substring(0, 8),
      to: email,
      id: (emailResult as any)?.id,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[SEND-REPORT-EMAIL] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
