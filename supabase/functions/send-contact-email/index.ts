import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

// Email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getConfirmationEmailTemplate = (safeName: string, safeSubjectLabel: string, safeMessage: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Outer container with gradient border -->
  <div style="max-width: 600px; margin: 0 auto; padding: 2px; background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%); border-radius: 20px;">
    
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 18px; padding: 48px 32px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%); border-radius: 50px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <span style="font-size: 24px;">✉️✨</span>
        </div>
      </div>

      <!-- Status Badge -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 6px 16px; border-radius: 50px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
          ● Message Received
        </span>
      </div>

      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">
        Thank you, ${safeName}! 🐾
      </h1>
      
      <p style="color: #9ca3af; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
        We've received your message about <span style="color: #34d399; font-weight: 600;">${safeSubjectLabel.toLowerCase()}</span> and our cosmic support team will get back to you within 24 hours.
      </p>

      <!-- Message Preview Card -->
      <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 24px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 28px;">
        <p style="color: #9ca3af; font-size: 12px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">
          Your message:
        </p>
        <p style="color: #d1d5db; font-size: 14px; line-height: 1.7; margin: 0;">
          ${safeMessage}
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
        In the meantime, check out our <a href="https://astropets.cloud/#faq" style="color: #34d399; text-decoration: none; font-weight: 600;">FAQ section</a> for quick answers.
      </p>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.3) 50%, transparent 100%); margin: 32px 0;"></div>

      <!-- Footer -->
      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
        With cosmic love,<br>
        <span style="color: #9ca3af;">The AstroPets Team ✨</span>
      </p>

      <!-- Brand Footer -->
      <div style="text-align: center; margin-top: 24px;">
        <p style="color: #4b5563; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">
          AstroPets
        </p>
      </div>

    </div>
  </div>
  
  <div style="height: 20px;"></div>
  
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (name.length > 100 || email.length > 255 || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Field length exceeded" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    if (!EMAIL_PATTERN.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
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
      from: "AstroPets <hello@astropets.cloud>",
      to: ["hello@astropets.cloud"],
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
      from: "AstroPets <hello@astropets.cloud>",
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
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send message. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
