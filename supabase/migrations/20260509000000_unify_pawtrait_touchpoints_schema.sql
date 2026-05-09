-- Unify pawtrait_touchpoints schema (silent-email-failure fix)
--
-- BACKGROUND
-- Two earlier migrations both `CREATE TABLE IF NOT EXISTS public.pawtrait_touchpoints`:
--   • 20260508120000_pawtrait_email_lifecycle.sql   ← lex-sorts FIRST, wins
--       columns: account_id (FK auth.users CASCADE), email, pet_name, touchpoint_type
--                (CHECK = unprefixed lifecycle vocab), status (default 'pending'),
--                scheduled_for, sent_at, metadata
--   • 20260508_120000_print_orders_and_pawtrait_touchpoints.sql ← runs second, no-ops
--       columns: print_order_id (FK print_orders CASCADE), user_id, touchpoint_type
--                (CHECK = different vocab), scheduled_for, sent_at, email, pet_name,
--                metadata
--
-- The print-orders migration's `CREATE INDEX uq_pawtrait_touchpoints_print_order_type`
-- silently fails (column print_order_id doesn't exist on the lifecycle-shaped table).
-- Then in code:
--   • api/_lib/printOrdersRepo.ts writes `print_order_id` + `user_id` → column-not-found
--     → every Gelato shipped/delivered insert silently fails (caught + swallowed)
--   • api/stripe/webhook.ts writes `pawtrait_*`-prefixed touchpoint_type → CHECK fails
--     → every canvas-checkout post-purchase email schedule silently fails
-- Net effect today: paying customers get only the initial Stripe receipt email; no
-- shipping email, no delivery email, no UGC nudge, no winback ever sends.
--
-- THIS MIGRATION
-- Brings the live table to the union schema both writers expect, expands the CHECK
-- to accept BOTH the lifecycle's unprefixed vocab AND the Stripe webhook's
-- pawtrait_*-prefixed vocab (the dispatcher in process-email-nurture already
-- normalises both to the prefixed form for template lookup), and creates the
-- missing print_order_id index that idempotency depends on.
--
-- Also flips account_id's CASCADE to SET NULL so we don't lose the audit trail
-- of emails owed when a user deletes their account.
--
-- Idempotent — safe to re-run.

-- ─── 1. Add print_order_id column expected by printOrdersRepo.ts ───────────
ALTER TABLE public.pawtrait_touchpoints
  ADD COLUMN IF NOT EXISTS print_order_id uuid;

-- Add the FK separately so a partially-applied prior run doesn't error.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.pawtrait_touchpoints'::regclass
       AND conname = 'pawtrait_touchpoints_print_order_id_fkey'
  ) THEN
    ALTER TABLE public.pawtrait_touchpoints
      ADD CONSTRAINT pawtrait_touchpoints_print_order_id_fkey
      FOREIGN KEY (print_order_id) REFERENCES public.print_orders(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 2. Soften account_id FK from CASCADE → SET NULL ───────────────────────
-- Cascade-deleting touchpoints when a user deletes their account would erase
-- the audit trail of emails we still owed for prints already paid for.
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT conname INTO fk_name
    FROM pg_constraint
   WHERE conrelid = 'public.pawtrait_touchpoints'::regclass
     AND confrelid = 'auth.users'::regclass
     AND contype = 'f'
   LIMIT 1;
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.pawtrait_touchpoints DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE public.pawtrait_touchpoints
  ADD CONSTRAINT pawtrait_touchpoints_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- ─── 3. Expand CHECK to accept the union of writer vocabularies ────────────
-- Writers emit either prefixed (`pawtrait_*` from api/stripe/webhook.ts) or
-- unprefixed (`shipped`, `delivered`, `unboxing_followup`, etc. from
-- printOrdersRepo / Gelato webhook). The dispatcher in
-- supabase/functions/process-email-nurture/index.ts:875 normalises both to the
-- prefixed form for template lookup, so either is functionally correct.
-- Accepting both at the table layer means we don't have to rewrite history.
ALTER TABLE public.pawtrait_touchpoints
  DROP CONSTRAINT IF EXISTS pawtrait_touchpoints_touchpoint_type_check;

ALTER TABLE public.pawtrait_touchpoints
  ADD CONSTRAINT pawtrait_touchpoints_touchpoint_type_check
  CHECK (touchpoint_type IN (
    -- Lifecycle (unprefixed)
    'welcome_1', 'welcome_2', 'welcome_3',
    'abandoned_cart',
    'purchase_confirm',
    'shipped', 'delivered',
    'ugc_reorder',
    'winback_30', 'winback_60', 'winback_90',
    'sub_save',
    -- Print-orders / Gelato (unprefixed)
    'unboxing_followup',
    'review_request',
    'reorder_nudge',
    -- Stripe webhook (pawtrait_*-prefixed)
    'pawtrait_welcome_1', 'pawtrait_welcome_2', 'pawtrait_welcome_3',
    'pawtrait_abandoned_cart',
    'pawtrait_purchase_confirm',
    'pawtrait_shipped', 'pawtrait_delivered',
    'pawtrait_ugc_reorder',
    'pawtrait_winback_30', 'pawtrait_winback_60', 'pawtrait_winback_90',
    'pawtrait_sub_save',
    'pawtrait_unboxing_followup',
    'pawtrait_review_request',
    'pawtrait_reorder_nudge'
  ));

-- ─── 4. Indexes the print-orders migration tried (and failed) to create ────
CREATE INDEX IF NOT EXISTS idx_pawtrait_touchpoints_print_order
  ON public.pawtrait_touchpoints (print_order_id)
  WHERE print_order_id IS NOT NULL;

-- Idempotency: at most one row per (print_order, touchpoint_type). Stops a
-- Gelato webhook replay from emailing the same shipping notification twice.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pawtrait_touchpoints_print_order_type
  ON public.pawtrait_touchpoints (print_order_id, touchpoint_type)
  WHERE print_order_id IS NOT NULL;

COMMENT ON CONSTRAINT pawtrait_touchpoints_touchpoint_type_check
  ON public.pawtrait_touchpoints IS
  'Accepts both unprefixed (Gelato/lifecycle) and pawtrait_*-prefixed (Stripe webhook) vocabularies. Dispatcher normalises to prefixed for template lookup.';
