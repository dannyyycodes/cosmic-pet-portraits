-- Drop the current permissive policy
DROP POLICY IF EXISTS "Service role only for reading reports" ON public.pet_reports;

-- Create truly restrictive policy - only service role can read
CREATE POLICY "Service role only for reading reports"
ON public.pet_reports
FOR SELECT
USING (false);