-- Visible log of webhook fulfillment failures, so silent drops stop being silent.
--
-- The Stripe webhook previously logged RPC errors to console only. Console
-- output is not queryable at 2am on a Sunday when a member complains. This
-- table captures the same failures where we can SELECT them.

CREATE TABLE IF NOT EXISTS webhook_failures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  source text NOT NULL,              -- e.g. "stripe-webhook"
  event_type text,                   -- e.g. "chat_credits_topup", "chat_subscription_init"
  stripe_session_id text,
  order_id uuid,
  details jsonb,                     -- full error payload / metadata
  resolved boolean DEFAULT false NOT NULL,
  resolved_at timestamptz,
  resolved_note text
);

CREATE INDEX IF NOT EXISTS idx_webhook_failures_unresolved
  ON webhook_failures (created_at DESC)
  WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_webhook_failures_order
  ON webhook_failures (order_id)
  WHERE order_id IS NOT NULL;

-- Service role only; anon cannot read this (may contain user emails, session ids)
ALTER TABLE webhook_failures ENABLE ROW LEVEL SECURITY;
