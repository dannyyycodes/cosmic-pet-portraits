import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// ─── Color palette (matches landing page) ──────────────────────────────────
// Background: #FFFDF5 | Card: #fff with #e8ddd0 border | Inner: #faf4e8
// Heading: #141210 | Body: #5a4a42 | Muted: #958779 | Faded: #bfb2a3
// CTA: #bf524a (rose) | Accent: #c4a265 (gold) | Sand: #d6c8b6

// ─── Campaign Configurations ────────────────────────────────────────────────

const CAMPAIGNS = {
  // Pre-purchase: lead nurture
  welcome_1: {
    delayHours: 0.5,
    subject: (petName: string) => `${petName}'s stars are waiting for you`,
    nextStage: 'welcome_2_pending',
  },
  welcome_2: {
    delayHours: 24,
    subject: (petName: string) => `The thing about ${petName} most people miss`,
    nextStage: 'welcome_3_pending',
  },
  welcome_3: {
    delayHours: 72,
    subject: (petName: string) => `A little gift for you and ${petName}`,
    nextStage: 'nurtured',
  },
  abandoned_cart: {
    delayHours: 3,
    subject: (petName: string) => `${petName}'s reading is still waiting for you`,
    nextStage: 'abandoned_reminded',
  },
  // Post-purchase: deepen relationship
  post_purchase_1: {
    delayHours: 168, // 1 week
    subject: (petName: string) => `Someone in your life needs to see ${petName}'s reading`,
    nextStage: 'post_purchase_2_pending',
  },
  post_purchase_2: {
    delayHours: 336, // 2 weeks
    subject: (petName: string) => `Something new for ${petName}`,
    nextStage: 'nurtured',
  },
  // Win-back
  re_engagement: {
    delayHours: 720, // 30 days
    subject: (petName: string) => `We still think about ${petName}`,
    nextStage: 'nurtured',
  },
};

// ─── Email Templates ────────────────────────────────────────────────────────
// NOTE: The report-ready email (immediate, with mini guide) is sent by send-report-email,
// not by this nurture function. That email includes: pet photo, report link, SoulSpeak link,
// how to enjoy guide, and gift code.

interface EmailContext {
  petName: string;
  petPhotoUrl?: string;
  reportId?: string;
  tier?: string;
  hasHoroscope?: boolean;
  hasSoulSpeak?: boolean;
}

function petPhotoHtml(ctx: EmailContext): string {
  if (!ctx.petPhotoUrl) return '';
  return `
    <div style="text-align:center;margin:0 0 20px">
      <img src="${ctx.petPhotoUrl}" alt="${ctx.petName}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2.5px solid #c4a265;box-shadow:0 0 0 4px rgba(196,162,101,0.1)" />
    </div>`;
}

function soulSpeakLink(ctx: EmailContext): string {
  if (!ctx.reportId) return '';
  return `https://littlesouls.app/soul-chat?id=${ctx.reportId}`;
}

function reportLink(ctx: EmailContext): string {
  if (!ctx.reportId) return '';
  return `https://littlesouls.app/report?id=${ctx.reportId}`;
}

function soulSpeakBlock(ctx: EmailContext): string {
  const link = soulSpeakLink(ctx);
  if (!link) return '';
  return `
    <div style="background:#faf4e8;border-radius:12px;padding:18px;border:1px solid #e8ddd0;margin:20px 0;text-align:center">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4a265;margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        SoulSpeak
      </p>
      <p style="color:#5a4a42;font-size:14px;margin:0 0 12px;line-height:1.6">
        Talk to ${ctx.petName}'s soul. Ask them anything.
      </p>
      <a href="${link}" style="display:inline-block;background:#141210;color:#fff;text-decoration:none;padding:10px 28px;border-radius:50px;font-size:13px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        Open SoulSpeak
      </a>
    </div>`;
}

function giftBlock(code: string, discount: string): string {
  return `
    <div style="background:#faf4e8;border-radius:12px;padding:18px;border:1px solid #e8ddd0;margin:20px 0;text-align:center">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4a265;margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        Gift a reading. ${discount} off
      </p>
      <p style="color:#141210;font-size:22px;font-weight:700;letter-spacing:4px;margin:0;font-family:'SF Mono',Monaco,Consolas,monospace">
        ${code}
      </p>
    </div>`;
}

