-- Shared rate-limit table used by paid-API edge functions to throttle abuse.
-- Rows are short-lived; a pg_cron job trims anything older than 24h.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint   text        NOT NULL,
  identifier text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON public.rate_limits (endpoint, identifier, created_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies — only service role (which bypasses RLS) should touch this table.
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Trim old entries hourly to keep the table tiny.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'rate-limits-cleanup',
      '17 * * * *',
      $cleanup$ DELETE FROM public.rate_limits WHERE created_at < now() - interval '24 hours'; $cleanup$
    );
  END IF;
END $$;
