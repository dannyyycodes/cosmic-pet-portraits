-- Pawtrait email lifecycle — schema additions
--
-- Extends the existing email infrastructure (built for soul readings) to
-- handle the pawtraits canvas product line. Adds:
--
--   1. email_subscribers.product_line — partitions subscribers between
--      'reading' (existing soul-reading flow), 'portrait' (new canvas/print
--      flow), and 'memorial' (already-special memorial flow). The dispatcher
--      in process-email-nurture branches on this column so canvas customers
--      never receive reading-shaped copy and vice versa.
--
--   2. pawtrait_touchpoints — scheduling table mirroring memorial_touchpoints
--      shape. Stores rows for purchase confirmation, shipping milestones,
--      UGC reorder nudges, win-back, and sub-save campaigns. Sender (the
--      extended process-email-nurture function) reads where sent_at IS NULL
--      AND scheduled_for <= now() and emails + marks them sent.
--
-- All inserts/alters are idempotent — safe to re-run, safe to interleave
-- with Agent A's gelato-webhook migration (which also creates this table
-- with CREATE TABLE IF NOT EXISTS).

-- ─── 1. email_subscribers product_line column ──────────────────────────────

ALTER TABLE public.email_subscribers
  ADD COLUMN IF NOT EXISTS product_line text NOT NULL DEFAULT 'reading';

-- Add the CHECK constraint separately so a partially-applied prior run
-- doesn't error on duplicate-constraint.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_subscribers_product_line_check'
  ) THEN
    ALTER TABLE public.email_subscribers
      ADD CONSTRAINT email_subscribers_product_line_check
      CHECK (product_line IN ('reading', 'portrait', 'memorial'));
  END IF;
END $$;

-- Defensive backfill — any pre-existing rows that somehow ended up with
-- NULL get the soul-reading default (safe, since the column existed only
-- for reading-product subscribers before this migration).
UPDATE public.email_subscribers
   SET product_line = 'reading'
 WHERE product_line IS NULL;

-- Fast-path index for the dispatcher's most common query
-- (`WHERE journey_stage = ? AND product_line = ?`).
CREATE INDEX IF NOT EXISTS idx_email_subscribers_product_line
  ON public.email_subscribers (product_line);

COMMENT ON COLUMN public.email_subscribers.product_line IS
  'Which product brand-line this subscriber belongs to. Drives campaign dispatch in process-email-nurture so reading vs portrait vs memorial customers never receive each other''s copy.';

-- ─── 2. pawtrait_touchpoints table ─────────────────────────────────────────
--
-- Shape mirrors memorial_touchpoints (migration 20260417000000) so the
-- existing sender pattern carries over. Key differences from the memorial
-- table:
--   • account_id (auth.users) replaces report_id — pawtrait is account-keyed,
--     not pet-report-keyed. May be NULL for guest checkouts (we still want
--     to drive shipping touchpoints by email alone in that case).
--   • email is required — every row must be sendable.
--   • touchpoint_type covers the full canvas lifecycle (welcome → purchase
--     → shipping → reorder/winback/save).

CREATE TABLE IF NOT EXISTS public.pawtrait_touchpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner. May be NULL when triggered pre-signup or for guest checkouts.
  account_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sender requires this — rows without an email are unsendable.
  email text NOT NULL,

  -- Pet name for personalisation. Fall back to "your pet" in the email
  -- template when missing.
  pet_name text,

  -- Which touchpoint this row represents. Locked vocabulary; sender + admin
  -- UI rely on these exact values.
  touchpoint_type text NOT NULL
    CHECK (touchpoint_type IN (
      'welcome_1',
      'welcome_2',
      'welcome_3',
      'abandoned_cart',
      'purchase_confirm',
      'shipped',
      'delivered',
      'ugc_reorder',
      'winback_30',
      'winback_60',
      'winback_90',
      'sub_save'
    )),

  -- Sender picks rows where status='pending' AND scheduled_for <= now().
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'skipped', 'error')),

  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,

  -- Free-form payload — sender pulls portrait_image_url, order_id, tracking
  -- numbers, etc. from here when composing the email.
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cron-tick path: "what's due to send right now?"
CREATE INDEX IF NOT EXISTS idx_pawtrait_touchpoints_due
  ON public.pawtrait_touchpoints (scheduled_for, status);

-- Admin / audit path: "show this account's touchpoint history".
CREATE INDEX IF NOT EXISTS idx_pawtrait_touchpoints_account
  ON public.pawtrait_touchpoints (account_id);

-- Updated-at trigger (mirrors memorial_touchpoints pattern).
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

-- RLS: service-role only. No anon/authenticated policy = default deny.
ALTER TABLE public.pawtrait_touchpoints ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.pawtrait_touchpoints IS
  'Scheduled lifecycle emails for pawtrait canvas customers (welcome, purchase, shipping, reorder, winback, sub-save). Sender reads where status=''pending'' AND scheduled_for <= now().';
