import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const logStep = (step: string, details?: unknown) => {
  console.log(`[PAYOUT-AFFILIATES] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  // SECURITY: Require service role Bearer token only. The anon key is public
  // (embedded in the frontend bundle) and must never be accepted as auth for
  // a function that moves money.
  const authHeader = req.headers.get("Authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    logStep("Missing service role key configuration");
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    logStep("Unauthorized request - invalid authorization");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }

  try {
    logStep("Function started - authorized");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("Missing Stripe configuration");
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
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
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    logStep("Found pending referrals", { count: pendingReferrals?.length || 0 });

    if (!pendingReferrals || pendingReferrals.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No pending payouts' }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
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
      try {
        const account = await stripe.accounts.retrieve(affiliate.stripe_account_id);
        if (!account.payouts_enabled) {
          logStep("Affiliate payouts not enabled", { affiliateId });
          continue;
        }
      } catch (accountErr) {
        logStep("Failed to retrieve Stripe account", { affiliateId });
        continue;
      }

      // SECURITY: Mark referrals as 'processing' to prevent double-payout from concurrent runs
      const { error: lockError } = await supabaseClient
        .from('affiliate_referrals')
        .update({ status: 'processing' })
        .in('id', referralIds)
        .eq('status', 'pending'); // Only update if still pending (atomic check)

      if (lockError) {
        logStep("Failed to lock referrals for processing", { affiliateId });
        continue;
      }

      try {
        // Create transfer with idempotency key to prevent duplicate transfers
        const idempotencyKey = `payout_${affiliateId}_${referralIds.sort().join('_')}`.slice(0, 255);
        const transfer = await stripe.transfers.create({
          amount: totalCommission,
          currency: 'usd',
          destination: affiliate.stripe_account_id,
          metadata: {
            affiliate_id: affiliateId,
            referral_count: referralIds.length.toString(),
          },
        }, {
          idempotencyKey,
        });

        logStep("Transfer created", { transferId: transfer.id, amount: totalCommission });

        // Update referrals to paid
        await supabaseClient
          .from('affiliate_referrals')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .in('id', referralIds);

        // SECURITY FIX: Atomic decrement instead of reset to 0
        await supabaseClient.rpc('decrement_affiliate_balance', {
          p_affiliate_id: affiliateId,
          p_amount_cents: totalCommission,
        });

        payoutResults.push({
          affiliateId,
          amount: totalCommission,
          transferId: transfer.id,
          success: true,
        });

      } catch (transferError) {
        const msg = transferError instanceof Error ? transferError.message : String(transferError);
        logStep("Transfer failed, reverting referrals to pending", { affiliateId, error: msg });

        // Revert referrals back to pending on failure
        await supabaseClient
          .from('affiliate_referrals')
          .update({ status: 'pending' })
          .in('id', referralIds)
          .eq('status', 'processing');

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
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
