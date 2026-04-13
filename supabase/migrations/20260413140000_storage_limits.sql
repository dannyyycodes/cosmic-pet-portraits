-- Storage hardening — cap upload size and constrain MIME types per bucket.
--
-- Background: pet-photos and calendar-photos accept anonymous INSERTs (the
-- intake form needs that). Without a size cap or MIME allowlist an attacker
-- could upload arbitrary files of arbitrary size — wasting storage budget
-- in the best case, hosting illegal content on a public bucket in the worst.
-- Applied to production via Management API alongside this commit.

UPDATE storage.buckets
SET file_size_limit = 15728640,                                                          -- 15 MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
WHERE id IN ('pet-photos','calendar-photos','breed-photos');

UPDATE storage.buckets
SET file_size_limit = 31457280,                                                          -- 30 MB
    allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'report-pdfs';

UPDATE storage.buckets
SET file_size_limit = 524288000,                                                         -- 500 MB
    allowed_mime_types = ARRAY['video/mp4','video/webm','video/quicktime']
WHERE id = 'content-videos';
