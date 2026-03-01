import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      referralCode = input.referralCode;
    } else {
      // Generate unique referral code (sanitized name + random)
      const sanitizedName = input.name.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 6) || 'ref';
      referralCode = `${sanitizedName}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // Store affiliate in database - AUTO-APPROVED (status: 'active')
    const { data: affiliate, error: dbError } = await supabaseClient
      .from('affiliates')
      .insert({
        email: input.email,
        name: input.name,
        stripe_account_id: account.id,
        referral_code: referralCode,
        commission_rate: 0.50,
        status: 'active', // Auto-approved!
      })
      .select()
      .single();

    if (dbError) {
      logStep("Database error", dbError);
      throw new Error("Failed to save affiliate");
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "https://littlesouls.co";
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
        const referralLink = `${origin}/?ref=${referralCode}`;
        
        await resend.emails.send({
          from: "Little Souls <hello@littlesouls.co>",
          to: [input.email],
          subject: "🎉 Welcome to the Little Souls Affiliate Program!",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a2e; margin-bottom: 20px;">Welcome aboard, ${input.name}! 🌟</h1>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                You're now an official Little Souls affiliate! Your account is <strong>active</strong> and ready to start earning.
              </p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px; margin: 24px 0;">
                <p style="color: white; margin: 0 0 12px 0; font-size: 14px;">Your unique referral link:</p>
                <a href="${referralLink}" style="display: block; background: white; color: #667eea; padding: 14px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">
                  ${referralLink}
                </a>
              </div>
              
              <h2 style="color: #1a1a2e; margin-top: 32px;">How it works:</h2>
              <ul style="color: #333; font-size: 16px; line-height: 1.8;">
                <li>💰 Earn <strong>50% commission</strong> on every sale</li>
                <li>📊 Track your referrals in your dashboard</li>
                <li>💳 Payouts happen automatically every week (min $10)</li>
              </ul>
              
              <div style="margin-top: 32px;">
                <p style="color: #666; font-size: 14px;">
                  <strong>Next step:</strong> Complete your Stripe onboarding to receive payouts:
                </p>
                <a href="${accountLink.url}" style="display: inline-block; background: #22c55e; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
                  Complete Payout Setup →
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                Questions? Just reply to this email. Happy promoting! 🚀
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
