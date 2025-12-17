-- Fix pet_reports RLS: restrict reads to service_role only
-- Edge functions use service_role key for legitimate access

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can read their own reports by email" ON public.pet_reports;

-- Create restrictive policy: only service_role can read (edge functions)
-- This prevents public API access while allowing edge functions to work
CREATE POLICY "Service role can read pet reports"
ON public.pet_reports
FOR SELECT
USING (false);

-- Note: service_role bypasses RLS by default, so USING(false) 
-- blocks anon/authenticated but allows service_role access