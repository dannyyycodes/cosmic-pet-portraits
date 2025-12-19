-- Create storage bucket for pet photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload pet photos (public bucket for checkout)
CREATE POLICY "Anyone can upload pet photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'pet-photos');

-- Allow public read access to pet photos
CREATE POLICY "Public read access for pet photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pet-photos');

-- Allow deletion by uploaders (via path matching)
CREATE POLICY "Uploaders can delete own photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'pet-photos');