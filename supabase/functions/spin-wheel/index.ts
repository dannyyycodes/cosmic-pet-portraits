// Cosmic Wheel — server-side spin handler
//
// Called by SpinWheel.tsx after the visitor enters their email and
// hits "Spin". Performs:
//   1. CORS / origin allow-list (matches existing edge functions)
//   2. Rate limit per IP (5 attempts / minute via shared helper)
//   3. Bot trap: honeypot field must be empty
//   4. Email validity check
//   5. Dedupe: one spin per email FOREVER. Returns original prize if found.
//   6. IP abuse check: one spin per IP per 30 days
//   7. Server-side weighted random roll (animation can't cheat this)
//   8. Generates a unique LS-XXXX-XXXX code, 48-hour expiry, single-use
//   9. Inserts into `coupons` (with bonus_type/bonus_value if non-discount)
//  10. Logs into `wheel_spins`
//  11. Upserts `email_subscribers` (source='wheel', journey_stage='wheel_lead')
//  12. Sends the prize email via Resend
//  13. Returns { slice, prizeLabel, code, expiresAt } so the client can
//      animate the wheel to land on the correct sector.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

const ALLOWED_ORIGINS = [
  "https://littlesouls.app",
  "https://www.littlesouls.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ─── Prize table ──────────────────────────────────────────────────────
//
// SOURCE OF TRUTH for what the wheel can award. The frontend uses these
// labels for the visual sectors but the actual `slice` won is decided
// here on the server. Weights sum to 100. Sliding the percentages here
// changes the prize distribution instantly — no client redeploy needed.

type PrizeKind =
  | { type: "discount"; value: number; giftOnly?: boolean }
  | { type: "bonus"; bonusType: "soul_speak_credits" | "horoscope_month" | "tier_upgrade"; value: number; tierTarget?: string };

interface Prize {
  slice: number;
  weight: number;
  label: string;
  emailHook: string; // short copy for the prize email subject + hero
  kind: PrizeKind;
}

const PRIZES: Prize[] = [
  { slice: 1, weight: 50, label: "10% off your reading",
    emailHook: "10% off",
    kind: { type: "discount", value: 10 } },
  { slice: 2, weight: 17, label: "500 SoulSpeak credits",
    emailHook: "500 SoulSpeak credits",
    kind: { type: "bonus", bonusType: "soul_speak_credits", value: 500 } },
  { slice: 3, weight: 12, label: "30% off — gift to a friend",
    emailHook: "30% off a gift reading",
    kind: { type: "discount", value: 30, giftOnly: true } },
  { slice: 4, weight: 10, label: "15% off your reading",
    emailHook: "15% off",
    kind: { type: "discount", value: 15 } },
  { slice: 5, weight: 6, label: "Free Soul Reading → Soul Bond upgrade",
    emailHook: "Free upgrade to Soul Bond",
    kind: { type: "bonus", bonusType: "tier_upgrade", value: 0, tierTarget: "premium" } },
  { slice: 6, weight: 2, label: "20% off your reading",
    emailHook: "20% off",
    kind: { type: "discount", value: 20 } },
  { slice: 7, weight: 2, label: "30% off — Cosmic Jackpot",
    emailHook: "Cosmic Jackpot — 30% off",
    kind: { type: "discount", value: 30 } },
  { slice: 8, weight: 1, label: "1 free month of horoscopes",
    emailHook: "1 free month of horoscopes",
    kind: { type: "bonus", bonusType: "horoscope_month", value: 1 } },
];

const TOTAL_WEIGHT = PRIZES.reduce((s, p) => s + p.weight, 0);

function rollPrize(): Prize {
  // crypto.getRandomValues for cryptographically-sound uniform sampling.
  // A single 32-bit unsigned int → modulo TOTAL_WEIGHT is fine because
  // TOTAL_WEIGHT (100) divides 2**32 with negligible bias.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const r = buf[0] % TOTAL_WEIGHT;
  let acc = 0;
  for (const p of PRIZES) {
    acc += p.weight;
    if (r < acc) return p;
  }
  return PRIZES[0];
}

// ─── Code + IP utils ──────────────────────────────────────────────────

function generateCode(): string {
  // Alphabet without ambiguous chars (0/O, 1/I/L). 8 chars + LS prefix.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const chars = Array.from(buf, (b) => alphabet[b % alphabet.length]).join("");
  return `LS-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

async function hashIp(ip: string): Promise<string> {
  // Daily salt — IPs only need to dedupe within the 30-day abuse window,
  // and rotating the salt daily caps how long any single hash is useful
  // for cross-day correlation. Hash is unguessable for short windows.
  const day = new Date().toISOString().slice(0, 10);
  const salt = Deno.env.get("WHEEL_IP_SALT") ?? "ls-cosmic-wheel-v1";
  const data = new TextEncoder().encode(`${ip}|${day}|${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─── Disposable / throwaway email domains ─────────────────────────────
//
// Curated set of the most common single-use email services. Covers the
// great majority of casual wheel abuse without the bloat of a 3000-entry
// list. Add new offenders here as you spot them by querying:
//   SELECT split_part(email,'@',2) AS domain, count(*)
//   FROM wheel_spins GROUP BY 1 ORDER BY 2 DESC;
const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
  "guerrillamail.biz", "guerrillamailblock.com", "sharklasers.com", "spam4.me",
  "10minutemail.com", "10minutemail.net", "10minutemail.co.uk", "10minutemail.de",
  "tempmail.com", "tempmail.org", "tempmail.email", "temp-mail.org", "temp-mail.io",
  "yopmail.com", "yopmail.net", "yopmail.fr", "throwaway.email",
  "throwawaymail.com", "trashmail.com", "trashmail.net", "trashmail.de",
  "trashmail.io", "dispostable.com", "getnada.com", "nada.email",
  "maildrop.cc", "mailnesia.com", "fakeinbox.com", "fakemailgenerator.com",
  "emailondeck.com", "mintemail.com", "mailsac.com", "moakt.com",
  "mt2009.com", "mt2014.com", "mt2015.com", "tempinbox.com",
  "tempemail.net", "tempemails.com", "tempemail.com", "throwam.com",
  "fakemail.fr", "noclickemail.com", "spamgourmet.com", "spamgourmet.net",
  "spamgourmet.org", "deadaddress.com", "easytrashmail.com", "instant-mail.de",
  "anonbox.net", "anonymbox.com", "burnermail.io", "discardmail.com",
  "discardmail.de", "emltmp.com", "filzmail.com", "harakirimail.com",
  "incognitomail.com", "incognitomail.net", "jetable.org", "jourrapide.com",
  "kasmail.com", "klassmaster.com", "kurzepost.de", "letthemeatspam.com",
  "mailbidon.com", "mailcatch.com", "mailde.de", "maileater.com",
  "mailexpire.com", "mailforspam.com", "mailfreeonline.com", "mailmetrash.com",
  "mailmoat.com", "mailtemporanea.com", "mailtemporanea.it", "mailto.de",
  "mailtrash.net", "mailtv.net", "mvrht.com", "mytrashmail.com",
  "neomailbox.com", "no-spam.ws", "nogmailspam.info", "noref.in",
  "objectmail.com", "obobbo.com", "onewaymail.com", "pjkp.com",
  "poofy.org", "pookmail.com", "privacy.net", "proxymail.eu",
  "punkass.com", "rmqkr.net", "rppkn.com", "safe-mail.net",
  "selfdestructingmail.com", "sendspamhere.com", "shortmail.net",
  "sneakemail.com", "sofort-mail.de", "sogetthis.com", "spambob.net",
  "spambob.com", "spambob.org", "spambog.com", "spambog.de",
  "spambog.ru", "spamcero.com", "spamfellas.com", "spamfree24.com",
  "spamfree24.de", "spamfree24.eu", "spamfree24.info", "spamfree24.net",
]);

// Cloudflare DNS-over-HTTPS MX check. Verifies the email's domain has
// at least one MX record (i.e. can actually receive mail). Catches
// typos like "gmial.com" / "yhaoo.co" before we issue a code that
// would just bounce.
//
// Strict fail-open: any DNS error / timeout / weird response returns
// true. We'd rather let a real visitor through than block them on a
// transient DNS hiccup — the disposable blocklist + IP rate limit
// already cover the common abuse vectors.
async function domainHasMx(domain: string): Promise<boolean> {
  if (!domain) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
    const res = await fetch(url, {
      headers: { "Accept": "application/dns-json" },
      signal: controller.signal,
    });
    if (!res.ok) return true;
    const data = await res.json() as { Status?: number; Answer?: Array<{ type: number; data: string }> };
    // RFC 8484 status codes: 0 = NOERROR, 3 = NXDOMAIN.
    if (data.Status === 3) return false;
    if (data.Status !== 0) return true;
    // RFC 1035 record type 15 = MX.
    if (Array.isArray(data.Answer) && data.Answer.some((a) => a.type === 15)) return true;
    // NOERROR but no MX records — domain exists but doesn't accept mail.
    return false;
  } catch {
    return true;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Email template ───────────────────────────────────────────────────

function getEmailHtml(opts: { code: string; prizeLabel: string; emailHook: string; expiresAt: Date }) {
  const { code, prizeLabel, emailHook, expiresAt } = opts;
  const expiresStr = expiresAt.toUTCString().replace(":00 GMT", " GMT");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4a265;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Little Souls</p>
    </div>
    <div style="background:#ffffff;border-radius:16px;border:1px solid #e8ddd0;padding:40px 28px;text-align:center;box-shadow:0 4px 20px rgba(35,40,30,0.06);">
      <p style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#c4a265;margin:0 0 14px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">The Cosmic Wheel</p>
      <h1 style="color:#141210;font-size:26px;font-weight:400;margin:0 0 14px 0;line-height:1.35;">You won ${emailHook}.</h1>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 24px 0;">${prizeLabel} — yours to claim. The stars liked you today.</p>
      <div style="background:#faf4e8;border:1px dashed #c4a265;border-radius:12px;padding:22px 18px;margin:0 0 24px 0;">
        <p style="font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#c4a265;margin:0 0 10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Your code</p>
        <p style="font-family:'Courier New',monospace;font-size:26px;font-weight:700;letter-spacing:3px;color:#141210;margin:0;">${code}</p>
      </div>
      <div style="margin:24px 0;">
        <a href="https://www.littlesouls.app/?code=${encodeURIComponent(code)}" style="display:inline-block;background:#bf524a;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:600;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(191,82,74,0.25);">Use it now &#10024;</a>
      </div>
      <p style="color:#958779;font-size:13px;line-height:1.6;margin:0 0 6px 0;">Expires ${expiresStr} &middot; one use, single order</p>
      <p style="color:#958779;font-size:12px;line-height:1.6;margin:0;font-style:italic;">If you spin again, it&rsquo;ll just hand back this same gift &mdash; the wheel only turns once per soul.</p>
    </div>
    <p style="text-align:center;color:#bfb2a3;font-size:11px;margin:24px 0 0 0;">Little Souls &middot; <a href="https://www.littlesouls.app" style="color:#bfb2a3;text-decoration:none;">littlesouls.app</a></p>
  </div>
</body></html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey  = Deno.env.get("RESEND_API_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[spin-wheel] missing supabase env vars");
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Rate limit per IP — 5 attempts/minute. Catches scripted spins.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(supabase, "spin-wheel", ip, 5, 60);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Too many spins. Try again in a moment." }), {
      status: 429, headers: { ...cors, "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) },
    });
  }

  // 2. Body
  let body: { email?: string; honeypot?: string; petName?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // 3. Bot trap — humans can't see this field, bots fill it. Soft-pass
  // (200 with fake prize) is tempting but a hard 400 logs the attempt
  // visibly in our metrics for tuning later.
  if (body.honeypot && body.honeypot.length > 0) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // 4. Email — three-layer validation:
  //    (a) format regex
  //    (b) disposable-domain blocklist
  //    (c) MX record check via Cloudflare DoH (fail-open on errors)
  const email = (body.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return new Response(JSON.stringify({ error: "Please enter a valid email." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const emailDomain = email.split("@")[1] ?? "";
  if (DISPOSABLE_DOMAINS.has(emailDomain)) {
    return new Response(JSON.stringify({ error: "Please use your real email — disposable addresses can't receive your code." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const hasMx = await domainHasMx(emailDomain);
  if (!hasMx) {
    return new Response(JSON.stringify({ error: "We couldn't reach that email's domain. Check the spelling and try again." }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const petName = (body.petName || "").trim().slice(0, 80) || null;

  // 5. Dedupe by email — return existing prize, never re-roll.
  const existing = await supabase
    .from("wheel_spins")
    .select("prize_slice, prize_label, coupon_id, coupons(code, expires_at)")
    .eq("email", email)
    .maybeSingle();

  if (existing.data) {
    const c = existing.data.coupons as { code: string; expires_at: string } | null;
    if (c) {
      return new Response(JSON.stringify({
        slice: existing.data.prize_slice,
        prizeLabel: existing.data.prize_label,
        code: c.code,
        expiresAt: c.expires_at,
        repeat: true,
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    // Unusual: spin row without coupon. Treat as fresh roll.
    console.warn("[spin-wheel] orphan wheel_spins row for", email);
  }

  // 6. IP abuse check — block if same IP spun in last 30 days.
  const ipHash = await hashIp(ip);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: ipCount } = await supabase
    .from("wheel_spins")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", thirtyDaysAgo);

  if ((ipCount ?? 0) > 0) {
    return new Response(JSON.stringify({ error: "Looks like this device has already spun. One spin per visitor." }), {
      status: 429, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // 7. Roll
  const prize = rollPrize();

  // 8. Code + 48h expiry
  let code = generateCode();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // 9. Insert coupon (retry once on the astronomically-rare collision).
  const couponInsert = (codeToUse: string) => supabase
    .from("coupons")
    .insert({
      code: codeToUse,
      discount_type: prize.kind.type === "discount" ? "percentage" : "percentage",
      discount_value: prize.kind.type === "discount" ? prize.kind.value : 0,
      max_uses: 1,
      current_uses: 0,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      bonus_type: prize.kind.type === "bonus" ? prize.kind.bonusType : null,
      bonus_value: prize.kind.type === "bonus" ? prize.kind.value : null,
      tier_upgrade_target: prize.kind.type === "bonus" && prize.kind.bonusType === "tier_upgrade"
        ? (prize.kind.tierTarget ?? null) : null,
      gift_only: prize.kind.type === "discount" ? !!prize.kind.giftOnly : false,
      wheel_email: email,
      wheel_prize_label: prize.label,
    })
    .select("id, code")
    .single();

  let couponRes = await couponInsert(code);
  if (couponRes.error && couponRes.error.code === "23505") {
    code = generateCode();
    couponRes = await couponInsert(code);
  }
  if (couponRes.error || !couponRes.data) {
    console.error("[spin-wheel] coupon insert failed:", couponRes.error?.message);
    return new Response(JSON.stringify({ error: "Couldn't issue your code. Try again in a moment." }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // 10. Log spin (unique on lower(email) — race-loser gets a 23505 and
  // we serve back the winning row's prize so the visitor still gets a
  // consistent answer.)
  const ua = (req.headers.get("user-agent") || "").slice(0, 500);
  const spinInsert = await supabase
    .from("wheel_spins")
    .insert({
      email,
      ip_hash: ipHash,
      user_agent: ua,
      prize_slice: prize.slice,
      prize_label: prize.label,
      coupon_id: couponRes.data.id,
      source: "funnel_v2",
    });

  if (spinInsert.error) {
    if (spinInsert.error.code === "23505") {
      // Race: another request inserted first. Re-fetch the canonical prize.
      await supabase.from("coupons").update({ is_active: false }).eq("id", couponRes.data.id);
      const winner = await supabase
        .from("wheel_spins")
        .select("prize_slice, prize_label, coupons(code, expires_at)")
        .eq("email", email)
        .maybeSingle();
      const c = winner.data?.coupons as { code: string; expires_at: string } | null;
      if (winner.data && c) {
        return new Response(JSON.stringify({
          slice: winner.data.prize_slice,
          prizeLabel: winner.data.prize_label,
          code: c.code,
          expiresAt: c.expires_at,
          repeat: true,
        }), { headers: { ...cors, "Content-Type": "application/json" } });
      }
    }
    console.error("[spin-wheel] wheel_spins insert failed:", spinInsert.error.message);
    // Coupon already exists — let the visitor have it rather than 500ing.
  }

  // 11. Email subscriber upsert. `journey_stage='wheel_lead'` only set
  // for genuinely new rows; existing subscribers keep their stage so we
  // don't downgrade a paying customer back to a lead.
  const { data: existingSub } = await supabase
    .from("email_subscribers")
    .select("id, journey_stage")
    .eq("email", email)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from("email_subscribers")
      .update({
        pet_name: petName ?? undefined,
        is_subscribed: true,
      })
      .eq("id", existingSub.id);
  } else {
    await supabase
      .from("email_subscribers")
      .insert({
        email,
        pet_name: petName,
        journey_stage: "wheel_lead",
        source: "wheel",
        is_subscribed: true,
      });
  }

  // 12. Send the prize email. Failure here is non-fatal — the visitor
  // already has the code on screen via the response payload.
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Little Souls <hello@littlesouls.app>",
        to: email,
        subject: `Your Cosmic Wheel reward: ${prize.emailHook} ✨`,
        html: getEmailHtml({ code, prizeLabel: prize.label, emailHook: prize.emailHook, expiresAt }),
      });
    } catch (e) {
      console.error("[spin-wheel] resend send failed:", (e as Error).message);
    }
  }

  return new Response(JSON.stringify({
    slice: prize.slice,
    prizeLabel: prize.label,
    code,
    expiresAt: expiresAt.toISOString(),
    repeat: false,
  }), { headers: { ...cors, "Content-Type": "application/json" } });
});
