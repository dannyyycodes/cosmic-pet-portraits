import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { reportId, petName, species, breed, gender, birthDate, birthTime, location, soulType, superpower, strangerReaction, petPhotoUrl, occasionMode, email, ownerName, ownerBirthDate, ownerBirthTime, ownerBirthLocation, ownerMemory, passedDate, favoriteMemory, rememberedBy } = await req.json();

    if (!reportId || !petName || !species) {
      return new Response(JSON.stringify({ error: "Missing required fields: reportId, petName, species" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify report exists and is paid
    const { data: report, error: fetchError } = await supabaseClient
      .from("pet_reports")
      .select("id, payment_status, email")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (report.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not confirmed" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Cap user-submitted text lengths so a malicious payload can't blow up
    // the worker or stuff the report JSON with megabytes of junk.
    const safePetName = String(petName).slice(0, 60);
    const safeSpecies = String(species).slice(0, 40);

    // Update pet data
    const updateData: Record<string, unknown> = {
      pet_name: safePetName,
      species: safeSpecies,
      updated_at: new Date().toISOString(),
    };
    if (breed) updateData.breed = breed.slice(0, 100);
    if (gender) updateData.gender = gender;
    // Reject future / nonsense birth dates before they reach the worker.
    if (birthDate) {
      const iso = String(birthDate).match(/^\d{4}-\d{2}-\d{2}$/) ? String(birthDate) : null;
      if (iso) {
        const today = new Date().toISOString().slice(0, 10);
        const earliest = "1950-01-01"; // no pet alive today was born before this
        if (iso <= today && iso >= earliest) updateData.birth_date = iso;
      }
    }
    if (birthTime) updateData.birth_time = birthTime;
    if (location) updateData.birth_location = location;
    if (soulType) updateData.soul_type = soulType;
    if (superpower) updateData.superpower = superpower;
    if (strangerReaction) updateData.stranger_reaction = strangerReaction;
    if (petPhotoUrl) updateData.pet_photo_url = petPhotoUrl;
    if (occasionMode) updateData.occasion_mode = occasionMode;
    if (email) updateData.email = email.toLowerCase().trim();
    if (ownerName) updateData.owner_name = ownerName.trim().slice(0, 50);
    if (ownerBirthDate) updateData.owner_birth_date = ownerBirthDate;
    if (ownerBirthTime) updateData.owner_birth_time = ownerBirthTime;
    if (ownerBirthLocation) updateData.owner_birth_location = ownerBirthLocation.trim().slice(0, 100);
    if (typeof ownerMemory === "string") {
      const trimmed = ownerMemory.trim().slice(0, 600);
      if (trimmed) updateData.owner_memory = trimmed;
    }
    // Memorial-only anchor fields — the worker's memorial-prompt.ts reads
    // passed_date, favorite_memory and remembered_by from pet_reports to
    // ground every section in this specific pet's story. Only persist when
    // the intake is a memorial flow (occasionMode === "memorial") so we don't
    // accidentally stamp these on a discover / new / birthday / gift row.
    if (occasionMode === "memorial") {
      if (passedDate) {
        const iso = String(passedDate).match(/^\d{4}-\d{2}-\d{2}$/) ? String(passedDate) : null;
        if (iso) {
          const today = new Date().toISOString().slice(0, 10);
          if (iso <= today) updateData.passed_date = iso;
        }
      }
      if (typeof favoriteMemory === "string") {
        const trimmed = favoriteMemory.trim().slice(0, 500);
        if (trimmed) updateData.favorite_memory = trimmed;
      }
      if (typeof rememberedBy === "string") {
        const trimmed = rememberedBy.trim().slice(0, 80);
        if (trimmed) updateData.remembered_by = trimmed;
      }
    }

    const { error: updateError } = await supabaseClient
      .from("pet_reports")
      .update(updateData)
      .eq("id", reportId);

    if (updateError) {
      console.error("[UPDATE-PET-DATA] Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update pet data" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Cancel any horoscope subscription for this pet if the buyer flipped the
    // occasion to memorial during intake. The subscription was created at
    // stripe-webhook time (when all pets were 'discover' by default), so the
    // memorial-guard at that layer couldn't catch it yet. Weekly "your week
    // ahead" emails for a pet who has crossed the rainbow bridge is the kind
    // of bug that would hurt grieving owners badly — so we also cancel the
    // Stripe sub so the buyer stops getting billed.
    if (occasionMode === "memorial") {
      const { data: activeSubs } = await supabaseClient
        .from("horoscope_subscriptions")
        .select("id, stripe_subscription_id")
        .eq("pet_report_id", reportId)
        .eq("status", "active");

      if (activeSubs && activeSubs.length > 0) {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          const { default: Stripe } = await import("https://esm.sh/stripe@17.7.0?target=deno");
          const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
          for (const sub of activeSubs) {
            if (sub.stripe_subscription_id) {
              try { await stripe.subscriptions.cancel(sub.stripe_subscription_id); }
              catch (e) { console.warn("[UPDATE-PET-DATA] Stripe horoscope cancel failed (non-fatal):", e); }
            }
          }
        }
        await supabaseClient
          .from("horoscope_subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("pet_report_id", reportId)
          .eq("status", "active");
        console.log("[UPDATE-PET-DATA] Cancelled horoscope sub(s) for memorial pet:", reportId, activeSubs.length);
      }
    }

    // Sync email to chat_credits if email was updated (e.g. redeem flow where email starts as placeholder)
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      await supabaseClient
        .from("chat_credits")
        .update({ email: normalizedEmail })
        .eq("report_id", reportId);
      console.log("[UPDATE-PET-DATA] Synced email to chat_credits:", normalizedEmail);
    }

    console.log("[UPDATE-PET-DATA] Updated report:", reportId, "pet:", petName, "species:", species);

    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[UPDATE-PET-DATA] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