function getEmailContent(campaignType: string, ctx: EmailContext): string {
  const { petName } = ctx;
  const intakeUrl = "https://littlesouls.app/intake";
  const freeReadingUrl = "https://littlesouls.app/free-chart";
  const rLink = reportLink(ctx);
  const photo = petPhotoHtml(ctx);

  const templates: Record<string, string> = {

    // ── WELCOME 1: Warm intro (30 mins after email capture) ────────────
    welcome_1: `
      ${photo}
      <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
        Thank you for being here.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        The fact that you care enough to understand ${petName} on a deeper level says something beautiful about you. Not everyone takes the time to truly see their pet. But you do. And that matters more than you know.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        ${petName}'s full cosmic reading takes about 3 minutes to set up. We'll look at the exact moment they were born and map out who they really are. Their personality, how they love, what they need, and all the things you've always sensed but never had words for.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 24px">
        Your progress is saved. Come back whenever you're ready. ${petName}'s stars aren't going anywhere.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${intakeUrl}" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
          Continue ${petName}'s Reading
        </a>
      </div>
    `,

    // ── WELCOME 2: Lead with love (24 hours later) ────────────────────
    welcome_2: `
      ${photo}
      <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
        You love ${petName}. We can tell.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        The way you ended up here tells us that ${petName} isn't just a pet to you. They're family. They're the one who greets you at the door, the one who knows when something's wrong before you do, the one who chose you just as much as you chose them.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We built Little Souls for exactly that kind of love. Because we believe every pet has a soul worth understanding. And when you finally see ${petName}'s full cosmic personality laid out in front of you, all those little things they do will suddenly make perfect sense.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 24px">
        We'd love to show you what the stars say about ${petName}. We think it'll make you love them even more (if that's even possible).
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${intakeUrl}" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
          Get ${petName}'s Reading
        </a>
      </div>
      <p style="color:#958779;font-size:13px;text-align:center;margin-top:16px">
        Not ready for the full reading? <a href="${freeReadingUrl}" style="color:#c4a265;text-decoration:underline">Try the free cosmic snapshot</a> first.
      </p>
    `,

    // ── WELCOME 3: Gift + generous discount (72 hours) ─────────────────
    welcome_3: `
      ${photo}
      <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
        Last one from us, we promise.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We know life gets busy. But we also know that the bond between you and ${petName} is the kind of thing worth pausing for.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We'd love for you to experience what the stars have to say. So here's a genuine thank you for being part of this community:
      </p>
      ${giftBlock('GIFTLOVE30', '30% off')}
      <p style="color:#958779;font-size:14px;line-height:1.7;margin:0 0 24px;text-align:center">
        No rush, no pressure. ${petName} will still be a star whenever you're ready.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${intakeUrl}" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
          Use Code &amp; Start Reading
        </a>
      </div>
    `,

    // ── ABANDONED CART (3 hours after leaving intake) ───────────────────
    abandoned_cart: `
      ${photo}
      <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
        ${petName}'s reading is waiting for you.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We noticed you started setting up ${petName}'s cosmic reading and wanted you to know that everything is saved. You can pick up right where you left off whenever you're ready.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We know how much ${petName} means to you. That's exactly why we think you'll love seeing who they are through the stars. It's the kind of reading that makes you look at your pet and think "so that's why you do that." And honestly, it just makes you appreciate them even more.
      </p>
      ${giftBlock('GIFTLOVE30', '30% off')}
      <div style="text-align:center;margin:24px 0">
        <a href="${intakeUrl}" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
          Finish ${petName}'s Reading
        </a>
      </div>
    `,

    // ── POST-PURCHASE 1: Gifting (1 week after purchase) ───────────────
    post_purchase_1: `
      ${photo}
      <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
        Quick thought:
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        You know that friend who's completely obsessed with their pet? The one who shows you photos unprompted and talks about them like they're a person?
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        A Little Souls reading makes the kind of gift that actually makes someone cry (the good kind). You can send one to anyone and we'll create a beautiful gift certificate and deliver it straight to them.
      </p>
      ${giftBlock('GIFTLOVE30', '30% off a gift reading')}
      <div style="text-align:center;margin:24px 0">
        <a href="https://littlesouls.app/gift" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
          Send a Gift Reading
        </a>
      </div>
      ${rLink ? `<p style="color:#958779;font-size:13px;text-align:center;margin-top:12px">
        <a href="${rLink}" style="color:#c4a265;text-decoration:underline">Revisit ${petName}'s reading</a>
      </p>` : ''}
      ${soulSpeakBlock(ctx)}
    `,

    // ── POST-PURCHASE 2: Smart upsell (2 weeks) ───────────────────────
    // This dynamically shows horoscope OR SoulSpeak depending on what they already have
    post_purchase_2: `
      ${photo}
      ${!ctx.hasHoroscope ? `
        <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
          ${petName}'s stars don't stop moving.
        </p>
        <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
          Their soul reading captured who they are at their core. But the cosmos keeps shifting, and so does ${petName}'s energy, mood, and cosmic weather.
        </p>
        <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
          <strong>Weekly Cosmic Updates</strong>: a personalised mini-reading for ${petName} delivered to your inbox every Sunday morning. Their energy for the week, what to watch for, and how to make the most of your time together.
        </p>
        <div style="background:#faf4e8;border-radius:12px;padding:18px;border:1px solid #e8ddd0;margin:20px 0;text-align:center">
          <p style="color:#141210;font-size:18px;font-weight:600;margin:0 0 4px">$4.99/month</p>
          <p style="color:#958779;font-size:13px;margin:0">Cancel anytime. First week free.</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="https://littlesouls.app/weekly" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
            Start ${petName}'s Weekly Updates
          </a>
        </div>
      ` : `
        <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
          Have you tried talking to ${petName}?
        </p>
        <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
          SoulSpeak lets you have a real conversation with ${petName}'s soul, powered by their exact birth chart. Ask them anything. Hear them answer in their own voice. It's the part of Little Souls that surprises people the most.
        </p>
        ${soulSpeakBlock(ctx)}
      `}
      ${rLink ? `<p style="color:#958779;font-size:13px;text-align:center;margin-top:12px">
        <a href="${rLink}" style="color:#c4a265;text-decoration:underline">Revisit ${petName}'s reading</a>
      </p>` : ''}
      ${giftBlock('GIFTLOVE30', '30% off a gift reading')}
    `,

    // ── RE-ENGAGEMENT: Win-back (30 days, non-purchasers) ──────────────
    re_engagement: `
      ${photo}
      <p style="color:#141210;font-size:16px;line-height:1.8;margin:0 0 18px">
        We've been thinking about ${petName}.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        It's been a little while since you visited, and we just wanted you to know that ${petName}'s cosmic reading is still here whenever you're ready. No rush at all.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Every pet deserves to be truly understood. And ${petName} deserves someone who cares enough to look deeper. The fact that you're on this list tells us you're that person. So whenever the time feels right, we'd love to show you what the stars have been holding for ${petName}.
      </p>
      ${giftBlock('GIFTLOVE30', '30% off')}
      <div style="text-align:center;margin:24px 0">
        <a href="${intakeUrl}" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
          Come Back to ${petName}'s Reading
        </a>
      </div>
      <p style="color:#958779;font-size:13px;line-height:1.6;margin:0;text-align:center">
        No pressure at all. We're just glad ${petName} has someone like you.
      </p>
    `,
  };

  return templates[campaignType] || templates.welcome_1;
}

