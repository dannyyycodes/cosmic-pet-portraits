-- pg_cron schedule: drain pending print_orders every minute via the Vercel
-- cron worker (api/cron/gelato-worker.ts).
--
-- Why pg_cron and not Vercel cron: Vercel Hobby plan only allows DAILY
-- cron schedules. pg_cron in Supabase (already in use for email-nurture
-- per migration 20260313100000) supports any cron expression — the cost
-- is one HTTP POST per tick, which is trivial.
--
-- The worker is bounded (BATCH_SIZE=5, MAX_ATTEMPTS=3 per row) and
-- pg_cron is single-threaded per schedule, so concurrent ticks cannot
-- pile up. Each tick is a no-op when there are no pending rows.
--
-- Auth: pg_cron sends `Authorization: Bearer <CRON_SECRET>`. The secret
-- must be set as a Postgres GUC named `app.settings.cron_secret` on the
-- Supabase project — set once via:
--   ALTER DATABASE postgres SET app.settings.cron_secret = '<value>';
-- (matches the value of the Vercel CRON_SECRET env var).
--
-- The pg_cron + pg_net extensions are required. Both are already enabled
-- by the email-nurture migration (20260313100000); we just add the
-- schedule.

-- Idempotent — drop the existing schedule before re-creating so re-runs
-- don't accumulate duplicate jobs. cron.unschedule throws if the job
-- doesn't exist, hence the EXCEPTION wrapper.
DO $$
BEGIN
  PERFORM cron.unschedule('gelato-worker-tick');
EXCEPTION WHEN OTHERS THEN
  -- First run, schedule didn't exist yet. Continue.
  NULL;
END $$;

SELECT cron.schedule(
  'gelato-worker-tick',
  '* * * * *',  -- every minute
  $CRON$
  SELECT net.http_post(
    url := 'https://www.littlesouls.app/api/cron/gelato-worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000  -- pg_net default is 5s, raise so the
                                    -- worker has time to drain the batch
  );
  $CRON$
);

COMMENT ON EXTENSION pg_cron IS
  'pg_cron — schedules: email-nurture-processing (*/30), abandoned-cart-emails (0 */6), gelato-worker-tick (* * * * *).';
