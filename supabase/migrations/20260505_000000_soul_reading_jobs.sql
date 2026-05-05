-- soul_reading_jobs: state machine for Soul Reading digital fulfilment.
-- Triggered by Shopify orders/paid webhook → /api/shopify/order-paid (Vercel)
-- → n8n trigger (https://n8n.quantumcorehub.net/webhook/generate-report)
-- → existing Deno droplet worker (/opt/littlesouls/worker.ts on 159.65.169.204)
-- which writes the reading back to public.pet_reports.
--
-- Idempotency key: (shopify_event_id, shopify_line_item_id).
-- Shopify can deliver the same webhook multiple times (8 retries / 4 hours per
-- changelog "Updates to webhook retry mechanism"), and one order can in theory
-- contain multiple Soul Reading line items (one per pet). The composite UNIQUE
-- guarantees deterministic dedupe via INSERT ... ON CONFLICT DO NOTHING.
--
-- Source of truth:
--   • [[research-2026-05-04-soul-reading-fulfilment]] §2.5 (idempotency keying)
--   • [[research-2026-05-04-soul-reading-fulfilment]] §3 (schema rationale)
--   • [[launch-plan-2026-05-05]] Phase 5 (SQL skeleton)

CREATE TABLE IF NOT EXISTS public.soul_reading_jobs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_event_id      text NOT NULL,
  shopify_order_id      bigint NOT NULL,
  shopify_line_item_id  bigint NOT NULL,
  customer_email        text NOT NULL,
  pet_name              text NOT NULL CHECK (char_length(pet_name) BETWEEN 1 AND 80),
  pet_dob               date NOT NULL CHECK (
    pet_dob <= current_date
    AND pet_dob >= current_date - interval '60 years'
  ),
  pet_birth_location    text NOT NULL CHECK (char_length(pet_birth_location) BETWEEN 2 AND 200),
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'triggered',
    'generated',
    'delivered',
    'failed',
    'cancelled_pre_render',
    'dry_run'
  )),
  dry_run               boolean NOT NULL DEFAULT false,
  n8n_response          jsonb,
  generated_reading_id  uuid REFERENCES public.pet_reports(id) ON DELETE SET NULL,
  error_text            text,
  attempts              smallint NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shopify_event_id, shopify_line_item_id)
);

CREATE INDEX IF NOT EXISTS soul_reading_jobs_status_created_idx
  ON public.soul_reading_jobs (status, created_at);

CREATE INDEX IF NOT EXISTS soul_reading_jobs_order_idx
  ON public.soul_reading_jobs (shopify_order_id);

-- Reconciliation cron (Vercel, every 10 min) scans status='pending' rows older
-- than 2 minutes and re-fires the n8n trigger. Partial index keeps the scan cheap.
CREATE INDEX IF NOT EXISTS soul_reading_jobs_pending_partial_idx
  ON public.soul_reading_jobs (created_at)
  WHERE status = 'pending';

-- updated_at autoset on UPDATE
CREATE OR REPLACE FUNCTION public.tg_soul_reading_jobs_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS soul_reading_jobs_set_updated_at ON public.soul_reading_jobs;
CREATE TRIGGER soul_reading_jobs_set_updated_at
  BEFORE UPDATE ON public.soul_reading_jobs
  FOR EACH ROW EXECUTE FUNCTION public.tg_soul_reading_jobs_set_updated_at();

-- RLS: service_role only — no client access at all. Webhook handler runs
-- with the service-role key. Customers never see this table directly; they
-- view their reading via /reading/<token> which proxies through pet_reports.
-- RLS-enabled with no policies = denied for everyone except bypass roles
-- (service_role uses BYPASSRLS by default in Supabase).
ALTER TABLE public.soul_reading_jobs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.soul_reading_jobs IS
  'Idempotency + state for Soul Reading digital fulfilment. Triggered by Shopify orders/paid → /api/shopify/order-paid → n8n trigger → droplet worker. Keyed by (shopify_event_id, shopify_line_item_id) so Shopify webhook retries are safe. generated_reading_id FKs to public.pet_reports once the worker finishes.';

COMMENT ON COLUMN public.soul_reading_jobs.shopify_event_id IS
  'X-Shopify-Webhook-Id header value — Shopify''s canonical idempotency key per dev-docs "Ignore duplicate webhooks".';
COMMENT ON COLUMN public.soul_reading_jobs.dry_run IS
  'TRUE when Shopify order.test === true. Worker is NOT triggered for dry-run rows; status is set to "dry_run".';
COMMENT ON COLUMN public.soul_reading_jobs.generated_reading_id IS
  'FK to public.pet_reports(id). Populated by the droplet worker once the reading is generated. NULL until then.';
