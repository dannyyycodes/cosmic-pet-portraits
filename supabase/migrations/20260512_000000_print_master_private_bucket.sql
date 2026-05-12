-- Create a PRIVATE Supabase Storage bucket for high-resolution print masters.
--
-- Why: pre-2026-05-12, AI-generated print masters were uploaded to the PUBLIC
-- pet-photos bucket and the public URL was returned to the browser via the
-- printMaster_submit / printMaster_status endpoints. A savvy customer could
-- grab the URL via DevTools and download the 3000x3000 file without paying.
--
-- This migration creates the private bucket; the application code (api/portraits.ts
-- + api/cart/checkout.ts + api/_lib/printPipeline.ts + api/_lib/digitalFulfillment.ts)
-- moves uploads to it, returns only the storage PATH (not URL) to the browser,
-- and fulfils orders by fetching from the private bucket via the admin client.
--
-- Public pet-photos bucket stays — used for cutouts, mockups, room previews,
-- digital-deliveries (post-payment signed URLs), and the existing public Gelato
-- print-master rehost (post-payment, after AuraSR upscale).
--
-- File-size limit raised to 30MB to accommodate large 3000x3000 PNG variants
-- before AuraSR upscale.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos-private',
  'pet-photos-private',
  false,
  31457280,                                        -- 30 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies: only the service-role key can read/write. Public + auth users
-- have NO access — they cannot list, download, or upload directly. All access
-- goes through the API endpoints which use the admin client (bypasses RLS).
--
-- The default RLS policy on storage.objects denies all unauthenticated access,
-- so we don't need explicit DENY policies. We just don't add any ALLOW policies.
