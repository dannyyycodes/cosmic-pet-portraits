import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Campaign Configurations ────────────────────────────────────────────────

const CAMPAIGNS = {
  welcome_1: {
    delayHours: 0.5,
    subject: (petName: string) => `${petName}'s stars are waiting`,
    nextStage: 'welcome_2_pending',
  },
  welcome_2: {
    delayHours: 24,
    subject: (petName: string) => `The thing about ${petName} that most people miss`,
    nextStage: 'welcome_3_pending',
  },
  welcome_3: {
    delayHours: 72,
    subject: (petName: string) => `One last thing about ${petName}`,
    nextStage: 'nurtured',
  },
  abandoned_cart: {
    delayHours: 3,
    subject: (_petName: string) => `You were so close`,
    nextStage: 'abandoned_reminded',
  },
  post_purchase_1: {
    delayHours: 24,
    subject: (petName: string) => `How to get the most from ${petName}'s reading`,
    nextStage: 'post_purchase_2_pending',
  },
  post_purchase_2: {
    delayHours: 168,
    subject: (petName: string) => `Someone in your life needs to see this`,
    nextStage: 'post_purchase_3_pending',
  },
  post_purchase_3: {
    delayHours: 336,
    subject: (petName: string) => `${petName}'s weekly cosmic updates`,
    nextStage: 'nurtured',
  },
  re_engagement: {
    delayHours: 720,
    subject: (petName: string) => `We still think about ${petName}`,
    nextStage: 'nurtured',
  },
};

// ─── Handcrafted Email Templates ────────────────────────────────────────────

