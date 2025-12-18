import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      throw new Error("All fields are required");
    }

    if (name.length > 100 || email.length > 255 || message.length > 5000) {
      throw new Error("Field length exceeded");
    }

    const subjectLabel = subjectLabels[subject] || subject;

    // Send notification to support
    const supportEmailResponse = await resend.emails.send({
      from: "Astropaws Contact <onboarding@resend.dev>",
      to: ["support@astropaws.site"],
      subject: `[${subjectLabel}] New contact from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subjectLabel}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Reply directly to this email to respond to the customer.</p>
      `,
      reply_to: email,
    });

    console.log("Support email sent:", supportEmailResponse);

    // Send confirmation to customer
    const confirmationEmailResponse = await resend.emails.send({
      from: "Astropaws <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message! ✨",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a2e; margin-bottom: 20px;">Thank you for reaching out, ${name}! 🐾</h1>
          
          <p style="color: #333; line-height: 1.6;">
            We've received your message about <strong>${subjectLabel.toLowerCase()}</strong> and our cosmic support team will get back to you within 24 hours.
          </p>
          
          <div style="background: #f8f8fc; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;"><strong>Your message:</strong></p>
            <p style="margin: 10px 0 0; color: #333;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <p style="color: #333; line-height: 1.6;">
            In the meantime, feel free to check out our <a href="https://astropaws.site/#faq" style="color: #d4af37;">FAQ section</a> for quick answers.
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            With cosmic love,<br>
            The Astropaws Team ✨
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmailResponse);

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
