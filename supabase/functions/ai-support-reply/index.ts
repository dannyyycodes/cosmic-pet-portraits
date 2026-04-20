import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

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

const SYSTEM_PROMPT = `You are Little Souls, the warm and caring AI support assistant for Little Souls (littlesouls.app) — a cosmic pet astrology service that creates deeply personal readings for pets.

ABOUT THE SERVICE:
- The Little Souls Reading ($29): A 30+ section personalised cosmic reading for any pet, based on their birth date, name, photo, and personality. Delivered as an interactive web experience via email link, ready within 5–10 minutes.
- Soul Bond Edition ($49): Reading plus an AI-generated artistic portrait of the pet.
- SoulSpeak: After receiving their reading, customers can chat with their pet's cosmic soul. Included with every reading.
- Gift Certificates: Available and redeemable at checkout.
- Affiliate program: 50% commission on referred sales.
- We do readings for any animal — dogs, cats, rabbits, horses, birds, reptiles, fish, and more.
- Memorial readings: Available for any pet who has passed on. Written with grief awareness. Never use phrases like "rainbow bridge", "crossed over", "watching over you", "in a better place", or "paw prints on your heart" — speak plainly.

COMMON TOPICS & RESPONSES:

REPORT NOT RECEIVED / DELIVERY ISSUES:
- The reading is delivered as an interactive web experience — NOT a PDF or download.
- Customers receive an email with a link to view their reading online.
- Check spam/promotions folders first.
- The link is permanent — they can access it any time from the email.
- If they truly haven't received it, tell them to reply and we will personally resend the link within a few hours.
- Never say "your PDF" — it is an online experience accessed via link.

REFUNDS:
- Refund policy: within 7 days of purchase, digital products only. Physical products (when available) are non-refundable.
- DO NOT process refunds immediately or promise one.
- Express genuine empathy and warmth first.
- Ask what didn't feel right — often it's a misunderstanding we can fix.
- Tell them our team will personally review and respond within 24 hours.
- Never say "I'll process your refund now" — always defer to the human team.
- If the purchase is older than 7 days, politely explain the 7-day refund window.
- Direct refund requests to the dedicated refund form on the website (not the general contact form).

GIFT CERTIFICATES:
- Gift codes sent via email immediately after purchase.
- Codes never expire.
- Redeemable at checkout.

TONE & STYLE:
- Warm, heartfelt, and human — this is an emotionally meaningful product.
- Keep responses concise but never cold.
- Always acknowledge the pet by name if mentioned.
- If you can't fully resolve, assure them a real person will follow up within 24 hours.

IMPORTANT:
- Never invent order details, report contents, or prices not listed above.
- Never say "PDF" — the reading is an interactive web experience.
- For refunds: always say the team will personally review within 24 hours.
- If unsure about anything, say "Our team will look into this and get back to you shortly."`;

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

The customer has responded to our feedback request about their refund. Their request is now being reviewed by our team.

Write a brief, warm email that:
1. Thanks them sincerely for sharing their feedback
2. Confirms their refund request has been forwarded to our team for review
3. Let them know they'll hear back within 24-48 hours
4. Mentions we're taking their feedback to heart to improve
5. Keep it short and genuine

Do NOT confirm the refund is processed — it still needs manual approval. Just reassure them it's being reviewed.`;

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
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:36px;margin-bottom:12px;">\u{1F43E}\u2728</div>
      <h1 style="color:#141210;font-size:22px;margin:0;font-weight:600;">
        Hello ${safeName}!
      </h1>
    </div>

    <!-- AI Response Card -->
    <div style="background:#ffffff;border-radius:16px;padding:28px;border:1px solid #e8ddd0;margin-bottom:24px;">
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0;">
        ${safeAiResponse}
      </p>
    </div>

    <!-- Human Follow-up Note -->
    <div style="background:#faf4e8;border-radius:12px;padding:16px;border:1px solid #e8ddd0;margin-bottom:24px;">
      <p style="color:#c4a265;font-size:13px;margin:0;text-align:center;">
        \u{1F4AB} Our support team reviews all messages and will follow up if needed
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:20px;border-top:1px solid #e8ddd0;">
      <p style="color:#958779;font-size:13px;margin:0 0 8px;">
        You can reply to this email if you need further assistance
      </p>
      <p style="color:#958779;font-size:12px;margin:0;">
        Little Souls \u00B7 Revealing the souls of our furry friends \u{1F319}
      </p>
    </div>

  </div>
