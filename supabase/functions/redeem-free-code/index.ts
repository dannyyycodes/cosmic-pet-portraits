import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const { code, petName, species, occasionMode } = body;
    const email = body.email?.trim().toLowerCase() || "";

    // Multi-pet testing support — if the buyer has N pets in their cart,
    // create N free reports matching the selected tier mix. Lets QATEST
    // exercise the real 4-pet intake + reveal flow end-to-end.
    const rawBasicCount = Number(body.basicCount);
    const rawPremiumCount = Number(body.premiumCount);
    const basicCount = Number.isFinite(rawBasicCount) && rawBasicCount > 0 ? Math.floor(rawBasicCount) : 0;
    const premiumCount = Number.isFinite(rawPremiumCount) && rawPremiumCount > 0 ? Math.floor(rawPremiumCount) : 0;
    const totalPetCount = basicCount + premiumCount;
    const isMultiPet = totalPetCount > 1;
    // Hard cap — same as MAX_PETS in the frontend, never trust the client.
    if (totalPetCount > 10) {
      return new Response(JSON.stringify({ error: "Max 10 pets per redemption" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (!code || !code.trim()) {
      return new Response(JSON.stringify({ error: "Please enter a redeem code" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    console.log("[REDEEM] Validating code:", normalizedCode);

    // Rate limiting: max 10 redemptions per minute from same IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentRedemptions } = await supabase
      .from("pet_reports")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneMinuteAgo)
      .eq("payment_status", "paid")
      .not("redeem_code", "is", null);

    if ((recentRedemptions || 0) > 20) {
      console.log("[REDEEM] Global rate limit hit");
      return new Response(JSON.stringify({ error: "Too many redemptions. Please try again in a moment." }), {
        status: 429,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Validate code format (alphanumeric + dash only)
    if (!/^[A-Z0-9\-_]{2,50}$/.test(normalizedCode)) {
      return new Response(JSON.stringify({ error: "Invalid code format" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Look up the code
    const { data: redeemCode, error: lookupError } = await supabase
      .from("redeem_codes")
      .select("*")
      .eq("code", normalizedCode)
      .single();

    if (lookupError || !redeemCode) {
      console.log("[REDEEM] Code not found:", normalizedCode);
      return new Response(JSON.stringify({ error: "Invalid redeem code" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check if active
    if (!redeemCode.is_active) {
      return new Response(JSON.stringify({ error: "This code has been deactivated" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (redeemCode.expires_at && new Date(redeemCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This code has expired" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Check usage limit
    if (redeemCode.max_uses && redeemCode.current_uses >= redeemCode.max_uses) {
      return new Response(JSON.stringify({ error: "This code has reached its usage limit" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const codeTier = redeemCode.tier || "premium";
    const codeIncludesBook = codeTier === "hardcover";

    // Build the per-pet tier list. In single-pet mode this is just one row
    // at the redeem-code's tier. In multi-pet mode we honour the buyer's
    // cart mix: N basic + M premium. If the code itself is hardcover it
    // overrides the mix because that's a special product.
    type PetTier = "basic" | "premium" | "hardcover";
    const petTiers: PetTier[] = isMultiPet
      ? (codeIncludesBook
          ? Array.from({ length: totalPetCount }, () => "hardcover" as const)
          : [
              ...Array.from({ length: basicCount }, () => "basic" as const),
              ...Array.from({ length: premiumCount }, () => "premium" as const),
            ])
      : [codeTier as PetTier];

    // Refuse to burn a usage if we can't service the whole cart.
    const remainingUses = (redeemCode.max_uses ?? Infinity) - (redeemCode.current_uses ?? 0);
    if (remainingUses < petTiers.length) {
      return new Response(JSON.stringify({ error: "Not enough uses left on this code for your cart" }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const rowsToInsert = petTiers.map((t) => ({
      email: email || "pending@redeem.littlesouls.app",
      pet_name: petName || "Pending",
      species: species || "pending",
      payment_status: "paid",
      occasion_mode: occasionMode || "discover",
      includes_book: t === "hardcover",
      includes_portrait: t === "premium" || t === "hardcover",
      redeem_code: normalizedCode,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("pet_reports")
      .insert(rowsToInsert)
      .select("id, includes_portrait, includes_book");

    if (insertError || !inserted || inserted.length !== rowsToInsert.length) {
      console.error("[REDEEM] Failed to create reports:", insertError);
      throw new Error("Failed to create reports");
    }

    const reportIds = inserted.map((r) => r.id);
    console.log("[REDEEM] Reports created:", reportIds.length, "ids:", reportIds.join(","));

    // Seed pooled SoulSpeak credits at the household (email) level. This
    // matches the paid-checkout behaviour in soul-chat.ts — one shared pool
    // scaled by pet count rather than N per-pet rows.
    if (email) {
      const creditAmount = codeIncludesBook ? 500 * reportIds.length : 150 * reportIds.length;
      const { data: existingPool } = await supabase
        .from("chat_credits")
        .select("id, credits_remaining")
        .eq("email", email)
        .is("order_id", null)
        .maybeSingle();
      if (existingPool) {
        await supabase
          .from("chat_credits")
          .update({ credits_remaining: (existingPool.credits_remaining ?? 0) + creditAmount })
          .eq("id", existingPool.id);
      } else {
        await supabase.from("chat_credits").insert({
          email,
          order_id: null,
          credits_remaining: creditAmount,
          plan: "redeemed",
        });
      }
    }

    // Increment usage count by the number of reports created.
    await supabase
      .from("redeem_codes")
      .update({ current_uses: (redeemCode.current_uses ?? 0) + reportIds.length })
      .eq("id", redeemCode.id);

    console.log("[REDEEM] Code redeemed successfully:", normalizedCode, "pets:", reportIds.length);

    return new Response(JSON.stringify({
      success: true,
      // `reportId` kept for backward-compat with the old single-pet caller.
      reportId: reportIds[0],
      reportIds,
      petCount: reportIds.length,
      tier: codeTier,
      includesPortrait: petTiers.some((t) => t === "premium" || t === "hardcover"),
      includesBook: codeIncludesBook,
    }), {
      status: 200,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[REDEEM] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to redeem code" }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
