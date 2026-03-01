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

const SYSTEM_PROMPT = `You are Little Souls, the friendly AI support assistant for Little Souls (littlesouls.co) - a cosmic pet astrology service that creates personalized astrological readings for pets.

ABOUT THE SERVICE:
- Little Souls Reading ($27): Personalized astrology reading based on pet's birth date, species, and personality
- Little Souls Reading + Portrait ($35): Reading plus AI-generated artistic portrait of the pet
- The Little Souls Book ($99): Hardcover printed edition with reading + portrait + book
- Little Souls Weekly ($4.99/month, 30-day free trial): Weekly cosmic guidance delivered by email
- SoulSpeak by Little Souls: Chat with your pet's cosmic soul (15 free credits, 50 for hardcover buyers)
- Gift Certificates: Available for any tier, redeemable for readings

COMMON TOPICS & RESPONSES:

REFUNDS:
- DO NOT process refunds immediately
- Express empathy and understanding
- Ask clarifying questions about what didn't meet expectations
- Mention that our team will review their request and get back within 24-48 hours
- Never say "I'll process your refund now" - always defer to the human team
- Offer alternatives if appropriate (resend report, explain features they might have missed)

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
- Warm, friendly, professional
- Keep responses concise but helpful
- Be empathetic and solution-oriented
- If you can't fully resolve, assure them a human will follow up within 24-48 hours

IMPORTANT:
- Never make up order details or prices not listed above
- For refunds: ALWAYS say the team will review and respond within 24-48 hours
- If unsure, say "Our team will review this and get back to you shortly"`;

const FEEDBACK_REQUEST_PROMPT = `You are Little Souls, the friendly AI support assistant for Little Souls.

The customer has requested a refund for the second time. We need to understand why they want a refund so we can improve our product.

Write a warm, empathetic email that:
1. Acknowledges their continued concern and thanks them for their patience
2. Asks them to share specific feedback on what didn't meet their expectations
3. Asks what we could have done differently or how we could improve the product
4. Assures them that once we understand their concerns, we'll process their refund promptly
5. Keep it concise and genuine - not corporate sounding

The tone should be curious and caring, not defensive. We genuinely want to learn and improve.`;

const REFUND_CONFIRMATION_PROMPT = `You are Little Souls, the friendly AI support assistant for Little Souls.

The customer has responded to our feedback request about their refund. Now we need to confirm we're processing their refund.

Write a brief, warm email that:
1. Thanks them sincerely for sharing their feedback
2. Confirms their refund is being processed and they'll see it in 5-10 business days
3. Mentions we're taking their feedback to heart to improve
4. Wishes them and their pet well
5. Keep it short and genuine

Be gracious - we want them to leave with a positive feeling even if the product wasn't for them.`;

// Check if message is about refunds
function isRefundRequest(message: string, subject: string): boolean {
  const refundKeywords = ['refund', 'money back', 'cancel', 'charged', 'return', 'dispute', 'chargeback', 'want my money'];
  const lowerMessage = message.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  return refundKeywords.some(keyword => lowerMessage.includes(keyword) || lowerSubject.includes(keyword));
}

async function generateAIResponse(customerMessage: string, subject: string, name: string, systemPrompt: string): Promise<string> {
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
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Customer name: ${name}\nSubject category: ${subject}\n\nCustomer message:\n${customerMessage}\n\nPlease write a helpful, friendly response to this customer inquiry. Keep it concise (2-3 paragraphs max).` 
          }
        ],
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

function buildEmailHtml(safeName: string, safeAiResponse: string): string {
  return `
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
        💫 Our support team reviews all messages and will follow up if needed
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: #707080; font-size: 13px; margin: 0 0 8px 0;">
        You can reply to this email if you need further assistance
      </p>
      <p style="color: #505060; font-size: 12px; margin: 0;">
        Little Souls • Revealing the souls of our furry friends 🌙
      </p>
    </div>

  </div>
</body>
</html>`;
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const isRefund = isRefundRequest(message, subject);

    // Check previous contact history for this email
    const { data: previousContacts } = await supabase
      .from("contact_history")
      .select("id, is_refund_request, created_at")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(10);

    const previousRefundRequests = previousContacts?.filter(c => c.is_refund_request).length || 0;

    // Log this contact
    await supabase.from("contact_history").insert({
      email: email.toLowerCase(),
      subject,
      is_refund_request: isRefund,
    });

    console.log("[AI-SUPPORT] Contact history:", { isRefund, previousRefundRequests });

    let aiResponse = "";
    let emailSubject = "Re: Your Little Souls inquiry";

    // Determine which response flow based on refund request count
    if (isRefund && previousRefundRequests >= 2) {
      // 3rd+ refund email: Process refund confirmation
      console.log("[AI-SUPPORT] 3rd refund request - sending refund confirmation");
      aiResponse = await generateAIResponse(message, subject, name, REFUND_CONFIRMATION_PROMPT);
      emailSubject = "Your refund is being processed 💫";
      
    } else if (isRefund && previousRefundRequests === 1) {
      // 2nd refund email: Ask for feedback (scheduled for 24 hours later)
      console.log("[AI-SUPPORT] 2nd refund request - scheduling feedback request for 24 hours later");
      
      aiResponse = await generateAIResponse(message, subject, name, FEEDBACK_REQUEST_PROMPT);
      
      if (!aiResponse) {
        return new Response(JSON.stringify({ success: false, reason: "No AI response" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sendAt = new Date();
      sendAt.setHours(sendAt.getHours() + 24);

      await supabase.from("scheduled_emails").insert({
        email,
        name,
        subject: "We'd love to understand your experience 🐾",
        original_message: message,
        ai_response: aiResponse,
        send_at: sendAt.toISOString(),
      });

      console.log("[AI-SUPPORT] Feedback request email scheduled for:", sendAt.toISOString());

      return new Response(JSON.stringify({ 
        success: true, 
        scheduled: true,
        type: "feedback_request",
        send_at: sendAt.toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
      
    } else {
      // 1st email (refund or non-refund): Standard response
      aiResponse = await generateAIResponse(message, subject, name, SYSTEM_PROMPT);
    }

    if (!aiResponse) {
      console.log("[AI-SUPPORT] No AI response generated, skipping auto-reply");
      return new Response(JSON.stringify({ success: false, reason: "No AI response" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For first-time refund requests, add a small delay
    if (isRefund && previousRefundRequests === 0) {
      console.log("[AI-SUPPORT] First refund request, adding 30-60 second delay");
      await new Promise(resolve => setTimeout(resolve, 30000 + Math.random() * 30000));
    }

    // Send the email
    const safeAiResponse = escapeHtml(aiResponse).replace(/\n/g, '<br>');
    const safeName = escapeHtml(name);

    const emailResponse = await resend.emails.send({
      from: "Little Souls <hello@littlesouls.co>",
      to: [email],
      subject: emailSubject,
      html: buildEmailHtml(safeName, safeAiResponse),
      reply_to: "hello@littlesouls.co",
    });

    console.log("[AI-SUPPORT] Auto-reply sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      type: isRefund && previousRefundRequests >= 2 ? "refund_confirmation" : "standard"
    }), {
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
