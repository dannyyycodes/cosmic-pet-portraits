import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.22.4";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.30;
  if (petCount >= 4) return 0.25;
  if (petCount >= 3) return 0.20;
  if (petCount >= 2) return 0.15;
  return 0;
}

const HARDCOVER_PRICE_CENTS = 9900;
const VARIANT_C_PRICES: Record<string, number> = {
  basic: 2900,
  premium: 4900,
};
const PORTRAIT_PRICE_CENTS = 800;

const inputSchema = z.object({
  selectedTier: z.enum(["basic", "premium"]).optional().default("basic"),
  petCount: z.number().int().min(1).max(10).optional().default(1),
  includesPortrait: z.boolean().optional().default(false),
  includesBook: z.boolean().optional().default(false),
  occasionMode: z.enum(["discover", "birthday", "gift", "memorial"]).optional().default("discover"),
  quickCheckoutEmail: z.string().email().max(255).optional().or(z.literal("")),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req), status: 204 });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase env vars");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const input = inputSchema.parse(body);

    const tierKey = input.selectedTier ?? "basic";
    const petCount = input.petCount ?? 1;
    let includesPortrait = input.includesPortrait ?? (tierKey === "premium");
    const includesBook = input.includesBook ?? false;
    const occasionMode = input.occasionMode ?? "discover";

    if (includesBook) includesPortrait = true;

    // Calculate price — mirrors create-checkout server-side logic exactly
    let totalAmount: number;
    if (includesBook) {
      totalAmount = HARDCOVER_PRICE_CENTS * petCount;
    } else {
      const basePriceCents = VARIANT_C_PRICES[tierKey] ?? VARIANT_C_PRICES.basic;
      const perPetPrice = tierKey === "basic" && includesPortrait
        ? VARIANT_C_PRICES.basic + PORTRAIT_PRICE_CENTS
        : basePriceCents;
      const readingTotal = perPetPrice * petCount;
      const discountRate = getVolumeDiscount(petCount);
      const discountAmount = Math.round(readingTotal * discountRate);
      totalAmount = readingTotal - discountAmount;
    }

    if (totalAmount < 50) {
      return new Response(JSON.stringify({ error: "Amount too low" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create placeholder reports (one per pet)
    const reportIds: string[] = [];
    for (let i = 0; i < petCount; i++) {
      const { data: report, error: insertError } = await supabaseClient
        .from("pet_reports")
        .insert({
          email: input.quickCheckoutEmail || "pending@checkout.temp",
          pet_name: "Pending",
          species: "pending",
          payment_status: "pending",
          occasion_mode: occasionMode,
          includes_book: includesBook,
        })
        .select("id")
        .single();

      if (insertError || !report) {
        console.error("[CREATE-PI] Failed to create placeholder report:", insertError);
        throw new Error("Failed to create report record");
      }
      reportIds.push(report.id);
    }

    const primaryReportId = reportIds[0];
    console.log("[CREATE-PI] Reports created:", reportIds, "total:", totalAmount, "tier:", tierKey);

    // Create PaymentIntent with metadata matching what verify-payment and stripe-webhook expect
    const pi = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      receipt_email: input.quickCheckoutEmail || undefined,
      automatic_payment_methods: { enabled: true },
      metadata: {
        quick_checkout: "true",
        report_ids: reportIds.join(","),
        primary_report_id: primaryReportId,
        pet_count: String(petCount),
        selected_tier: tierKey,
        includes_portrait: String(includesPortrait),
        includes_book: String(includesBook),
        occasion_mode: occasionMode,
      },
    });

    console.log("[CREATE-PI] PaymentIntent created:", pi.id);

    return new Response(JSON.stringify({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      reportId: primaryReportId,
      reportIds,
    }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[CREATE-PI] Error:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
