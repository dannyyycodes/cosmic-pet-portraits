import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

const logStep = (step: string, details?: unknown) => {
  console.log(`[CREATE-AFFILIATE] ${step}`, details ? JSON.stringify(details) : '');
};

// Valid ISO country codes for Stripe Connect
const VALID_COUNTRIES = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'IE', 'PT', 'FI', 'SE', 'NO', 'DK', 'CH', 'NZ', 'SG', 'HK', 'JP'];

// Input validation schema
const affiliateSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s\-']+$/, "Name contains invalid characters"),
  country: z.string().length(2).refine(c => VALID_COUNTRIES.includes(c), "Invalid country code").optional().default('US'),
  referralCode: z.string()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be 20 characters or less")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores, and hyphens allowed")
    .transform(s => s.toLowerCase())
    .optional(),
  // Recruiter attribution — carried from the outreach partner link
  // (utm_content = prospect id, utm_source = channel, utm_campaign = source tag).
  // Optional + best-effort: never block a signup on a bad attribution value.
  recruitedProspectId: z.string().uuid().optional(),
  recruitedViaChannel: z.string().max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  signupSource: z.string().max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    logStep("Function started");

    // Validate input
    const rawInput = await req.json();
    const input = affiliateSchema.parse(rawInput);

    logStep("Input validated", { email: input.email, name: input.name, country: input.country });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    logStep("Creating affiliate account for", { email: input.email, name: input.name });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: input.email,
      country: input.country,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        affiliate_name: input.name,
      },
    });

    logStep("Stripe account created", { accountId: account.id });

    // Generate or use custom referral code
    let referralCode: string;
    
    if (input.referralCode) {
      // Check if custom code is already taken
      const { data: existing } = await supabaseClient
        .from('affiliates')
        .select('id')
        .eq('referral_code', input.referralCode)
        .single();
      
      if (existing) {
        logStep("Referral code already taken", { code: input.referralCode });
        return new Response(JSON.stringify({ 
          error: `The referral code "${input.referralCode}" is already taken. Please choose another.`
        }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 400,
        });
      }
      referralCode = input.referralCode;
    } else {
      // Generate unique referral code (sanitized name + random)
      const sanitizedName = input.name.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 6) || 'ref';
      referralCode = `${sanitizedName}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // Store affiliate in database — ACTIVE on signup (the programme promises
    // instant approval; the referral link must work the moment they share it).
    // Admins can still deactivate a bad actor from the affiliates dashboard.
    const { data: affiliate, error: dbError } = await supabaseClient
      .from('affiliates')
      .insert({
        email: input.email,
        name: input.name,
        stripe_account_id: account.id,
        referral_code: referralCode,
        commission_rate: 0.50,
        status: 'active',
        recruited_prospect_id: input.recruitedProspectId ?? null,
        recruited_via_channel: input.recruitedViaChannel ?? null,
        signup_source: input.signupSource ?? null,
      })
      .select()
      .single();

    if (dbError) {
      logStep("Database error", dbError);
      throw new Error("Failed to save affiliate");
    }

    // Best-effort: mark the recruited prospect as converted so the recruiter
    // funnel can report signed affiliates. Never fatal to the signup.
    if (input.recruitedProspectId) {
      try {
        await supabaseClient
          .from('influencer_prospects')
          .update({ status: 'converted' })
          .eq('id', input.recruitedProspectId);
        logStep("Prospect marked converted", { prospectId: input.recruitedProspectId });
      } catch (convErr) {
        logStep("Failed to mark prospect converted (non-fatal)", convErr);
      }
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "https://littlesouls.app";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/affiliate/onboarding?refresh=true`,
      return_url: `${origin}/affiliate/dashboard`,
      type: 'account_onboarding',
    });

    logStep("Onboarding link created");

    // Send welcome email with referral link
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const referralLink = `${origin}/ref/${referralCode}`;

        await resend.emails.send({
          from: "Little Souls <hello@littlesouls.app>",
          to: [input.email],
          subject: "You're in — your Little Souls partner link is live ✨",
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #5a4a42;">
              <h1 style="color: #3d2f2a; margin-bottom: 20px; font-weight: 700;">You're in, ${input.name}! 🌟</h1>

              <p style="font-size: 16px; line-height: 1.6;">
                Your Little Souls partner account is <strong>live</strong> — your link works right now. Share it and you start earning the moment someone you send discovers their pet's soul reading.
              </p>

              <div style="background: #faf6ef; border: 2px solid #c4a265; padding: 24px; border-radius: 12px; margin: 24px 0;">
                <p style="color: #3d2f2a; margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Your referral link (live now):</p>
                <p style="background: white; color: #bf524a; padding: 14px 20px; border-radius: 8px; font-weight: 700; font-size: 16px; text-align: center; margin: 0; word-break: break-all; font-family: Arial, sans-serif;">
                  ${referralLink}
                </p>
              </div>

              <h2 style="color: #3d2f2a; margin-top: 32px;">What you earn:</h2>
              <ul style="font-size: 16px; line-height: 1.8;">
                <li>Up to <strong>50%</strong> on every soul reading</li>
                <li><strong>20% for life</strong> on horoscope memberships</li>
                <li><strong>15%</strong> on custom pawtraits, plus a £15 bonus on your first sale</li>
                <li>A 60-day cookie, and payouts every month (min $10) straight to your bank</li>
              </ul>

              <div style="margin-top: 32px;">
                <p style="color: #7a6a60; font-size: 14px;">
                  <strong>One last step:</strong> connect Stripe so we can send your payouts:
                </p>
                <a href="${accountLink.url}" style="display: inline-block; background: #bf524a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 8px; font-family: Arial, sans-serif;">
                  Set up payouts →
                </a>
              </div>

              <p style="color: #958779; font-size: 12px; margin-top: 40px; border-top: 1px solid #e8ddd0; padding-top: 20px;">
                Questions? Just reply to this email. Thank you for sharing the bond. 🐾
              </p>
            </div>
          `,
        });
        
        logStep("Welcome email sent", { email: input.email });
      } catch (emailError) {
        // Don't fail the whole request if email fails
        logStep("Failed to send welcome email", emailError);
      }
    } else {
      logStep("RESEND_API_KEY not set, skipping welcome email");
    }

    return new Response(JSON.stringify({
      success: true,
      referralCode,
      onboardingUrl: accountLink.url,
      affiliateId: affiliate.id,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logStep("Validation error", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid input",
        details: error.errors.map(e => e.message).join(", ")
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
