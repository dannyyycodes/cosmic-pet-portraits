import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email campaign configurations
const CAMPAIGNS = {
  welcome_1: {
    delayHours: 0.5,
    subject: (petName: string) => `Welcome - let's finish ${petName}'s reading`,
    nextStage: 'welcome_2_pending',
  },
  welcome_2: {
    delayHours: 24,
    subject: (petName: string) => `Something interesting about ${petName}`,
    nextStage: 'welcome_3_pending',
  },
  welcome_3: {
    delayHours: 72,
    subject: (petName: string) => `15% off ${petName}'s reading`,
    nextStage: 'nurtured',
  },
  abandoned_cart: {
    delayHours: 3,
    subject: (petName: string) => `You were almost done`,
    nextStage: 'abandoned_reminded',
  },
  post_purchase_1: {
    delayHours: 24,
    subject: (petName: string) => `Thanks for getting ${petName}'s reading`,
    nextStage: 'post_purchase_2_pending',
  },
  post_purchase_2: {
    delayHours: 168,
    subject: (petName: string) => `Know someone who'd love this?`,
    nextStage: 'nurtured',
  },
  re_engagement: {
    delayHours: 720,
    subject: (petName: string) => `Been a while - here's 20% off`,
    nextStage: 'nurtured',
  },
};

// AI-powered email content generation
async function generateEmailContent(
  campaignType: string,
  petName: string,
  tier?: string
): Promise<{ subject: string; html: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  const prompts: Record<string, string> = {
    welcome_1: `Write a brief welcome email for someone who started a pet astrology intake. Pet name: "${petName}".
    - 2-3 short paragraphs max
    - Warm but not over the top
    - Mention they can finish anytime
    - Simple CTA to continue
    - No emojis in body text`,
    
    welcome_2: `Write a short follow-up email about pet personality insights. Pet name: "${petName}".
    - 2 paragraphs max
    - Share one interesting fact about how astrology relates to pet behavior
    - Natural, conversational tone
    - CTA to get their reading`,
    
    welcome_3: `Write a final reminder email with a discount offer. Pet name: "${petName}".
    - Brief and direct
    - 15% off with code COSMIC15
    - Creates gentle urgency without being pushy
    - Clear CTA`,
    
    abandoned_cart: `Write a short recovery email. Pet name: "${petName}".
    - One paragraph
    - Friendly reminder, not guilt-trippy
    - They were close to finishing
    - CTA to continue where they left off`,
    
    post_purchase_1: `Write a thank you email after purchase. Pet name: "${petName}", tier: ${tier || 'standard'}.
    - Express genuine thanks
    - One tip for getting the most from their reading
    - Encourage them to reach out with questions`,
    
    post_purchase_2: `Write a follow-up about gifting. Pet name: "${petName}".
    - Ask how they're enjoying it
    - Mention they can gift readings to friends
    - 10% off gifts with code SHAREIT
    - Brief and friendly`,
    
    re_engagement: `Write a re-engagement email. Pet name: "${petName}".
    - It's been a while
    - Mention any new features if applicable
    - 20% off with code WELCOME_BACK
    - Warm, not desperate`,
  };

  const prompt = prompts[campaignType] || prompts.welcome_1;
  const campaignConfig = CAMPAIGNS[campaignType as keyof typeof CAMPAIGNS];
  const subject = campaignConfig?.subject(petName) || `About ${petName}`;

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
          {
            role: "system",
            content: `You are writing emails for Little Souls, a pet astrology service. 

CRITICAL RULES:
- Write like a human, not a marketer
- No emojis in body text (subject line is fine)
- No exclamation points except maybe one
- Short paragraphs (2-3 sentences max)
- Conversational but professional
- No cosmic/celestial language overload - use sparingly
- No "we're so excited" or similar phrases
- Output ONLY the email body HTML with inline CSS
- Use simple, clean styling - dark background (#0f0a1a), white text, muted gray for secondary text
- Include one clear CTA button linking to https://littlesouls.co/intake`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[EMAIL-NURTURE] AI generation failed:", response.status);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const htmlContent = data.choices[0]?.message?.content || "";

    return {
      subject,
      html: wrapEmailTemplate(htmlContent, petName),
    };
  } catch (error) {
    console.error("[EMAIL-NURTURE] Error generating content:", error);
    return {
      subject,
      html: wrapEmailTemplate(getFallbackContent(campaignType, petName), petName),
    };
  }
}

