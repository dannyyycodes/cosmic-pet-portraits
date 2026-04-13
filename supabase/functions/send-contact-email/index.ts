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

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const subjectLabels: Record<string, string> = {
  refund: "Refund Request",
  report: "Question About Report",
  gift: "Gift Certificate Help",
  affiliate: "Affiliate Program",
  other: "General Inquiry",
};

// HTML escape function to prevent XSS/injection
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Tighter than the usual /^\S+@\S+\.\S+$/ — also rejects commas, semicolons,
// and whitespace anywhere in the string so the value cannot smuggle extra
// recipients through Resend's reply_to header.
const EMAIL_PATTERN = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}$/;

const getConfirmationEmailTemplate = (safeName: string, safeSubjectLabel: string, safeMessage: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:12px;">&#128062;&#10024;</div>
      <h1 style="color:#141210;font-size:24px;margin:0 0 8px;font-weight:600;">
        Thank you, ${safeName}!
      </h1>
      <div style="display:inline-block;background:#faf4e8;padding:6px 16px;border-radius:50px;border:1px solid #e8ddd0;margin-top:8px;">
        <span style="color:#c4a265;font-size:12px;font-weight:600;letter-spacing:0.5px;font-family:-apple-system,sans-serif;">&#9679; MESSAGE RECEIVED</span>
      </div>
    </div>

    <!-- Main Card -->
    <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e8ddd0;margin-bottom:24px;">
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0 0 20px;text-align:center;">
        We've received your message about <strong style="color:#c4a265;">${safeSubjectLabel.toLowerCase()}</strong> and our cosmic support team will get back to you within 24 hours.
      </p>

      <!-- Message Preview -->
      <div style="background:#faf4e8;border-radius:12px;padding:20px;border-left:3px solid #c4a265;">
        <p style="color:#958779;font-size:11px;font-weight:600;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;font-family:-apple-system,sans-serif;">
          Your message:
        </p>
        <p style="color:#5a4a42;font-size:14px;line-height:1.7;margin:0;">
          ${safeMessage}
        </p>
      </div>
    </div>

    <!-- FAQ Link -->
    <div style="text-align:center;margin-bottom:24px;">
      <p style="color:#5a4a42;font-size:14px;line-height:1.7;margin:0 0 16px;">
        In the meantime, check out our <a href="https://littlesouls.app/#faq" style="color:#bf524a;text-decoration:none;font-weight:600;">FAQ section</a> for quick answers.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:20px;border-top:1px solid #e8ddd0;">
      <p style="color:#958779;font-size:13px;margin:0 0 4px;line-height:1.6;">
        With cosmic love,<br>
        <span style="color:#5a4a42;">The Little Souls family &#128156;</span>
      </p>
      <p style="color:#958779;font-size:11px;margin:8px 0 0;">
        Little Souls &middot; littlesouls.app
      </p>
    </div>

  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    if (name.length > 100 || email.length > 255 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Field length exceeded" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    // Validate email format
    if (!EMAIL_PATTERN.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    // Rate limiting check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Check IP rate limit (max 5 per hour per IP)
    const { count: ipCount } = await supabase
      .from('contact_form_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .gte('created_at', oneHourAgo);

    if (ipCount !== null && ipCount >= 5) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    // Check email rate limit (max 3 per hour per email)
    const { count: emailCount } = await supabase
      .from('contact_form_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase())
      .gte('created_at', oneHourAgo);

    if (emailCount !== null && emailCount >= 3) {
      console.log(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
      );
    }

    // Log this submission for rate limiting
    await supabase.from('contact_form_rate_limits').insert({
      ip_address: clientIP,
      email: email.toLowerCase(),
    });

    const subjectLabel = subjectLabels[subject] || subject;

    // Escape all user input before embedding in HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
    const safeSubjectLabel = escapeHtml(subjectLabel);

    // Send notification to support
    const supportEmailResponse = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: ["hello@littlesouls.app"],
      subject: `[${safeSubjectLabel}] New contact from ${safeName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Subject:</strong> ${safeSubjectLabel}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Reply directly to this email to respond to the customer.</p>
      `,
      reply_to: email,
    });

    console.log("Support email sent:", supportEmailResponse);

    // Send confirmation to customer
    const confirmationEmailResponse = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: "We received your message! ✨",
      html: getConfirmationEmailTemplate(safeName, safeSubjectLabel, safeMessage),
    });

    console.log("Confirmation email sent:", confirmationEmailResponse);

    // Trigger AI auto-reply asynchronously (don't wait for it)
    fetch(`${supabaseUrl}/functions/v1/ai-support-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ name, email, subject, message }),
    }).then(res => {
      console.log("AI support reply triggered:", res.status);
    }).catch(err => {
      console.error("AI support reply error:", err);
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send message. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
