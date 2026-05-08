-- Print fulfillment + Gelato webhook + pawtrait touchpoints
--
-- Adds the canonical print-order ledger that Phase 9 (Gelato fulfillment)
-- writes on every paid Shopify order with a canvas line item, plus the
-- companion alert table fed by failures, the dedupe table for inbound Gelato
-- webhooks, and the pawtrait_touchpoints table that the inbound webhook
-- inserts into on shipped/delivered events.
--
-- Background — historically the orders/paid webhook SKIPPED canvas line items
-- and relied on the Shopify Gelato app to fulfill them. That meant a customer
-- could be charged today and have nothing print and no audit row in our DB.
-- This migration plus the matching webhook code in api/shopify.ts wires the
-- Gelato submission EXPLICITLY and persists every attempt.
--
-- Schema rationale:
--   - print_orders: 1 row per canvas line item per Shopify order; UNIQUE on
--     shopify_order_id + shopify_line_item_id so retries are idempotent.
--   - print_order_alerts: append-only audit of failures; severity drives
--     Telegram-vs-silent triage; acknowledged_at lets ops mark dismissed.
--   - gelato_webhook_events: dedupe by Gelato's event_id so we never
--     double-process a webhook on retry.
--   - pawtrait_touchpoints: mirrors memorial_touchpoints shape so the same
--     send-X-touchpoint pattern can be reused. Created IF NOT EXISTS — Agent D
--     may also be creating this table; both definitions must agree.

-- ─── print_orders ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.print_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shopify identifiers — composite key for idempotent inserts.
  shopify_order_id text NOT NULL,
  shopify_line_item_id text,

  -- Gelato identifiers — populated after a successful submission.
  gelato_order_id text,
  gelato_order_reference text,

  -- Owner of the Pawtrait (Supabase auth user). Nullable: guest/TikTok-Shop
  -- orders may not have a user_id at fulfillment time.
  user_id uuid,

  -- Canvas SKU (e.g. '16x20__black') and customer-facing label.
  sku text,
  size_key text,
  frame_color text,

  -- Source artwork URL the print master is built from. Either the customer's
  -- chosen variant URL or a regenerated print master from handlePrintMaster.
  source_image_url text,
  print_master_url text,

  -- Lifecycle:
  --   pending          — row inserted, no Gelato submit attempted yet
  --   submitted        — Gelato accepted the order
  --   printed          — Gelato status webhook reported printed
  --   shipped          — Gelato dispatched + tracking available
  --   delivered        — final state for happy path
  --   failed           — terminal failure (4xx, no retry)
  --   manual_review    — pre-flight failed twice; human must intervene
  --   canceled         — refunded/cancelled
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'submitted',
      'printed',
      'shipped',
      'delivered',
      'failed',
      'manual_review',
      'canceled'
    )),

  -- Number of submit attempts. Used by future retry cron.
  attempts integer NOT NULL DEFAULT 0,
  last_error text,

  -- Free-form payload for the most recent Gelato submission/response. JSON
  -- so we can replay or debug without round-tripping Shopify.
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- One row per canvas line per order. Idempotency key for the webhook insert.
CREATE UNIQUE INDEX IF NOT EXISTS uq_print_orders_shopify_line
  ON public.print_orders (shopify_order_id, shopify_line_item_id);

-- Lookups for cron + admin views.
CREATE INDEX IF NOT EXISTS idx_print_orders_status_created
  ON public.print_orders (status, created_at);

CREATE INDEX IF NOT EXISTS idx_print_orders_gelato_id
  ON public.print_orders (gelato_order_id)
  WHERE gelato_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_print_orders_user
  ON public.print_orders (user_id)
  WHERE user_id IS NOT NULL;

-- updated_at trigger (mirrors memorial_touchpoints pattern)
CREATE OR REPLACE FUNCTION public.set_print_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_print_orders_updated_at ON public.print_orders;
CREATE TRIGGER trg_print_orders_updated_at
  BEFORE UPDATE ON public.print_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_print_orders_updated_at();

ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;
-- No policy = default deny for anon + authenticated. Service role bypasses RLS.

COMMENT ON TABLE public.print_orders IS
  'Canonical ledger of every canvas print fulfillment. One row per Shopify line item. Webhook-driven; do not edit by hand.';

-- ─── print_order_alerts ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.print_order_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  print_order_id uuid REFERENCES public.print_orders(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high')),
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_print_order_alerts_print_order
  ON public.print_order_alerts (print_order_id);

CREATE INDEX IF NOT EXISTS idx_print_order_alerts_unacked
  ON public.print_order_alerts (created_at DESC)
  WHERE acknowledged_at IS NULL;

ALTER TABLE public.print_order_alerts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.print_order_alerts IS
  'Append-only alert log for print pipeline failures. severity=high triggers Telegram on insert.';

-- ─── gelato_webhook_events (dedupe) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gelato_webhook_events (
  event_id text PRIMARY KEY,
  event_name text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb
);

COMMENT ON TABLE public.gelato_webhook_events IS
  'Idempotency log for inbound Gelato webhooks. PK on event_id ensures double-deliveries are no-ops.';

ALTER TABLE public.gelato_webhook_events ENABLE ROW LEVEL SECURITY;

-- ─── pawtrait_touchpoints ──────────────────────────────────────────────────
-- Mirrors memorial_touchpoints. Print fulfillment inserts shipped/delivered
-- rows that the email sender (process-email-nurture or sibling) emails out.
-- Created IF NOT EXISTS — Agent D may be creating it in parallel; both
-- definitions must match this shape.

CREATE TABLE IF NOT EXISTS public.pawtrait_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Optional FK to print_orders (only set for shipped/delivered driven by
  -- Gelato webhook). Other touchpoint sources may set print_order_id NULL
  -- and rely on user_id + metadata.
  print_order_id uuid REFERENCES public.print_orders(id) ON DELETE CASCADE,

  -- Owner who receives the email.
  user_id uuid,

  -- Touchpoint variant — same string convention as memorial_touchpoints.
  touchpoint_type text NOT NULL
    CHECK (touchpoint_type IN (
      'shipped',
      'delivered',
      'unboxing_followup',
      'review_request',
      'reorder_nudge'
    )),

  -- Send time. now() = send asap.
  scheduled_for timestamptz NOT NULL,

  -- Set when sent.
  sent_at timestamptz,

  -- Denormalised for the sender's convenience.
  email text,
  pet_name text,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pawtrait_touchpoints_pending
  ON public.pawtrait_touchpoints (scheduled_for)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pawtrait_touchpoints_print_order
  ON public.pawtrait_touchpoints (print_order_id)
  WHERE print_order_id IS NOT NULL;

-- Idempotency: at most one row per (print_order, touchpoint_type) so a Gelato
-- replay of the same shipped event doesn't duplicate the customer email.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pawtrait_touchpoints_print_order_type
  ON public.pawtrait_touchpoints (print_order_id, touchpoint_type)
  WHERE print_order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_pawtrait_touchpoints_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pawtrait_touchpoints_updated_at
  ON public.pawtrait_touchpoints;
CREATE TRIGGER trg_pawtrait_touchpoints_updated_at
  BEFORE UPDATE ON public.pawtrait_touchpoints
  FOR EACH ROW EXECUTE FUNCTION public.set_pawtrait_touchpoints_updated_at();

ALTER TABLE public.pawtrait_touchpoints ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.pawtrait_touchpoints IS
  'Scheduled customer touchpoints for canvas/pawtrait fulfillment (shipped, delivered, follow-up). Sender reads where sent_at IS NULL AND scheduled_for <= now().';
