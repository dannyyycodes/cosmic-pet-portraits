-- Refund-event audit log on soul_reading_jobs.
-- Appended by /api/shopify/refunds-create when a customer refunds a Soul
-- Reading line item AFTER OpenRouter compute has been spent. Pre-render
-- refunds get status='cancelled_pre_render' (Phase 8 handler logic), so
-- only post-generation refunds land here as audit entries.
-- Idempotency on duplicate webhook deliveries is enforced in the handler:
-- it inspects the JSONB array for an entry matching the incoming event_id
-- before appending. Race-safety relies on Postgres MVCC (single-row updates).

alter table public.soul_reading_jobs
  add column if not exists refund_events jsonb not null default '[]'::jsonb;

comment on column public.soul_reading_jobs.refund_events is
  'Append-only audit log of post-generation refund webhooks for this Soul Reading line. Each entry is { event_id, refund_id, refunded_at, raw }. Pre-render refunds set status=cancelled_pre_render instead.';
