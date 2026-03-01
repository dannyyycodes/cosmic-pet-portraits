-- Weekly cron job: fire generate-weekly-horoscopes every Monday at 9:00 AM UTC
SELECT cron.schedule(
  'weekly-horoscope-generation',
  '0 9 * * 1',  -- Every Monday at 09:00 UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-weekly-horoscopes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
