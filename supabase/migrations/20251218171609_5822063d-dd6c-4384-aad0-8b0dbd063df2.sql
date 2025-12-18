-- Create rate limiting table for contact form submissions
CREATE TABLE public.contact_form_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit lookups
CREATE INDEX idx_rate_limits_ip_time ON public.contact_form_rate_limits(ip_address, created_at);
CREATE INDEX idx_rate_limits_email_time ON public.contact_form_rate_limits(email, created_at);

-- Enable RLS and restrict to service role only
ALTER TABLE public.contact_form_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can read/write
CREATE POLICY "Service role only for rate limits" 
ON public.contact_form_rate_limits 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create cleanup function for old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM contact_form_rate_limits
  WHERE created_at < now() - interval '24 hours';
END;
$$;

-- Only service role can execute cleanup
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;