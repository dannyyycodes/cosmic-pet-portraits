import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// HMAC one-click unsubscribe (RFC 8058 compatible).
// Token = HMAC-SHA256(UNSUBSCRIBE_SECRET, lower(trim(email))) as hex.
// The SAME signer lives in generate-influencer-pitch so footer links verify here.
// Link form:  /functions/v1/unsubscribe?e=<urlencoded email>&t=<hex>
//  - GET  -> human clicks the footer link -> suppress + friendly HTML page.
//  - POST -> mail-client one-click (List-Unsubscribe-Post) -> suppress + 200.
// Tampered/missing token => 400. No JWT (deploy --no-verify-jwt).

const enc = new TextEncoder();

async function signEmail(email: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email.toLowerCase().trim()));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time-ish hex compare (lengths fixed at 64).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:Georgia,serif;background:#FFFDF5;color:#141210;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px}.card{max-width:440px;text-align:center;background:#faf4e8;border:1px solid #e8ddd0;border-radius:16px;padding:40px}h1{font-size:22px;margin:0 0 12px;color:#bf524a}p{color:#5a4a42;line-height:1.6;margin:0}</style></head><body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").toLowerCase().trim();
  const token = url.searchParams.get("t") || "";
  const oneClick = req.method === "POST";

  const secret = Deno.env.get("UNSUBSCRIBE_SECRET");
  if (!secret) {
    console.error("UNSUBSCRIBE_SECRET not configured");
    return oneClick
      ? new Response("not configured", { status: 500 })
      : page("Something went wrong", "We couldn't process that link right now. Please reply to the email and we'll remove you.", 500);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || !token) {
    return oneClick
      ? new Response("bad request", { status: 400 })
      : page("Invalid link", "This unsubscribe link is incomplete. Please reply to the email and we'll remove you.", 400);
  }

  const expected = await signEmail(email, secret);
  if (!safeEqual(token, expected)) {
    console.warn("Unsubscribe token mismatch for", email);
    return oneClick
      ? new Response("invalid token", { status: 400 })
      : page("Invalid link", "This unsubscribe link couldn't be verified. Please reply to the email and we'll remove you.", 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1) Hard suppression — checked before every send across all workflows.
  //    Unique index is on lower(email) (an expression), so a PostgREST upsert
  //    onConflict can't target it — plain insert, tolerate the 23505 dup.
  const { error: supErr } = await supabase
    .from("suppression_list")
    .insert({ email, reason: "unsubscribe", source: oneClick ? "one_click" : "link" });
  if (supErr && supErr.code !== "23505") console.error("suppression_list insert error:", supErr.message);

  // 2) Flag the contact graph (best-effort).
  const { error: ocErr } = await supabase
    .from("outreach_contacts")
    .update({ suppressed: true, reply_status: "unsub", updated_at: new Date().toISOString() })
    .eq("email", email);
  if (ocErr) console.error("outreach_contacts update error:", ocErr.message);

  // 3) Legacy newsletter list (back-compat — harmless if email absent).
  const { error: esErr } = await supabase
    .from("email_subscribers")
    .update({ is_subscribed: false, unsubscribed_at: new Date().toISOString() })
    .eq("email", email);
  if (esErr) console.error("email_subscribers update error:", esErr.message);

  console.log("Unsubscribed:", email, oneClick ? "(one-click)" : "(link)");

  return oneClick
    ? new Response("OK", { status: 200 })
    : page("You're unsubscribed", "You won't hear from us again. Thank you, and all the best to you and your companion.");
});
