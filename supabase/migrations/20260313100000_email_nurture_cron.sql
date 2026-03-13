-- Schedule email nurture sequence processing every 30 minutes
-- Handles: welcome sequence, post-purchase drip, re-engagement emails
SELECT cron.schedule(
  'email-nurture-processing',
  '*/30 * * * *',
  $CRON$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/process-email-nurture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $CRON$
);

-- Schedule abandoned cart email checks every 6 hours
SELECT cron.schedule(
  'abandoned-cart-emails',
  '0 */6 * * *',
  $CRON$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-abandoned-cart-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $CRON$
);
