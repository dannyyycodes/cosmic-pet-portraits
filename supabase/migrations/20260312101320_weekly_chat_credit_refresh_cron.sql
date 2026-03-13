-- Weekly cron job: refresh chat credits for Soul Bond members every Monday at 8:00 AM UTC
-- Runs 1 hour before horoscopes so members get their credits before any new content
SELECT cron.schedule(
  'weekly-chat-credit-refresh',
  '0 8 * * 1',
  $CRON$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/refresh-chat-credits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $CRON$
);
