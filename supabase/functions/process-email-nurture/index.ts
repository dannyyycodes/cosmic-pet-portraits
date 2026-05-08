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

  // ──────────────────────────────────────────────────────────────────
  // Pawtrait (canvas) lifecycle. Driven by rows in pawtrait_touchpoints
  // (status='pending', scheduled_for <= now()) — NOT by the journey_stage
  // state machine. Subjects use first-name-based copy so the email feels
  // like it comes from someone who knows the pet, not a marketing system.
  // ──────────────────────────────────────────────────────────────────

  // Pre-purchase nurture (lead joined via pawtraits intake/upload)
  pawtrait_welcome_1: {
    delayHours: 0,
    subject: (petName: string) => `We made ${petName} something`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_welcome_2: {
    delayHours: 0,
    subject: (petName: string) => `Hanging ${petName} on the wall`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_welcome_3: {
    delayHours: 0,
    subject: (petName: string) => `One last thing about ${petName}`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_abandoned_cart: {
    delayHours: 0,
    subject: (petName: string) => `${petName}'s portrait is still in your cart`,
    nextStage: 'pawtrait_nurtured',
  },

  // Post-purchase confirmation + fulfilment
  pawtrait_purchase_confirm: {
    delayHours: 0,
    subject: (petName: string) => `${petName} is being made`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_shipped: {
    delayHours: 0,
    subject: (petName: string) => `${petName}'s portrait is on its way`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_delivered: {
    delayHours: 0,
    subject: (petName: string) => `${petName}'s on the wall now?`,
    nextStage: 'pawtrait_nurtured',
  },

  // Post-delivery loops
  pawtrait_ugc_reorder: {
    delayHours: 0,
    subject: (petName: string) => `Show us where ${petName} ended up`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_winback_30: {
    delayHours: 0,
    subject: (petName: string) => `Another corner for ${petName}?`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_winback_60: {
    delayHours: 0,
    subject: (petName: string) => `${petName} would suit the bedroom too`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_winback_90: {
    delayHours: 0,
    subject: (petName: string) => `A little gift, on us`,
    nextStage: 'pawtrait_nurtured',
  },
  pawtrait_sub_save: {
    delayHours: 0,
    subject: (petName: string) => `Before you go — one thought about ${petName}`,
    nextStage: 'pawtrait_nurtured',
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

  // Pawtrait-specific fields. portraitImageUrl is the rendered portrait
  // (canvas artwork, not the source pet photo) and shows inline in
  // post-purchase, shipping, and reorder emails. orderId / trackingUrl
  // are surfaced when present in the touchpoint metadata.
  portraitImageUrl?: string;
  orderId?: string;
  trackingUrl?: string;
  productTitle?: string;
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

// ─── Pawtrait helpers ──────────────────────────────────────────────────────
//
// Same colour palette + Georgia serif as the reading flow, but copy is
// portrait/canvas shaped — never references readings, AI, generation, or
// the cosmic product. The rendered portrait image (when present in the
// touchpoint metadata) sits in a circular gold-bordered frame above the
// body, mirroring the pet-photo treatment used elsewhere.

const PAWTRAITS_BASE = "https://littlesouls.app/pawtraits";

function pawtraitImageHtml(ctx: EmailContext): string {
  // Square framed treatment for the rendered portrait — bigger than the
  // round pet-photo because this IS the product the email is about.
  if (!ctx.portraitImageUrl) return "";
  return `
    <div style="text-align:center;margin:0 0 24px">
      <img src="${ctx.portraitImageUrl}" alt="${ctx.petName}'s portrait" style="max-width:240px;width:100%;height:auto;border-radius:8px;border:3px solid #c4a265;box-shadow:0 8px 28px rgba(35,40,30,0.12)" />
    </div>`;
}

function pawtraitPetPhotoCircle(ctx: EmailContext): string {
  // Circular pet-photo frame for pre-purchase emails (we don't have the
  // rendered portrait yet, so we lean on the source photo to keep the
  // email feeling personal).
  if (!ctx.petPhotoUrl) return "";
  return `
    <div style="text-align:center;margin:0 0 20px">
      <img src="${ctx.petPhotoUrl}" alt="${ctx.petName}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #c4a265;box-shadow:0 0 0 5px rgba(196,162,101,0.1)" />
    </div>`;
}

function pawtraitCta(href: string, label: string): string {
  return `
    <div style="text-align:center;margin:24px 0">
      <a href="${href}" style="display:inline-block;background:#bf524a;color:#fff;text-decoration:none;padding:14px 40px;border-radius:50px;font-weight:600;font-size:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 4px 16px rgba(191,82,74,0.2)">
        ${label}
      </a>
    </div>`;
}

function pawtraitTrackingBlock(ctx: EmailContext): string {
  if (!ctx.trackingUrl) return "";
  return `
    <div style="background:#faf4e8;border-radius:12px;padding:18px;border:1px solid #e8ddd0;margin:20px 0;text-align:center">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4a265;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        Tracking
      </p>
      <a href="${ctx.trackingUrl}" style="color:#141210;font-size:14px;font-weight:600;text-decoration:underline">
        Follow ${ctx.petName}'s journey
      </a>
    </div>`;
}

function getEmailContent(campaignType: string, ctx: EmailContext): string {
  const { petName } = ctx;
  const intakeUrl = "https://littlesouls.app/intake";
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

    // ──────────────────────────────────────────────────────────────────
    // PAWTRAIT (canvas) lifecycle templates. Sacred copy rules apply:
    //   • Never "AI", "generated", "report"
    //   • Use "portrait" / "canvas" / "wall art"
    //   • First-name-based, honour-the-pet voice
    //   • Inline portrait image where one exists (post-purchase onward)
    //   • Pre-purchase uses circular pet-photo treatment
    // ──────────────────────────────────────────────────────────────────

    // ── PAWTRAIT WELCOME 1 — first impression after upload ─────────────
    pawtrait_welcome_1: `
      ${pawtraitPetPhotoCircle(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        We made ${petName} something.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We took a long look at ${petName} and painted them. Real brush work, real care, the kind of portrait you'd actually want hanging in your house. No filters, no novelty. Just ${petName} — the way you see them.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Pick a size, pick a frame, and we'll print it on archival canvas and ship it to your door. Most people end up putting it somewhere they'll see every day.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}`, `See ${petName}'s portrait`)}
    `,

    // ── PAWTRAIT WELCOME 2 — show the wall ─────────────────────────────
    pawtrait_welcome_2: `
      ${pawtraitPetPhotoCircle(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        Hanging ${petName} on the wall.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        There's something about a real portrait of your pet that a phone photo can never quite do. It says they belong here. They're part of the home. They're family.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Above the sofa. By the front door. In the hallway where everyone walks past. Wherever you put ${petName}, that spot becomes a little warmer. We've heard that from a lot of people now.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}`, `Choose a size for ${petName}`)}
    `,

    // ── PAWTRAIT WELCOME 3 — last gentle nudge ─────────────────────────
    pawtrait_welcome_3: `
      ${pawtraitPetPhotoCircle(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        One last thing about ${petName}.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We know inboxes get full and life gets in the way. We won't keep nudging. But ${petName}'s portrait is sitting there, ready, whenever you want it.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Free shipping is on right now, and the canvases come framed and ready to hang straight out of the box. Takes about a week to arrive.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}`, `Bring ${petName} home`)}
    `,

    // ── PAWTRAIT ABANDONED CART ────────────────────────────────────────
    pawtrait_abandoned_cart: `
      ${pawtraitImageHtml(ctx) || pawtraitPetPhotoCircle(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        ${petName}'s portrait is still in your cart.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We've kept everything saved exactly how you left it — size, frame, all of it. No need to start over.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Each one is printed when you order, so we wait until you're sure. Whenever you're ready, ${petName} is ready too.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}/cart`, `Finish checkout`)}
    `,

    // ── PAWTRAIT PURCHASE CONFIRM (sent immediately on Stripe webhook) ─
    pawtrait_purchase_confirm: `
      ${pawtraitImageHtml(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        ${petName} is being made.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Thank you. Truly. ${petName}'s portrait has gone to print and we'll ship it to you as soon as the canvas is dry and the frame is on.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We'll email you again the moment it ships, with tracking. Most orders arrive within 7 to 10 days.
      </p>
      ${ctx.orderId ? `<p style="color:#958779;font-size:13px;text-align:center;margin:20px 0 0">
        Order reference: <strong style="color:#5a4a42">${ctx.orderId}</strong>
      </p>` : ''}
    `,

    // ── PAWTRAIT SHIPPED ───────────────────────────────────────────────
    pawtrait_shipped: `
      ${pawtraitImageHtml(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        ${petName}'s portrait is on its way.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Just a quick note — ${petName} has shipped and is heading to you now. The canvas comes framed, wrapped in protective foam, and ready to go straight on the wall.
      </p>
      ${pawtraitTrackingBlock(ctx)}
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:18px 0 0">
        We hope it lands the way you imagined.
      </p>
    `,

    // ── PAWTRAIT DELIVERED ─────────────────────────────────────────────
    pawtrait_delivered: `
      ${pawtraitImageHtml(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        ${petName}'s on the wall now?
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Tracking says ${petName}'s portrait was delivered. We hope the canvas turned out as warm in person as it looked on screen.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        If anything's not quite right with the print, the frame, or the delivery — just hit reply. We make these one at a time and we want this one to be right.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}/share?ref=${encodeURIComponent(ctx.orderId || '')}`, `Show us where ${petName} ended up`)}
    `,

    // ── PAWTRAIT UGC + REORDER (post-delivery social loop) ─────────────
    pawtrait_ugc_reorder: `
      ${pawtraitImageHtml(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        Show us where ${petName} ended up.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We'd love to see ${petName} on the wall. Tag us, reply with a photo, or just send it our way — we genuinely look at every one. It's the best part of the week, honestly.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        And if you've been thinking about a second canvas — a different size, another room, or another pet in the family — we've kept ${petName}'s artwork on file so the next one is one click.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}/library`, `Order another print`)}
    `,

    // ── PAWTRAIT WIN-BACK 30 ───────────────────────────────────────────
    pawtrait_winback_30: `
      ${pawtraitImageHtml(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        Another corner for ${petName}?
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        Hope the portrait's settled in well. If a second canvas crossed your mind — for the office, the bedroom, the kitchen, a gift for someone who loves ${petName} too — we've kept the artwork ready to print.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}/library`, `Print ${petName} again`)}
    `,

    // ── PAWTRAIT WIN-BACK 60 ───────────────────────────────────────────
    pawtrait_winback_60: `
      ${pawtraitImageHtml(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        ${petName} would suit the bedroom too.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        A smaller canvas works beautifully on a bedside table or above a desk. Same painting, smaller frame, same warm presence. Some people like a set: one big in the living room, one small somewhere quieter.
      </p>
      ${pawtraitCta(`${PAWTRAITS_BASE}/library`, `See sizes for ${petName}`)}
    `,

    // ── PAWTRAIT WIN-BACK 90 — gift code ───────────────────────────────
    pawtrait_winback_90: `
      ${pawtraitImageHtml(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        A little gift, on us.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        It's been a few months since ${petName}'s portrait went up. We'd love to see another one in your home — or in someone else's, if there's a gift in there.
      </p>
      <div style="background:#faf4e8;border-radius:12px;padding:18px;border:1px solid #e8ddd0;margin:20px 0;text-align:center">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4a265;margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
          20% off your next canvas
        </p>
        <p style="color:#141210;font-size:22px;font-weight:700;letter-spacing:4px;margin:0;font-family:'SF Mono',Monaco,Consolas,monospace">
          PAWTRAIT20
        </p>
      </div>
      ${pawtraitCta(`${PAWTRAITS_BASE}/library`, `Use the code`)}
    `,

    // ── PAWTRAIT SUB-SAVE (cancel intent → "stay" offer) ───────────────
    pawtrait_sub_save: `
      ${pawtraitImageHtml(ctx) || pawtraitPetPhotoCircle(ctx)}
      <p style="color:#141210;font-size:18px;line-height:1.6;margin:0 0 18px;font-weight:600">
        Before you go — one thought about ${petName}.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        We saw you're thinking about cancelling, and that's completely fine. Before you do, we wanted to leave the door open.
      </p>
      <p style="color:#5a4a42;font-size:15px;line-height:1.8;margin:0 0 18px">
        ${petName}'s artwork stays in your account either way. Whenever you want to reorder a canvas, a smaller print, or a different size, the painting is there. No charge to keep it on file.
      </p>
      <div style="background:#faf4e8;border-radius:12px;padding:18px;border:1px solid #e8ddd0;margin:20px 0;text-align:center">
        <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4a265;margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
          25% off if you stay
        </p>
        <p style="color:#141210;font-size:22px;font-weight:700;letter-spacing:4px;margin:0;font-family:'SF Mono',Monaco,Consolas,monospace">
          STAYWITHUS
        </p>
      </div>
      ${pawtraitCta(`${PAWTRAITS_BASE}/account`, `Manage subscription`)}
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

// ─── Pawtrait plain-text bodies ────────────────────────────────────────────
//
// Resend recommends a plain-text alternative for inbox-placement and
// accessibility. The pawtrait sender attaches one for every pawtrait_*
// campaign — we strip-and-remap the HTML rather than re-write twice.

function getPawtraitPlainText(campaignType: string, ctx: EmailContext): string {
  const { petName } = ctx;
  const orderRef = ctx.orderId ? `\n\nOrder reference: ${ctx.orderId}` : "";
  const tracking = ctx.trackingUrl ? `\n\nTracking: ${ctx.trackingUrl}` : "";

  const bodies: Record<string, string> = {
    pawtrait_welcome_1:
      `We made ${petName} something.\n\nWe took a long look at ${petName} and painted them. Real brush work, real care, the kind of portrait you'd actually want hanging in your house.\n\nPick a size, pick a frame, and we'll print it on archival canvas and ship it to your door.\n\nSee ${petName}'s portrait: ${PAWTRAITS_BASE}`,

    pawtrait_welcome_2:
      `Hanging ${petName} on the wall.\n\nThere's something about a real portrait of your pet that a phone photo can never quite do. It says they belong here. They're family.\n\nChoose a size for ${petName}: ${PAWTRAITS_BASE}`,

    pawtrait_welcome_3:
      `One last thing about ${petName}.\n\nWe won't keep nudging. But ${petName}'s portrait is sitting there, ready, whenever you want it.\n\nFree shipping is on right now, and the canvases come framed and ready to hang.\n\nBring ${petName} home: ${PAWTRAITS_BASE}`,

    pawtrait_abandoned_cart:
      `${petName}'s portrait is still in your cart.\n\nWe've kept everything saved exactly how you left it — size, frame, all of it.\n\nFinish checkout: ${PAWTRAITS_BASE}/cart`,

    pawtrait_purchase_confirm:
      `${petName} is being made.\n\nThank you. ${petName}'s portrait has gone to print and we'll ship it as soon as the canvas is dry and the frame is on.\n\nWe'll email you again the moment it ships, with tracking. Most orders arrive within 7 to 10 days.${orderRef}`,

    pawtrait_shipped:
      `${petName}'s portrait is on its way.\n\n${petName} has shipped and is heading to you now. The canvas comes framed, wrapped in protective foam, and ready to go straight on the wall.${tracking}\n\nWe hope it lands the way you imagined.`,

    pawtrait_delivered:
      `${petName}'s on the wall now?\n\nTracking says ${petName}'s portrait was delivered. We hope the canvas turned out as warm in person as it looked on screen.\n\nIf anything's not quite right with the print, the frame, or the delivery — just hit reply.\n\nShow us where ${petName} ended up: ${PAWTRAITS_BASE}/share`,

    pawtrait_ugc_reorder:
      `Show us where ${petName} ended up.\n\nWe'd love to see ${petName} on the wall. Tag us, reply with a photo, or just send it our way.\n\nAnd if you've been thinking about a second canvas, we've kept ${petName}'s artwork on file.\n\nOrder another print: ${PAWTRAITS_BASE}/library`,

    pawtrait_winback_30:
      `Another corner for ${petName}?\n\nIf a second canvas crossed your mind — for the office, the bedroom, a gift — we've kept the artwork ready to print.\n\nPrint ${petName} again: ${PAWTRAITS_BASE}/library`,

    pawtrait_winback_60:
      `${petName} would suit the bedroom too.\n\nA smaller canvas works beautifully on a bedside table or above a desk. Same painting, smaller frame, same warm presence.\n\nSee sizes for ${petName}: ${PAWTRAITS_BASE}/library`,

    pawtrait_winback_90:
      `A little gift, on us.\n\nIt's been a few months since ${petName}'s portrait went up. We'd love to see another one in your home — or in someone else's.\n\nUse code PAWTRAIT20 for 20% off your next canvas.\n\n${PAWTRAITS_BASE}/library`,

    pawtrait_sub_save:
      `Before you go — one thought about ${petName}.\n\n${petName}'s artwork stays in your account either way. Whenever you want to reorder a canvas, the painting is there.\n\nUse code STAYWITHUS for 25% off if you stay.\n\nManage subscription: ${PAWTRAITS_BASE}/account`,
  };

  return bodies[campaignType] || bodies.pawtrait_welcome_1;
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

// ─── Memorial exclusion helper ──────────────────────────────────────────────
// Memorial customers must NEVER receive post-purchase gifting, upsell, or
// re-engagement emails — they are grieving. Their own cadence is handled by
// memorial_touchpoints (30d + annual) and the dedicated memorial 24h check-in.
// Returns true if the subscriber is tied to a memorial reading and should be
// skipped for this campaign.
async function isMemorialSubscriber(
  supabase: ReturnType<typeof createClient>,
  subscriber: { pet_report_id?: string | null },
): Promise<boolean> {
  const reportId = subscriber.pet_report_id;
  if (!reportId) return false;
  try {
    const { data } = await supabase
      .from("pet_reports")
      .select("occasion_mode")
      .eq("id", reportId)
      .maybeSingle();
    return data?.occasion_mode === "memorial";
  } catch (e) {
    console.warn(`[EMAIL-NURTURE] memorial-check failed for report ${reportId}:`, e);
    return false; // fail open (send) rather than block a legitimate customer
  }
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

// ─── Pawtrait sender ───────────────────────────────────────────────────────
//
// Pawtrait emails are driven by rows in public.pawtrait_touchpoints (status
// 'pending', scheduled_for <= now()) — NOT by the journey_stage state
// machine on email_subscribers. The Stripe webhook + Gelato webhook + the
// pawtraits intake form INSERT rows here; this function reads + sends.
//
// We still log to email_campaigns so admin reporting picks them up, and we
// write a row into email_subscribers (product_line='portrait') for any
// new email we haven't seen, so unsubscribe/audit paths share infra.

interface PawtraitTouchpointRow {
  id: string;
  account_id: string | null;
  email: string;
  pet_name: string | null;
  touchpoint_type: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  metadata: Record<string, unknown> | null;
}

async function sendPawtraitEmail(
  resend: InstanceType<typeof Resend>,
  supabase: ReturnType<typeof createClient>,
  row: PawtraitTouchpointRow,
): Promise<{ ok: boolean; reason?: string }> {
  const campaignType = row.touchpoint_type.startsWith("pawtrait_")
    ? row.touchpoint_type
    : `pawtrait_${row.touchpoint_type}`;

  const campaign = CAMPAIGNS[campaignType as keyof typeof CAMPAIGNS];
  if (!campaign) {
    return { ok: false, reason: `unknown campaign ${campaignType}` };
  }

  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const petName = row.pet_name || (meta.pet_name as string | undefined) || "your pet";

  const ctx: EmailContext = {
    petName,
    petPhotoUrl: meta.pet_photo_url as string | undefined,
    portraitImageUrl: meta.portrait_image_url as string | undefined,
    orderId: meta.order_id as string | undefined,
    trackingUrl: meta.tracking_url as string | undefined,
    productTitle: meta.product_title as string | undefined,
  };

  const subject = campaign.subject(petName);
  const html = wrapEmailTemplate(getEmailContent(campaignType, ctx), petName, row.email);
  const text = getPawtraitPlainText(campaignType, ctx);

  const result = await resend.emails.send({
    from: "Little Souls <hello@littlesouls.app>",
    to: [row.email],
    subject,
    html,
    text,
    headers: { "X-Entity-Ref-ID": row.id },
  });

  const sendError = (result as { error?: unknown }).error;
  if (sendError) {
    const msg = typeof sendError === "string" ? sendError : JSON.stringify(sendError);
    await supabase
      .from("pawtrait_touchpoints")
      .update({
        status: "error",
        metadata: { ...meta, last_error: msg, last_error_at: new Date().toISOString() },
      })
      .eq("id", row.id);
    return { ok: false, reason: msg };
  }

  // Mark sent.
  await supabase
    .from("pawtrait_touchpoints")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  // Mirror into email_campaigns + ensure subscriber row exists with
  // product_line='portrait' so admin reports + unsubscribe still work.
  try {
    const { data: existingSub } = await supabase
      .from("email_subscribers")
      .select("id")
      .eq("email", row.email)
      .maybeSingle();

    let subscriberId = (existingSub as { id?: string } | null)?.id;
    if (!subscriberId) {
      const { data: inserted } = await supabase
        .from("email_subscribers")
        .insert({
          email: row.email,
          pet_name: row.pet_name,
          product_line: "portrait",
          journey_stage: "pawtrait_nurtured",
          source: "pawtrait",
          last_email_sent_at: new Date().toISOString(),
          last_email_type: campaignType,
          emails_sent: 1,
        })
        .select("id")
        .single();
      subscriberId = (inserted as { id?: string } | null)?.id;
    } else {
      await supabase
        .from("email_subscribers")
        .update({
          last_email_sent_at: new Date().toISOString(),
          last_email_type: campaignType,
        })
        .eq("id", subscriberId);
    }

    if (subscriberId) {
      await supabase.from("email_campaigns").insert({
        subscriber_id: subscriberId,
        campaign_type: campaignType,
        subject,
        content_preview: subject,
        ai_generated: false,
      });
    }
  } catch (e) {
    console.warn(`[EMAIL-NURTURE] pawtrait subscriber-sync failed for ${row.email}:`, e);
  }

  return { ok: true };
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
    // Scope to product_line='reading' so canvas/portrait subscribers are
    // never picked up by the soul-reading welcome cadence (they have their
    // own pawtrait_welcome_1/2/3 driven from pawtrait_touchpoints).
    const { data: newLeads } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "new_lead")
      .eq("is_subscribed", true)
      .eq("product_line", "reading")
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
      .eq("product_line", "reading")
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
      .eq("product_line", "reading")
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
      .eq("product_line", "reading")
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
      .eq("product_line", "reading")
      .lt("purchase_completed_at", new Date(now.getTime() - 168 * 60 * 60 * 1000).toISOString());

    console.log(`[EMAIL-NURTURE] Found ${postPurchase1?.length || 0} post-purchase week 1`);

    for (const s of postPurchase1 || []) {
      try {
        // Memorial customers must not receive the gifting/referral pitch.
        if (await isMemorialSubscriber(supabase, s)) {
          console.log(`[EMAIL-NURTURE] Skipping post_purchase_1 for memorial subscriber ${s.email}`);
          continue;
        }
        if (await sendNurtureEmail(resend, supabase, s, "post_purchase_1", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 6. Post-purchase 2: Smart upsell (2 weeks) ──────────────────
    const { data: postPurchase2 } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "post_purchase_2_pending")
      .eq("is_subscribed", true)
      .eq("product_line", "reading")
      .lt("last_email_sent_at", new Date(now.getTime() - 168 * 60 * 60 * 1000).toISOString());

    for (const s of postPurchase2 || []) {
      try {
        // Memorial customers must not receive the horoscope/SoulSpeak upsell.
        if (await isMemorialSubscriber(supabase, s)) {
          console.log(`[EMAIL-NURTURE] Skipping post_purchase_2 for memorial subscriber ${s.email}`);
          continue;
        }
        if (await sendNurtureEmail(resend, supabase, s, "post_purchase_2", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 7. Re-engagement (30 days of inactivity, non-purchasers) ────
    const { data: reEngagement } = await supabase
      .from("email_subscribers")
      .select("*")
      .in("journey_stage", ["nurtured", "abandoned_reminded"])
      .eq("is_subscribed", true)
      .eq("product_line", "reading")
      .is("purchase_completed_at", null)
      .lt("last_email_sent_at", new Date(now.getTime() - 720 * 60 * 60 * 1000).toISOString());

    for (const s of reEngagement || []) {
      try {
        // Memorial customers must not receive a "come back for another reading" nudge.
        if (await isMemorialSubscriber(supabase, s)) {
          console.log(`[EMAIL-NURTURE] Skipping re_engagement for memorial subscriber ${s.email}`);
          continue;
        }
        if (await sendNurtureEmail(resend, supabase, s, "re_engagement", now)) emailsSent++;
      } catch (e) { console.error(`[EMAIL-NURTURE] Error ${s.email}:`, e); errors.push(s.email); }
    }

    // ── 8. Pawtrait (canvas) lifecycle ───────────────────────────────
    // Driven by pawtrait_touchpoints rows (status='pending', scheduled_for
    // <= now()) — separate state machine from the reading flow above.
    // Stripe webhook + Gelato webhook + pawtraits intake form INSERT here;
    // we read + send.
    const PAWTRAIT_BATCH = 100;
    const { data: pawtraitDue, error: pawtraitErr } = await supabase
      .from("pawtrait_touchpoints")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(PAWTRAIT_BATCH);

    if (pawtraitErr) {
      console.error("[EMAIL-NURTURE] pawtrait_touchpoints fetch failed:", pawtraitErr.message);
    } else {
      console.log(`[EMAIL-NURTURE] Found ${pawtraitDue?.length || 0} pawtrait touchpoints due`);
      for (const row of (pawtraitDue || []) as PawtraitTouchpointRow[]) {
        try {
          const out = await sendPawtraitEmail(resend, supabase, row);
          if (out.ok) {
            emailsSent++;
          } else {
            console.error(`[EMAIL-NURTURE] pawtrait send failed id=${row.id}: ${out.reason}`);
            errors.push(`pawtrait:${row.email}`);
          }
        } catch (e) {
          console.error(`[EMAIL-NURTURE] pawtrait exception id=${row.id}:`, e);
          errors.push(`pawtrait:${row.email}`);
        }
      }
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
