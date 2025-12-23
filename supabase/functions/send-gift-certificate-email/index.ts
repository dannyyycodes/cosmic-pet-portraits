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

const getPurchaserEmailTemplate = (recipientName: string, giftCode: string, giftMessage: string, recipientEmail?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Outer container with gradient border -->
  <div style="max-width: 600px; margin: 0 auto; padding: 2px; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f59e0b 100%); border-radius: 20px;">
    
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 18px; padding: 48px 32px;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.2) 100%); border-radius: 50px; border: 1px solid rgba(16, 185, 129, 0.3);">
          <span style="font-size: 24px;">🎁✨</span>
        </div>
      </div>

      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">
        Your Gift is Ready to Share
      </h1>
      
      <p style="color: #9ca3af; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
        Here's the gift code for ${recipientName}:
      </p>

      <!-- Gift Code Card -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); border-radius: 16px; padding: 28px; text-align: center; margin: 0 0 28px 0; box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);">
        <p style="color: rgba(255,255,255,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; font-weight: 600;">
          Gift Code
        </p>
        <p style="color: white; font-size: 28px; font-weight: 800; letter-spacing: 4px; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 0; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
          ${giftCode}
        </p>
      </div>

      <!-- Gift Details -->
      <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; margin: 0 0 28px 0; border: 1px solid rgba(255,255,255,0.06);">
        <p style="color: #d1d5db; font-size: 14px; margin: 0 0 8px 0;">
          <strong style="color: #ffffff;">To:</strong> ${recipientName}
        </p>
        ${recipientEmail ? `<p style="color: #9ca3af; font-size: 13px; margin: 0 0 12px 0;">${recipientEmail}</p>` : ''}
        <p style="color: #a78bfa; font-size: 14px; font-style: italic; margin: 0; padding-left: 12px; border-left: 3px solid #8b5cf6;">
          "${giftMessage}"
        </p>
      </div>

      <p style="color: #6b7280; font-size: 13px; margin: 0; text-align: center; line-height: 1.6;">
        ${recipientEmail ? "We've sent the code to them directly." : "Share this code with your recipient so they can redeem their reading."}
      </p>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%); margin: 36px 0;"></div>

      <!-- Footer -->
      <div style="text-align: center;">
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

const getRecipientEmailTemplate = (recipientName: string, giftCode: string, giftMessage: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #030014; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Outer container with celebratory gradient border -->
  <div style="max-width: 600px; margin: 0 auto; padding: 3px; background: linear-gradient(135deg, #f59e0b 0%, #d946ef 25%, #8b5cf6 50%, #6366f1 75%, #f59e0b 100%); border-radius: 20px;">
    
    <div style="background: linear-gradient(180deg, #0a0a1a 0%, #111827 100%); border-radius: 17px; padding: 48px 32px;">
      
      <!-- Celebration Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <span style="font-size: 48px;">🎁</span>
      </div>

      <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">
        Hi ${recipientName}!
      </h1>
      
      <p style="color: #9ca3af; font-size: 18px; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
        Someone special has gifted you a <span style="color: #a78bfa; font-weight: 600;">Cosmic Pet Reading</span>
      </p>

      <!-- Gift Message -->
      <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%); border-left: 4px solid #8b5cf6; padding: 20px 24px; margin: 0 0 32px 0; border-radius: 0 12px 12px 0;">
        <p style="color: #e5e7eb; font-size: 16px; font-style: italic; margin: 0; line-height: 1.6;">
          "${giftMessage}"
        </p>
      </div>

      <!-- Gift Code Card -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); border-radius: 16px; padding: 28px; text-align: center; margin: 0 0 32px 0; box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);">
        <p style="color: rgba(255,255,255,0.7); font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0; font-weight: 600;">
          Your Gift Code
        </p>
        <p style="color: white; font-size: 28px; font-weight: 800; letter-spacing: 4px; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 0; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
          ${giftCode}
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
        Discover your pet's personality, cosmic energy, and what makes your bond so special.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 36px 0;">
        <a href="https://astropets.cloud/redeem?code=${giftCode}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f59e0b 100%); color: white; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset;">
          Redeem Your Gift →
        </a>
      </div>

      <!-- Divider -->
      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%); margin: 36px 0;"></div>

      <!-- Footer -->
      <div style="text-align: center;">
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

    const recipientName = giftCert.recipient_name || "Friend";
    const giftMessage = giftCert.gift_message || "Enjoy your cosmic pet reading!";

    // Send email to purchaser (confirmation)
    const purchaserEmailResult = await resend.emails.send({
      from: "AstroPets <hello@astropets.cloud>",
      to: [giftCert.purchaser_email],
      subject: "🎁 Your Gift Certificate is Ready",
      html: getPurchaserEmailTemplate(recipientName, giftCert.code, giftMessage, giftCert.recipient_email),
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
        subject: `🎁 ${recipientName}, you've received a special gift!`,
        html: getRecipientEmailTemplate(recipientName, giftCert.code, giftMessage),
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
