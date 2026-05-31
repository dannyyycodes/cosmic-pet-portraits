import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

const enc = new TextEncoder();

// One-click unsubscribe token — MUST match supabase/functions/unsubscribe.
// Token = HMAC-SHA256(UNSUBSCRIBE_SECRET, lower(trim(email))) hex.
async function signEmail(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.toLowerCase().trim()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { prospect } = await req.json();
    
    if (!prospect) {
      return new Response(
        JSON.stringify({ success: false, error: "Prospect data is required" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const recipientEmail: string = (prospect.email || "").toLowerCase().trim();

    // SUPPRESSION GATE — never spend an AI call (or let WF-A send) to anyone on
    // the hard list or already flagged in the contact graph. Checked before generate.
    if (recipientEmail) {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: supHit } = await sb
        .from("suppression_list")
        .select("email")
        .eq("email", recipientEmail)
        .maybeSingle();
      const { data: ocHit } = await sb
        .from("outreach_contacts")
        .select("suppressed")
        .eq("email", recipientEmail)
        .eq("suppressed", true)
        .maybeSingle();
      if (supHit || ocHit) {
        console.log("Suppressed, skipping pitch for:", recipientEmail);
        return new Response(
          JSON.stringify({ success: true, suppressed: true }),
          { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
        );
      }
    }

    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    const cerebrasApiKey = Deno.env.get("CEREBRAS_API_KEY");
    if (!openrouterApiKey && !cerebrasApiKey) {
      console.error("No AI key configured (CEREBRAS_API_KEY / OPENROUTER_API_KEY)");
      return new Response(
        JSON.stringify({ success: false, error: "AI not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    console.log("Generating pitch for:", prospect.name);

    const systemPrompt = `You write short, warm, genuinely personal outreach emails inviting pet creators to partner with Little Souls. Little Souls makes custom "pawtraits" and astrology-grade "soul readings" that honour the bond between a person and their pet.

Tone: human and specific, never salesy. Open line references something REAL about their content. For memorial or grief creators, be especially gentle — honour the loss, never exploit it.

The offer, gift-first:
- First, gift them a free soul reading of their own pet — no strings, before any ask.
- If they'd love to share it, the partner programme pays 50% on every soul reading, 20% for life on horoscope memberships, and 15% on pawtraits, plus a £15 bonus on their first sale. Rates climb to 45% as they grow.
- Their audience gets a discount through their own link.

Hard rules: NEVER use the words "AI", "artificial intelligence", or "report" — it is a "soul reading", not a report. Use £ (GBP), never $. 90-130 words. One soft, clear call to action. No "buy now", no hype, no emoji spam.

OUTPUT FORMAT — strict:
- Write ONLY the email body. Do NOT write a "Subject:" line — the subject is set separately.
- NEVER output square-bracket placeholders like [Name of Pet] or [Name]. If you don't know the pet's name, write "your pup", "one of your dogs", or "your companion" instead. The email must read perfectly with zero placeholders.
- Do NOT invent specific video titles, pet names, or facts you weren't given. Reference their content only in ways that are true from the summary provided.
- NEVER use em dashes (—) or en dashes (–). Use a comma, a full stop, or a colon instead. This is a hard rule.
- Invite them to claim their free soul reading using the link that appears just below your message. Do NOT write any URL yourself, it is added automatically. Phrase the call to action warmly, like "just tap the link below to claim it, no strings at all".
- Sign off exactly as:
Grace
Little Souls`;

    const userPrompt = `Write a personalized outreach email for this pet influencer:

Name: ${prospect.name}
Website: ${prospect.website || "Not available"}
Instagram: ${prospect.instagram ? `@${prospect.instagram}` : "Not available"}
TikTok: ${prospect.tiktok ? `@${prospect.tiktok}` : "Not available"}
Niche: ${prospect.niche || "pets"}
Content Summary: ${prospect.content_summary || "Pet content creator"}

Write a warm, personal email inviting them to partner with Little Souls. Reference something specific about their content, and lead by offering a free soul reading of their own pet before any ask.`;

    let pitch: string | undefined;

    // FREE primary: Cerebras gpt-oss-120b (free tier, ~$0). Reasoning model, so
    // give it token room and take only message.content (the final email).
    if (cerebrasApiKey) {
      try {
        const cr = await fetch("https://api.cerebras.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${cerebrasApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-oss-120b",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 2000,
            temperature: 0.6,
          }),
        });
        if (cr.ok) {
          const cj = await cr.json();
          const c = cj?.choices?.[0]?.message?.content?.trim();
          if (c) { pitch = c; console.log("Pitch via Cerebras (free)"); }
        } else {
          console.warn(`Cerebras ${cr.status}, falling back to OpenRouter`);
        }
      } catch (e) {
        console.warn("Cerebras error, falling back to OpenRouter:", e);
      }
    }

    // PAID fallback: OpenRouter gemini-2.5-flash (only if Cerebras unavailable).
    if (!pitch && openrouterApiKey) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://littlesouls.app",
          "X-Title": "Little Souls Affiliate Recruiter",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        pitch = data?.choices?.[0]?.message?.content?.trim();
        if (pitch) console.log("Pitch via OpenRouter (fallback)");
      } else {
        console.error("OpenRouter fallback failed:", response.status);
      }
    }

    if (!pitch) {
      return new Response(
        JSON.stringify({ success: false, error: "No pitch generated" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    // COMPLIANCE FOOTER (CAN-SPAM + UK PECR): honest sender ID + one-click
    // unsubscribe + physical postal address. WF-A appends footerHtml to the email
    // body and sets the List-Unsubscribe / List-Unsubscribe-Post headers from
    // unsubscribeUrl. Without a verified recipient email we cannot build a working
    // unsubscribe link, so we return no footer and WF-A must not send.
    let footerHtml = "";
    let unsubscribeUrl = "";
    const unsubSecret = Deno.env.get("UNSUBSCRIBE_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const postalAddress = Deno.env.get("OUTREACH_POSTAL_ADDRESS") || "";
    // CAN-SPAM (16 CFR 316.3) + UK PECR: a cold email is only compliant with BOTH a
    // working one-click unsubscribe AND a physical postal address. compliant=false
    // => WF-A's Suppression Gate must DROP the send (never send a non-compliant cold email).
    const compliant = !!(recipientEmail && unsubSecret && supabaseUrl && postalAddress && unsubSecret.length >= 16);
    if (recipientEmail && unsubSecret && unsubSecret.length < 16) {
      console.error("UNSUBSCRIBE_SECRET missing or too short (<16) — outreach will be blocked as non-compliant");
    }

    if (recipientEmail && unsubSecret && supabaseUrl) {
      const token = await signEmail(recipientEmail, unsubSecret);
      unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe?e=${encodeURIComponent(recipientEmail)}&t=${token}`;
      const addressLine = postalAddress
        ? `<br>Little Souls, ${postalAddress}.`
        : "";
      footerHtml =
        `<div style="margin-top:28px;padding-top:14px;border-top:1px solid #e8ddd0;font-family:Georgia,serif;font-size:12px;line-height:1.6;color:#958779">` +
        `You're hearing from Little Souls because we found your public creator contact while looking for pet and astrology partners. ` +
        `If this isn't for you, <a href="${unsubscribeUrl}" style="color:#bf524a">unsubscribe here</a>, one click, no reply needed.` +
        addressLine +
        `</div>`;
    }

    return new Response(
      JSON.stringify({ success: true, pitch, footerHtml, unsubscribeUrl, compliant }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in generate-influencer-pitch:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
