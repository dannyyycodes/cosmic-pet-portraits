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
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a2e; margin-bottom: 20px;">Thank you for reaching out, ${safeName}! 🐾</h1>
          
          <p style="color: #333; line-height: 1.6;">
            We've received your message about <strong>${safeSubjectLabel.toLowerCase()}</strong> and our cosmic support team will get back to you within 24 hours.
          </p>
          
          <div style="background: #f8f8fc; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;"><strong>Your message:</strong></p>
            <p style="margin: 10px 0 0; color: #333;">${safeMessage}</p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">
            In the meantime, feel free to check out our <a href="https://astropets.cloud/#faq" style="color: #d4af37;">FAQ section</a> for quick answers.
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            With cosmic love,<br>
            The AstroPets Team ✨
          </p>
        </div>
      `,
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
