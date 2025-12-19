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
    delayHours: 0.5, // 30 minutes after signup
    subject: (petName: string) => `✨ ${petName}'s cosmic journey begins!`,
    nextStage: 'welcome_2_pending',
  },
  welcome_2: {
    delayHours: 24, // 1 day after welcome_1
    subject: (petName: string) => `🌟 Did you know about ${petName}'s hidden cosmic gifts?`,
    nextStage: 'welcome_3_pending',
  },
  welcome_3: {
    delayHours: 72, // 3 days after welcome_2
    subject: (petName: string) => `🔮 Special offer: Unlock ${petName}'s full cosmic profile`,
    nextStage: 'nurtured',
  },
  abandoned_cart: {
    delayHours: 3, // 3 hours after abandonment
    subject: (petName: string) => `🐾 ${petName} is waiting for their cosmic reading!`,
    nextStage: 'abandoned_reminded',
  },
  post_purchase_1: {
    delayHours: 24, // 1 day after purchase
    subject: (petName: string) => `💫 How to get the most from ${petName}'s cosmic reading`,
    nextStage: 'post_purchase_2_pending',
  },
  post_purchase_2: {
    delayHours: 168, // 7 days after purchase
    subject: (petName: string) => `🎁 Share the cosmic love: Gift a reading for a friend!`,
    nextStage: 'nurtured',
  },
  re_engagement: {
    delayHours: 720, // 30 days inactive
    subject: (petName: string) => `✨ We miss you and ${petName}! Here's something special...`,
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
    welcome_1: `Write a warm, cosmic-themed welcome email for a pet astrology service. The pet's name is "${petName}". 
    - Keep it brief (3-4 paragraphs)
    - Use cosmic/astrology language
    - Mention they started exploring their pet's cosmic profile
    - Include a CTA to complete their reading
    - Use emojis sparingly`,
    
    welcome_2: `Write a follow-up nurture email for a pet astrology service. The pet's name is "${petName}".
    - Share 2-3 fun facts about what astrology reveals about pets
    - Tease what their reading will reveal
    - Create curiosity about ${petName}'s zodiac traits
    - Include a CTA to get their reading`,
    
    welcome_3: `Write a final nurture email with a special offer for a pet astrology service. The pet's name is "${petName}".
    - Create urgency (limited time offer)
    - Mention 15% off with code COSMIC15
    - Highlight the value of the reading
    - Strong CTA to purchase`,
    
    abandoned_cart: `Write an abandoned cart recovery email for a pet astrology service. The pet's name is "${petName}".
    - Gentle reminder they left before completing
    - Mention their cosmic profile is almost ready
    - Address potential concerns (quick process, secure payment)
    - Clear CTA to continue`,
    
    post_purchase_1: `Write a post-purchase email for a pet astrology service. The pet's name is "${petName}" and they got the ${tier || 'standard'} reading.
    - Thank them for their purchase
    - Give tips on how to use their reading
    - Mention they can share on social media
    - Encourage them to read it with their pet`,
    
    post_purchase_2: `Write a follow-up email encouraging gifting for a pet astrology service. The pet's name is "${petName}".
    - Ask if they enjoyed their reading
    - Suggest gifting to a friend with a pet
    - Mention the gift feature (50% off gifts)
    - Warm, friendly tone`,
    
    re_engagement: `Write a re-engagement email for a pet astrology service. The pet's name is "${petName}".
    - It's been a while since we connected
    - Mention new features or updates
    - Offer a special comeback discount (20% off with code WELCOME_BACK)
    - Warm, not pushy`,
  };

  const prompt = prompts[campaignType] || prompts.welcome_1;
  const campaignConfig = CAMPAIGNS[campaignType as keyof typeof CAMPAIGNS];
  const subject = campaignConfig?.subject(petName) || `A cosmic message for ${petName}`;

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
            content: `You are an email copywriter for AstroPets, a pet astrology service. Write engaging, cosmic-themed emails that feel personal and magical. Output ONLY the email body HTML (no subject line, no markdown code blocks). Use inline CSS for styling. Keep emails mobile-friendly. Always include a prominent CTA button linking to https://astropets.cloud/intake`,
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
    // Fallback to simple template
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
<body style="margin: 0; padding: 0; background-color: #0f0a1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #a78bfa; font-size: 28px; margin: 0;">🌟 AstroPets</h1>
    </div>
    
    <div style="background: linear-gradient(145deg, #1a1033, #0d0620); border-radius: 16px; padding: 30px; border: 1px solid rgba(167, 139, 250, 0.2);">
      ${content}
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
      <p>🐾 Cosmic wisdom for your beloved companion</p>
      <p style="margin-top: 15px;">
        <a href="https://astropets.cloud/unsubscribe?email={email}" style="color: #6b7280;">Unsubscribe</a>
      </p>
      <p>© 2024 AstroPets. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

function getFallbackContent(campaignType: string, petName: string): string {
  const fallbacks: Record<string, string> = {
    welcome_1: `
      <h2 style="color: #e2e8f0; margin-top: 0;">Welcome to the cosmic family! ✨</h2>
      <p style="color: #cbd5e1; line-height: 1.6;">
        We're thrilled you've started exploring ${petName}'s cosmic profile. The stars have so much to reveal about your beloved companion!
      </p>
      <p style="color: #cbd5e1; line-height: 1.6;">
        Complete your reading to discover ${petName}'s zodiac personality, hidden gifts, and cosmic purpose.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://astropets.cloud/intake" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 600;">
          Continue ${petName}'s Reading →
        </a>
      </div>
    `,
    abandoned_cart: `
      <h2 style="color: #e2e8f0; margin-top: 0;">Don't leave ${petName} waiting! 🐾</h2>
      <p style="color: #cbd5e1; line-height: 1.6;">
        You were so close to unlocking ${petName}'s cosmic secrets! Their personalized reading is almost ready.
      </p>
      <p style="color: #cbd5e1; line-height: 1.6;">
        It only takes 2 minutes to complete. Come back and discover what the stars have in store!
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://astropets.cloud/intake" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 600;">
          Complete My Reading →
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
          from: "AstroPets <hello@astropets.cloud>",
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
          from: "AstroPets <hello@astropets.cloud>",
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
          from: "AstroPets <hello@astropets.cloud>",
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