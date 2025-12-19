import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// HTML escape function
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const SYSTEM_PROMPT = `You are AstroPaws, the friendly AI support assistant for AstroPets (astropets.cloud) - a cosmic pet astrology service that creates personalized astrological readings for pets.

ABOUT THE SERVICE:
- Cosmic Pet Report ($9.97): Personalized astrology reading based on pet's birth date, species, and personality
- Weekly Horoscope Subscription ($2.99/month): Weekly cosmic guidance delivered by email
- AI Cosmic Portrait ($7.99): AI-generated artistic portrait of the pet
- VIP Package ($16.97): Includes report + portrait + subscription
- Gift Certificates: Available for any amount, redeemable for readings

COMMON TOPICS & RESPONSES:

REFUNDS:
- We offer refunds within 7 days if unsatisfied
- Ask them to reply with their order email and we'll process it
- Be empathetic and understanding

REPORT ISSUES:
- Reports are delivered immediately after payment via email
- Check spam/promotions folders
- Reports can be accessed anytime via the link in the email
- If not received, we can resend it

GIFT CERTIFICATES:
- Gift codes are sent via email immediately after purchase
- Codes never expire
- Can be redeemed at checkout or via the gift link

AFFILIATE PROGRAM:
- 20% commission on referred sales
- Application process through the website
- Monthly payouts via Stripe

TONE & STYLE:
- Warm, friendly, and cosmic-themed 🌟
- Use occasional pet and astrology references
- Keep responses concise but helpful
- Sign off with a cosmic flourish
- Be empathetic and solution-oriented
- If you can't fully resolve, assure them a human will follow up within 24 hours

IMPORTANT:
- Never make up order details or prices not listed above
- If unsure, say "Our cosmic team will review this and get back to you shortly"
- Always be helpful and positive`;

async function generateAIResponse(customerMessage: string, subject: string, name: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.error("[AI-SUPPORT] No LOVABLE_API_KEY configured");
    return "";
  }

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { 
            role: "user", 
            content: `Customer name: ${name}\nSubject category: ${subject}\n\nCustomer message:\n${customerMessage}\n\nPlease write a helpful, friendly response to this customer inquiry. Keep it concise (2-3 paragraphs max).` 
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-SUPPORT] AI API error:", response.status, errorText);
      return "";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("[AI-SUPPORT] Error generating AI response:", error);
    return "";
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { name, email, subject, message }: SupportRequest = await req.json();

    console.log("[AI-SUPPORT] Processing support request from:", email);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, subject, name);

    if (!aiResponse) {
      console.log("[AI-SUPPORT] No AI response generated, skipping auto-reply");
      return new Response(JSON.stringify({ success: false, reason: "No AI response" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Escape for HTML email
    const safeAiResponse = escapeHtml(aiResponse).replace(/\n/g, '<br>');
    const safeName = escapeHtml(name);

    // Send AI auto-reply to customer
    const emailResponse = await resend.emails.send({
      from: "AstroPaws Support <support@astropets.cloud>",
      to: [email],
      subject: "Re: Your AstroPets inquiry ✨",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 40px; margin-bottom: 12px;">🐾✨</div>
      <h1 style="color: #f5deb3; font-size: 24px; margin: 0; font-weight: 600;">
        Hello ${safeName}!
      </h1>
    </div>

    <!-- AI Response Card -->
    <div style="background: rgba(255,255,255,0.05); border-radius: 20px; padding: 28px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.7; margin: 0;">
        ${safeAiResponse}
      </p>
    </div>

    <!-- Human Follow-up Note -->
    <div style="background: rgba(212, 175, 55, 0.1); border-radius: 12px; padding: 16px; border: 1px solid rgba(212, 175, 55, 0.2); margin-bottom: 24px;">
      <p style="color: #d4af37; font-size: 13px; margin: 0; text-align: center;">
        💫 Our cosmic support team reviews all messages and will follow up if needed within 24 hours
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: #707080; font-size: 13px; margin: 0 0 8px 0;">
        You can reply to this email if you need further assistance
      </p>
      <p style="color: #505060; font-size: 12px; margin: 0;">
        AstroPets • Revealing the souls of our furry friends 🌙
      </p>
    </div>

  </div>
</body>
</html>
      `,
      reply_to: "support@astropets.cloud",
    });

    console.log("[AI-SUPPORT] Auto-reply sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[AI-SUPPORT] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