</body>
</html>`;
}

// Refund-link secret. Read from env so it can be rotated without a deploy and
// is not visible in this public repo. Falls back to a value that can never
// match a URL param, so an unset env var fails closed instead of allowing
// every link through.
function getRefundSecret(): string {
  const fromEnv = Deno.env.get("REFUND_LINK_SECRET")?.trim();
  return fromEnv && fromEnv.length >= 32 ? fromEnv : "__refund_secret_not_configured__";
}

// Constant-time string compare so we don't leak the secret length / prefix
// to a network observer through response timing differences.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handleRefundAction(url: URL): Promise<Response> {
  const action = url.searchParams.get("action");
  const email = url.searchParams.get("email") || "";
  const name = url.searchParams.get("name") || "";
  const secret = url.searchParams.get("secret") || "";

  if (!timingSafeEqual(secret, getRefundSecret())) {
    return new Response("<html><body style='font-family:Georgia,serif;background:#FFFDF5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;'><div style='text-align:center;'><h1 style='color:#bf524a;'>Unauthorized</h1><p style='color:#5a4a42;'>Invalid approval link.</p></div></body></html>", { status: 401, headers: { "Content-Type": "text/html" } });
  }

  const resendInstance = new Resend(Deno.env.get("RESEND_API_KEY"));

  if (action === "approve_refund") {
    await resendInstance.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: "Your refund has been approved \u{1F49C}",
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">\u{1F43E}\u2728</div>
      <h1 style="color:#141210;font-size:22px;margin:0;">Your Refund Has Been Approved</h1>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e8ddd0;">
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0 0 12px;">Thank you for your patience. Your refund has been approved and is being processed. You should see it reflected in your account within 5\u201310 business days.</p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0 0 12px;">We truly appreciate the feedback you shared \u2014 it helps us make Little Souls better for every pet and their human.</p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0;">With love and gratitude,<br>The Little Souls family \u{1F49C}</p>
    </div>
    <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e8ddd0;">
      <p style="color:#958779;font-size:11px;margin:0;">Little Souls \u00B7 littlesouls.app</p>
    </div>
  </div>
</body></html>`,
    });

    return new Response(`
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;display:flex;align-items:center;justify-content:center;height:100vh;">
  <div style="text-align:center;max-width:500px;padding:40px;">
    <div style="font-size:48px;margin-bottom:16px;">\u2705</div>
    <h1 style="color:#141210;font-size:24px;margin:0 0 12px;">Refund Approved</h1>
    <p style="color:#5a4a42;font-size:16px;line-height:1.6;">${escapeHtml(name)} (${escapeHtml(email)}) has been notified that their refund is being processed.</p>
    <p style="color:#958779;font-size:13px;margin-top:16px;">Remember to process the refund in Stripe.</p>
  </div>
</body></html>`, { headers: { "Content-Type": "text/html" } });

  } else if (action === "deny_refund") {
    await resendInstance.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: "Regarding your refund request",
      html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">\u{1F43E}</div>
      <h1 style="color:#141210;font-size:22px;margin:0;">A Note About Your Request</h1>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e8ddd0;">
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0 0 12px;">Thank you for reaching out. After reviewing your request, we're unable to process a refund at this time. Our refund policy covers digital products within 7 days of purchase.</p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0 0 12px;">If you have questions about your reading or need help accessing it, we're here to help \u2014 just reply to this email.</p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.7;margin:0;">With warmth,<br>The Little Souls family \u{1F49C}</p>
    </div>
    <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e8ddd0;">
      <p style="color:#958779;font-size:11px;margin:0;">Little Souls \u00B7 littlesouls.app</p>
    </div>
  </div>
</body></html>`,
    });

    return new Response(`
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;display:flex;align-items:center;justify-content:center;height:100vh;">
  <div style="text-align:center;max-width:500px;padding:40px;">
    <div style="font-size:48px;margin-bottom:16px;">\u274C</div>
    <h1 style="color:#141210;font-size:24px;margin:0 0 12px;">Refund Denied</h1>
    <p style="color:#5a4a42;font-size:16px;line-height:1.6;">${escapeHtml(name)} (${escapeHtml(email)}) has been notified with a polite explanation.</p>
  </div>
</body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  return new Response("Unknown action", { status: 400 });
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  // Handle GET requests for refund approve/deny actions
  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("action")) {
      return handleRefundAction(url);
    }
    return new Response("Not found", { status: 404 });
  }

  // Require service role authorization for POST requests
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
      // 3rd+ refund email: Send customer acknowledgement + notify owner for manual approval
      console.log("[AI-SUPPORT] 3rd refund request - sending to owner for manual approval");
      aiResponse = await generateAIResponse(message, subject, name, REFUND_CONFIRMATION_PROMPT);
      emailSubject = "Your refund request is being reviewed 💫";

      // Send manual approval notification to owner
      try {
        const refundSecret = getRefundSecret();
        const approveUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-support-reply?action=approve_refund&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&secret=${encodeURIComponent(refundSecret)}`;
        const denyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-support-reply?action=deny_refund&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&secret=${encodeURIComponent(refundSecret)}`;

        await resend.emails.send({
          from: "Little Souls <noreply@littlesouls.app>",
          to: ["littlesouls.app@protonmail.com"],
          subject: `\u26A0\uFE0F Refund Approval Needed \u2014 ${name} (${email})`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:32px;margin-bottom:8px;">\u{1F43E}</div>
      <h1 style="color:#141210;font-size:22px;margin:0;font-weight:600;">Refund Approval Required</h1>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e8ddd0;margin-bottom:20px;">
      <p style="color:#5a4a42;font-size:14px;margin:0 0 8px;"><strong style="color:#141210;">Customer:</strong> ${escapeHtml(name)}</p>
      <p style="color:#5a4a42;font-size:14px;margin:0 0 16px;"><strong style="color:#141210;">Email:</strong> ${escapeHtml(email)}</p>
      <div style="background:#faf4e8;border-radius:10px;padding:16px;border-left:3px solid #c4a265;">
        <p style="color:#5a4a42;font-size:14px;line-height:1.6;margin:0;">${escapeHtml(message)}</p>
      </div>
      <p style="color:#958779;font-size:12px;margin:16px 0 0;">Previous refund requests: ${previousRefundRequests + 1}</p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="${approveUrl}" style="background:#c4a265;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;margin-right:12px;display:inline-block;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;">\u2705 Approve Refund</a>
      <a href="${denyUrl}" style="background:#bf524a;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;display:inline-block;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;">\u274C Deny Refund</a>
    </div>
    <p style="color:#958779;font-size:11px;text-align:center;margin-top:20px;">Click one button. The customer will be notified automatically.</p>
    <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e8ddd0;">
      <p style="color:#958779;font-size:11px;margin:0;">Little Souls \u00B7 Refund Management</p>
    </div>
  </div>
</body>
</html>`,
        });
        console.log("[AI-SUPPORT] Manual approval email sent to owner");
      } catch (approvalErr) {
        console.error("[AI-SUPPORT] Failed to send approval email:", approvalErr);
      }
      
    } else if (isRefund && previousRefundRequests === 1) {
      // 2nd refund email: Ask for feedback (scheduled for 24 hours later)
      console.log("[AI-SUPPORT] 2nd refund request - scheduling feedback request for 24 hours later");
      
      aiResponse = await generateAIResponse(message, subject, name, FEEDBACK_REQUEST_PROMPT);
      
      if (!aiResponse) {
        return new Response(JSON.stringify({ success: false, reason: "No AI response" }), {
          status: 200,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
      
    } else {
      // 1st email (refund or non-refund): Standard response
      aiResponse = await generateAIResponse(message, subject, name, SYSTEM_PROMPT);
    }

    if (!aiResponse) {
      console.log("[AI-SUPPORT] No AI response generated, skipping auto-reply");
      return new Response(JSON.stringify({ success: false, reason: "No AI response" }), {
        status: 200,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: emailSubject,
      html: buildEmailHtml(safeName, safeAiResponse),
      reply_to: "hello@littlesouls.app",
    });

    console.log("[AI-SUPPORT] Auto-reply sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      type: isRefund && previousRefundRequests >= 2 ? "refund_confirmation" : "standard"
    }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[AI-SUPPORT] Error:", error);
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
};

serve(handler);
