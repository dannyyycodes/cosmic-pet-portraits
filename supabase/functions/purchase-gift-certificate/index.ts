import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid gift amounts (server-side truth)
const VALID_AMOUNTS = [3500, 5000, 12900]; // $35, $50, $129

function generateGiftCode(): string {
  // Use cryptographically secure random values
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);

  let code = "GIFT-";
  for (let i = 0; i < 4; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  code += "-";
  for (let i = 4; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

// Input validation schema
const giftSchema = z.object({
  purchaserEmail: z.string().email().max(255),
  recipientEmail: z.string().email().max(255).optional().or(z.literal("")).or(z.null()),
  recipientName: z.string().max(100).optional().default(""),
  giftMessage: z.string().max(500).optional().default(""),
  amountCents: z.number().int().refine((a) => VALID_AMOUNTS.includes(a), "Invalid gift amount"),
  deliveryMethod: z.enum(["email", "link"]).optional().default("email"),
});

type GiftSchemaInput = z.infer<typeof giftSchema>;

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildPurchaserEmailHtml(params: {
  giftCode: string;
  redeemUrl: string;
  amountCents: number;
  recipientName: string;
  recipientEmail: string | null;
  giftMessage: string;
}) {
  const amount = formatMoney(params.amountCents);
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#0b1020; margin:0; padding:24px; color:#e6e9ff;">
      <div style="max-width:640px; margin:0 auto; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:28px;">
        <h1 style="margin:0 0 8px 0; font-size:22px;">Your gift is ready</h1>
        <p style="margin:0 0 18px 0; color:rgba(230,233,255,0.8);">Share the code or link below so the recipient can redeem their cosmic pet report.</p>

        <div style="border-radius:12px; padding:14px; background:rgba(124,58,237,0.18); border:1px solid rgba(124,58,237,0.35);">
          <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:rgba(230,233,255,0.75);">Gift Code</div>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:24px; font-weight:700; margin-top:6px;">${params.giftCode}</div>
          <div style="margin-top:10px; font-size:13px; color:rgba(230,233,255,0.78);">Redeem link: <a href="${params.redeemUrl}" style="color:#c4b5fd;">${params.redeemUrl}</a></div>
        </div>

        <div style="margin-top:16px; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div style="font-size:14px; color:rgba(230,233,255,0.8);"><strong>Amount:</strong> ${amount}</div>
          <div style="font-size:14px; color:rgba(230,233,255,0.8);"><strong>Recipient:</strong> ${params.recipientName || "Friend"}${params.recipientEmail ? ` (${params.recipientEmail})` : ""}</div>
        </div>

        ${
          params.giftMessage
            ? `<div style="margin-top:16px; padding:14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:rgba(230,233,255,0.75); margin-bottom:6px;">Your message</div>
                <div style="font-size:14px; color:rgba(230,233,255,0.9); font-style:italic;">“${params.giftMessage}”</div>
              </div>`
            : ""
        }

        <p style="margin:18px 0 0 0; font-size:12px; color:rgba(230,233,255,0.65);">If you don't see the email, check spam/promotions.</p>
      </div>
    </body>
  </html>`;
}

function buildRecipientEmailHtml(params: {
  giftCode: string;
  redeemUrl: string;
  amountCents: number;
  recipientName: string;
  giftMessage: string;
}) {
  const amount = formatMoney(params.amountCents);
  return `
  <!DOCTYPE html>
  <html>
    <body style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#0b1020; margin:0; padding:24px; color:#e6e9ff;">
      <div style="max-width:640px; margin:0 auto; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:28px;">
        <h1 style="margin:0 0 8px 0; font-size:22px;">${params.recipientName || "Friend"}, you received a gift</h1>
        <p style="margin:0 0 18px 0; color:rgba(230,233,255,0.8);">Redeem your cosmic pet report using the code below.</p>

        ${
          params.giftMessage
            ? `<div style="margin:0 0 16px 0; padding:14px; border-radius:12px; background:rgba(196,181,253,0.10); border:1px solid rgba(196,181,253,0.22); font-style:italic;">“${params.giftMessage}”</div>`
            : ""
        }

        <div style="border-radius:12px; padding:14px; background:rgba(124,58,237,0.18); border:1px solid rgba(124,58,237,0.35); text-align:center;">
          <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:rgba(230,233,255,0.75);">Gift Code</div>
          <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:26px; font-weight:800; margin-top:6px;">${params.giftCode}</div>
          <div style="margin-top:10px; font-size:14px; color:rgba(230,233,255,0.85);">Value: <strong>${amount}</strong></div>
          <div style="margin-top:12px;">
            <a href="${params.redeemUrl}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#7c3aed; color:white; text-decoration:none; font-weight:700;">Redeem now</a>
          </div>
        </div>

        <p style="margin:18px 0 0 0; font-size:12px; color:rgba(230,233,255,0.65);">If the button doesn't work, open: <a href="${params.redeemUrl}" style="color:#c4b5fd;">${params.redeemUrl}</a></p>
      </div>
    </body>
  </html>`;
}

async function sendGiftEmailsBestEffort(params: {
  input: GiftSchemaInput;
  giftCode: string;
  redeemUrl: string;
}) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("[PURCHASE-GIFT] RESEND_API_KEY missing - skipping email send");
    return;
  }

  const resend = new Resend(resendKey);

  const recipientName = params.input.recipientName || "Friend";
  const giftMessage = params.input.giftMessage || "";
  const recipientEmail = params.input.recipientEmail ? String(params.input.recipientEmail) : null;

  // Purchaser confirmation
  try {
    await resend.emails.send({
      from: "AstroPets <hello@astropets.cloud>",
      to: [params.input.purchaserEmail],
      subject: `Gift code: ${params.giftCode}`,
      html: buildPurchaserEmailHtml({
        giftCode: params.giftCode,
        redeemUrl: params.redeemUrl,
        amountCents: params.input.amountCents,
        recipientName,
        recipientEmail,
        giftMessage,
      }),
    });
    console.log("[PURCHASE-GIFT] Purchaser email sent");
  } catch (err) {
    console.error("[PURCHASE-GIFT] Purchaser email failed", err);
  }

  // Recipient email (only for email delivery)
  if (params.input.deliveryMethod === "email" && recipientEmail) {
    try {
      await resend.emails.send({
        from: "AstroPets <hello@astropets.cloud>",
        to: [recipientEmail],
        subject: `${recipientName}, your gift code is ${params.giftCode}`,
        html: buildRecipientEmailHtml({
          giftCode: params.giftCode,
          redeemUrl: params.redeemUrl,
          amountCents: params.input.amountCents,
          recipientName,
          giftMessage,
        }),
      });
      console.log("[PURCHASE-GIFT] Recipient email sent");
    } catch (err) {
      console.error("[PURCHASE-GIFT] Recipient email failed", err);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const input = giftSchema.parse(rawInput);

    console.log("[PURCHASE-GIFT] Starting gift certificate purchase", {
      purchaserEmail: input.purchaserEmail,
      recipientEmail: input.recipientEmail,
      amountCents: input.amountCents,
      deliveryMethod: input.deliveryMethod,
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate unique gift code
    let giftCode = generateGiftCode();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseClient
        .from("gift_certificates")
        .select("id")
        .eq("code", giftCode)
        .single();

      if (!existing) break;
      giftCode = generateGiftCode();
      attempts++;
    }

    // Create gift certificate record (skip Stripe for testing)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: inserted, error: insertError } = await supabaseClient
      .from("gift_certificates")
      .insert({
        code: giftCode,
        purchaser_email: input.purchaserEmail,
        recipient_email: input.recipientEmail || null,
        recipient_name: input.recipientName || null,
        gift_message: input.giftMessage || null,
        amount_cents: input.amountCents,
        stripe_session_id: null, // No Stripe session for testing
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[PURCHASE-GIFT] Failed to create gift certificate record", insertError);
      throw new Error("Failed to create gift certificate");
    }

    console.log("[PURCHASE-GIFT] Gift certificate created (test mode)", { giftCode, id: inserted?.id });

    const origin = req.headers.get("origin") ?? "";
    const redeemUrl = `${origin}/redeem?code=${giftCode}`;

    // Email sending is best-effort (never blocks gift creation)
    await sendGiftEmailsBestEffort({ input, giftCode, redeemUrl });

    // Redirect directly to success page (bypass Stripe)
    const successUrl = `${origin}/gift-success?code=${giftCode}&delivery=${input.deliveryMethod}`;

    return new Response(
      JSON.stringify({
        url: successUrl,
        giftCode,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("[PURCHASE-GIFT] Validation error:", error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: error.errors.map((e) => e.message).join(", "),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[PURCHASE-GIFT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