// ─── Email Wrapper (matches landing page palette) ───────────────────────────

function wrapEmailTemplate(content: string, petName: string, email: string): string {
  const unsubscribeUrl = `https://littlesouls.app/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#FFFDF5;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:28px">
      <p style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4a265;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        Little Souls
      </p>
    </div>

    <!-- Content Card -->
    <div style="background:#fff;border-radius:16px;border:1px solid #e8ddd0;padding:32px 24px;box-shadow:0 4px 20px rgba(35,40,30,0.06)">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px">
      <p style="color:#c4a265;font-size:12px;margin:0 0 8px;font-style:italic">
        With love and gratitude,<br>The Little Souls family
      </p>
      <p style="margin:0">
        <a href="${unsubscribeUrl}" style="color:#bfb2a3;font-size:11px;text-decoration:underline;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Send Helper ────────────────────────────────────────────────────────────

async function sendNurtureEmail(
  resend: InstanceType<typeof Resend>,
  supabase: ReturnType<typeof createClient>,
  subscriber: any,
  campaignType: string,
  now: Date,
): Promise<boolean> {
  const petName = subscriber.pet_name || "your pet";
  const campaignConfig = CAMPAIGNS[campaignType as keyof typeof CAMPAIGNS];
  if (!campaignConfig) return false;

  // Build context with report data for post-purchase emails
  const ctx: EmailContext = {
    petName,
    tier: subscriber.tier_purchased,
    reportId: subscriber.pet_report_id,
  };

  // For post-purchase emails, fetch report data to get photo and product info
  if (campaignType.startsWith('post_purchase') && subscriber.pet_report_id) {
    try {
      const { data: report } = await supabase
        .from('pet_reports')
        .select('pet_photo_url, includes_portrait')
        .eq('id', subscriber.pet_report_id)
        .single();

      if (report) {
        ctx.petPhotoUrl = report.pet_photo_url || undefined;
      }

      // Check if they have active horoscope subscription
      const { data: horoscope } = await supabase
        .from('horoscope_subscribers')
        .select('id')
        .eq('email', subscriber.email)
        .eq('is_active', true)
        .limit(1);

      ctx.hasHoroscope = !!(horoscope && horoscope.length > 0);

      // Check SoulSpeak credits
      const { data: credits } = await supabase
        .from('chat_credits')
        .select('credits_remaining, is_unlimited')
        .eq('order_id', subscriber.pet_report_id)
        .limit(1);

      ctx.hasSoulSpeak = !!(credits && credits.length > 0 && (credits[0].credits_remaining > 0 || credits[0].is_unlimited));
    } catch (e) {
      console.warn(`[EMAIL-NURTURE] Failed to fetch report data for ${subscriber.pet_report_id}:`, e);
    }
  }

  const subject = campaignConfig.subject(petName);
  const content = getEmailContent(campaignType, ctx);
  const html = wrapEmailTemplate(content, petName, subscriber.email);

  await resend.emails.send({
    from: "Little Souls <hello@littlesouls.app>",
    to: [subscriber.email],
    subject,
    html,
  });

  await supabase
    .from("email_subscribers")
    .update({
      journey_stage: campaignConfig.nextStage,
      last_email_sent_at: now.toISOString(),
      last_email_type: campaignType,
      emails_sent: (subscriber.emails_sent || 0) + 1,
    })
    .eq("id", subscriber.id);

  await supabase.from("email_campaigns").insert({
    subscriber_id: subscriber.id,
    campaign_type: campaignType,
    subject,
    content_preview: subject,
    ai_generated: false,
  });

  return true;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    console.log("[EMAIL-NURTURE] Starting nurture processing...");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const now = new Date();
    let emailsSent = 0;
    const errors: string[] = [];

    // ── 1. Welcome sequence for new leads ────────────────────────────
    const { data: newLeads } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "new_lead")
      .eq("is_subscribed", true)
      .is("last_email_sent_at", null)
      .lt("created_at", new Date(now.getTime() - 30 * 60 * 1000).toISOString());

    console.log(`[EMAIL-NURTURE] Found ${newLeads?.length || 0} new leads`);

    for (const s of newLeads || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "welcome_1", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 2. Welcome 2 (24 hours after welcome 1) ─────────────────────
    const { data: welcome2 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "welcome_2_pending")
      .eq("is_subscribed", true)
      .lt("last_email_sent_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    for (const s of welcome2 || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "welcome_2", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 3. Welcome 3 (72 hours after welcome 2) ─────────────────────
    const { data: welcome3 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "welcome_3_pending")
      .eq("is_subscribed", true)
      .lt("last_email_sent_at", new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString());

    for (const s of welcome3 || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "welcome_3", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 4. Abandoned carts ───────────────────────────────────────────
    const { data: abandoned } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "intake_started")
      .eq("is_subscribed", true)
      .lt("intake_started_at", new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString())
      .or(`last_email_sent_at.is.null,last_email_sent_at.lt.${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}`);

    console.log(`[EMAIL-NURTURE] Found ${abandoned?.length || 0} abandoned carts`);

    for (const s of abandoned || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "abandoned_cart", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 5. Post-purchase 1: Gifting (1 week after purchase) ──────────
    const { data: postPurchase1 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "purchased")
      .eq("is_subscribed", true)
      .lt("purchase_completed_at", new Date(now.getTime() - 168 * 60 * 60 * 1000).toISOString());

    console.log(`[EMAIL-NURTURE] Found ${postPurchase1?.length || 0} post-purchase week 1`);

    for (const s of postPurchase1 || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "post_purchase_1", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 6. Post-purchase 2: Smart upsell (2 weeks) ──────────────────
    const { data: postPurchase2 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "post_purchase_2_pending")
      .eq("is_subscribed", true)
      .lt("last_email_sent_at", new Date(now.getTime() - 168 * 60 * 60 * 1000).toISOString());

    for (const s of postPurchase2 || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "post_purchase_2", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 7. Re-engagement (30 days of inactivity, non-purchasers) ────
    const { data: reEngagement } = await supabase
      .from("email_subscribers")
      .select("*")
      .in("journey_stage", ["nurtured", "abandoned_reminded"])
      .eq("is_subscribed", true)
      .is("purchase_completed_at", null)
      .lt("last_email_sent_at", new Date(now.getTime() - 720 * 60 * 60 * 1000).toISOString());

    for (const s of reEngagement || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "re_engagement", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    console.log(`[EMAIL-NURTURE] Complete. Sent ${emailsSent} emails. Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ success: true, emailsSent, errors: errors.length }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[EMAIL-NURTURE] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 500 }
    );
  }
});
