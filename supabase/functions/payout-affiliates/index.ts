import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[PAYOUT-AFFILIATES] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Require authorization header (accepts anon key for cron jobs or service role)
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  // Accept either service role key or anon key (for cron jobs)
  const isValidAuth = authHeader && (
    authHeader.includes(serviceRoleKey || '') || 
    authHeader.includes(anonKey || '')
  );
  
  if (!authHeader || !isValidAuth) {
    logStep("Unauthorized request - missing or invalid authorization");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    logStep("Function started - authorized");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Missing Stripe configuration");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all pending referrals grouped by affiliate
    const { data: pendingReferrals, error: refError } = await supabaseClient
      .from('affiliate_referrals')
      .select('*, affiliates(*)')
      .eq('status', 'pending');

    if (refError) {
      logStep("Failed to fetch pending referrals");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Found pending referrals", { count: pendingReferrals?.length || 0 });

    if (!pendingReferrals || pendingReferrals.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No pending payouts' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Group by affiliate
    interface AffiliatePayout {
      affiliate: { id: string; stripe_account_id: string; email: string };
      totalCommission: number;
      referralIds: string[];
    }
    
    const affiliatePayouts = pendingReferrals.reduce((acc, ref) => {
      const affId = ref.affiliate_id;
      if (!acc[affId]) {
        acc[affId] = {
          affiliate: ref.affiliates,
          totalCommission: 0,
          referralIds: [],
        };
      }
      acc[affId].totalCommission += ref.commission_cents;
      acc[affId].referralIds.push(ref.id);
      return acc;
    }, {} as Record<string, AffiliatePayout>);

    const payoutResults: Array<{ affiliateId: string; amount: number; transferId?: string; success: boolean; error?: string }> = [];

    for (const affiliateId of Object.keys(affiliatePayouts)) {
      const { affiliate, totalCommission, referralIds } = affiliatePayouts[affiliateId];

      // Minimum payout threshold: $10
      if (totalCommission < 1000) {
        logStep("Skipping affiliate - below threshold", { affiliateId, amount: totalCommission });
        continue;
      }

      // Check if Stripe account is ready for payouts
      const account = await stripe.accounts.retrieve(affiliate.stripe_account_id);
      
      if (!account.payouts_enabled) {
        logStep("Affiliate payouts not enabled", { affiliateId });
        continue;
      }

      try {
        // Create transfer to connected account
        const transfer = await stripe.transfers.create({
          amount: totalCommission,
          currency: 'usd',
          destination: affiliate.stripe_account_id,
          metadata: {
            affiliate_id: affiliateId,
            referral_count: referralIds.length.toString(),
          },
        });

        logStep("Transfer created", { transferId: transfer.id, amount: totalCommission });

        // Update referrals to paid
        await supabaseClient
          .from('affiliate_referrals')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .in('id', referralIds);

        // Update affiliate pending balance
        await supabaseClient
          .from('affiliates')
          .update({ pending_balance_cents: 0 })
          .eq('id', affiliateId);

        payoutResults.push({
          affiliateId,
          amount: totalCommission,
          transferId: transfer.id,
          success: true,
        });

      } catch (transferError) {
        const msg = transferError instanceof Error ? transferError.message : String(transferError);
        logStep("Transfer failed", { affiliateId, error: msg });
        payoutResults.push({
          affiliateId,
          amount: totalCommission,
          success: false,
          error: "Transfer failed",
        });
      }
    }

    logStep("Payout batch complete", { resultsCount: payoutResults.length });

    return new Response(JSON.stringify({
      success: true,
      payouts: payoutResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
