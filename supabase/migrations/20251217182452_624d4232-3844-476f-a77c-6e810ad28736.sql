-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view reports by email" ON public.pet_reports;

-- Create a restrictive policy - only service role can read (for edge functions)
CREATE POLICY "Service role only for reading reports"
ON public.pet_reports
FOR SELECT
TO service_role
USING (true);

-- Also fix gift_certificates - drop overly permissive policy
DROP POLICY IF EXISTS "Anyone can validate gift certificates" ON public.gift_certificates;

-- Allow SELECT only for validation by code (not exposing all data)
-- Service role handles the actual lookups
CREATE POLICY "Service role can read gift certificates"
ON public.gift_certificates
FOR SELECT
TO service_role
USING (true);