function getEmailContent(campaignType: string, petName: string, _tier?: string): string {
  const intakeUrl = "https://littlesouls.co/intake";

  const templates: Record<string, string> = {
    // ── WELCOME 1: Gentle intro (30 mins after email capture) ────────
    welcome_1: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        Hi there,
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        You started something lovely today — a cosmic reading for ${petName}. We just wanted to say: the fact that you care enough to understand your pet on this level says everything about the kind of person you are.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        ${petName}'s full reading takes about 3 minutes to set up. We'll look at the exact moment they were born and map out who they really are — their personality, their quirks, the way they love, and all the things you've always kind of known but never had words for.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        Your progress is saved. Pick up whenever you're ready.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Continue ${petName}'s Reading
        </a>
      </div>
    `,

    // ── WELCOME 2: Build curiosity (24 hours later) ──────────────────
    welcome_2: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        Can we tell you something about ${petName}?
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        Every animal is born under a specific arrangement of stars. And just like with people, those placements shape who they are in ways that are almost uncanny once you see them.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        That thing ${petName} does that makes you laugh? The way they react when you're sad? The little habits that feel so specifically <em>them</em>? There's usually a reason written in their chart.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        We'd love to show you what we find.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Get ${petName}'s Reading
        </a>
      </div>
    `,

    // ── WELCOME 3: Gentle last nudge with discount (72 hours) ────────
    welcome_3: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        Last one from us about this, we promise.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        We know life gets busy. But we also know that the bond between you and ${petName} is the kind of thing worth pausing for.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        If you'd like to come back to it, we've set aside a small thank-you for being here:
      </p>
      <div style="text-align: center; background: #faf6f1; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
        <p style="color: #c4a265; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          15% off ${petName}'s reading
        </p>
        <p style="color: #3d2f2a; font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace;">
          COSMIC15
        </p>
      </div>
      <p style="color: #7a6a60; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
        No rush, no pressure. ${petName} will still be a star whenever you're ready.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Use Code & Start Reading
        </a>
      </div>
    `,

    // ── ABANDONED CART: Warm nudge (3 hours after leaving intake) ─────
    abandoned_cart: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        Hey — you were almost there.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        You got pretty far setting up ${petName}'s cosmic reading, and we saved everything so you can pick up exactly where you left off. No starting over.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        We think you're going to love what the stars have to say about ${petName}. Most people tell us it's almost eerie how accurate it is.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Finish ${petName}'s Reading
        </a>
      </div>
    `,

    // ── POST-PURCHASE 1: Thank you + tips (24 hours after purchase) ──
    post_purchase_1: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        We hope ${petName}'s reading made you smile.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        A few things that people love doing with their reading:
      </p>
      <div style="padding-left: 16px; margin: 0 0 20px 0;">
        <p style="color: #5a4a42; font-size: 14px; line-height: 2; margin: 0;">
          <span style="color: #c4a265;">&#8226;</span> Read it out loud to ${petName} (yes, really — they respond to the energy)<br>
          <span style="color: #c4a265;">&#8226;</span> Share the shareable card on social media<br>
          <span style="color: #c4a265;">&#8226;</span> Screenshot the parts that feel most "them" and send to a friend<br>
          <span style="color: #c4a265;">&#8226;</span> Come back to the letter at the end whenever you need it
        </p>
      </div>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        Thank you for trusting us with something so personal. The bond between you and ${petName} is clearly something special, and it was an honour to put it into words.
      </p>
      <p style="color: #7a6a60; font-size: 14px; line-height: 1.7; margin: 0;">
        If anything in the reading surprised you or felt spot-on, we'd love to hear about it. Just reply to this email.
      </p>
    `,

    // ── POST-PURCHASE 2: Gifting nudge (1 week after purchase) ───────
    post_purchase_2: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        Quick thought:
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        You know that friend who's obsessed with their pet? The one who shows you photos unprompted and talks about them like they're a person? (We love those people.)
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        A Little Souls reading makes the kind of gift that actually makes someone cry (the good kind). You can send one to anyone — we'll create a beautiful gift certificate and deliver it to them.
      </p>
      <div style="text-align: center; background: #faf6f1; border-radius: 12px; padding: 16px; margin: 0 0 24px 0;">
        <p style="color: #c4a265; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          As a thank you, here's 10% off a gift
        </p>
        <p style="color: #3d2f2a; font-size: 22px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace;">
          GIFTLOVE
        </p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://littlesouls.co/gift" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Send a Gift Reading
        </a>
      </div>
    `,

    // ── POST-PURCHASE 3: Weekly horoscope upsell (2 weeks) ──────────
    post_purchase_3: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        ${petName}'s stars don't stop moving.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        Their soul report captured who they are at their core. But the cosmos keeps shifting — and so does ${petName}'s energy, mood, and cosmic weather.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        We've started offering <strong>Weekly Cosmic Updates</strong> — a personalised mini-reading for ${petName} delivered to your inbox every Monday. It covers their energy for the week, what to watch for, and how to make the most of your time together.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        It's like a horoscope, but actually about <em>your</em> pet, based on <em>their</em> actual chart.
      </p>
      <div style="text-align: center; background: #faf6f1; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="color: #3d2f2a; font-size: 18px; font-weight: 600; margin: 0 0 4px 0;">
          $4.99/month
        </p>
        <p style="color: #7a6a60; font-size: 13px; margin: 0;">
          Cancel anytime. First week free.
        </p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://littlesouls.co/weekly" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Start ${petName}'s Weekly Updates
        </a>
      </div>
    `,

    // ── RE-ENGAGEMENT: Warm return (30 days later) ───────────────────
    re_engagement: `
      <p style="color: #3d2f2a; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
        It's been a little while, and we just wanted to check in.
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        We still think about ${petName} sometimes. (Occupational hazard of running a pet astrology company — we get attached.)
      </p>
      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
        If you ever want to come back and explore what the stars say about ${petName}, the door is always open. And because we genuinely want you to experience it, here's a little something:
      </p>
      <div style="text-align: center; background: #faf6f1; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
        <p style="color: #c4a265; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          20% off ${petName}'s reading
        </p>
        <p style="color: #3d2f2a; font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace;">
          WELCOME_BACK
        </p>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${intakeUrl}" style="display: inline-block; background: #3d2f2a; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 50px; font-weight: 600; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          Come Back to ${petName}'s Reading
        </a>
      </div>
      <p style="color: #b8a99e; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
        No pressure at all. We're just glad ${petName} has someone like you.
      </p>
    `,
  };

  return templates[campaignType] || templates.welcome_1;
}

// ─── Email Wrapper ──────────────────────────────────────────────────────────

function wrapEmailTemplate(content: string, petName: string, email: string): string {
  const unsubscribeUrl = `https://littlesouls.co/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #faf6f1; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 24px; margin: 0 0 6px 0;">🐾</p>
      <p style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <!-- Content Card -->
    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 36px 28px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #d4c8bc; font-size: 11px; margin: 0 0 8px 0; letter-spacing: 1px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #b8a99e; font-size: 11px; text-decoration: underline; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">Unsubscribe</a>
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

  const subject = campaignConfig.subject(petName);
  const content = getEmailContent(campaignType, petName, subscriber.tier_purchased);
  const html = wrapEmailTemplate(content, petName, subscriber.email);

  await resend.emails.send({
    from: "Little Souls <hello@littlesouls.co>",
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
    return new Response(null, { headers: corsHeaders });
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

    // ── 5. Post-purchase 1 (24 hours after purchase) ─────────────────
    const { data: postPurchase1 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "purchased")
      .eq("is_subscribed", true)
      .lt("purchase_completed_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    console.log(`[EMAIL-NURTURE] Found ${postPurchase1?.length || 0} post-purchase`);

    for (const s of postPurchase1 || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "post_purchase_1", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 6. Post-purchase 2 (1 week after purchase) ───────────────────
    const { data: postPurchase2 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "post_purchase_2_pending")
      .eq("is_subscribed", true)
      .lt("last_email_sent_at", new Date(now.getTime() - 144 * 60 * 60 * 1000).toISOString());

    for (const s of postPurchase2 || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "post_purchase_2", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 7. Post-purchase 3: Weekly horoscope upsell (2 weeks) ────────
    const { data: postPurchase3 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "post_purchase_3_pending")
      .eq("is_subscribed", true)
      .lt("last_email_sent_at", new Date(now.getTime() - 168 * 60 * 60 * 1000).toISOString());

    for (const s of postPurchase3 || []) {
      try {
        if (await sendNurtureEmail(resend, supabase, s, "post_purchase_3", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 8. Re-engagement (30 days of inactivity) ─────────────────────
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
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[EMAIL-NURTURE] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
