import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizeCurrency } from "../_shared/pricing.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Stripe Price IDs — multi-currency is handled via currency_options on each
// Price. The monthly Price is GBP-primary (base £4.99) with localized
// currency_options (usd 5.99, eur 5.99, aud 8.99, cad 7.99, nzd 9.99).
// Passing `currency` in the session tells Stripe which option to charge;
// with none it falls back to the GBP base.
const PRICES = {
  monthly: "price_1TtRT6EFEZSdxrGtSLA0dJGA", // £4.99/mo GBP-primary + currency_options
  yearly: "price_1SgAP6EFEZSdxrGtiHMgxqx2",   // $39.99/yr + currency_options
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { petReportId, plan = "monthly", currency: rawCurrency } = await req.json();

    if (!petReportId) {
      return new Response(JSON.stringify({ error: "Missing required field: petReportId" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── Ownership / payment / memorial / duplicate guards (blocker #11) ──────
    // This endpoint used to trust the caller's email + petName blindly and had
    // NO checks — anyone could spin up a Stripe checkout for any report id, and
    // the standalone CTA even called it with a blank email (always errored).
    // The report row is now the single source of truth: it must exist, be PAID,
    // be non-memorial, and have no active horoscope sub already.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: report, error: reportErr } = await supabaseAdmin
      .from("pet_reports")
      .select("id, email, pet_name, occasion_mode, payment_status")
      .eq("id", petReportId)
      .maybeSingle();

    if (reportErr || !report) {
      console.warn("[HOROSCOPE-SUB] Report not found:", petReportId, reportErr?.message);
      return new Response(JSON.stringify({ error: "Report not found" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (report.payment_status !== "paid") {
      console.warn("[HOROSCOPE-SUB] Report not paid:", petReportId, report.payment_status);
      return new Response(JSON.stringify({ error: "This reading has not been unlocked yet." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 403,
      });
    }

    if (report.occasion_mode === "memorial") {
      console.warn("[HOROSCOPE-SUB] Refusing memorial horoscope sub:", petReportId);
      return new Response(JSON.stringify({ error: "Weekly horoscopes are not available for memorial readings." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 409,
      });
    }

    // Authoritative email comes from the paid report, never the request body.
    const email = (report.email || "").trim().toLowerCase();
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email === "pending@checkout.temp" || !EMAIL_PATTERN.test(email)) {
      console.warn("[HOROSCOPE-SUB] Report has no usable email:", petReportId, report.email);
      return new Response(JSON.stringify({ error: "No verified email on this reading yet." }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 409,
      });
    }
    const petName = report.pet_name || "your pet";

    // Duplicate guard: don't create a second sub for a pet already enrolled.
    const { data: existingSub } = await supabaseAdmin
      .from("horoscope_subscriptions")
      .select("id, status")
      .eq("pet_report_id", petReportId)
      .eq("status", "active")
      .maybeSingle();
    if (existingSub) {
      console.log("[HOROSCOPE-SUB] Already enrolled:", petReportId, existingSub.id);
      return new Response(JSON.stringify({ error: `${petName} already has weekly horoscopes.`, alreadyEnrolled: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 409,
      });
    }

    const currency = normalizeCurrency(rawCurrency);
    console.log("[HOROSCOPE-SUB] Creating subscription for:", { email, petName, petReportId, plan, currency });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[HOROSCOPE-SUB] Found existing customer:", customerId);
    } else {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      console.log("[HOROSCOPE-SUB] Created new customer:", customerId);
    }

    const priceId = plan === "yearly" ? PRICES.yearly : PRICES.monthly;

    // Create checkout session for subscription with FIRST MONTH FREE
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      currency,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30, // First month FREE
        metadata: {
          petReportId,
          petName,
          email,
        },
      },
      success_url: `${req.headers.get("origin")}/horoscope-success?session_id={CHECKOUT_SESSION_ID}&pet=${encodeURIComponent(petName)}`,
      cancel_url: `${req.headers.get("origin")}/view-report?reportId=${petReportId}`,
      metadata: {
        petReportId,
        petName,
        email,
        type: "horoscope_subscription",
        plan,
        currency,
      },
    });

    console.log("[HOROSCOPE-SUB] Created checkout session:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[HOROSCOPE-SUB] Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
