import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmailHtml(safeName: string, safeAiResponse: string): string {
  // Violet celestial palette (matches the shipped funnel + nurture emails)
  const mist = '#f3f0fb', card = '#ffffff', panel = '#f6f3fd', ink = '#241a3d', body = '#4a4363',
        muted = '#6b6488', violet = '#6a55c0', soft = '#b9a5f0', line = '#e9e2f7';
  const SIG = 'https://content.littlesouls.app/viral-pet-media/grace-signature.png';
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

      <div style="text-align: center; margin-bottom: 24px;">
        <p style="font-size: 12px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase; color: ${violet}; margin: 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">Little Souls</p>
      </div>

      <h1 style="color: ${ink}; font-size: 24px; font-weight: 400; margin: 0 0 22px 0; font-family: Georgia, 'Times New Roman', serif;">
        Hello ${safeName},
      </h1>

      <div style="color: ${body}; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0;">
        ${safeAiResponse}
      </div>

      <div style="background: ${panel}; border-radius: 12px; padding: 16px 20px; border: 1px solid ${line}; margin-bottom: 6px;">
        <p style="color: ${muted}; font-size: 13px; margin: 0; line-height:1.6;">
          If anything here needs a second look, just reply. This message goes straight to a real person.
        </p>
      </div>

      <!-- Grace sign-off -->
      <div style="margin-top: 26px;">
        <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-style: italic; color: ${body}; margin: 0 0 8px;">With love,</p>
        <img src="${SIG}" alt="Grace" width="116" style="display:block; width:116px; height:auto; margin: 0 0 3px -1px;">
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: ${muted}; margin: 0;">Grace &middot; Little Souls</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    console.log("[SCHEDULED-EMAILS] Starting scheduled email processing");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get emails that are due to be sent
    const now = new Date().toISOString();
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("scheduled_emails")
      .select("*")
      .lte("send_at", now)
      .is("sent_at", null)
      .limit(10);

    if (fetchError) {
      console.error("[SCHEDULED-EMAILS] Error fetching:", fetchError);
      throw fetchError;
    }

    console.log("[SCHEDULED-EMAILS] Found pending emails:", pendingEmails?.length || 0);

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const scheduled of pendingEmails) {
      try {
        const safeAiResponse = escapeHtml(scheduled.ai_response).replace(/\n/g, '<br>');
        const safeName = escapeHtml(scheduled.name);

        await resend.emails.send({
          from: "Little Souls <hello@littlesouls.app>",
          to: [scheduled.email],
          subject: "Re: your message to Little Souls",
          html: buildEmailHtml(safeName, safeAiResponse),
          reply_to: "hello@littlesouls.app",
        });

        // Mark as sent
        await supabase
          .from("scheduled_emails")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", scheduled.id);

        sentCount++;
        console.log("[SCHEDULED-EMAILS] Sent email to:", scheduled.email);
      } catch (emailError) {
        console.error("[SCHEDULED-EMAILS] Error sending to:", scheduled.email, emailError);
      }
    }

    console.log("[SCHEDULED-EMAILS] Completed, sent:", sentCount);

    return new Response(JSON.stringify({ sent: sentCount }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[SCHEDULED-EMAILS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
