import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

// Warm activation drip for SIGNED affiliates (not cold outreach). Triggered daily
// by n8n (cron) with ?k=<DRIP_KEY>. Sends from the warm noreply@ identity via
// Resend. Stage ladder: 0→welcome+kit (immediate), 1→first-share (day 2),
// 2→bonus reminder (day 5), 3→done. Stage column dedupes; safe to call repeatedly.

// Trigger key — from env, fallback to the legacy literal so the live n8n node keeps
// working. Set Supabase secret AFFILIATE_DRIP_KEY (= ls_drip_7Kq2x) to rotate without redeploy.
const DRIP_KEY = Deno.env.get("AFFILIATE_DRIP_KEY") || "ls_drip_7Kq2x";
const SITE = "https://littlesouls.app";

function shell(inner: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#faf6f1;font-family:Georgia,'Times New Roman',serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <p style="font-size:26px;margin:0 0 8px 0;">&#10024;</p>
    <p style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4a265;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Little Souls &middot; Partners</p>
  </div>
  <div style="background:#ffffff;border-radius:16px;border:1px solid #e8ddd0;padding:38px 32px;">${inner}</div>
  <div style="text-align:center;margin-top:32px;">
    <p style="color:#d4c8bc;font-size:11px;margin:0;letter-spacing:1px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Little Souls</p>
  </div>
</div></body></html>`;
}

function btn(href: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0;"><a href="${href}" style="display:inline-block;background:#bf524a;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:50px;font-weight:600;font-size:15px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:0.4px;">${label}</a></div>`;
}

function stageEmail(stage: number, first: string, refLink: string): { subject: string; html: string } {
  const hi = first ? `${first},` : "Hello,";
  const resources = `${SITE}/affiliate/resources`;
  if (stage === 0) {
    return {
      subject: "you're in ✨ here's your partner kit",
      html: shell(
        `<h1 style="color:#3d2f2a;font-size:24px;font-weight:400;margin:0 0 18px 0;line-height:1.35;">${hi}<br>welcome to the partnership</h1>
         <p style="color:#7a6a60;font-size:15px;line-height:1.85;margin:0 0 18px 0;">Your account is live. Here's how to share it with soul, and earn while you do.</p>
         <p style="color:#7a6a60;font-size:14px;line-height:1.9;margin:0 0 8px 0;"><strong style="color:#3d2f2a;">Your link:</strong><br><a href="${refLink}" style="color:#bf524a;">${refLink}</a></p>
         <p style="color:#7a6a60;font-size:14px;line-height:1.85;margin:18px 0 0 0;">In your kit: ready-to-post captions, images, email swipes, and your own discount code for your audience.</p>
         ${btn(resources, "Open your partner kit")}
         <p style="color:#b8a99e;font-size:13px;line-height:1.6;margin:0;text-align:center;">You earn 50% on soul readings, 20% for life on horoscopes, 15% on pawtraits, plus &pound;15 on your first sale.</p>`
      ),
    };
  }
  if (stage === 1) {
    return {
      subject: "your first share: real pet, real earnings",
      html: shell(
        `<h1 style="color:#3d2f2a;font-size:24px;font-weight:400;margin:0 0 18px 0;line-height:1.35;">${hi}<br>let's get your first share out</h1>
         <p style="color:#7a6a60;font-size:15px;line-height:1.85;margin:0 0 18px 0;">Partners who post once in the first week earn far more than those who wait. Here's a caption you can use as-is:</p>
         <div style="background:#faf6f1;border-radius:12px;padding:18px 20px;margin:0 0 18px 0;color:#5a4a42;font-size:14px;line-height:1.7;font-style:italic;">"I had a soul reading done for my pet and it genuinely knew them. Their nature, their quirks, the why behind all of it. If you want one for yours, my link's below ↓"</div>
         <p style="color:#7a6a60;font-size:14px;line-height:1.85;margin:0;">Drop your link under it: <a href="${refLink}" style="color:#bf524a;">${refLink}</a></p>
         ${btn(resources, "Grab more captions & images")}`
      ),
    };
  }
  return {
    subject: "your £15 first-sale bonus is waiting",
    html: shell(
      `<h1 style="color:#3d2f2a;font-size:24px;font-weight:400;margin:0 0 18px 0;line-height:1.35;">${hi}<br>a quick nudge on your bonus</h1>
       <p style="color:#7a6a60;font-size:15px;line-height:1.85;margin:0 0 18px 0;">Your first sale comes with a &pound;15 bonus on top of your commission. And it only climbs from there: 35%, then 40%, then 45% as you reach 5, 10 and 25 sales.</p>
       <p style="color:#7a6a60;font-size:14px;line-height:1.85;margin:0 0 8px 0;">If you haven't shared yet, now's the moment. Your link:</p>
       <p style="color:#7a6a60;font-size:14px;line-height:1.85;margin:0;"><a href="${refLink}" style="color:#bf524a;">${refLink}</a></p>
       ${btn(resources, "Open your partner kit")}
       <p style="color:#b8a99e;font-size:13px;line-height:1.6;margin:0;text-align:center;">Any questions, just reply, a real person reads these.</p>`
    ),
  };
}

serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== DRIP_KEY) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  const resend = new Resend(resendKey);
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: rows, error } = await supabase
    .from("affiliates")
    .select("id, email, name, referral_code, created_at, onboarding_stage")
    .lt("onboarding_stage", 3)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const now = Date.now();
  const ageDays = (iso: string) => (now - new Date(iso).getTime()) / 86400000;
  let sent = 0, skipped = 0, failed = 0;

  for (const a of rows || []) {
    const stage: number = a.onboarding_stage ?? 0;
    const age = ageDays(a.created_at);
    const due = stage === 0 || (stage === 1 && age >= 2) || (stage === 2 && age >= 5);
    if (!due || !a.email) { skipped++; continue; }

    const first = (a.name || "").trim().split(/\s+/)[0] || "";
    const refLink = `${SITE}/ref/${a.referral_code}`;
    const { subject, html } = stageEmail(stage, first, refLink);
    try {
      const result = await resend.emails.send({
        from: "Little Souls <noreply@littlesouls.app>",
        to: [a.email],
        subject,
        html,
      });
      if ((result as any)?.error) { console.error("[DRIP] resend error", a.email, (result as any).error); failed++; continue; }
      // Only advance the stage if the DB write succeeds — otherwise the affiliate
      // would be re-sent the same stage next run (dedupe = the stage column).
      const { error: updErr } = await supabase
        .from("affiliates")
        .update({ onboarding_stage: stage + 1, onboarding_last_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", a.id);
      if (updErr) { console.error("[DRIP] stage advance failed (will retry next run):", a.email, updErr.message); failed++; continue; }
      sent++;
    } catch (e) {
      console.error("[DRIP] send threw", a.email, e);
      failed++;
    }
  }

  return new Response(JSON.stringify({ ok: true, considered: (rows || []).length, sent, skipped, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
