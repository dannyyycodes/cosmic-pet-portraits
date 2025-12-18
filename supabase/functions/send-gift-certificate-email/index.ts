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
    const purchaserEmailResponse = await resend.emails.send({
      from: "Furreal Paws <onboarding@resend.dev>",
      to: [giftCert.purchaser_email],
      subject: "Your Gift Certificate Purchase Confirmation",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #e0e0e0; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #c4a7e7; margin: 0; font-size: 28px; }
            .stars { font-size: 24px; margin: 10px 0; }
            .gift-code { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
            .gift-code h2 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; opacity: 0.8; }
            .gift-code .code { font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: monospace; }
            .amount { font-size: 24px; color: #c4a7e7; text-align: center; margin: 20px 0; }
            .details { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; opacity: 0.7; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="stars">✨🌟✨</div>
              <h1>Gift Certificate Confirmed!</h1>
            </div>
            
            <p>Thank you for your purchase! Here are the details of your cosmic gift:</p>
            
            <div class="gift-code">
              <h2>Gift Code</h2>
              <div class="code">${giftCert.code}</div>
            </div>
            
            <div class="amount">$${amountFormatted} Gift Certificate</div>
            
            <div class="details">
              <p><strong>Recipient:</strong> ${recipientName}</p>
              ${giftCert.recipient_email ? `<p><strong>Recipient Email:</strong> ${giftCert.recipient_email}</p>` : ''}
              <p><strong>Your Message:</strong> "${giftMessage}"</p>
            </div>
            
            ${giftCert.recipient_email ? '<p>We\'ve sent an email to the recipient with their gift code.</p>' : '<p>Share this code with your gift recipient so they can redeem their cosmic pet reading!</p>'}
            
            <div class="footer">
              <p>Thank you for spreading cosmic joy! 🐾✨</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[SEND-GIFT-EMAIL] Purchaser email sent");

    // If there's a recipient email, send them the gift notification
    if (giftCert.recipient_email) {
      const recipientEmailResponse = await resend.emails.send({
        from: "Furreal Paws <onboarding@resend.dev>",
        to: [giftCert.recipient_email],
        subject: `${recipientName}, You've Received a Cosmic Gift! 🌟`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #e0e0e0; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #c4a7e7; margin: 0; font-size: 28px; }
              .stars { font-size: 32px; margin: 10px 0; }
              .message-box { background: rgba(196, 167, 231, 0.1); border-left: 4px solid #c4a7e7; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; font-style: italic; }
              .gift-code { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
              .gift-code h2 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; opacity: 0.8; }
              .gift-code .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; font-family: monospace; }
              .amount { font-size: 28px; color: #c4a7e7; text-align: center; margin: 25px 0; }
              .cta { text-align: center; margin: 30px 0; }
              .cta a { display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 16px; }
              .footer { text-align: center; margin-top: 30px; opacity: 0.7; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="stars">🎁✨🌟✨🎁</div>
                <h1>You've Received a Cosmic Gift!</h1>
              </div>
              
              <p>Hello ${recipientName}!</p>
              
              <p>Someone special has gifted you a Pet Astrology reading - a cosmic journey to discover your pet's celestial personality!</p>
              
              <div class="message-box">
                <p>"${giftMessage}"</p>
              </div>
              
              <div class="gift-code">
                <h2>Your Gift Code</h2>
                <div class="code">${giftCert.code}</div>
              </div>
              
              <div class="amount">$${amountFormatted} Value</div>
              
              <p>Use this code at checkout to unlock your pet's cosmic reading. Discover their zodiac traits, personality insights, and celestial compatibility!</p>
              
              <div class="footer">
                <p>May the stars guide your pet's journey! 🐾🌙</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("[SEND-GIFT-EMAIL] Recipient email sent");
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
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