function wrapEmailTemplate(content: string, petName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
    
    <div style="margin-bottom: 32px;">
      ${content}
    </div>
    
    <div style="border-top: 1px solid rgba(255,255,255,0.08); margin-top: 40px; padding-top: 24px; text-align: center;">
      <p style="color: #505060; font-size: 12px; margin: 0 0 12px 0;">
        Little Souls
      </p>
      <p style="margin: 0;">
        <a href="https://littlesouls.co/unsubscribe?email={email}" style="color: #505060; font-size: 11px; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function getFallbackContent(campaignType: string, petName: string): string {
  const fallbacks: Record<string, string> = {
    welcome_1: `
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Thanks for starting ${petName}'s profile. You can pick up where you left off anytime.
      </p>
      <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        The full reading covers their personality traits, how they show love, and tips for bonding.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://littlesouls.co/intake" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49a6c 100%); color: #1a1a2e; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Continue ${petName}'s Reading
        </a>
      </div>
    `,
    abandoned_cart: `
      <p style="color: #e0e0e0; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Looks like you got pretty far with ${petName}'s reading but didn't finish.
      </p>
      <p style="color: #a0a0b0; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
        Your progress is saved if you want to pick back up.
      </p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://littlesouls.co/intake" style="display: inline-block; background: linear-gradient(135deg, #d4a574 0%, #c49a6c 100%); color: #1a1a2e; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Finish My Reading
        </a>
      </div>
    `,
  };
  
  return fallbacks[campaignType] || fallbacks.welcome_1;
}

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

    // Get subscribers who need nurturing
    const now = new Date();
    
    // 1. Welcome sequence for new leads
    const { data: newLeads } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "new_lead")
      .eq("is_subscribed", true)
      .is("last_email_sent_at", null)
      .lt("created_at", new Date(now.getTime() - 30 * 60 * 1000).toISOString()); // 30 min old

    console.log(`[EMAIL-NURTURE] Found ${newLeads?.length || 0} new leads to welcome`);

    // 2. Abandoned carts (started intake but no purchase after 3+ hours)
    const { data: abandoned } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "intake_started")
      .eq("is_subscribed", true)
      .lt("intake_started_at", new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString())
      .or(`last_email_sent_at.is.null,last_email_sent_at.lt.${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}`);

    console.log(`[EMAIL-NURTURE] Found ${abandoned?.length || 0} abandoned carts`);

    // 3. Post-purchase follow-ups
    const { data: postPurchase } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("journey_stage", "purchased")
      .eq("is_subscribed", true)
      .lt("purchase_completed_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    console.log(`[EMAIL-NURTURE] Found ${postPurchase?.length || 0} post-purchase to nurture`);

    let emailsSent = 0;
    const errors: string[] = [];

    // Process new leads
    for (const subscriber of newLeads || []) {
      try {
        const { subject, html } = await generateEmailContent("welcome_1", subscriber.pet_name || "your pet");
        
        await resend.emails.send({
          from: "Little Souls <hello@littlesouls.co>",
          to: [subscriber.email],
          subject,
          html: html.replace("{email}", encodeURIComponent(subscriber.email)),
        });

        await supabase
          .from("email_subscribers")
          .update({
            journey_stage: "welcome_2_pending",
            last_email_sent_at: now.toISOString(),
            last_email_type: "welcome_1",
            emails_sent: subscriber.emails_sent + 1,
          })
          .eq("id", subscriber.id);

        await supabase.from("email_campaigns").insert({
          subscriber_id: subscriber.id,
          campaign_type: "welcome_1",
          subject,
          content_preview: subject,
        });

        emailsSent++;
      } catch (error) {
        console.error(`[EMAIL-NURTURE] Error sending to ${subscriber.email}:`, error);
        errors.push(subscriber.email);
      }
    }

    // Process abandoned carts
    for (const subscriber of abandoned || []) {
      try {
        const { subject, html } = await generateEmailContent("abandoned_cart", subscriber.pet_name || "your pet");
        
        await resend.emails.send({
          from: "Little Souls <hello@littlesouls.co>",
          to: [subscriber.email],
          subject,
          html: html.replace("{email}", encodeURIComponent(subscriber.email)),
        });

        await supabase
          .from("email_subscribers")
          .update({
            journey_stage: "abandoned_reminded",
            last_email_sent_at: now.toISOString(),
            last_email_type: "abandoned_cart",
            emails_sent: subscriber.emails_sent + 1,
          })
          .eq("id", subscriber.id);

        await supabase.from("email_campaigns").insert({
          subscriber_id: subscriber.id,
          campaign_type: "abandoned_cart",
          subject,
          content_preview: subject,
        });

        emailsSent++;
      } catch (error) {
        console.error(`[EMAIL-NURTURE] Error sending abandoned cart to ${subscriber.email}:`, error);
        errors.push(subscriber.email);
      }
    }

    // Process post-purchase
    for (const subscriber of postPurchase || []) {
      try {
        const { subject, html } = await generateEmailContent(
          "post_purchase_1",
          subscriber.pet_name || "your pet",
          subscriber.tier_purchased
        );
        
        await resend.emails.send({
          from: "Little Souls <hello@littlesouls.co>",
          to: [subscriber.email],
          subject,
          html: html.replace("{email}", encodeURIComponent(subscriber.email)),
        });

        await supabase
          .from("email_subscribers")
          .update({
            journey_stage: "post_purchase_2_pending",
            last_email_sent_at: now.toISOString(),
            last_email_type: "post_purchase_1",
            emails_sent: subscriber.emails_sent + 1,
          })
          .eq("id", subscriber.id);

        await supabase.from("email_campaigns").insert({
          subscriber_id: subscriber.id,
          campaign_type: "post_purchase_1",
          subject,
          content_preview: subject,
        });

        emailsSent++;
      } catch (error) {
        console.error(`[EMAIL-NURTURE] Error sending post-purchase to ${subscriber.email}:`, error);
        errors.push(subscriber.email);
      }
    }

    console.log(`[EMAIL-NURTURE] Complete. Sent ${emailsSent} emails. Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        errors: errors.length,
        details: {
          newLeads: newLeads?.length || 0,
          abandoned: abandoned?.length || 0,
          postPurchase: postPurchase?.length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[EMAIL-NURTURE] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});