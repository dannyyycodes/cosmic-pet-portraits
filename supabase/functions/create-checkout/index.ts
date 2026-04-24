import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  type SupportedCurrency,
  SUPPORTED_CURRENCIES,
  PRICING,
  normalizeCurrency,
} from "../_shared/pricing.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Tier name lookup — prices come from PRICING[currency]
const TIER_NAMES = {
  basic: 'Little Souls Reading',
  premium: 'Little Souls Reading + Portrait',
} as const;

// GIFT_TIER_NAMES removed in PR feat/gift-upsell-cleanup — at-checkout gift
// line items no longer render, so the name map is unused. Post-purchase
// gifts go through the gift_certificates table + dedicated checkout branch.

// Volume discount calculation - SERVER-SIDE (must match frontend)
function getVolumeDiscount(petCount: number): number {
  if (petCount >= 5) return 0.30;
  if (petCount >= 4) return 0.25;
  if (petCount >= 3) return 0.20;
  if (petCount >= 2) return 0.15;
  return 0;
}

const HOROSCOPE_MONTHLY_CENTS = 0; // Free at checkout — Stripe subscription created in webhook with 30-day trial

// Paid cross-pet compatibility upsell is parked — multi-pet orders now
// auto-generate one complimentary compatibility reading via stripe-webhook.
// Flip back to true (plus update the Compatibility UI CTA) to re-enable the
// paid path. See PR feat/compat-free-multipet.
const ENABLE_PAID_COMPATIBILITY = false;

