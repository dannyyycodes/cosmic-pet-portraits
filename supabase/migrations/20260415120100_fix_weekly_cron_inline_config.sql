-- Fix: weekly chat credit refresh cron was silently failing every week.
--
-- The original cron (20260312101320_weekly_chat_credit_refresh_cron.sql) used
-- current_setting('app.settings.supabase_url') and
-- current_setting('app.settings.service_role_key'), but those parameters were
-- never set at the database level (verified: NULL), and on Supabase-hosted
-- Postgres, ALTER DATABASE ... SET is not permitted.
--
-- Every Monday run from 2026-03-16 onward returned:
--   ERROR: unrecognized configuration parameter "app.settings.supabase_url"
--
-- Fix: drop the old cron and reschedule with the URL + service role key
-- inlined into the command. The project URL is public; the service role JWT
-- already lives in edge function env vars, so inlining in a cron command (which
-- is only visible to postgres-level roles) is an acceptable trade-off.

SELECT cron.unschedule('weekly-chat-credit-refresh');

SELECT cron.schedule(
  'weekly-chat-credit-refresh',
  '0 8 * * 1',
  $job$
  SELECT net.http_post(
    url := 'https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/refresh-chat-credits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkzMDAzOCwiZXhwIjoyMDg4NTA2MDM4fQ.6Icy7RKDkfCYI5EoUMn1u8kYK1FNVbB9pC46JENbXdo'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $job$
);
