-- Move weekly horoscope delivery from Monday to Sunday 9am UTC
-- Subscribers receive their cosmic updates before the week starts
SELECT cron.unschedule('weekly-horoscope-generation');

SELECT cron.schedule(
  'weekly-horoscope-generation',
  '0 9 * * 0',
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
