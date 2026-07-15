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
-- Fix: drop the old cron and reschedule. The project URL is public; the service
-- role key is read from Supabase Vault (vault.decrypted_secrets, secret name
-- 'service_role_key') at run time instead of being hardcoded, so no secret lives
-- in git. Bootstrap once per project:
--   select vault.create_secret('<service-role-jwt>', 'service_role_key', 'pg_cron edge-fn auth');

SELECT cron.unschedule('weekly-chat-credit-refresh');

SELECT cron.schedule(
  'weekly-chat-credit-refresh',
  '0 8 * * 1',
  $job$
  SELECT net.http_post(
    url := 'https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/refresh-chat-credits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $job$
);
