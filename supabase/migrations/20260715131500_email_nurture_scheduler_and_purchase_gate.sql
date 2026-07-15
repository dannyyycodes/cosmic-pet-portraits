-- Go-live blockers #5 (nurture drip buyer-suppression) + #6 (dead nurture scheduler).
--
-- #6  process-email-nurture sent ZERO emails. Its pg_cron job used
--     current_setting('app.settings.supabase_url') / .service_role_key which are
--     NULL on Supabase-hosted Postgres, so the built URL was NULL and every run
--     failed silently. Its Vercel cron (api/cron/email-nurture.ts) was never
--     registered either. Fix: reschedule the pg_cron job with the URL + service
--     role key INLINE (the same proven pattern as jobid 8 weekly-chat-credit-refresh
--     and jobid 12 gelato-worker-tick). Idempotent: cron.schedule() with the same
--     jobname replaces the existing schedule + command.
--
-- #5  The live n8n nurture drip (KKAxJOQ10eXIqzLx) had no purchase suppression:
--     a lead who bought the reading still got the Day-5 "buy the deeper reading"
--     and Day-7 pawtrait sell emails. The drip now calls this RPC before Emails
--     2/3/4 via an HTTP node + IF gate; if the lead already has a paid pet_report
--     the remaining sell emails are skipped. The RPC is SECURITY DEFINER and
--     granted to anon so the n8n HTTP node can call it with the public anon key.
--     Fail-open: the n8n HTTP node uses onError:continueRegularOutput, so a check
--     failure routes to the send branch rather than blocking delivery.

-- ── #5 purchase-check RPC ────────────────────────────────────────────────────
create or replace function public.lead_has_paid_report(p_email text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object('bought', exists (
    select 1 from public.pet_reports
    where lower(email) = lower(trim(coalesce(p_email, '')))
      and payment_status = 'paid'
  ));
$$;

grant execute on function public.lead_has_paid_report(text) to anon, authenticated, service_role;

-- ── #6 fix the dead nurture scheduler (inline url + key, not app.settings) ────
select cron.schedule(
  'email-nurture-processing',
  '*/30 * * * *',
  $CRON$
  select net.http_post(
    url := 'https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/process-email-nurture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkdWlic3lybmVuem9idXlldG1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkzMDAzOCwiZXhwIjoyMDg4NTA2MDM4fQ.6Icy7RKDkfCYI5EoUMn1u8kYK1FNVbB9pC46JENbXdo'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  ) as request_id;
  $CRON$
);
