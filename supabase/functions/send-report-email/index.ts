import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Color palette — matches landing page / checkout (variant-c):
// Background: #FFFDF5 (cream)  |  Card bg: #ffffff  |  Card border: #e8ddd0 (sand)
// Heading: #141210 (ink)  |  Body: #5a4a42 (warm)  |  Muted: #958779
// Inner card: #faf4e8 (cream2)  |  Inner border: #e8ddd0
// CTA button: #bf524a (rose)  |  Accent: #c4a265 (gold)  |  Faded: #d6c8b6

const getEmailTemplate = (petName: string, reportUrl: string, sunSign?: string, petPhotoUrl?: string, reportId?: string) => {
  const soulSpeakUrl = reportId ? `https://littlesouls.app/soul-chat?id=${reportId}` : '';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF5; font-family: Georgia, 'Times New Roman', serif;">

  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <!-- Main Card -->
    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 40px 28px; text-align: center; box-shadow: 0 4px 20px rgba(35,40,30,0.06);">

      <!-- Pet Photo Circle -->
      ${petPhotoUrl ? `
      <div style="margin: 0 auto 24px; width: 120px; height: 120px;">
        <img src="${petPhotoUrl}" alt="${petName}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #c4a265; box-shadow: 0 0 0 6px rgba(196,162,101,0.12), 0 8px 24px rgba(196,162,101,0.15);" />
      </div>
      ` : `
      <p style="font-size: 40px; margin: 0 0 16px 0;">&#128062;</p>
      `}

      <p style="font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: #c4a265; margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        ${sunSign ? `A ${sunSign} Soul` : 'Something Beautiful Awaits'}
      </p>

      <h1 style="color: #141210; font-size: 26px; font-weight: 400; margin: 0 0 20px 0; line-height: 1.35; font-family: Georgia, 'Times New Roman', serif;">
        From the bottom of our hearts,<br>thank you for choosing us<br>to honour ${petName}'s soul.
      </h1>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 8px 0;">
        The fact that you're here means something beautiful. It means ${petName} is loved deeply enough for someone to want to understand them on a soul level. That's a rare and wonderful kind of love.
      </p>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 12px 0;">
        We took the exact moment ${petName} arrived in this world${sunSign ? `, born under the ${sunSign} sky` : ''}, and asked the stars to tell us everything. What came back moved us. We poured our hearts into every word, and we truly hope it moves you too.
      </p>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        This reading was made with so much love. Not just for ${petName}, but for the bond you share. Because that bond? It's written in the stars.
      </p>

      <!-- What awaits -->
      <div style="text-align: left; background: #faf4e8; border-radius: 12px; padding: 24px 26px; margin: 0 0 28px 0; border: 1px solid #e8ddd0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          What we lovingly prepared for you
        </p>
        <p style="color: #4d443b; font-size: 14px; line-height: 2.1; margin: 0;">
          &#10024; ${petName}'s complete cosmic birth chart, decoded with care<br>
          &#128156; How ${petName} loves you (and exactly what they need to feel it back)<br>
          &#127775; The cosmic reasons behind every adorable quirk<br>
          &#127926; Their dream playlist, secret dating profile, and hidden talents<br>
          &#128140; A letter written from ${petName}'s soul to yours
        </p>
      </div>

      <!-- CTA Button (Rose — matches landing page primary CTA #bf524a) -->
      <div style="margin: 28px 0;">
        <a href="${reportUrl}" style="display: inline-block; background: #bf524a; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(191,82,74,0.25);">
          Open ${petName}'s Reading &#10024;
        </a>
      </div>

      <p style="color: #6e6259; font-size: 14px; line-height: 1.7; margin: 0 0 8px 0; font-style: italic;">
        "Some souls choose us before we're ready to understand why.<br>${petName} chose you. And the stars know exactly why."
      </p>

      <p style="color: #6e6259; font-size: 14px; line-height: 1.7; margin: 0 0 20px 0;">
        We are so grateful you trusted us with this. Truly.
      </p>

      <!-- Mini Guide -->
      <div style="text-align: left; background: #faf4e8; border-radius: 12px; padding: 20px 22px; margin: 24px 0; border: 1px solid #e8ddd0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          How to enjoy ${petName}'s reading
        </p>
        <p style="color: #4d443b; font-size: 13px; line-height: 2; margin: 0;">
          &#10024; Read it out loud to ${petName}. They respond to the energy<br>
          &#128247; Screenshot the parts that feel most "them" and share with a friend<br>
          &#128140; Save the soul letter at the end for when you need it most<br>
          &#127793; Come back in a few weeks. You'll notice new things each time
        </p>
      </div>

      ${soulSpeakUrl ? `
      <!-- SoulSpeak -->
      <div style="text-align: center; background: #faf4e8; border-radius: 12px; padding: 18px; border: 1px solid #e8ddd0; margin: 0 0 20px 0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          SoulSpeak
        </p>
        <p style="color: #5a4a42; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">
          Talk to ${petName}'s soul. Ask them anything.
        </p>
        <a href="${soulSpeakUrl}" style="display: inline-block; background: #141210; color: #fff; text-decoration: none; padding: 10px 28px; border-radius: 50px; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Open SoulSpeak &#10024;
        </a>
      </div>
      ` : ''}

      <!-- Gift Code -->
      <div style="text-align: center; background: #faf4e8; border-radius: 12px; padding: 16px; border: 1px solid #e8ddd0; margin: 0 0 20px 0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Gift a reading to someone you love. 30% off
        </p>
        <p style="color: #141210; font-size: 20px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace;">
          GIFTLOVE30
        </p>
      </div>

      <!-- Divider -->
      <div style="width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #c4a265, transparent); margin: 20px auto;"></div>

      <p style="color: #958779; font-size: 13px; line-height: 1.6; margin: 0;">
        This link is yours forever, a keepsake of ${petName}'s soul. Save it, revisit it, and share it with anyone who loves ${petName} as much as you do.
      </p>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #958779; font-size: 13px; line-height: 1.7; margin: 0 0 6px 0;">
        We would love to hear how ${petName}'s reading made you feel.<br>
        Just reply to this email. Every message is read by a real person who genuinely cares.
      </p>
      <p style="color: #c4a265; font-size: 12px; margin: 14px 0 0 0; font-style: italic;">
        With love and gratitude,<br>
        The Little Souls family &#128156;
      </p>
      <p style="color: #d6c8b6; font-size: 10px; margin: 10px 0 0 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
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
    return new Response(null, { headers: corsHeaders });
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportUrl = `https://littlesouls.app/report?id=${reportId}`;

    const emailResult = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: `Thank you for choosing Little Souls — ${petName}'s reading is ready`,
      html: getEmailTemplate(petName, reportUrl, sunSign, petPhotoUrl, reportId),
    });

    const resendError = (emailResult as any)?.error;
    if (resendError) {
      console.error("[SEND-REPORT-EMAIL] Resend error:", JSON.stringify(resendError));
      console.error("[SEND-REPORT-EMAIL] Full response:", JSON.stringify(emailResult));
      return new Response(JSON.stringify({ error: "Email delivery failed", detail: resendError }), {
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
