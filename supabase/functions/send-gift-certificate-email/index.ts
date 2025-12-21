import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftCertificateEmailRequest {
  giftCertificateId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Require service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
    console.error("[SEND-GIFT-EMAIL] Unauthorized request - missing or invalid authorization");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { giftCertificateId }: GiftCertificateEmailRequest = await req.json();
    
    console.log("[SEND-GIFT-EMAIL] Processing gift certificate:", giftCertificateId?.substring(0, 8));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the gift certificate details
    const { data: giftCert, error: fetchError } = await supabase
      .from("gift_certificates")
      .select("*")
      .eq("id", giftCertificateId)
      .single();

    if (fetchError || !giftCert) {
      console.error("[SEND-GIFT-EMAIL] Gift certificate not found");
      return new Response(JSON.stringify({ error: "Resource not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const amountFormatted = (giftCert.amount_cents / 100).toFixed(2);
    const recipientName = giftCert.recipient_name || "Friend";
    const giftMessage = giftCert.gift_message || "Enjoy your cosmic pet reading!";

    // Send email to purchaser (confirmation)
    const purchaserEmailResult = await resend.emails.send({
      from: "AstroPets <hello@astropets.cloud>",
      to: [giftCert.purchaser_email],
      subject: "Your Gift Certificate is Ready",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
    
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 24px 0; text-align: center;">
      Thanks for your purchase
    </h1>
    
    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0; text-align: center;">
      Here's the gift code for ${recipientName}:
    </p>

    <div style="background: linear-gradient(135deg, #6b4fa0 0%, #8b5cf6 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
      <p style="color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
        Gift Code
      </p>
      <p style="color: white; font-size: 24px; font-weight: 700; letter-spacing: 2px; font-family: monospace; margin: 0;">
        ${giftCert.code}
      </p>
    </div>

    <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
      <p style="color: #e0e0e0; font-size: 14px; margin: 0 0 8px 0;">
        <strong>To:</strong> ${recipientName}
      </p>
      ${giftCert.recipient_email ? `<p style="color: #a0a0b0; font-size: 14px; margin: 0 0 12px 0;">${giftCert.recipient_email}</p>` : ''}
      <p style="color: #a0a0b0; font-size: 14px; font-style: italic; margin: 0;">
        "${giftMessage}"
      </p>
    </div>

    <p style="color: #707080; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
      ${giftCert.recipient_email ? "We've sent the code to them directly." : "Share this code with your recipient so they can redeem their reading."}
    </p>

    <div style="border-top: 1px solid rgba(255,255,255,0.08); margin-top: 40px; padding-top: 24px; text-align: center;">
      <p style="color: #505060; font-size: 12px; margin: 0;">
        AstroPets
      </p>
    </div>

  </div>
</body>
</html>
      `,
    });

    const purchaserResendError = (purchaserEmailResult as any)?.error;
    if (purchaserResendError) {
      console.error("[SEND-GIFT-EMAIL] Purchaser email provider error:", purchaserResendError);
      return new Response(JSON.stringify({ error: "Email delivery failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[SEND-GIFT-EMAIL] Purchaser email accepted by provider", {
      to: giftCert.purchaser_email,
      id: (purchaserEmailResult as any)?.id,
    });

    // If there's a recipient email, send them the gift notification
    if (giftCert.recipient_email) {
      const recipientEmailResult = await resend.emails.send({
        from: "AstroPets <hello@astropets.cloud>",
        to: [giftCert.recipient_email],
        subject: `${recipientName}, you've received a gift`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
    
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
      Hi ${recipientName},
    </h1>
    
    <p style="color: #a0a0b0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Someone gifted you a personalized pet astrology reading.
    </p>

    <div style="background: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; padding: 16px 20px; margin: 0 0 32px 0; border-radius: 0 8px 8px 0;">
      <p style="color: #e0e0e0; font-size: 15px; font-style: italic; margin: 0; line-height: 1.5;">
        "${giftMessage}"
      </p>
    </div>

    <div style="background: linear-gradient(135deg, #6b4fa0 0%, #8b5cf6 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 32px 0;">
      <p style="color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
        Your Gift Code
      </p>
      <p style="color: white; font-size: 24px; font-weight: 700; letter-spacing: 2px; font-family: monospace; margin: 0;">
        ${giftCert.code}
      </p>
    </div>

    <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
      Use this code to get a detailed reading about your pet's personality, how they show love, and tips for a stronger bond.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://astropets.cloud/redeem?code=${giftCert.code}" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49a6c 100%); color: #1a1a2e; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 15px;">
        Redeem Your Gift
      </a>
    </div>

    <div style="border-top: 1px solid rgba(255,255,255,0.08); margin-top: 40px; padding-top: 24px; text-align: center;">
      <p style="color: #505060; font-size: 12px; margin: 0;">
        AstroPets
      </p>
    </div>

  </div>
</body>
</html>
        `,
      });

      const recipientResendError = (recipientEmailResult as any)?.error;
      if (recipientResendError) {
        console.error("[SEND-GIFT-EMAIL] Recipient email provider error:", recipientResendError);
        // Purchaser email already sent; don't fail the whole request.
      } else {
        console.log("[SEND-GIFT-EMAIL] Recipient email accepted by provider", {
          to: giftCert.recipient_email,
          id: (recipientEmailResult as any)?.id,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[SEND-GIFT-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: "Service unavailable" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
