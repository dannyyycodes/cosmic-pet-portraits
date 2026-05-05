/**
 * GET /api/reading/[token]
 *
 * Resolves a Soul Reading viewer token → status payload for the React
 * /reading/<token> page. Public endpoint, no auth — the token is the auth
 * (HMAC-derived 32-char base64url, ~192 bits of entropy; see
 * api/_lib/readingToken.ts and research-2026-05-04-soul-reading-fulfilment §5.1).
 *
 * Status mapping (matches soul_reading_jobs.status):
 *   pending | triggered  → "preparing"  (auto-poll on the client)
 *   generated | delivered → "ready"     (full reading payload)
 *   failed                → "error"     (generic message — never expose error_text)
 *   cancelled_pre_render  → "cancelled"
 *   dry_run               → 404         (test orders are not viewable)
 *
 * The "ready" branch fetches from public.pet_reports using
 * generated_reading_id (FK populated by the droplet worker once OpenRouter
 * finishes). We return a shape compatible with the existing CosmicReportViewer
 * component so the React side reuses it instead of rebuilding.
 *
 * Rate-limit: malformed tokens are rejected by isWellFormedToken before
 * touching the DB. Valid-shape but unknown tokens 404 in O(1) via the
 * UNIQUE index on viewer_token.
 *
 * Caching: this is a personalised page. Set Cache-Control: private, no-store
 * so CDN edges don't leak one customer's reading to another.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";
import { isWellFormedToken } from "../_lib/readingToken.js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Privacy: never let any layer cache a personal reading.
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Vercel passes [token] as req.query.token (string | string[]).
  const tokenParam = req.query.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token || !isWellFormedToken(token)) {
    return res.status(404).json({ status: "not_found", message: "This link doesn't appear to be valid." });
  }

  let sb;
  try {
    sb = getSupabaseAdmin();
  } catch (err) {
    console.error("[reading/token] Supabase env not configured:", (err as Error).message);
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
      console.error("[reading/token] job lookup failed:", error.message);
      return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
    }
    job = data as JobRow | null;
  } catch (err) {
    console.error("[reading/token] unexpected job lookup error:", (err as Error).message);
    return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
  }

  if (!job) {
    return res.status(404).json({ status: "not_found", message: "This link doesn't appear to be valid." });
  }

  // Test orders aren't customer-viewable. Treat as 404 to avoid signalling existence.
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
        // Hint to the client how often to poll; capped to 30s server-side.
        pollIntervalMs: 30_000,
      });
    }

    case "generated":
    case "delivered": {
      if (!job.generated_reading_id) {
        // Worker marked status=generated but didn't write the FK. Treat as still-preparing
        // so the customer doesn't bounce off — the reconciliation path will fix it.
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
          console.error("[reading/token] pet_reports lookup failed:", error.message);
          return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
        }
        report = data as PetReportRow | null;
      } catch (err) {
        console.error("[reading/token] unexpected pet_reports error:", (err as Error).message);
        return res.status(500).json({ status: "server_error", message: "Could not load reading. Please try again shortly." });
      }

      if (!report || !report.report_content) {
        // Reading row exists but content is empty — same fallback as above.
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
      console.warn("[reading/token] unhandled status:", job.status);
      return res.status(200).json({
        status: "preparing",
        petName: job.pet_name,
        message: "Your reading is being prepared. We'll email you within 10 minutes once it's ready.",
        pollIntervalMs: 30_000,
      });
    }
  }
}
