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
<body style="margin: 0; padding: 0; background-color: #faf6f1; font-family: Georgia, 'Times New Roman', serif;">

  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 24px; margin: 0 0 6px 0;">🐾</p>
      <p style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 36px 28px; text-align: center;">

      <p style="font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Your Gift is Ready
      </p>

      <h1 style="color: #3d2f2a; font-size: 24px; font-weight: 400; margin: 0 0 20px 0; line-height: 1.4;">
        What a beautiful thing you've done.
      </h1>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        You're giving ${recipientName} something they'll want to keep forever — a full soul portrait of their pet, written in the stars.
      </p>

      <!-- Gift Code -->
      <div style="background: #faf6f1; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
        <p style="color: #c4a265; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Gift Code
        </p>
        <p style="color: #3d2f2a; font-size: 26px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace;">
          ${giftCode}
        </p>
      </div>

      <!-- Gift Details -->
      <div style="text-align: left; border-left: 3px solid #e8ddd0; padding-left: 16px; margin: 0 0 24px 0;">
        <p style="color: #3d2f2a; font-size: 14px; margin: 0 0 4px 0;">
          <strong>To:</strong> ${recipientName}
        </p>
        ${recipientEmail ? `<p style="color: #7a6a60; font-size: 13px; margin: 0 0 8px 0;">${recipientEmail}</p>` : ''}
        <p style="color: #5a4a42; font-size: 14px; font-style: italic; margin: 0;">
          "${giftMessage}"
        </p>
      </div>

      <p style="color: #7a6a60; font-size: 13px; line-height: 1.6; margin: 0;">
        ${recipientEmail ? "We've already sent the code to them with a lovely note." : "Share this code with them whenever you're ready. They'll use it at littlesouls.app/redeem."}
      </p>

    </div>

    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #d4c8bc; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

  </div>

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
<body style="margin: 0; padding: 0; background-color: #faf6f1; font-family: Georgia, 'Times New Roman', serif;">

  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 24px; margin: 0 0 6px 0;">🐾</p>
      <p style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 36px 28px; text-align: center;">

      <h1 style="color: #3d2f2a; font-size: 26px; font-weight: 400; margin: 0 0 8px 0; line-height: 1.3;">
        Hi ${recipientName},
      </h1>

      <p style="color: #5a4a42; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0;">
        Someone who loves you just gave you something truly special.
      </p>

      <!-- Gift Message -->
      <div style="text-align: left; border-left: 3px solid #c4a265; padding: 16px 20px; margin: 0 0 28px 0; background: #faf6f1; border-radius: 0 12px 12px 0;">
        <p style="color: #3d2f2a; font-size: 15px; font-style: italic; margin: 0; line-height: 1.7;">
          "${giftMessage}"
        </p>
      </div>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 24px 0;">
        They've gifted you a <strong>Cosmic Soul Reading</strong> for your pet — a personalised portrait of who your pet really is, written in the stars. Their personality, their quirks, the way they love you, and the cosmic reason they chose <em>you</em>.
      </p>

      <!-- Gift Code -->
      <div style="background: #faf6f1; border-radius: 12px; padding: 24px; margin: 0 0 28px 0;">
        <p style="color: #c4a265; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Your Gift Code
        </p>
        <p style="color: #3d2f2a; font-size: 26px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace;">
          ${giftCode}
        </p>
      </div>

      <div style="margin: 28px 0;">
        <a href="https://littlesouls.app/redeem?code=${giftCode}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 16px 44px; border-radius: 50px; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Redeem Your Gift
        </a>
      </div>

      <p style="color: #b8a99e; font-size: 13px; line-height: 1.6; margin: 0;">
        It only takes a few minutes. All you need is your pet's name and birthday.
      </p>

    </div>

    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #d4c8bc; font-size: 11px; margin: 0; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

  </div>

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
      from: "Little Souls <hello@littlesouls.app>",
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
        from: "Little Souls <hello@littlesouls.app>",
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
