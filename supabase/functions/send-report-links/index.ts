import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRow {
  id: string;
  pet_name: string;
  created_at: string;
}

function getEmailTemplate(reports: ReportRow[]) {
  const reportLinks = reports
    .map(
      (r) =>
        `<tr>
          <td style="padding: 12px 16px;">
            <a href="https://littlesouls.app/report?id=${r.id}" style="color: #a78bfa; text-decoration: none; font-size: 15px; font-weight: 600;">${r.pet_name}'s Reading &rarr;</a>
            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Purchased ${new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
          </td>
        </tr>
        <tr><td style="padding: 0 16px;"><div style="height: 1px; background: rgba(255,255,255,0.06);"></div></td></tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 2px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #d946ef 50%, #f59e0b 75%, #6366f1 100%); border-radius: 20px;">
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 18px; padding: 48px 32px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%); border-radius: 50px; border: 1px solid rgba(139, 92, 246, 0.3);">
          <span style="font-size: 24px;">&#10024;&#128062;&#10024;</span>
        </div>
      </div>
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 12px 0; text-align: center; line-height: 1.2; background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
        Your Little Souls Readings
      </h1>
      <p style="color: #9ca3af; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0; text-align: center;">
        Here are all the readings linked to your account. Click any link to view it.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
        ${reportLinks}
      </table>
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%); margin: 36px 0;"></div>
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
        Save this email to access your readings anytime.<br>
        Questions? Simply reply to this message.
      </p>
      <div style="text-align: center; margin-top: 24px;">
        <p style="color: #4b5563; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Little Souls</p>
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
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: true, message: "If that email has reports, we've sent them." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: reports, error } = await supabase
      .from("pet_reports")
      .select("id, pet_name, created_at")
      .eq("email", email.toLowerCase().trim())
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SEND-REPORT-LINKS] DB error:", error);
    }

    if (reports && reports.length > 0) {
      const emailResult = await resend.emails.send({
        from: "Little Souls <hello@littlesouls.app>",
        to: [email.toLowerCase().trim()],
        subject: `Your Little Souls Report Links`,
        html: getEmailTemplate(reports),
      });

      const resendError = (emailResult as any)?.error;
      if (resendError) {
        console.error("[SEND-REPORT-LINKS] Resend error:", resendError);
      } else {
        console.log("[SEND-REPORT-LINKS] Email sent with", reports.length, "report links");
      }
    } else {
      console.log("[SEND-REPORT-LINKS] No reports found for email (not revealing to client)");
    }

    // Always return the same response regardless of whether reports were found
    return new Response(
      JSON.stringify({ success: true, message: "If that email has reports, we've sent them." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SEND-REPORT-LINKS] Error:", error);
    return new Response(
      JSON.stringify({ success: true, message: "If that email has reports, we've sent them." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
