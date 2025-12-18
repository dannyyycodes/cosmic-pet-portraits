-- Fix pet_reports RLS: Remove public SELECT and UPDATE
DROP POLICY IF EXISTS "Anyone can read pet reports" ON public.pet_reports;
DROP POLICY IF EXISTS "Anyone can update pet reports" ON public.pet_reports;
DROP POLICY IF EXISTS "Service role can read pet reports" ON public.pet_reports;

-- Fix affiliates RLS: Restrict to only referral_code lookup (not full data exposure)
DROP POLICY IF EXISTS "Allow public read by referral code" ON public.affiliates;

-- Create restricted policy for affiliates - only expose referral_code for validation
CREATE POLICY "Public can lookup affiliate by referral code"
ON public.affiliates
FOR SELECT
USING (false); -- Block all direct client access, use edge functions

-- Create admin_sessions table for server-side session validation
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for admin sessions"
ON public.admin_sessions
FOR ALL
USING (false)
WITH CHECK (false);