-- SECURITY FIX 2026-06-28: lock down anonymous enumeration of customer storage.
--
-- Problem: storage.objects had `FOR SELECT TO public` policies on `pet-photos`
-- and `report-pdfs`. On Supabase the public CDN path (/object/public/<bucket>/<path>)
-- bypasses RLS, but the /object/list and /object/authenticated paths enforce it —
-- so these `public` SELECT policies let anyone holding the (public, frontend-embedded)
-- anon key ENUMERATE and download every customer pet photo and every generated
-- report PDF. Verified live: anon list returned real filenames.
--
-- Fix: drop the broad public SELECT policies. Public download-by-exact-path still
-- works for `pet-photos` (needed by Gelato print fetch + browser photo display),
-- because the public bucket CDN path does not consult RLS. Enumeration is blocked.
-- `report-pdfs` is additionally flipped to a private bucket (it is unused in code;
-- reports are served from the DB via /report?id=&token=, not from this bucket).
--
-- Verified after applying (anon key): list pet-photos -> [], list report-pdfs -> [],
-- public download of a known pet-photos object -> still HTTP 200.

drop policy if exists "Public read access for pet photos" on storage.objects;
drop policy if exists "report_pdfs_public_read" on storage.objects;

update storage.buckets set public = false where id = 'report-pdfs';

-- NOTE: customer pet-photo display + Gelato print fetch use getPublicUrl() (the
-- public CDN path) which is unaffected. The service-role cron/fulfilment paths use
-- the service_role key and bypass RLS. Browser uploads keep their INSERT policy.
