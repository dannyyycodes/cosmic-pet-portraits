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
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Outer container with gradient border -->
  <div style="max-width: 600px; margin: 0 auto; padding: 2px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); border-radius: 20px;">
    
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 18px; padding: 48px 32px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%); border-radius: 50px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <span style="font-size: 24px;">🐾💬</span>
        </div>
      </div>

      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 24px 0; text-align: center;">
        Hello ${safeName}
      </h1>

      <!-- AI Response Card -->
      <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 28px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px;">
        <p style="color: #e5e7eb; font-size: 15px; line-height: 1.8; margin: 0;">
          ${safeAiResponse}
        </p>
      </div>

      <!-- Human Follow-up Note -->
      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%); border-radius: 12px; padding: 18px; border: 1px solid rgba(245, 158, 11, 0.2); margin-bottom: 24px;">
        <p style="color: #fbbf24; font-size: 13px; margin: 0; text-align: center; font-weight: 500;">
          ✨ Our team has reviewed your request. Please reply if you need anything else.
        </p>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%); margin: 32px 0;"></div>

      <!-- Footer -->
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
        You can reply to this email for further assistance.
      </p>

      <!-- Brand Footer -->
      <div style="text-align: center; margin-top: 24px;">
        <p style="color: #4b5563; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
          Little Souls Support
        </p>
      </div>

    </div>
  </div>
  
  <div style="height: 20px;"></div>
  
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
          from: "Little Souls <hello@littlesouls.co>",
          to: [scheduled.email],
          subject: "Re: Your Little Souls inquiry ✨",
          html: buildEmailHtml(safeName, safeAiResponse),
          reply_to: "hello@littlesouls.co",
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
