/**
 * /api/ugc/submit — Pawtraits UGC backstory submission router.
 *
 * Two actions, single Vercel function (Hobby-plan packing):
 *
 *   POST /api/ugc/submit              → mint a signed upload URL
 *     Body: { reportId, ownerFirstName, consentVersion }
 *     Auth: Bearer Supabase JWT (auth.users.id resolved server-side)
 *     Returns: { submissionId, uploadUrl, uploadPath, token }
 *
 *   POST /api/ugc/submit?action=finalize  → flip pending row to "submitted"
 *     Body: { submissionId }
 *     Auth: Bearer Supabase JWT — must own the row.
 *     Returns: { ok: true }
 *
 * Flow:
 *   1. Frontend calls POST /api/ugc/submit with reportId, ownerFirstName,
 *      consentVersion — server validates the consent version is the latest
 *      active row in ugc_consent_versions, INSERTs a `pending` ugc_submissions
 *      row with photo_url = the signed-upload public URL, returns the signed
 *      upload URL + path + submissionId.
 *   2. Frontend uploads the bytes directly to Supabase Storage at that URL.
 *   3. Frontend calls POST /api/ugc/submit?action=finalize with the
 *      submissionId — server stays on `pending` (the moderation team flips
 *      it to `approved` later) but records that the upload completed by
 *      bumping `source` to 'share-page-finalized'.
 *
 * Why two-step: signed upload URLs are direct-to-storage (no proxy through
 * a Vercel function — keeps us under the 4.5MB body limit and avoids the
 * 10s execution cap on Hobby).
 *
 * Privacy posture:
 *   • The bearer JWT is verified via supabase.auth.getUser; no trust on
 *     client-asserted account_id.
 *   • The path is bound to the resolved account_id, so a malicious client
 *     can't mint a signed URL pointing at someone else's namespace.
 *   • consent_text_version is validated against the live latest row —
 *     stale clients with an old consent_version get rejected (409) and
 *     told to refresh.
 *
 * GDPR (Art. 7, evidence of consent):
 *   • consent_granted_at = now() at INSERT time.
 *   • consent_text_version is captured immutably; the body_text in
 *     ugc_consent_versions is reproducible per row.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

const BUCKET = "ugc-photos";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ─── Auth ───────────────────────────────────────────────────────────────
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in to share your photo." });
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Sign in to share your photo." });
  }

  const supabase = getSupabaseAdmin();
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) {
    return res.status(401).json({ error: "Your session has expired — please sign in again." });
  }
  const userId = userRes.user.id;

  const action = (req.query.action as string | undefined) ?? "";

  if (action === "finalize") {
    return handleFinalize(req, res, userId);
  }

  return handleSubmit(req, res, userId);
}

// ─── POST /api/ugc/submit (no action) ──────────────────────────────────────

interface SubmitBody {
  reportId?: string;
  ownerFirstName?: string;
  consentVersion?: string;
}

async function handleSubmit(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = (req.body ?? {}) as SubmitBody;
  const reportId = typeof body.reportId === "string" ? body.reportId.trim() : "";
  const ownerFirstName = typeof body.ownerFirstName === "string" ? body.ownerFirstName.trim().slice(0, 80) : "";
  const consentVersion = typeof body.consentVersion === "string" ? body.consentVersion.trim() : "";

  if (!reportId) return res.status(400).json({ error: "Missing reportId." });
  if (!ownerFirstName) return res.status(400).json({ error: "Please add the first name we should credit." });
  if (!consentVersion) return res.status(400).json({ error: "Consent record missing — please refresh and try again." });

  // ─── Validate consent version is the latest active row ────────────────
  const supabase = getSupabaseAdmin();
  const { data: latest, error: latestErr } = await supabase
    .from("ugc_consent_versions")
    .select("version")
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr || !latest) {
    console.error("[ugc/submit] consent lookup failed:", latestErr);
    return res.status(500).json({ error: "Could not verify the consent record. Please try again." });
  }

  if (latest.version !== consentVersion) {
    return res.status(409).json({
      error: "Our consent text was updated while you were on this page — please refresh to read the current version.",
      latestConsentVersion: latest.version,
    });
  }

  // ─── Insert a pending submission row ──────────────────────────────────
  // photo_url is set to the eventual public URL we expect the client to
  // upload to; if they never finalize, the row sits as `pending` and we
  // can sweep stale rows later (no orphan storage either, because we
  // skip moderation on rows missing 'share-page-finalized' source).
  const submissionId = crypto.randomUUID();
  const uploadPath = `${userId}/${submissionId}/photo.jpg`;

  const { data: pubUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadPath);
  const photoUrl = pubUrlData.publicUrl;

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(uploadPath);

  if (signErr || !signed) {
    console.error("[ugc/submit] signed upload mint failed:", signErr);
    return res.status(500).json({ error: "Could not prepare the upload. Please try again." });
  }

  const { error: insertErr } = await supabase
    .from("ugc_submissions")
    .insert({
      id: submissionId,
      account_id: userId,
      report_id: reportId,
      photo_url: photoUrl,
      owner_first_name: ownerFirstName,
      consent_text_version: consentVersion,
      consent_granted_at: new Date().toISOString(),
      status: "pending",
      source: "share-page-pending",
    });

  if (insertErr) {
    console.error("[ugc/submit] insert failed:", insertErr);
    return res.status(500).json({ error: "Could not save your submission. Please try again." });
  }

  return res.status(200).json({
    submissionId,
    uploadUrl: signed.signedUrl,
    uploadPath,
    token: signed.token,
  });
}

// ─── POST /api/ugc/submit?action=finalize ──────────────────────────────────

interface FinalizeBody {
  submissionId?: string;
}

async function handleFinalize(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = (req.body ?? {}) as FinalizeBody;
  const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";
  if (!submissionId) return res.status(400).json({ error: "Missing submissionId." });

  const supabase = getSupabaseAdmin();
  const { data: row, error: lookupErr } = await supabase
    .from("ugc_submissions")
    .select("id, account_id, source")
    .eq("id", submissionId)
    .maybeSingle();

  if (lookupErr) {
    console.error("[ugc/submit:finalize] lookup failed:", lookupErr);
    return res.status(500).json({ error: "Could not finalize your submission." });
  }
  if (!row) return res.status(404).json({ error: "Submission not found." });
  if (row.account_id !== userId) return res.status(403).json({ error: "Not your submission." });

  const { error: updateErr } = await supabase
    .from("ugc_submissions")
    .update({ source: "share-page-finalized" })
    .eq("id", submissionId);

  if (updateErr) {
    console.error("[ugc/submit:finalize] update failed:", updateErr);
    return res.status(500).json({ error: "Could not finalize your submission." });
  }

  return res.status(200).json({ ok: true });
}
