import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

    // Store affiliate in database
    const { data: affiliate, error: dbError } = await supabaseClient
      .from('affiliates')
      .insert({
        email: input.email,
        name: input.name,
        stripe_account_id: account.id,
        referral_code: referralCode,
        commission_rate: 0.50,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      logStep("Database error", dbError);
      throw new Error("Failed to save affiliate");
    }

    // Create onboarding link
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/affiliate/onboarding?refresh=true`,
      return_url: `${origin}/affiliate/dashboard`,
      type: 'account_onboarding',
    });

    logStep("Onboarding link created");

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
