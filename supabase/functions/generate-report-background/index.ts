import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

// Generation is expensive (~$0.05 in Sonnet tokens per call). Cap how often
// any single IP can trigger it. Legitimate retry traffic is well under this.
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const PAID_STATUSES = new Set(["paid", "completed"]);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { reportId, includesPortrait = false, attempt = 1 } = await req.json();

    if (!reportId) {
      console.error("[BACKGROUND-GEN] Missing reportId");
      return new Response(JSON.stringify({ error: "Missing reportId" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`[BACKGROUND-GEN] Starting generation for ${reportId}, attempt ${attempt}/${MAX_RETRIES}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Internal callers (verify-payment, redeem trigger, the stale-report
    // backfill cron) authenticate with the service role key. They must NOT be
    // throttled by the public per-IP limit — internal calls carry no
    // x-forwarded-for so they all collapse onto the "unknown" bucket and would
    // starve each other / the cron. Only browser traffic (anon key, real IP)
    // is rate-limited.
    const authHeader = req.headers.get("Authorization") || "";
    const isServiceCall = authHeader === `Bearer ${serviceRoleKey}`;

    if (!isServiceCall) {
      // Per-IP rate limit so an attacker who guesses or scrapes reportIds
      // cannot spam this endpoint and burn our generation budget.
      const ip = getClientIp(req);
      const rl = await checkRateLimit(supabaseClient, "generate-report-background", ip, RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_SECONDS);
      if (!rl.ok) {
        return new Response(JSON.stringify({ error: "Too many requests" }), {
          status: 429,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json", "Retry-After": String(rl.retryAfterSeconds) },
        });
      }
    }

    // Fetch the report data
    const { data: report, error: fetchError } = await supabaseClient
      .from("pet_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      console.error("[BACKGROUND-GEN] Report not found:", reportId, fetchError);
      return new Response(JSON.stringify({ error: "Report not found" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Refuse to generate against unpaid reports. Without this gate an attacker
    // who knows any reportId can trigger Sonnet generation for free.
    if (!PAID_STATUSES.has(report.payment_status)) {
      console.warn("[BACKGROUND-GEN] Refusing to generate for unpaid report:", reportId, report.payment_status);
      return new Response(JSON.stringify({ error: "Report is not paid" }), {
        status: 402,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Only skip if report has real content (not a status marker from a previous attempt)
    const content = report.report_content;
    const hasRealContent = content
      && !content.error
      && !content.status  // skip status markers like "generating", "retrying", "failed"
      && (content.prologue || content.chartPlacements || content.solarSoulprint);

    if (hasRealContent) {
      console.log("[BACKGROUND-GEN] Report already generated:", reportId);
      return new Response(JSON.stringify({ success: true, already_generated: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Skip if already generating (prevent duplicate n8n triggers)
    if (content?.status === "generating") {
      const startedAt = content.started_at ? new Date(content.started_at).getTime() : 0;
      const elapsed = Date.now() - startedAt;
      // Only skip if generation started less than 10 minutes ago
      if (elapsed < 10 * 60 * 1000) {
        console.log("[BACKGROUND-GEN] Already generating, skipping duplicate trigger:", reportId, `(${Math.round(elapsed/1000)}s ago)`);
        return new Response(JSON.stringify({ success: true, already_generating: true }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 200,
        });
      }
      console.log("[BACKGROUND-GEN] Previous generation stale (>10min), retrying:", reportId);
    }

    // Mark as generating
    await supabaseClient
      .from("pet_reports")
      .update({
        report_content: { status: "generating", attempt, started_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    // Prepare pet data for report generation
    const petData = {
      name: report.pet_name,
      species: report.species,
      breed: report.breed ?? '',
      gender: report.gender,
      dateOfBirth: report.birth_date,
      birthTime: report.birth_time ?? '',
      location: report.birth_location ?? '',
      soulType: report.soul_type ?? '',
      superpower: report.superpower ?? '',
      strangerReaction: report.stranger_reaction ?? '',
    };

    // Use n8n worker for report generation (no timeout limit)
    const N8N_WEBHOOK = Deno.env.get("N8N_REPORT_WEBHOOK_URL");
    if (N8N_WEBHOOK) {
      console.log("[BACKGROUND-GEN] Sending to n8n worker:", reportId);

      // ── RELIABILITY FIX (blocker #7) ──
      // The old code fire-and-forgot this POST (`fetch(...).catch()`) and then
      // returned success unconditionally. If n8n was down / the webhook 404'd,
      // the PAID report stayed marked status='generating' forever — no failure
      // row, no retry, a customer stuck with nothing. Now we AWAIT the trigger
      // with a hard timeout and require a 2xx. On any failure we flip the report
      // to a retryable 'failed' marker and record a webhook_failures row, so the
      // stale-report backfill cron (and support) can see and retry it.
      const N8N_TRIGGER_TIMEOUT_MS = 15000;
      let triggerOk = false;
      let triggerDetail = "";
      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), N8N_TRIGGER_TIMEOUT_MS);
        let n8nResp: Response;
        try {
          n8nResp = await fetch(N8N_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reportId }),
            signal: ac.signal,
          });
        } finally {
          clearTimeout(timer);
        }
        triggerOk = n8nResp.ok;
        if (!triggerOk) {
          triggerDetail = `n8n returned ${n8nResp.status}`;
          console.error("[BACKGROUND-GEN] n8n trigger non-2xx:", reportId, triggerDetail);
        }
      } catch (err) {
        triggerDetail = err instanceof Error ? (err.name === "AbortError" ? `timeout after ${N8N_TRIGGER_TIMEOUT_MS}ms` : err.message) : String(err);
        console.error("[BACKGROUND-GEN] n8n trigger failed:", reportId, triggerDetail);
      }

      if (triggerOk) {
        return new Response(JSON.stringify({ success: true, reportId, worker: "n8n" }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Trigger failed — mark report retryable + log a visible failure row.
      await supabaseClient
        .from("pet_reports")
        .update({
          report_content: {
            status: "failed",
            retryable: true,
            attempt,
            failed_at: new Date().toISOString(),
            error: `n8n trigger failed: ${triggerDetail}`,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      await supabaseClient.from("webhook_failures").insert({
        source: "generate-report-background",
        event_type: "n8n_trigger_failed",
        order_id: reportId,
        details: { reportId, attempt, error: triggerDetail },
      });

      return new Response(JSON.stringify({ success: false, reportId, error: "Generation trigger failed", retryable: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 502,
      });
    }

    // Fallback: direct generation if n8n not configured
    console.log("[BACKGROUND-GEN] N8N not configured, using direct generation");

    try {
      const genResponse = await fetch(`${supabaseUrl}/functions/v1/generate-cosmic-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          petData,
          reportId,
          language: report.language || 'en',
          occasionMode: report.occasion_mode || 'discover',
        }),
      });
      const genResult = await genResponse.text();
      console.log("[BACKGROUND-GEN] Generation completed:", genResponse.status);
      if (!genResponse.ok) {
        // Don't leave the report stuck on the 'generating' marker — flip it to a
        // retryable failed state and log it so the backfill cron can retry.
        await supabaseClient
          .from("pet_reports")
          .update({
            report_content: {
              status: "failed",
              retryable: true,
              attempt,
              failed_at: new Date().toISOString(),
              error: `direct generation returned ${genResponse.status}`,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", reportId);
        await supabaseClient.from("webhook_failures").insert({
          source: "generate-report-background",
          event_type: "direct_generation_failed",
          order_id: reportId,
          details: { reportId, attempt, status: genResponse.status, body: genResult?.slice(0, 500) },
        });
        return new Response(JSON.stringify({ success: false, reportId, error: "Generation failed", retryable: true }), {
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          status: 502,
        });
      }
    } catch (err) {
      console.error("[BACKGROUND-GEN] Generation failed:", err);
      await supabaseClient
        .from("pet_reports")
        .update({
          report_content: {
            status: "failed",
            retryable: true,
            attempt,
            failed_at: new Date().toISOString(),
            error: `direct generation threw: ${err instanceof Error ? err.message : String(err)}`,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);
      await supabaseClient.from("webhook_failures").insert({
        source: "generate-report-background",
        event_type: "direct_generation_failed",
        order_id: reportId,
        details: { reportId, attempt, error: err instanceof Error ? err.message : String(err) },
      });
      return new Response(JSON.stringify({ success: false, reportId, error: "Generation failed", retryable: true }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 502,
      });
    }

    // Send confirmation email in background (will arrive after report is ready)
    sendEmailBackground(supabaseUrl, serviceRoleKey, reportId, report.email, report.pet_name);

    return new Response(JSON.stringify({ success: true, reportId }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[BACKGROUND-GEN] Error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Background email sending
async function sendEmailBackground(
  supabaseUrl: string,
  serviceRoleKey: string,
  reportId: string,
  email: string,
  petName: string,
  sunSign?: string
) {
  try {
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-report-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        reportId,
        email,
        petName,
        sunSign,
      }),
    });

    if (!emailResponse.ok) {
      console.error("[BACKGROUND-GEN] Email sending failed:", await emailResponse.text());
    } else {
      console.log("[BACKGROUND-GEN] Email sent successfully for:", reportId);
    }
  } catch (err) {
    console.error("[BACKGROUND-GEN] Error sending email:", err);
  }
}
