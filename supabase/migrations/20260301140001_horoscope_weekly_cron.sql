-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Weekly cron job: generate horoscopes every Monday at 9:00 AM UTC
SELECT cron.schedule(
  'weekly-horoscope-generation',
  '0 9 * * 1',
  $CRON$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-weekly-horoscopes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $CRON$
);
