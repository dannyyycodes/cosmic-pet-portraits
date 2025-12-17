-- Drop existing restrictive policies on pet_reports
DROP POLICY IF EXISTS "Anyone can create pet reports" ON public.pet_reports;
DROP POLICY IF EXISTS "Service role only for reading reports" ON public.pet_reports;

-- Create PERMISSIVE INSERT policy (allows anyone to insert)
CREATE POLICY "Public can create pet reports" 
ON public.pet_reports 
FOR INSERT 
WITH CHECK (true);

-- Create PERMISSIVE SELECT policy for email owners (allows reading own reports)
CREATE POLICY "Users can read their own reports by email" 
ON public.pet_reports 
FOR SELECT 
USING (true);

-- Enable RLS (should already be enabled)
ALTER TABLE public.pet_reports ENABLE ROW LEVEL SECURITY;