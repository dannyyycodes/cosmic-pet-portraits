import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[AFFILIATE-DASHBOARD] ${step}`, details ? JSON.stringify(details) : '');
};

// Input validation schema
const dashboardSchema = z.object({
  email: z.string().email().max(255),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate input
    const rawInput = await req.json();
    const input = dashboardSchema.parse(rawInput);

    logStep("Input validated", { email: input.email });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find affiliate by email
    const { data: affiliate, error: affError } = await supabaseClient
      .from('affiliates')
      .select('*')
      .eq('email', input.email)
      .single();

    if (affError || !affiliate) {
      logStep("Affiliate not found", { email: input.email });
      return new Response(JSON.stringify({ 
        error: 'Affiliate not found',
        found: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Affiliate found", { id: affiliate.id, status: affiliate.status });

    // Get recent referrals
    const { data: referrals, error: refError } = await supabaseClient
      .from('affiliate_referrals')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (refError) {
      logStep("Error fetching referrals", refError);
    }

    // Calculate stats
    const pendingReferrals = referrals?.filter(r => r.status === 'pending') || [];
    const paidReferrals = referrals?.filter(r => r.status === 'paid') || [];

    const stats = {
      totalReferrals: affiliate.total_referrals,
      totalEarnings: affiliate.total_earnings_cents / 100,
      pendingBalance: affiliate.pending_balance_cents / 100,
      commissionRate: affiliate.commission_rate * 100,
      status: affiliate.status,
      referralCode: affiliate.referral_code,
      pendingCount: pendingReferrals.length,
      paidCount: paidReferrals.length,
    };

    // Format referrals for display
    const formattedReferrals = (referrals || []).map(r => ({
      id: r.id,
      date: r.created_at,
      amount: r.amount_cents / 100,
      commission: r.commission_cents / 100,
      status: r.status,
      paidAt: r.paid_at,
    }));

    logStep("Dashboard data prepared", { stats });

    return new Response(JSON.stringify({
      success: true,
      affiliate: {
        name: affiliate.name,
        email: affiliate.email,
        createdAt: affiliate.created_at,
        stripeAccountId: affiliate.stripe_account_id,
      },
      stats,
      referrals: formattedReferrals,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
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
