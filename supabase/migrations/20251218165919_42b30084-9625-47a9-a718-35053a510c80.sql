-- Fix gift_certificates SELECT policy - restrict to service role only
DROP POLICY IF EXISTS "Service role can read gift certificates" ON public.gift_certificates;
CREATE POLICY "Service role only can read gift certificates" ON public.gift_certificates
  FOR SELECT USING (auth.role() = 'service_role');

-- Ensure pet_reports doesn't have overly permissive SELECT/UPDATE policies
DROP POLICY IF EXISTS "Anyone can read pet reports" ON public.pet_reports;
DROP POLICY IF EXISTS "Anyone can update pet reports" ON public.pet_reports;

-- Create restrictive policy for service role only
CREATE POLICY "Service role can read pet reports" ON public.pet_reports
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update pet reports" ON public.pet_reports
  FOR UPDATE USING (auth.role() = 'service_role');