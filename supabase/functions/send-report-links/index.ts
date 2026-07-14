import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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

interface ReportRow {
  id: string;
  pet_name: string;
  created_at: string;
}

function getEmailTemplate(reports: ReportRow[]) {
  // Violet celestial palette (matches the shipped funnel + nurture emails)
  const mist = '#f3f0fb', card = '#ffffff', panel = '#f6f3fd', ink = '#241a3d', body = '#4a4363',
        muted = '#6b6488', violet = '#6a55c0', soft = '#b9a5f0', line = '#e9e2f7';
  const SIG = 'https://content.littlesouls.app/viral-pet-media/grace-signature.png';
  const reportLinks = reports
    .map(
      (r) =>
        `<tr>
          <td style="padding: 16px 20px;">
            <a href="https://littlesouls.app/report?id=${r.id}" style="color: ${violet}; text-decoration: none; font-size: 16px; font-weight: 600; font-family: Georgia, 'Times New Roman', serif;">${r.pet_name}'s reading</a>
            <div style="color: ${muted}; font-size: 12px; margin-top: 4px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">Opened ${new Date(r.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}</div>
          </td>
          <td style="padding: 16px 20px; text-align:right;">
            <a href="https://littlesouls.app/report?id=${r.id}" style="color: ${violet}; text-decoration: none; font-size: 20px;">&rarr;</a>
          </td>
        </tr>
        <tr><td colspan="2" style="padding: 0 20px;"><div style="height: 1px; background: ${line};"></div></td></tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${mist}; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
    <div style="background: ${card}; border-radius: 18px; border: 1px solid ${line}; padding: 40px 28px; box-shadow: 0 10px 34px rgba(90,62,200,0.08);">
      <div style="text-align: center; margin-bottom: 26px;">
        <p style="font-size: 12px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase; color: ${violet}; margin: 0 0 16px 0; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">Little Souls</p>
        <h1 style="color: ${ink}; font-size: 26px; font-weight: 400; margin: 0 0 10px 0; line-height: 1.3; font-family: Georgia, 'Times New Roman', serif;">
          Your readings, all in one place
        </h1>
        <p style="color: ${body}; font-size: 15px; line-height: 1.65; margin: 0;">
          Every soul you have met with us. Open any one to sit with it again.
        </p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="background: ${panel}; border-radius: 14px; border: 1px solid ${line};">
        ${reportLinks}
      </table>
      <div style="width: 44px; height: 1px; background: linear-gradient(90deg, transparent, ${soft}, transparent); margin: 30px auto 22px;"></div>
      <p style="color: ${muted}; font-size: 13px; margin: 0 0 26px; text-align: center; line-height: 1.6;">
        Keep this email. Your readings live at these links, always.
      </p>
      <!-- Grace sign-off -->
      <div style="text-align:center;">
        <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 15px; font-style: italic; color: ${body}; margin: 0 0 8px;">With love,</p>
        <img src="${SIG}" alt="Grace" width="116" style="display:inline-block; width:116px; height:auto; margin: 0 0 3px;">
        <p style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 11px; letter-spacing: 1.6px; text-transform: uppercase; color: ${muted}; margin: 0;">Grace &middot; Little Souls</p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 22px;">
      <p style="color: ${muted}; font-size: 12px; margin: 0; line-height:1.6;">Something not here? Just reply. A real person will help.</p>
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
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: true, message: "If that email has reports, we've sent them." }),
        { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
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
        subject: `Your Little Souls readings`,
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
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SEND-REPORT-LINKS] Error:", error);
    return new Response(
      JSON.stringify({ success: true, message: "If that email has reports, we've sent them." }),
      { status: 200, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
