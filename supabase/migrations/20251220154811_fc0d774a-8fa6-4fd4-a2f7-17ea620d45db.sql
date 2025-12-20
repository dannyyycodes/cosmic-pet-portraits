-- Drop restrictive upload policy
DROP POLICY IF EXISTS "Service role can upload pet photos" ON storage.objects;

-- Create a new policy that allows anyone to upload to the pet-photos bucket
CREATE POLICY "Anyone can upload pet photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pet-photos');