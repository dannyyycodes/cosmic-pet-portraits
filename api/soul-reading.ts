/**
 * /api/soul-reading — consolidated Soul Reading router (Hobby-plan packing).
 *
 * Replaces three Vercel Functions:
 *   - api/reading/[token].ts        → GET  ?action=view&token=<token>
 *   - api/email/reading-ready.ts    → POST ?action=email-ready (Bearer secret)
 *   - api/cron/soul-reading-reconcile.ts → GET ?action=reconcile (Bearer cron secret)
 *
 * Public-facing /reading/<token> URL is preserved via a Vercel rewrite in
 * vercel.json — the React page still fetches /api/reading/<token>; the rewrite
 * sends it here as ?action=view&token=<token>.
 *
 * Spec sources:
 *   - launch-plan-2026-05-05 Phase 6 (viewer), Phase 7 (email), Phase 4 (cron)
 *   - research-2026-05-04-soul-reading-fulfilment §4-5
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "./_lib/supabaseAdmin.js";
import { isWellFormedToken } from "./_lib/readingToken.js";
import { renderReadingReadyEmail } from "./_lib/email/readingReadyEmail.js";
import { listPendingForReconcile, markPendingFailure } from "./shopify/_lib/jobsRepo.js";
import { triggerN8nForJob } from "./shopify/_lib/triggerN8n.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = (req.query.action as string | undefined) ?? "";

  if (action === "view") {
    return handleView(req, res);
  }
  if (action === "email-ready") {
    return handleEmailReady(req, res);
  }
  if (action === "reconcile") {
    return handleReconcile(req, res);
  }
  if (action === "intake-status") {
    return handleIntakeStatus(req, res);
  }
  if (action === "submit-intake") {
    return handleSubmitIntake(req, res);
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(400).json({ error: "unknown_action", expected: ["view", "email-ready", "reconcile", "intake-status", "submit-intake"] });
}

// ─── intake-status: GET /api/soul-reading?action=intake-status&token=<token> ──
// Used by the /reading/intake/<token> page to confirm the token is valid +
// the job is awaiting intake (status='intake_pending'). Returns 410 if the
// intake has already been submitted (idempotent — customer can't double-submit).
async function handleIntakeStatus(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const token = String(req.query.token ?? "").trim();
  if (!token || !isWellFormedToken(token)) {
    return res.status(400).json({ error: "bad_token" });
  }
  const supabase = getSupabaseAdmin();
  const { data: row, error } = await supabase
    .from("soul_reading_jobs")
    .select("id, status")
    .eq("viewer_token", token)
    .maybeSingle();
  if (error) return res.status(500).json({ error: "db_error", detail: error.message });
  if (!row) return res.status(404).json({ error: "not_found" });
  if (row.status !== "intake_pending") {
    return res.status(410).json({ error: "already_submitted", status: row.status });
  }
  return res.status(200).json({ ok: true, jobId: row.id, status: row.status });
}

// ─── submit-intake: POST /api/soul-reading?action=submit-intake ──
// Customer submits pet name + DOB + birth location via the intake page.
// Updates the soul_reading_jobs row with the values, flips status to
// 'pending', and fires the n8n trigger to generate the reading.
// Idempotent — re-submission with the same token is rejected unless the job
// is still in 'intake_pending' state.
async function handleSubmitIntake(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const body = (req.body ?? {}) as {
    token?: string;
    petName?: string;
    petDob?: string;
    petBirthLocation?: string;
  };
  const token = (body.token ?? "").trim();
  const petName = (body.petName ?? "").trim();
  const petDob = (body.petDob ?? "").trim();
  const petBirthLocation = (body.petBirthLocation ?? "").trim();
  if (!token || !isWellFormedToken(token)) {
    return res.status(400).json({ error: "bad_token" });
  }
  if (!petName || petName.length > 40) return res.status(400).json({ error: "bad_pet_name" });
  if (!petDob || !/^\d{4}-\d{2}-\d{2}$/.test(petDob)) return res.status(400).json({ error: "bad_pet_dob" });
  if (!petBirthLocation || petBirthLocation.length > 200) return res.status(400).json({ error: "bad_pet_birth_location" });

  const supabase = getSupabaseAdmin();
  // Atomic: only flip from 'intake_pending' → 'pending' with the new inputs.
  // The WHERE filter on status prevents a double-submit from clobbering an
  // already-running or completed job.
  const { data: updated, error } = await supabase
    .from("soul_reading_jobs")
    .update({
      pet_name: petName,
      pet_dob: petDob,
      pet_birth_location: petBirthLocation,
      status: "pending",
    })
    .eq("viewer_token", token)
    .eq("status", "intake_pending")
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("[soul-reading] submit-intake update failed", error.message);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  if (!updated) {
    // Either token invalid OR job already past intake_pending.
    return res.status(410).json({ error: "already_submitted_or_not_found" });
  }

  // Fire n8n to generate the reading. Best-effort — the reconcile cron also
  // picks up stale 'pending' rows so a failure here isn't fatal.
  try {
    await triggerN8nForJob(updated as SoulReadingJobRow);
  } catch (err) {
    console.error("[soul-reading] submit-intake n8n trigger failed", (err as Error).message);
  }

  return res.status(200).json({ ok: true, jobId: (updated as SoulReadingJobRow).id });
}

// ─── view: GET /api/soul-reading?action=view&token=<token> ────────────────

interface JobRow {
  id: string;
  status: string;
  customer_email: string;
  pet_name: string;
  pet_dob: string;
  pet_birth_location: string;
  generated_reading_id: string | null;
  dry_run: boolean;
  created_at: string;
}

interface PetReportRow {
  id: string;
  pet_name: string;
  report_content: unknown;
  species: string | null;
  breed: string | null;
  gender: string | null;
  share_token: string | null;
  pet_photo_url: string | null;
  portrait_url: string | null;
  occasion_mode: string | null;
  payment_status: string | null;
}

async function handleView(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const tokenParam = req.query.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token || !isWellFormedToken(token)) {
    return res.status(404).json({ status: "not_found", message: "This link doesn't appear to be valid." });
  }

  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch (err) {
    console.error("[soul-reading/view] Supabase env not configured:", (err as Error).message);
    return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
  }

  let job: JobRow | null = null;
  try {
    const { data, error } = await sb
      .from("soul_reading_jobs")
      .select(
        "id, status, customer_email, pet_name, pet_dob, pet_birth_location, generated_reading_id, dry_run, created_at",
      )
      .eq("viewer_token", token)
      .maybeSingle();
    if (error) {
      console.error("[soul-reading/view] job lookup failed:", error.message);
      return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
    }
    job = data as JobRow | null;
  } catch (err) {
    console.error("[soul-reading/view] unexpected job lookup error:", (err as Error).message);
    return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
  }

  if (!job) {
    return res.status(404).json({ status: "not_found", message: "This link doesn't appear to be valid." });
  }

  if (job.dry_run || job.status === "dry_run") {
    return res.status(404).json({ status: "not_found", message: "This link doesn't appear to be valid." });
  }

  switch (job.status) {
    case "pending":
    case "triggered": {
      return res.status(200).json({
        status: "preparing",
        petName: job.pet_name,
        message: "Your reading is being prepared. We'll email you within 10 minutes once it's ready.",
        pollIntervalMs: 30_000,
      });
    }

    case "generated":
    case "delivered": {
      if (!job.generated_reading_id) {
        return res.status(200).json({
          status: "preparing",
          petName: job.pet_name,
          message: "Your reading is being prepared. We'll email you within 10 minutes once it's ready.",
          pollIntervalMs: 30_000,
        });
      }

      let report: PetReportRow | null = null;
      try {
        const { data, error } = await sb
          .from("pet_reports")
          .select(
            "id, pet_name, report_content, species, breed, gender, share_token, pet_photo_url, portrait_url, occasion_mode, payment_status",
          )
          .eq("id", job.generated_reading_id)
          .maybeSingle();
        if (error) {
          console.error("[soul-reading/view] pet_reports lookup failed:", error.message);
          return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
        }
        report = data as PetReportRow | null;
      } catch (err) {
        console.error("[soul-reading/view] unexpected pet_reports error:", (err as Error).message);
        return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
      }

      if (!report || !report.report_content) {
        return res.status(200).json({
          status: "preparing",
          petName: job.pet_name,
          message: "Your reading is being prepared. We'll email you within 10 minutes once it's ready.",
          pollIntervalMs: 30_000,
        });
      }

      return res.status(200).json({
        status: "ready",
        petName: report.pet_name || job.pet_name,
        petDob: job.pet_dob,
        petBirthLocation: job.pet_birth_location,
        reading: report.report_content,
        reportId: report.id,
        shareToken: report.share_token ?? undefined,
        petPhotoUrl: report.pet_photo_url ?? undefined,
        portraitUrl: report.portrait_url ?? undefined,
        occasionMode: report.occasion_mode ?? "discover",
        species: report.species ?? "pet",
        breed: report.breed ?? undefined,
        gender: report.gender ?? undefined,
      });
    }

    case "failed": {
      return res.status(200).json({
        status: "error",
        petName: job.pet_name,
        message:
          "Something went wrong with your reading. Please reply to your order email and we'll sort it out for you.",
      });
    }

    case "cancelled_pre_render": {
      return res.status(200).json({
        status: "cancelled",
        petName: job.pet_name,
        message:
          "This reading was cancelled before generation. If this is a mistake, reply to your order email and we'll get it sorted.",
      });
    }

    default: {
      console.warn("[soul-reading/view] unhandled status:", job.status);
      return res.status(200).json({
        status: "preparing",
        petName: job.pet_name,
        message: "Your reading is being prepared. We'll email you within 10 minutes once it's ready.",
        pollIntervalMs: 30_000,
      });
    }
  }
}

// ─── email-ready: POST /api/soul-reading?action=email-ready ────────────────

interface EmailSendInput {
  jobId?: string;
  customerEmail: string;
  petName: string;
  readingUrl: string;
  petPhotoUrl?: string;
  sunSign?: string;
}

async function handleEmailReady(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const auth = req.headers.authorization ?? "";
  const expected = process.env.READING_EMAIL_SECRET;
  if (!expected) {
    console.error("[soul-reading/email-ready] READING_EMAIL_SECRET not configured");
    return res.status(500).json({ error: "secret_not_configured" });
  }
  if (auth !== `Bearer ${expected}`) {
    console.warn("[soul-reading/email-ready] auth_failed");
    return res.status(401).json({ error: "unauthorized" });
  }

  const body = (req.body ?? {}) as Partial<EmailSendInput>;
  const customerEmail = (body.customerEmail ?? "").trim();
  const petName = (body.petName ?? "").trim();
  const readingUrl = (body.readingUrl ?? "").trim();

  if (!customerEmail || !petName || !readingUrl) {
    return res.status(400).json({
      error: "missing_required_fields",
      required: ["customerEmail", "petName", "readingUrl"],
    });
  }
  if (!/^https:\/\/[^/]+\/reading\/[A-Za-z0-9_-]+/.test(readingUrl)) {
    return res.status(400).json({ error: "invalid_reading_url" });
  }

  const rendered = renderReadingReadyEmail({
    petName,
    readingUrl,
    petPhotoUrl: body.petPhotoUrl,
    sunSign: body.sunSign,
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[soul-reading/email-ready] RESEND_API_KEY not configured");
    return res.status(500).json({ error: "resend_not_configured" });
  }

  let sendStatus: number;
  let sendBody: unknown;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: rendered.from,
        to: customerEmail,
        reply_to: rendered.replyTo,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    sendStatus = r.status;
    const text = await r.text();
    try {
      sendBody = JSON.parse(text);
    } catch {
      sendBody = { raw: text.slice(0, 500) };
    }
  } catch (err) {
    console.error(
      "[soul-reading/email-ready] resend_network_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    return res.status(502).json({ error: "resend_network_failed" });
  }

  if (sendStatus < 200 || sendStatus >= 300) {
    console.error(
      "[soul-reading/email-ready] resend_send_failed",
      JSON.stringify({ status: sendStatus, body: sendBody, jobId: body.jobId }),
    );
    return res.status(502).json({ error: "resend_send_failed", status: sendStatus, detail: sendBody });
  }

  console.log(
    "[soul-reading/email-ready] sent",
    JSON.stringify({
      jobId: body.jobId,
      customerEmail: maskEmail(customerEmail),
      petName,
      resendId: (sendBody as { id?: string } | undefined)?.id,
    }),
  );

  return res.status(200).json({
    ok: true,
    resendId: (sendBody as { id?: string } | undefined)?.id ?? null,
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

// ─── reconcile: GET /api/soul-reading?action=reconcile (cron) ──────────────

const MAX_ATTEMPTS = 5;
const PENDING_OLDER_THAN_MIN = 10;
const BATCH_LIMIT = 50;

async function handleReconcile(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET || "";
  const authHeader = req.headers.authorization;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const rows = await listPendingForReconcile({
      olderThanMinutes: PENDING_OLDER_THAN_MIN,
      maxAttempts: MAX_ATTEMPTS,
      limit: BATCH_LIMIT,
    });

    console.log(
      "[soul-reading/reconcile] picked",
      JSON.stringify({ count: rows.length, cutoffMin: PENDING_OLDER_THAN_MIN }),
    );

    if (rows.length === 0) {
      return res.status(200).json({ ok: true, retried: 0, terminal: 0, picked: 0 });
    }

    let retried = 0;
    let succeeded = 0;
    let terminal = 0;

    for (const row of rows) {
      const result = await triggerN8nForJob(row);
      retried++;
      if (result.ok) {
        succeeded++;
        continue;
      }

      const willBeAtCap = (row.attempts ?? 0) + 1 >= MAX_ATTEMPTS;
      if (willBeAtCap) {
        try {
          await markPendingFailure({
            jobId: row.id,
            errorText: result.error ?? `n8n status=${result.status ?? "?"}`,
            terminal: true,
          });
          terminal++;
        } catch (err) {
          console.error(
            "[soul-reading/reconcile] terminal_mark_failed",
            JSON.stringify({ jobId: row.id, error: err instanceof Error ? err.message : String(err) }),
          );
        }
      }
    }

    console.log(
      "[soul-reading/reconcile] done",
      JSON.stringify({ retried, succeeded, terminal }),
    );

    return res.status(200).json({
      ok: true,
      picked: rows.length,
      retried,
      succeeded,
      terminal,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      "[soul-reading/reconcile] error",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    return res.status(500).json({ error: "reconcile_failed", detail: err instanceof Error ? err.message : String(err) });
  }
}
