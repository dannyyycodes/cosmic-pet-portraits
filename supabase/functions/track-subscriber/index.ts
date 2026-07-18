import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Input validation schema
const trackSchema = z.object({
  email: z.string().email().max(255),
  event: z.enum(["birth_chart_lead", "intake_started", "intake_completed", "purchase_completed", "unsubscribe"]),
  petName: z.string().max(50).nullish(),
  species: z.string().max(30).nullish(),
  petPhotoUrl: z.string().url().max(2048).nullish(),
  petReportId: z.string().uuid().nullish(),
  tier: z.enum(["basic", "premium"]).nullish(),
  source: z.enum(["intake", "gift", "referral", "birth_chart_preview", "free_reading_start"]).nullish(),
  referralCode: z.string().max(50).nullish(),
  // Which register the visitor is in — memorial vs discovery — so leads can be
  // segmented into the right drip. OPTIONAL and nullish so older cached clients
  // that don't send it still validate (never 400 a live lead over a new field).
  register: z.enum(["memorial", "discovery"]).nullish(),
  // First-party utm attribution the client already collects via getUtm(): a
  // flat object of utm_* strings. Optional; an empty object is fine.
  utm: z.record(z.string(), z.string()).nullish(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const rawInput = await req.json();
    const input = trackSchema.parse(rawInput);

    // First-letter title-case on the stored pet name ("monty" -> "Monty",
    // while "DJ" and "McFly" survive). Mirrors the client's display rule so
    // every later email greets the pet the way the reading does.
    if (input.petName) {
      const trimmed = input.petName.trim();
      input.petName = trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : null;
    }

    console.log("[TRACK-SUBSCRIBER] Tracking:", input.event, "for:", input.email);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();

    // Check if subscriber exists
    const { data: existing } = await supabase
      .from("email_subscribers")
      .select("*")
      .eq("email", input.email)
      .single();

    if (input.event === "unsubscribe") {
      if (existing) {
        await supabase
          .from("email_subscribers")
          .update({
            is_subscribed: false,
            unsubscribed_at: now,
          })
          .eq("id", existing.id);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Register intent + first-party utm attribution. Additive: spread into every
    // insert/update below so each lead lands in the right drip.
    //   intent_register — "memorial" ALWAYS wins and is NEVER downgraded to
    //   "discovery". If the row is already memorial we write nothing; older
    //   cached clients send no `register`, so we leave the stored value untouched
    //   (new rows then fall back to the column's 'discovery' default).
    //   utm — only written when the client actually sent attribution, so an
    //   empty object never clobbers a value already on the row.
    const regFields: { intent_register?: string; utm?: Record<string, string> } = {};
    if (existing?.intent_register !== "memorial" && input.register) {
      regFields.intent_register = input.register;
    }
    if (input.utm && Object.keys(input.utm).length > 0) {
      regFields.utm = input.utm;
    }

    if (input.event === "birth_chart_lead") {
      // Free birth-chart preview lead. New emails enter the standard welcome
      // nurture via journey_stage "new_lead"; existing subscribers are only
      // enriched (never downgraded out of a later stage).
      if (existing) {
        await supabase
          .from("email_subscribers")
          .update({
            pet_name: input.petName || existing.pet_name,
            // Never overwrite an existing photo/species with an empty one — the
            // earliest values they gave us stay with the lead through the drip.
            pet_photo_url: input.petPhotoUrl || existing.pet_photo_url,
            species: input.species || existing.species,
            source: existing.source || input.source || "birth_chart_preview",
            ...regFields,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("email_subscribers").insert({
          email: input.email,
          pet_name: input.petName,
          pet_photo_url: input.petPhotoUrl || null,
          species: input.species || null,
          journey_stage: "new_lead",
          source: input.source || "birth_chart_preview",
          referral_code: input.referralCode,
          ...regFields,
        });
      }
    }

    if (input.event === "intake_started") {
      if (existing) {
        // Update existing
        await supabase
          .from("email_subscribers")
          .update({
            pet_name: input.petName || existing.pet_name,
            pet_photo_url: input.petPhotoUrl || existing.pet_photo_url,
            intake_started_at: existing.intake_started_at || now,
            journey_stage: existing.journey_stage === "new_lead" ? "intake_started" : existing.journey_stage,
            ...regFields,
          })
          .eq("id", existing.id);
      } else {
        // Create new
        await supabase.from("email_subscribers").insert({
          email: input.email,
          pet_name: input.petName,
          pet_photo_url: input.petPhotoUrl || null,
          journey_stage: "intake_started",
          intake_started_at: now,
          source: input.source || "intake",
          referral_code: input.referralCode,
          ...regFields,
        });
      }
    }

    if (input.event === "intake_completed") {
      if (existing) {
        await supabase
          .from("email_subscribers")
          .update({
            pet_name: input.petName || existing.pet_name,
            pet_photo_url: input.petPhotoUrl || existing.pet_photo_url,
            pet_report_id: input.petReportId || existing.pet_report_id,
            journey_stage: "intake_started", // Still waiting for payment
            ...regFields,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("email_subscribers").insert({
          email: input.email,
          pet_name: input.petName,
          pet_photo_url: input.petPhotoUrl || null,
          pet_report_id: input.petReportId,
          journey_stage: "intake_started",
          intake_started_at: now,
          source: input.source || "intake",
          referral_code: input.referralCode,
          ...regFields,
        });
      }
    }

    if (input.event === "purchase_completed") {
      if (existing) {
        await supabase
          .from("email_subscribers")
          .update({
            pet_name: input.petName || existing.pet_name,
            pet_photo_url: input.petPhotoUrl || existing.pet_photo_url,
            pet_report_id: input.petReportId || existing.pet_report_id,
            journey_stage: "purchased",
            purchase_completed_at: now,
            tier_purchased: input.tier,
            ...regFields,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("email_subscribers").insert({
          email: input.email,
          pet_name: input.petName,
          pet_photo_url: input.petPhotoUrl || null,
          pet_report_id: input.petReportId,
          journey_stage: "purchased",
          purchase_completed_at: now,
          tier_purchased: input.tier,
          source: input.source || "intake",
          referral_code: input.referralCode,
          ...regFields,
        });
      }
    }

    console.log("[TRACK-SUBSCRIBER] Successfully tracked:", input.event);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[TRACK-SUBSCRIBER] Validation error:", error.errors);
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.error("[TRACK-SUBSCRIBER] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
