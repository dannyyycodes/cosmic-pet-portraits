-- Fix pet-photos storage bucket security policies
-- Remove overly permissive policies and add proper restrictions

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can upload pet photos" ON storage.objects;

-- Drop the broken DELETE policy (allows anyone to delete any file)
DROP POLICY IF EXISTS "Uploaders can delete own photos" ON storage.objects;

-- Create service-role-only INSERT policy (uploads handled via Edge Functions)
CREATE POLICY "Service role can upload pet photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'pet-photos'
  AND auth.role() = 'service_role'
);

-- Create service-role-only DELETE policy
CREATE POLICY "Service role can delete pet photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'pet-photos'
  AND auth.role() = 'service_role'
);

-- Keep public read access (needed for displaying photos in reports)
-- The existing "Public read access for pet photos" policy is acceptable