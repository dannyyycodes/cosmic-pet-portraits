import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const trackSchema = z.object({
  email: z.string().email().max(255),
  event: z.enum(["intake_started", "intake_completed", "purchase_completed", "unsubscribe"]),
  petName: z.string().max(50).optional(),
  petReportId: z.string().uuid().optional(),
  tier: z.enum(["basic", "premium", "vip"]).optional(),
  source: z.enum(["intake", "gift", "referral"]).optional(),
  referralCode: z.string().max(50).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInput = await req.json();
    const input = trackSchema.parse(rawInput);

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (input.event === "intake_started") {
      if (existing) {
        // Update existing
        await supabase
          .from("email_subscribers")
          .update({
            pet_name: input.petName || existing.pet_name,
            intake_started_at: existing.intake_started_at || now,
            journey_stage: existing.journey_stage === "new_lead" ? "intake_started" : existing.journey_stage,
          })
          .eq("id", existing.id);
      } else {
        // Create new
        await supabase.from("email_subscribers").insert({
          email: input.email,
          pet_name: input.petName,
          journey_stage: "intake_started",
          intake_started_at: now,
          source: input.source || "intake",
          referral_code: input.referralCode,
        });
      }
    }

    if (input.event === "intake_completed") {
      if (existing) {
        await supabase
          .from("email_subscribers")
          .update({
            pet_name: input.petName || existing.pet_name,
            pet_report_id: input.petReportId || existing.pet_report_id,
            journey_stage: "intake_started", // Still waiting for payment
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("email_subscribers").insert({
          email: input.email,
          pet_name: input.petName,
          pet_report_id: input.petReportId,
          journey_stage: "intake_started",
          intake_started_at: now,
          source: input.source || "intake",
          referral_code: input.referralCode,
        });
      }
    }

    if (input.event === "purchase_completed") {
      if (existing) {
        await supabase
          .from("email_subscribers")
          .update({
            pet_name: input.petName || existing.pet_name,
            pet_report_id: input.petReportId || existing.pet_report_id,
            journey_stage: "purchased",
            purchase_completed_at: now,
            tier_purchased: input.tier,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("email_subscribers").insert({
          email: input.email,
          pet_name: input.petName,
          pet_report_id: input.petReportId,
          journey_stage: "purchased",
          purchase_completed_at: now,
          tier_purchased: input.tier,
          source: input.source || "intake",
          referral_code: input.referralCode,
        });
      }
    }

    console.log("[TRACK-SUBSCRIBER] Successfully tracked:", input.event);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[TRACK-SUBSCRIBER] Validation error:", error.errors);
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.error("[TRACK-SUBSCRIBER] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});