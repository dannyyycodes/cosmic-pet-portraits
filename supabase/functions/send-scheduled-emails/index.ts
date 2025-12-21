import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildEmailHtml(safeName: string, safeAiResponse: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 40px; margin-bottom: 12px;">🐾</div>
      <h1 style="color: #f5deb3; font-size: 24px; margin: 0; font-weight: 600;">
        Hello ${safeName}
      </h1>
    </div>

    <!-- AI Response Card -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 20px; padding: 28px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${safeAiResponse}
      </p>
    </div>

    <!-- Human Follow-up Note -->
    <div style="background: rgba(212, 175, 55, 0.1); border-radius: 12px; padding: 16px; border: 1px solid rgba(212, 175, 55, 0.2); margin-bottom: 24px;">
      <p style="color: #d4af37; font-size: 13px; margin: 0; text-align: center;">
        Our team has reviewed your request. Please reply if you need anything else.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: #707080; font-size: 13px; margin: 0 0 8px 0;">
        You can reply to this email for further assistance
      </p>
      <p style="color: #505060; font-size: 12px; margin: 0;">
        AstroPets Support
      </p>
    </div>

  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const scheduled of pendingEmails) {
      try {
        const safeAiResponse = escapeHtml(scheduled.ai_response).replace(/\n/g, '<br>');
        const safeName = escapeHtml(scheduled.name);

        await resend.emails.send({
          from: "AstroPets <hello@astropets.cloud>",
          to: [scheduled.email],
          subject: "Re: Your AstroPets inquiry",
          html: buildEmailHtml(safeName, safeAiResponse),
          reply_to: "hello@astropets.cloud",
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[SCHEDULED-EMAILS] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