// Input validation schema
const checkoutSchema = z.object({
  reportIds: z.array(z.string().uuid()).optional(),
  reportId: z.string().uuid().optional(),
  petCount: z.number().int().min(1).max(10).optional().default(1),
  // Per-tier quantity breakdown for quickCheckout (mix Soul Reading + Soul Bond in one order).
  // basicCount = Soul Reading quantity, premiumCount = Soul Bond quantity.
  // If either is provided and petCount is omitted, petCount = basicCount + premiumCount.
  basicCount: z.number().int().min(0).max(10).optional(),
  premiumCount: z.number().int().min(0).max(10).optional(),
  selectedTier: z.enum(['basic', 'premium']).optional().default('premium'),
  selectedProducts: z.array(z.string()).optional(),
  couponId: z.string().uuid().nullable().optional(),
  giftCertificateId: z.string().uuid().nullable().optional(),
  isGift: z.boolean().optional().default(false),
  recipientName: z.string().max(100).optional().default(''),
  recipientEmail: z.string().email().max(255).optional().or(z.literal('')).default(''),
  giftMessage: z.string().max(500).optional().default(''),
  totalCents: z.number().optional(),
  includeGiftForFriend: z.boolean().optional().default(false),
  giftTierForFriend: z.enum(['basic', 'premium']).optional().default('basic'),
  includesPortrait: z.boolean().optional().default(false),
  includesBook: z.boolean().optional().default(false),
  referralCode: z.string().max(50).optional(),
  includeHoroscope: z.boolean().optional().default(false),
  giftCode: z.string().max(20).optional(),
  petPhotoUrl: z.string().url().max(2048).optional(),
  petTiers: z.record(z.string(), z.enum(['basic', 'premium'])).optional(),
  petPhotos: z.record(z.string(), z.object({
    url: z.string().url().max(2048),
    processingMode: z.string().optional(),
  })).optional(),
  petHoroscopes: z.record(z.string(), z.boolean()).optional(),
  quickCheckout: z.boolean().optional().default(false),
  abVariant: z.string().max(5).optional(),
  // Whitelist — any charity_id flowing into Stripe metadata + charity_donations ledger must match one of these.
  charityId: z.enum(["ifaw", "world-land-trust", "eden-reforestation"]).optional(),
  charityBonus: z.number().int().min(0).max(500).optional().default(0),
  occasionMode: z.enum(["discover", "new", "birthday", "memorial", "gift"]).optional(),
  // Safety flag — retained for belt-and-braces but largely superseded by
  // memorialCount below. When any memorial pet is in the cart we still set
  // has_memorial=true in Stripe metadata as a cross-check; stripe-webhook's
  // primary guard is the per-row occasion_mode field.
  hasMemorial: z.boolean().optional().default(false),
  // Per-line-item memorial count — the canonical way to signal "N of the
  // pets in this cart should be memorial readings." When > 0, the loop
  // that creates pet_reports placeholders writes occasion_mode='memorial'
  // on the LAST N rows, so each pet's DB row carries the correct occasion
  // at payment time — no intake-time reconciliation needed. Non-memorial
  // rows inherit the cart-level occasionMode (landing-path default).
  memorialCount: z.number().int().min(0).max(10).optional().default(0),
  giftUpsellCheckout: z.boolean().optional().default(false),
  purchaserEmail: z.string().email().max(255).optional().or(z.literal('')),
  giftRecipientEmail: z.string().email().max(255).optional().or(z.literal('')),
  giftRecipientName: z.string().max(100).optional(),
  quickCheckoutEmail: z.string().email().max(255).optional().or(z.literal('')),
  // Cross-pet compatibility upsell — buyer pays a small fee to generate a
  // reading that compares two of their existing pet charts.
  compatibilityUpsellCheckout: z.boolean().optional().default(false),
  compatPetReportAId: z.string().uuid().optional(),
  compatPetReportBId: z.string().uuid().optional(),
  /** Client-reported — server recomputes from DB. Telemetry only. */
  existingPairsCount: z.number().int().min(0).max(50).optional(),
  /** User's display currency from useLocalizedPrice. Server uses PRICING[currency]
   *  for all amounts AND passes it as the Stripe Checkout Session currency. */
  currency: z.enum(SUPPORTED_CURRENCIES as unknown as [string, ...string[]]).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const rawInput = await req.json();
    const input = checkoutSchema.parse(rawInput);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[CREATE-CHECKOUT] Missing Stripe configuration");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 503,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const origin = req.headers.get("origin") || "https://littlesouls.app";

    // Resolve display currency once — used for all amounts + Stripe session.
    const currency: SupportedCurrency = normalizeCurrency(input.currency);
    const pricing = PRICING[currency];

    // ========== GIFT UPSELL CHECKOUT (post-purchase 30% off) ==========
    if (input.giftUpsellCheckout) {
      const GIFT_UPSELL_PRICE_CENTS = pricing.giftUpsell;
      const GIFT_CERT_VALUE_CENTS = pricing.giftCertValue;
      const purchaserEmail = input.purchaserEmail;
      if (!purchaserEmail) {
        return new Response(JSON.stringify({ error: "Purchaser email required" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 400,
        });
      }
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const randomBytes = new Uint8Array(8);
      crypto.getRandomValues(randomBytes);
      let giftCode = "GIFT-";
      for (let i = 0; i < 4; i++) giftCode += chars[randomBytes[i] % chars.length];
      giftCode += "-";
      for (let i = 4; i < 8; i++) giftCode += chars[randomBytes[i] % chars.length];
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      const giftFaceLabel = new Intl.NumberFormat("en-US", {
        style: "currency", currency: currency.toUpperCase(),
        maximumFractionDigits: 0, minimumFractionDigits: 0,
      }).format(GIFT_CERT_VALUE_CENTS / 100);
      const giftSession = await stripe.checkout.sessions.create({
        customer_email: purchaserEmail,
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: "🎁 Gift a Little Souls Reading",
              description: input.giftRecipientName
                ? `A cosmic reading for ${input.giftRecipientName} — they'll discover their pet's soul`
                : `A cosmic pet reading gift certificate — worth ${giftFaceLabel}`,
            },
            unit_amount: GIFT_UPSELL_PRICE_CENTS,
          },
          quantity: 1,
        }],
        mode: "payment",
        // Frictionless: card auto-surfaces Apple Pay + Google Pay on supported
        // browsers. Other wallets/BNPL need to be listed explicitly on Checkout
        // Sessions (Stripe only honours automatic_payment_methods for Payment
        // Intents, not Checkout). Stripe still filters by country/currency/amount
        // so UK buyers won't see Klarna in USD etc.
        payment_method_types: [
          "card", "link",
          "klarna", "afterpay_clearpay",
          "amazon_pay", "revolut_pay",
          "bancontact", "eps",
        ],
        success_url: `${origin}/gift-success?code=${giftCode}&delivery=link`,
        cancel_url: `${origin}/`,
        metadata: { type: "gift_certificate", gift_code: giftCode, gift_upsell: "true" },
      });
      await supabaseClient.from("gift_certificates").insert({
        code: giftCode,
        purchaser_email: purchaserEmail,
        recipient_email: input.giftRecipientEmail || null,
        recipient_name: input.giftRecipientName || null,
        gift_message: "Here's a special gift — a cosmic soul reading for your pet! 🌟",
        amount_cents: GIFT_CERT_VALUE_CENTS,
        gift_tier: "essential",
        stripe_session_id: giftSession.id,
        expires_at: expiresAt.toISOString(),
      });
      console.log("[CREATE-CHECKOUT] Gift upsell session:", giftSession.id, giftCode);
      return new Response(JSON.stringify({ url: giftSession.url }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ========== CROSS-PET COMPATIBILITY UPSELL ==========
    // A small paid add-on available to buyers who own 2+ pet reports.
    // Tiered pricing matches the base-tier multi-pet volume discount:
    //   1st pairing: $12 · 2nd: $10 · 3rd+: $8.
    // Pair count is read fresh from the DB so clients can't tamper.
    if (input.compatibilityUpsellCheckout) {
      if (!ENABLE_PAID_COMPATIBILITY) {
        return new Response(JSON.stringify({
          error: "Compatibility upsell is disabled — complimentary readings are generated automatically for multi-pet orders",
        }), {
          status: 410,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        });
      }
      const { compatPetReportAId, compatPetReportBId, purchaserEmail } = input;
      if (!compatPetReportAId || !compatPetReportBId || compatPetReportAId === compatPetReportBId) {
        return new Response(JSON.stringify({ error: "Two distinct pet report ids required" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 400,
        });
      }
      if (!purchaserEmail) {
        return new Response(JSON.stringify({ error: "Purchaser email required" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Server-side ownership check — both reports must share the buyer's email.
      const { data: sourceReports, error: srcErr } = await supabaseClient
        .from("pet_reports")
        .select("id, email, pet_name, payment_status, occasion_mode")
        .in("id", [compatPetReportAId, compatPetReportBId]);
      if (srcErr || !sourceReports || sourceReports.length !== 2) {
        return new Response(JSON.stringify({ error: "Source reports not found" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 404,
        });
      }
      const buyerEmail = purchaserEmail.toLowerCase().trim();
      if (sourceReports.some(r => (r.email || "").toLowerCase().trim() !== buyerEmail || r.payment_status !== "paid")) {
        return new Response(JSON.stringify({ error: "Not your reports" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 403,
        });
      }

      // Refuse pairings that include a memorial pet — defence in depth with
      // generate-pet-compatibility, which also blocks this path.
      const memorialReport = sourceReports.find(r => (r as { occasion_mode?: string }).occasion_mode === "memorial");
      if (memorialReport) {
        return new Response(JSON.stringify({ error: "Compatibility readings are only available for living pets" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Server-authoritative pair count → tiered price. Clients can send their
      // own count for telemetry; we recompute from the DB to avoid tampering.
      const { count: existingPairsCount } = await supabaseClient
        .from("pet_compatibilities")
        .select("id", { count: "exact", head: true })
        .eq("email", buyerEmail)
        .eq("status", "ready");
      const pairIndex = existingPairsCount ?? 0;
      const COMPAT_PRICE_CENTS = pairIndex >= 2 ? pricing.compatTier3
        : pairIndex >= 1 ? pricing.compatTier2
        : pricing.compatTier1;

      const nameA = sourceReports.find(r => r.id === compatPetReportAId)?.pet_name || "your first pet";
      const nameB = sourceReports.find(r => r.id === compatPetReportBId)?.pet_name || "your second pet";

      const compatSession = await stripe.checkout.sessions.create({
        customer_email: purchaserEmail,
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: `${nameA} × ${nameB} — Together`,
              description: `A cross-pet reading that reveals how ${nameA} and ${nameB} move through the world side by side.`,
            },
            unit_amount: COMPAT_PRICE_CENTS,
          },
          quantity: 1,
        }],
        mode: "payment",
        payment_method_types: ["card", "link", "klarna", "afterpay_clearpay", "amazon_pay", "revolut_pay", "bancontact", "eps"],
        allow_promotion_codes: false,
        success_url: `${origin}/compatibility?session_id={CHECKOUT_SESSION_ID}&a=${compatPetReportAId}&b=${compatPetReportBId}`,
        cancel_url: `${origin}/?compat_cancelled=1`,
        metadata: {
          type: "pet_compatibility",
          pet_report_a_id: compatPetReportAId,
          pet_report_b_id: compatPetReportBId,
          purchaser_email: buyerEmail,
        },
      });
      console.log("[CREATE-CHECKOUT] Compatibility upsell session:", compatSession.id);
      return new Response(JSON.stringify({ url: compatSession.url, sessionId: compatSession.id }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ========== QUICK CHECKOUT MODE (Variant C) ==========
    if (input.quickCheckout) {
      const tierKey = input.selectedTier || 'premium';
      const includesBook = input.includesBook || false;
      const occasionMode = input.occasionMode || 'discover';

      // Per-tier breakdown from the new checkout UI (steppers on Soul Reading + Soul Bond cards).
      // Fall back to legacy single-tier behaviour when caller doesn't send basicCount/premiumCount.
      const hasPerTierCounts = (typeof input.basicCount === 'number' || typeof input.premiumCount === 'number') && !includesBook;
      const basicCount = hasPerTierCounts ? (input.basicCount || 0) : 0;
      const premiumCount = hasPerTierCounts ? (input.premiumCount || 0) : 0;

      let petCount: number;
      if (includesBook) {
        petCount = input.petCount || 1;
      } else if (hasPerTierCounts) {
        petCount = basicCount + premiumCount;
        if (petCount < 1 || petCount > 10) {
          return new Response(JSON.stringify({ error: "Select between 1 and 10 pets" }), {
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
            status: 400,
          });
        }
      } else {
        petCount = input.petCount || 1;
      }

      // Photo upload is included on every tier for quickCheckout orders.
      // See PR feat/portrait-included-all-tiers — the portrait toggle was
      // removed; all paid reports ship with the portrait flag on.
      let includesPortrait = true;
      // Hardcover always includes portrait (harmless now — retained for clarity)
      if (includesBook) {
        includesPortrait = true;
      }

      // Calculate price server-side
      if (includesBook) {
        // Hardcover per pet — includes reading + portrait + book
        var totalAmount = pricing.hardcover * petCount;
      } else if (hasPerTierCounts) {
        // Mixed-tier digital: price each tier independently, then apply volume discount on the total.
        const readingTotal = (basicCount * pricing.basic) + (premiumCount * pricing.premium);
        const discountRate = getVolumeDiscount(petCount);
        const discountAmount = Math.round(readingTotal * discountRate);
        var totalAmount = readingTotal - discountAmount;
      } else {
        // Photo upload is included at the tier price — no separate portrait add-on.
        const perPetPrice = tierKey === 'premium' ? pricing.premium : pricing.basic;
        const readingTotal = perPetPrice * petCount;
        const discountRate = getVolumeDiscount(petCount);
        const discountAmount = Math.round(readingTotal * discountRate);
        var totalAmount = readingTotal - discountAmount;
      }

      // Apply coupon discount for quick checkout.
      // Two stacking guards:
      //   (a) gift_only coupons are rejected here — they're for /gift only.
      //   (b) combined (volume + coupon) discount capped at STACK_CAP of
      //       the pre-discount reading total, so a 5-pet 30% volume cart
      //       stacked with a 30% wheel coupon can't go below 60% of base.
      if (input.couponId) {
        const { data: coupon } = await supabaseClient
          .from("coupons")
          .select("*")
          .eq("id", input.couponId)
          .eq("is_active", true)
          .single();
        if (coupon) {
          const valid = (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
            && (!coupon.max_uses || coupon.current_uses < coupon.max_uses);
          if (valid && coupon.gift_only) {
            console.log("[CREATE-CHECKOUT] Quick checkout: gift_only coupon rejected on regular flow:", coupon.code);
          } else if (valid) {
            // Pre-cap discount
            let discount = (coupon.discount_type === 'percentage' || coupon.discount_type === 'percent')
              ? Math.round(totalAmount * (coupon.discount_value / 100))
              : coupon.discount_value;

            // Stacking cap — totalAmount at this point has volume discount
            // already subtracted. We need the pre-volume-discount base to
            // compute the cap. Recompute it cheaply.
            const baseBeforeVolume = includesBook
              ? pricing.hardcover * petCount
              : (hasPerTierCounts
                  ? (basicCount * pricing.basic) + (premiumCount * pricing.premium)
                  : (tierKey === 'premium' ? pricing.premium : pricing.basic) * petCount);
            const volumeAlreadyApplied = baseBeforeVolume - totalAmount; // positive
            const STACK_CAP = 0.40;
            const maxTotalDiscount = Math.floor(baseBeforeVolume * STACK_CAP);
            const cappedCouponDiscount = Math.max(0, maxTotalDiscount - volumeAlreadyApplied);
            if (discount > cappedCouponDiscount) {
              console.log("[CREATE-CHECKOUT] Quick checkout: coupon capped by stack rule. raw=", discount, "capped=", cappedCouponDiscount, "volumeAlready=", volumeAlreadyApplied);
              discount = cappedCouponDiscount;
            }

            totalAmount = totalAmount - discount;
            console.log("[CREATE-CHECKOUT] Quick checkout coupon applied:", coupon.code, "discount:", discount, "new total:", totalAmount);
            // Increment usage (only if the coupon actually discounted something)
            if (discount > 0) {
              await supabaseClient.from("coupons").update({ current_uses: coupon.current_uses + 1 }).eq("id", coupon.id);
            }
          }
        }
      }

      // Create placeholder report(s). With mixed tiers, first basicCount placeholders
      // are basic (no portrait), remaining premiumCount get includes_portrait=true.
      //
      // Memorial occasion slot: the LAST memorialCount rows of the cart are
      // flagged occasion_mode='memorial'. Memorial tier shares the premium
      // Stripe price so memorialCount always lands inside the premiumCount
      // block — see the InlineCheckout cart (memorialQty bundles into
      // combinedPremiumCount). Non-memorial rows inherit the cart-level
      // occasionMode (landing-path default: new / discover / etc.). This
      // means each pet_reports row leaves create-checkout with the correct
      // per-pet occasion already written, so stripe-webhook + intake read
      // the right mode per row without any reconciliation step.
      const memorialCount = input.memorialCount ?? 0;
      const firstMemorialIndex = petCount - memorialCount;
      const reportIds: string[] = [];
      for (let i = 0; i < petCount; i++) {
        const perPetIncludesPortrait = hasPerTierCounts
          ? (i >= basicCount) // basic first, premium after
          : includesPortrait;
        const isMemorialRow = memorialCount > 0 && i >= firstMemorialIndex;
        const perPetOccasion = isMemorialRow ? "memorial" : occasionMode;
        const { data: placeholderReport, error: insertError } = await supabaseClient
          .from("pet_reports")
          .insert({
            email: input.quickCheckoutEmail || "pending@checkout.temp",
            pet_name: "Pending",
            species: "pending",
            payment_status: "pending",
            occasion_mode: perPetOccasion,
            includes_book: includesBook,
            includes_portrait: perPetIncludesPortrait || includesBook,
          })
          .select("id")
          .single();

        if (insertError || !placeholderReport) {
          console.error("[CREATE-CHECKOUT] Failed to create placeholder report:", insertError);
          throw new Error("Failed to create report record");
        }
        reportIds.push(placeholderReport.id);
      }

      const primaryReportId = reportIds[0];

      // Charity bonus donation (optional, customer-added)
      const charityBonus = input.charityBonus || 0;
      const charityBonusCents = charityBonus * 100;

      console.log("[CREATE-CHECKOUT] Quick checkout — reports:", reportIds, "tier:", tierKey, "total:", totalAmount, "book:", includesBook, "charityBonus:", charityBonus);

      // If total is $0 (shouldn't normally happen for quick checkout, but handle it)
      if (totalAmount <= 0) {
        console.log("[CREATE-CHECKOUT] Quick checkout free order — skipping Stripe");
        for (const id of reportIds) {
          await supabaseClient
            .from("pet_reports")
            .update({
              payment_status: "paid",
              includes_book: includesBook,
              includes_portrait: includesPortrait,
            })
            .eq("id", id);

          const creditAmount = includesBook ? 500 : 150;
          await supabaseClient
            .from("chat_credits")
            .upsert({
              report_id: id,
              email: "pending@checkout.temp",
              credits_remaining: creditAmount,
              plan: "free_coupon",
            }, { onConflict: "report_id" });
        }

        return new Response(JSON.stringify({
          free: true,
          reportId: primaryReportId,
          reportIds,
          url: `${origin}/payment-success?session_id=free&report_id=${primaryReportId}&free=true&quick=true`,
        }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Build line items
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      // Format the post-trial horoscope price for receipt copy in the user's currency.
      const horoscopeMonthlyLabel = new Intl.NumberFormat("en-US", {
        style: "currency", currency: currency.toUpperCase(),
        maximumFractionDigits: 2, minimumFractionDigits: 2,
      }).format(pricing.horoscopeMonthly / 100);

      if (includesBook) {
        lineItems.push({
          price_data: {
            currency,
            product_data: {
              name: petCount > 1 ? `${petCount}× The Little Souls Book` : 'The Little Souls Book',
              description: 'Hardcover book + digital reading + AI portrait',
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        });
      } else {
        // DIGITAL: Soul Reading and/or Soul Bond. For mixed-tier orders, name reflects the mix.
        let productName: string;
        let productDescription: string | undefined;
        if (hasPerTierCounts && basicCount > 0 && premiumCount > 0) {
          productName = `Little Souls — ${petCount} readings`;
          const parts = [];
          if (basicCount > 0) parts.push(`${basicCount}× Soul Reading`);
          if (premiumCount > 0) parts.push(`${premiumCount}× Soul Bond`);
          productDescription = parts.join(' + ');
        } else {
          const tierName = includesPortrait ? 'Soul Bond' : 'Soul Reading';
          productName = petCount > 1 ? `${petCount}× Little Souls — ${tierName}` : `Little Souls — ${tierName}`;
          productDescription = input.includeHoroscope
            ? `Includes 1 month of weekly horoscopes — free (then ${horoscopeMonthlyLabel}/month, cancel anytime)`
            : undefined;
        }
        lineItems.push({
          price_data: {
            currency,
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        });
      }

      // Charity bonus donation — separate line item so it's visible on the receipt
      if (charityBonusCents > 0) {
        const CHARITY_NAMES: Record<string, string> = {
          "ifaw": "IFAW",
          "world-land-trust": "World Land Trust",
          "eden-reforestation": "Eden Reforestation",
        };
        const charityName = CHARITY_NAMES[input.charityId || ""] || "Animal Welfare";
        lineItems.push({
          price_data: {
            currency,
            product_data: {
              name: `Charity Donation — ${charityName}`,
              description: `Your extra contribution to ${charityName}`,
            },
            unit_amount: charityBonusCents,
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        ...(input.quickCheckoutEmail ? { customer_email: input.quickCheckoutEmail } : {}),
        line_items: lineItems,
        mode: "payment",
        // Frictionless: card auto-surfaces Apple Pay + Google Pay on supported
        // browsers. Other wallets/BNPL need to be listed explicitly on Checkout
        // Sessions (Stripe only honours automatic_payment_methods for Payment
        // Intents, not Checkout). Stripe still filters by country/currency/amount
        // so UK buyers won't see Klarna in USD etc.
        payment_method_types: [
          "card", "link",
          "klarna", "afterpay_clearpay",
          "amazon_pay", "revolut_pay",
          "bancontact", "eps",
        ],
        allow_promotion_codes: false,
        ...(includesBook ? {
          shipping_address_collection: {
            allowed_countries: ["US", "GB", "CA", "AU", "IE", "NZ", "DE", "FR", "NL", "SE", "NO", "DK", "FI", "ES", "IT", "PT", "BE", "CH", "AT", "SG", "HK", "JP"],
          },
          phone_number_collection: { enabled: true },
        } : {}),
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&report_id=${primaryReportId}&quick=true`,
        cancel_url: `${origin}/`,
        metadata: {
          report_ids: reportIds.join(","),
          pet_count: petCount.toString(),
          selected_tier: tierKey,
          basic_count: hasPerTierCounts ? basicCount.toString() : "",
          premium_count: hasPerTierCounts ? premiumCount.toString() : "",
          quick_checkout: "true",
          ab_variant: input.abVariant || "C",
          includes_portrait: includesPortrait ? "true" : "false",
          includes_book: includesBook ? "true" : "false",
          occasion_mode: occasionMode,
          include_horoscope: input.includeHoroscope ? "true" : "false",
          horoscope_pet_count: input.includeHoroscope ? petCount.toString() : "0",
          // Per-line-item memorial count — canonical source. Each pet_reports
          // placeholder row already carries the correct occasion_mode; this
          // metadata is the audit trail so stripe-webhook + verify-payment
          // can cross-check without a DB round-trip.
          memorial_count: (input.memorialCount ?? 0).toString(),
          // Mixed-cart memorial safety — retained as belt-and-braces. With
          // per-row occasion correctness the webhook's primary guard is
          // report.occasion_mode === 'memorial'; has_memorial just ensures
          // we double-check even if per-row writes ever regress.
          has_memorial: input.hasMemorial ? "true" : "false",
          charity_id: input.charityId || "",
          charity_bonus: charityBonus.toString(),
          currency,
        },
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ========== STANDARD CHECKOUT MODE ==========
    const allReportIds = input.reportIds || (input.reportId ? [input.reportId] : []);
    if (allReportIds.length === 0) {
      throw new Error("At least one report ID is required");
    }
    const primaryReportId = allReportIds[0];

    console.log("[CREATE-CHECKOUT] Starting checkout for reports:", allReportIds, "tier:", input.selectedTier);

    const { data: report, error: reportError } = await supabaseClient
      .from("pet_reports")
      .select("email, pet_name")
      .eq("id", primaryReportId)
      .single();

    if (reportError || !report) {
      throw new Error("Report not found");
    }

    const sanitizedEmail = report.email
      .trim()
      .replace(/,+$/, '')
      .replace(/\s+/g, '');

    // ===== SERVER-SIDE PRICE CALCULATION =====
    const petTiers = input.petTiers || {};
    const petHoroscopes = input.petHoroscopes || {};
    const actualPetCount = allReportIds.length || input.petCount;
    
    const { data: allReports } = await supabaseClient
      .from("pet_reports")
      .select("id, occasion_mode")
      .in("id", allReportIds);
    
    const reportOccasionMap = new Map(allReports?.map(r => [r.id, r.occasion_mode]) || []);
    
    let baseTotal = 0;
    for (let i = 0; i < actualPetCount; i++) {
      const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
      baseTotal += tierKey === 'basic' ? pricing.basic : pricing.premium;
    }
    
    const volumeDiscountRate = getVolumeDiscount(actualPetCount);
    const volumeDiscount = Math.round(baseTotal * volumeDiscountRate);
    
    let horoscopeCost = 0;
    let horoscopePetCount = 0;
    for (let i = 0; i < actualPetCount; i++) {
      const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
      const reportId = allReportIds[i];
      const occasionMode = reportId ? reportOccasionMap.get(reportId) : null;
      const isMemorial = occasionMode === 'memorial';
      const hasHoroscope = petHoroscopes[String(i)] || false;

      if (!isMemorial && hasHoroscope) {
        horoscopeCost += HOROSCOPE_MONTHLY_CENTS;
        horoscopePetCount++;
      }
    }
    
    // At-checkout gift mechanic removed in PR feat/gift-upsell-cleanup.
    // Keep giftAmount in scope as 0 so downstream math + logging keeps working
    // without per-site-wide refactor; the post-purchase gift path uses its
    // own dedicated checkout branch above.
    const giftAmount = 0;
    
    let couponDiscount = 0;
    if (input.couponId) {
      const { data: coupon, error: couponError } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("id", input.couponId)
        .eq("is_active", true)
        .single();

      if (!couponError && coupon) {
        // Gift-only coupons (e.g. the wheel's 25% gift prize) are only
        // valid on the /gift purchase flow, not on regular checkout.
        // Silently reject here so margin is protected even if a stale
        // coupon slips past the frontend guard in InlineCheckout.
        if (coupon.gift_only) {
          console.log("[CREATE-CHECKOUT] gift_only coupon rejected on regular flow:", coupon.code);
        } else if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
          if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
            const subtotal = baseTotal - volumeDiscount;
            if (!coupon.min_purchase_cents || subtotal >= coupon.min_purchase_cents) {
              if (coupon.discount_type === 'percentage' || coupon.discount_type === 'percent') {
                couponDiscount = Math.round(subtotal * (coupon.discount_value / 100));
              } else {
                couponDiscount = coupon.discount_value;
              }
            }
          }
        }
      }
    }

    // Stack cap — combined (volume + coupon) discount can't exceed 40%
    // of the pre-discount base total. Protects margin when a max volume
    // discount (30% at 5+ pets) stacks with a max wheel coupon (30% off).
    // Without this a £245 subtotal could drop to £120 (51% off); the cap
    // pulls the floor to £147 (40% off max combined).
    const STACK_CAP = 0.40;
    const maxTotalDiscount = Math.floor(baseTotal * STACK_CAP);
    if (volumeDiscount + couponDiscount > maxTotalDiscount) {
      const capped = Math.max(0, maxTotalDiscount - volumeDiscount);
      console.log("[CREATE-CHECKOUT] coupon capped by stack rule. raw=", couponDiscount, "capped=", capped, "volume=", volumeDiscount, "baseTotal=", baseTotal);
      couponDiscount = capped;
    }
    
    let giftCertificateDiscount = 0;
    let giftCertificateId: string | null = input.giftCertificateId || null;
    
    if (input.giftCode && !giftCertificateId) {
      const { data: giftByCode, error: codeError } = await supabaseClient
        .from("gift_certificates")
        .select("*")
        .eq("code", input.giftCode.toUpperCase())
        .eq("is_redeemed", false)
        .single();
      
      if (!codeError && giftByCode) {
        if (!giftByCode.expires_at || new Date(giftByCode.expires_at) > new Date()) {
          giftCertificateId = giftByCode.id;
          giftCertificateDiscount = giftByCode.amount_cents;
        }
      }
    }
    
    if (giftCertificateId && giftCertificateDiscount === 0) {
      const { data: giftCert, error: giftError } = await supabaseClient
        .from("gift_certificates")
        .select("*")
        .eq("id", giftCertificateId)
        .eq("is_redeemed", false)
        .single();
      
      if (!giftError && giftCert) {
        if (!giftCert.expires_at || new Date(giftCert.expires_at) > new Date()) {
          giftCertificateDiscount = giftCert.amount_cents;
        }
      }
    }
    
    let customerReferralDiscount = 0;
    if (input.referralCode && input.referralCode.startsWith("REF-")) {
      const { data: referrer } = await supabaseClient
        .from("email_subscribers")
        .select("email, referral_code")
        .eq("referral_code", input.referralCode)
        .single();
      
      if (referrer && referrer.email.toLowerCase() !== sanitizedEmail.toLowerCase()) {
        const { data: existingRef } = await supabaseClient
          .from("customer_referrals")
          .select("id")
          .eq("referred_email", sanitizedEmail.toLowerCase())
          .single();
        
        if (!existingRef) {
          customerReferralDiscount = 500;
        }
      }
    }
    
    // Book upsell for standard checkout
    const bookAmount = input.includesBook ? pricing.hardcover : 0;

    const calculatedTotal = Math.max(0, 
      baseTotal - volumeDiscount - couponDiscount - giftCertificateDiscount - customerReferralDiscount + giftAmount + horoscopeCost + bookAmount
    );

    console.log("[CREATE-CHECKOUT] Server-calculated price:", {
      baseTotal,
      volumeDiscount,
      horoscopeCost,
      couponDiscount,
      giftCertificateDiscount,
      customerReferralDiscount,
      giftAmount,
      bookAmount,
      calculatedTotal,
    });

    if (calculatedTotal === 0) {
      console.log("[CREATE-CHECKOUT] Free order detected — skipping Stripe");

      for (let i = 0; i < allReportIds.length; i++) {
        const id = allReportIds[i];
        const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
        const tierIncludesPortrait = tierKey === 'premium' || input.includesBook;
        const petPhoto = input.petPhotos?.[String(i)];

        const updateData: Record<string, unknown> = {
          payment_status: "paid",
          includes_book: input.includesBook || false,
          includes_portrait: tierIncludesPortrait,
        };
        if (tierIncludesPortrait && petPhoto?.url) {
          updateData.pet_photo_url = petPhoto.url;
        }
        await supabaseClient
          .from("pet_reports")
          .update(updateData)
          .eq("id", id);

        // Set SoulSpeak credits
        const creditAmount = input.includesBook ? 500 : 150;
        await supabaseClient
          .from("chat_credits")
          .upsert({
            report_id: id,
            email: sanitizedEmail,
            credits_remaining: creditAmount,
            plan: "free_coupon",
          }, { onConflict: "report_id" });
      }

      // Increment coupon usage — only when the coupon actually discounted
      // something. Gift-only rejections + stack-cap zeroes leave couponDiscount
      // at 0, and those shouldn't burn the coupon's single-use budget.
      if (input.couponId && couponDiscount > 0) {
        const { data: couponData } = await supabaseClient
          .from("coupons")
          .select("current_uses")
          .eq("id", input.couponId)
          .single();
        if (couponData) {
          await supabaseClient
            .from("coupons")
            .update({ current_uses: couponData.current_uses + 1 })
            .eq("id", input.couponId);
        }
      }

      // Mark gift certificate as redeemed
      if (giftCertificateId) {
        await supabaseClient
          .from("gift_certificates")
          .update({
            is_redeemed: true,
            redeemed_at: new Date().toISOString(),
            redeemed_by_report_id: primaryReportId,
          })
          .eq("id", giftCertificateId);
      }

      return new Response(JSON.stringify({
        free: true,
        reportId: primaryReportId,
        reportIds: allReportIds,
        url: `${origin}/payment-success?session_id=free&report_id=${primaryReportId}&free=true`,
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build line items
    const mainItemAmount = Math.max(0, calculatedTotal - giftAmount - horoscopeCost - bookAmount);
    
    const tierCounts = { basic: 0, premium: 0 };
    for (let i = 0; i < actualPetCount; i++) {
      const tierKey = (petTiers[String(i)] || input.selectedTier || 'premium') as keyof typeof tierCounts;
      tierCounts[tierKey]++;
    }
    
    const orderDesc = Object.entries(tierCounts)
      .filter(([_, count]) => count > 0)
      .map(([tier, count]) => `${count}× ${TIER_NAMES[tier as keyof typeof TIER_NAMES]}`)
      .join(' + ');

    const horoscopeMonthlyLabelStd = new Intl.NumberFormat("en-US", {
      style: "currency", currency: currency.toUpperCase(),
      maximumFractionDigits: 2, minimumFractionDigits: 2,
    }).format(pricing.horoscopeMonthly / 100);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
      price_data: {
        currency,
        product_data: {
          name: actualPetCount > 1
            ? `Little Souls Readings (${actualPetCount} pets)`
            : TIER_NAMES[input.selectedTier],
          description: actualPetCount > 1 ? orderDesc : undefined,
        },
        unit_amount: mainItemAmount,
      },
      quantity: 1,
    }];

    if (horoscopeCost > 0 && horoscopePetCount > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: horoscopePetCount > 1
              ? `🌙 Weekly Horoscopes - ${horoscopePetCount} pets (1st month)`
              : '🌙 Weekly Horoscope Subscription (1st month)',
            description: `Personalized cosmic guidance delivered weekly. ${horoscopeMonthlyLabelStd}/month - cancel anytime.`,
          },
          unit_amount: horoscopeCost,
        },
        quantity: 1,
      });
    }

    // Gift-for-friend line item at checkout was removed in
    // PR feat/gift-upsell-cleanup (the 50% off mechanic was self-arbitrageable).
    // Gifts now flow through the post-purchase giftUpsell path and /gift.

    // Book line item
    if (input.includesBook) {
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: 'The Little Souls Book',
            description: 'Hardcover book + digital reading + AI portrait',
          },
          unit_amount: pricing.hardcover,
        },
        quantity: 1,
      });
    }

    const checkoutMode = "payment";

    const anyPetHasPortrait = Object.values(petTiers).some(t => t === 'premium') ||
      input.selectedTier === 'premium' || input.includesBook;

    try {
      for (let i = 0; i < allReportIds.length; i++) {
        const id = allReportIds[i];
        const tierKey = petTiers[String(i)] || input.selectedTier || 'premium';
        const needsPhoto = tierKey === 'premium' || input.includesBook;
        const petPhoto = input.petPhotos?.[String(i)];

        if (needsPhoto && petPhoto?.url) {
          await supabaseClient
            .from('pet_reports')
            .update({ pet_photo_url: petPhoto.url })
            .eq('id', id);
        }
      }
    } catch (err) {
      console.error('[CREATE-CHECKOUT] Failed to persist pet photos:', err);
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: sanitizedEmail,
      line_items: lineItems,
      mode: checkoutMode,
      payment_method_types: ["card", "link", "klarna", "afterpay_clearpay"],
      ...(input.includesBook ? {
        shipping_address_collection: {
          allowed_countries: ["US", "GB", "CA", "AU", "IE", "NZ", "DE", "FR", "NL", "SE", "NO", "DK", "FI", "ES", "IT", "PT", "BE", "CH", "AT", "SG", "HK", "JP"],
        },
        phone_number_collection: { enabled: true },
      } : {}),
      // Save the payment method for future off-session subscription charges.
      // Required so the $4.99/month horoscope subscription can charge after the 30-day trial.
      // Klarna/Afterpay don't support off_session — Stripe will filter them out automatically
      // when horoscopes are included, which is correct (recurring billing needs a saved card).
      ...(horoscopePetCount > 0 ? { payment_intent_data: { setup_future_usage: "off_session" } } : {}),
      allow_promotion_codes: false,
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&report_id=${primaryReportId}`,
      cancel_url: `${origin}/`,
      metadata: {
        report_ids: allReportIds.join(","),
        pet_count: actualPetCount.toString(),
        selected_tier: input.selectedTier,
        pet_tiers: JSON.stringify(petTiers),
        pet_photos: JSON.stringify(input.petPhotos || {}),
        include_gift: input.includeGiftForFriend ? "true" : "false",
        gift_tier_for_friend: input.includeGiftForFriend ? (input.giftTierForFriend || 'basic') : "",
        includes_portrait: anyPetHasPortrait ? "true" : "false",
        includes_book: input.includesBook ? "true" : "false",
        is_gift: input.isGift ? "true" : "false",
        recipient_name: input.recipientName,
        recipient_email: input.recipientEmail,
        gift_message: input.giftMessage,
        coupon_id: input.couponId || "",
        gift_certificate_id: input.giftCertificateId || "",
        referral_code: input.referralCode || "",
        include_horoscope: (horoscopePetCount > 0 || input.includeHoroscope) ? "true" : "false",
        horoscope_pet_count: horoscopePetCount.toString(),
        pet_horoscopes: JSON.stringify(petHoroscopes),
        pet_photo_url: input.petPhotoUrl || "",
        ab_variant: input.abVariant || "",
        currency,
      },
    });

    console.log("[CREATE-CHECKOUT] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    
    if (error instanceof z.ZodError) {
      console.error("[CREATE-CHECKOUT] Validation errors:", error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid request parameters"
      }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
