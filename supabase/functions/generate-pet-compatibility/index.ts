import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

const RATE_LIMIT_COUNT = 6;
const RATE_LIMIT_WINDOW_SECONDS = 600;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function canonicalPair(a: string, b: string): [string, string] {
  // Canonical ordering matches the DB check constraint pet_report_a_id < pet_report_b_id.
  return a < b ? [a, b] : [b, a];
}

/**
 * Kicks off a cross-pet compatibility reading for two pets the caller owns.
 *
 * - Validates both reports exist, are paid, and share the same buyer email
 *   (prevents a random visitor from generating a reading against someone
 *   else's pet once they know a reportId).
 * - Creates or reuses the canonical pet_compatibilities row so we never
 *   double-generate the same pair.
 * - Triggers the worker via n8n (same pattern as generate-report-background).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { petReportAId, petReportBId, stripeSessionId } = await req.json();
    if (!petReportAId || !petReportBId || petReportAId === petReportBId) {
      return new Response(JSON.stringify({ error: "Two distinct pet report ids required" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ip = getClientIp(req);
    const rl = await checkRateLimit(supabase, "generate-pet-compatibility", ip, RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_SECONDS);
    if (!rl.ok) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) },
      });
    }

    const [aId, bId] = canonicalPair(petReportAId, petReportBId);

    const { data: reports, error: fetchError } = await supabase
      .from("pet_reports")
      .select("id, email, pet_name, payment_status, report_content, species, birth_date, birth_time, birth_location, gender, pet_photo_url, occasion_mode")
      .in("id", [aId, bId]);

    if (fetchError || !reports || reports.length !== 2) {
      return new Response(JSON.stringify({ error: "Source reports not found" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Both reports must be paid.
    if (reports.some(r => r.payment_status !== "paid")) {
      return new Response(JSON.stringify({ error: "Both reports must be paid" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 402,
      });
    }

    // Refuse compatibility pairings that include a memorial pet — the reading
    // is framed as a living relationship ("how they move through the world
    // together") and would land as a care failure on a grieving owner.
    if (reports.some(r => r.occasion_mode === "memorial")) {
      return new Response(JSON.stringify({ error: "Compatibility readings are only available for living pets" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Both reports must be for the same buyer — otherwise anyone could generate
    // a compatibility reading against a pet they don't own.
    const emailA = (reports[0].email || "").toLowerCase().trim();
    const emailB = (reports[1].email || "").toLowerCase().trim();
    if (!emailA || emailA !== emailB) {
      return new Response(JSON.stringify({ error: "Reports must belong to the same household" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Both underlying readings must already exist, otherwise the compatibility
    // worker has nothing to synthesise from.
    if (reports.some(r => !r.report_content || r.report_content.status === "generating" || r.report_content.error)) {
      return new Response(JSON.stringify({ error: "Source readings not ready yet — try again in a minute" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 409,
      });
    }

    // Upsert the pair — DB unique constraint guarantees idempotency.
    const { data: existing } = await supabase
      .from("pet_compatibilities")
      .select("id, status, reading_content, share_token")
      .eq("pet_report_a_id", aId)
      .eq("pet_report_b_id", bId)
      .maybeSingle();

    let compatibilityId: string;
    let shareToken: string;
    let alreadyReady = false;

    if (existing) {
      compatibilityId = existing.id;
      shareToken = existing.share_token;
      if (existing.status === "ready" && existing.reading_content) {
        alreadyReady = true;
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("pet_compatibilities")
        .insert({
          pet_report_a_id: aId,
          pet_report_b_id: bId,
          email: emailA,
          status: "pending",
          stripe_session_id: stripeSessionId ?? null,
        })
        .select("id, share_token")
        .single();
      if (insertError || !inserted) {
        console.error("[COMPAT-GEN] Insert failed:", insertError);
        return new Response(JSON.stringify({ error: "Could not create compatibility record" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 500,
        });
      }
      compatibilityId = inserted.id;
      shareToken = inserted.share_token;
    }

    if (alreadyReady) {
      return new Response(JSON.stringify({ success: true, compatibilityId, shareToken, status: "ready" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Mark generating so the UI can show a loading state via realtime.
    await supabase
      .from("pet_compatibilities")
      .update({ status: "generating" })
      .eq("id", compatibilityId);

    // Trigger the worker. Uses the same n8n pattern as the single-pet flow so
    // the generation happens on the droplet with the full Claude time budget.
    const N8N_WEBHOOK = Deno.env.get("N8N_COMPATIBILITY_WEBHOOK_URL");
    if (N8N_WEBHOOK) {
      fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compatibilityId, petReportAId: aId, petReportBId: bId }),
      }).catch(err => console.error("[COMPAT-GEN] n8n error:", err));
    } else {
      console.warn("[COMPAT-GEN] N8N_COMPATIBILITY_WEBHOOK_URL not set — compatibility will stay 'generating' until worker is deployed");
    }

    return new Response(JSON.stringify({ success: true, compatibilityId, shareToken, status: "generating" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[COMPAT-GEN] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
