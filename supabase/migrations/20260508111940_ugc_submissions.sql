-- UGC submissions for the Pawtraits Facebook backstory pipeline.
--
-- Customers upload a photo of their pet alongside their canvas portrait,
-- credit themselves with a first-name, and grant explicit consent to have
-- the image re-shared on Little Souls' social channels. The n8n workflow
-- 📸 Pawtrait UGC Backstory (built 2026-05-08) picks up approved rows,
-- generates a short backstory caption via OpenRouter, renders a carousel,
-- posts to Facebook via Blotato, then writes the post id back here.
--
-- GDPR posture (Art. 6(1)(a) explicit consent + Art. 7 record-keeping):
--   • consent_text_version is FK-soft-linked to ugc_consent_versions.version
--     so the exact wording the user agreed to is reproducible at audit time.
--   • consent_granted_at is non-null and written by the API at submission.
--   • status='withdrawn' is the data-subject-right exit door; the worker
--     skips withdrawn rows and the operator deletes from storage manually
--     within the 30-day SLA quoted in the consent body.
--   • RLS lets the uploader SEE their own rows but never UPDATE/DELETE —
--     withdrawal goes through the consent@littlesouls.app inbox so we
--     have an evidence trail, not a click-button race condition.
--
-- Tables added:
--   ugc_submissions       — one row per submitted photo + consent record
--   ugc_consent_versions  — append-only register of the exact consent body
--                           shown to each user, keyed by version string
--
-- Storage:
--   ugc-photos bucket — public-read, service-role write only.

-- ─── ugc_consent_versions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ugc_consent_versions (
  version         text PRIMARY KEY,
  body_text       text NOT NULL,
  effective_from  timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ugc_consent_versions IS
  'Append-only register of the exact consent text shown to UGC submitters. Required for GDPR Art. 7 evidence-of-consent reproduction.';

INSERT INTO public.ugc_consent_versions (version, body_text, effective_from)
VALUES (
  '2026-05-08-v1',
  $consent$Little Souls would love to share your photo as part of our community on Facebook, Instagram, Pinterest, and littlesouls.app.

By ticking the box you are giving Little Souls (the team behind Pawtraits at littlesouls.app) permission to repost the photo you upload here, alongside the canvas portrait we made for you, on the Little Souls public channels listed above. We will credit you using only the first name you enter — never your surname, your email, or any other detail from your account.

You confirm you are the person who took the photo, or that you have the photographer's permission to share it. We will only use the image for community storytelling and brand marketing on the channels above. We will not sell the image, license it onward, or pass it to a third-party advertiser.

You can withdraw your consent at any time by emailing consent@littlesouls.app. We aim to remove the photo from our active channels within thirty days of receiving your withdrawal request.

You can untick this box at any moment before submitting. Once you submit, your photo will sit pending until our team reviews it; nothing goes live without that review.$consent$,
  '2026-05-08T00:00:00Z'
)
ON CONFLICT (version) DO NOTHING;

-- ─── ugc_submissions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ugc_submissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  report_id             uuid,
  photo_url             text NOT NULL,
  owner_first_name      text,
  consent_text_version  text NOT NULL,
  consent_granted_at    timestamptz NOT NULL,
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','posted','withdrawn')),
  posted_to_fb          boolean NOT NULL DEFAULT false,
  fb_post_id            text,
  posted_at             timestamptz,
  source                text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ugc_submissions IS
  'One row per UGC photo a customer submits for Little Souls re-share. status lifecycle: pending → approved → posted (or rejected/withdrawn).';

CREATE INDEX IF NOT EXISTS idx_ugc_submissions_status_posted_created
  ON public.ugc_submissions (status, posted_to_fb, created_at);

CREATE INDEX IF NOT EXISTS idx_ugc_submissions_account
  ON public.ugc_submissions (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ugc_submissions_report
  ON public.ugc_submissions (report_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.ugc_consent_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ugc_submissions ENABLE ROW LEVEL SECURITY;

-- Consent versions are public-readable so the share page can render the
-- latest active version without an authenticated round-trip; writes happen
-- exclusively from migrations or service-role admin ops.
DROP POLICY IF EXISTS "consent_versions_public_read" ON public.ugc_consent_versions;
CREATE POLICY "consent_versions_public_read"
  ON public.ugc_consent_versions
  FOR SELECT
  USING (true);

-- Uploaders can read their own submissions (e.g. status checks in /account
-- in a future iteration). They cannot UPDATE / DELETE — withdrawals go
-- through the consent inbox so we keep an evidence trail.
DROP POLICY IF EXISTS "ugc_submissions_owner_select" ON public.ugc_submissions;
CREATE POLICY "ugc_submissions_owner_select"
  ON public.ugc_submissions
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND account_id = auth.uid());

DROP POLICY IF EXISTS "ugc_submissions_owner_insert" ON public.ugc_submissions;
CREATE POLICY "ugc_submissions_owner_insert"
  ON public.ugc_submissions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND account_id = auth.uid());

-- Service role bypasses RLS so the n8n worker, the moderation dashboard,
-- and the /api/ugc/submit endpoint (which uses the service-role key) can
-- read/write freely without per-row policies.

-- ─── Storage bucket: ugc-photos ──────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('ugc-photos', 'ugc-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read so Blotato + Facebook can fetch the image by URL during the
-- post step. Writes are service-role only — the API mints a signed upload
-- URL bound to <account_id>/<submission_id>/photo.jpg, so the client never
-- needs broad write access.
DROP POLICY IF EXISTS "ugc_photos_public_read" ON storage.objects;
CREATE POLICY "ugc_photos_public_read"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ugc-photos');

DROP POLICY IF EXISTS "ugc_photos_service_write" ON storage.objects;
CREATE POLICY "ugc_photos_service_write"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'ugc-photos' AND auth.role() = 'service_role');

DROP POLICY IF EXISTS "ugc_photos_service_delete" ON storage.objects;
CREATE POLICY "ugc_photos_service_delete"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'ugc-photos' AND auth.role() = 'service_role');
